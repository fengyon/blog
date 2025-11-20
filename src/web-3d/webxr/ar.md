# AR 开发

## WebXR AR 概述

WebXR AR 是一套允许在浏览器中创建**增强现实体验**的开放标准，它将数字内容叠加到用户对真实世界的实时视图上。与虚拟现实创造完全数字化的环境不同，AR 开发专注于将虚拟对象无缝集成到物理环境中。

```
WebXR AR 技术栈
├── 设备层 (智能手机、AR眼镜、平板电脑等)
├── 浏览器层 (支持 WebXR AR 的现代浏览器)
├── WebXR Device API (核心标准)
├── 3D 图形库 (Three.js, A-Frame, Babylon.js 等)
└── 应用层 (电商、教育、导航等 AR 体验)
```

## WebXR AR 核心概念

### 会话类型与模式

WebXR AR 主要使用 `immersive-ar` 会话类型，与 VR 的 `immersive-vr` 会话区分。这种会话类型让开发者能够访问设备摄像头并将 3D 内容叠加到现实世界视图上。

```javascript
// 检测 AR 支持性
async function checkARSupport() {
  if (navigator.xr) {
    const supported = await navigator.xr.isSessionSupported('immersive-ar');
    console.log(`AR supported: ${supported}`);
    return supported;
  }
  return false;
}

// 启动 AR 会话
async function startARSession() {
  try {
    const session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['local', 'hit-test'],
      optionalFeatures: ['dom-overlay', 'light-estimation']
    });
    return session;
  } catch (error) {
    console.error('AR session failed:', error);
  }
}
```

### 环境理解与空间追踪

AR 应用的核心是理解真实环境并将虚拟内容准确放置其中：

```
空间追踪层级
├── 命中测试 (Hit Test)
│   └── 检测视线与真实表面的交点
├── 平面检测 (Plane Detection)
│   └── 识别水平/垂直表面(地面、墙壁)
├── 锚点 (Anchors)
│   └── 将虚拟对象锁定在真实空间位置
└── 光照估计 (Light Estimation)
    └── 匹配虚拟与真实环境光照条件
```

## 开发环境配置

### 基础开发设置

```javascript
import * as THREE from 'three';

class ARApplication {
  constructor() {
    this.init();
  }
  
  async init() {
    // 初始化 Three.js 场景
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true,
      antialias: true 
    });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    document.body.appendChild(this.renderer.domElement);
    
    // 检查 AR 支持并启动
    if (await this.checkARSupport()) {
      this.setupARSession();
    }
  }
  
  async checkARSupport() {
    return navigator.xr && await navigator.xr.isSessionSupported('immersive-ar');
  }
  
  async setupARSession() {
    // 配置 AR 会话选项
    const session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['local', 'hit-test'],
      optionalFeatures: ['dom-overlay']
    });
    
    this.renderer.xr.setSession(session);
    
    // 设置参考空间
    this.referenceSpace = await session.requestReferenceSpace('local');
    
    // 启动渲染循环
    this.renderer.setAnimationLoop(this.render.bind(this));
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
```

### DOM 叠加配置

DOM 叠加允许将 HTML 元素集成到 AR 体验中：

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .ar-overlay {
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 10px;
      border-radius: 5px;
      display: none;
    }
  </style>
</head>
<body>
  <div id="ar-overlay" class="ar-overlay">
    <h3>AR 控制面板</h3>
    <button id="add-object">添加物体</button>
  </div>
  
  <script type="module">
    import ARApp from './ar-app.js';
    new ARApp();
  </script>
</body>
</html>
```

```javascript
// 在 AR 应用中启用 DOM 叠加
async function setupDOMOverlay(session) {
  const overlayElement = document.getElementById('ar-overlay');
  
  if (session.updateRenderState) {
    await session.updateRenderState({
      domOverlay: { root: overlayElement }
    });
  }
  
  overlayElement.style.display = 'block';
}
```

## 环境交互功能

### 命中测试实现

命中测试允许用户通过点击屏幕将虚拟对象放置到真实表面：

```javascript
import { XRHitTestSource } from 'three';

class ARHitTest {
  constructor(session, scene, camera) {
    this.session = session;
    this.scene = scene;
    this.camera = camera;
    this.hitTestSource = null;
    this.setupHitTest();
  }
  
  async setupHitTest() {
    // 创建命中测试源
    const space = await this.session.requestReferenceSpace('viewer');
    this.hitTestSource = await this.session.requestHitTestSource({ 
      space 
    });
    
    // 添加点击事件监听
    this.canvas = this.renderer.domElement;
    this.canvas.addEventListener('click', this.onClick.bind(this));
  }
  
