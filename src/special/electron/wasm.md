# Electron 集成 WebAssembly

## 集成概述

Electron 与 WebAssembly 的集成将 Web 技术的**快速开发能力**与原生代码的**高性能特性**完美结合。这种集成模式允许开发者在 Electron 的渲染进程和主进程中直接调用编译为 WebAssembly 的 C/C++、Rust 或其他语言代码，实现对计算密集型任务、现有原生库和硬件加速功能的深度集成。

集成架构的核心在于通过 **WebAssembly 运行时**建立 JavaScript 与原生编译代码之间的高效执行环境：

```
Electron 应用 (JavaScript/TypeScript)
    ↑↓ WebAssembly JavaScript API
WebAssembly 运行时 (WASM 模块)
    ↑
编译后的原生代码 (C/C++/Rust)
    ↑
系统资源 (计算/内存/算法)
```

## WebAssembly 基础与工具链

### WebAssembly 架构解析

WebAssembly 是一种**可移植、体积小、加载快**的二进制指令格式，为 Electron 应用提供了接近原生代码的执行性能。与传统的 JavaScript 相比，WebAssembly 在计算密集型任务上具有显著优势。

**WebAssembly 在 Electron 中的执行流程：**

```
源代码 (C/C++/Rust) → Emscripten 编译 → WASM 模块 + JavaScript 胶水代码
                                                      ↓
                                                Electron 加载执行
                                                      ↓
                                           JavaScript 与 WASM 交互
```

### Emscripten 工具链配置

Emscripten 是将 C/C++ 代码编译为 WebAssembly 的核心工具链。

```javascript
// scripts/emscripten-setup.js
import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'

class EmscriptenSetup {
  constructor() {
    this.checkPrerequisites()
  }

  checkPrerequisites() {
    const prerequisites = {
      'Emscripten': this.checkCommand('emcc --version'),
      'Python': this.checkCommand('python --version'),
      'Git': this.checkCommand('git --version'),
    }

    const missing = Object.entries(prerequisites)
      .filter(([, exists]) => !exists)
      .map(([name]) => name)

    if (missing.length > 0) {
      throw new Error(`缺少必要的开发环境: ${missing.join(', ')}`)
    }
  }

  checkCommand(command) {
    try {
      execSync(command, { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }

  async compileCToWasm(sourceFile, outputName, options = {}) {
    const defaultOptions = {
      optimization: '-O2',
      wasm: true,
      modularize: true,
      exportFunctions: ['_malloc', '_free'],
      memoryModel: 'MAXIMUM_MEMORY=512MB',
    }

    const mergedOptions = { ...defaultOptions, ...options }

    const command = [
      'emcc',
      sourceFile,
      `-o ${outputName}.js`,
      `-s ${mergedOptions.memoryModel}`,
      mergedOptions.optimization,
      mergedOptions.wasm ? '-s WASM=1' : '',
      mergedOptions.modularize ? '-s MODULARIZE=1' : '',
      `-s EXPORTED_FUNCTIONS="[${mergedOptions.exportFunctions
        .map((f) => `'${f}'`)
        .join(',')}]"`,
      "-s EXPORTED_RUNTIME_METHODS=\"['ccall', 'cwrap']\"",
    ]
      .filter(Boolean)
      .join(' ')

    try {
      console.log(`🔨 编译 ${sourceFile} 为 WebAssembly...`)
      execSync(command, { stdio: 'inherit' })
      console.log('✅ WebAssembly 编译成功')
    } catch (error) {
      console.error('❌ 编译失败:', error.message)
      throw error
    }
  }
}

export const emscriptenSetup = new EmscriptenSetup()
```

### 基础 C/C++ 模块开发

```cpp
// wasm-modules/src/core-calculations.cpp
#include <emscripten.h>
#include <emscripten/bind.h>
#include <cmath>
#include <vector>

