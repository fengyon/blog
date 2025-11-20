# WebGPU 入门

WebGPU 是一种全新的 Web 图形 API，它被设计为 WebGL 的继承者，为现代 GPU 编程提供了更高效、更安全的访问方式。与基于 OpenGL 的 WebGL 不同，WebGPU 完全从头开始设计，更接近 Vulkan、Metal 和 Direct3D 等现代图形 API。它不仅在图形渲染方面表现出色，还首次在浏览器中引入了通用 GPU 计算能力。

## WebGPU 概述

WebGPU 是一个低级别 API，它让开发者能够更直接地控制 GPU 的操作。这种设计虽然增加了编程的复杂性，但换来了更高的性能和效率。WebGPU 的着色器使用 WGSL (WebGPU Shading Language) 编写，这是一种为 Web 环境设计的安全的着色语言。

**WebGPU 与 WebGL 的关键差异**：
```
WebGL (基于 OpenGL ES)：
    ↑
高层级API ← 驱动程序 ← GPU

WebGPU (类似 Vulkan/Metal)：
    ↑
低级别API ← 通用接口 ← 适配器 ← 实际GPU硬件
```

与主要用于绘图的 WebGL 不同，WebGPU 在设计之初就同时考虑了图形渲染和通用计算两大功能。这使得它在处理复杂图形和大规模数据计算时具有更高的性能和灵活性。

## 核心架构与基本概念

### 环境架构

WebGPU 应用程序环境包含两个主要部分：JavaScript 端和 GPU 端。JavaScript 端在 CPU 上执行，而 WebGPU 的计算和渲染操作则在 GPU 上执行。这两种处理器拥有各自专用的内存，但也通过一些共享内存来进行数据交换和消息传递。

示意图 (WebGPU 架构)：
```
JavaScript应用 (CPU端)
        ↓
    WebGPU API
        ↓
    适配器/设备
        ↓
  着色器模块(WGSL)
        ↓
   GPU执行 (GPU端)
```

### 适配器与设备

在 WebGPU 中，**适配器** (Adapter) 代表了物理 GPU 硬件的抽象，而**设备** (Device) 则是开发者与 GPU 功能交互的主要接口。这种层级结构让 WebGPU 能够适应不同的硬件配置。

获取适配器和设备的典型代码流程：
```javascript
async function initWebGPU() {
    if (!navigator.gpu) {
        throw Error("WebGPU 不支持");
    }
    // 获取适配器
    let adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw Error("无法获取 WebGPU 适配器");
    }
    // 获取设备
    let device = await adapter.requestDevice();
    return device;
}
```

### 坐标系系统

WebGPU 使用与传统图形 API 相似的标准化设备坐标系统，X、Y、Z 坐标范围通常为 [-1，1]。与 WebGL 不同的是，WebGPU 的 Y 轴在标准化设备坐标中向上为正，在纹理坐标中向下为正。

## 初始化与设置

### 画布配置

要在页面上显示图形，需要将 WebGPU 与 HTML 画布元素关联起来：

```javascript
const canvas = document.getElementById('webgpu-canvas');
const context = canvas.getContext('webgpu');

// 配置画布上下文
context.configure({
    device: device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: 'premultiplied'
});
```

### 扩展功能

WebGPU 支持多种扩展，如 `shader-f16` 扩展允许使用半精度浮点数，通过减少内存带宽来提高性能。虽然所有 Apple 设备都支持这个扩展，但在其他平台上使用前需要检查支持情况。

## 着色器编程

### WGSL 概述

WGSL (WebGPU Shading Language) 是 WebGPU 的着色器语言，从构建之初就考虑了网页安全性。WGSL 支持三种类型的程序：顶点程序、片段程序和计算程序。

**WGSL 与 GLSL 对比**：
```
GLSL (WebGL):
    attribute, uniform, varying
    GLSL ES 语法

WGSL (WebGPU):
    @location, @binding
    现代着色语言设计
    更强的类型安全
```

### 着色器示例

一个简单的顶点着色器示例：
```wgsl
// 顶点着色器
@vertex
fn vs_main(@builtin(vertex_index) in_vertex_index: u32) -> @builtin(position) vec4<f32> {
    var pos = array<vec2<f32>, 3>(
        vec2<f32>(0.0, 0.5),
        vec2<f32>(-0.5, -0.5),
        vec2<f32>(0.5, -0.5)
    );
    return vec4<f32>(pos[in_vertex_index], 0.0, 1.0);
}

// 片段着色器
@fragment
fn fs_main() -> @location(0) vec4<f32> {
    return vec4<f32>(1.0, 0.0, 0.0, 1.0); // 红色
}
```

### 计算着色器

WebGPU 的一个关键优势是支持计算着色器，这是 WebGL 所不具备的。计算着色器允许执行通用计算任务，将结果存储在缓冲区中，然后读回 JavaScript 代码，且不一定需要可视化输出。

计算着色器示例：
```wgsl
@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    // 执行并行计算
    // 应用重力、速度和经过时间等物理模拟
}
```

## 资源管理

### 缓冲区

