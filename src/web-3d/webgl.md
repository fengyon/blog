# WebGL

## 什么是 WebGL
WebGL（Web Graphics Library）是基于 OpenGL ES 的底层 JavaScript API，允许在浏览器中直接渲染交互式 2D 和 3D 图形，无需插件。它通过利用 GPU 加速图形计算，为 Web 提供硬件级别的 3D 渲染能力。

示意图：WebGL 在浏览器中的位置
```
浏览器 -> JavaScript -> WebGL API -> GPU 驱动 -> 图形硬件
```

## 核心架构

### 渲染上下文
WebGL 通过 Canvas 元素获取渲染上下文，这是所有 WebGL 操作的入口点。

API 示例：初始化 WebGL 上下文
```javascript
// 获取 Canvas 元素
const canvas = document.getElementById('webgl-canvas');
canvas.width = 800;
canvas.height = 600;

// 获取 WebGL 上下文
const gl = canvas.getContext('webgl');
// 或者尝试 WebGL 2.0
// const gl = canvas.getContext('webgl2');

if (!gl) {
  console.error('WebGL not supported');
}

// 设置视口和清除颜色
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);  // 黑色背景
gl.clear(gl.COLOR_BUFFER_BIT);
```

### 渲染管线详解
WebGL 采用可编程渲染管线，主要包含顶点处理和片段处理两个可编程阶段。

示意图：WebGL 渲染管线
```
顶点数据
    ↓
顶点着色器 (可编程)
    ↓
图元装配
    ↓
光栅化
    ↓
片段着色器 (可编程)  
    ↓
颜色混合
    ↓
帧缓冲区
```

## 基础编程模型

### 着色器编程
WebGL 使用 GLSL ES（OpenGL ES Shading Language）编写着色器，这是类 C 的着色器语言。

API 示例：基础着色器程序
```javascript
// 顶点着色器 - 处理每个顶点的位置
const vertexShaderSource = `
  attribute vec4 aPosition;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  
  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
    gl_PointSize = 5.0;  // 点渲染大小
  }
`;

// 片段着色器 - 处理每个像素的颜色
const fragmentShaderSource = `
  precision mediump float;
  uniform vec4 uColor;
  
  void main() {
    gl_FragColor = uColor;
  }
`;

// 编译着色器函数
function compileShader(gl, source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// 创建着色器程序
const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error('Program link error:', gl.getProgramInfoLog(program));
}

gl.useProgram(program);
```

### 缓冲区管理
缓冲区用于在 CPU 和 GPU 之间传递顶点数据、颜色、纹理坐标等。

API 示例：顶点缓冲区创建和使用
```javascript
// 三角形顶点数据
const vertices = new Float32Array([
   0.0,  0.5, 0.0,  // 顶点1
  -0.5, -0.5, 0.0,  // 顶点2
   0.5, -0.5, 0.0   // 顶点3
]);

// 创建并绑定顶点缓冲区
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// 设置顶点属性指针
const positionAttributeLocation = gl.getAttribLocation(program, 'aPosition');
gl.vertexAttribPointer(
  positionAttributeLocation,
  3,         // 每个顶点的分量数 (x, y, z)
  gl.FLOAT,  // 数据类型
  false,     // 是否归一化
  0,         // 步长
  0          // 偏移量
);
gl.enableVertexAttribArray(positionAttributeLocation);
```

## 高级渲染技术

### 纹理映射
纹理用于为几何体表面添加细节，支持 2D 纹理、立方体贴图等。

API 示例：2D 纹理加载和绑定
```javascript
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // 临时填充纹理
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // 蓝色
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);
  
  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
    
    // 生成mipmap
    gl.generateMipmap(gl.TEXTURE_2D);
    
    // 设置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  };
  image.src = url;
  
  return texture;
}

// 使用纹理
const texture = loadTexture(gl, 'texture.jpg');
```

### 帧缓冲区与离屏渲染
帧缓冲区允许渲染到纹理，用于实现后期处理、阴影映射等高级效果。

API 示例：创建帧缓冲区进行离屏渲染
```javascript
function createFramebuffer(gl, width, height) {
  // 创建帧缓冲区
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  
  // 创建纹理附件
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
  // 创建深度缓冲区
  const depthBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
  
  // 附加到帧缓冲区
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
  
  // 检查帧缓冲区状态
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    console.error('Framebuffer is incomplete');
  }
  
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { framebuffer, texture };
}
```

## 3D 变换与矩阵运算

### 矩阵操作
WebGL 使用矩阵进行 3D 变换，包括模型变换、视图变换和投影变换。

API 示例：手动矩阵计算和传递
```javascript
// 创建模型视图矩阵
function createModelViewMatrix() {
  // 4x4 单位矩阵
  return [
    1, 0, 0, 0,
    0, 1, 0, 0, 
    0, 0, 1, 0,
    0, 0, -5, 1  // 沿 Z 轴平移
  ];
}

// 创建透视投影矩阵
function createProjectionMatrix(aspect) {
  const fov = Math.PI / 4;  // 45度视野
  const near = 0.1;
  const far = 100.0;
  
  const f = 1.0 / Math.tan(fov / 2);
  const rangeInv = 1 / (near - far);
  
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ];
}

// 设置矩阵uniform
const modelViewMatrix = createModelViewMatrix();
const projectionMatrix = createProjectionMatrix(canvas.width / canvas.height);

const modelViewLocation = gl.getUniformLocation(program, 'uModelViewMatrix');
const projectionLocation = gl.getUniformLocation(program, 'uProjectionMatrix');

gl.uniformMatrix4fv(modelViewLocation, false, modelViewMatrix);
gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
```

