# WebGPU 计算

WebGPU 计算是现代 Web 图形编程的革命性特性，它将 GPU 的强大并行计算能力引入 Web 平台。与传统的图形渲染不同，计算管线专注于通用目的计算，能够在数千个线程上并行执行复杂算法，为机器学习、科学计算、物理模拟等领域开辟了新的可能性。

## 计算管线概述

WebGPU 计算管线是一种专门用于通用并行计算的管线类型，它不涉及图形渲染的任何阶段，而是直接在 GPU 上执行计算任务。计算管线使用计算着色器，这些着色器在三维网格的工作组中并行执行。

**计算管线架构**：
```
计算管线创建 → 资源绑定 → 工作组调度 → 并行执行 → 结果获取
     ↓            ↓          ↓           ↓         ↓
 着色器模块     缓冲区绑定  线程组织      GPU计算   数据读取
```

与传统图形管线不同，计算管线没有固定的阶段流程，而是完全由开发者控制的计算内核。

## 计算着色器基础

计算着色器是计算管线的核心，使用 WGSL 编写，通过 `@compute` 属性标识。每个计算着色器定义了一个在多个线程上并行执行的计算内核。

### 基本计算着色器结构

```wgsl
// 简单的向量加法计算着色器
@group(0) @binding(0) var<storage, read> input_a: array<f32>;
@group(0) @binding(1) var<storage, read> input_b: array<f32>;
@group(0) @binding(2) var<storage, read_write> output: array<f32>;

@compute @workgroup_size(64)
fn main(
    @builtin(global_invocation_id) global_id: vec3<u32>
) {
    let index = global_id.x;
    
    // 边界检查
    if (index < arrayLength(&output)) {
        output[index] = input_a[index] + input_b[index];
    }
}
```

### 内置变量

计算着色器可以使用多种内置变量访问执行上下文：
```
global_invocation_id: 全局调用ID (三维)
local_invocation_id:  工作组内调用ID  
workgroup_id:         工作组ID
num_workgroups:       调度的工作组数量
```

## 工作组与执行模型

WebGPU 计算使用分层执行模型，将计算任务分解为工作组，每个工作组包含多个调用。

### 执行层次结构

**执行模型示意图**：
```
计算网格 (Compute Grid)
├── 工作组 X 维度
│   ├── 工作组 (0,0,0) → 64个调用
│   ├── 工作组 (1,0,0) → 64个调用
│   └── ...
├── 工作组 Y 维度
└── 工作组 Z 维度
```

每个工作组内部的调用可以共享内存和同步，而不同工作组之间完全独立。

### 工作组大小优化

工作组大小对性能有重大影响，需要根据硬件特性优化：

```wgsl
// 优化的工作组大小示例
@compute @workgroup_size(64, 1, 1)  // 1D工作组，适合向量操作
fn compute_1d() { /* ... */ }

@compute @workgroup_size(8, 8, 1)   // 2D工作组，适合图像处理  
fn compute_2d() { /* ... */ }

@compute @workgroup_size(4, 4, 4)   // 3D工作组，适合体积计算
fn compute_3d() { /* ... */ }
```

## 存储资源绑定

计算着色器通过存储缓冲区与存储纹理与外部数据交互，支持高效的读写操作。

### 存储缓冲区

存储缓冲区提供对结构化数据的高效访问：

```javascript
// 创建存储缓冲区
const storageBuffer = device.createBuffer({
    size: bufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    mappedAtCreation: true
});

// 在绑定组布局中定义存储缓冲区
const bindGroupLayout = device.createBindGroupLayout({
    entries: [
        {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: "read-only-storage"
            }
        },
        {
            binding: 1, 
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: "storage"
            }
        }
    ]
});
```

### 存储纹理

存储纹理允许计算着色器直接读写纹理数据：

```wgsl
@group(0) @binding(0) var output_image: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8)
fn image_processing(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let coord = vec2<i32>(global_id.xy);
    
    // 直接写入纹理
    textureStore(output_image, coord, vec4<f32>(1.0, 0.0, 0.0, 1.0));
}
```

## 计算管道创建

计算管道的创建比渲染管道更简单，只需要计算着色器模块和管线布局。

### 管道设置

