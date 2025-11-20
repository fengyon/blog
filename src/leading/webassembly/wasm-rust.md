# WASM 与 Rust

## 为什么选择 Rust 开发 WebAssembly？

Rust 语言与 WebAssembly 的结合堪称完美。Rust 作为一门内存安全且无运行时开销的系统编程语言，成为开发 WebAssembly 模块的理想选择。其所有权系统在编译时防止内存错误，这与 WebAssembly 的安全沙箱设计哲学高度一致。

**核心优势对比：**
```
Rust 优势 → WASM 需求
内存安全 → 沙箱安全保证
零成本抽象 → 紧凑的二进制体积
现代工具链 → 流畅的开发体验
无运行时 → 快速启动执行
```

与其他语言相比，Rust 生成的 WASM 模块**不含垃圾回收器这样的额外成本**，通过高级优化和 Tree Shaking 可移除无用代码，实现更小的代码尺寸。在性能方面，Rust 提供可预见的性能，没有难以预料的 GC 暂停，也没有 JIT 编译器造成的性能抖动。

## 开发环境搭建

### 基础工具链安装

开始 Rust WASM 开发前，需要安装以下核心工具：

```bash
# 安装 Rust 工具链
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 添加 WASM 编译目标
rustup target add wasm32-unknown-unknown

# 安装 wasm-pack（官方推荐工具）
cargo install wasm-pack
```

### 项目初始化

创建新的 Rust 库项目并配置为生成 WebAssembly 模块：

```bash
cargo new --lib rust_wasm_demo
cd rust_wasm_demo
```

修改 `Cargo.toml` 文件配置：

```toml
[package]
name = "rust_wasm_demo"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]  # 生成动态库供 Wasm 使用

[dependencies]
wasm-bindgen = "0.2"
```

## 核心开发库与工具

### wasm-bindgen：Rust 与 JavaScript 的桥梁

`wasm-bindgen` 是实现 Rust 和 JavaScript 之间高级交互的核心工具。它通过生成类型安全的绑定代码，桥接两种语言之间的语义差异。

#### 基础函数导出

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    if n <= 1 {
        return n;
    }
    let mut a = 0;
    let mut b = 1;
    for _ in 2..=n {
        let c = a + b;
        a = b;
        b = c;
    }
    b
}
```

#### 复杂数据结构处理

对于需要处理复杂数据类型的场景，可以结合 serde 进行序列化：

```rust
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct Point {
    x: f32,
    y: f32
}

#[derive(Serialize, Deserialize)]
struct Line {
    points: Vec<Point>,
    valid: bool,
    length: f32,
    desc: String
}

#[wasm_bindgen]
pub fn create_line(p1: String, p2: String, desc: String) -> Result<Vec<u8>, String> {
    let point1: Point = serde_json::from_str(p1.as_str()).unwrap();
    let point2: Point = serde_json::from_str(p2.as_str()).unwrap();
    let length = ((point1.x - point2.x).powi(2) + (point1.y - point2.y).powi(2)).sqrt();
    
    let valid = length != 0.0;
    let line = Line { 
        points: vec![point1, point2], 
        valid, 
        length, 
        desc 
    };
    
    Ok(serde_json::to_vec(&line).unwrap())
}
```

### web-sys：浏览器 API 绑定

`web-sys` 相当于 Rust 的“浏览器功能说明书”，让 Rust 编译的 WASM 能直接调用浏览器的各种功能。它采用按需引入的策略，避免 WASM 文件不必要的膨胀。

#### 按需配置特性

在 `Cargo.toml` 中配置所需功能：

```toml
[dependencies]
web-sys = { version = "0.3", features = [
  "Document",
  "Element",
  "Window",
  "console",
  "HtmlElement",
  "Event",
  "EventListener"
] }
```

#### DOM 操作与事件处理

```rust
use wasm_bindgen::prelude::*;
use web_sys::{window, document, console, Event, Element};
use wasm_bindgen::JsCast;

#[wasm_bindgen]
pub fn setup_calculator() -> Result<(), JsValue> {
    let window = window().unwrap();
    let document = document().unwrap();
    let body = document.body().unwrap();
    
    // 创建输入框
    let input1 = document.create_element("input")?;
    input1.set_attribute("type", "number")?;
    input1.set_attribute("id", "num1")?;
    
    let input2 = document.create_element("input")?;
    input2.set_attribute("type", "number")?;
    input2.set_attribute("id", "num2")?;
    
    // 创建按钮
    let button = document.create_element("button")?;
    button.set_text_content(Some("计算斐波那契"));
    
    // 添加点击事件
    let closure = Closure::wrap(Box::new(|| {
        let result = fibonacci(25);
        console::log_1(&format!("斐波那契(25) = {}", result).into());
    }) as Box<dyn FnMut()>);
    
    button.add_event_listener_with_callback("click", closure.as_ref().unchecked_ref())?;
    closure.forget();
    
    // 添加到页面
    body.append_child(&input1)?;
    body.append_child(&input2)?;
    body.append_child(&button)?;
    
    Ok(())
}

