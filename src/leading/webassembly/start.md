# WASM 快速开始

## 什么是 WebAssembly？

WebAssembly (WASM) 是一种为 Web 设计的**二进制指令格式**，它提供了一种新的代码执行方式。其主要设计目标包括**高效执行**、**安全沙箱**和**跨平台可移植**。

核心特点：
- **紧凑的二进制格式**：比等效 JavaScript 文本更小，加载更快
- **接近原生性能**：采用底层指令集，适合性能敏感任务
- **内存安全**：在严格沙箱环境中运行，无法直接访问系统资源
- **语言无关**：支持 C/C++、Rust、AssemblyScript 等多种语言

## 核心概念

### 模块与内存

WASM 程序的基本单元是**模块** (Module)，包含代码、数据结构和内存定义：

```
源代码 (C/Rust/等)
    ↓ 编译
WASM 模块
    ├── 类型段 (函数签名)
    ├── 函数段 (代码逻辑)  
    ├── 内存段 (线性内存)
    ├── 表段 (函数引用)
    └── 导入/导出段 (接口)
```

**线性内存**是 WASM 与外部环境交互的核心机制：

```
内存布局示例：
[0x0000: 代码和数据]
[0x1000: 堆空间 ← 可动态增长]
[0x2000: 栈空间]
```

### 执行模型

WASM 采用**基于栈的虚拟机**模型：

```
指令序列: i32.const 5 → i32.const 3 → i32.add
栈状态变化:
[] → [5] → [5,3] → [8] (结果)
```

## 开发环境搭建

### 安装 Emscripten 工具链

Emscripten 是将 C/C++ 代码编译为 WASM 的主要工具：

```bash
# 获取 emsdk
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# 安装最新版本
./emsdk install latest
./emsdk activate latest

# 配置环境变量
source ./emsdk_env.sh
```

### 验证安装

```bash
emcc --version
# 应输出 Emscripten 版本信息
```

## 第一个 WASM 程序

### C 代码示例 (hello.c)

```c
#include <stdio.h>

int main() {
  printf("Hello, WebAssembly!\n");
  return 0;
}

// 导出自定义函数
int add(int a, int b) {
  return a + b;
}
```

### 编译为 WASM

```bash
# 基础编译
emcc hello.c -o hello.html

# 仅生成 WASM 和 JS 胶水代码
emcc hello.c -o hello.js

# 优化编译（减小体积）
emcc hello.c -Os -o hello.js
```

### 在 HTML 中使用

```html
<!DOCTYPE html>
<html>
<head>
    <title>WASM 示例</title>
</head>
<body>
    <script>
        // 加载并实例化 WASM 模块
        WebAssembly.instantiateStreaming(fetch('hello.wasm'))
            .then(obj => {
                // 调用导出的函数
                console.log(obj.instance.exports.add(2, 3)); // 输出 5
            });
    </script>
</body>
</html>
```

## 内存管理与数据交换

### JavaScript 与 WASM 数据传递

```javascript
// 在 JavaScript 中分配内存并传递数据给 WASM
const allocateMemoryForWasm = (module, data) => {
    // 将字符串转换为字节数组
    const bytes = new TextEncoder().encode(data);
    
    // 在 WASM 内存中分配空间
    const ptr = module._malloc(bytes.length + 1);
    
    // 将数据复制到 WASM 内存
    module.HEAPU8.set(bytes, ptr);
    module.HEAPU8[ptr + bytes.length] = 0; // 添加 null 终止符
    
    return ptr;
};

// 调用示例
WebAssembly.instantiateStreaming(fetch('module.wasm'))
    .then(obj => {
        const module = obj.instance.exports;
        const ptr = allocateMemoryForWasm(module, "Hello WASM");
        
        // 调用 WASM 函数处理数据
        module.process_string(ptr);
        
        // 释放内存
        module._free(ptr);
    });
```

### 在 C 中处理内存

```c
#include <stdlib.h>
#include <string.h>

// 处理字符串的函数
void process_string(char* str) {
    // 处理逻辑...
}

// 内存分配函数导出
void* malloc_size(int size) {
    return malloc(size);
}

void free_ptr(void* ptr) {
    free(ptr);
}
```

## 常用开源库及 API

### Emscripten 常用 API

Emscripten 提供了丰富的 API 来连接 JavaScript 和 WASM：

#### 文件系统操作
```c
#include <emscripten.h>
#include <stdio.h>

// 同步文件写入
EMSCRIPTEN_KEEPALIVE
void write_file(const char* filename, const char* content) {
    FILE* file = fopen(filename, "w");
    if (file) {
        fputs(content, file);
        fclose(file);
    }
}

// 异步文件读取
EMSCRIPTEN_KEEPALIVE
void read_file_async(const char* filename) {
    emscripten_async_wget_data(filename, NULL, 
        // 成功回调
        (void(*)(void*, void*, int))[](void* userdata, void* data, int size) {
            if (data) {
                printf("读取到 %d 字节数据\n", size);
                free(data);
            }
        }, 
        // 失败回调
        (void(*)(void*, int, const char*))[](void* userdata, int error, const char* desc) {
            printf("读取失败: %s\n", desc);
        }
    );
}
```

#### 动态链接 API
Emscripten 2.0+ 支持动态链接，大幅提升大型应用性能：

**主模块编译：**
```bash
emcc main.c -s MAIN_MODULE=1 -s EXPORT_ALL=1 -o main.js
```

**侧模块编译：**
```bash
emcc side.c -s SIDE_MODULE=1 -o side.wasm
```

