# WASM 线程、SIMD 与异常处理

## 并发执行模型

WebAssembly 线程提案为 WASM 引入了真正的并行计算能力，通过共享内存和原子操作实现多线程编程。这种模型基于 Web Workers 和 SharedArrayBuffer，提供了高效的线程间通信机制。

**线程架构示意图：**
```
主线程 → 创建 Worker → 实例化 WASM 模块
    ↓ 共享内存
工作线程 ← 访问相同内存 ← 原子操作同步
    ↓
并行执行 + 数据共享
```

## 线程模型实现

### 共享线性内存

线程间通过共享的线性内存进行通信，所有线程访问相同的 Memory 对象。

**内存共享配置：**
```javascript
// 在主线程中创建共享内存
const memory = new WebAssembly.Memory({
  initial: 10,
  maximum: 100,
  shared: true  // 启用共享内存
});

// 在线程间传递相同的内存引用
const worker = new Worker('worker.js');
worker.postMessage({ memory });
```

### 原子操作指令

WASM 提供了一套完整的原子操作指令，确保多线程环境下的数据一致性。

**原子指令分类：**
```
原子加载: i32.atomic.load, i64.atomic.load
原子存储: i32.atomic.store, i64.atomic.store  
原子读-修改-写: i32.atomic.rmw.add, i64.atomic.rmw.xor
原子比较交换: i32.atomic.rmw.cmpxchg
```

#### 原子操作示例

```wat
;; 多线程计数器实现
(module
  (memory 1 1 shared)  ;; 共享内存
  
  (global $counter (mut i32) (i32.const 0))
  
  ;; 线程安全的计数器递增
  (func $increment_counter (result i32)
    (loop $spin
      ;; 加载当前值
      (local.set $current (i32.atomic.load (i32.const 0)))
      
      ;; 尝试原子比较交换
      (i32.atomic.rmw.cmpxchg
        (i32.const 0)           ;; 内存地址
        (local.get $current)    ;; 期望值
        (i32.add (local.get $current) (i32.const 1)) ;; 新值
      )
      
      ;; 检查是否成功，否则重试
      (if (i32.ne (local.get $current))
        (then (br $spin))
      )
    )
    (i32.add (local.get $current) (i32.const 1))
  )
)
```

### 线程间同步

除了原子操作，WASM 还提供了更高级的同步原语。

**等待和通知操作：**
```
atomic.notify - 唤醒等待的线程
atomic.wait - 使线程等待，直到被唤醒
```

#### 生产者-消费者模式

```wat
;; 生产者-消费者缓冲区
(module
  (memory 1 1 shared)
  
  (data (i32.const 0) "\00\00\00\00")  ;; 缓冲区计数
  (data (i32.const 4) "\00\00\00\00")  ;; 缓冲区数据...
  
  (func $produce (param $data i32)
    (loop $wait
      ;; 检查缓冲区是否有空间
      (if (i32.eq (i32.atomic.load (i32.const 0)) (i32.const 1024))
        (then
          ;; 等待消费者释放空间
          (atomic.wait (i32.const 0) (i32.const 1024) (i64.const -1))
          (br $wait)
        )
      )
    )
    
    ;; 生产数据
    ;; ... 数据写入逻辑
    
    ;; 增加计数并通知消费者
    (i32.atomic.store (i32.const 0) 
      (i32.add (i32.atomic.load (i32.const 0)) (i32.const 1)))
    (atomic.notify (i32.const 0) (i32.const 1))
  )
)
```

## SIMD 向量处理

### SIMD 基础概念

单指令多数据 (SIMD) 允许在单个指令中处理多个数据元素，显著提升数据并行任务的性能。

**SIMD 操作示意图：**
```
标量处理: [A1] [A2] [A3] [A4] → 4次加法操作
    ↓
SIMD 处理: [A1, A2, A3, A4] → 1次向量加法
```

### WASM SIMD 指令集

WASM SIMD 提供 128 位向量操作，支持多种数据类型和操作模式。

**向量类型：**
```
v128 - 128位向量类型
支持的数据格式:
  i8x16 - 16个8位整数
  i16x8 - 8个16位整数  
  i32x4 - 4个32位整数
  i64x2 - 2个64位整数
  f32x4 - 4个32位浮点数
  f64x2 - 2个64位浮点数
```

#### SIMD 操作分类

**算术运算：**
```
i8x16.add, i16x8.mul, f32x4.div
```

**比较运算：**
```
i32x4.eq, f64x2.gt, i8x16.lt_s
```

**位运算：**
```
v128.and, v128.or, v128.xor, v128.not
```

**移位运算：**
```
i16x8.shl, i32x4.shr_u, i64x2.shr_s
```

**数据重排：**
```
i8x16.shuffle, v128.swizzle
```