  async onClick(event) {
    if (!this.hitTestSource) return;
    
    // 转换点击坐标到标准化设备坐标
    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 2 - 1;
    const y = -(event.clientY - rect.top) / rect.height * 2 + 1;
    
    // 执行命中测试
    const hitTestResults = await this.frame.getHitTestResults(this.hitTestSource);
    
    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      this.placeObjectAtHit(hit);
    }
  }
  
  placeObjectAtHit(hit) {
    // 创建变换矩阵来放置对象
    const pose = hit.getPose(this.referenceSpace);
    const matrix = new THREE.Matrix4().fromArray(pose.transform.matrix);
    
    // 创建并放置虚拟对象
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(geometry, material);
    
    cube.applyMatrix4(matrix);
    this.scene.add(cube);
  }
  
  update(frame) {
    this.frame = frame;
  }
}
```

### 平面检测与锚点

平面检测自动识别环境中的表面，锚点则用于持久化虚拟对象的位置：

```javascript
class ARPlaneDetection {
  constructor(session, scene) {
    this.session = session;
    this.scene = scene;
    this.anchors = new Set();
    this.setupPlaneDetection();
  }
  
  async setupPlaneDetection() {
    // 启用平面检测功能
    if (this.session.updateWorldTrackingState) {
      await this.session.updateWorldTrackingState({
        planeDetectionState: { enabled: true }
      });
    }
    
    // 监听平面检测事件
    this.session.addEventListener('planesdetected', this.onPlanesDetected.bind(this));
  }
  
  onPlanesDetected(event) {
    const detectedPlanes = event.detectedPlanes;
    
    detectedPlanes.forEach(plane => {
      this.createVisualAnchor(plane);
    });
  }
  
  async createVisualAnchor(plane) {
    // 为检测到的平面创建视觉锚点
    const anchor = await this.session.createAnchor(
      plane.centerPose, 
      this.referenceSpace
    );
    
    // 创建平面可视化
    const planeGeometry = new THREE.PlaneGeometry(plane.extents.width, plane.extents.height);
    const planeMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      opacity: 0.5, 
      transparent: true 
    });
    
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.rotation.x = -Math.PI / 2; // 水平放置
    
    // 将平面与锚点关联
    this.anchors.add({ anchor, mesh: planeMesh });
    this.scene.add(planeMesh);
  }
  
  updateAnchors(frame) {
    // 更新所有锚点的位置
    this.anchors.forEach(({ anchor, mesh }) => {
      const anchorPose = frame.getPose(anchor.anchorSpace, this.referenceSpace);
      
      if (anchorPose) {
        mesh.matrix.fromArray(anchorPose.transform.matrix);
        mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
      }
    });
  }
}
```

## 使用 Three.js 开发 AR 应用

### Three.js AR 集成

Three.js 提供了强大的 WebXR AR 支持，简化了复杂 3D 内容的创建过程：

```javascript
import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';

class ThreeJSARExample {
  constructor() {
    this.init();
  }
  
  async init() {
    // 创建场景
    this.scene = new THREE.Scene();
    
    // 创建相机
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    
    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.xr.enabled = true;
    
    document.body.appendChild(this.renderer.domElement);
    
    // 添加 AR 按钮
    const arButton = ARButton.createButton(this.renderer, { 
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.body }
    });
    document.body.appendChild(arButton);
    
    // 设置场景内容
    this.setupScene();
    
    // 启动渲染循环
    this.renderer.setAnimationLoop(this.render.bind(this));
  }
  
  setupScene() {
    // 添加环境光
    const light = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(light);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);
    
    // 创建可放置的 3D 对象
    this.createPlaceableObjects();
  }
  
  createPlaceableObjects() {
    // 创建立方体
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshNormalMaterial();
    this.cube = new THREE.Mesh(geometry, material);
    
    // 创建球体
    const sphereGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    
    // 初始时隐藏对象
    this.cube.visible = false;
    this.sphere.visible = false;
    
    this.scene.add(this.cube);
    this.scene.add(this.sphere);
  }
  
  setupHitTesting() {
    let hitTestSource = null;
    let localReferenceSpace = null;
    
    const onSelect = () => {
      if (this.cube.visible) {
        // 克隆当前对象并添加到场景
        const clone = this.cube.clone();
        clone.visible = true;
        this.scene.add(clone);
      }
    };
    
    this.renderer.xr.addEventListener('select', onSelect);
    
    const onSessionStart = async () => {
      // 设置命中测试
      const session = this.renderer.xr.getSession();
      localReferenceSpace = await session.requestReferenceSpace('local');
      
      const viewerSpace = await session.requestReferenceSpace('viewer');
      hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
      
      // 启动命中测试循环
      this.hitTestLoop(hitTestSource, localReferenceSpace);
    };
    
    this.renderer.xr.addEventListener('sessionstart', onSessionStart);
  }
  
  hitTestLoop(hitTestSource, referenceSpace) {
    const onXRFrame = (time, frame) => {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);
        
        // 更新对象位置
        this.cube.visible = true;
        this.cube.position.setFromMatrixPosition(
          new THREE.Matrix4().fromArray(pose.transform.matrix)
        );
      } else {
        this.cube.visible = false;
      }
    };
    
    this.renderer.setAnimationLoop(onXRFrame);
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

