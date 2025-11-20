# 着色器基础

着色器是运行在 GPU 上的特殊程序，用于控制 3D 图形的渲染过程。在 Web 3D 开发中，着色器是实现各种视觉效果的核心技术，从简单的颜色填充到复杂的光照和材质都需要通过着色器编程来实现。

## 着色器概述

着色器是使用 GLSL (OpenGL Shading Language) 编写的小程序，在图形渲染管线的特定阶段执行。现代图形管线主要包含顶点着色器和片段着色器两个可编程阶段。

特点：
- 专为并行处理设计，同时处理大量数据
- 直接控制图形硬件的渲染行为
- 提供硬件加速的数学运算

示意图 (着色器在渲染管线中的位置)：
```
顶点数据 → 顶点着色器 → 图元组装 → 光栅化 → 片段着色器 → 输出合并
              ↓                        ↓
         处理每个顶点            处理每个片段
```

## GLSL 语言基础

GLSL 是类 C 的着色器编程语言，具有严格的类型系统和图形专用的数据类型。语法与 C 语言相似，但包含许多图形学特有的内置变量和函数。

特点：
- 强类型语言，支持向量和矩阵运算
- 包含图形专用的内置变量 (如 gl_Position)
- 编译时类型检查，运行时高效执行

基本数据类型：
```glsl
float, int, bool        // 标量类型
vec2, vec3, vec4        // 浮点向量
mat2, mat3, mat4        // 矩阵类型
sampler2D, samplerCube  // 纹理采样器
```

## 顶点着色器

顶点着色器是渲染管线的第一个可编程阶段，负责处理每个顶点的变换和属性计算。每个顶点独立执行一次顶点着色器。

特点：
- 必须输出裁剪空间坐标到 gl_Position
- 可以计算和传递 varying 变量到片段着色器
- 常用于坐标变换和逐顶点光照

示意图 (顶点着色器处理)：
```
输入属性 → 顶点着色器 → 输出变量
位置、法线     ↓       裁剪坐标
         模型视图投影变换
         法线变换
         纹理坐标传递
```

示例顶点着色器结构：
```glsl
// 输入属性
attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord;

// 统一变量
uniform mat4 modelViewProjection;

// 输出到片段着色器
varying vec3 vNormal;
varying vec2 vTexCoord;

void main() {
    gl_Position = modelViewProjection * vec4(position, 1.0);
    vNormal = normal;
    vTexCoord = texCoord;
}
```

## 片段着色器

片段着色器处理每个像素片段的颜色计算，决定最终输出到屏幕的颜色。这是实现大多数视觉效果的关键阶段。

特点：
- 每个可见片段执行一次
- 必须输出颜色值 (gl_FragColor 或 out 变量)
- 可以进行纹理采样、光照计算、材质处理

示意图 (片段着色器处理)：
```
输入变量 → 片段着色器 → 输出颜色
法线、UV     ↓         RGBA颜色
         纹理采样
         光照计算
         颜色混合
```

示例片段着色器结构：
```glsl
// 从顶点着色器输入
varying vec3 vNormal;
varying vec2 vTexCoord;

// 统一变量
uniform sampler2D diffuseMap;
uniform vec3 lightDirection;

void main() {
    // 纹理采样
    vec4 diffuseColor = texture2D(diffuseMap, vTexCoord);
    
    // 简单光照
    float intensity = max(dot(normalize(vNormal), lightDirection), 0.0);
    
    // 输出颜色
    gl_FragColor = diffuseColor * intensity;
}
```

## 着色器变量限定符

GLSL 使用变量限定符定义数据的流向和行为。主要限定符包括 attribute、uniform、varying 和 const。

特点：
- attribute：每个顶点不同的输入数据
- uniform：所有顶点/片段共享的常量
- varying：从顶点到片段传递的插值数据

示意图 (变量数据流)：
```
CPU → uniform → 顶点着色器 → varying → 片段着色器
     ↓
   attribute → 顶点着色器
```

## 向量和矩阵运算

GLSL 内置了丰富的向量和矩阵运算支持，这些操作在硬件层面高度优化，非常适合图形计算。

特点：
- 分量访问 (。x， 。y， 。z， 。w 或。r， 。g， 。b， 。a)
- 逐分量运算和向量化函数
- 矩阵乘法符合线性代数规则

向量运算示例：
```glsl
vec3 a = vec3(1.0, 2.0, 3.0);
vec3 b = vec3(4.0, 5.0, 6.0);

// 逐分量加法
vec3 c = a + b;  // (5.0, 7.0, 9.0)

// 点积
float dotProduct = dot(a, b);  // 32.0

// 叉积
vec3 crossProduct = cross(a, b);  // (-3.0, 6.0, -3.0)
```