### SIMD 实战示例

#### 图像处理优化

```wat
;; SIMD 加速的图像灰度化
(module
  (memory 1)
  
  (func $grayscale_simd (param $pixels i32) (param $count i32)
    (local $i i32)
    (local $vector v128)
    
    (loop $process
      ;; 一次处理4个像素 (16字节)
      (local.set $vector (v128.load (local.get $pixels)))
      
      ;; 提取RGB分量并计算灰度
      ;; R * 0.299 + G * 0.587 + B * 0.114
      (local.set $vector
        (f32x4.mul
          (f32x4.add
            (f32x4.mul
              (f32x4.convert_i32x4_u (i32x4.extend_low_i16x8_u (i16x8.extend_low_i8x16_u (local.get $vector))))
              (f32x4.splat (f32.const 0.299))
            )
            (f32x4.mul
              (f32x4.convert_i32x4_u (i32x4.extend_low_i16x8_u (i16x8.extend_high_i8x16_u (local.get $vector))))
              (f32x4.splat (f32.const 0.587))
            )
          )
          ;; ... 继续处理B分量
        )
      )
      
      ;; 存储结果
      (v128.store (local.get $pixels) (local.get $vector))
      
      ;; 更新指针和计数器
      (local.set $pixels (i32.add (local.get $pixels) (i32.const 16)))
      (local.set $i (i32.add (local.get $i) (i32.const 4)))
      (br_if $process (i32.lt_u (local.get $i) (local.get $count)))
    )
  )
)
```

#### 矩阵乘法加速

```wat
;; SIMD 加速的矩阵乘法
(func $matrix_multiply_simd
  (param $a i32) (param $b i32) (param $result i32)
  (param $rows i32) (param $cols i32) (param $inner i32)
  
  (local $i i32) (local $j i32) (local $k i32)
  (local $sum v128) (local $a_vec v128) (local $b_vec v128)
  
  ;; 外层循环遍历行
  (loop $rows_loop
    ;; 内层循环遍历列  
    (loop $cols_loop
      (local.set $sum (f32x4.splat (f32.const 0.0)))
      
      ;; 向量化内积计算
      (loop $inner_loop
        ;; 加载A的4个元素和B的4个元素
        (local.set $a_vec (v128.load (local.get $a)))
        (local.set $b_vec (v128.load (local.get $b)))
        
        ;; 乘积累加
        (local.set $sum
          (f32x4.add
            (local.get $sum)
            (f32x4.mul (local.get $a_vec) (local.get $b_vec))
          )
        )
        
        ;; 更新指针
        (local.set $a (i32.add (local.get $a) (i32.const 16)))
        (local.set $b (i32.add (local.get $b) (i32.const 16)))
        (local.set $k (i32.add (local.get $k) (i32.const 4)))
        (br_if $inner_loop (i32.lt_u (local.get $k) (local.get $inner)))
      )
      
      ;; 水平求和并存储结果
      (f32.store
        (local.get $result)
        (f32x4.extract_lane (local.get $sum) 0)
      )
      ;; ... 更新循环变量
    )
  )
)
```

## 异常处理机制

### 异常处理提案

WASM 异常处理提供了结构化的错误处理机制，类似于传统语言的 try-catch 模式。

**异常处理流程：**
```
try
  → 可能抛出异常的操作
catch → 异常处理逻辑
catch_all → 兜底处理
delegate → 异常重新抛出
```

### 异常指令集

**核心异常指令：**
```
try - 开始异常处理块
catch - 捕获特定类型异常  
catch_all - 捕获所有异常
throw - 抛出异常
rethrow - 重新抛出异常
delegate - 委托异常处理
```

#### 异常类型定义

```wat
;; 定义异常类型
(exception $math_error (param i32))     ;; 数学错误，带错误码
(exception $io_error (param i32 i32))   ;; IO错误，带错误码和详情
(exception $generic_error)              ;; 通用错误，无参数
```

### 异常处理实战

#### 基础异常处理模式

```wat
;; 基本的 try-catch 模式
(func $safe_divide (param $a i32) (param $b i32) (result i32)
  (try $try_block (result i32)
    (do
      ;; 检查除数是否为零
      (if (i32.eqz (local.get $b))
        (then
          ;; 抛出除零异常
          (throw $math_error (i32.const 0))
        )
      )
      ;; 正常除法运算
      (i32.div_s (local.get $a) (local.get $b))
    )
    (catch $math_error
      ;; 处理数学错误
      (i32.const -1)  ;; 返回错误值
    )
    (catch_all
      ;; 处理其他所有异常
      (i32.const -2)  ;; 返回通用错误值
    )
  )
)
```

#### 复杂的异常传播

