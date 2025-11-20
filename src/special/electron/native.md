# Electron 集成 C++/Rust/NAPI

## 集成概述

Electron 与 C++/Rust/NAPI 的集成是现代桌面应用开发中的重要技术模式，它结合了 Web 技术的**快速开发能力**和系统级语言的**高性能优势**。这种集成模式允许开发者在 Electron 的渲染进程和主进程中直接调用原生代码，实现对计算密集型任务、硬件操作和现有原生库的深度集成。

集成架构的核心在于通过 **N-API** 建立 JavaScript 与原生代码之间的通信桥梁：

```
Electron 应用 (JavaScript/TypeScript)
    ↑↓ Node.js 绑定层
原生模块 (C++/Rust) ← N-API 接口
    ↑
系统资源 (硬件/文件系统/原生库)
```

这种架构既保持了 Electron 的跨平台特性，又突破了 Web 技术在性能上的限制，为开发高性能桌面应用提供了完美解决方案。

## N-API 核心技术

### N-API 架构解析

N-API 是 Node.js 提供的**稳定的抽象层**，它隔离了 JavaScript 运行时与原生模块的底层实现，确保原生模块在不同 Node.js 版本 (包括 Electron 内置的 Node.js) 中的二进制兼容性。

**N-API 在 Electron 中的层次结构：**

```
渲染进程 (JavaScript) ←→ 主进程 (Node.js)
                            ↑
                      N-API 抽象层
                            ↑
                      V8/Node.js ABI
                            ↑
                    原生模块 (.node 文件)
```

### 环境配置与工具链

```javascript
// scripts/napi-setup.js
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

class NAPISetup {
  constructor() {
    this.checkPrerequisites();
  }

  checkPrerequisites() {
    const prerequisites = {
      'node-gyp': this.checkCommand('node-gyp --version'),
      'Python 3.8+': this.checkCommand('python --version'),
      'C++ Build Tools': this.checkVisualStudio()
    };

    const missing = Object.entries(prerequisites)
      .filter(([, exists]) => !exists)
      .map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(`缺少必要的开发环境: ${missing.join(', ')}`);
    }
  }

  checkCommand(command) {
    try {
      execSync(command, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  checkVisualStudio() {
    if (process.platform !== 'win32') return true;
    
    try {
      execSync('where cl', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  createBindingConfig(moduleName) {
    const bindingGyp = {
      targets: [
        {
          target_name: moduleName,
          sources: [
            'src/addon.cpp',
            'src/native-wrapper.cpp'
          ],
          include_dirs: [
            '<!@(node -p "require(\\'node-addon-api\\').include")'
          ],
          dependencies: [
            '<!@(node -p "require(\\'node-addon-api\\').gyp")'
          ],
          defines: [
            'NAPI_DISABLE_CPP_EXCEPTIONS'
          ],
          cflags: ['-std=c++14'],
          conditions: [
            ['OS=="mac"', {
              'xcode_settings': {
                'OTHER_CPLUSPLUSFLAGS': ['-std=c++14', '-stdlib=libc++']
              }
            }]
          ]
        }
      ]
    };

    writeFileSync('binding.gyp', JSON.stringify(bindingGyp, null, 2));
    console.log('✅ binding.gyp 配置文件已生成');
  }

  async rebuildForElectron() {
    // 获取 Electron 的 Node.js 版本信息
    const electronVersion = process.versions.electron;
    const nodeVersion = process.versions.node;
    
    console.log(`🔨 为 Electron 重新编译原生模块...`);
    console.log(`   Electron: ${electronVersion}`);
    console.log(`   Node.js: ${nodeVersion}`);

    try {
      execSync(`npx electron-rebuild -v ${electronVersion} -n ${nodeVersion}`, {
        stdio: 'inherit'
      });
      console.log('✅ 原生模块编译成功');
    } catch (error) {
      console.error('❌ 编译失败:', error.message);
      throw error;
    }
  }
}

export const napiSetup = new NAPISetup();
```

### 基本 N-API 模块开发