#[wasm_bindgen]
pub fn log_message(message: &str) {
    console::log_1(&JsValue::from_str(message));
}
```

### wasmedge-bindgen：复杂数据类型处理

WasmEdge 运行时提供了 `wasmedge-bindgen` 来增强复杂数据类型的处理能力：

```rust
use wasmedge_bindgen::*;
use wasmedge_bindgen_macro::*;

#[wasmedge_bindgen]
pub fn obfusticate(s: String) -> Result<Vec<u8>, String> {
    let r: String = s.chars().map(|c| {
        match c {
            'A'..='M' | 'a'..='m' => ((c as u8) + 13) as char,
            'N'..='Z' | 'n'..='z' => ((c as u8) - 13) as char,
            _ => c
        }
    }).collect();
    Ok(r.as_bytes().to_vec())
}

#[wasmedge_bindgen]
pub fn sha3_digest(v: Vec<u8>) -> Result<Vec<u8>, String> {
    use sha3::{Digest, Sha3_256};
    Ok(Sha3_256::digest(&v).as_slice().to_vec())
}
```

## 编译与构建

### 使用 wasm-pack 构建

`wasm-pack` 是官方推荐的构建工具，提供一体化的构建体验：

```bash
# 开发构建
wasm-pack build --target web --dev

# 发布构建
wasm-pack build --target web --release

# 针对 Node.js 环境
wasm-pack build --target nodejs
```

### 优化编译配置

在 `Cargo.toml` 中添加优化配置：

```toml
[package.metadata.wasm-pack.profile.release]
wasm-opt = ["-Os", "--enable-mutable-globals"]
```

手动使用 `wasm-opt` 进一步优化：

```bash
# 安装 wasm-opt
cargo install wasm-tools

# 优化 WASM 文件
wasm-opt -Os pkg/rust_wasm_demo_bg.wasm -o pkg/rust_wasm_demo_optimized.wasm
```

## 前端集成

### 现代 ES6 模块集成

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rust WASM 演示</title>
</head>
<body>
    <script type="module">
        import init, { greet, fibonacci, setup_calculator } from './pkg/rust_wasm_demo.js';
        
        async function run() {
            // 初始化 WASM 模块
            await init();
            
            // 调用 Rust 函数
            const greeting = greet('WASM');
            console.log(greeting);
            
            // 性能测试
            const start = performance.now();
            const fibResult = fibonacci(40);
            const duration = performance.now() - start;
            
            console.log(`斐波那契(40) = ${fibResult}, 耗时: ${duration.toFixed(2)}ms`);
            
            // 设置 DOM 交互
            await setup_calculator();
        }
        
        run().catch(console.error);
    </script>
</body>
</html>
```

### 性能对比实践

根据实际测试数据，Rust WASM 在计算密集型任务中表现卓越：

```
斐波那契数列计算性能对比（第30项）:

实现方式       平均耗时     相对性能
JavaScript递归  128ms        1x
JavaScript迭代  0.02ms     6400x  
Rust WASM      0.003ms    42666x
```

## 高级应用模式

### 服务器端 WASM 应用

Rust WASM 不仅限于浏览器，也可在服务器端运行。以下是使用 WasmEdge 创建 HTTP 服务器的示例：

```rust
use bytecodec::DecodeExt;
use httpcodec::{HttpVersion, ReasonPhrase, Request, RequestDecoder, Response, StatusCode};
use std::io::{Read, Write};
use wasmedge_wasi_socket::{TcpListener, TcpStream};

fn handle_http(req: Request<String>) -> bytecodec::Result<Response<String>> {
    Ok(Response::new(
        HttpVersion::V1_0,
        StatusCode::new(200)?,
        ReasonPhrase::new("")?,
        format!("echo: {}", req.body()),
    ))
}

fn handle_client(mut stream: TcpStream) -> std::io::Result<()> {
    let mut buff = [0u8; 1024];
    let mut data = Vec::new();
    
    loop {
        let n = stream.read(&mut buff)?;
        data.extend_from_slice(&buff[0..n]);
        if n < 1024 {
            break;
        }
    }
    
    let mut decoder = RequestDecoder::default();
    let req = match decoder.decode_from_bytes(data.as_slice()) {
        Ok(req) => handle_http(req),
        Err(e) => Err(e),
    };
    
    let response = match req {
        Ok(r) => r,
        Err(e) => {
            let err = format!("{:?}", e);
            Response::new(
                HttpVersion::V1_0,
                StatusCode::new(500).unwrap(),
                ReasonPhrase::new(err.as_str()).unwrap(),
                err.clone(),
            )
        }
    };
    
    let write_buf = response.to_string();
    stream.write(write_buf.as_bytes())?;
    stream.flush()?;
    Ok(())
}

#[wasmedge_bindgen]
pub fn start_server() -> std::io::Result<()> {
    let port = std::env::var("PORT").unwrap_or("1234".to_string());
    println!("服务器启动在端口: {}", port);
    let listener = TcpListener::bind(format!("0.0.0.0:{}", port))?;
    
    loop {
        match listener.accept() {
            Ok((stream, _)) => {
                let _ = handle_client(stream);
            }
            Err(e) => eprintln!("连接错误: {}", e),
        }
    }
}
```

