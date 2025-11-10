# 核心原理

## 图形渲染管线

### 管线概述
图形渲染管线是将 3D 模型数据转换为屏幕像素的固定流程。现代 GPU 采用可编程管线，允许开发者自定义着色器阶段。

示意图：完整渲染管线流程
```
CPU侧: 3D模型数据 -> 顶点数据 -> 图元装配
                      ↓
GPU侧: 顶点着色器 -> 曲面细分 -> 几何着色器 -> 光栅化 -> 片段着色器 -> 混合测试 -> 帧缓冲
```

### 顶点处理阶段
顶点着色器处理每个顶点，进行坐标变换和基础属性计算。这是模型从局部空间到裁剪空间的关键转换。

示意图：顶点变换过程
```
局部坐标 -> 世界矩阵 -> 世界坐标 -> 视图矩阵 -> 视图坐标 -> 投影矩阵 -> 裁剪坐标
```

API 示例：WebGL 顶点着色器
```javascript
// 顶点着色器代码
const vertexShaderSource = `
  attribute vec4 aVertexPosition;
  attribute vec2 aTextureCoord;
  
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  
  varying highp vec2 vTextureCoord;
  
  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;
  }
`;

// JavaScript 中设置矩阵
const modelViewMatrix = mat4.create();
const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);
mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -6.0]);
```

### 光栅化与片段处理
光栅化将图元转换为像素，片段着色器计算每个像素的最终颜色，处理纹理、光照等效果。

示意图：三角形光栅化
```
   顶点
   /\
  /  \    ->  扫描线转换  ->  像素网格
 /____\
```

API 示例：片段着色器与纹理采样
```javascript
// 片段着色器代码
const fragmentShaderSource = `
  varying highp vec2 vTextureCoord;
  uniform sampler2D uSampler;
  
  void main(void) {
    gl_FragColor = texture2D(uSampler, vTextureCoord);
  }
`;

// WebGL 纹理设置
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
```

## 3D 数学基础

### 变换矩阵
矩阵用于表示物体的平移、旋转、缩放变换，通过矩阵乘法实现复合变换。

示意图：变换矩阵结构
```
平移矩阵    旋转矩阵    缩放矩阵
[1 0 0 tx]  [rx1 rx2 rx3 0]  [sx 0  0  0]
[0 1 0 ty]  [ry1 ry2 ry3 0]  [0  sy 0  0]
[0 0 1 tz]  [rz1 rz2 rz3 0]  [0  0  sz 0]
[0 0 0 1 ]  [0   0   0   1]  [0  0  0  1]
```

API 示例：Three.js 中的矩阵变换
```javascript
// 创建变换矩阵
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);

// 直接变换
cube.position.set(2, 1, 0);
cube.rotation.x = Math.PI / 4;
cube.scale.set(1.5, 1.5, 1.5);

// 矩阵操作
const matrix = new THREE.Matrix4();
matrix.makeRotationX(Math.PI / 6);
matrix.setPosition(1, 2, 3);
cube.applyMatrix4(matrix);
```

### 坐标系系统
Web3D 涉及多个坐标空间：模型空间、世界空间、视图空间、裁剪空间和屏幕空间。

示意图：坐标系变换链
```
模型空间 -> 世界空间 -> 视图空间 -> 裁剪空间 -> 屏幕空间
   ↓         ↓          ↓          ↓          ↓
局部坐标 -> 场景坐标 -> 相机坐标 -> 标准化坐标 -> 像素坐标
```

### 四元数与旋转
四元数用于表示 3D 旋转，避免万向节锁问题，提供平滑插值。

API 示例：四元数旋转
```javascript
// Three.js 四元数使用
const quaternion = new THREE.Quaternion();
// 绕 Y 轴旋转 90 度
quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);

// 球面线性插值
const startQuat = new THREE.Quaternion();
const endQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
const resultQuat = new THREE.Quaternion();

resultQuat.slerpQuaternions(startQuat, endQuat, 0.5); // 中间插值
```

## 着色器编程原理

### 着色器语言基础
GLSL（OpenGL Shading Language）是 WebGL 的着色器语言，类 C 语法，专为图形计算优化。

API 示例：复杂着色器效果
```javascript
// 顶点着色器 - 波浪效果
const waveVertexShader = `
  attribute vec3 position;
  attribute vec2 uv;
  
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float time;
  
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    
    // 顶点动画 - 正弦波浪
    vec3 newPosition = position;
    newPosition.y += sin(position.x * 4.0 + time) * 0.1;
    newPosition.y += cos(position.z * 4.0 + time) * 0.1;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