```javascript
// 创建计算管道
const computePipeline = device.createComputePipeline({
    layout: pipelineLayout,
    compute: {
        module: computeShaderModule,
        entryPoint: 'main'
    }
});

// 创建管线布局
const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
});

// 创建绑定组
const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
        {
            binding: 0,
            resource: { buffer: inputBuffer }
        },
        {
            binding: 1,
            resource: { buffer: outputBuffer }
        }
    ]
});
```

## 计算通道编码

计算通道负责记录和执行计算命令，通过命令编码器管理。

### 计算通道设置

```javascript
// 开始计算通道
const computePass = commandEncoder.beginComputePass();

// 设置管道和资源
computePass.setPipeline(computePipeline);
computePass.setBindGroup(0, bindGroup);

// 调度计算工作组
const workgroupCountX = Math.ceil(dataSize / 64);
computePass.dispatchWorkgroups(workgroupCountX, 1, 1);

// 结束计算通道
computePass.end();
```

### 工作组调度

工作组调度决定了计算任务的并行程度：

```javascript
// 1D 调度 - 适合向量操作
computePass.dispatchWorkgroups(
    Math.ceil(arrayLength / 64),  // X 维度
    1,                            // Y 维度  
    1                             // Z 维度
);

// 2D 调度 - 适合图像处理
computePass.dispatchWorkgroups(
    Math.ceil(imageWidth / 8),    // X 维度
    Math.ceil(imageHeight / 8),   // Y 维度
    1                             // Z 维度
);

// 3D 调度 - 适合体积计算
computePass.dispatchWorkgroups(
    Math.ceil(volumeX / 4),       // X 维度
    Math.ceil(volumeY / 4),       // Y 维度
    Math.ceil(volumeZ / 4)        // Z 维度
);
```

## 共享内存与同步

工作组内的调用可以通过共享内存进行高效通信，并使用屏障进行同步。

### 工作组共享内存

```wgsl
var<workgroup> shared_data: array<f32, 64>;

@compute @workgroup_size(64)
fn parallel_reduction(@builtin(local_invocation_id) local_id: vec3<u32>) {
    let local_index = local_id.x;
    
    // 将数据加载到共享内存
    shared_data[local_index] = input_data[global_index];
    
    // 同步工作组内所有调用
    workgroupBarrier();
    
    // 现在可以安全地读取其他调用写入的共享数据
    if (local_index < 32) {
        shared_data[local_index] += shared_data[local_index + 32];
    }
    
    workgroupBarrier();
    
    // 继续归约操作...
}
```

### 原子操作

WebGPU 支持原子操作，用于无锁的并行算法：

```wgsl
@group(0) @binding(0) var<storage, read_write> atomic_counter: atomic<u32>;

@compute @workgroup_size(64)
fn atomic_example(@builtin(global_invocation_id) global_id: vec3<u32>) {
    // 原子增加
    atomicAdd(&atomic_counter, 1);
    
    // 原子比较交换
    var old_value = atomicLoad(&atomic_counter);
    while (!atomicCompareExchangeWeak(&atomic_counter, old_value, old_value + 1)) {
        old_value = atomicLoad(&atomic_counter);
    }
}
```

## 实用计算模式

### 归约操作

归约是将大量数据聚合为单个值的常见模式：

```wgsl
@compute @workgroup_size(64)
fn reduction(@builtin(local_invocation_id) local_id: vec3<u32>,
             @builtin(workgroup_id) workgroup_id: vec3<u32>) {
    let local_index = local_id.x;
    let workgroup_size = 64u;
    let global_index = workgroup_id.x * workgroup_size + local_index;
    
    // 加载数据到共享内存
    if (global_index < data_length) {
        shared_data[local_index] = input_data[global_index];
    } else {
        shared_data[local_index] = 0.0;
    }
    
    workgroupBarrier();
    
    // 并行归约
    var offset = workgroup_size / 2;
    while (offset > 0) {
        if (local_index < offset) {
            shared_data[local_index] += shared_data[local_index + offset];
        }
        workgroupBarrier();
        offset = offset / 2;
    }
    
    // 工作组结果
    if (local_index == 0) {
        partial_sums[workgroup_id.x] = shared_data[0];
    }
}
```

### 扫描操作

扫描 (前缀和) 是许多并行算法的基础：

