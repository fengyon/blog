# Web GPU 渲染管线

## 概述

WebGPU 渲染管线是现代图形编程的核心组件，它定义了 3D 模型从顶点数据到最终屏幕像素的完整转换过程。与传统的即时模式渲染不同，WebGPU 采用预编译的管线状态对象，实现了高性能的图形渲染。

```
渲染管线数据流：
[顶点数据] → [顶点着色器] → [图元装配] → [光栅化] → [片段着色器] → [输出合并]
     ↓            ↓            ↓           ↓           ↓            ↓
 [缓冲区]    [坐标变换]    [图元组装]   [像素生成]   [颜色计算]   [深度/模板测试]
```

## 管线架构设计

### 管线状态对象

WebGPU 渲染管线采用不可变的状态对象设计，所有渲染状态在创建时确定：

```
管线状态组成：
[着色器阶段] -- [顶点着色器、片段着色器]
       │
[固定功能状态] -- [图元拓扑、光栅化、深度模板、混合]
       │
[资源布局] -- [绑定组布局、管线布局]
```

这种设计允许驱动程序在管线创建时进行深度优化，避免了运行时状态检查的开销。

### 与 WebGL 对比

```
状态管理对比：
WebGL (状态机模式):
gl.bindBuffer() → gl.vertexAttribPointer() → gl.drawArrays()
    ↓                 ↓                       ↓
[状态变更]       [顶点描述]              [绘制调用 - 高开销]

WebGPU (管线模式):
pipeline = device.createRenderPipeline() → renderPass.setPipeline()
                                              ↓
                                     [绘制调用 - 低开销]
```

## 顶点输入阶段

### 顶点缓冲区布局

顶点数据通过缓冲区传递给渲染管线，需要精确定义数据格式：

```javascript
const vertexBufferLayout = {
    arrayStride: 32, // 每个顶点的字节数
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

### 顶点提取机制

GPU 按照指定布局从缓冲区提取顶点数据：

```
顶点提取过程：
[顶点缓冲区] → [按arrayStride步进] → [按format解析] → [传递到着色器]
   ↓              ↓                  ↓              ↓
 [原始数据]    [32字节/顶点]      [位置+法线+UV]   [@location属性]
```

## 着色器阶段

### 顶点着色器

顶点着色器处理每个顶点，进行坐标变换：

```wgsl
@vertex
fn vs_main(
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) texcoord: vec2<f32>
) -> VertexOutput {
    var output: VertexOutput;
    output.position = uniforms.mvp * vec4<f32>(position, 1.0);
    output.world_normal = uniforms.model * vec4<f32>(normal, 0.0);
    output.texcoord = texcoord;
    return output;
}
```

### 片段着色器

片段着色器计算每个像素的最终颜色：

```wgsl
@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    let base_color = textureSample(base_color_texture, texture_sampler, input.texcoord);
    let normal = normalize(input.world_normal.xyz);
    let light_dir = normalize(light.position - input.world_position);
    
    let diffuse = max(dot(normal, light_dir), 0.0);
    let color = base_color.rgb * (light.ambient + light.diffuse * diffuse);
    
    return vec4<f32>(color, base_color.a);
}
```

### 着色器间通信

顶点和片段着色器通过结构体传递数据：

```
着色器数据流：
[顶点着色器输出] → [光栅化插值] → [片段着色器输入]
     ↓                    ↓              ↓
 [位置、法线]        [重心坐标]      [插值后属性]
 [纹理坐标]          [透视校正]      [像素属性]
```

## 图元装配与光栅化

### 图元拓扑

WebGPU 支持多种图元类型：

```
图元拓扑类型：
点列表:        ●   ●   ●   ●
线列表:        ●---●   ●---●  
线带:         ●---●---●---●
三角形列表:    ▲   ▲   ▲   ▲
三角形带:     ▲---▲---▲---▲
```

### 光栅化过程

光栅化将几何图元转换为像素片段：

```
光栅化流程：
[图元] → [视口裁剪] → [背面剔除] → [扫描转换] → [片段生成]
  ↓         ↓           ↓           ↓           ↓
