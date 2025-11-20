# WASM 与其他语言

## 多语言生态概览

WebAssembly 作为一种通用的编译目标，其设计初衷就是支持多种编程语言。这种语言无关性让开发者能够根据项目需求选择最适合的语言，同时享受 WASM 带来的跨平台、高性能和安全优势。

**核心编译流程示意图：**

```
高级语言源代码 (Rust/C/C++/Go/等)
        ↓
    [语言特定编译器]
        ↓
    LLVM 中间表示 (IR)
        ↓
  [WASM 后端代码生成]
        ↓
   .wasm 二进制模块
        ↓
  [跨平台执行环境]
```

## Rust 与 WebAssembly

### 工具链与开发生态

Rust 语言凭借其内存安全特性和卓越的性能，成为 WebAssembly 开发的首选语言之一。Rust 生成的 WASM 模块不含垃圾回收器等额外开销，通过高级优化可实现极小的代码体积。

**核心优势对比：**

```
Rust 特性 → WASM 优势
内存安全 → 沙箱安全保证
零成本抽象 → 紧凑二进制体积
现代工具链 → 流畅开发体验
无运行时 → 快速启动执行
```

### wasm-bindgen 实战

`wasm-bindgen` 是 Rust 与 JavaScript 交互的核心工具，提供类型安全的绑定生成：

```rust
use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen]
pub struct ImageProcessor {
    width: u32,
    height: u32,
    data: Vec<u8>,
}

#[wasm_bindgen]
impl ImageProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(width: u32, height: u32) -> ImageProcessor {
        ImageProcessor {
            width,
            height,
            data: vec![0; (width * height * 4) as usize],
        }
    }

    #[wasm_bindgen]
    pub fn grayscale(&mut self) {
        for i in (0..self.data.len()).step_by(4) {
            let r = self.data[i] as f32;
            let g = self.data[i + 1] as f32;
            let b = self.data[i + 2] as f32;

            let gray = (0.299 * r + 0.587 * g + 0.114 * b) as u8;

            self.data[i] = gray;
            self.data[i + 1] = gray;
            self.data[i + 2] = gray;
        }
    }

    #[wasm_bindgen]
    pub fn get_data_ptr(&self) -> *const u8 {
        self.data.as_ptr()
    }
}
```

### 编译与优化

```bash
# 安装 WASM 目标
rustup target add wasm32-unknown-unknown

# 使用 wasm-pack 构建
wasm-pack build --target web --release

# 进一步优化体积
wasm-opt -Os pkg/*.wasm -o pkg/optimized.wasm
```

## Go 与 WebAssembly

### 语言特性与 WASM 适配

Go 语言通过基于 LLVM 的 TinyGo 编译器更好地适配 WebAssembly 环境。TinyGo 专门针对嵌入式系统和 WASM 优化，解决了传统 Go 编译器生成二进制文件过大的问题。

### go:wasmexport 指令

Go 1.24 引入了 `go:wasmexport` 指令，显著增强了 Go 与 WASM 主机的交互能力：

```go
package main

//go:wasmexport add
func add(a, b int32) int32 {
    return a + b
}

//go:wasmexport process_string
func processString(input string) string {
    // 字符串处理逻辑
    return "Processed: " + input
}

//go:wasmexport calculate_stats
func calculateStats(data []float64) map[string]float64 {
    stats := make(map[string]float64)

    var sum float64
    for _, v := range data {
        sum += v
    }
    stats["mean"] = sum / float64(len(data))

    // 更多统计计算...
    return stats
}
```

### WASI Reactor 模式构建

Go 1.24 支持构建 WASI Reactor，创建长期运行的 WebAssembly 模块：

```bash
# 构建 WASI Reactor
GOOS=wasip1 GOARCH=wasm go build -buildmode=c-shared -o reactor.wasm
```

**Reactor 与 Command 模式对比：**

```
Command 模式: 初始化 → 执行主函数 → 退出
Reactor 模式: 初始化 → 保持运行状态 → 处理多个请求 → 清理
```

### 在 Wazero 运行时中使用 Go WASM

```go
package main

import (
    "context"
    "fmt"
    "github.com/tetratelabs/wazero"
    "github.com/tetratelabs/wazero/api"
)

func main() {
    ctx := context.Background()

    // 创建 Wasm 运行时
    r := wazero.NewRuntime(ctx)
    defer r.Close(ctx)

    // 配置 Reactor 初始化
    config := wazero.NewModuleConfig().WithStartFunctions("_initialize")

    // 实例化模块
    wasmModule, _ := r.InstantiateWithConfig(ctx, wasmFile, config)

    // 调用导出的 Go 函数
    fn := wasmModule.ExportedFunction("add")
    var a, b int32 = 5, 3
    res, _ := fn.Call(ctx, api.EncodeI32(a), api.EncodeI32(b))
    result := api.DecodeI32(res[0])

    fmt.Printf("add(%d, %d) = %d\n", a, b, result)
}
```

