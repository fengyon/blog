# ONNX

## 概述与核心价值

ONNX (Open Neural Network Exchange) 是一个开放的深度学习模型格式标准，它允许模型在不同的深度学习框架之间进行转换和共享。ONNX 由微软和 Facebook 于 2017 年共同推出，旨在促进不同深度学习框架之间的模型交换和互操作性。如今，ONNX 已经成为表示深度学习模型的实际标准，它还支持传统非神经网络机器学习模型，有望成为整个 AI 模型交换的标准。

**核心价值示意图：**

```
多个训练框架 → ONNX 统一格式 → 多种部署环境
   ↓                    ↓               ↓
PyTorch            .onnx 文件      ONNX Runtime
TensorFlow                          TensorRT
MXNet                              Mobile Device
```

## 核心架构与组件

ONNX 生态系统由多个核心组件构成，每个组件在模型生命周期中扮演着特定角色。这些组件共同提供了从模型转换到推理部署的完整工具链。

**架构示意图：**

```
[训练框架] → [ONNX 转换器] → [ONNX 模型] → [ONNX Runtime] → [推理结果]
   ↓              ↓              ↓            ↓            ↓
PyTorch       torch.onnx    计算图表    跨平台引擎    预测输出
TensorFlow    tf2onnx      节点/边     硬件加速
```

### 主要组件说明

- **ONNX 模型格式**：由计算图 (Graph) 组成，包含节点 (Nodes)、输入输出 (Inputs/Outputs) 和初始值 (Initializers)
- **ONNX Runtime**：一个高性能推理引擎，用于执行 ONNX 模型
- **ONNX Converter**：用于将不同框架的模型转换为 ONNX 格式

## ONNX 模型结构

ONNX 使用计算图来表示神经网络模型，这种抽象使得模型可以独立于具体的训练框架和硬件平台。

**模型结构示意图：**

```
ONNX 模型
    ↓
计算图 (Graph)
    ├── 输入 (Inputs)
    ├── 节点 (Nodes) - 运算符/操作
    ├── 输出 (Outputs)
    └── 初始值 (Initializers) - 权重参数
```

每个计算节点代表一个操作 (如卷积、矩阵乘法等)，节点之间的边表示数据流。ONNX 定义了一组与环境和平台无关的标准格式，使得 AI 模型可以在不同的框架和环境下交互使用。

## ONNX Runtime JavaScript API

ONNX Runtime JavaScript API 是一个统一的 API，适用于所有 JavaScript 用法。它提供了在浏览器、Node.js 和 React Native 环境中运行 ONNX 模型的能力。

### 环境安装与配置

**安装命令：**

```bash
# 安装最新发布版本
npm install onnxruntime-web

# 安装夜间构建的开发版本
npm install onnxruntime-web@dev
```

**ESM 导入方式：**

```javascript
// 标准导入（推荐）
import * as ort from 'onnxruntime-web'

// WebGPU 支持（实验性功能）
import * as ort from 'onnxruntime-web/webgpu'

// WebNN 支持（实验性功能）
import * as ort from 'onnxruntime-web/experimental'
```

## 核心 API 使用示例

### 张量操作 API

张量是 ONNX 中的基本数据结构，代表多维数组。在 JavaScript 中，张量操作是模型推理的基础。

```javascript
import * as ort from 'onnxruntime-web'

// 创建张量
const createTensors = () => {
  // 从数组创建张量
  const data = Float32Array.from([1, 2, 3, 4, 5, 6])
  const tensor = new ort.Tensor('float32', data, [2, 3])

  console.log(`张量形状: [${tensor.dims}]`)
  console.log(`数据类型: ${tensor.type}`)
  console.log(`数据值: ${Array.from(tensor.data)}`)

  return tensor
}

// 张量运算示例
const tensorOperations = async () => {
  const a = new ort.Tensor('float32', Float32Array.from([1, 2, 3]), [3])
  const b = new ort.Tensor('float32', Float32Array.from([4, 5, 6]), [3])

  // 在实际应用中，张量运算通常通过模型推理进行
  // 这里演示如何准备输入数据
  const inputs = {
    input1: a,
    input2: b,
  }

  return inputs
}
```

### 推理会话管理

InferenceSession 是 ONNX Runtime 的核心类，负责模型加载和执行推理。