```javascript
// native-module/src/addon.cpp
#include <napi.h>
#include <vector>
#include <thread>

// 简单的计算函数：斐波那契数列
int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// N-API 包装函数
Napi::Value CalculateFibonacci(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // 参数验证
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "需要参数 n").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (!info[0].IsNumber()) {
        Napi::TypeError::New(env, "参数 n 必须是数字").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int n = info[0].As<Napi::Number>().Int32Value();
    
    // 输入验证
    if (n < 0) {
        Napi::RangeError::New(env, "参数 n 不能为负数").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (n > 45) {
        Napi::RangeError::New(env, "参数 n 不能大于 45 (防止阻塞事件循环)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    // 调用原生函数
    int result = fibonacci(n);
    
    return Napi::Number::New(env, result);
}

// 异步工作结构体
struct FibonacciWorker : Napi::AsyncWorker {
    int n;
    int result;
    
    FibonacciWorker(Napi::Function& callback, int n)
        : Napi::AsyncWorker(callback), n(n), result(0) {}
    
    void Execute() override {
        // 在工作线程中执行计算，不会阻塞事件循环
        result = fibonacci(n);
    }
    
    void OnOK() override {
        Napi::HandleScope scope(Env());
        Callback().Call({ Env().Null(), Napi::Number::New(Env(), result) });
    }
};

// 异步版本斐波那契计算
Napi::Value CalculateFibonacciAsync(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "需要参数 n 和回调函数").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int n = info[0].As<Napi::Number>().Int32Value();
    Napi::Function callback = info[1].As<Napi::Function>();
    
    FibonacciWorker* worker = new FibonacciWorker(callback, n);
    worker->Queue();
    
    return env.Undefined();
}

// 模块初始化
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("calculateFibonacci", 
                Napi::Function::New(env, CalculateFibonacci));
    exports.Set("calculateFibonacciAsync", 
                Napi::Function::New(env, CalculateFibonacciAsync));
    return exports;
}

NODE_API_MODULE(native_module, Init)
```

## C++ 模块集成

### C++ 模块架构设计

C++ 与 Electron 的集成主要通过 **Node.js 原生插件**实现，这些插件编译为 `.node` 文件，可以直接在 Electron 进程中加载。

**C++ 模块加载流程：**

```
C++ 源代码 (.cpp) → node-gyp 编译 → 原生模块 (.node)
                                                    ↓
                                              require() 加载
                                                    ↓
                                           JavaScript 调用接口
```

### 完整 C++ 模块示例

```javascript
// native-module/src/advanced-calc.cpp
#include <napi.h>
#include <vector>
#include <algorithm>
#include <thread>
#include <chrono>

// 性能密集型计算：矩阵乘法
Napi::Value MatrixMultiply(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // 获取输入矩阵
    Napi::Array matrixA = info[0].As<Napi::Array>();
    Napi::Array matrixB = info[1].As<Napi::Array>();
    
    size_t rowsA = matrixA.Length();
    size_t colsA = matrixA.Get(0u).As<Napi::Array>().Length();
    size_t rowsB = matrixB.Length();
    size_t colsB = matrixB.Get(0u).As<Napi::Array>().Length();
    
    // 验证矩阵维度
    if (colsA != rowsB) {
        Napi::Error::New(env, "矩阵维度不匹配").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    // 创建结果矩阵
    Napi::Array result = Napi::Array::New(env, rowsA);
    
    // 执行矩阵乘法
    for (size_t i = 0; i < rowsA; i++) {
        Napi::Array row = matrixA.Get(i).As<Napi::Array>();
        Napi::Array resultRow = Napi::Array::New(env, colsB);
        
        for (size_t j = 0; j < colsB; j++) {
            double sum = 0.0;
            
            for (size_t k = 0; k < colsA; k++) {
                double a = row.Get(k).As<Napi::Number>().DoubleValue();
                Napi::Array bRow = matrixB.Get(k).As<Napi::Array>();
                double b = bRow.Get(j).As<Napi::Number>().DoubleValue();
                sum += a * b;
            }
            
            resultRow.Set(j, Napi::Number::New(env, sum));
        }
        
        result.Set(i, resultRow);
    }
    
    return result;
}

// 图像处理：简单的灰度转换
Napi::Value ConvertToGrayscale(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    Napi::Uint8Array imageData = info[0].As<Napi::Uint8Array>();
    size_t width = info[1].As<Napi::Number>().Uint32Value();
    size_t height = info[2].As<Napi::Number>().Uint32Value();
    
    uint8_t* data = imageData.Data();
    size_t dataLength = imageData.ElementLength();
    
    // 处理图像数据 (RGBA 转灰度)
    for (size_t i = 0; i < dataLength; i += 4) {
        uint8_t r = data[i];
        uint8_t g = data[i + 1];
        uint8_t b = data[i + 2];
        
        // 灰度公式
        uint8_t gray = static_cast<uint8_t>(0.299 * r + 0.587 * g + 0.114 * b);
        
        data[i] = gray;     // R
        data[i + 1] = gray; // G
        data[i + 2] = gray; // B
        // A 通道保持不变
    }
    
    return imageData;
}

// 初始化函数
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("matrixMultiply", 
                Napi::Function::New(env, MatrixMultiply));
    exports.Set("convertToGrayscale", 
                Napi::Function::New(env, ConvertToGrayscale));
    return exports;
}

NODE_API_MODULE(advanced_calc, Init)
```