// 高性能数学计算函数
extern "C" {
  EMSCRIPTEN_KEEPALIVE
  double calculate_distance(double x1, double y1, double x2, double y2) {
    return std::sqrt(std::pow(x2 - x1, 2) + std::pow(y2 - y1, 2));
  }

  EMSCRIPTEN_KEEPALIVE
  int* fibonacci_sequence(int n) {
    if (n <= 0) return nullptr;

    int* sequence = (int*)malloc(n * sizeof(int));
    if (sequence == nullptr) return nullptr;

    if (n >= 1) sequence[0] = 0;
    if (n >= 2) sequence[1] = 1;

    for (int i = 2; i < n; i++) {
      sequence[i] = sequence[i - 1] + sequence[i - 2];
    }

    return sequence;
  }

  EMSCRIPTEN_KEEPALIVE
  void free_memory(void* pointer) {
    free(pointer);
  }
}

// 使用 emscripten::bind 进行 C++ 类导出
class MatrixCalculator {
private:
  std::vector<std::vector<double>> data;

public:
  MatrixCalculator(const std::vector<std::vector<double>>& input) : data(input) {}

  std::vector<std::vector<double>> multiply(const std::vector<std::vector<double>>& other) {
    size_t rows = data.size();
    size_t cols = other[0].size();
    size_t inner = other.size();

    std::vector<std::vector<double>> result(rows, std::vector<double>(cols, 0.0));

    for (size_t i = 0; i < rows; i++) {
      for (size_t j = 0; j < cols; j++) {
        for (size_t k = 0; k < inner; k++) {
          result[i][j] += data[i][k] * other[k][j];
        }
      }
    }

    return result;
  }

  double determinant() {
    // 简化的行列式计算实现
    if (data.size() == 2 && data[0].size() == 2) {
      return data[0][0] * data[1][1] - data[0][1] * data[1][0];
    }
    return 0.0;
  }
};

// 绑定到 JavaScript
EMSCRIPTEN_BINDINGS(matrix_calculator) {
  emscripten::class_<MatrixCalculator>("MatrixCalculator")
    .constructor<const std::vector<std::vector<double>>&>()
    .function("multiply", &MatrixCalculator::multiply)
    .function("determinant", &MatrixCalculator::determinant);
}
```

## Electron 中的 WebAssembly 集成

### 基础 WASM 模块加载

在 Electron 中加载和初始化 WebAssembly 模块需要特定的模式和错误处理机制。

```javascript
// lib/wasm-loader.js
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

class WASMLoader {
  constructor() {
    this.modules = new Map()
    this.loadingPromises = new Map()
    this.__dirname = dirname(fileURLToPath(import.meta.url))
  }

  async loadWASMModule(moduleName, wasmPath, jsPath) {
    if (this.modules.has(moduleName)) {
      return this.modules.get(moduleName)
    }

    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName)
    }

    const loadPromise = this.initializeWASMModule(wasmPath, jsPath)
      .then((module) => {
        this.modules.set(moduleName, module)
        this.loadingPromises.delete(moduleName)
        console.log(`✅ WASM 模块加载成功: ${moduleName}`)
        return module
      })
      .catch((error) => {
        this.loadingPromises.delete(moduleName)
        console.error(`❌ WASM 模块加载失败: ${moduleName}`, error)
        throw error
      })

    this.loadingPromises.set(moduleName, loadPromise)
    return loadPromise
  }

  async initializeWASMModule(wasmPath, jsPath) {
    // 动态导入 Emscripten 生成的 JS 胶水代码
    const moduleFactory = await import(jsPath)

    const moduleConfig = {
      wasmBinary: await this.loadWASMBinary(wasmPath),
      onRuntimeInitialized: () => {
        console.log('WASM 运行时初始化完成')
      },
      print: (text) => console.log(`WASM: ${text}`),
      printErr: (text) => console.error(`WASM Error: ${text}`),
    }

    return moduleFactory(moduleConfig)
  }

  async loadWASMBinary(wasmPath) {
    try {
      const fullPath = join(this.__dirname, wasmPath)
      const wasmBuffer = await readFile(fullPath)
      return wasmBuffer
    } catch (error) {
      console.error('读取 WASM 二进制文件失败:', error)
      throw error
    }
  }

  async callWASMFunction(moduleName, functionName, ...args) {
    const module = await this.getModule(moduleName)

    if (!module[functionName]) {
      throw new Error(`函数 ${functionName} 在模块 ${moduleName} 中不存在`)
    }

    try {
      const result = module[functionName](...args)
      return result
    } catch (error) {
      console.error(`WASM 函数调用失败 [${moduleName}.${functionName}]:`, error)
      throw error
    }
  }

  async getModule(moduleName) {
    if (!this.modules.has(moduleName)) {
      throw new Error(`WASM 模块未加载: ${moduleName}`)
    }
    return this.modules.get(moduleName)
  }

  // 内存管理辅助函数
  createWASMMemory(module, initial = 256, maximum = 2048) {
    return new WebAssembly.Memory({ initial, maximum })
  }

  // 在 JavaScript 和 WASM 之间传递数据
  allocateString(module, str) {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(str)
    const ptr = module._malloc(bytes.length + 1)

    module.HEAPU8.set(bytes, ptr)
    module.HEAPU8[ptr + bytes.length] = 0 // null terminator

    return { ptr, length: bytes.length }
  }

  freeString(module, ptr) {
    if (module._free) {
      module._free(ptr)
    }
  }
}