```wat
;; 多级异常处理和重新抛出
(func $process_data (param $data_ptr i32) (result i32)
  (try $outer (result i32)
    (do
      (try $inner (result i32)
        (do
          ;; 数据验证
          (call $validate_data (local.get $data_ptr))
          ;; 数据处理
          (call $transform_data (local.get $data_ptr))
          (i32.const 0)  ;; 成功
        )
        (catch $validation_error
          ;; 记录验证错误
          (call $log_error (i32.const 1001))
          (rethrow $outer)  ;; 重新抛到外层
        )
        (catch $processing_error
          ;; 处理特定的处理错误
          (call $recover_processing (local.get $data_ptr))
          (i32.const 1)  ;; 部分成功
        )
      )
    )
    (catch_all
      ;; 外层捕获所有未处理异常
      (call $log_fatal_error)
      (i32.const -1)  ;; 完全失败
    )
  )
)
```

### 异常与性能

异常处理机制经过精心设计，确保在无异常抛出时几乎零开销。

**异常性能特征：**
```
正常执行路径: 无额外开销
异常抛出时: 栈展开成本，但远优于通过返回码传播错误
```

## 集成应用模式

### 线程 + SIMD 高性能计算

结合线程和 SIMD 可以实现极致的并行计算性能。

**并行向量处理架构：**
```
主线程: 数据分片 → 工作线程池
    ↓
工作线程: SIMD 向量处理 → 部分结果
    ↓  
主线程: 结果聚合 ← 原子操作同步
```

#### 并行归约示例

```wat
;; 多线程 SIMD 归约求和
(module
  (memory 1 1 shared)
  
  (func $parallel_sum (param $data_ptr i32) (param $length i32) (result f64)
    (local $thread_count i32)
    (local $chunk_size i32)
    (local $partial_results i32)
    
    ;; 计算分片大小
    (local.set $thread_count (i32.atomic.load (i32.const 0)))
    (local.set $chunk_size 
      (i32.div_u (local.get $length) (local.get $thread_count)))
    
    ;; 等待所有线程完成初始化
    (atomic.wait (i32.const 4) (i32.const 0) (i64.const -1))
    
    ;; 使用 SIMD 处理本地数据分片
    (local.set $local_sum (call $simd_sum 
      (local.get $data_ptr) 
      (local.get $chunk_size)))
    
    ;; 原子累加到全局结果
    (loop $accumulate
      (local.set $current (f64.atomic.load (i32.const 8)))
      (if (f64.atomic.rmw.cmpxchg
            (i32.const 8)
            (local.get $current)
            (f64.add (local.get $current) (local.get $local_sum)))
        (then
          ;; 成功累加，通知主线程
          (i32.atomic.rmw.add (i32.const 4) (i32.const 1))
          (atomic.notify (i32.const 4) (i32.const 1))
        )
        (else
          (br $accumulate)  ;; 重试
        )
      )
    )
    
    (local.get $local_sum)
  )
  
  (func $simd_sum (param $ptr i32) (param $len i32) (result f64)
    ;; SIMD 向量求和实现
    ;; ... 使用 f64x2 向量操作
  )
)
```

### 异常安全的并发编程

在多线程环境中，异常处理需要特别考虑资源清理和状态一致性。

**线程安全异常处理模式：**
```wat
;; 带资源清理的异常安全操作
(func $thread_safe_operation (param $resource_ptr i32)
  (try $cleanup_scope
    (do
      ;; 获取锁
      (call $acquire_lock (local.get $resource_ptr))
      
      ;; 受保护的操作，可能抛出异常
      (call $critical_section (local.get $resource_ptr))
    )
    (catch_all
      ;; 异常时确保释放锁
      (call $release_lock (local.get $resource_ptr))
      (rethrow)  ;; 继续传播异常
    )
  )
)
```

## 工具链支持

### 编译时启用

现代 WASM 工具链支持按需启用这些高级特性。

**Rust 配置示例：**
```toml
# Cargo.toml
[package.metadata.wasm-pack.profile.release]
wasm-opt = ["-O3", "--enable-threads", "--enable-simd", "--enable-exceptions"]
```

**编译标志：**
```bash
# 启用所有高级特性
wasm-pack build --target web --release \
  -- -C target-feature=+atomics,+bulk-memory,+simd,+exception-handling
```

### 运行时检测

应用程序可以动态检测运行时对高级特性的支持。

**特性检测示例：**
```javascript
// 检测运行时支持
async function checkFeatures() {
  const features = {
    threads: WebAssembly.Memory && WebAssembly.Memory.prototype.grow,
    simd: WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11])),
    exceptions: false // 需要更复杂的检测逻辑
  };
  
  return features;
}
```

通过线程、SIMD 和异常处理这些高级特性，WebAssembly 能够满足现代高性能应用的复杂需求，在保持安全性的同时提供接近原生的性能表现。