# WebGPU 渲染管线

WebGPU 渲染管线是现代图形编程的核心组件，它定义了几何数据从原始顶点到最终像素的完整处理流程。与传统的 WebGL 管线相比，WebGPU 提供了更精细的控制和更高的性能，同时引入了更严格的类型安全和并行处理能力。

## 渲染管线概述

WebGPU 渲染管线是一个高度可配置的并行处理系统，它将 3D 场景数据转换为 2D 图像。管线设计借鉴了现代图形 API 的最佳实践，提供了明确的阶段划分和高效的数据流管理。

**管线架构示意图**：
```
应用阶段 → 输入装配 → 顶点着色 → 图元组装 → 光栅化 → 片段着色 → 输出合并
   ↓           ↓          ↓          ↓          ↓          ↓          ↓
CPU准备    顶点数据    顶点处理    几何构建    像素映射    颜色计算    最终输出
```

## 管线创建与配置

在 WebGPU 中，渲染管线是通过管线布局和状态对象预先定义的，这种设计允许驱动程序进行深度优化。

### 管线创建

```javascript
const renderPipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
        module: vertexShaderModule,
        entryPoint: 'vs_main',
        buffers: [vertexBufferLayout]
    },
    fragment: {
        module: fragmentShaderModule,
        entryPoint: 'fs_main',
        targets: [{
            format: 'bgra8unorm',
            blend: {
                color: {
                    srcFactor: 'src-alpha',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add'
                },
                alpha: {
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add'
                }
            }
        }]
    },
    primitive: {
        topology: 'triangle-list',
        cullMode: 'back'
    },
    depthStencil: {
        format: 'depth24plus-stencil8',
        depthWriteEnabled: true,
        depthCompare: 'less'
    },
    multisample: {
        count: 4
    }
});
```

### 管线布局

管线布局定义了着色器可以访问的资源绑定方式：

```javascript
const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [
        bindGroupLayout // 定义统一缓冲区、纹理等资源的绑定方式
    ]
});
```

## 输入装配阶段

输入装配阶段负责从缓冲区中读取顶点数据并组装成基本图元。这个阶段是渲染管线的起点，决定了如何解释输入的几何数据。

**输入装配流程**：
```
顶点缓冲区 → 索引缓冲区 → 顶点提取 → 图元组装
    ↓           ↓           ↓          ↓
位置/法线    顶点索引     属性读取    三角形/线
```

### 顶点缓冲区布局

```javascript
const vertexBufferLayout = {
    arrayStride: 32, // 每个顶点占32字节
    attributes: [
        {
            format: 'float32x3', // 位置：3个float32
            offset: 0,
            shaderLocation: 0
        },
        {
            format: 'float32x3', // 法线：3个float32  
            offset: 12,
            shaderLocation: 1
        },
        {
            format: 'float32x2', // 纹理坐标：2个float32
            offset: 24,
            shaderLocation: 2
        }
    ]
};
```

### 图元拓扑

WebGPU 支持多种图元拓扑类型：
```
点列表:        ●   ●   ●   ●
线列表:        ├───┼───┼───┤
线带:         ├───┼───┼───┤
三角形列表:     ▲   ▲   ▲   ▲
              / \ / \ / \ / \
三角形带:     ▲▲▲▲▲▲▲▲▲▲▲▲▲
            / \ / \ / \ / \ /
```

## 顶点着色阶段

顶点着色器是渲染管线的第一个可编程阶段，负责处理每个顶点的变换和属性计算。

### 顶点着色器示例

```wgsl
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) texCoord: vec2<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPosition: vec3<f32>,
    @location(1) worldNormal: vec3<f32>,
    @location(2) texCoord: vec2<f32>,
};

@group(0) @binding(0) var<uniform> modelViewProjection: mat4x4<f32>;
@group(0) @binding(1) var<uniform> modelMatrix: mat4x4<f32>;

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    
    // 位置变换到裁剪空间
    output.position = modelViewProjection * vec4<f32>(input.position, 1.0);
    
    // 法线变换到世界空间
    output.worldNormal = (modelMatrix * vec4<f32>(input.normal, 0.0)).xyz;
    
    // 世界空间位置
    output.worldPosition = (modelMatrix * vec4<f32>(input.position, 1.0)).xyz;
    
    // 传递纹理坐标
    output.texCoord = input.texCoord;
    
    return output;
}
```