export const wasmLoader = new WASMLoader()
```

### 预加载脚本集成

在 Electron 的预加载脚本中安全地暴露 WASM 功能给渲染进程。

```javascript
// preload/wasm-preload.js
import { contextBridge, ipcRenderer } from 'electron'
import { wasmLoader } from '../lib/wasm-loader.js'

class WASMPreloadIntegration {
  constructor() {
    this.initialized = false
    this.init()
  }

  async init() {
    try {
      // 预加载关键 WASM 模块
      await this.preloadCriticalModules()
      this.initialized = true

      console.log('✅ WASM 预加载初始化完成')
    } catch (error) {
      console.error('❌ WASM 预加载初始化失败:', error)
    }
  }

  async preloadCriticalModules() {
    const criticalModules = [
      {
        name: 'mathEngine',
        wasmPath: '../wasm/math-engine.wasm',
        jsPath: '../wasm/math-engine.js',
      },
      {
        name: 'imageProcessor',
        wasmPath: '../wasm/image-processor.wasm',
        jsPath: '../wasm/image-processor.js',
      },
    ]

    await Promise.all(
      criticalModules.map(async ({ name, wasmPath, jsPath }) => {
        await wasmLoader.loadWASMModule(name, wasmPath, jsPath)
      })
    )
  }

  exposeToRenderer() {
    const wasmAPI = {
      // 模块状态检查
      isInitialized: () => this.initialized,

      // 数学计算功能
      calculateDistance: async (x1, y1, x2, y2) => {
        return await wasmLoader.callWASMFunction(
          'mathEngine',
          'calculate_distance',
          x1,
          y1,
          x2,
          y2
        )
      },

      fibonacciSequence: async (n) => {
        const module = await wasmLoader.getModule('mathEngine')
        const ptr = module._fibonacci_sequence(n)

        if (!ptr) throw new Error('内存分配失败')

        try {
          const sequence = []
          for (let i = 0; i < n; i++) {
            sequence.push(module.HEAP32[ptr / 4 + i])
          }
          return sequence
        } finally {
          module._free_memory(ptr)
        }
      },

      // 图像处理功能
      processImage: async (imageData, width, height, operation) => {
        return await wasmLoader.callWASMFunction(
          'imageProcessor',
          'process_image',
          imageData,
          width,
          height,
          operation
        )
      },
    }

    // 安全地暴露到渲染进程
    contextBridge.exposeInMainWorld('wasmAPI', wasmAPI)
  }
}

const wasmPreload = new WASMPreloadIntegration()
wasmPreload.exposeToRenderer()
```

## 高级 WebAssembly 功能

### 复杂数据结构处理

处理 JavaScript 和 WebAssembly 之间的复杂数据交换。

```javascript
// lib/wasm-data-exchange.js
export class WASMDataExchange {
  constructor(wasmModule) {
    this.module = wasmModule
    this.allocations = new Set()
  }