### C++ 模块的 Electron 集成

```javascript
// lib/native-module-loader.js
import { contextBridge, ipcRenderer } from 'electron';

class NativeModuleLoader {
  constructor() {
    this.modules = new Map();
    this.init();
  }

  async init() {
    // 安全地加载原生模块
    try {
      // 主进程编译的原生模块
      const nativeAddon = await this.loadSecureModule('advanced-calc');
      this.modules.set('calculator', nativeAddon);
      
      console.log('✅ 原生模块加载成功');
    } catch (error) {
      console.error('❌ 原生模块加载失败:', error);
      this.fallbackToJavaScript();
    }
  }

  async loadSecureModule(moduleName) {
    // 在生产环境中，通过主进程验证模块完整性
    if (process.env.NODE_ENV === 'production') {
      const isVerified = await ipcRenderer.invoke('verify-native-module', moduleName);
      if (!isVerified) {
        throw new Error(`模块 ${moduleName} 验证失败`);
      }
    }
    
    // 动态导入原生模块
    const modulePath = `./build/Release/${moduleName}.node`;
    return require(modulePath);
  }

  fallbackToJavaScript() {
    console.warn('⚠️ 使用 JavaScript 回退实现');
    
    // JavaScript 回退实现
    this.modules.set('calculator', {
      matrixMultiply: (matrixA, matrixB) => {
        // JavaScript 实现的矩阵乘法（性能较低）
        const rowsA = matrixA.length;
        const colsA = matrixA[0].length;
        const colsB = matrixB[0].length;
        const result = [];
        
        for (let i = 0; i < rowsA; i++) {
          result[i] = [];
          for (let j = 0; j < colsB; j++) {
            let sum = 0;
            for (let k = 0; k < colsA; k++) {
              sum += matrixA[i][k] * matrixB[k][j];
            }
            result[i][j] = sum;
          }
        }
        
        return result;
      },
      
      convertToGrayscale: (imageData, width, height) => {
        // JavaScript 实现的灰度转换
        const data = new Uint8Array(imageData);
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        return data;
      }
    });
  }

  getModule(name) {
    return this.modules.get(name);
  }
}

// 暴露安全的 API 到渲染进程
const loader = new NativeModuleLoader();

contextBridge.exposeInMainWorld('nativeModules', {
  getCalculator: () => loader.getModule('calculator'),
  isNativeAvailable: () => loader.modules.has('calculator')
});
```

## Rust 语言集成

### Rust 与 N-API 集成架构

Rust 通过 **napi-rs** 框架与 Electron 集成，提供了内存安全和零成本抽象的优势。

**Rust 集成架构：**

```
Rust 代码 → napi-rs 绑定 → Node.js 兼容模块
                                          ↓
                                    Electron 应用
```

### napi-rs 项目配置

```javascript
// rust-module/Cargo.toml
[package]
name = "electron-rust-module"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
napi = "2.0"
napi-derive = "2.0"
tokio = { version = "1.0", features = ["full"] }
image = "0.24.0"

[build-dependencies]
napi-build = "1.0"

[package.metadata.napi]
name = "electron_rust_module"
```

