# WebXR

## 什么是WebXR

WebXR（Web Extended Reality）是一组用于在浏览器中构建**虚拟现实**（VR）和**增强现实**（AR）应用的开放标准。它允许开发者通过 JavaScript 和 WebGL 创建沉浸式体验，用户无需安装原生应用即可通过浏览器直接访问 VR 和 AR 内容。

示意图：WebXR 技术栈
```
浏览器 -> WebXR API -> 3D引擎 -> 图形硬件
         ↓
     VR/AR设备
```

## 核心概念与架构

### XR设备分类

WebXR 支持三类扩展现实设备：

- **VR**：完全沉浸式体验，如 Oculus Quest、HTC Vive
- **AR**：虚拟内容叠加到现实世界，如手机 ARKit/ARCore、HoloLens
- **MR**：虚拟与现实深度融合，如 Magic Leap

### WebXR API 核心模块

WebXR 设备 API 包含以下几个核心组件：

- **XRSession**：管理设备连接和会话状态
- **XRInputSource**：处理手柄、手势或凝视输入
- **XRFrame**：提供每一帧的渲染数据和设备状态
- **XRSpace**：定义坐标系系统
- **XRView**：管理左右眼的视口和投影矩阵

示意图：WebXR 渲染流程
```
XRSession -> XRFrame -> XRView -> 投影矩阵 -> 渲染循环
```

## 开发环境与设备要求

### 支持平台与浏览器

WebXR 已在多种现代浏览器中实现支持：

- **Chrome 79+**：全面支持 WebXR
- **Microsoft Edge**：支持 WebXR 标准
- **Firefox**：逐步完善 WebXR 支持
- **Safari**：在 Apple Vision Pro 的 visionOS 2 中实现默认支持

### 测试设备

- **VR 设备**：Oculus Quest、HTC Vive
- **手机 AR**：iOS（ARKit）或 Android（ARCore）设备
- **无设备测试**：可使用 WebXR API 模拟器扩展

## 开发流程与实践

### 环境检测与会话初始化

在进行 WebXR 开发前，需要先检测环境支持性并初始化 XR 会话：

```javascript
// 检测 WebXR 支持性
async function checkXRSupport() {
  if (!navigator.xr) {
    console.log("WebXR not supported");
    return false;
  }
  
  const vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
  const arSupported = await navigator.xr.isSessionSupported('immersive-ar');
  
  return { vrSupported, arSupported };
}
```

### Three.js 集成示例

Three.js 提供了简化的 WebXR 集成方式：

```javascript
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// 创建场景、相机、渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// 启用 WebXR
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

// 添加 3D 物体
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 启动 XR 渲染循环
renderer.setAnimationLoop(() => {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
});
```

### WebXR 会话管理

```javascript
let xrSession = null;

// 启动 XR 会话
async function startXRSession() {
  if (!navigator.xr) return;
  
  const sessionInit = { 
    optionalFeatures: ['local-floor', 'hand-tracking', 'bounded-floor']
  };
  
  try {
    xrSession = await navigator.xr.requestSession('immersive-vr', sessionInit);
    renderer.xr.setSession(xrSession);
    
    // 设置会话事件监听
    xrSession.addEventListener('end', onXRSessionEnded);
  } catch (error) {
    console.error('Failed to start XR session:', error);
  }
}

function onXRSessionEnded() {
  xrSession = null;
  // 返回非XR渲染循环
  renderer.setAnimationLoop(null);
}
```

## 输入处理与交互

### 手柄控制器输入

```javascript
function setupControllers() {
  const controllerModelFactory = new XRControllerModelFactory();
  
  // 左手控制器
  const controller1 = renderer.xr.getController(0);
  controller1.addEventListener('selectstart', onSelectStart);
  controller1.addEventListener('selectend', onSelectEnd);
  scene.add(controller1);
  
  // 右手控制器  
  const controller2 = renderer.xr.getController(1);
  controller2.addEventListener('selectstart', onSelectStart);
  controller2.addEventListener('selectend', onSelectEnd);
  scene.add(controller2);
}

function onSelectStart(event) {
  const controller = event.target;
  // 处理按钮按下逻辑
  console.log('Controller button pressed');
}

function onSelectEnd(event) {
  const controller = event.target;
  // 处理按钮释放逻辑
  console.log('Controller button released');
}
```

### 手部追踪

WebXR 支持高级的手部追踪功能：

```javascript
async function setupHandTracking() {
  const sessionInit = { 
    optionalFeatures: ['hand-tracking'] 
  };
  
  const xrSession = await navigator.xr.requestSession('immersive-vr', sessionInit);
  
  xrSession.addEventListener("inputsourceschange", (event) => {
    event.added.forEach((inputSource) => {
      if (inputSource.hand) {
        // 处理手部关节数据
        processHandSkeleton(inputSource.hand);
      }
    });
  });
}

function processHandSkeleton(hand) {
  hand.forEach((joint) => {
    console.log(joint.jointName, joint.transform.position);
    // 更新手部模型或进行交互检测
  });
}
```

## 高级特性

### 空间锚点

在 AR 应用中，空间锚点用于将虚拟物体固定在现实世界中的特定位置：

```javascript
// 创建空间锚点
async function createAnchor(position, orientation) {
  if (!xrSession) return;
  
  const anchorPose = new XRRigidTransform(position, orientation);
  const anchor = await xrSession.createAnchor(anchorPose, renderer.xr.getReferenceSpace());
  
  // 将锚点添加到场景
  scene.add(anchor.model);
  return anchor;
}
```

### 多视图渲染

WebXR 自动处理立体渲染，为每只眼睛提供不同的视角：