**动态加载使用：**
```c
// 同步加载侧模块
void* handle = dlopen("side_module.wasm", RTLD_LAZY);
if (handle) {
    // 解析符号
    typedef int (*AddFunc)(int, int);
    AddFunc add = (AddFunc)dlsym(handle, "add");
    
    // 调用函数
    int result = add(2, 3); // 结果为 5
    
    dlclose(handle);
}

// 异步加载（避免阻塞主线程）
em_promise_t promise = emscripten_dlopen_promise("side_module.wasm", RTLD_NOW);
emscripten_promise_then(promise, 
    // 成功回调
    [](void* handle) {
        int (*multiply)(int, int) = dlsym(handle, "multiply");
        int result = multiply(3, 4); // 结果为 12
    },
    // 失败回调
    []() {
        emscripten_errf("异步加载失败");
    }
);
```

### Wasmer 运行时

Wasmer 是在浏览器外执行 WASM 的流行运行时：

#### Go 中使用示例
```go
package main

import (
    "fmt"
    "github.com/wasmerio/wasmer-go/wasmer"
)

func main() {
    // 读取 WASM 字节码
    bytes, _ := wasmBytes.ReadFile("module.wasm")
    
    // 创建引擎和存储
    engine := wasmer.NewEngine()
    store := wasmer.NewStore(engine)
    
    // 编译模块
    module, _ := wasmer.NewModule(store, bytes)
    
    // 创建导入对象（可为空）
    importObject := wasmer.NewImportObject()
    
    // 实例化模块
    instance, _ := wasmer.NewInstance(module, importObject)
    
    // 获取导出函数
    add, _ := instance.Exports.GetFunction("add")
    
    // 调用函数
    result, _ := add(2, 3)
    fmt.Println(result) // 输出 5
}
```

### as-wasi (AssemblyScript)

as-wasi 为 AssemblyScript 提供了高级的 WASI API 封装：

```typescript
// 导入 as-wasi
import { Console, FileSystem, Environ } from "as-wasi";

// 控制台输出
Console.log("Hello from AssemblyScript!");

// 文件系统操作
if (FileSystem.exists("data.txt")) {
    let file = FileSystem.open("data.txt", "r");
    let content = file.readString();
    Console.log("文件内容: " + content);
}

// 环境变量访问
let env = new Environ();
let path = env.get("PATH")!;
Console.log("PATH: " + path);

// 命令行参数
let args = Environ.args;
Console.log("参数数量: " + args.length.toString());
```

## WASI (WebAssembly 系统接口)

WASI 让 WASM 能够安全地访问系统资源：

### C 中使用 WASI
```c
#include <stdio.h>
#include <unistd.h>

int main() {
    // 读取命令行参数
    char buffer[100];
    ssize_t count = read(STDIN_FILENO, buffer, sizeof(buffer)-1);
    
    if (count > 0) {
        buffer[count] = '\0';
        printf("输入: %s\n", buffer);
    }
    
    // 写入标准输出
    write(STDOUT_FILENO, "Hello WASI!\n", 12);
    
    return 0;
}
```

编译命令：
```bash
clang --target=wasm32-wasi hello.c -o hello.wasm
```

## 性能优化技巧

### 编译优化选项

```bash
# 优化级别选择
emcc code.c -O1 -o code.js    # 基础优化
emcc code.c -O2 -o code.js    # 中等优化  
emcc code.c -O3 -o code.js    # 激进优化
emcc code.c -Os -o code.js    # 侧重体积优化
emcc code.c -Oz -o code.js    # 极致体积优化

# 特定优化选项
emcc code.c -s WASM=1 -o code.js                    # 仅 WASM，无 asm.js 回退
emcc code.c -s ALLOW_MEMORY_GROWTH=1 -o code.js     # 允许内存增长
emcc code.c -s INITIAL_MEMORY=16777216 -o code.js   # 设置初始内存 16MB
```

### 内存使用最佳实践

```c
#include <emscripten.h>

// 使用内存视图而非频繁复制
EMSCRIPTEN_KEEPALIVE
void process_data(uint8_t* data, int length) {
    // 直接操作内存，避免复制
    for (int i = 0; i < length; i++) {
        data[i] = data[i] * 2; // 原地处理
    }
}

// 批量操作减少 JavaScript-WASM 调用开销
EMSCRIPTEN_KEEPALIVE  
void process_batch(float* inputs, float* outputs, int count) {
    for (int i = 0; i < count; i++) {
        outputs[i] = inputs[i] * 2.0f;
    }
}
```

## 调试与测试

### 浏览器开发者工具

现代浏览器提供了完善的 WASM 调试支持：
- **源码映射**：将 WASM 二进制映射到原始源代码
- **单步调试**：在开发者工具中设置断点和单步执行
- **内存检查**：查看和编辑 WASM 线性内存

### 添加调试信息

```bash
# 包含调试信息
emcc -g4 hello.c -o hello.js
# -g4 包含最大调试信息，包括 DWARF 信息
```

## 常见应用场景

### 图像处理
```c
#include <emscripten.h>

// 图像处理函数
EMSCRIPTEN_KEEPALIVE
void grayscale(uint8_t* image, int width, int height) {
    for (int i = 0; i < width * height * 4; i += 4) {
        uint8_t r = image[i];
        uint8_t g = image[i + 1]; 
        uint8_t b = image[i + 2];
        
        // 计算灰度值
        uint8_t gray = (r + g + b) / 3;
        
        image[i] = gray;     // R
        image[i + 1] = gray; // G  
        image[i + 2] = gray; // B
        // Alpha 通道保持不变
    }
}
```

### 加密计算
```c
#include <emscripten.h>

// 简单 XOR 加密
EMSCRIPTEN_KEEPALIVE
void xor_encrypt(uint8_t* data, int length, uint8_t key) {
    for (int i = 0; i < length; i++) {
        data[i] = data[i] ^ key;
    }
}
```