```javascript
// rust-module/build.rs
fn main() {
    napi_build::setup();
}
```

### Rust 模块实现

```rust
// rust-module/src/lib.rs
use napi_derive::napi;
use napi::{bindgen_prelude::*, JsUint8Array, JsUnknown};
use image::{ImageBuffer, Rgba};
use std::convert::TryInto;

// 高性能计算：并行图像处理
#[napi]
fn process_image_async(
  image_data: JsUint8Array,
  width: u32,
  height: u32,
  callback: napi::JsFunction,
) -> Result<()> {
  let data = image_data.into_value()?;
  
  napi::bindgen_prelude::spawn(async move {
    // 在 Tokio 运行时中处理图像
    let result = process_image_internal(&data, width, height).await;
    
    // 回调 JavaScript
    let callback_result = callback.call(None, &[result]);
    if let Err(e) = callback_result {
      eprintln!("回调调用失败: {}", e);
    }
  });
  
  Ok(())
}

async fn process_image_internal(data: &[u8], width: u32, height: u32) -> JsUnknown {
  // 使用 image crate 处理图像
  if let Ok(img) = ImageBuffer::<Rgba<u8>, _>::from_raw(width, height, data.to_vec()) {
    // 应用图像处理算法（示例：反转颜色）
    let processed: ImageBuffer<Rgba<u8>, Vec<u8>> = img
      .pixels()
      .map(|p| Rgba([255 - p[0], 255 - p[1], 255 - p[2], p[3]]))
      .collect::<Vec<_>>()
      .try_into()
      .unwrap();
    
    // 转换回 JavaScript 可用的格式
    let result_data = processed.into_raw();
    napi::Env::from_raw(unsafe { napi::sys::napi_env::default() })
      .create_uint8_array(result_data)
      .unwrap()
      .into_unknown()
  } else {
    napi::Env::from_raw(unsafe { napi::sys::napi_env::default() })
      .get_undefined()
      .unwrap()
      .into_unknown()
  }
}

// CPU 密集型计算：物理模拟
#[napi]
fn physics_simulation(particles: u32, steps: u32) -> u32 {
  let mut result = 0u32;
  
  // 简化的物理模拟计算
  for step in 0..steps {
    for particle in 0..particles {
      // 模拟一些计算密集型操作
      result = result.wrapping_add(step.wrapping_mul(particle));
    }
  }
  
  result
}

// 结构体示例
#[napi]
struct DataProcessor {
  multiplier: f64,
}

#[napi]
impl DataProcessor {
  #[napi(constructor)]
  pub fn new(multiplier: f64) -> Self {
    DataProcessor { multiplier }
  }
  
  #[napi]
  pub fn process(&self, data: Vec<f64>) -> Vec<f64> {
    data.into_iter()
      .map(|x| x * self.multiplier)
      .collect()
  }
  
  #[napi]
  pub fn process_async(&self, data: Vec<f64>) -> napi::bindgen_prelude::Promise<Vec<f64>> {
    let multiplier = self.multiplier;
    
    napi::bindgen_prelude::Promise::new(move |resolve, _| {
      napi::bindgen_prelude::spawn(async move {
        // 异步处理
        let result: Vec<f64> = data.into_iter()
          .map(|x| x * multiplier)
          .collect();
        resolve.resolve(Ok(result));
      });
    })
  }
}

// 模块初始化
#[napi]
pub fn init() -> napi::Result<()> {
  Ok(())
}
```

### Rust 模块的 Electron 包装器