// 初始化 AR 应用
new ThreeJSARExample();
```

### 光照估计集成

光照估计让虚拟对象的光照条件与真实环境匹配：

```javascript
class ARLightEstimation {
  constructor(session, scene) {
    this.session = session;
    this.scene = scene;
    this.lightProbe = new THREE.LightProbe();
    this.scene.add(this.lightProbe);
    
    this.setupLightEstimation();
  }
  
  async setupLightEstimation() {
    // 请求光照估计功能
    const session = this.renderer.xr.getSession();
    
    if (session.requestLightProbe) {
      const lightProbe = await session.requestLightProbe();
      this.lightProbeUpdate(lightProbe);
    }
  }
  
  lightProbeUpdate(lightProbe) {
    // 更新光照探头数据
    const shArray = this.lightProbe.sh.coefficients;
    
    for (let i = 0; i < 9; i++) {
      shArray[i].set(lightProbe.sphericalHarmonicsCoefficients[i * 3],
                    lightProbe.sphericalHarmonicsCoefficients[i * 3 + 1],
                    lightProbe.sphericalHarmonicsCoefficients[i * 3 + 2]);
    }
    
    this.lightProbe.intensity = lightProbe.primaryLightIntensity;
    this.lightProbe.sh.needsUpdate = true;
  }
}
```

## 使用 A-Frame 快速开发 AR

### A-Frame AR 基础

A-Frame 提供了声明式的 AR 开发方式，极大简化了 AR 场景的创建过程：

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
  <script src="https://aframe.io/releases/1.4.0/aframe-ar.js"></script>
</head>
<body>
  <a-scene 
    ar
    embedded
    vr-mode-ui="enabled: false"
    device-orientation-permission-ui="enabled: false"
    xr-mode-ui="enabled: false"
  >
    <!-- AR 场景内容 -->
    <a-box 
      position="0 0.5 -2" 
      rotation="0 45 0" 
      color="#4CC3D9" 
      scale="0.5 0.5 0.5"
      ar-place-on-plane="minVisibility: 0.5;"
    ></a-box>
    
    <a-sphere 
      position="1 0.5 -2" 
      radius="0.3" 
      color="#EF2D5E"
      ar-place-on-plane="minVisibility: 0.5;"
    ></a-sphere>
    
    <a-cylinder 
      position="-1 0.5 -2" 
      radius="0.2" 
      height="0.5" 
      color="#FFC65D"
      ar-place-on-plane="minVisibility: 0.5;"
    ></a-cylinder>
    
    <!-- 平面检测可视化 -->
    <a-entity ar-plane-detection-visualization></a-entity>
    
    <!-- AR 相机 -->
    <a-entity camera></a-entity>
  </a-scene>
</body>
</html>
```

### A-Frame AR 组件开发

创建自定义 A-Frame 组件来扩展 AR 功能：

```javascript
// 自定义 AR 交互组件
AFRAME.registerComponent('ar-interaction', {
  schema: {
    color: { type: 'color', default: '#4CC3D9' },
    hoverColor: { type: 'color', default: '#EF2D5E' }
  },
  
  init: function() {
    this.originalColor = this.data.color;
    this.isSelected = false;
    
    this.el.addEventListener('click', this.onClick.bind(this));
    this.el.addEventListener('fusing', this.onFusing.bind(this));
  },
  
  onClick: function(evt) {
    // 切换选择状态
    this.isSelected = !this.isSelected;
    
    if (this.isSelected) {
      this.el.setAttribute('material', 'color', this.data.hoverColor);
      this.el.setAttribute('animation', {
        property: 'scale',
        to: '1.2 1.2 1.2',
        dur: 200,
        easing: 'easeInOutQuad'
      });
    } else {
      this.el.setAttribute('material', 'color', this.originalColor);
      this.el.setAttribute('animation', {
        property: 'scale',
        to: '1 1 1',
        dur: 200,
        easing: 'easeInOutQuad'
      });
    }
  },
  
  onFusing: function(evt) {
    // 当视线注视对象时的反馈
    if (!this.isSelected) {
      this.el.setAttribute('material', 'color', '#FFC65D');
    }
  }
});

// 在 HTML 中使用自定义组件
<a-box 
  position="0 0.5 -2"
  color="#4CC3D9"
  ar-interaction="hoverColor: #EF2D5E"
  ar-place-on-plane
></a-box>
```