```javascript
import * as ort from 'onnxruntime-web'

class ONNXModel {
  constructor() {
    this.session = null
  }

  // 加载模型
  async loadModel(modelUrl) {
    try {
      const options = {
        executionProviders: ['wasm'], // 使用 WebAssembly 后端
        graphOptimizationLevel: 'all', // 启用所有图优化
      }

      this.session = await ort.InferenceSession.create(modelUrl, options)

      // 输出模型元信息
      const modelMeta = this.session.sessionOptions
      console.log('模型会话已创建', modelMeta)

      return this.session
    } catch (error) {
      console.error('模型加载失败:', error)
      throw error
    }
  }

  // 获取模型输入输出信息
  getModelInfo() {
    if (!this.session) {
      throw new Error('会话未初始化')
    }

    const inputs = this.session.inputNames
    const outputs = this.session.outputNames

    console.log('模型输入:', inputs)
    console.log('模型输出:', outputs)

    inputs.forEach((name, index) => {
      const input = this.session.inputs.get(name)
      console.log(`输入 ${index}: ${name}, 形状: [${input.dims}]`)
    })

    return { inputs, outputs }
  }
}
```

### 模型推理执行

```javascript
// 继续 ONNXModel 类

async runInference(inputData) {
    if (!this.session) {
        throw new Error('会话未初始化，请先调用 loadModel');
    }

    try {
        // 准备输入数据
        const feeds = {};
        for (const [name, data] of Object.entries(inputData)) {
            feeds[name] = new ort.Tensor('float32', data.data, data.dims);
        }

        // 执行推理
        const startTime = performance.now();
        const results = await this.session.run(feeds);
        const endTime = performance.now();

        console.log(`推理耗时: ${(endTime - startTime).toFixed(2)} 毫秒`);

        // 处理输出结果
        const output = {};
        for (const [name, tensor] of Object.entries(results)) {
            output[name] = {
                data: tensor.data,
                dims: tensor.dims
            };
        }

        return output;
    } catch (error) {
        console.error('推理执行失败:', error);
        throw error;
    }
}

// 使用示例
const modelDemo = async () => {
    const model = new ONNXModel();
    await model.loadModel('https://example.com/model.onnx');

    const modelInfo = model.getModelInfo();

    // 准备示例输入数据（根据实际模型调整）
    const inputData = {
        [modelInfo.inputs[0]]: {
            data: Float32Array.from(Array(224 * 224 * 3).fill(0)),
            dims: [1, 3, 224, 224] // 示例形状
        }
    };

    const results = await model.runInference(inputData);
    return results;
};
```

## 常用开源库与工具

### ONNX Runtime Web 功能特性

ONNX Runtime Web 提供了多种执行提供程序 (Execution Providers)，以适应不同的运行环境和性能需求。

**支持的后端示意图：**

```
ONNX Runtime Web
    ├── WebAssembly (WASM) - CPU, 广泛兼容
    ├── WebGL - GPU, 图形API加速
    ├── WebGPU - 下一代GPU计算 (实验性)
    └── WebNN - 神经网络专用API (实验性)
```

### 性能优化工具

```javascript
import * as ort from 'onnxruntime-web'

// 性能优化配置
class OptimizedONNX {
  static getOptimizedOptions() {
    return {
      // 执行提供程序优先级
      executionProviders: ['webgpu', 'wasm'],

      // 图优化级别
      graphOptimizationLevel: 'all',

      // 启用内存模式优化
      enableMemoryPattern: true,

      // 执行模式
      executionMode: 'sequential',

      // 线程数配置（WASM后端）
      intraOpNumThreads: navigator.hardwareConcurrency || 4,

      // 内存限制
      memoryLimit: 512 * 1024 * 1024, // 512MB
    }
  }

  // 环境标志配置
  static configureEnvironment() {
    // 配置全局环境标志
    ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4
    ort.env.wasm.proxy = false
    ort.env.logLevel = 'warning'

    console.log('ONNX Runtime 环境配置完成')
    console.log('线程数:', ort.env.wasm.numThreads)
  }

  // 模型预热（减少首次推理延迟）
  async warmupModel(session, inputShape) {
    console.log('开始模型预热...')

    // 创建预热数据
    const warmupData = {}
    const inputNames = session.inputNames

    for (const name of inputNames) {
      const inputInfo = session.inputs.get(name)
      const size = inputShape
        ? inputShape
        : inputInfo.dims.reduce((a, b) => a * b, 1)
      warmupData[name] = new ort.Tensor(
        'float32',
        new Float32Array(size).fill(0),
        inputInfo.dims
      )
    }

    // 执行预热推理
    await session.run(warmupData)
    console.log('模型预热完成')
  }
}

// 初始化配置
OptimizedONNX.configureEnvironment()
```

## 实际应用示例

### 图像分类应用

