# Web GPU 入门

## 什么是 Web GPU

Web GPU 是现代图形 API (如 Vulkan、Metal 和 DirectX 12) 在 Web 平台上的对应实现。与 WebGL 不同，Web GPU 提供了更底层的硬件控制，允许开发者更高效地利用现代 GPU 的并行计算能力。

```
Web GPU 架构：
[应用程序] → [Web GPU API] → [浏览器] → [原生图形后端] → [GPU 硬件]
                    ↓
            [着色器语言: WGSL]
```

## 核心概念

### 适配器与设备

适配器 (Adapter) 代表物理 GPU，设备 (Device) 是适配器的逻辑实例。

```
适配器选择流程：
[系统 GPU 列表] → [选择适配器] → [创建设备] → [Web GPU 设备]
      ↓                ↓              ↓
 [集成显卡]        [性能特征]      [命令队列]
 [独立显卡]        [功能支持]      [资源创建]
```

### 着色器语言 WGSL

WGSL(WebGPU Shading Language) 是 Web GPU 的着色器语言，专为 Web 平台设计。

```wgsl
@vertex
fn vertex_main(@location(0) position: vec4<f32>) -> @builtin(position) vec4<f32> {
    return position;
}

@fragment  
fn fragment_main() -> @location(0) vec4<f32> {
    return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}
```

### 渲染管线

渲染管线是 Web GPU 的核心，定义了渲染状态和着色器程序。

```
渲染管线配置：
[顶点状态]     [片元状态]     [深度模板]     [多重采样]
    ↓             ↓             ↓             ↓
[顶点着色器]  [片元着色器]  [深度测试]    [采样计数]
[顶点缓冲]    [颜色格式]    [模板测试]    [抗锯齿]
```

## 初始化流程

### 获取 GPU 设备

```javascript
async function initWebGPU() {
    // 检查浏览器支持
    if (!navigator.gpu) {
        throw new Error("WebGPU not supported");
    }
    
    // 获取适配器
    const adapter = await navigator.gpu.requestAdapter();
    
    // 获取设备
    const device = await adapter.requestDevice();
    
    return device;
}
```

### 配置画布

```javascript
function setupCanvas(device, canvas) {
    // 获取上下文
    const context = canvas.getContext('webgpu');
    
    // 配置画布格式
    const format = navigator.gpu.getPreferredCanvasFormat();
    
    // 配置上下文
    context.configure({
        device: device,
        format: format,
        alphaMode: 'premultiplied'
    });
    
    return context;
}
```

## 资源创建

### 缓冲区 (Buffer)

缓冲区用于存储顶点数据、uniforms 等。

```javascript
// 创建顶点缓冲区
const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
});

// 创建 Uniform 缓冲区
const uniformBuffer = device.createBuffer({
    size: 64, // 典型的 4x4 矩阵
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});
```

### 纹理 (Texture) 与采样器 (Sampler)

```javascript
// 创建纹理
const texture = device.createTexture({
    size: [width, height],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
});

// 创建采样器
const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear'
});
```

## 渲染管线创建

### 着色器模块

```javascript
const shaderModule = device.createShaderModule({
    code: `
        @vertex
        fn vs_main(@builtin(vertex_index) vertex_index: u32) -> @builtin(position) vec4<f32> {
            var pos = array<vec2<f32>, 3>(
                vec2(0.0, 0.5),
                vec2(-0.5, -0.5),
                vec2(0.5, -0.5)
            );
            return vec4<f32>(pos[vertex_index], 0.0, 1.0);
        }

        @fragment
        fn fs_main() -> @location(0) vec4<f32> {
            return vec4<f32>(1.0, 0.0, 0.0, 1.0);
        }
    `
});
```

### 管线布局

```javascript
// 创建绑定组布局
const bindGroupLayout = device.createBindGroupLayout({
    entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: 'uniform' }
    }]
});

// 创建管线布局
const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
});
```

### 渲染管线

```javascript
const renderPipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
        module: shaderModule,
        entryPoint: 'vs_main'
    },
    fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [{
            format: canvasFormat
        }]
    },
    primitive: {
        topology: 'triangle-list'
    }
});
```

## 渲染循环

### 命令编码与提交

```
渲染流程：
[开始渲染通道] → [设置管线] → [绘制调用] → [结束渲染通道] → [提交命令队列]
      ↓               ↓           ↓             ↓               ↓
 [颜色附件]      [绑定组]     [顶点数量]    [命令编码器]     [GPU执行]
 [深度附件]      [缓冲区]     [实例数量]                   [帧完成]
```

### 实现渲染循环

```javascript
function renderFrame(device, context, pipeline) {
    // 获取当前纹理视图
    const view = context.getCurrentTexture().createView();
    
    // 创建命令编码器
    const commandEncoder = device.createCommandEncoder();
    
    // 开始渲染通道
    const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: view,
            loadOp: 'clear',
            storeOp: 'store',
            clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 }
        }]
    });
    
    // 设置渲染状态
    renderPass.setPipeline(pipeline);
    renderPass.draw(3); // 绘制三角形（3个顶点）
    
    // 结束渲染通道
    renderPass.end();
    
    // 提交命令
    device.queue.submit([commandEncoder.finish()]);
}
```

## 计算着色器

Web GPU 强大的计算能力通过计算管线实现。

```wgsl
@group(0) @binding(0) var<storage, read_write> data: array<f32>;

@compute @workgroup_size(64)
fn compute_main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index < arrayLength(&data)) {
        data[index] = data[index] * 2.0;
    }
}
```

### 计算管线配置

```javascript
const computePipeline = device.createComputePipeline({
    layout: 'auto',
    compute: {
        module: computeShaderModule,
        entryPoint: 'compute_main'
    }
});
```

## 性能优化特性

### 内存屏障与同步

```
内存依赖关系：
[计算着色器写入] → [内存屏障] → [片段着色器读取]
        ↓                 ↓           ↓
    [Buffer A]        [同步点]     [Buffer A]
```

### 管线缓存

```javascript
// 使用管线常量加速编译
const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        constants: {
            // 编译时常量
            scale: 1.0
        }
    }
});
```

## 错误处理

Web GPU 使用严格的错误报告机制。

```javascript
// 设备丢失处理
device.lost.then((info) => {
    console.error(`Device lost: ${info.message}`);
});

// 创建带标签的资源便于调试
const buffer = device.createBuffer({
    label: 'Vertex Positions',
    size: 1024,
    usage: GPUBufferUsage.VERTEX
});
```

## 与 WebGL 对比

### 架构差异

```
WebGL (传统):
[应用] → [状态机] → [驱动转换层] → [GPU]

WebGPU (现代):
[应用] → [命令缓冲区] → [本地API转换] → [GPU]
```

### 性能特征

```
渲染调用开销:
WebGL:  [状态设置] → [绘制] → [高驱动开销]
WebGPU: [预编译管线] → [命令录制] → [批量提交]
```