## 基于标记的 AR 体验

### 图像识别与跟踪

基于标记的 AR 使用特定图像来触发和定位 AR 内容：

```javascript
class ImageTrackingAR {
  constructor(session, scene) {
    this.session = session;
    this.scene = scene;
    this.trackedImages = new Map();
    
    this.setupImageTracking();
  }
  
  async setupImageTracking() {
    // 启用图像跟踪
    const session = this.renderer.xr.getSession();
    
    if (session.updateTrackedImageScores) {
      await session.updateTrackedImageScores({
        imageTracking: true
      });
    }
    
    // 监听图像跟踪事件
    session.addEventListener('image-tracking', this.onImageTracking.bind(this));
  }
  
  onImageTracking(event) {
    const trackedImages = event.trackedImages;
    
    trackedImages.forEach(trackedImage => {
      if (trackedImage.trackingState === 'tracked') {
        this.showARContent(trackedImage);
      } else {
        this.hideARContent(trackedImage);
      }
    });
  }
  
  async showARContent(trackedImage) {
    const imageId = trackedImage.imageIndex;
    
    if (!this.trackedImages.has(imageId)) {
      // 创建与图像关联的 AR 内容
      const arContent = this.createARContentForImage(imageId);
      this.trackedImages.set(imageId, arContent);
      this.scene.add(arContent);
    }
    
    const arContent = this.trackedImages.get(imageId);
    arContent.visible = true;
    
    // 更新位置以匹配跟踪图像
    const pose = trackedImage.getImageSpacePose(this.referenceSpace);
    arContent.matrix.fromArray(pose.transform.matrix);
  }
  
  createARContentForImage(imageId) {
    // 根据不同的图像 ID 创建不同的 AR 内容
    const group = new THREE.Group();
    
    // 示例：创建围绕图像的 3D 边框
    const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.01);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5
    });
    
    const border = new THREE.Mesh(geometry, material);
    group.add(border);
    
    // 添加 3D 文字说明
    const textGeometry = new THREE.TextGeometry('AR 内容', {
      size: 0.05,
      height: 0.01
    });
    
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const text = new THREE.Mesh(textGeometry, textMaterial);
    text.position.set(0, 0.2, 0);
    group.add(text);
    
    group.visible = false;
    return group;
  }
  
  hideARContent(trackedImage) {
    const imageId = trackedImage.imageIndex;
    const arContent = this.trackedImages.get(imageId);
    
    if (arContent) {
      arContent.visible = false;
    }
  }
}
```

## 性能优化与最佳实践

### AR 性能优化策略

AR 应用对性能要求极高，需要特别关注优化：

