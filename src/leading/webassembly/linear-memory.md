# WASM 线性内存模型

## 内存模型基础概念

WebAssembly 采用线性内存模型，这是一种简单而高效的连续字节数组设计。与传统的分段内存模型不同，线性内存提供统一的地址空间，简化了内存管理和安全验证。

**核心内存架构：**
```
线性地址空间: 0x00000000 → 0xFFFFFFFF (4GB)
    ├── 代码和数据段 (只读/初始化)
    ├── 堆区域 (动态分配)
    ├── 栈区域 (函数调用)
    └── 未分配区域
```

## 内存定义与初始化

### 内存类型定义

在 WebAssembly 模块中，内存通过内存段进行声明和配置。

**内存类型结构：**
```
内存标志:
  0x00 → 仅初始大小
  0x01 → 初始大小 + 最大大小
  
初始页数: N (1页 = 64KiB = 65536字节)
最大页数: M (如果标志为0x01)
```

**Wat 文本格式示例：**
```wat
(memory 1)           ; 1页初始内存 (64KiB)
(memory 1 4)         ; 1页初始，最大4页 (256KiB)
(memory (import "env" "mem") 1)  ; 导入外部内存
```

### 数据段初始化

数据段用于在模块实例化时初始化内存内容。

**数据段结构：**
```
数据段头部
├── 内存索引 (通常为0)
├── 偏移量表达式
└── 原始字节数据
```

**初始化示例：**
```wat
;; 静态数据初始化
(data (i32.const 0x1000) "Hello, WebAssembly!\00")
(data (i32.const 0x2000) "\01\02\03\04\05\06")  ; 二进制数据

;; 通过全局变量计算偏移量
(global $data_offset i32 (i32.const 0x3000))
(data (global.get $data_offset) "Dynamic offset data")
```

## 内存访问指令

### 加载指令族

加载指令从内存读取数据到操作数栈，支持多种数据类型和寻址模式。

**基本加载指令：**
```
i32.load [offset] [align]   ; 32位整数加载
i64.load [offset] [align]   ; 64位整数加载  
f32.load [offset] [align]   ; 32位浮点数加载
f64.load [offset] [align]   ; 64位浮点数加载
```

**扩展加载指令：**
```
i32.load8_s   ; 有符号8位加载到32位
i32.load8_u   ; 无符号8位加载到32位
i64.load16_s  ; 有符号16位加载到64位
i64.load32_u  ; 无符号32位加载到64位
```

**内存访问语义：**
```
有效地址 = base_address + offset
对齐要求 = 2^align 字节边界
边界检查: 确保 [地址, 地址+类型大小) 在内存有效范围内
```

### 存储指令族

存储指令将数据从操作数栈写入内存。

**基本存储指令：**
```
i32.store [offset] [align]   ; 32位整数存储
i64.store [offset] [align]   ; 64位整数存储
f32.store [offset] [align]   ; 32位浮点数存储  
f64.store [offset] [align]   ; 64位浮点数存储
```

**扩展存储指令：**
```
i32.store8   ; 8位截断存储
i32.store16  ; 16位截断存储
i64.store8   ; 8位截断存储到64位
i64.store16  ; 16位截断存储到64位
i64.store32  ; 32位截断存储到64位
```

### 内存访问示例

```wat
;; 内存读写操作示例
(func $memory_ops
  ;; 写入字符串到内存
  (i32.store (i32.const 0x1000) (i32.const 0x48656C6C))  ; "Hell"
  (i32.store (i32.const 0x1004) (i32.const 0x6F210000))  ; "o!\0\0"
  
  ;; 读取并修改数据
  (local $value i32)
  (local.set $value (i32.load (i32.const 0x1000)))
  (i32.store (i32.const 0x1008) 
    (i32.add (local.get $value) (i32.const 0x00000001)))
)
```

## 内存管理与增长

### 动态内存增长

WebAssembly 内存可以在运行时动态增长，以适应数据量的变化。

**内存增长指令：**
```
memory.grow $pages  ; 尝试增加指定页数
                    ; 返回旧内存大小，失败返回-1
memory.size         ; 返回当前内存大小（页数）
```

**增长策略示例：**
```wat
;; 安全的内存分配函数
(func $allocate_memory (param $size i32) (result i32)
  (local $current_pages i32)
  (local $required_pages i32)
  (local $old_pages i32)
  
  ;; 计算所需页数
  (local.set $current_pages (memory.size))
  (local.set $required_pages 
    (i32.div_u 
      (i32.add (local.get $size) (i32.const 65535))
      (i32.const 65536)))
  
  ;; 检查是否需要增长
  (if (i32.gt_u (local.get $required_pages) (local.get $current_pages))
    (then
      (local.set $old_pages
        (memory.grow 
          (i32.sub (local.get $required_pages) (local.get $current_pages))))
      (if (i32.eq (local.get $old_pages) (i32.const -1))
        (then
          (unreachable)  ;; 内存增长失败
        )
      )
    )
  )
  
  ;; 返回分配区域的起始偏移量
  (i32.mul (local.get $current_pages) (i32.const 65536))
)
```

### 内存边界保护

所有内存访问都受到严格的边界检查保护。

**访问验证流程：**
```
指令: i32.load offset=4 align=2
地址计算: base + 4
边界检查: [地址, 地址+4) 必须在 [0, 当前内存大小) 范围内
对齐检查: 地址必须满足 2^2 = 4 字节对齐
```

## 内存布局模式

### 典型应用布局

**结构化内存组织：**
```
0x00000000 ┌─────────────────┐
          │   代码和数据段   │ ← 静态初始化
0x00001000 ├─────────────────┤
          │     堆起始      │
          │                 │
          │   动态分配区域   │ → 运行时增长
          │                 │
0x00080000 ├─────────────────┤
          │     栈顶        │ ← 栈向下生长
          │     ...         │
          │     栈底        │
          └─────────────────┘
```