### 内置变量

顶点着色器可以使用多种内置变量：
```
@vertex_index:     顶点索引
@instance_index:   实例索引
@position:         输出位置（必须）
@point_size:       点大小（可选）
```

## 图元组装阶段

图元组装阶段将处理后的顶点连接成完整的几何图元，同时执行背面剔除、视锥体裁剪等操作。

**图元组装流程**：
```
处理后的顶点 → 图元连接 → 背面剔除 → 视锥裁剪 → 透视除法
     ↓           ↓          ↓          ↓          ↓
 顶点着色器输出   三角形构建   面剔除     可见性判断   规范化坐标
```

### 面剔除

```javascript
primitive: {
    topology: 'triangle-list',
    cullMode: 'back',  // 剔除背面
    frontFace: 'ccw'   // 逆时针为正面
}
```

剔除模式示意图：
```
正面三角形 (保留):   背面三角形 (剔除):
   v0                  v0
  / \                 / \
 v1---v2            v2---v1
```

## 光栅化阶段

光栅化是将几何图元转换为像素片段的过程，这个阶段确定哪些像素被图元覆盖，并为每个片段生成插值属性。

**光栅化流程**：
```
图元 → 扫描转换 → 深度计算 → 属性插值 → 片段生成
 ↓        ↓          ↓          ↓          ↓
几何体   像素映射    深度值     平滑过渡   片段数据
```

### 多重采样抗锯齿

WebGPU 支持多重采样抗锯齿 (MSAA)，通过在每个像素内采样多个位置来减少锯齿：

```javascript
multisample: {
    count: 4,                    // 4倍多重采样
    mask: 0xFFFFFFFF,            // 所有样本都写入
    alphaToCoverageEnabled: false
}
```

MSAA 示意图：
```
无抗锯齿:         MSAA 4x:
像素边界锯齿      平滑边界
▓▓▓▓░░░░        ▓▓▓▓░░░░
▓▓▓░░░░░   →    ▓▓▓▒░░░░
▓▓░░░░░░        ▓▓▒▒░░░░
▓░░░░░░░        ▓▒▒▒░░░░
```

## 片段着色阶段

片段着色器是第二个可编程阶段，负责计算每个像素的最终颜色。这个阶段可以进行纹理采样、光照计算和材质处理。

### 片段着色器示例

```wgsl
struct FragmentInput {
    @location(0) worldPosition: vec3<f32>,
    @location(1) worldNormal: vec3<f32>,
    @location(2) texCoord: vec2<f32>,
};

struct FragmentOutput {
    @location(0) color: vec4<f32>,
    @location(1) normal: vec4<f32>, // G-Buffer 输出
};

@group(0) @binding(2) var diffuseTexture: texture_2d<f32>;
@group(0) @binding(3) var textureSampler: sampler;

@fragment
fn fs_main(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;
    
    // 纹理采样
    let diffuseColor = textureSample(diffuseTexture, textureSampler, input.texCoord);
    
    // 法线归一化
    let normal = normalize(input.worldNormal);
    
    // 简单光照计算
    let lightDir = normalize(vec3<f32>(1.0, 1.0, 1.0));
    let intensity = max(dot(normal, lightDir), 0.1); // 10%环境光
    
    // 最终颜色
    output.color = vec4<f32>(diffuseColor.rgb * intensity, diffuseColor.a);
    output.normal = vec4<f32>(normal * 0.5 + 0.5, 1.0); // 编码法线
    
    return output;
}
```

### 早期深度测试

WebGPU 支持早期深度测试，在片段着色器执行前进行深度比较，避免不必要的着色计算：

```wgsl
@fragment
fn fs_main(@builtin(position) fragPosition: vec4<f32>) -> @location(0) vec4<f32> {
    // 如果启用早期深度测试，深度值已经确定
    return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}
```

## 输出合并阶段

