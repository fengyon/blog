# WebGL 基础

WebGL (Web Graphics Library) 是一种基于 OpenGL ES 的 JavaScript API，用于在 Web 浏览器中渲染交互式 2D 和 3D 图形。它通过利用 GPU 加速来实现高性能图形渲染，为 Web 开发者提供了底层的图形硬件访问能力。

## WebGL 概述

WebGL 将 JavaScript 与 OpenGL ES 2.0 的功能相结合，允许在 HTML5 Canvas 元素中直接进行硬件加速的图形渲染。它提供了对图形管线的精细控制，是现代 Web 3D 应用的基石。

特点：
- 基于 OpenGL ES 2.0 标准
- 直接访问 GPU 硬件加速
- 跨平台、免插件
- 与 HTML5 生态系统深度集成

示意图 (WebGL 在 Web 中的位置)：
```
浏览器 → Canvas元素 → WebGL上下文 → GPU驱动
    ↓         ↓           ↓         ↓
 HTML     绘图表面     渲染API    硬件加速
```

## WebGL 上下文

WebGL 上下文是访问 WebGL 功能的入口点，通过 Canvas 元素获取。每个上下文维护独立的渲染状态和资源。

特点：
- 通过 canvas.getContext (‘webgl’) 获取
- 管理渲染状态、缓冲区、纹理等资源
- 支持 WebGL 1.0 和 WebGL 2.0

上下文初始化代码：
```javascript
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');
if (!gl) {
    console.error('WebGL 不支持');
}
```

状态机示意图：
```
WebGL上下文
├── 绘制状态 (深度测试、混合等)
├── 缓冲区对象 (顶点、索引)
├── 纹理单元
├── 着色器程序
└── 帧缓冲区
```

## 坐标系系统

WebGL 使用右手坐标系，坐标范围在裁剪空间中为 [-1，1]。理解坐标系转换是 WebGL 编程的基础。

特点：
- 标准化设备坐标：X/Y/Z 范围 [-1，1]
- 视口变换将 NDC 映射到屏幕像素
- 矩阵变换实现坐标系转换

坐标系示意图：
```
裁剪空间 (NDC)：
    Y
    |
-1  +---+ 1
  / |  /|
 /  | / |
+---+---+ X
|   |   |
|   +---+
|  /   /
| /   /
Z    /
-1  1
```

## 绘制基本图元

WebGL 支持多种基本图元类型，包括点、线和三角形。这些图元通过顶点数据定义。

特点：
- 三角形是最常用的图元
- 支持三角形带、扇形等优化模式
- 点精灵用于粒子效果

图元类型示意图：
```
点：● ● ● ●

线：├───┼───┤

三角形：▲  三角形带：▲▲▲  三角形扇：◑
       / \         / \ / \ / \       / \
      /   \       /   \   \   \     /   \
     ───────     ───────────────   ───────
```

绘制调用代码：
```javascript
// 绘制三角形
gl.drawArrays(gl.TRIANGLES, 0, 3);

// 使用索引绘制
gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
```

## 着色器程序

着色器是 WebGL 的核心，包括顶点着色器和片段着色器。它们运行在 GPU 上，控制渲染过程。

特点：
- 顶点着色器：处理每个顶点
- 片段着色器：处理每个像素
- 必须成对编译和链接

着色器创建流程：
```
创建着色器 → 指定源码 → 编译 → 检查错误
    ↓
创建程序 → 附加着色器 → 链接 → 使用程序
```

简单着色器示例：
```javascript
// 顶点着色器
const vsSource = `
    attribute vec4 aPosition;
    void main() {
        gl_Position = aPosition;
    }
`;

// 片段着色器
const fsSource = `
    void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // 红色
    }
`;
```

## 缓冲区对象

缓冲区用于在 CPU 和 GPU 之间传递数据，包括顶点数据、颜色、法线等。WebGL 使用 ArrayBuffer 存储二进制数据。

特点：
- 顶点缓冲区：存储顶点位置、颜色等
- 索引缓冲区：存储顶点索引，减少重复数据
- 数据一次性上传，多次使用

缓冲区操作示意图：
```
JavaScript数组 → 类型化数组 → WebGL缓冲区 → GPU内存
   [x,y,z,...]     Float32Array     gl.bufferData()
```

缓冲区管理代码：
```javascript
// 创建顶点缓冲区
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

// 设置顶点属性
gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(positionAttributeLocation);
```

## 纹理