### 数据对齐策略

合理的内存对齐可以显著提升访问性能。

**数据类型对齐要求：**
```
数据类型  大小  推荐对齐
i8        1    1字节
i16       2    2字节  
i32       4    4字节
i64       8    8字节
f32       4    4字节
f64       8    8字节
```

**结构体布局示例：**
```wat
;; C结构体等效布局:
;; struct Point { float x, y; int id; };
;; 总大小: 12字节，对齐: 4字节

(data (i32.const 0x1000) 
  "\00\00\00\00"  ;; x: f32 = 0.0 (偏移0)
  "\00\00\80\3F"  ;; y: f32 = 1.0 (偏移4) 
  "\01\00\00\00"  ;; id: i32 = 1 (偏移8)
)
```

## 批量内存操作

### 内存初始化与复制

WebAssembly 提供高效的批量内存操作指令。

**内存初始化：**
```
memory.init $segment_index  ; 从数据段初始化内存区域
参数: [dest, source, size]
```

**内存复制：**
```
memory.copy  ; 内存区域间复制
参数: [dest, src, size]
```

**内存填充：**
```
memory.fill  ; 用指定值填充内存区域  
参数: [dest, value, size]
```

### 批量操作示例

```wat
;; 高效内存操作示例
(func $init_data_structures
  ;; 从数据段初始化
  (memory.init 0
    (i32.const 0x2000)  ;; 目标地址
    (i32.const 0)       ;; 源偏移量
    (i32.const 1024))   ;; 大小
  
  ;; 复制配置数据
  (memory.copy
    (i32.const 0x3000)  ;; 目标
    (i32.const 0x2000)  ;; 源
    (i32.const 512))    ;; 大小
  
  ;; 填充缓冲区为零
  (memory.fill
    (i32.const 0x4000)  ;; 目标
    (i32.const 0)       ;; 填充值
    (i32.const 256))    ;; 大小
)
```

## 跨语言内存交互

### JavaScript 内存共享

WebAssembly 内存可以通过 JavaScript API 与宿主环境共享。

**内存创建与共享：**
```javascript
// 在 JavaScript 中创建内存
const memory = new WebAssembly.Memory({
  initial: 256,    // 初始256页 (16MB)
  maximum: 65536,  // 最大65536页 (4GB)
  shared: true     // 是否共享内存（用于多线程）
});

// 访问内存内容
const uint8View = new Uint8Array(memory.buffer);
const uint32View = new Uint32Array(memory.buffer);
const float64View = new Float64Array(memory.buffer);

// 写入数据到 WASM 内存
uint8View.set([0x48, 0x65, 0x6C, 0x6C, 0x6F], 0x1000); // "Hello"

// 从 WASM 内存读取数据
const message = new TextDecoder().decode(
  new Uint8Array(memory.buffer, 0x1000, 5)
);
```

### 高效数据交换策略

**零拷贝数据传递：**
```javascript
// JavaScript 到 WASM 的高效数据传输
function transferDataToWasm(memory, data, offset) {
  const view = new Uint8Array(memory.buffer);
  
  if (data instanceof ArrayBuffer) {
    // 直接复制 ArrayBuffer
    view.set(new Uint8Array(data), offset);
  } else if (typeof data === 'string') {
    // 字符串编码后复制
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);
    view.set(encoded, offset);
    view[offset + encoded.length] = 0; // null终止符
  }
  
  return offset;
}

// WASM 到 JavaScript 的高效数据读取
function readStringFromWasm(memory, offset, maxLength = 256) {
  const view = new Uint8Array(memory.buffer);
  let length = 0;
  
  // 查找null终止符
  while (length < maxLength && view[offset + length] !== 0) {
    length++;
  }
  
  return new TextDecoder().decode(
    new Uint8Array(memory.buffer, offset, length)
  );
}
```

## 内存安全与隔离

### 沙箱内存保护

WebAssembly 的线性内存模型天然提供内存隔离保护。

**安全边界：**
```
WASM 实例内存
    ↓
独立地址空间 ← 无法访问宿主或其他实例内存
    ↓
所有访问经过边界检查
    ↓
无野指针或越界访问
```

### 边界检查优化

现代 WASM 运行时采用高效的边界检查策略。

**检查优化技术：**
```
静态边界分析 → 消除冗余检查
保护页技术 → 利用硬件内存保护
JIT 编译优化 → 内联检查代码
```

## 性能优化实践

### 内存访问模式优化

**顺序访问模式：**
```wat
;; 高效: 顺序访问，利于预取
(func $sum_array (param $ptr i32) (param $len i32) (result i32)
  (local $sum i32)
  (local $i i32)
  
  (loop $loop
    (local.set $sum
      (i32.add
        (local.get $sum)
        (i32.load (i32.add (local.get $ptr) (i32.mul (local.get $i) (i32.const 4))))))
    (local.set $i (i32.add (local.get $i) (i32.const 1)))
    (br_if $loop (i32.lt_u (local.get $i) (local.get $len)))
  )
  (local.get $sum)
)
```

### 数据局部性利用

**缓存友好布局：**
```
结构数组布局 (SoA):
[所有x坐标] [所有y坐标] [所有z坐标]

数组结构布局 (AoS):
[x1,y1,z1] [x2,y2,z2] [x3,y3,z3]

选择策略:
顺序处理 → SoA (缓存友好)
随机访问 → AoS (数据局部性)
```

通过深入理解和优化 WebAssembly 线性内存模型的使用，开发者可以构建出既安全又高性能的应用程序，充分发挥 WASM 在现代计算环境中的潜力。