  // 传输数组到 WASM
  transferArrayToWASM(jsArray, dataType = 'float') {
    const typeInfo = {
      'int8': { heap: this.module.HEAP8, bytesPerElement: 1 },
      'int16': { heap: this.module.HEAP16, bytesPerElement: 2 },
      'int32': { heap: this.module.HEAP32, bytesPerElement: 4 },
      'float': { heap: this.module.HEAPF32, bytesPerElement: 4 },
      'double': { heap: this.module.HEAPF64, bytesPerElement: 8 },
    }

    const info = typeInfo[dataType]
    if (!info) {
      throw new Error(`不支持的数据类型: ${dataType}`)
    }

    const bytes = jsArray.length * info.bytesPerElement
    const ptr = this.module._malloc(bytes)

    if (!ptr) {
      throw new Error('内存分配失败')
    }

    this.allocations.add(ptr)
    info.heap.set(jsArray, ptr / info.bytesPerElement)

    return { ptr, length: jsArray.length, dataType }
  }

  // 从 WASM 检索数组
  retrieveArrayFromWASM(ptr, length, dataType = 'float') {
    const typeInfo = {
      'int8': { heap: this.module.HEAP8, bytesPerElement: 1 },
      'int16': { heap: this.module.HEAP16, bytesPerElement: 2 },
      'int32': { heap: this.module.HEAP32, bytesPerElement: 4 },
      'float': { heap: this.module.HEAPF32, bytesPerElement: 4 },
      'double': { heap: this.module.HEAPF64, bytesPerElement: 8 },
    }

    const info = typeInfo[dataType]
    if (!info) {
      throw new Error(`不支持的数据类型: ${dataType}`)
    }

    const result = []
    const startIndex = ptr / info.bytesPerElement

    for (let i = 0; i < length; i++) {
      result.push(info.heap[startIndex + i])
    }

    return result
  }

  // 传输二维矩阵到 WASM
  transferMatrixToWASM(matrix, dataType = 'float') {
    const flattened = matrix.flat()
    const arrayInfo = this.transferArrayToWASM(flattened, dataType)

    return {
      ...arrayInfo,
      rows: matrix.length,
      cols: matrix[0].length,
    }
  }

  // 处理字符串数据
  transferStringToWASM(str) {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(str)
    const ptr = this.module._malloc(bytes.length + 1)

    if (!ptr) {
      throw new Error('字符串内存分配失败')
    }

    this.allocations.add(ptr)
    this.module.HEAPU8.set(bytes, ptr)
    this.module.HEAPU8[ptr + bytes.length] = 0 // Null terminator

    return { ptr, length: bytes.length }
  }

  // 清理内存
  free(ptr) {
    if (this.allocations.has(ptr)) {
      this.module._free(ptr)
      this.allocations.delete(ptr)
    }
  }

  // 清理所有分配的内存
  cleanup() {
    for (const ptr of this.allocations) {
      this.module._free(ptr)
    }
    this.allocations.clear()
  }

  // 内存使用统计
  getMemoryUsage() {
    const memory =
      this.module._get_memory_usage && this.module._get_memory_usage()
    return {
      allocations: this.allocations.size,
      totalMemory: memory ? memory.total : '未知',
      usedMemory: memory ? memory.used : '未知',
    }
  }
}
```

### 性能优化与多线程

利用 WebAssembly 的多线程能力提升性能。

```javascript
// lib/wasm-thread-manager.js
import { Worker } from 'worker_threads'

export class WASMThreadManager {
  constructor() {
    this.workers = new Map()
    this.taskQueue = new Map()
    this.workerScript = join(
      dirname(fileURLToPath(import.meta.url)),
      'wasm-worker.js'
    )
  }