缓冲区是 WebGPU 中灵活的内存块，可用于存储各种数据，从简单的浮点向量到复杂的自定义数据结构。

```javascript
// 创建缓冲区
const buffer = device.createBuffer({
    size: 1024, // 字节大小
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
});

// 填充缓冲区数据
const bufferData = new Float32Array(buffer.getMappedRange());
bufferData.set([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
buffer.unmap();
```

### 纹理

纹理表示图像数据，支持 1D、2D、2D 数组、立方体贴图和 3D 纹理。

```javascript
// 创建纹理
const texture = device.createTexture({
    size: [512, 512, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
});

// 从图像加载纹理数据
device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: texture },
    [imageBitmap.width, imageBitmap.height]
);
```

### 绑定组与布局

绑定组将相关资源 (如缓冲区、纹理和采样器) 分组在一起，以便 GPU 能够高效使用它们。布局则定义了资源从 API 传递到 GPU 程序的结构化方式。

```javascript
// 创建绑定组布局
const bindGroupLayout = device.createBindGroupLayout({
    entries: [
        {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' }
        }
    ]
});

// 创建绑定组
const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
        {
            binding: 0,
            resource: { buffer: uniformBuffer }
        }
    ]
});
```

## 渲染流程

### 渲染管道

管道指定了 GPU 上将如何使用纹理和缓冲区。WebGPU 有两种主要管道类型：渲染管道和计算管道。

```javascript
// 创建渲染管道
const renderPipeline = device.createRenderPipeline({
    vertex: {
        module: shaderModule,
        entryPoint: 'vs_main'
    },
    fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [{ format: 'rgba8unorm' }]
    },
    primitive: {
        topology: 'triangle-list'
    },
    layout: pipelineLayout
});
```

### 编码器与命令提交

WebGPU 使用命令编码器来记录和提交 GPU 命令：

```javascript
// 创建命令编码器
const commandEncoder = device.createCommandEncoder();

// 开始渲染通道
const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
        {
            view: context.getCurrentTexture().createView(),
            loadOp: 'clear',
            storeOp: 'store',
            clearValue: [0.1, 0.2, 0.3, 1.0] // RGBA
        }
    ]
});

// 设置管道和资源
renderPass.setPipeline(renderPipeline);
renderPass.setBindGroup(0, bindGroup);
renderPass.draw(3, 1, 0, 0); // 绘制3个顶点

// 结束渲染通道并提交命令
renderPass.end();
const commandBuffer = commandEncoder.finish();
device.queue.submit([commandBuffer]);
```

## 性能优化

### 内存管理

WebGPU 设计强调提高 GPU 数据访问效率，减少 CPU 到 GPU 的数据传输过程。合理使用缓冲区和纹理的使用标志可以显著提高性能。

**缓冲区使用模式**：
```
"map-write"：    CPU写入，GPU读取
"copy-src"：     作为复制源
"copy-dst":      作为复制目标
"uniform":       统一缓冲区
"storage":       存储缓冲区
```

### 异步操作

WebGPU 广泛使用异步操作来处理资源创建和数据传输：

```javascript
// 异步映射缓冲区
async function updateBufferData(device, buffer, data) {
    await device.queue.onSubmittedWorkDone();
    
    const writeBuffer = device.createBuffer({
        size: data.byteLength,
        usage: GPUBufferUsage.COPY_SRC,
        mappedAtCreation: true
    });
    
    new Float32Array(writeBuffer.getMappedRange()).set(data);
    writeBuffer.unmap();
    
    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(writeBuffer, 0, buffer, 0, data.byteLength);
    device.queue.submit([commandEncoder.finish()]);
}
```

## 错误处理与调试

WebGPU 提供了强大的调试工具，包括错误范围和调试组：

```javascript
// 创建设备时启用错误处理
const device = await adapter.requestDevice({
    defaultQueue: { label: "defaultQueue" }
});

// 使用推入/弹出调试组
const commandEncoder = device.createCommandEncoder({ label: "mainEncoder" });
commandEncoder.pushDebugGroup("渲染三角形");
// ... 渲染命令
commandEncoder.popDebugGroup();
```

## 跨平台考虑

WebGPU 设计为跨平台 API，在 macOS 上通过 Metal 实现，在 Windows 上通过 Direct3D 12 或 Vulkan 实现，在 Linux 上通过 Vulkan 实现。这种多后端支持使得 WebGPU 能够在不同平台上提供一致的编程体验。

**平台支持矩阵**：
```
Apple平台:    Metal (完全支持)
Windows:      Direct3D 12 / Vulkan
Linux:        Vulkan
Android:      Vulkan
ChromeOS:     Vulkan
```

## 现代图形功能

WebGPU 支持许多现代图形功能，包括：

- **计算着色器**：用于通用目的并行计算
- **存储缓冲区**：支持随机读写的缓冲区
- **原子操作**：用于并行算法中的同步
- **多重采样抗锯齿**：改善图像质量
- **深度测试和模板测试**：高级渲染效果

这些功能使得 WebGPU 不仅适用于图形渲染，也适用于机器学习、科学计算和物理模拟等领域。