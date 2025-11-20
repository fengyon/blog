# WASM 与 JS 交互

## 交互基础

WebAssembly (WASM) 与 JavaScript 的集成为开发者提供了更多选择和灵活性。WASM 本身并不具备与浏览器直接交互的能力，需要与 JavaScript 进行集成才能实现与 Web 平台的无缝交互。这种协作关系让开发者能够充分利用 WASM 的高性能特性，同时保留 JavaScript 的灵活性和丰富生态系统。

### 核心交互机制

WASM 与 JavaScript 之间通过两种主要方式进行交互：导入导出和 WebAssembly 的 JavaScript API。

**模块交互示意图：**
```
JavaScript 环境
    ↓ ↑ 调用函数/传递数据
WASM 实例
    ├── 导出函数 (供 JS 调用)
    ├── 导入函数 (调用 JS 功能)  
    └── 线性内存 (共享数据)
```

## 模块加载与实例化

### 流式实例化

使用 `WebAssembly.instantiateStreaming` 可以直接从 Response 对象实例化 WASM 模块，这是最高效的加载方式：

```javascript
// 使用 Fetch API 加载和实例化 WASM 模块
WebAssembly.instantiateStreaming(fetch('module.wasm'), importObject)
  .then(results => {
    const instance = results.instance;
    // 使用导出的函数
    instance.exports.exported_func();
  });
```

如果环境不支持流式实例化，可以使用缓冲方式：

```javascript
// 缓冲实例化作为备选方案
fetch('module.wasm')
  .then(response => response.arrayBuffer())
  .then(bytes => WebAssembly.instantiate(bytes, importObject))
  .then(results => {
    results.instance.exports.exported_func();
  });
```

### 实用封装函数

对于需要多次加载模块的场景，可以创建实用函数简化代码：

```javascript
// 封装获取和实例化的实用函数
function fetchAndInstantiate(url, importObject) {
  return fetch(url)
    .then(response => response.arrayBuffer())
    .then(bytes => WebAssembly.instantiate(bytes, importObject))
    .then(results => results.instance);
}

// 使用示例
fetchAndInstantiate('module.wasm', importObject)
  .then(instance => {
    instance.exports.exported_func();
  });
```

## 函数导入与导出

### 从 JavaScript 导入函数到 WASM

在实例化 WASM 模块时，可以通过导入对象将 JavaScript 函数注入到 WASM 环境中：

```javascript
// 创建导入对象，包含 WASM 模块需要的外部函数
const importObject = {
  // 环境相关的导入
  env: {
    // 内存操作函数
    memoryBase: 0,
    tableBase: 0,
    memory: new WebAssembly.Memory({ initial: 256 }),
    table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),
    
    // 从 JS 导入到 WASM 的函数
    js_log: (value) => console.log('WASM 输出:', value),
    js_alert: (messagePtr) => {
      const message = getStringFromMemory(instance, messagePtr);
      alert(message);
    }
  }
};

// 实例化时提供导入对象
WebAssembly.instantiateStreaming(fetch('module.wasm'), importObject)
  .then(results => {
    instance = results.instance;
  });
```

在 C/C++ 代码中声明对应的导入函数：

```c
// 在 C 代码中声明导入的 JS 函数
extern void js_log(int value);
extern void js_alert(const char* message);

// 在 C 函数中调用 JS 函数
void wasm_function() {
    js_log(42);
    js_alert("Hello from WASM!");
}
```

### 从 WASM 导出函数到 JavaScript

WASM 模块可以将函数导出供 JavaScript 调用：

```c
// 在 C 代码中定义导出函数
__attribute__((used)) int export add(int a, int b) {
    return a + b;
}

__attribute__((used)) double export calculate(double x) {
    return x * 2.5;
}
```

在 JavaScript 中调用导出的 WASM 函数：

```javascript
// 调用 WASM 导出的函数
instance.exports.add(5, 3);        // 返回 8
instance.exports.calculate(10.0);  // 返回 25.0
```

## 内存管理与数据交换

### 共享内存机制

WebAssembly.Memory 对象是 JS 和 WASM 之间共享内存的核心。当 WebAssembly 模块被实例化时，它需要一个 memory 对象。

**内存共享示意图：**
```
WebAssembly.Memory
    ↓
ArrayBuffer ← JS 和 WASM 都可以访问
    ↓
类型化数组 (Uint8Array, Int32Array 等)
```

### 内存操作实战

```javascript
// 创建共享内存
const memory = new WebAssembly.Memory({ initial: 256 }); // 256页 = 16MB

// 在导入对象中提供内存
const importObject = {
  env: {
    memory: memory
  }
};

// 从 JS 访问 WASM 内存
function readStringFromMemory(instance, pointer, maxLength = 256) {
  const memoryView = new Uint8Array(memory.buffer);
  let string = '';
  for (let i = 0; i < maxLength; i++) {
    const char = memoryView[pointer + i];
    if (char === 0) break; // 遇到 null 终止符停止
    string += String.fromCharCode(char);
  }
  return string;
}

function writeStringToMemory(instance, pointer, string) {
  const memoryView = new Uint8Array(memory.buffer);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(string);
  for (let i = 0; i < encoded.length; i++) {
    memoryView[pointer + i] = encoded[i];
  }
  // 添加 null 终止符
  memoryView[pointer + encoded.length] = 0;
}
```