  // 创建专用 WASM 工作线程
  async createWorker(workerId, moduleName, wasmPath, jsPath) {
    const worker = new Worker(this.workerScript, {
      workerData: {
        workerId,
        moduleName,
        wasmPath,
        jsPath,
      },
    })

    this.workers.set(workerId, worker)

    worker.on('message', (result) => {
      this.handleWorkerResult(workerId, result)
    })

    worker.on('error', (error) => {
      console.error(`WASM 工作线程错误 [${workerId}]:`, error)
      this.workers.delete(workerId)
    })

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.warn(`WASM 工作线程退出 [${workerId}], 代码: ${code}`)
      }
      this.workers.delete(workerId)
    })

    // 等待 worker 初始化完成
    return new Promise((resolve) => {
      worker.once('online', () => {
        console.log(`✅ WASM 工作线程就绪: ${workerId}`)
        resolve(workerId)
      })
    })
  }

  // 提交任务到工作线程
  async submitTask(workerId, taskType, data, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const taskId = `task-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`

      const timeoutId = setTimeout(() => {
        reject(new Error(`WASM 任务执行超时: ${taskId}`))
        this.taskQueue.delete(taskId)
      }, timeout)

      this.taskQueue.set(taskId, { resolve, reject, timeoutId })

      const worker = this.workers.get(workerId)
      if (!worker) {
        reject(new Error(`WASM 工作线程不存在: ${workerId}`))
        return
      }

      worker.postMessage({ taskId, taskType, data })
    })
  }

  handleWorkerResult(workerId, result) {
    const { taskId, data, error } = result
    const task = this.taskQueue.get(taskId)

    if (!task) {
      console.warn(`未知任务 ID: ${taskId}`)
      return
    }

    clearTimeout(task.timeoutId)
    this.taskQueue.delete(taskId)

    if (error) {
      task.reject(new Error(error))
    } else {
      task.resolve(data)
    }
  }

  // 并行处理批量数据
  async processBatchData(workerId, dataArray, processFunction) {
    const batchPromises = dataArray.map((data, index) =>
      this.submitTask(workerId, processFunction, { data, index })
    )

    const results = await Promise.all(batchPromises)
    return results.sort((a, b) => a.index - b.index).map((r) => r.result)
  }

  // 优雅关闭所有工作线程
  async shutdown() {
    const shutdownPromises = Array.from(this.workers.values()).map((worker) => {
      return new Promise((resolve) => {
        worker.once('exit', () => resolve())
        worker.postMessage({ type: 'shutdown' })

        // 强制终止（如果 5 秒内没有正常退出）
        setTimeout(() => {
          worker.terminate()
          resolve()
        }, 5000)
      })
    })

    await Promise.all(shutdownPromises)
    this.workers.clear()
    this.taskQueue.clear()

    console.log('✅ 所有 WASM 工作线程已关闭')
  }
}
```

```javascript
// lib/wasm-worker.js
import { workerData, parentPort, isMainThread } from 'worker_threads'
import { wasmLoader } from './wasm-loader.js'

class WASMWorker {
  constructor(workerId, moduleName, wasmPath, jsPath) {
    this.workerId = workerId
    this.moduleName = moduleName
    this.wasmPath = wasmPath
    this.jsPath = jsPath
    this.module = null
    this.isShuttingDown = false

    this.initialize()
  }

  async initialize() {
    try {
      this.module = await wasmLoader.loadWASMModule(
        this.moduleName,
        this.wasmPath,
        this.jsPath
      )

      console.log(`✅ WASM 工作线程初始化完成: ${this.workerId}`)

      // 通知主线程初始化完成
      if (parentPort) {
        parentPort.postMessage({ type: 'initialized', workerId: this.workerId })
      }
    } catch (error) {
      console.error(`WASM 工作线程初始化失败: ${this.workerId}`, error)
      process.exit(1)
    }
  }

  async processTask(taskType, data) {
    if (this.isShuttingDown) {
      throw new Error('工作线程正在关闭')
    }

    try {
      switch (taskType) {
        case 'matrix_multiply':
          return await this.processMatrixMultiplication(data)

        case 'image_filter':
          return await this.processImageFilter(data)

        case 'data_transform':
          return await this.processDataTransform(data)

        default:
          throw new Error(`未知任务类型: ${taskType}`)
      }
    } catch (error) {
      console.error(`WASM 任务处理失败 [${taskType}]:`, error)
      throw error
    }
  }