```javascript
// lib/rust-module-adapter.js
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

class RustModuleAdapter {
  constructor() {
    this.module = null;
    this.isInitialized = false;
    this.__dirname = dirname(fileURLToPath(import.meta.url));
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // 动态导入 Rust 模块
      const modulePath = join(this.__dirname, '../rust-module/index.node');
      this.module = await import(modulePath);
      
      // 初始化模块
      await this.module.init();
      this.isInitialized = true;
      
      console.log('✅ Rust 模块初始化成功');
    } catch (error) {
      console.error('❌ Rust 模块初始化失败:', error);
      throw error;
    }
  }

  async processImage(imageData, width, height) {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      this.module.processImageAsync(imageData, width, height, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  physicsSimulation(particles, steps) {
    if (!this.isInitialized) {
      throw new Error('Rust 模块未初始化');
    }
    return this.module.physicsSimulation(particles, steps);
  }

  createDataProcessor(multiplier) {
    if (!this.isInitialized) {
      throw new Error('Rust 模块未初始化');
    }
    return new this.module.DataProcessor(multiplier);
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

// 单例实例
export const rustModule = new RustModuleAdapter();

// 在预加载脚本中安全暴露
export function exposeRustModule() {
  contextBridge.exposeInMainWorld('rustModule', {
    processImage: (imageData, width, height) => 
      rustModule.processImage(imageData, width, height),
    physicsSimulation: (particles, steps) => 
      rustModule.physicsSimulation(particles, steps),
    createDataProcessor: (multiplier) => 
      rustModule.createDataProcessor(multiplier),
    isAvailable: () => rustModule.isInitialized
  });
}
```

## 高级集成模式

### 多线程与异步处理

```javascript
// lib/thread-manager.js
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

class NativeThreadManager {
  constructor() {
    this.workers = new Map();
    this.taskQueue = new Map();
  }

  // 创建专用工作线程
  createWorker(moduleName, taskType) {
    const worker = new Worker(new URL('./native-worker.js', import.meta.url), {
      workerData: { moduleName, taskType },
      stdout: true,
      stderr: true
    });

    const workerId = `${moduleName}-${taskType}-${Date.now()}`;
    this.workers.set(workerId, worker);

    worker.on('message', (result) => {
      this.handleWorkerResult(workerId, result);
    });

    worker.on('error', (error) => {
      console.error(`工作线程 ${workerId} 错误:`, error);
      this.workers.delete(workerId);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.warn(`工作线程 ${workerId} 退出，代码: ${code}`);
      }
      this.workers.delete(workerId);
    });

    return workerId;
  }

  // 提交任务到工作线程
  async submitTask(workerId, taskData, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const timeoutId = setTimeout(() => {
        reject(new Error(`任务 ${taskId} 执行超时`));
        this.taskQueue.delete(taskId);
      }, timeout);

      this.taskQueue.set(taskId, { resolve, reject, timeoutId });

      const worker = this.workers.get(workerId);
      if (!worker) {
        reject(new Error(`工作线程 ${workerId} 不存在`));
        return;
      }

      worker.postMessage({ taskId, data: taskData });
    });
  }

  handleWorkerResult(workerId, result) {
    const { taskId, data, error } = result;
    const task = this.taskQueue.get(taskId);

    if (!task) {
      console.warn(`未知任务 ID: ${taskId}`);
      return;
    }

    clearTimeout(task.timeoutId);
    this.taskQueue.delete(taskId);

    if (error) {
      task.reject(new Error(error));
    } else {
      task.resolve(data);
    }
  }

  // 优雅关闭所有工作线程
  async shutdown() {
    const shutdownPromises = Array.from(this.workers.values()).map(worker => {
      return new Promise(resolve => {
        worker.once('exit', () => resolve());
        worker.postMessage({ type: 'shutdown' });
        
        // 强制终止（如果 5 秒内没有正常退出）
        setTimeout(() => {
          if (worker.threadId) {
            worker.terminate();
          }
          resolve();
        }, 5000);
      });
    });

    await Promise.all(shutdownPromises);
    this.workers.clear();
    this.taskQueue.clear();
    
    console.log('✅ 所有工作线程已关闭');
  }
}

export const threadManager = new NativeThreadManager();
```

