# Web GPU 计算

## 概述

WebGPU 计算管线是通用 GPU 计算在 Web 平台上的实现，它突破了传统图形渲染的限制，让开发者能够利用 GPU 的大规模并行架构进行通用目的计算。与图形渲染管线不同，计算管线专注于数据并行处理，不涉及图元装配、光栅化等图形特定阶段。

```
计算管线架构：
[CPU 发起计算] → [计算管线] → [工作组执行] → [结果回读]
     ↓               ↓           ↓           ↓
 [数据准备]      [着色器]    [并行处理]   [数据获取]
```

## 计算管线基础

### 计算管线创建

计算管线由计算着色器和管线布局组成：

```javascript
const computePipeline = device.createComputePipeline({
    layout: pipelineLayout,
    compute: {
        module: computeShaderModule,
        entryPoint: 'main',
        constants: {} // 编译时常量
    }
});
```

### 计算着色器结构

WGSL 计算着色器使用特殊的 compute 阶段和工作组配置：

```wgsl
@compute @workgroup_size(64)
fn main(
    @builtin(global_invocation_id) global_id: vec3<u32>,
    @builtin(local_invocation_id) local_id: vec3<u32>,
    @builtin(workgroup_id) group_id: vec3<u32>
) {
    // 计算逻辑
}
```

## 执行模型与层级

### 工作组架构

WebGPU 计算采用三级并行层次结构：

```
执行层次：
[调度网格] → [工作组] → [子组] → [调用]
    ↓          ↓         ↓       ↓
 [全局]      [共享内存] [SIMD] [单个线程]
```

### 工作组配置

工作组大小影响性能和资源使用：

```wgsl
// 一维工作组
@workgroup_size(64)

// 二维工作组  
@workgroup_size(8, 8)

// 三维工作组
@workgroup_size(4, 4, 4)
```

```
工作组调度：
全局网格: [64, 64, 1]   → 4096 个调用
工作组:   [8, 8, 1]     → 64 个调用/工作组
调度:    [8, 8, 1]      → 64 个工作组
```

## 内存模型

### 存储类

WebGPU 计算支持多种存储类型：

```
存储类层次：
<storage, read_write>   -- 可读写存储缓冲区
<storage, read>         -- 只读存储缓冲区  
<uniform>               -- Uniform 缓冲区
<workgroup>             -- 工作组共享内存
<private>               -- 线程私有内存
```

### 缓冲区类型

```javascript
// 存储缓冲区 - 通用数据存储
const storageBuffer = device.createBuffer({
    size: bufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
});

// Uniform 缓冲区 - 常量数据
const uniformBuffer = device.createBuffer({
    size: 256,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});
```

### 工作组共享内存

工作组内线程间共享的高速内存：

```wgsl
var<workgroup> shared_data: array<f32, 64>;

@compute @workgroup_size(64)
fn main() {
    let local_id = local_invocation_id.x;
    shared_data[local_id] = 0.0;
    
    workgroupBarrier(); // 内存同步
    
    // 所有线程现在都能看到其他线程写入的数据
}
```

## 计算模式与算法

### 数据并行模式

#### Map 操作
```wgsl
@compute @workgroup_size(64)
fn map_compute(
    @builtin(global_invocation_id) id: vec3<u32>
) {
    let idx = id.x;
    if (idx < arrayLength(&input)) {
        output[idx] = input[idx] * 2.0 + 1.0;
    }
}
```

#### Reduce 操作
```wgsl
var<workgroup> partial_sums: array<f32, 64>;

@compute @workgroup_size(64)
fn reduce_compute(
    @builtin(global_invocation_id) global_id: vec3<u32>,
    @builtin(local_invocation_id) local_id: vec3<u32>
) {
    let idx = global_id.x;
    let local_idx = local_id.x;
    
    // 第一阶段：工作组内归约
    partial_sums[local_idx] = input[idx];
    workgroupBarrier();
    
    // 树状归约
    var offset = 32u;
    while (offset > 0u) {
        if (local_idx < offset) {
            partial_sums[local_idx] += partial_sums[local_idx + offset];
        }
        workgroupBarrier();
        offset = offset / 2u;
    }
    
    // 工作组0号线程写入结果
    if (local_idx == 0u) {
        output[workgroup_id.x] = partial_sums[0];
    }
}
```

### 扫描算法

```wgsl
// 并行前缀和
var<workgroup> scan_data: array<f32, 128>;

@compute @workgroup_size(128)
fn scan_compute(
    @builtin(local_invocation_id) local_id: vec3<u32>
) {
    let idx = local_id.x;
    
    // 上行扫描
    var stride = 1u;
    while (stride <= 64u) {
        workgroupBarrier();
        if (idx >= stride) {
            scan_data[idx] += scan_data[idx - stride];
        }
        stride = stride * 2u;
    }
    
    // 下行扫描
    if (idx == 0) {
        scan_data[127] = 0.0;
    }
    
    stride = 64u;
    while (stride > 0u) {
        workgroupBarrier();
        if (idx < stride) {
            let temp = scan_data[idx];
            scan_data[idx] = scan_data[idx + stride];
            scan_data[idx + stride] = temp + scan_data[idx + stride];
        }
        stride = stride / 2u;
    }
}
```

## 同步与通信

### 内存屏障

控制内存访问顺序和可见性：

```wgsl
@compute @workgroup_size(64)
fn synchronized_compute() {
    // 写入存储缓冲区
    output_data[local_id.x] = computed_value;
    
    // 确保所有写入在后续读取前完成
    storageBarrier();
    
    // 现在可以安全读取其他线程写入的数据
    let other_value = output_data[(local_id.x + 1) % 64];
}
```