  async processMatrixMultiplication({ matrixA, matrixB }) {
    const exchange = new WASMDataExchange(this.module)

    try {
      const matrixAInfo = exchange.transferMatrixToWASM(matrixA)
      const matrixBInfo = exchange.transferMatrixToWASM(matrixB)

      const resultPtr = this.module._multiply_matrices(
        matrixAInfo.ptr,
        matrixAInfo.rows,
        matrixAInfo.cols,
        matrixBInfo.ptr,
        matrixBInfo.rows,
        matrixBInfo.cols
      )

      const result = exchange.retrieveArrayFromWASM(
        resultPtr,
        matrixAInfo.rows * matrixBInfo.cols
      )

      // 重组为二维矩阵
      const resultMatrix = []
      for (let i = 0; i < matrixAInfo.rows; i++) {
        resultMatrix.push(
          result.slice(i * matrixBInfo.cols, (i + 1) * matrixBInfo.cols)
        )
      }

      return resultMatrix
    } finally {
      exchange.cleanup()
    }
  }

  async processImageFilter({ imageData, width, height, filterType }) {
    const exchange = new WASMDataExchange(this.module)

    try {
      const imageInfo = exchange.transferArrayToWASM(imageData, 'int8')

      const resultPtr = this.module._apply_image_filter(
        imageInfo.ptr,
        width,
        height,
        filterType
      )

      const resultData = exchange.retrieveArrayFromWASM(
        resultPtr,
        imageData.length,
        'int8'
      )

      return resultData
    } finally {
      exchange.cleanup()
    }
  }
}

// 工作线程主逻辑
if (!isMainThread && parentPort) {
  const worker = new WASMWorker(
    workerData.workerId,
    workerData.moduleName,
    workerData.wasmPath,
    workerData.jsPath
  )

  parentPort.on('message', async (message) => {
    if (message.type === 'shutdown') {
      worker.isShuttingDown = true
      return
    }

    const { taskId, taskType, data } = message

    try {
      const result = await worker.processTask(taskType, data)
      parentPort.postMessage({ taskId, data: result })
    } catch (error) {
      parentPort.postMessage({
        taskId,
        error: error.message,
      })
    }
  })
}
```

## 实际应用场景

### 图像处理与计算机视觉

```cpp
// wasm-modules/src/image-processing.cpp
#include <emscripten.h>
#include <emscripten/bind.h>
#include <algorithm>
#include <vector>

extern "C" {
  EMSCRIPTEN_KEEPALIVE
  uint8_t* apply_grayscale_filter(uint8_t* imageData, int width, int height) {
    int totalPixels = width * height * 4; // RGBA
    uint8_t* result = (uint8_t*)malloc(totalPixels);

    for (int i = 0; i < totalPixels; i += 4) {
      uint8_t r = imageData[i];
      uint8_t g = imageData[i + 1];
      uint8_t b = imageData[i + 2];

      // 灰度转换公式
      uint8_t gray = (uint8_t)(0.299 * r + 0.587 * g + 0.114 * b);

      result[i] = gray;     // R
      result[i + 1] = gray; // G
      result[i + 2] = gray; // B
      result[i + 3] = imageData[i + 3]; // Alpha
    }

    return result;
  }

  EMSCRIPTEN_KEEPALIVE
  uint8_t* apply_gaussian_blur(uint8_t* imageData, int width, int height, float sigma) {
    int totalPixels = width * height * 4;
    uint8_t* result = (uint8_t*)malloc(totalPixels);

    // 简化的高斯模糊实现
    const int kernelSize = 5;
    float kernel[kernelSize][kernelSize] = {
      {1, 4, 7, 4, 1},
      {4, 16, 26, 16, 4},
      {7, 26, 41, 26, 7},
      {4, 16, 26, 16, 4},
      {1, 4, 7, 4, 1}
    };

    float kernelSum = 273.0f; // 核值总和

    for (int y = 0; y < height; y++) {
      for (int x = 0; x < width; x++) {
        for (int channel = 0; channel < 4; channel++) {
          float sum = 0.0f;

          for (int ky = -2; ky <= 2; ky++) {
            for (int kx = -2; kx <= 2; kx++) {
              int px = std::min(std::max(x + kx, 0), width - 1);
              int py = std::min(std::max(y + ky, 0), height - 1);

              int pixelIndex = (py * width + px) * 4 + channel;
              float weight = kernel[ky + 2][kx + 2] / kernelSum;

              sum += imageData[pixelIndex] * weight;
            }
          }

          int resultIndex = (y * width + x) * 4 + channel;
          result[resultIndex] = (uint8_t)std::min(std::max(sum, 0.0f), 255.0f);
        }
      }
    }

    return result;
  }
}