### 内存分配策略

对于复杂的数据交换，建议在 WASM 侧实现内存分配函数：

```c
// C 代码中实现内存分配函数
#define WASM_EXPORT __attribute__((visibility("default")))

void* malloc(size_t size);
void free(void* ptr);

WASM_EXPORT void* wasm_malloc(size_t size) {
    return malloc(size);
}

WASM_EXPORT void wasm_free(void* ptr) {
    free(ptr);
}
```

在 JavaScript 中使用这些分配函数：

```javascript
// JavaScript 中使用 WASM 的内存分配
function allocateMemoryForWasm(instance, data) {
  if (typeof data === 'string') {
    const bytes = new TextEncoder().encode(data);
    const ptr = instance.exports.wasm_malloc(bytes.length + 1);
    if (ptr === 0) return null; // 分配失败
    
    const memoryView = new Uint8Array(memory.buffer);
    for (let i = 0; i < bytes.length; i++) {
      memoryView[ptr + i] = bytes[i];
    }
    memoryView[ptr + bytes.length] = 0; // null 终止符
    return ptr;
  }
  return null;
}

function freeMemoryInWasm(instance, ptr) {
  instance.exports.wasm_free(ptr);
}
```

## 高级数据类型处理

### 复杂数据结构传递

对于复杂数据结构，需要在 JS 和 WASM 之间建立一致的内存布局：

```c
// C 中定义数据结构
typedef struct {
    int id;
    float x;
    float y;
    char name[32];
} Point;

WASM_EXPORT void process_point(Point* point) {
    point->x *= 2.0f;
    point->y *= 2.0f;
}
```

在 JavaScript 中操作相同的内存布局：

```javascript
// JavaScript 中操作 WASM 数据结构
function createPointInWasm(instance, id, x, y, name) {
  // 分配内存
  const pointSize = 44; // int(4) + float(4) + float(4) + char[32](32)
  const ptr = instance.exports.wasm_malloc(pointSize);
  
  if (ptr !== 0) {
    const memoryView = new DataView(memory.buffer);
    
    // 按照 C 结构体布局写入数据
    memoryView.setInt32(ptr, id, true);        // id
    memoryView.setFloat32(ptr + 4, x, true);   // x
    memoryView.setFloat32(ptr + 8, y, true);   // y
    
    // 写入字符串
    const nameBytes = new TextEncoder().encode(name);
    for (let i = 0; i < Math.min(31, nameBytes.length); i++) {
      memoryView.setUint8(ptr + 12 + i, nameBytes[i]);
    }
    memoryView.setUint8(ptr + 12 + 31, 0); // 确保 null 终止
  }
  
  return ptr;
}
```

## 系统接口与 WASI

### Node.js 中的 WASI 集成

Node.js 提供了 WASI 实现，允许 WASM 模块访问系统资源：

```javascript
import { WASI } from 'wasi';
import { readFile } from 'fs/promises';

// 创建 WASI 实例
const wasi = new WASI({
  version: 'preview1',
  args: process.argv,
  env: process.env,
  preopens: {
    '/sandbox': '/some/real/path'
  }
});

// 加载和实例化 WASM 模块
const wasm = await WebAssembly.compile(
  await readFile('./demo.wasm')
);
const instance = await WebAssembly.instantiate(wasm, wasi.getImportObject());

// 启动 WASI 程序
wasi.start(instance);
```

### as-wasi：高级 AssemblyScript 封装

as-wasi 项目为 AssemblyScript 提供了高级的 WASI API 封装：

```typescript
// AssemblyScript 中使用 as-wasi
import { Console, FileSystem, Environ } from "as-wasi";

// 控制台输出
Console.log("Hello from AssemblyScript!");

// 文件系统操作
if (FileSystem.exists("data.txt")) {
  let file = FileSystem.open("data.txt", "r");
  let content = file.readString();
  Console.log("File content: " + content);
}

// 环境变量访问
let env = new Environ();
let path = env.get("PATH");
if (path !== null) {
  Console.log("PATH: " + path);
}
```

## 交互模式与架构

### 命令模式 (Command Pattern)

命令模式涉及单次执行和请求/响应式的交互。这种模式通常通过 STDIN 接受输入并通过 STDOUT 输出结果。

**执行流程：**
```
JS 调用 → WASM 命令模块 (一次性执行) → 返回结果 → 模块卸载
```

### 反应器模式 (Reactor Pattern)

反应器模式保持模块运行状态，处理多个请求。这种模式适合需要保持状态的长期运行任务。