## 高级着色器技术

### 复杂光照着色器
实现 Phong 光照模型的顶点和片段着色器。

API 示例：完整的光照着色器
```javascript
// 带光照的顶点着色器
const lightingVertexShader = `
  attribute vec4 aPosition;
  attribute vec3 aNormal;
  
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform mat3 uNormalMatrix;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vec4 eyePosition = uModelViewMatrix * aPosition;
    
    vNormal = uNormalMatrix * aNormal;
    vPosition = eyePosition.xyz;
    
    gl_Position = uProjectionMatrix * eyePosition;
  }
`;

// 带光照的片段着色器
const lightingFragmentShader = `
  precision highp float;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  uniform vec3 uLightPosition;
  uniform vec3 uLightColor;
  uniform vec3 uAmbientColor;
  uniform vec3 uDiffuseColor;
  uniform vec3 uSpecularColor;
  uniform float uShininess;
  
  void main() {
    // 环境光
    vec3 ambient = uAmbientColor;
    
    // 漫反射
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightPosition - vPosition);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * uDiffuseColor;
    
    // 镜面反射
    vec3 viewDir = normalize(-vPosition);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
    vec3 specular = spec * uSpecularColor;
    
    // 最终颜色
    vec3 result = (ambient + diffuse + specular) * uLightColor;
    gl_FragColor = vec4(result, 1.0);
  }
`;
```

## WebGL 2.0 新特性

### 变换反馈与实例化渲染
WebGL 2.0 引入的新特性，提升渲染性能。

API 示例：实例化渲染
```javascript
// WebGL 2.0 实例化渲染
if (gl instanceof WebGL2RenderingContext) {
  // 实例化变换矩阵
  const instanceMatrices = new Float32Array(16 * 100); // 100个实例
  for (let i = 0; i < 100; i++) {
    const matrix = new Float32Array(instanceMatrices.buffer, i * 16 * 4, 16);
    // 设置每个实例的变换矩阵
  }
  
  const matrixBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, instanceMatrices, gl.STATIC_DRAW);
  
  // 设置矩阵属性 (4个vec4)
  for (let i = 0; i < 4; i++) {
    const loc = 3 + i; // 假设位置 3-6 用于矩阵
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 64, i * 16);
    gl.vertexAttribDivisor(loc, 1); // 每个实例更新一次
  }
  
  // 实例化绘制
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, 100); // 绘制100个实例
}
```

## 性能优化技术

### 状态管理与批处理
减少状态切换，批量处理渲染调用。

API 示例：渲染状态优化
```javascript
class WebGLRenderer {
  constructor(gl) {
    this.gl = gl;
    this.currentProgram = null;
    this.currentTexture = null;
  }
  
  setProgram(program) {
    if (this.currentProgram !== program) {
      this.gl.useProgram(program);
      this.currentProgram = program;
    }
  }
  
  setTexture(texture, unit = 0) {
    if (this.currentTexture !== texture) {
      this.gl.activeTexture(this.gl.TEXTURE0 + unit);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.currentTexture = texture;
    }
  }
  
  // 批量绘制函数
  drawMeshes(meshes) {
    // 按材质分组
    const grouped = this.groupByMaterial(meshes);
    
    for (const [material, meshGroup] of grouped) {
      this.setProgram(material.program);
      this.setTexture(material.texture);
      
      for (const mesh of meshGroup) {
        this.setupMeshAttributes(mesh);
        this.gl.drawElements(this.gl.TRIANGLES, mesh.indexCount, this.gl.UNSIGNED_SHORT, 0);
      }
    }
  }
}
```

## 相关技术列表

### 核心 API 技术
- **WebGL 1.0**: 基础 WebGL API，基于 OpenGL ES 2.0
- **WebGL 2.0**: 增强版本，基于 OpenGL ES 3.0，支持更多特性
- **GLSL ES 1.0**: WebGL 1.0 着色语言
- **GLSL ES 3.0**: WebGL 2.0 着色语言

### 扩展技术
- **OES_vertex_array_object**: 顶点数组对象扩展
- **EXT_texture_filter_anisotropic**: 各向异性过滤
- **WEBGL_depth_texture**: 深度纹理支持
- **OES_texture_float**: 浮点纹理支持
- **WEBGL_draw_buffers**: 多渲染目标

### 数学与工具库
- **glMatrix**: 高性能矩阵数学库
- **TWGL**: 简化 WebGL 编程的库
- **自定义数学库**: 优化的向量和矩阵运算

### 调试与分析工具
- **WebGL Inspector**: 功能完整的调试工具
- **Spector.js**: 实时帧调试器
- **浏览器开发者工具**: 内置 WebGL 调试支持

### 高级渲染技术
- **延迟渲染**: 多渲染目标技术
- **实时光照**: 动态光照和阴影
- **后处理效果**: 屏幕空间效果
- **粒子系统**: GPU 加速粒子
- **几何着色器**: WebGL 2.0 几何处理

### 纹理与缓冲区技术
- **压缩纹理**: ETC、ASTC 等压缩格式
- **渲染到纹理**: 帧缓冲区对象
- **像素缓冲区对象**: 异步数据传输
- **统一缓冲区**: WebGL 2.0 统一缓冲