```javascript
// lib/native-worker.js
import { workerData, parentPort, isMainThread } from 'worker_threads';
import { rustModule } from './rust-module-adapter.js';
import { nativeModuleLoader } from './native-module-loader.js';

class NativeWorker {
  constructor(moduleName, taskType) {
    this.moduleName = moduleName;
    this.taskType = taskType;
    this.isShuttingDown = false;
    this.initialize();
  }

  async initialize() {
    try {
      // 初始化相应的原生模块
      if (this.moduleName === 'rust') {
        await rustModule.initialize();
      } else if (this.moduleName === 'cpp') {
        await nativeModuleLoader.init();
      }
      
      console.log(`✅ 工作线程初始化完成: ${this.moduleName}-${this.taskType}`);
    } catch (error) {
      console.error('工作线程初始化失败:', error);
      process.exit(1);
    }
  }

  async processTask(taskData) {
    if (this.isShuttingDown) {
      throw new Error('工作线程正在关闭');
    }

    try {
      switch (this.taskType) {
        case 'image-processing':
          return await this.processImageTask(taskData);
        
        case 'physics-simulation':
          return await this.processPhysicsTask(taskData);
        
        case 'matrix-calculation':
          return await this.processMatrixTask(taskData);
        
        default:
          throw new Error(`未知任务类型: ${this.taskType}`);
      }
    } catch (error) {
      console.error(`任务处理失败:`, error);
      throw error;
    }
  }

  async processImageTask({ imageData, width, height, operation }) {
    if (this.moduleName === 'rust') {
      const processor = rustModule.createDataProcessor(1.0);
      const processedData = await processor.process_async(Array.from(imageData));
      return new Uint8Array(processedData);
    } else {
      const calculator = nativeModuleLoader.getModule('calculator');
      return calculator.convertToGrayscale(imageData, width, height);
    }
  }

  async processPhysicsTask({ particles, steps }) {
    if (this.moduleName === 'rust') {
      return rustModule.physicsSimulation(particles, steps);
    } else {
      // 回退到 JavaScript 实现
      let result = 0;
      for (let step = 0; step < steps; step++) {
        for (let particle = 0; particle < particles; particle++) {
          result += step * particle;
        }
      }
      return result;
    }
  }

  async processMatrixTask({ matrixA, matrixB }) {
    const calculator = nativeModuleLoader.getModule('calculator');
    return calculator.matrixMultiply(matrixA, matrixB);
  }
}

// 工作线程主逻辑
if (!isMainThread) {
  const worker = new NativeWorker(workerData.moduleName, workerData.taskType);

  parentPort.on('message', async (message) => {
    if (message.type === 'shutdown') {
      worker.isShuttingDown = true;
      return;
    }

    const { taskId, data } = message;

    try {
      const result = await worker.processTask(data);
      parentPort.postMessage({ taskId, data: result });
    } catch (error) {
      parentPort.postMessage({ 
        taskId, 
        error: error.message 
      });
    }
  });
}
```

### 性能监控与优化