EMSCRIPTEN_BINDINGS(image_processing) {
  emscripten::function("apply_grayscale_filter", &apply_grayscale_filter);
  emscripten::function("apply_gaussian_blur", &apply_gaussian_blur);
}
```

### 科学计算与数据分析

```javascript
// applications/scientific-computing.js
import { wasmLoader } from '../lib/wasm-loader.js'
import { WASMDataExchange } from '../lib/wasm-data-exchange.js'

export class ScientificComputing {
  constructor() {
    this.module = null
    this.initialized = false
  }

  async initialize() {
    this.module = await wasmLoader.loadWASMModule(
      'scientific',
      '../wasm/scientific.wasm',
      '../wasm/scientific.js'
    )
    this.exchange = new WASMDataExchange(this.module)
    this.initialized = true
  }

  // 快速傅里叶变换
  async fft(signalData) {
    await this.ensureInitialized()

    const signalInfo = this.exchange.transferArrayToWASM(signalData, 'float')

    try {
      const resultPtr = this.module._fft_transform(
        signalInfo.ptr,
        signalInfo.length
      )
      const result = this.exchange.retrieveArrayFromWASM(
        resultPtr,
        signalInfo.length,
        'float'
      )

      // 转换为复数表示 [real, imag, real, imag, ...]
      const complexResult = []
      for (let i = 0; i < result.length; i += 2) {
        complexResult.push({
          real: result[i],
          imag: result[i + 1],
        })
      }

      return complexResult
    } finally {
      this.exchange.cleanup()
    }
  }

  // 数值积分
  async numericalIntegration(fn, a, b, steps = 1000) {
    await this.ensureInitialized()

    // 使用梯形法则进行数值积分
    const stepSize = (b - a) / steps
    const xValues = []

    for (let i = 0; i <= steps; i++) {
      xValues.push(a + i * stepSize)
    }

    const xInfo = this.exchange.transferArrayToWASM(xValues, 'float')

    try {
      const result = this.module._trapezoidal_integral(
        xInfo.ptr,
        xInfo.length,
        stepSize
      )
      return result
    } finally {
      this.exchange.free(xInfo.ptr)
    }
  }

  // 线性回归分析
  async linearRegression(xData, yData) {
    await this.ensureInitialized()

    const xInfo = this.exchange.transferArrayToWASM(xData, 'float')
    const yInfo = this.exchange.transferArrayToWASM(yData, 'float')

    try {
      const resultPtr = this.module._linear_regression(
        xInfo.ptr,
        yInfo.ptr,
        xInfo.length
      )

      const result = this.exchange.retrieveArrayFromWASM(resultPtr, 2, 'float')

      return {
        slope: result[0],
        intercept: result[1],
      }
    } finally {
      this.exchange.cleanup()
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize()
    }
  }
}
```

## 性能监控与调试

### WASM 性能分析工具

```javascript
// lib/wasm-performance.js
import { performance, PerformanceObserver } from 'perf_hooks'