```javascript
import * as ort from 'onnxruntime-web'

class ImageClassifier {
  constructor(modelUrl) {
    this.modelUrl = modelUrl
    this.session = null
    this.preprocessedData = null
  }

  async initialize() {
    this.session = await ort.InferenceSession.create(this.modelUrl, {
      executionProviders: ['wasm'],
    })
    return this.session
  }

  // 图像预处理
  preprocessImage(imageElement) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // 调整大小为目标尺寸
    const targetSize = [224, 224]
    canvas.width = targetSize[0]
    canvas.height = targetSize[1]

    ctx.drawImage(imageElement, 0, 0, targetSize[0], targetSize[1])

    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, targetSize[0], targetSize[1])

    // 转换为 CHW 格式 (Channel-Height-Width) 并归一化
    const data = new Float32Array(3 * targetSize[0] * targetSize[1])

    for (let i = 0; i < imageData.data.length; i += 4) {
      const pixelIndex = i / 4
      // 归一化到 [0, 1] 范围
      data[pixelIndex] = imageData.data[i] / 255.0 // R
      data[pixelIndex + targetSize[0] * targetSize[1]] =
        imageData.data[i + 1] / 255.0 // G
      data[pixelIndex + 2 * targetSize[0] * targetSize[1]] =
        imageData.data[i + 2] / 255.0 // B
    }

    this.preprocessedData = data
    return data
  }

  async classify(imageElement) {
    if (!this.session) {
      await this.initialize()
    }

    // 预处理图像
    const inputData = this.preprocessImage(imageElement)

    // 创建输入张量
    const inputTensor = new ort.Tensor('float32', inputData, [1, 3, 224, 224])

    // 执行推理
    const results = await this.session.run({
      [this.session.inputNames[0]]: inputTensor,
    })

    // 处理输出
    const output = results[this.session.outputNames[0]]
    const predictions = this.processOutput(output)

    return predictions
  }

  processOutput(outputTensor) {
    const probabilities = Array.from(outputTensor.data)
    const predictions = probabilities.map((prob, index) => ({
      classId: index,
      probability: prob,
    }))

    // 按概率排序
    predictions.sort((a, b) => b.probability - a.probability)

    return predictions.slice(0, 5) // 返回前5个预测结果
  }
}

// 使用示例
const classifier = new ImageClassifier('mobilenet.onnx')
const imageElement = document.getElementById('input-image')
const results = await classifier.classify(imageElement)
console.log('分类结果:', results)
```

## 部署与优化策略

### 模型格式优化

ONNX Runtime 支持 ORT 格式模型，这种格式可以优化模型二进制文件大小、加快初始化速度和降低峰值内存使用量。

```javascript
import * as ort from 'onnxruntime-web'

class ModelOptimizer {
  // 转换模型为 ORT 格式（通常在构建时进行）
  static async convertToORTFormat(onnxModelUrl) {
    // 注意：此转换通常在服务器端或构建时完成
    // 这里展示客户端的使用方式

    const response = await fetch(onnxModelUrl)
    const modelBuffer = await response.arrayBuffer()

    // 在实际应用中，ORT 格式转换通常需要后端服务
    // 或者使用 ONNX Runtime 的转换工具

    console.log(
      `原始模型大小: ${(modelBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`
    )
    return modelBuffer
  }

  // 模型量化（减小模型大小，提高推理速度）
  static async quantizeModel(modelBuffer, quantizationType = 'uint8') {
    // 量化通常在后端进行
    // 这里展示概念性代码

    console.log(`应用 ${quantizationType} 量化`)
    // 在实际实现中，这里会调用量化API

    return modelBuffer
  }
}

// 性能监控
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      loadTime: 0,
      inferenceTime: 0,
      memoryUsage: 0,
      throughput: 0,
    }
  }

  startLoadTimer() {
    this.loadStartTime = performance.now()
  }

  endLoadTimer() {
    this.metrics.loadTime = performance.now() - this.loadStartTime
  }

  startInferenceTimer() {
    this.inferenceStartTime = performance.now()
  }

  endInferenceTimer(batchSize = 1) {
    const inferenceTime = performance.now() - this.inferenceStartTime
    this.metrics.inferenceTime = inferenceTime
    this.metrics.throughput = (batchSize * 1000) / inferenceTime // 样本/秒

    return this.metrics
  }

  getMemoryUsage() {
    // 注意：浏览器中内存监控受限
    if (performance.memory) {
      this.metrics.memoryUsage = performance.memory.usedJSHeapSize
    }
    return this.metrics
  }
}
```

ONNX 通过提供一种通用的模型表示格式，极大地简化了深度学习模型的跨框架部署和优化。其丰富的生态系统和工具支持，使得 ONNX 成为深度学习领域中的重要工具之一，让开发者能够“训练一次，随处运行”。