**执行流程：**
```
初始化 WASM 模块 → 保持运行状态 → 处理多个请求 → 回调宿主环境
```

反应器模式实现示例：

```javascript
// Reactor 模式示例
class WASMReactor {
  constructor(moduleUrl) {
    this.instance = null;
    this.isRunning = false;
    this.loadModule(moduleUrl);
  }
  
  async loadModule(moduleUrl) {
    const { instance } = await WebAssembly.instantiateStreaming(
      fetch(moduleUrl), 
      this.getImportObject()
    );
    this.instance = instance;
    this.startReactor();
  }
  
  getImportObject() {
    return {
      env: {
        memory: new WebAssembly.Memory({ initial: 256 }),
        // Reactor 回调函数
        on_data_ready: (dataPtr, dataLen) => this.onDataReady(dataPtr, dataLen),
        on_error: (errorCode) => this.onError(errorCode)
      }
    };
  }
  
  startReactor() {
    this.isRunning = true;
    this.instance.exports.start_reactor();
  }
  
  onDataReady(dataPtr, dataLen) {
    // 处理从 WASM 返回的数据
    const data = readStringFromMemory(this.instance, dataPtr, dataLen);
    this.dispatchEvent('data', data);
  }
  
  sendCommand(command) {
    if (this.isRunning) {
      const cmdPtr = allocateMemoryForWasm(this.instance, command);
      this.instance.exports.process_command(cmdPtr);
      freeMemoryInWasm(this.instance, cmdPtr);
    }
  }
}
```

## 性能优化技巧

### 最小化 JS-WASM 边界跨越

每次跨越 JS-WASM 边界都有成本，应该批量处理数据：

```c
// 批量处理而不是单个处理
WASM_EXPORT void process_array(int32_t* input, int32_t* output, size_t length) {
    for (size_t i = 0; i < length; i++) {
        output[i] = input[i] * 2 + 1;
    }
}
```

```javascript
// JavaScript 中批量调用
function processLargeDataset(instance, inputArray) {
  const inputSize = inputArray.length * 4; // 每个 int32 4字节
  const outputSize = inputSize;
  
  const inputPtr = instance.exports.wasm_malloc(inputSize);
  const outputPtr = instance.exports.wasm_malloc(outputSize);
  
  // 批量写入输入数据
  const inputView = new Int32Array(memory.buffer, inputPtr, inputArray.length);
  inputView.set(inputArray);
  
  // 单次调用处理整个数组
  instance.exports.process_array(inputPtr, outputPtr, inputArray.length);
  
  // 读取结果
  const outputView = new Int32Array(memory.buffer, outputPtr, inputArray.length);
  const result = Array.from(outputView);
  
  // 清理内存
  instance.exports.wasm_free(inputPtr);
  instance.exports.wasm_free(outputPtr);
  
  return result;
}
```

### 内存管理最佳实践

```javascript
// 内存管理工具类
class WASMMemoryManager {
  constructor(instance, memory) {
    this.instance = instance;
    this.memory = memory;
    this.allocations = new Set();
  }
  
  alloc(size) {
    const ptr = this.instance.exports.wasm_malloc(size);
    if (ptr !== 0) {
      this.allocations.add(ptr);
    }
    return ptr;
  }
  
  free(ptr) {
    if (this.allocations.has(ptr)) {
      this.instance.exports.wasm_free(ptr);
      this.allocations.delete(ptr);
    }
  }
  
  freeAll() {
    for (const ptr of this.allocations) {
      this.instance.exports.wasm_free(ptr);
    }
    this.allocations.clear();
  }
  
  // 自动内存增长监控
  ensureCapacity(requiredSize) {
    const currentSize = this.memory.buffer.byteLength;
    if (requiredSize > currentSize) {
      const neededPages = Math.ceil((requiredSize - currentSize) / (64 * 1024));
      this.memory.grow(neededPages);
    }
  }
}
```

## 调试与错误处理

### 跨边界错误处理

```javascript
// 统一的错误处理机制
class WASMInteropError extends Error {
  constructor(wasmErrorCode, message) {
    super(`WASM Error ${wasmErrorCode}: ${message}`);
    this.wasmErrorCode = wasmErrorCode;
  }
}

// WASM 错误回调
function setupErrorHandling(importObject) {
  importObject.env.js_throw_error = (errorCode, messagePtr) => {
    const message = readStringFromMemory(instance, messagePtr);
    throw new WASMInteropError(errorCode, message);
  };
}

// 安全调用封装
function safeWASMCall(instance, functionName, ...args) {
  try {
    const result = instance.exports[functionName](...args);
    return { success: true, result };
  } catch (error) {
    console.error(`WASM call ${functionName} failed:`, error);
    return { success: false, error };
  }
}
```

通过以上模式和技术，开发者可以构建高效、可靠的 WASM 与 JavaScript 交互方案，充分发挥两种技术的优势。