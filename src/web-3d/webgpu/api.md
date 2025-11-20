# WebGPU API

WebGPU API 是一种全新的 Web 图形 API，作为 WebGL 的继承者，它完全从头开始设计，更接近 Vulkan、Metal 和 Direct3D 等现代图形 API。与主要基于 OpenGL 的 WebGL 不同，WebGPU 提供了更底层、更高效的 GPU 控制方式，不仅支持图形渲染，还首次在 Web 环境中引入了通用 GPU 计算能力。

## 概述与设计理念

WebGPU 是一个低层级 API，虽然需要程序员完成更多工作，但提供了更强大的功能和更高的效率。其设计借鉴了现代图形 API 的最佳实践，包括显式的资源管理、预编译的管线状态和高效的绑定模型。

**设计特点**：
- **显式控制**：相比 WebGL 的隐式状态管理，WebGPU 要求开发者显式定义所有资源和状态
- **跨平台一致性**：基于 Vulkan、Metal 和 Direct3D 12 等现代图形 API 的共同特性设计
- **安全优先**：在提供高性能的同时，确保 Web 环境的安全性
- **计算与图形统一**：首次在 Web 平台同时提供图形渲染和通用计算能力

## 环境架构与初始化

WebGPU 应用程序环境包含两个主要部分：JavaScript 端和 GPU 端。JavaScript 端在 CPU 上执行，而 WebGPU 的计算和渲染操作则在 GPU 上执行。这两种处理器拥有各自专用的内存，但也通过一些共享内存来进行数据交换和消息传递。

### 初始化流程

```javascript
// 初始化 WebGPU
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
    
    // 配置画布
    let canvas = document.getElementById("webgpuCanvas");
    let context = canvas.getContext("webgpu");
    context.configure({
        device: device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: "premultiplied"
    });
    
    return { device, context, canvas };
}
```

### 架构示意图

```
JavaScript应用 (CPU端)
        ↓
    WebGPU API
        ↓
  适配器 → 设备
        ↓
  命令编码与资源管理
        ↓
  管道与着色器
        ↓
  GPU执行 (GPU端)
```

## 核心对象模型

### 适配器与设备

适配器 (Adapter) 代表物理 GPU 硬件的抽象，而设备 (Device) 则是开发者与 GPU 功能交互的主要接口。

**对象关系**：
```
GPUAdapter → GPUDevice → 各种GPU资源
     ↓           ↓          ↓
 硬件抽象     逻辑连接   缓冲区/纹理/管道
```

### 画布配置

```javascript
// 获取和配置画布
const canvas = document.getElementById('webgpu-canvas');
const context = canvas.getContext('webgpu');

// 配置画布上下文
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({
    device: device,
    format: canvasFormat,
    alphaMode: 'premultiplied',
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
});
```

## 资源管理系统

### 缓冲区

缓冲区是 GPU 内存中的灵活内存块，可用于存储各种数据。

```javascript
// 创建顶点缓冲区
const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
});

// 填充数据
new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
vertexBuffer.unmap();

// 创建统一缓冲区
const uniformBuffer = device.createBuffer({
    size: 64, // 矩阵大小
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

// 创建存储缓冲区（用于计算着色器）
const storageBuffer = device.createBuffer({
    size: 1024,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
});
```

### 纹理与采样器

纹理表示图像数据，支持多种维度和格式。

```javascript
// 创建纹理
const texture = device.createTexture({
    size: [512, 512, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | 
           GPUTextureUsage.COPY_DST | 
           GPUTextureUsage.RENDER_ATTACHMENT
});

// 从图像加载纹理数据
const image = await fetch('texture.png')
    .then(response => response.blob())
    .then(blob => createImageBitmap(blob));

device.queue.copyExternalImageToTexture(
    { source: image },
    { texture: texture },
    [image.width, image.height]
);

// 创建采样器
const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    addressModeU: 'repeat',
    addressModeV: 'repeat'
});
```

## 着色器系统