矩阵变换示意图：
```
局部坐标 → 模型矩阵 → 世界坐标 → 视图矩阵 → 视图坐标
  (x,y,z)    ↓        (x',y',z')   ↓       (x'',y'',z'')
        mat4 model        mat4 view
```

## 纹理采样

纹理采样是片段着色器中的重要操作，通过纹理坐标从纹理图像中获取颜色值。支持多种滤波和寻址模式。

特点：
- 使用 sampler2D 类型和 texture2D 函数
- 纹理坐标通常范围 [0,1]
- 支持多种滤波模式 (最近邻、线性)

纹理采样示意图：
```
纹理坐标 → 纹理采样 → 颜色值
  (u,v)       ↓        (r,g,b,a)
          纹理图像
          +-------+
          |#######|
          |#######|
          +-------+
```

纹理采样代码：
```glsl
uniform sampler2D diffuseTexture;
varying vec2 vTexCoord;

void main() {
    // 基本纹理采样
    vec4 color = texture2D(diffuseTexture, vTexCoord);
    
    // 带偏移的采样
    vec4 offsetColor = texture2D(diffuseTexture, vTexCoord + vec2(0.01, 0.0));
    
    gl_FragColor = color;
}
```

## 光照计算

着色器中的光照计算模拟光线与表面的交互，常见模型包括漫反射、镜面反射和环境光。

特点：
- 漫反射：Lambert 余弦定律
- 镜面反射：Phong 或 Blinn-Phong 模型
- 可以逐顶点或逐片段计算

漫反射示意图：
```
表面法线  光线方向
   ↑       ↗
   |      /
   |     /
   |    /
   | θ /
表面-------
cos(θ) = 点积(法线, 光线)
```

光照计算示例：
```glsl
varying vec3 vNormal;
uniform vec3 lightDirection;
uniform vec3 lightColor;

void main() {
    // 归一化法线
    vec3 normal = normalize(vNormal);
    
    // 漫反射强度（Lambert）
    float diffuse = max(dot(normal, lightDirection), 0.0);
    
    // 最终颜色
    vec3 color = lightColor * diffuse;
    
    gl_FragColor = vec4(color, 1.0);
}
```

## 着色器程序管理

在 WebGL 中，着色器需要编译、链接成程序对象后才能使用。这个过程包括源代码编译、错误检查和程序链接。

特点：
- 顶点和片段着色器必须成对使用
- 编译错误需要手动检查和处理
- 程序对象可以重复使用

示意图 (着色器程序创建流程)：
```
创建着色器 → 指定源码 → 编译 → 检查错误
    ↓
创建程序 → 附加着色器 → 链接 → 检查错误 → 使用程序
```

WebGL 着色器管理代码结构：
```javascript
// 创建着色器程序
function createShaderProgram(gl, vertexSrc, fragmentSrc) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSrc);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('链接错误:', gl.getProgramInfoLog(program));
    }
    
    return program;
}
```

## 属性与统一变量

属性 (attribute) 和统一变量 (uniform) 是 CPU 与 GPU 通信的主要方式，用于传递顶点数据和渲染参数。

特点：
- attribute：每个顶点不同的数据 (位置、法线、颜色等)
- uniform：绘制调用中保持不变的数据 (矩阵、颜色、时间等)

数据传递示意图：
```
JavaScript → 缓冲区 → attribute → 顶点着色器
         ↓
        uniform → 顶点/片段着色器
```

属性设置示例：
```javascript
// 设置顶点属性
const positionLocation = gl.getAttribLocation(program, 'position');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

// 设置统一变量
const matrixLocation = gl.getUniformLocation(program, 'modelViewProjection');
gl.uniformMatrix4fv(matrixLocation, false, matrix);
```

## 着色器调试技巧

着色器调试相对困难，常用的技巧包括使用颜色输出调试、简化测试和逐步完善的方法。

特点：
- 使用颜色编码显示中间值
- 从简单着色器开始逐步添加功能
- 利用浏览器开发者工具

调试颜色编码示例：
```glsl
void main() {
    // 用法线作为颜色（调试用）
    vec3 normal = normalize(vNormal);
    gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
    
    // 或用纹理坐标作为颜色
    // gl_FragColor = vec4(vTexCoord, 0.0, 1.0);
}
```

调试示意图：
```
正常渲染 → 问题出现 → 简化测试 → 颜色调试 → 定位问题
复杂场景    效果异常    简单几何    显示法线     修复代码
```