```javascript
function renderXRScene(timestamp, xrFrame) {
  const pose = xrFrame.getViewerPose(renderer.xr.getReferenceSpace());
  
  if (pose) {
    // 为每个视图（左眼、右眼）进行渲染
    for (const view of pose.views) {
      const viewport = renderer.xr.getViewport(view);
      renderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height);
      
      // 更新相机投影矩阵
      camera.projectionMatrix.fromArray(view.projectionMatrix);
      const viewTransform = new THREE.Matrix4().fromArray(view.transform.matrix);
      camera.matrixWorldInverse.copy(viewTransform).invert();
      
      // 渲染场景
      renderer.render(scene, camera);
    }
  }
}
```

## 性能优化

### 帧率管理

VR 应用对性能有严格要求，需要保持较高的帧率：

```javascript
// 帧率监控与优化
class PerformanceMonitor {
  constructor(targetFPS = 90) {
    this.targetFrameTime = 1000 / targetFPS;
    this.frameCount = 0;
    this.lastTime = performance.now();
  }
  
  beginFrame() {
    this.frameStart = performance.now();
  }
  
  endFrame() {
    const frameTime = performance.now() - this.frameStart;
    this.frameCount++;
    
    // 监控帧率
    if (performance.now() - this.lastTime >= 1000) {
      const fps = this.frameCount;
      console.log(`FPS: ${fps}`);
      this.frameCount = 0;
      this.lastTime = performance.now();
    }
    
    // 性能警告
    if (frameTime > this.targetFrameTime) {
      console.warn(`Frame time exceeded: ${frameTime.toFixed(2)}ms`);
    }
  }
}
```

### 内存管理与垃圾回收优化

WebXR 应用需要特别注意内存管理以避免垃圾回收导致的卡顿：

```javascript
// 对象池模式减少垃圾回收
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.available = [];
    
    for (let i = 0; i < initialSize; i++) {
      const obj = this.createFn();
      this.pool.push(obj);
      this.available.push(obj);
    }
  }
  
  acquire() {
    if (this.available.length === 0) {
      const obj = this.createFn();
      this.pool.push(obj);
      return obj;
    }
    return this.available.pop();
  }
  
  release(obj) {
    this.resetFn(obj);
    this.available.push(obj);
  }
}

// 重用矩阵和向量对象
const matrixPool = new ObjectPool(
  () => new THREE.Matrix4(),
  (matrix) => matrix.identity(),
  20
);
```

### 渲染优化技巧

```javascript
// 应用渲染优化
function applyRenderingOptimizations(renderer, scene) {
  // 1. 启用纹理压缩
  renderer.textureCompression = true;
  
  // 2. 设置适当的渲染参数
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  
  // 3. 优化场景
  scene.traverse((object) => {
    if (object.isMesh) {
      // 合并几何体以减少绘制调用
      object.frustumCulled = true;
      
      // 使用实例化渲染重复物体
      if (object.instanceCount > 1) {
        object.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      }
    }
  });
}
```

## 相关技术生态

### 开发框架与引擎

WebXR 生态系统包含多个成熟的开发框架：

- **Three.js**：基于 WebGL 的 3D 渲染库，简化 WebXR 集成
- **Babylon.js**：功能强大的 3D 引擎，内置完整的 WebXR 支持
- **A-Frame**：基于 Three.js 的声明式 WebVR/AR 框架，使用 HTML 标签创建场景
- **PlayCanvas**：基于 WebGL 的游戏引擎，支持 WebXR
- **LayaAir**：从 2.13 版本开始支持 WebXR 标准
- **React 360**：基于 React 的 VR 应用开发框架

### 工具与调试

WebXR 开发涉及多种调试和性能分析工具：

- **Chrome DevTools**：检查 WebXR 会话、帧率和性能
- **WebXR Emulator Extension**：无设备时的会话测试
- **Spector.js**：WebGL 调试工具
- **OVR Profiler Tool**：VR 专用性能分析
- **WebXR Polyfill**：兼容不支持 WebXR 的老设备

## 应用场景与案例

### 教育领域
德州大学奥斯汀分校的 Texas Immersive Institute 使用 WebXR 技术让学生创建虚拟美术馆、冒险游戏和未来科幻模拟等沉浸式教育体验。

### 企业培训
东吴大学开发了基于 WebXR 的 CPR 与 AED 急救 VR 模拟系统和实验室安全 VR 教学互动系统，提供安全的虚拟训练环境。

### 电商与展示
WebXR 支持沉浸式电商体验，用户可以在虚拟空间中查看产品和进行交互式产品展示。

## 兼容性与降级方案

### 特性检测与降级

```javascript
class XRApplication {
  constructor() {
    this.capabilities = {
      vr: false,
      ar: false,
      handTracking: false
    };
  }
  
  async initialize() {
    // 检测各项功能支持性
    if (navigator.xr) {
      this.capabilities.vr = await navigator.xr.isSessionSupported('immersive-vr');
      this.capabilities.ar = await navigator.xr.isSessionSupported('immersive-ar');
      
      // 检查手部追踪支持
      if (this.capabilities.vr) {
        const session = await navigator.xr.requestSession('immersive-vr', {
          optionalFeatures: ['hand-tracking']
        });
        this.capabilities.handTracking = true;
        session.end();
      }
    }
    
    // 根据支持情况初始化应用
    this.setupApplication();
  }
  
  setupApplication() {
    if (this.capabilities.vr || this.capabilities.ar) {
      this.setupXRExperience();
    } else {
      this.setupFallbackExperience(); // 传统 3D 或 2D 体验
    }
  }
}
```