// 片段着色器 - 渐变纹理
const gradientFragmentShader = `
  precision mediump float;
  
  varying vec2 vUv;
  uniform float time;
  
  void main() {
    // 动态渐变效果
    vec3 color1 = vec3(0.2, 0.3, 0.8);
    vec3 color2 = vec3(0.8, 0.1, 0.2);
    
    float mixValue = (sin(time) + 1.0) * 0.5;
    vec3 finalColor = mix(color1, color2, mixValue);
    
    // 添加 UV 渐变
    finalColor = mix(finalColor, vec3(1.0), vUv.x * 0.3);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
```

###  uniforms 与 attributes
uniforms 用于传递全局常量，attributes 用于逐顶点数据，varyings 用于顶点到片段的数据传递。

示意图：着色器数据流
```
attributes (逐顶点) -> 顶点着色器 -> varyings (插值) -> 片段着色器
uniforms (全局)    -> 两个阶段共用
```

## 光照与材质模型

### 光照计算原理
Phong 光照模型包含环境光、漫反射和镜面反射三个分量。

示意图：Phong 光照分量
```
最终颜色 = 环境光 + 漫反射 + 镜面反射
           ↓         ↓         ↓
       全局光照    Lambert    Phong高光
```

API 示例：Three.js 中的物理材质
```javascript
// PBR (基于物理的渲染) 材质
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.4,        // 粗糙度 0-1
  metalness: 0.8,        // 金属度 0-1
  normalMap: normalTexture,
  envMap: environmentMap
});

// 设置光源
const ambientLight = new THREE.AmbientLight(0x404040, 0.4); // 环境光
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 10, 7);

scene.add(ambientLight);
scene.add(directionalLight);
```

### 法线贴图原理
法线贴图通过 RGB 颜色存储表面法线信息，在不增加几何复杂度的情况下增加细节。

示意图：法线贴图效果
```
平坦表面 + 法线贴图 = 视觉凹凸细节
[平面]   +  [RGB法线] = [看起来有凹凸]
```

## 性能优化原理

### 渲染状态管理
减少 GPU 状态切换，批量处理相同材质的物体，使用实例化渲染。

示意图：渲染批处理
```
优化前: 渲染A -> 状态切换 -> 渲染B -> 状态切换 -> 渲染A
优化后: 渲染A -> 渲染A -> 状态切换 -> 渲染B -> 渲染B
```

API 示例：Three.js 实例化渲染
```javascript
// 实例化几何体
const geometry = new THREE.InstancedBufferGeometry();
geometry.copy(originalGeometry);

// 实例化变换矩阵
const instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(instanceCount * 16), 16);
for (let i = 0; i < instanceCount; i++) {
  const matrix = new THREE.Matrix4();
  matrix.setPosition(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50);
  matrix.toArray(instanceMatrix.array, i * 16);
}
geometry.setAttribute('instanceMatrix', instanceMatrix);

const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
```

### 层次细节 (LOD)
根据物体与相机的距离使用不同精度的模型，减少远处物体的渲染开销。

示意图：LOD 层次
```
近距离: 高模 (10000三角形)
中等距离: 中模 (2000三角形)  
远距离: 低模 (500三角形)
```

## 相关技术列表

### 底层图形技术
- **WebGL 1.0/2.0**: 基础 3D 图形 API
- **WebGPU**: 下一代图形 API，更好的性能和特性支持
- **SPIR-V**: 着色器中间语言
- **WebGL 扩展**: OES_vertex_array_object, EXT_texture_filter_anisotropic 等

### 着色器技术
- **GLSL**: OpenGL 着色语言
- **WGSL**: WebGPU 着色语言
- **着色器变体**: 条件编译优化
- **计算着色器**: GPU 通用计算

### 高级渲染技术
- **延迟渲染**: 多渲染目标技术
- **前向+渲染**: 混合渲染管线
- **实时光追**: WebGL 光线追踪扩展
- **全局光照**: 光线追踪全局光照

### 数学库与工具
- **glMatrix**: 高效矩阵数学库
- **Three.js Math**: 内置数学工具
- **自定义数学库**: 优化的数学运算

### 性能分析工具
- **WebGL Inspector**: 渲染调试
- **Spector.js**: 帧分析工具
- **浏览器性能面板**: 内置性能分析