# WASM 系统接口 (WASI)

## 什么是 WASI？

WebAssembly 系统接口 (WASI) 是一组为 WebAssembly (Wasm) 编译的软件标准 API 规范。WASI 旨在为可从任何语言编译成 Wasm 的应用程序提供**安全的标准接口**，这些应用程序可以在任何地方运行——从浏览器到云到嵌入式设备。

**核心定位：**
```
WebAssembly 模块 → 需要访问系统资源
    ↓
WASI 标准接口 ← 提供安全、可移植的系统调用
    ↓
各种运行环境 (浏览器/云/边缘/嵌入式)
```

## 设计理念与特点

### 安全优先的设计

WASI 采用基于**能力的安全模型** (Capability-based Security Model)，这是一种比简单沙箱更安全的机制。在这种模型中，WASI 运行时可以将“打开”系统调用的实例传递到沙箱中，该实例只能打开运行时本身预先选定的特定文件或文件夹。

**传统安全模型 vs WASI 能力模型：**
```
传统权限模型:
程序请求: "打开文件 /etc/passwd"
系统检查: 进程是否有读取权限 → 是/否

WASI 能力模型:
程序持有: 特定文件的能力令牌
系统检查: 令牌是否有效 → 是/否
```

### 虚拟操作系统架构

WASI 本质上是一个**虚拟操作系统接口**，它为所有编程语言提供统一的系统调用集，同时给所有 Wasm 运行时开发者提供单一的操作系统来模拟。

**架构示意图：**
```
不同语言应用 (Rust/C/C++/Go...)
    ↓ 编译为统一目标
WASM 模块 + WASI 调用
    ↓
各种 WASI 运行时 (Wasmtime/WasmEdge/Wasmer...)
    ↓ 适配不同平台
宿主操作系统 (Linux/Windows/macOS...)
```

## 核心架构组件

### 标准化系统接口

WASI 将几乎每个程序都需要的基本管理功能 (如文件、文件夹、网络连接或时间) 设计成相应的接口，这些接口尽可能类似于它们的 POSIX 对应物，并全部打包到“WASI-core”模块中。

**WASI-core 主要功能域：**
```
文件系统操作 (文件读写、目录管理)
网络通信 (套接字、HTTP)
时间管理 (系统时钟、定时器)
随机数生成
环境变量与参数
```

### 组件模型

WASI 可以同时被核心 Wasm 模块和根据**组件模型**构建的应用程序使用，该规范使 Wasm 应用程序能够互操作和组合。这种设计支持将软件编写在不同语言中的程序组合起来，而无需像基于 HTTP 的微服务那样昂贵且笨重的接口系统。

## 应用场景与生态系统

### 浏览器中的 WASI

在浏览器中，通过 WASI，WebAssembly 程序可以调用系统 API，从而执行一些原本无法通过纯 Web 技术实现的功能。例如，使用 WASI，WebAssembly 程序可以访问文件系统、网络资源等。

**浏览器集成模式：**
```
Web 应用 ← JavaScript 胶水代码 ← WASI 填充程序 ← WASM 模块
```

### 超越浏览器的应用

WASI 使 WebAssembly 能够广泛应用于各种环境：

- **云原生与边缘计算**：轻量级、安全的函数执行
- **物联网设备**：资源受限环境中的可移植代码
- **移动设备**：跨平台原生性能
- **插件系统**：任何带有插件模型的项目都应该使用 WASI

### 网络能力

WASI 的网络功能是其在浏览器应用中的一大亮点。通过 WASI，WebAssembly 程序可以直接与网络进行交互，而无需经过 JavaScript 或 Web API 的中转。这大大提高了网络通信的效率和安全性。

**网络架构：**
```
WASM 模块 → WASI Socket API → 主机网络栈
    ↓
直接 TCP/UDP 通信，无需 JS 中介
```

## 开发实践

### 支持的语言与工具链

几乎所有主流的编程语言现在都支持以 WASI 为目标进行编译：

**C/C++ 开发流程：**
```c
#include <stdio.h>

int main() {
    FILE* file = fopen("data.txt", "r");
    if (file) {
        char buffer[1024];
        fgets(buffer, sizeof(buffer), file);
        printf("文件内容: %s\n", buffer);
        fclose(file);
    }
    return 0;
}
```
编译命令：`clang --target=wasm32-wasi demo.c -o demo.wasm`

**Rust 开发流程：**
```rust
use std::fs;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let content = fs::read_to_string("data.txt")?;
    println!("文件内容: {}", content);
    Ok(())
}
```
配置：在 `Cargo.toml` 中设置 `target = "wasm32-wasi"`

### 运行时生态

有多种运行时支持 WASI，每个都有不同的重点领域：

- **Wasmtime**：服务器端和非 Web 嵌入，支持组件
- **WAMR**：物联网、嵌入式设备和边缘计算
- **WasmEdge**：云原生和边缘计算
- **wazero**：无需 CGO 的 Go 库
- **Wasmer**：多平台支持

## 版本演进

WASI 至今已经发布了两个里程碑版本，分别是 0.1 和 0.2 (有时也称为 Preview 1 和 Preview 2，或 P1 和 P2)。

**版本特性对比：**
```
WASI Preview 1 (0.1):
- 基础系统调用接口
- 类似 POSIX 的 API 设计
- 基础文件 I/O 和网络

WASI Preview 2 (0.2):  
- 组件模型支持
- 增强的合成能力
- 更精细的能力控制
```

## 安全性与可移植性优势

### 细粒度的安全控制

与传统的文件权限甚至 chroot 系统相比，WASI 提供了更健壮、更细粒度的程序控制。运行时可以将它启动的每个 Wasm 模块的每个实例放入一个单独的沙箱中，只包含该特定实例真正需要的最小、最不受特权限制的函数组合。

**安全沙箱示意图：**
```
WASI 运行时
├── 实例 A 沙箱: [文件 X 读写, 网络连接 Y]
├── 实例 B 沙箱: [文件 Z 只读]
└── 实例 C 沙箱: [定时器, 随机数]
```

### 真正的二进制兼容性

WASI 使“一次编译，到处运行”成为现实。使用任何你想要的语言，然后编译一次，产生一个二进制文件，这个文件可以在任何识别 WebAssembly 的环境中安全地运行。

**可移植性对比：**
```
传统编译:
源码 → Linux 二进制 | Windows 二进制 | macOS 二进制

WASI 编译:
源码 → WASM + WASI → 任何 WASI 兼容的运行时
```