输出合并阶段将片段着色器的输出与帧缓冲区中的现有内容结合，执行深度测试、模板测试和混合操作。

### 深度和模板测试

```javascript
depthStencil: {
    format: 'depth24plus-stencil8',
    depthWriteEnabled: true,
    depthCompare: 'less',
    stencilFront: {
        compare: 'equal',
        failOp: 'keep',
        depthFailOp: 'keep', 
        passOp: 'keep'
    },
    stencilBack: {
        compare: 'equal',
        failOp: 'keep',
        depthFailOp: 'keep',
        passOp: 'keep'
    }
}
```

深度测试示意图：
```
新片段深度: 0.3
深度缓冲区: 0.5
比较函数: 'less'
结果: 通过测试，更新深度缓冲区
```

### 颜色混合

混合操作控制新颜色如何与目标颜色结合：

```javascript
targets: [{
    format: 'bgra8unorm',
    blend: {
        color: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha', 
            operation: 'add'
        },
        alpha: {
            srcFactor: 'one',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add'
        }
    },
    writeMask: GPUColorWrite.ALL
}]
```

混合公式示意图：
```
源颜色:    (1.0, 0.0, 0.0, 0.5)
目标颜色:  (0.0, 0.0, 1.0, 1.0)
混合结果:  src * src.a + dst * (1 - src.a)
         = (0.5, 0.0, 0.5, 1.0)
```

## 渲染通道编码

渲染通道编码器负责记录所有的渲染命令，并将其封装为可执行的命令缓冲区。

### 渲染通道设置

```javascript
const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [
        {
            view: colorTextureView,
            loadOp: 'clear',
            storeOp: 'store', 
            clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 }
        }
    ],
    depthStencilAttachment: {
        view: depthTextureView,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        depthClearValue: 1.0,
        stencilLoadOp: 'clear',
        stencilStoreOp: 'store',
        stencilClearValue: 0
    }
});
```

### 绘制命令

```javascript
// 设置管道
renderPass.setPipeline(renderPipeline);

// 设置顶点缓冲区
renderPass.setVertexBuffer(0, vertexBuffer);

// 设置绑定组
renderPass.setBindGroup(0, bindGroup);

// 绘制调用
renderPass.draw(vertexCount, instanceCount, firstVertex, firstInstance);

// 索引绘制
renderPass.setIndexBuffer(indexBuffer, 'uint16');
renderPass.drawIndexed(indexCount, instanceCount, firstIndex, baseVertex, firstInstance);
```

## 多渲染目标

WebGPU 支持多渲染目标 (MRT)，允许片段着色器同时输出到多个颜色附件：

```wgsl
struct FragmentOutput {
    @location(0) albedo: vec4<f32>,     // 漫反射颜色
    @location(1) normal: vec4<f32>,     // 世界法线
    @location(2) position: vec4<f32>,   // 世界位置
    @location(3) material: vec4<f32>,   // 材质参数
};
```

渲染目标配置：
```javascript
targets: [
    { format: 'rgba8unorm' },    // albedo
    { format: 'rgba16float' },   // normal  
    { format: 'rgba16float' },   // position
    { format: 'rgba8unorm' }     // material
]
```

## 性能优化特性

### 管线状态对象

WebGPU 的管线状态对象 (PSO) 允许驱动程序预先编译和验证管线状态：

```
管线创建时:  着色器编译 + 状态验证 + 资源绑定检查
渲染时:      直接使用预编译管线，无运行时开销
```

### 动态状态

某些状态可以在渲染通道中动态设置，减少管线切换：

```javascript
renderPass.setBlendConstant([1.0, 1.0, 1.0, 1.0]);
renderPass.setStencilReference(0xFF);
renderPass.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
renderPass.setScissorRect(0, 0, canvas.width, canvas.height);
```

### 间接绘制

支持间接绘制，减少 CPU-GPU 通信：

```javascript
const indirectBuffer = device.createBuffer({
    size: 16, // 4个uint32: vertexCount, instanceCount, firstVertex, firstInstance
    usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST
});

renderPass.drawIndirect(indirectBuffer, 0);
```