```javascript
// lib/performance-monitor.js
import { performance, PerformanceObserver } from 'perf_hooks';

class NativeModulePerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observer = new PerformanceObserver((list) => {
      this.processMetrics(list.getEntries());
    });
    
    this.startMonitoring();
  }

  startMonitoring() {
    this.observer.observe({ entryTypes: ['measure', 'function'] });
  }

  // 包装原生函数调用以进行性能监控
  instrumentNativeFunction(moduleName, functionName, nativeFunction) {
    return async (...args) => {
      const startMark = `${moduleName}.${functionName}-start`;
      const endMark = `${moduleName}.${functionName}-end`;
      const measureName = `${moduleName}.${functionName}`;

      performance.mark(startMark);

      try {
        const result = await nativeFunction(...args);
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
        
        this.recordSuccess(moduleName, functionName);
        return result;
      } catch (error) {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
        
        this.recordError(moduleName, functionName, error);
        throw error;
      }
    };
  }

  processMetrics(entries) {
    entries.forEach(entry => {
      const [moduleName, functionName] = entry.name.split('.');
      
      if (!this.metrics.has(moduleName)) {
        this.metrics.set(moduleName, new Map());
      }
      
      const moduleMetrics = this.metrics.get(moduleName);
      
      if (!moduleMetrics.has(functionName)) {
        moduleMetrics.set(functionName, {
          callCount: 0,
          totalTime: 0,
          averageTime: 0,
          errorCount: 0,
          successCount: 0
        });
      }
      
      const metrics = moduleMetrics.get(functionName);
      metrics.callCount++;
      metrics.totalTime += entry.duration;
      metrics.averageTime = metrics.totalTime / metrics.callCount;
    });
  }

  recordSuccess(moduleName, functionName) {
    this.updateMetrics(moduleName, functionName, 'success');
  }

  recordError(moduleName, functionName, error) {
    this.updateMetrics(moduleName, functionName, 'error');
    console.error(`原生函数调用错误 [${moduleName}.${functionName}]:`, error);
  }

  updateMetrics(moduleName, functionName, type) {
    if (!this.metrics.has(moduleName)) {
      this.metrics.set(moduleName, new Map());
    }
    
    const moduleMetrics = this.metrics.get(moduleName);
    
    if (!moduleMetrics.has(functionName)) {
      moduleMetrics.set(functionName, {
        callCount: 0,
        totalTime: 0,
        averageTime: 0,
        errorCount: 0,
        successCount: 0
      });
    }
    
    const metrics = moduleMetrics.get(functionName);
    
    if (type === 'success') {
      metrics.successCount++;
    } else if (type === 'error') {
      metrics.errorCount++;
    }
  }

  // 生成性能报告
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      modules: {}
    };

    for (const [moduleName, functions] of this.metrics) {
      report.modules[moduleName] = {};
      
      for (const [functionName, metrics] of functions) {
        report.modules[moduleName][functionName] = {
          ...metrics,
          successRate: metrics.callCount > 0 ? 
            (metrics.successCount / metrics.callCount) * 100 : 0
        };
      }
    }

    return report;
  }

  // 检查性能问题
  checkPerformanceIssues() {
    const issues = [];
    const report = this.generateReport();

    for (const [moduleName, functions] of Object.entries(report.modules)) {
      for (const [functionName, metrics] of Object.entries(functions)) {
        // 检查平均执行时间是否过长
        if (metrics.averageTime > 1000) { // 1秒
          issues.push({
            type: 'PERFORMANCE',
            module: moduleName,
            function: functionName,
            message: `函数执行时间过长: ${metrics.averageTime.toFixed(2)}ms`,
            severity: 'WARNING'
          });
        }

        // 检查错误率是否过高
        if (metrics.successRate < 90) {
          issues.push({
            type: 'RELIABILITY',
            module: moduleName,
            function: functionName,
            message: `函数错误率过高: ${(100 - metrics.successRate).toFixed(2)}%`,
            severity: 'ERROR'
          });
        }
      }
    }

    return issues;
  }
}

export const performanceMonitor = new NativeModulePerformanceMonitor();
```

## 安全最佳实践

### 安全的模块加载

```javascript
// lib/secure-module-loader.js
import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';

class SecureModuleLoader {
  constructor() {
    this.trustedHashes = new Map();
    this.loadTrustedHashes();
  }

  loadTrustedHashes() {
    // 加载受信任的模块哈希值
    try {
      const hashes = JSON.parse(
        readFileSync(join(__dirname, '../trusted-modules.json'), 'utf-8')
      );
      
      this.trustedHashes = new Map(Object.entries(hashes));
    } catch (error) {
      console.warn('无法加载受信任模块列表，使用空列表');
      this.trustedHashes = new Map();
    }
  }

  // 验证模块完整性
  verifyModuleIntegrity(modulePath) {
    try {
      const fileStats = statSync(modulePath);
      const fileBuffer = readFileSync(modulePath);
      
      // 计算哈希值
      const hash = createHash('sha256').update(fileBuffer).digest('hex');
      const expectedHash = this.trustedHashes.get(modulePath);
      
      if (!expectedHash) {
        console.warn(`模块 ${modulePath} 不在受信任列表中`);
        return false;
      }
      
      if (hash !== expectedHash) {
        console.error(`模块 ${modulePath} 哈希值不匹配`);
        return false;
      }
      
      console.log(`✅ 模块 ${modulePath} 验证成功`);
      return true;
      
    } catch (error) {
      console.error(`模块验证失败:`, error);
      return false;
    }
  }

  // 安全加载模块
  async loadSecureModule(modulePath, fallbackImplementation = null) {
    // 在生产环境中验证模块完整性
    if (process.env.NODE_ENV === 'production') {
      const isVerified = this.verifyModuleIntegrity(modulePath);
      
      if (!isVerified) {
        console.warn(`⚠️ 模块验证失败，使用回退实现`);
        
        if (fallbackImplementation) {
          return fallbackImplementation;
        } else {
          throw new Error(`模块验证失败且无回退实现`);
        }
      }
    }
    
    // 动态导入模块
    try {
      const module = await import(modulePath);
      return module;
    } catch (error) {
      console.error(`模块加载失败:`, error);
      
      if (fallbackImplementation) {
        return fallbackImplementation;
      } else {
        throw error;
      }
    }
  }

  // 添加新的受信任模块
  addTrustedModule(modulePath, expectedHash = null) {
    if (!expectedHash) {
      const fileBuffer = readFileSync(modulePath);
      expectedHash = createHash('sha256').update(fileBuffer).digest('hex');
    }
    
    this.trustedHashes.set(modulePath, expectedHash);
    
    // 更新受信任模块文件
    this.saveTrustedHashes();
  }

  saveTrustedHashes() {
    const hashesObject = Object.fromEntries(this.trustedHashes);
    writeFileSync(
      join(__dirname, '../trusted-modules.json'),
      JSON.stringify(hashesObject, null, 2)
    );
  }
}

export const secureModuleLoader = new SecureModuleLoader();
```