### 工作组同步

```wgsl
@compute @workgroup_size(64)
fn workgroup_sync_example() {
    // 所有线程到达此点
    workgroupBarrier();
    
    // 仅工作组内内存同步
    workgroupBarrier();
    
    // 存储缓冲区同步（更重，但跨工作组）
    storageBarrier();
}
```

## 实际应用案例

### 图像处理

```wgsl
@group(0) @binding(0) var input_image: texture_2d<f32>;
@group(0) @binding(1) var output_image: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8)
fn image_blur(
    @builtin(global_invocation_id) id: vec3<u32>
) {
    let coord = vec2<i32>(id.xy);
    var sum = vec4<f32>(0.0);
    
    // 3x3 高斯模糊
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            let sample_coord = vec2<i32>(coord.x + i, coord.y + j);
            let weight = gaussian_weights[i + 1][j + 1];
            sum += textureLoad(input_image, sample_coord, 0) * weight;
        }
    }
    
    textureStore(output_image, coord, sum);
}
```

### 物理模拟

```wgsl
struct Particle {
    position: vec3<f32>,
    velocity: vec3<f32>,
    force: vec3<f32>,
    mass: f32
}

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;

@compute @workgroup_size(64)
fn nbody_simulation(
    @builtin(global_invocation_id) id: vec3<u32>
) {
    let idx = id.x;
    var force = vec3<f32>(0.0);
    
    // N-body 力计算
    for (var i = 0u; i < arrayLength(&particles); i++) {
        if (i == idx) {
            continue;
        }
        
        let delta = particles[i].position - particles[idx].position;
        let distance = length(delta);
        let dir = normalize(delta);
        
        // 引力计算
        force += G * particles[i].mass * particles[idx].mass * 
                dir / (distance * distance + softening);
    }
    
    particles[idx].force = force;
}

@compute @workgroup_size(64)  
fn integrate_particles(
    @builtin(global_invocation_id) id: vec3<u32>
) {
    let idx = id.x;
    let dt = 0.016; // 时间步长
    
    // 积分运动方程
    let acceleration = particles[idx].force / particles[idx].mass;
    particles[idx].velocity += acceleration * dt;
    particles[idx].position += particles[idx].velocity * dt;
    particles[idx].force = vec3<f32>(0.0);
}
```

## 性能优化

### 内存访问模式

优化内存访问对性能至关重要：

```
内存访问模式：
合并访问: [线程0→地址0] [线程1→地址1] [线程2→地址2] → 高效
分散访问: [线程0→地址100] [线程1→地址50] [线程2→地址200] → 低效
```

### 占用率优化

平衡工作组大小和资源使用：

```wgsl
// 优化工作组大小考虑因素：
// - 可用寄存器数量
// - 共享内存使用量  
// - GPU 计算单元数量
// - 内存带宽限制
```

### 计算优化模式

```wgsl
// 使用子组操作（如果支持）
let subgroup_value = subgroupAdd(local_value);

// 向量化操作
let vec4_data = vec4<f32>(data[idx], data[idx+1], data[idx+2], data[idx+3]);
let result = vec4_data * weights;

// 循环展开
for (var i = 0u; i < 4u; i++) {
    // 手动展开循环以减少控制流开销
    process_element(i);
}
```

## 高级计算特性

### 原子操作

```wgsl
@group(0) @binding(0) var<storage, read_write> atomic_counter: atomic<u32>;

@compute @workgroup_size(64)
fn atomic_example() {
    // 原子增加
    let old_value = atomicAdd(&atomic_counter, 1u);
    
    // 原子比较交换
    var expected = 0u;
    while (!atomicCompareExchangeWeak(&atomic_counter, &expected, old_value + 1u)) {
        // 重试直到成功
    }
}
```

### 子组操作

```wgsl
@compute @workgroup_size(64)
fn subgroup_operations() {
    let local_value = f32(local_invocation_id.x);
    
    // 子组内归约
    let subgroup_sum = subgroupAdd(local_value);
    let subgroup_max = subgroupMax(local_value);
    let subgroup_min = subgroupMin(local_value);
    
    // 子组内广播
    let broadcast_value = subgroupBroadcast(local_value, 0u);
    
    // 子组内洗牌
    let shuffled = subgroupShuffle(local_value, (local_invocation_id.x + 1u) % 4u);
}
```

## 调试与分析

### 计算管线调试

```wgsl
// 使用调试输出
@group(0) @binding(0) var<storage, read_write> debug_buffer: array<u32>;

@compute @workgroup_size(64)
fn debug_compute() {
    debug_buffer[global_invocation_id.x] = some_value;
    
    // 插入调试标记
    debug_printf("Thread %d computed value: %f", global_invocation_id.x, some_value);
}
```

### 性能分析

通过时间戳查询测量计算性能：

```javascript
const querySet = device.createQuerySet({
    type: 'timestamp',
    count: 2
});

// 在计算通道开始和结束处写入时间戳
const computePass = commandEncoder.beginComputePass({
    timestampWrites: {
        querySet: querySet,
        beginningOfPassWriteIndex: 0,
        endOfPassWriteIndex: 1
    }
});
```

WebGPU 计算管线为 Web 平台带来了前所未有的通用计算能力，使得复杂的科学计算、机器学习推理、实时物理模拟等应用能够在浏览器中高效运行，开启了 Web 高性能计算的新时代。