## C/C++ 与 WebAssembly

### Emscripten 工具链

Emscripten 是将 C/C++ 代码编译为 WebAssembly 的完整工具链，提供丰富的系统库支持。

#### 编译示例

```bash
# 安装 Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# 编译 C 代码为 WASM
emcc -O3 -s WASM=1 -s EXPORTED_FUNCTIONS='["_main", "_process_image"]' -o output.html input.c
```

#### C 代码示例

```c
#include <emscripten.h>
#include <stdint.h>

// 导出函数供 JavaScript 调用
EMSCRIPTEN_KEEPALIVE
uint8_t* allocate_buffer(int size) {
    return (uint8_t*)malloc(size * sizeof(uint8_t));
}

EMSCRIPTEN_KEEPALIVE
void free_buffer(uint8_t* ptr) {
    free(ptr);
}

EMSCRIPTEN_KEEPALIVE
void image_filter(uint8_t* input, uint8_t* output, int width, int height) {
    // 图像处理逻辑 - 边缘检测
    for (int y = 1; y < height - 1; y++) {
        for (int x = 1; x < width - 1; x++) {
            int idx = (y * width + x) * 4;

            // 简单的 Sobel 边缘检测
            int gx = (-1 * input[idx - 4] + 0 + 1 * input[idx + 4]) +
                     (-2 * input[idx - 4 + width*4] + 0 + 2 * input[idx + 4 + width*4]) +
                     (-1 * input[idx - 4 + width*8] + 0 + 1 * input[idx + 4 + width*8]);

            int gy = (-1 * input[idx - 4] - 2 * input[idx - 4 + width*4] - 1 * input[idx - 4 + width*8]) +
                     (0 + 0 + 0) +
                     (1 * input[idx + 4] + 2 * input[idx + 4 + width*4] + 1 * input[idx + 4 + width*8]);

            int magnitude = (int)sqrt((double)(gx * gx + gy * gy));
            magnitude = magnitude > 255 ? 255 : magnitude;

            output[idx] = magnitude;     // R
            output[idx + 1] = magnitude; // G
            output[idx + 2] = magnitude; // B
            output[idx + 3] = 255;       // A
        }
    }
}
```

## AssemblyScript

### TypeScript 到 WebAssembly

AssemblyScript 允许 TypeScript 开发者直接编译到 WebAssembly，降低了 WASM 开发的学习曲线。

#### 开发示例

```typescript
// image.ts
export function rotateImage(
  inputPtr: i32,
  outputPtr: i32,
  width: i32,
  height: i32,
  angle: f64
): void {
  const cosTheta = Math.cos(angle)
  const sinTheta = Math.sin(angle)

  const centerX = width / 2.0
  const centerY = height / 2.0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 计算旋转后的坐标
      const srcX = (x - centerX) * cosTheta - (y - centerY) * sinTheta + centerX
      const srcY = (x - centerX) * sinTheta + (y - centerY) * cosTheta + centerY

      if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
        const srcIdx = (Math.floor(srcY) * width + Math.floor(srcX)) * 4
        const dstIdx = (y * width + x) * 4

        // 复制像素数据
        store<u8>(outputPtr + dstIdx, load<u8>(inputPtr + srcIdx))
        store<u8>(outputPtr + dstIdx + 1, load<u8>(inputPtr + srcIdx + 1))
        store<u8>(outputPtr + dstIdx + 2, load<u8>(inputPtr + srcIdx + 2))
        store<u8>(outputPtr + dstIdx + 3, load<u8>(inputPtr + srcIdx + 3))
      }
    }
  }
}

// 矩阵运算示例
export function matrixMultiply(
  aPtr: i32,
  bPtr: i32,
  resultPtr: i32,
  rowsA: i32,
  colsA: i32,
  colsB: i32
): void {
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      let sum = 0.0
      for (let k = 0; k < colsA; k++) {
        const aVal = load<f64>(aPtr + (i * colsA + k) * 8)
        const bVal = load<f64>(bPtr + (k * colsB + j) * 8)
        sum += aVal * bVal
      }
      store<f64>(resultPtr + (i * colsB + j) * 8, sum)
    }
  }
}
```

#### 编译配置

```json
// asconfig.json
{
  "targets": {
    "release": {
      "optimizeLevel": 3,
      "shrinkLevel": 2,
      "converge": false,
      "noAssert": false
    }
  },
  "options": {
    "exportMemory": true,
    "exportTable": true
  }
}
```

## 语言特性对比与选择指南

### 各语言在 WASM 生态中的表现