### 进程间通信安全

```javascript
// lib/secure-ipc.js
import { ipcMain, ipcRenderer } from 'electron';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';

class SecureIPC {
  constructor() {
    this.sessionKey = null;
    this.initialized = false;
  }

  // 初始化安全会话
  async initializeSecureSession() {
    if (this.initialized) return;

    // 生成会话密钥
    this.sessionKey = randomBytes(32);
    
    if (typeof ipcMain !== 'undefined') {
      // 主进程：等待渲染进程连接
      this.setupMainProcessSecurity();
    } else {
      // 渲染进程：请求会话密钥
      await this.setupRendererProcessSecurity();
    }
    
    this.initialized = true;
  }

  setupMainProcessSecurity() {
    ipcMain.handle('secure-session-request', (event) => {
      // 验证渲染进程来源
      const senderUrl = new URL(event.senderFrame.url);
      if (senderUrl.origin !== 'file://' && !senderUrl.hostname.endsWith('.trusted.com')) {
        event.senderFrame.send('secure-session-error', '未授权的来源');
        return null;
      }
      
      // 发送加密的会话密钥
      return this.encryptData(this.sessionKey.toString('hex'));
    });
  }

  async setupRendererProcessSecurity() {
    try {
      const encryptedKey = await ipcRenderer.invoke('secure-session-request');
      const decryptedKey = this.decryptData(encryptedKey);
      this.sessionKey = Buffer.from(decryptedKey, 'hex');
      
      console.log('✅ 安全会话已建立');
    } catch (error) {
      console.error('安全会话建立失败:', error);
      throw error;
    }
  }

  // 加密数据
  encryptData(data) {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.sessionKey, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      data: encrypted,
      authTag: authTag.toString('hex')
    };
  }

  // 解密数据
  decryptData(encryptedData) {
    const { iv, data, authTag } = encryptedData;
    
    const decipher = createDecipheriv(
      'aes-256-gcm', 
      this.sessionKey, 
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // 安全地调用原生函数
  async secureNativeCall(moduleName, functionName, ...args) {
    await this.ensureInitialized();

    const request = {
      module: moduleName,
      function: functionName,
      args: args,
      timestamp: Date.now(),
      nonce: randomBytes(16).toString('hex')
    };

    // 加密请求
    const encryptedRequest = this.encryptData(request);

    try {
      // 通过安全的 IPC 发送请求
      const encryptedResponse = await ipcRenderer.invoke(
        'secure-native-call', 
        encryptedRequest
      );
      
      // 解密响应
      const response = this.decryptData(encryptedResponse);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.result;
    } catch (error) {
      console.error(`安全原生调用失败 [${moduleName}.${functionName}]:`, error);
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeSecureSession();
    }
  }
}

export const secureIPC = new SecureIPC();
```

通过系统化的架构设计和严格的安全实践，C++/Rust/NAPI 与 Electron 的集成能够为桌面应用带来显著的性能提升和功能扩展，同时确保应用的稳定性和安全性。