```javascript
class AROptimizer {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.setupOptimizations();
  }
  
  setupOptimizations() {
    // 设置适当的渲染参数
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    
    // 启用纹理压缩
    this.setupTextureCompression();
    
    // 设置细节层级 (LOD)
    this.setupLODSystem();
  }
  
  setupTextureCompression() {
    // 配置纹理压缩以减少内存使用
    const gl = this.renderer.getContext();
    
    // 检查支持的纹理压缩格式
    const extensions = {
      astc: gl.getExtension('WEBGL_compressed_texture_astc'),
      etc: gl.getExtension('WEBGL_compressed_texture_etc'),
      s3tc: gl.getExtension('WEBGL_compressed_texture_s3tc')
    };
    
    this.preferredFormat = this.selectBestFormat(extensions);
  }
  
  setupLODSystem() {
    // 为复杂对象设置细节层级
    this.scene.traverse(child => {
      if (child.isMesh && child.geometry) {
        const lod = new THREE.LOD();
        
        // 根据距离添加不同细节层级的模型
        if (child.geometry.boundingSphere) {
          const radius = child.geometry.boundingSphere.radius;
          
          // 高细节模型 (近距离)
          lod.addLevel(child, 0);
          
          // 中细节模型 (中距离)
          const mediumDetail = child.clone();
          mediumDetail.geometry = this.simplifyGeometry(child.geometry, 0.5);
          lod.addLevel(mediumDetail, radius * 2);
          
          // 低细节模型 (远距离)
          const lowDetail = child.clone();
          lowDetail.geometry = this.simplifyGeometry(child.geometry, 0.2);
          lod.addLevel(lowDetail, radius * 5);
          
          this.scene.add(lod);
        }
      }
    });
  }
  
  simplifyGeometry(geometry, ratio) {
    // 几何体简化逻辑 (实际项目中可使用专业简化库)
    return geometry;
  }
  
  adjustQualityBasedOnPerformance() {
    // 基于帧率动态调整质量
    this.performanceMonitor.update().then(performance => {
      if (performance.fps < 45) {
        this.reduceQuality();
      } else if (performance.fps > 55) {
        this.increaseQuality();
      }
    });
  }
  
  reduceQuality() {
    // 降低渲染质量
    this.renderer.setPixelRatio(1.0);
    this.renderer.shadowMap.enabled = false;
  }
  
  increaseQuality() {
    // 提高渲染质量
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
  }
}

// 性能监测器
class ARPerformanceMonitor {
  constructor() {
    this.frameTimes = [];
    this.lastTime = performance.now();
  }
  
  update() {
    return new Promise(resolve => {
      const currentTime = performance.now();
      const delta = currentTime - this.lastTime;
      this.lastTime = currentTime;
      
      this.frameTimes.push(delta);
      
      if (this.frameTimes.length > 60) {
        this.frameTimes.shift();
        
        const averageFrameTime = this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length;
        const fps = 1000 / averageFrameTime;
        
        resolve({ fps, averageFrameTime });
      } else {
        resolve({ fps: 60, averageFrameTime: 16.67 });
      }
    });
  }
}
```

### 用户体验最佳实践

```javascript
class ARUXBestPractices {
  constructor() {
    this.setupUserGuidance();
    this.setupComfortFeatures();
  }
  
  setupUserGuidance() {
    // 提供 AR 使用指导
    this.showInitialInstructions();
    this.setupTutorial();
  }
  
  showInitialInstructions() {
    const instructions = document.createElement('div');
    instructions.className = 'ar-instructions';
    instructions.innerHTML = `
      <h3>AR 体验指南</h3>
      <p>• 在光线充足的环境中使用</p>
      <p>• 缓慢移动设备以识别表面</p>
      <p>• 点击屏幕放置虚拟对象</p>
      <button id="start-ar">开始体验</button>
    `;
    
    document.body.appendChild(instructions);
    
    document.getElementById('start-ar').addEventListener('click', () => {
      instructions.style.display = 'none';
      this.startARSession();
    });
  }
  
  setupTutorial() {
    // 设置交互式教程
    this.tutorialSteps = [
      '寻找一个平坦的表面',
      '缓慢移动手机直到出现网格',
      '点击网格放置虚拟对象',
      '尝试与对象进行交互'
    ];
    
    this.currentStep = 0;
    this.showTutorialStep();
  }
  
  showTutorialStep() {
    // 显示当前教程步骤
    const tutorial = document.createElement('div');
    tutorial.className = 'ar-tutorial';
    tutorial.textContent = this.tutorialSteps[this.currentStep];
    
    document.body.appendChild(tutorial);
    
    // 3秒后自动进入下一步
    setTimeout(() => {
      tutorial.remove();
      this.currentStep++;
      
      if (this.currentStep < this.tutorialSteps.length) {
        this.showTutorialStep();
      }
    }, 3000);
  }
  
  setupComfortFeatures() {
    // 设置舒适性功能
    this.setupMotionWarning();
    this.setupRestBreaks();
  }
  
  setupMotionWarning() {
    // 运动敏感警告
    const warning = document.createElement('div');
    warning.className = 'motion-warning';
    warning.innerHTML = `
      <p>如果您感到晕眩或不适，请立即停止使用</p>
      <p>建议每次使用不超过30分钟</p>
    `;
    
    document.body.appendChild(warning);
    
    // 10秒后自动隐藏
    setTimeout(() => {
      warning.style.opacity = '0';
      setTimeout(() => warning.remove(), 1000);
    }, 10000);
  }
}
```

通过合理运用这些技术和最佳实践，开发者可以创建出既技术先进又用户友好的 WebXR AR 体验，将数字内容无缝融合到用户的真实环境中。