纹理用于为 3D 模型添加表面细节，支持 2D 纹理、立方体贴图等类型。纹理数据可以来自图像、视频或 Canvas。

特点：
- 支持多种像素格式 (RGB、RGBA 等)
- 可配置的滤波和环绕模式
- MIPMAP 用于多级细节

纹理加载流程：
```
图像加载 → 创建纹理 → 设置参数 → 上传数据 → 生成MIPMAP
   ↓          ↓          ↓          ↓          ↓
<img>    gl.createTexture() gl.texParameteri() gl.texImage2D() gl.generateMipmap()
```

纹理坐标示意图：
```
纹理坐标 (0-1)：
(0,0) --- (1,0)
  |         |
  |  图像   |
  |         |
(0,1) --- (1,1)
```

## 变换矩阵

矩阵用于坐标变换，包括模型、视图和投影变换。WebGL 不提供内置矩阵函数，需要开发者自己实现或使用库。

特点：
- 4x4 齐次坐标矩阵
- 矩阵乘法实现变换组合
- 常用库：glMatrix、Three.js 矩阵类

变换流程示意图：
```
局部坐标 → 模型矩阵 → 世界坐标 → 视图矩阵 → 视图坐标 → 投影矩阵 → 裁剪坐标
   ↓          ↓          ↓          ↓          ↓          ↓          ↓
原始位置    移动旋转    场景位置    相机视角    相对相机    透视/正交   标准化坐标
```

矩阵设置代码：
```javascript
// 使用 glMatrix 库
const modelViewMatrix = mat4.create();
const projectionMatrix = mat4.create();

mat4.perspective(projectionMatrix, 45 * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -6.0]);

// 传递给着色器
gl.uniformMatrix4fv(matrixLocation, false, modelViewMatrix);
```

## 渲染状态

WebGL 使用状态机模型管理渲染设置，包括深度测试、混合、面剔除等。正确设置状态对渲染结果至关重要。

特点：
- 状态一旦设置，持续有效直到改变
- 状态改变可能影响性能
- 需要合理管理状态组合

常用状态设置：
```javascript
// 启用深度测试
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);

// 启用混合（透明度）
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

// 启用面剔除
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);
```

状态机示意图：
```
WebGL状态机
├── 深度测试: 启用/禁用
├── 混合: 启用/禁用 + 混合函数
├── 面剔除: 启用/禁用 + 剔除面
├── 模板测试: 启用/禁用 + 模板操作
└── 剪裁: 启用/禁用 + 剪裁平面
```

## 渲染循环

WebGL 应用通常使用渲染循环实现动画和交互。requestAnimationFrame 提供与显示器刷新率同步的循环机制。

特点：
- 与浏览器重绘同步
- 标签页不可见时自动暂停
- 提供高精度时间戳

渲染循环结构：
```javascript
function render(timestamp) {
    // 更新场景
    updateScene(timestamp);
    
    // 清除画布
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // 渲染对象
    renderObjects();
    
    // 继续循环
    requestAnimationFrame(render);
}

// 启动循环
requestAnimationFrame(render);
```

渲染流水线示意图：
```
清除 → 设置状态 → 绑定资源 → 绘制 → 交换缓冲区
 ↓        ↓         ↓        ↓        ↓
gl.clear() 状态设置 纹理/缓冲区 gl.drawArrays() 隐式完成
```

## 错误处理

WebGL 提供多种错误检查和调试机制，帮助开发者识别和解决问题。

特点：
- gl.getError() 获取错误代码
- 上下文丢失事件处理
- 着色器编译错误信息

错误处理代码：
```javascript
// 检查 WebGL 错误
const error = gl.getError();
if (error !== gl.NO_ERROR) {
    console.error('WebGL 错误:', error);
}

// 检查着色器编译状态
if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('着色器编译错误:', gl.getShaderInfoLog(shader));
}

// 处理上下文丢失
canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    // 保存状态，准备恢复
});
```

## 性能优化

WebGL 性能优化涉及减少绘制调用、合理使用缓冲区和纹理、优化着色器等多个方面。

优化策略示意图：
```
性能问题 → 分析瓶颈 → 应用优化 → 测试效果
    ↓          ↓          ↓         ↓
帧率低      CPU/GPU     批处理    验证改进
          负载不均    减少状态改变
```

常见优化技巧：
```javascript
// 1. 批处理绘制调用
// 2. 使用索引绘制减少顶点数据
// 3. 纹理图集减少纹理切换
// 4. 合理的 MIPMAP 级别
// 5. 避免在渲染循环中分配内存
```