export class WASMPerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.observer = new PerformanceObserver((list) => {
      this.processPerformanceEntries(list.getEntries())
    })

    this.startMonitoring()
  }

  startMonitoring() {
    this.observer.observe({ entryTypes: ['measure', 'function'] })
  }

  // 包装 WASM 函数调用以进行性能监控
  instrumentWASMFunction(moduleName, functionName, wasmFunction) {
    return async (...args) => {
      const startMark = `wasm-${moduleName}-${functionName}-start`
      const endMark = `wasm-${moduleName}-${functionName}-end`
      const measureName = `wasm-${moduleName}-${functionName}`

      performance.mark(startMark)

      try {
        const result = await wasmFunction(...args)
        performance.mark(endMark)
        performance.measure(measureName, startMark, endMark)

        this.recordSuccess(moduleName, functionName)
        return result
      } catch (error) {
        performance.mark(endMark)
        performance.measure(measureName, startMark, endMark)

        this.recordError(moduleName, functionName, error)
        throw error
      }
    }
  }

  processPerformanceEntries(entries) {
    entries.forEach((entry) => {
      if (entry.name.startsWith('wasm-')) {
        const [_, moduleName, functionName] = entry.name.split('-')

        if (!this.metrics.has(moduleName)) {
          this.metrics.set(moduleName, new Map())
        }

        const moduleMetrics = this.metrics.get(moduleName)

        if (!moduleMetrics.has(functionName)) {
          moduleMetrics.set(functionName, {
            callCount: 0,
            totalTime: 0,
            averageTime: 0,
            minTime: Infinity,
            maxTime: 0,
            errorCount: 0,
            successCount: 0,
          })
        }

        const metrics = moduleMetrics.get(functionName)
        metrics.callCount++
        metrics.totalTime += entry.duration
        metrics.averageTime = metrics.totalTime / metrics.callCount
        metrics.minTime = Math.min(metrics.minTime, entry.duration)
        metrics.maxTime = Math.max(metrics.maxTime, entry.duration)
      }
    })
  }

  recordSuccess(moduleName, functionName) {
    this.updateMetrics(moduleName, functionName, 'success')
  }

  recordError(moduleName, functionName, error) {
    this.updateMetrics(moduleName, functionName, 'error')
    console.error(`WASM 函数调用错误 [${moduleName}.${functionName}]:`, error)
  }

  updateMetrics(moduleName, functionName, type) {
    if (!this.metrics.has(moduleName)) {
      this.metrics.set(moduleName, new Map())
    }

    const moduleMetrics = this.metrics.get(moduleName)

    if (!moduleMetrics.has(functionName)) {
      moduleMetrics.set(functionName, {
        callCount: 0,
        totalTime: 0,
        averageTime: 0,
        minTime: Infinity,
        maxTime: 0,
        errorCount: 0,
        successCount: 0,
      })
    }

    const metrics = moduleMetrics.get(functionName)

    if (type === 'success') {
      metrics.successCount++
    } else if (type === 'error') {
      metrics.errorCount++
    }
  }

  // 生成性能报告
  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      modules: {},
    }

    for (const [moduleName, functions] of this.metrics) {
      report.modules[moduleName] = {}

      for (const [functionName, metrics] of functions) {
        report.modules[moduleName][functionName] = {
          ...metrics,
          successRate:
            metrics.callCount > 0
              ? (metrics.successCount / metrics.callCount) * 100
              : 0,
        }
      }
    }

    return report
  }

  // 识别性能瓶颈
  identifyBottlenecks() {
    const bottlenecks = []
    const report = this.generatePerformanceReport()

    for (const [moduleName, functions] of Object.entries(report.modules)) {
      for (const [functionName, metrics] of Object.entries(functions)) {
        if (metrics.averageTime > 100) {
          // 超过 100ms 认为是瓶颈
          bottlenecks.push({
            module: moduleName,
            function: functionName,
            averageTime: metrics.averageTime,
            callCount: metrics.callCount,
            severity: metrics.averageTime > 500 ? 'HIGH' : 'MEDIUM',
          })
        }
      }
    }

    return bottlenecks.sort((a, b) => b.averageTime - a.averageTime)
  }
}

export const wasmPerformance = new WASMPerformanceMonitor()
```
