# 基础

## 什么是 Web3D
Web3D 指在网页浏览器中实现 3D 图形渲染和交互的技术集合。它利用现代 Web 标准（如 WebGL）在无需插件的情况下创建沉浸式 3D 体验，广泛应用于游戏、可视化、教育和虚拟现实等领域。核心原理是通过 JavaScript API 调用 GPU 进行图形计算，将 3D 模型、光照和动画渲染到 HTML 画布中。

示意图：一个简单的 3D 场景（立方体在平面上）
```
    +------+
   /      /|
  /      / |
 +------+  |
 |      |  +
 |      | /
 |      |/
 +------+
```
（立方体置于一个平面上，代表基础 3D 对象）

## 核心技术
### WebGL
WebGL（Web Graphics Library）是基于 OpenGL ES 的底层 JavaScript API，允许在浏览器中直接渲染 2D 和 3D 图形。它提供对 GPU 的低级控制，适用于高性能图形应用，但需要手动处理着色器、缓冲区和渲染流程。

示意图：WebGL 渲染管线
```
顶点数据 -> 顶点着色器 -> 图元装配 -> 光栅化 -> 片段着色器 -> 帧缓冲
```
（纯文本表示图形渲染流程：数据从输入到最终像素输出）

API 示例：创建一个 WebGL 上下文并绘制三角形
```javascript
const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl');
// 设置顶点数据
const vertices = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
// 编译着色器
const vsSource = `
  attribute vec2 coordinates;
  void main(void) { gl_Position = vec4(coordinates, 0.0, 1.0); }
`;
const fsSource = `
  void main(void) { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }
`;
// 省略着色器编译和链接代码
gl.drawArrays(gl.TRIANGLES, 0, 3);
```

### Three.js
Three.js 是流行的 Web3D 库，封装了 WebGL 的复杂性，提供高级 API 用于创建场景、相机、渲染器和 3D 对象。它支持几何体、材质、光照和动画，适合快速开发。

示意图：Three.js 场景结构
```
Scene -> Camera -> Renderer
         |
         +-- Mesh(Geometry, Material)
         +-- Lights
         +-- Controls
```
（场景包含相机、网格对象、光照和控制器）

API 示例：创建一个旋转立方体
```javascript
import * as THREE from 'three';
// 初始化场景、相机和渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
// 创建立方体
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
camera.position.z = 5;
// 动画循环
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
```

### A-Frame
A-Frame 是基于 Three.js 的声明式框架，使用 HTML 标签创建 3D 场景，适合初学者和快速原型开发。它支持 VR 和 AR，通过自定义元素定义实体、组件和系统。

示意图：A-Frame 实体结构
```
<a-scene>
  <a-box position="0 1 -5" color="red"></a-box>
  <a-sky color="blue"></a-sky>
</a-scene>
```
（用 HTML 标签表示 3D 对象和环境）

API 示例：定义一个简单场景
```html
<script src="https://aframe.io/releases/1.3.0/aframe.min.js"></script>
<a-scene>
  <a-box position="-1 0.5 -3" rotation="0 45 0" color="#4CC3D9"></a-box>
  <a-sphere position="0 1.25 -5" radius="1.25" color="#EF2D5E"></a-sphere>
  <a-cylinder position="1 0.75 -3" radius="0.5" height="1.5" color="#FFC65D"></a-cylinder>
  <a-plane position="0 0 -4" rotation="-90 0 0" width="4" height="4" color="#7BC8A4"></a-plane>
  <a-sky color="#ECECEC"></a-sky>
</a-scene>
```

### Babylon.js
Babylon.js 是功能丰富的 Web3D 引擎，提供高级特性如物理引擎、后处理效果和粒子系统。它强调性能和跨平台兼容性，适合复杂应用。

示意图：Babylon.js 引擎流程
```
Engine -> Scene -> Meshes -> Materials -> Rendering
```
（引擎管理场景、网格和渲染过程）

API 示例：创建场景并添加模型
```javascript
import * as BABYLON from 'babylonjs';
// 初始化引擎和场景
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);
// 添加相机和光照
const camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
camera.attachControls(canvas);
const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);
// 创建球体
const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2}, scene);
sphere.position.y = 1;
// 渲染循环
engine.runRenderLoop(() => {
  scene.render();
});
```

## 相关技术列表
- **图形库和引擎**：Three.js、Babylon.js、A-Frame、PlayCanvas、PixiJS（2D/3D 混合）
- **底层 API**：WebGL、WebGPU（新兴标准）
- **3D 格式和工具**：glTF（标准 3D 格式）、OBJ、FBX、Blender（建模工具）
- **物理和动画**：Cannon.js（物理引擎）、Tween.js（动画补间）
- **VR/AR 支持**：WebXR API、Three.js VR 组件
- **着色器语言**：GLSL（用于 WebGL 着色器）
- **优化和工具**：WebGL Inspector、Spector.js（调试工具）、压缩纹理（如 Basis Universal）

## 核心概念
### 3D 坐标系
Web3D 使用右手坐标系：X 轴向右，Y 轴向上，Z 轴向外（从屏幕指向用户）。对象通过变换（平移、旋转、缩放）在空间中定位。

示意图：坐标系
```
    Y
    |
    |
    +---- X
   /
  /
 Z
```
（右手坐标系示意图：X、Y、Z 轴方向）

### 渲染管线
从 3D 数据到像素的流程包括顶点处理、图元装配、光栅化和片段处理。WebGL 和高级库抽象了这些步骤。

示意图：简化渲染流程
```
3D 模型 -> 顶点着色器 -> 片段着色器 -> 2D 像素
```
（数据流从模型坐标到屏幕像素）

### 光照和材质
光照模型（如 Phong）模拟光线与表面交互，材质定义颜色、反射和纹理属性。

示意图：光照效果
```
光源 -> 物体表面 -> 漫反射 + 镜面反射 -> 最终颜色
```
（光线照射到物体产生漫反射和高光）