| 语言           | 编译体积 | 运行时性能 | 内存管理   | 工具链成熟度 | 最佳适用场景              |
| -------------- | -------- | ---------- | ---------- | ------------ | ------------------------- |
| Rust           | 中小     | 优秀       | 编译时检查 | 成熟         | 高性能计算、系统编程      |
| Go             | 较大     | 良好       | GC         | 中等         | 网络服务、并发处理        |
| C/C++          | 小       | 优秀       | 手动管理   | 非常成熟     | 图像处理、游戏引擎        |
| AssemblyScript | 小       | 良好       | 线性内存   | 中等         | Web 前端、TypeScript 迁移 |

### 选择考量因素

**性能关键型应用：**

```
C/C++/Rust → 接近原生性能 → 游戏/音视频处理
```

**开发效率优先：**

```
Go/AssemblyScript → 现代语言特性 → 快速原型/Web应用
```

**现有代码迁移：**

```
保持原语言 → 最小化重写成本 → 企业级应用迁移
```

## 跨语言互操作模式

### 通用接口设计

通过 WASM 接口类型 (Interface Types) 实现跨语言通信：

```wat
;; 跨语言接口定义
(module
  (type $Image (record
    (field $data (list u8))
    (field $width i32)
    (field $height i32)
  ))

  (import "env" "process_image" (func $process_image
    (param $image (ref $Image))
    (result (ref $Image))
  ))

  (export "image_processor" (func $process_image))
)
```

### 内存共享模式

**跨语言数据交换示意图：**

```
语言A 分配内存 → WASM 线性内存 → 语言B 读取处理
    ↓
统一数据格式 (ArrayBuffer/TypedArray)
    ↓
零拷贝或最小化拷贝传递
```

## 工具链与运行时集成

### 多语言开发工作流

**现代 WASM 开发流程：**

```
[源代码] → [语言特定编译] → [.wasm 模块]
    ↓
[WASI 接口绑定] → [运行时执行] → [跨平台部署]
```

### WasmEdge 多语言运行时

WasmEdge 支持多种语言的 WASM 模块执行，提供统一的运行时环境：

```rust
// 在 WasmEdge 中运行多语言 WASM 模块
use wasmedge_sdk::{
    config::{CommonConfigOptions, ConfigBuilder},
    params,
    Executor, ImportObjectBuilder, Store, WasmVal,
};

async fn run_multilingual_wasm() -> Result<(), Box<dyn std::error::Error>> {
    // 配置运行时
    let config = ConfigBuilder::new(CommonConfigOptions::new().bulk_memory_operations(true))
        .build()?;

    let mut executor = Executor::new(Some(&config), None);
    let mut store = Store::new();

    // 加载不同语言编译的 WASM 模块
    let languages = ["rust", "go", "cpp", "assemblyscript"];

    for lang in languages {
        let wasm_file = format!("./target/{}.wasm", lang);
        if std::path::Path::new(&wasm_file).exists() {
            let module = wasmedge_sdk::Module::from_file(Some(&config), &wasm_file)?;
            let instance = store.register_named_module(&mut executor, &lang, &module)?;

            println!("成功加载 {} WASM 模块", lang);

            // 调用通用接口函数
            if let Ok(func) = instance.func("process") {
                let _ = func.call(&mut executor, params!())?;
            }
        }
    }

    Ok(())
}
```

## 性能优化策略

### 语言特定优化技巧

**Rust 优化：**

```toml
# Cargo.toml
[package.metadata.wasm-pack.profile.release]
wasm-opt = ["-Os", "--enable-mutable-globals"]
```

**Go 优化：**

```bash
# 减小二进制体积
GOOS=wasip1 GOARCH=wasm go build -ldflags="-s -w" -o minimal.wasm
```

**C/C++ 优化：**

```bash
# 高级优化
emcc -O3 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -s MAXIMUM_MEMORY=4GB -o optimized.html source.c
```

### 内存使用最佳实践

```rust
// 跨语言内存管理模式
#[wasm_bindgen]
pub struct CrossLanguageBuffer {
    data: Vec<u8>,
    language: String, // 标识源语言
}

#[wasm_bindgen]
impl CrossLanguageBuffer {
    #[wasm_bindgen(constructor)]
    pub fn new(size: usize, lang: String) -> Self {
        Self {
            data: vec![0; size],
            language: lang,
        }
    }

    // 为不同语言提供优化的处理接口
    #[wasm_bindgen]
    pub fn process_for_language(&mut self, operation: &str) -> Result<(), JsValue> {
        match self.language.as_str() {
            "rust" => self.rust_optimized_process(operation),
            "go" => self.go_compatible_process(operation),
            "cpp" => self.cpp_style_process(operation),
            _ => self.generic_process(operation)
        }
    }
}
```

通过这种多语言支持的能力，WebAssembly 真正成为了连接不同编程语言生态的桥梁，让开发者能够根据具体需求选择最适合的工具，同时享受 WASM 带来的跨平台和性能优势。