```wgsl
@compute @workgroup_size(64)
fn prefix_sum(@builtin(local_invocation_id) local_id: vec3<u32>) {
    let local_index = local_id.x;
    
    // 加载数据
    shared_data[local_index] = input_data[global_index];
    workgroupBarrier();
    
    // 工作组内前缀和
    var stride = 1;
    while (stride < 64) {
        if (local_index >= stride) {
            shared_data[local_index] += shared_data[local_index - stride];
        }
        workgroupBarrier();
        stride *= 2;
    }
    
    // 保存结果
    output_data[global_index] = shared_data[local_index];
}
```

## 性能优化技术

### 内存访问模式

优化内存访问模式对性能至关重要：

**合并访问模式**：
```
优化前 (随机访问):   优化后 (连续访问):
[3,7,1,9,2,8,...]   [0,1,2,3,4,5,...]
   ↓                    ↓
缓存失效             缓存命中
```

### 占用率优化

保持足够的线程占用率以隐藏内存延迟：

```wgsl
// 低占用率 - 工作组太大
@compute @workgroup_size(256)  // 可能超出硬件限制
fn low_occupancy() { }

// 高占用率 - 适当的工作组大小  
@compute @workgroup_size(64)   // 适合大多数硬件
fn high_occupancy() { }
```

### 双缓冲技术

使用双缓冲区避免读写冲突：

```javascript
// 创建双缓冲区
const bufferA = device.createBuffer({ /* ... */ });
const bufferB = device.createBuffer({ /* ... */ });

// 交替使用缓冲区
let readBuffer = bufferA;
let writeBuffer = bufferB;

// 每帧交换
[readBuffer, writeBuffer] = [writeBuffer, readBuffer];
```

## 实际应用案例

### 物理模拟

计算着色器非常适合物理模拟：

```wgsl
@compute @workgroup_size(64)
fn physics_update(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let particle_index = global_id.x;
    
    if (particle_index < num_particles) {
        // 读取粒子状态
        var position = positions[particle_index];
        var velocity = velocities[particle_index];
        
        // 应用物理规则
        velocity += gravity * delta_time;
        position += velocity * delta_time;
        
        // 碰撞检测
        if (position.y < 0.0) {
            position.y = 0.0;
            velocity.y = -velocity.y * damping;
        }
        
        // 更新粒子状态
        positions[particle_index] = position;
        velocities[particle_index] = velocity;
    }
}
```

### 图像处理

并行处理图像像素：

```wgsl
@compute @workgroup_size(8, 8)
fn image_filter(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let coord = vec2<i32>(global_id.xy);
    
    // 应用卷积滤波器
    var sum = vec3<f32>(0.0);
    for (var y = -1; y <= 1; y++) {
        for (var x = -1; x <= 1; x++) {
            let sample_coord = coord + vec2<i32>(x, y);
            let sample_color = textureLoad(input_image, sample_coord, 0).rgb;
            let kernel_value = kernel[y + 1][x + 1];
            sum += sample_color * kernel_value;
        }
    }
    
    // 写入结果
    textureStore(output_image, coord, vec4<f32>(sum, 1.0));
}
```

## 调试与性能分析

### 调试技术

计算着色器的调试需要特殊技术：

```wgsl
// 调试输出技术
@group(0) @binding(0) var<storage, read_write> debug_buffer: array<f32>;

@compute @workgroup_size(64)
fn debug_example(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    
    // 写入调试信息
    debug_buffer[index] = some_computation_result;
    
    // 条件调试输出
    if (some_condition) {
        debug_buffer[0] = 1.0;  // 标记特殊条件
    }
}
```

### 性能测量

使用时间戳查询测量计算性能：

```javascript
// 创建查询集
const querySet = device.createQuerySet({
    type: 'timestamp',
    count: 2
});

// 在计算通道中插入时间戳
computePass.writeTimestamp(querySet, 0); // 开始时间
// ... 计算命令 ...
computePass.writeTimestamp(querySet, 1); // 结束时间
```

WebGPU 计算为 Web 平台带来了前所未有的并行计算能力，使得在浏览器中运行复杂的科学计算、机器学习和实时模拟成为现实。通过合理的工作组设计、内存访问优化和算法并行化，开发者可以充分利用现代 GPU 的强大算力。