[三角形] [屏幕空间]  [法线检测]  [像素覆盖]  [片段数据]
```

### 多重采样抗锯齿

多重采样通过在每个像素内采样多个位置来减少锯齿：

```
多重采样原理：
单采样:   像素中心采样 → 锯齿边缘
多重采样: 4个子样本采样 → 混合颜色 → 平滑边缘
```

## 输出合并阶段

### 深度与模板测试

深度测试确保正确的物体遮挡关系：

```
深度测试流程：
[新片段深度] → [深度比较] → [通过/丢弃] → [深度写入]
     ↓            ↓           ↓           ↓
 [Z值计算]    [与缓冲区比较] [深度函数]  [更新缓冲区]
```

模板测试用于实现特殊效果：

```javascript
const depthStencil = {
    format: 'depth24plus-stencil8',
    depthWriteEnabled: true,
    depthCompare: 'less',
    stencilFront: {
        compare: 'equal',
        failOp: 'keep',
        depthFailOp: 'keep',
        passOp: 'keep'
    }
};
```

### 颜色混合

混合操作组合片段颜色与帧缓冲区颜色：

```
混合方程：
最终颜色 = (源颜色 × 源因子) ▢ (目标颜色 × 目标因子)
        ↓              ↓           ↓           ↓
    [片段颜色]      [srcFactor] [缓冲区颜色] [dstFactor]
```

支持多种混合模式：

```javascript
const colorStates = [{
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
}];
```

## 管线创建与配置

### 完整管线配置

```javascript
const renderPipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    
    vertex: {
        module: vsModule,
        entryPoint: 'vs_main',
        buffers: [vertexBufferLayout]
    },
    
    fragment: {
        module: fsModule, 
        entryPoint: 'fs_main',
        targets: colorStates
    },
    
    primitive: {
        topology: 'triangle-list',
        cullMode: 'back'
    },
    
    depthStencil: depthStencil,
    
    multisample: {
        count: 4
    }
});
```

### 管线变体管理

实际应用通常需要多个管线变体：

```
管线变体分类：
基础渲染:      [顶点着色器] + [无光照片段着色器]
PBR渲染:       [顶点着色器] + [PBR片段着色器]  
阴影生成:      [深度顶点着色器] + [空片段着色器]
后处理:        [屏幕四边形顶点着色器] + [特效片段着色器]
```

## 性能优化特性

### 提前深度测试

通过重新排序渲染操作减少不必要的片段着色器执行：

```
优化前: [顶点着色] → [片段着色] → [深度测试] → [可能丢弃]
优化后: [顶点着色] → [提前深度测试] → [通过才执行片段着色]
```

### 保守光栅化

确保薄几何体不会被遗漏：

```
标准光栅化:  只渲染像素中心被覆盖的片段
保守光栅化: 渲染任何部分被覆盖的像素
```

### 管线缓存

缓存已编译的管线以减少卡顿：

```javascript
// 使用描述符作为缓存键
const pipelineCache = new Map();
const pipelineKey = JSON.stringify(pipelineDescriptor);

if (!pipelineCache.has(pipelineKey)) {
    const pipeline = device.createRenderPipeline(pipelineDescriptor);
    pipelineCache.set(pipelineKey, pipeline);
}
```

## 高级渲染技术

### 多渲染目标

单次渲染通道输出到多个颜色附件：

```wgsl
struct FragmentOutput {
    @location(0) albedo: vec4<f32>,
    @location(1) normal: vec4<f32>,
    @location(2) position: vec4<f32>,
    @location(3) metallic_roughness: vec4<f32>
};
```

### 实例化渲染

高效渲染多个相似对象：

```wgsl
@vertex
fn vs_main(
    @builtin(instance_index) instance: u32,
    @location(0) position: vec3<f32>
) -> VertexOutput {
    let world_matrix = instance_data[instance].transform;
    // ...
}
```

WebGPU 渲染管线通过其精心的设计和丰富的功能，为现代实时图形应用提供了强大而灵活的基础，使开发者能够在 Web 平台上实现接近原生性能的图形渲染效果。