WebGPU 使用 WGSL (WebGPU Shading Language) 作为其着色器语言。

### 着色器模块创建

```javascript
// 创建着色器模块
const shaderModule = device.createShaderModule({
    code: `
        struct VertexInput {
            @location(0) position: vec3<f32>,
            @location(1) color: vec3<f32>,
        };

        struct VertexOutput {
            @builtin(position) position: vec4<f32>,
            @location(0) color: vec3<f32>,
        };

        @vertex
        fn vs_main(input: VertexInput) -> VertexOutput {
            var output: VertexOutput;
            output.position = vec4<f32>(input.position, 1.0);
            output.color = input.color;
            return output;
        }

        @fragment
        fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
            return vec4<f32>(input.color, 1.0);
        }
    `
});
```

### 计算着色器

```javascript
// 计算着色器模块
const computeShaderModule = device.createShaderModule({
    code: `
        @group(0) @binding(0) var<storage, read> input: array<f32>;
        @group(0) @binding(1) var<storage, read_write> output: array<f32>;

        @compute @workgroup_size(64)
        fn cs_main(@builtin(global_invocation_id) global_id: vec3<u32>) {
            let index = global_id.x;
            if (index < arrayLength(&output)) {
                output[index] = input[index] * 2.0;
            }
        }
    `
});
```

## 绑定组与管线布局

### 绑定组布局

```javascript
// 创建绑定组布局
const bindGroupLayout = device.createBindGroupLayout({
    entries: [
        {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: 'uniform' }
        },
        {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            texture: { sampleType: 'float' }
        },
        {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: { type: 'filtering' }
        },
        {
            binding: 3,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'read-only-storage' }
        },
        {
            binding: 4,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: 'storage' }
        }
    ]
});

// 创建管线布局
const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
});
```

### 绑定组创建

```javascript
// 创建绑定组
const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
        {
            binding: 0,
            resource: { buffer: uniformBuffer }
        },
        {
            binding: 1,
            resource: texture.createView()
        },
        {
            binding: 2,
            resource: sampler
        },
        {
            binding: 3,
            resource: { buffer: inputBuffer }
        },
        {
            binding: 4,
            resource: { buffer: outputBuffer }
        }
    ]
});
```

## 管道创建与配置

### 渲染管道

```javascript
// 创建渲染管道
const renderPipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: [
            {
                arrayStride: 24, // 6个float * 4字节
                attributes: [
                    {
                        format: 'float32x3',
                        offset: 0,
                        shaderLocation: 0
                    },
                    {
                        format: 'float32x3',
                        offset: 12,
                        shaderLocation: 1
                    }
                ]
            }
        ]
    },
    fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [
            {
                format: canvasFormat
            }
        ]
    },
    primitive: {
        topology: 'triangle-list',
        cullMode: 'back'
    },
    depthStencil: {
        format: 'depth24plus-stencil8',
        depthWriteEnabled: true,
        depthCompare: 'less'
    }
});
```

### 计算管道

```javascript
// 创建计算管道
const computePipeline = device.createComputePipeline({
    layout: pipelineLayout,
    compute: {
        module: computeShaderModule,
        entryPoint: 'cs_main'
    }
});
```

## 命令编码与执行

### 渲染通道编码

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
            clearValue: [0.1, 0.2, 0.3, 1.0]
        }
    ],
    depthStencilAttachment: {
        view: depthTexture.createView(),
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        depthClearValue: 1.0
    }
});

// 设置管道和绘制
renderPass.setPipeline(renderPipeline);
renderPass.setVertexBuffer(0, vertexBuffer);
renderPass.setBindGroup(0, bindGroup);
renderPass.draw(3, 1, 0, 0); // 3个顶点，1个实例

// 结束渲染通道
renderPass.end();
```

### 计算通道编码

```javascript
// 开始计算通道
const computePass = commandEncoder.beginComputePass();

// 设置计算管道和资源
computePass.setPipeline(computePipeline);
computePass.setBindGroup(0, bindGroup);
computePass.dispatchWorkgroups(Math.ceil(elementCount / 64), 1, 1);