### 组件化开发 with wasmCloud

wasmCloud 支持基于 WIT 的组件模型，实现更好的可移植性：

```rust
wit_bindgen::generate!({
    world: "hello",
    exports: {
        "wasi:http/incoming-handler": HttpServer,
    },
});

use exports::wasi::http::incoming_handler::Guest;
use wasi::http::types::*;

struct HttpServer;

impl Guest for HttpServer {
    fn handle(request: IncomingRequest, response_out: ResponseOutparam) {
        let response = OutgoingResponse::new(Fields::new());
        response.set_status_code(200).unwrap();
        let response_body = response.body().unwrap();
        
        let name = match request
            .path_with_query()
            .unwrap()
            .split("=")
            .collect::<Vec<&str>>()[..]
        {
            ["/?name", name] => name.to_string(),
            _ => "World".to_string(),
        };
        
        response_body
            .write()
            .unwrap()
            .blocking_write_and_flush(format!("Hello, {}!\n", name).as_bytes())
            .unwrap();
            
        OutgoingBody::finish(response_body, None).expect("failed to finish response body");
        ResponseOutparam::set(response_out, Ok(response));
    }
}

export!(HttpServer);
```

## 内存管理最佳实践

### WASM 线性内存模型

WebAssembly 使用线性内存模型，提供一个连续、隔离的字节数组作为运行时内存空间。

**内存布局示意图：**
```
线性内存地址空间:
0x0000 ┌─────────────────┐
      │    代码和数据     │
0x1000 ├─────────────────┤
      │     堆空间       │ → 可动态增长
0x2000 ├─────────────────┤
      │     栈空间       │
      └─────────────────┘
```

### 高效数据传递策略

```rust
use wasm_bindgen::prelude::*;
use js_sys::{Uint8Array, ArrayBuffer};

#[wasm_bindgen]
pub fn process_image_data(buffer: Vec<u8>) -> Result<Vec<u8>, JsValue> {
    // 零拷贝或最小化拷贝处理
    let mut image_data = buffer;
    
    // 图像处理逻辑（例如灰度化）
    for i in (0..image_data.len()).step_by(4) {
        if i + 3 < image_data.len() {
            let r = image_data[i] as f32;
            let g = image_data[i + 1] as f32;
            let b = image_data[i + 2] as f32;
            
            // 灰度计算
            let gray = (0.299 * r + 0.587 * g + 0.114 * b) as u8;
            
            image_data[i] = gray;     // R
            image_data[i + 1] = gray; // G
            image_data[i + 2] = gray; // B
            // Alpha 通道保持不变
        }
    }
    
    Ok(image_data)
}

// 使用预分配缓冲区避免频繁内存分配
#[wasm_bindgen]
pub struct ImageProcessor {
    buffer: Vec<u8>,
}

#[wasm_bindgen]
impl ImageProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(initial_capacity: usize) -> ImageProcessor {
        ImageProcessor {
            buffer: Vec::with_capacity(initial_capacity),
        }
    }
    
    pub fn process(&mut self, input_data: &[u8]) -> Result<Vec<u8>, JsValue> {
        self.buffer.clear();
        self.buffer.extend_from_slice(input_data);
        
        // 原地处理数据
        for i in (0..self.buffer.len()).step_by(4) {
            if i + 3 < self.buffer.len() {
                // 处理逻辑...
            }
        }
        
        Ok(self.buffer.clone())
    }
}
```

## 调试与测试

### 单元测试配置

在 Rust 项目中配置 WASM 测试：

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn test_fibonacci() {
        assert_eq!(fibonacci(0), 0);
        assert_eq!(fibonacci(1), 1);
        assert_eq!(fibonacci(10), 55);
        assert_eq!(fibonacci(20), 6765);
    }
    
    #[wasm_bindgen_test]
    fn test_greet() {
        let result = greet("World");
        assert_eq!(result, "Hello, World!");
    }
}
```

在 `Cargo.toml` 中添加测试依赖：

```toml
[dev-dependencies]
wasm-bindgen-test = "0.3"

[lib]
crate-type = ["cdylib", "rlib"]
```

### 调试技巧

启用调试信息编译：
```bash
wasm-pack build --target web --dev
```

在浏览器开发者工具中调试时，确保启用源映射支持，可以设置断点并单步执行 Rust 代码。

通过这套完整的技术栈，开发者可以充分利用 Rust 的性能和安全特性，结合 WebAssembly 的跨平台能力，构建高性能的 Web 应用和服务器端解决方案。