// 结束计算通道
computePass.end();
```

### 命令提交

```javascript
// 完成编码并提交
const commandBuffer = commandEncoder.finish();
device.queue.submit([commandBuffer]);
```

## 高级特性与扩展

### 扩展支持

WebGPU 支持多种扩展，用于访问特定硬件功能。

```javascript
// 检查扩展支持
const adapter = await navigator.gpu.requestAdapter();
const features = adapter.features;

// 请求特定扩展
const device = await adapter.requestDevice({
    requiredFeatures: ['shader-f16', 'timestamp-query']
});

// 使用半精度浮点数扩展
if (features.has('shader-f16')) {
    // 使用半精度着色器
}
```

### 异步操作与映射

```javascript
// 异步映射缓冲区读取
async function readBuffer(device, buffer) {
    await device.queue.onSubmittedWorkDone();
    
    const readbackBuffer = device.createBuffer({
        size: buffer.size,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    
    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(buffer, 0, readbackBuffer, 0, buffer.size);
    device.queue.submit([commandEncoder.finish()]);
    
    await readbackBuffer.mapAsync(GPUMapMode.READ);
    const data = new Float32Array(readbackBuffer.getMappedRange());
    const result = new Float32Array(data);
    readbackBuffer.unmap();
    
    return result;
}
```

## 错误处理与调试

### 错误回调

```javascript
// 设置未捕获的错误处理
device.pushErrorScope('validation');
device.pushErrorScope('out-of-memory');
device.pushErrorScope('internal');

// 绘制操作...

// 弹出错误范围
device.popErrorScope().then(error => {
    if (error) {
        console.error('捕获到GPU错误:', error);
    }
});
```

### 调试标签

```javascript
// 为对象添加调试标签
const buffer = device.createBuffer({
    label: '顶点缓冲区',
    size: 1024,
    usage: GPUBufferUsage.VERTEX
});

const commandEncoder = device.createCommandEncoder({ label: '主命令编码器' });
commandEncoder.pushDebugGroup('渲染三角形');
// 渲染命令...
commandEncoder.popDebugGroup();
```

## 性能最佳实践

### 资源管理

```javascript
// 资源池管理
class ResourcePool {
    constructor(device) {
        this.device = device;
        this.buffers = new Set();
        this.textures = new Set();
    }
    
    createBuffer(descriptor) {
        const buffer = this.device.createBuffer(descriptor);
        this.buffers.add(buffer);
        return buffer;
    }
    
    destroyBuffer(buffer) {
        if (this.buffers.has(buffer)) {
            buffer.destroy();
            this.buffers.delete(buffer);
        }
    }
    
    // 类似的纹理管理方法...
}

// 使用资源池
const resourcePool = new ResourcePool(device);
const tempBuffer = resourcePool.createBuffer({
    size: 1024,
    usage: GPUBufferUsage.UNIFORM,
    mappedAtCreation: true
});
```

### 管线状态重用

```javascript
// 管线缓存
class PipelineCache {
    constructor(device) {
        this.device = device;
        this.renderPipelines = new Map();
        this.computePipelines = new Map();
    }
    
    getRenderPipeline(key, descriptor) {
        if (!this.renderPipelines.has(key)) {
            this.renderPipelines.set(key, this.device.createRenderPipeline(descriptor));
        }
        return this.renderPipelines.get(key);
    }
    
    getComputePipeline(key, descriptor) {
        if (!this.computePipelines.has(key)) {
            this.computePipelines.set(key, this.device.createComputePipeline(descriptor));
        }
        return this.computePipelines.get(key);
    }
}
```

WebGPU API 通过其现代化的设计、显式的资源控制和高效的命令执行机制，为 Web 平台带来了前所未有的图形和计算性能。虽然学习曲线相对陡峭，但其清晰的架构和强大的能力使其成为下一代 Web 图形和计算应用的理想选择。