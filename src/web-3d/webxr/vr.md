# VR 开发

## WebXR VR 概述

WebXR VR 是一套允许在浏览器中创建**沉浸式虚拟现实体验**的开放标准。它让开发者能够直接通过网络为用户提供 VR 内容，用户无需安装额外应用即可通过 VR 设备体验。

```
WebXR VR 技术栈
├── 设备层 (Oculus Rift, HTC Vive, Oculus Go 等)
├── 浏览器层 (支持 WebXR 的 Chrome, Firefox 等)
├── WebXR API (核心标准)
├── 3D 图形库 (Three.js, Babylon.js 等)
└── 应用层 (VR 网站、体验、游戏)
```

## 开发环境与设备要求

### 硬件配置

开发 WebXR VR 应用需要满足以下硬件条件：

- **CPU**：2 核 4 线程 1.8GHz 及以上
- **内存**：4GB 及以上
- **显卡**：入门级独立显卡及以上
- **VR 设备**：PC 端头显、一体式头显或移动端头显设备

### 开发工具配置

```javascript
// 检测 WebXR 支持情况
async function checkVRSupport() {
  if (!navigator.xr) {
    console.error('WebXR not supported');
    return false;
  }
  
  const isVRSupported = await navigator.xr.isSessionSupported('immersive-vr');
  console.log(`VR supported: ${isVRSupported}`);
  return isVRSupported;
}

// 调用检测
checkVRSupport().then(supported => {
  if (supported) {
    initVRButton();
  }
});
```

## WebXR API 核心概念

### 会话管理与生命周期

WebXR VR 体验围绕 **XRSession** 构建，管理整个 VR 体验的完整生命周期。

```javascript
let xrSession = null;
let xrReferenceSpace = null;

// 请求 VR 会话
async function requestVRSession() {
  const sessionOptions = {
    requiredFeatures: ['local-floor', 'bounded-floor'],
    optionalFeatures: ['hand-tracking']
  };
  
  try {
    xrSession = await navigator.xr.requestSession('immersive-vr', sessionOptions);
    setupXRSession();
  } catch (error) {
    console.error('Failed to start VR session:', error);
  }
}

// 设置会话
function setupXRSession() {
  // 创建参考空间
  xrSession.requestReferenceSpace('local-floor').then(space => {
    xrReferenceSpace = space;
    
    // 启动渲染循环
    xrSession.requestAnimationFrame(onXRAnimationFrame);
  });
  
  // 处理会话结束
  xrSession.addEventListener('end', onSessionEnd);
}

function onSessionEnd() {
  xrSession = null;
  xrReferenceSpace = null;
  console.log('VR session ended');
}
```

### 渲染循环与帧更新

WebXR 使用特殊的 **requestAnimationFrame** 循环进行渲染。

```javascript
function onXRAnimationFrame(time, xrFrame) {
  // 继续请求下一帧
  xrSession.requestAnimationFrame(onXRAnimationFrame);
  
  // 获取观看者姿态
  const pose = xrFrame.getViewerPose(xrReferenceSpace);
  
  if (pose) {
    // 更新场景渲染
    renderXRFrame(xrFrame, pose);
  }
}

function renderXRFrame(xrFrame, pose) {
  // 绑定帧缓冲区
  const layer = xrSession.renderState.baseLayer;
  gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
  
  // 为每个视图渲染场景
  for (const view of pose.views) {
    const viewport = layer.getViewport(view);
    gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
    
    renderView(view);
  }
}
```

### 空间追踪与参考空间

WebXR 使用**参考空间**定义 VR 环境中的坐标系。

```
参考空间类型层级
viewer-space
├── 基于头戴设备当前位置
├── 适合菜单和 UI 元素
└── 随头部移动而变化

local-space
├── 稳定的原点位置
├── 适合房间尺度的体验
└── 支持有限的移动范围

bounded-floor
├── 定义安全游玩区域
├── 显示边界网格
└── 防止用户碰撞实物

unbounded-space
├── 支持大范围移动
├── 适合户外或大型场地
└── 需要外部追踪系统
```

```javascript
// 初始化不同类型的参考空间
async function initializeReferenceSpaces(session) {
  const types = ['viewer', 'local', 'local-floor', 'bounded-floor'];
  
  for (const type of types) {
    try {
      const space = await session.requestReferenceSpace(type);
      console.log(`${type} reference space created`);
      return space;
    } catch (error) {
      console.warn(`${type} reference space not supported:`, error);
    }
  }
  
  throw new Error('No supported reference space type found');
}
```

## 使用 Three.js 进行 VR 开发

### Three.js WebXR 集成

Three.js 提供了完整的 WebXR VR 支持，大大简化了开发流程。

```javascript
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

class ThreeJSVRExample {
  constructor() {
    this.init();
  }
  
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x444444);
    
    // 创建相机
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 1.6, 3);
    
    // 创建渲染器并启用 WebXR
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;  // 启用 XR
    
    document.body.appendChild(this.renderer.domElement);
    
    // 添加 VR 按钮
    document.body.appendChild(VRButton.createButton(this.renderer));
    
    // 设置场景
    this.setupScene();
    
    // 启动渲染循环
    this.renderer.setAnimationLoop(this.render.bind(this));
  }
  
  setupScene() {
    // 添加灯光
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    this.scene.add(light);
    
    const ambient = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambient);
    
    // 添加地板
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);
    
    // 添加交互对象
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.box = new THREE.Mesh(boxGeometry, boxMaterial);
    this.box.position.set(0, 0.25, -2);
    this.scene.add(this.box);
    
    // 添加控制器
    this.controller = this.renderer.xr.getController(0);
    this.controller.addEventListener('selectstart', this.onSelectStart.bind(this));
    this.controller.addEventListener('selectend', this.onSelectEnd.bind(this));
    this.scene.add(this.controller);
  }
  
  onSelectStart() {
    this.box.material.color.set(0xff0000);
  }
  
  onSelectEnd() {
    this.box.material.color.set(0x00ff00);
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

// 初始化应用
new ThreeJSVRExample();
```

### 控制器与交互

Three.js 提供了内置的控制器支持，便于实现 VR 交互。

```javascript
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

class VRInteraction {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.controllerModelFactory = new XRControllerModelFactory();
    
    this.setupControllers();
  }
  
  setupControllers() {
    // 设置左右手控制器
    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);
      controller.addEventListener('selectstart', this.onTriggerPress.bind(this));
      controller.addEventListener('selectend', this.onTriggerRelease.bind(this));
      controller.addEventListener('squeezestart', this.onGripPress.bind(this));
      controller.addEventListener('squeezeend', this.onGripRelease.bind(this));
      
      this.scene.add(controller);
      
      // 添加控制器模型
      const controllerGrip = this.renderer.xr.getControllerGrip(i);
      controllerGrip.add(this.controllerModelFactory.createControllerModel(controllerGrip));
      this.scene.add(controllerGrip);
      
      // 添加射线指示器
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
      ]);
      
      const line = new THREE.Line(geometry);
      line.name = 'line';
      line.scale.z = 5;
      controller.add(line.clone());
    }
  }
  
  onTriggerPress(event) {
    const controller = event.target;
    console.log('Trigger pressed on controller:', controller);
    
    // 实现触发按钮按下逻辑
    this.handleSelection(controller);
  }
  
  onTriggerRelease(event) {
    // 实现触发按钮释放逻辑
    console.log('Trigger released');
  }
  
  onGripPress(event) {
    // 实现握柄按钮按下逻辑
    console.log('Grip pressed');
  }
  
  onGripRelease(event) {
    // 实现握柄按钮释放逻辑
    console.log('Grip released');
  }
  
  handleSelection(controller) {
    // 实现选择交互逻辑
    const raycaster = new THREE.Raycaster();
    const line = controller.getObjectByName('line');
    
    raycaster.setFromXRController(controller);
    const intersects = raycaster.intersectObjects(this.scene.children);
    
    if (intersects.length > 0) {
      const object = intersects[0].object;
      console.log('Selected object:', object);
    }
  }
}
```

## 使用 A-Frame 快速开发

### A-Frame VR 基础

A-Frame 提供了声明式的 VR 开发方式，让创建 WebXR VR 体验更加简单。

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://aframe.io/releases/1.2.0/aframe.min.js"></script>
</head>
<body>
  <a-scene 
    background="color: #444444"
    embedded
    webxr="required: local-floor;"
    vr-mode-ui="enabled: true"
  >
    <!-- 3D 场景内容 -->
    <a-box 
      position="0 1 -3" 
      rotation="0 45 0" 
      color="#4CC3D9"
      shadow
      class="clickable"
      event-set__click="_color: #EF2D5E"
    ></a-box>
    
    <a-sphere 
      position="-1 1.25 -3" 
      radius="0.5" 
      color="#EF2D5E"
      shadow
      animation="property: rotation; to: 0 360 0; loop: true; dur: 10000"
    ></a-sphere>
    
    <a-cylinder 
      position="1 0.75 -3" 
      radius="0.5" 
      height="1.5" 
      color="#FFC65D"
      shadow
    ></a-cylinder>
    
    <!-- 地面 -->
    <a-plane 
      position="0 0 -4" 
      rotation="-90 0 0" 
      width="20" 
      height="20" 
      color="#7BC8A4"
      shadow
    ></a-plane>
    
    <!-- 灯光 -->
    <a-light type="ambient" color="#445451"></a-light>
    <a-light type="directional" position="2 4 2" intensity="0.5"></a-light>
    
    <!-- VR 控制器 -->
    <a-entity 
      laser-controls="hand: right" 
      raycaster="objects: .clickable"
    ></a-entity>
    
    <a-entity 
      laser-controls="hand: left"
      raycaster="objects: .clickable"  
    ></a-entity>
    
    <!-- 相机 -->
    <a-entity camera position="0 1.6 0" look-controls></a-entity>
  </a-scene>
</body>
</html>
```

### A-Frame 组件开发

对于更复杂的交互，可以创建自定义 A-Frame 组件。

```javascript
// 自定义 VR 交互组件
AFRAME.registerComponent('vr-interaction', {
  schema: {
    color: { type: 'color', default: '#4CC3D9' },
    hoverColor: { type: 'color', default: '#EF2D5E' }
  },
  
  init: function() {
    this.el.addEventListener('mouseenter', this.onHoverStart.bind(this));
    this.el.addEventListener('mouseleave', this.onHoverEnd.bind(this));
    this.el.addEventListener('click', this.onClick.bind(this));
    
    this.originalColor = this.data.color;
  },
  
  onHoverStart: function() {
    this.el.setAttribute('color', this.data.hoverColor);
  },
  
  onHoverEnd: function() {
    this.el.setAttribute('color', this.originalColor);
  },
  
  onClick: function() {
    // 创建点击效果动画
    this.el.setAttribute('animation', {
      property: 'scale',
      to: '1.2 1.2 1.2',
      dur: 200,
      easing: 'easeInOutQuad'
    });
    
    setTimeout(() => {
      this.el.setAttribute('animation', {
        property: 'scale', 
        to: '1 1 1',
        dur: 200,
        easing: 'easeInOutQuad'
      });
    }, 200);
  }
});

// 在 HTML 中使用自定义组件
<a-box 
  position="0 1 -3"
  color="#4CC3D9" 
  vr-interaction="hoverColor: #FFC65D"
></a-box>
```

## 性能优化技巧

### 渲染优化

VR 应用对性能要求极高，必须保持稳定的高帧率。

```javascript
class VROptimizer {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.setupOptimizations();
  }
  
  setupOptimizations() {
    // 设置适当的像素比例
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    
    // 启用多重采样抗锯齿
    const gl = this.renderer.getContext();
    if (gl.getContextAttributes().antialias) {
      this.renderer.antialias = true;
    }
    
    // 配置渲染优化
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // 设置适当的帧率限制
    this.frameRateLimit = 90; // 匹配头显刷新率
  }
  
  optimizeScene() {
    // 应用场景级优化
    this.mergeGeometries();
    this.setupLOD();
    this.optimizeTextures();
  }
  
  mergeGeometries() {
    // 合并相同材质的几何体以减少绘制调用
    const geometryMap = new Map();
    
    this.scene.traverse(child => {
      if (child.isMesh) {
        const key = child.material.uuid + child.geometry.type;
        if (!geometryMap.has(key)) {
          geometryMap.set(key, []);
        }
        geometryMap.get(key).push(child);
      }
    });
    
    // 合并逻辑...
  }
  
  setupLOD() {
    // 设置细节层级
    this.scene.traverse(child => {
      if (child.isMesh && child.geometry.boundingSphere) {
        const lod = new THREE.LOD();
        
        // 添加不同距离的细节层级
        lod.addLevel(child, 0);
        
        // 可以在这里添加更多细节层级
        this.scene.add(lod);
      }
    });
  }
  
  optimizeTextures() {
    // 优化纹理设置
    this.scene.traverse(child => {
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach(material => {
          if (material.map) {
            material.map.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
            material.map.minFilter = THREE.LinearMipmapLinearFilter;
          }
        });
      }
    });
  }
  
  adjustQualityForPerformance() {
    // 基于设备性能动态调整质量
    if (this.xrSession) {
      this.monitorFrameRate().then(actualFrameRate => {
        if (actualFrameRate < this.frameRateLimit * 0.9) {
          this.reduceRenderQuality();
        } else if (actualFrameRate > this.frameRateLimit * 1.1) {
          this.increaseRenderQuality();
        }
      });
    }
  }
  
  async monitorFrameRate() {
    let frameCount = 0;
    const startTime = performance.now();
    
    return new Promise(resolve => {
      const checkFrameRate = () => {
        frameCount++;
        const elapsed = performance.now() - startTime;
        
        if (elapsed >= 1000) {
          const frameRate = frameCount / (elapsed / 1000);
          resolve(frameRate);
        } else {
          requestAnimationFrame(checkFrameRate);
        }
      };
      
      checkFrameRate();
    });
  }
  
  reduceRenderQuality() {
    // 降低渲染质量以保持性能
    this.renderer.setPixelRatio(1.0);
    this.renderer.shadowMap.autoUpdate = false;
    
    // 降低纹理质量
    this.scene.traverse(child => {
      if (child.material && child.material.map) {
        child.material.map.needsUpdate = true;
      }
    });
  }
  
  increaseRenderQuality() {
    // 在性能允许时提高质量
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  }
}
```

## 高级 VR 功能

### 手部追踪

现代 WebXR 设备支持手部追踪，提供更自然的交互方式。

```javascript
class HandTracking {
  constructor(session, scene) {
    this.session = session;
    this.scene = scene;
    this.handMeshes = new Map();
    
    this.setupHandTracking();
  }
  
  async setupHandTracking() {
    if (this.session.enabledFeatures.includes('hand-tracking')) {
      // 请求手部追踪功能
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['hand-tracking']
      });
      
      session.addEventListener('hand-tracking-start', this.onHandTrackingStart.bind(this));
      session.addEventListener('hand-tracking-end', this.onHandTrackingEnd.bind(this));
    }
  }
  
  onHandTrackingStart(event) {
    const hand = event.hand;
    console.log('Hand tracking started:', hand.handedness);
    
    // 创建手部可视化
    this.createHandMesh(hand);
  }
  
  onHandTrackingEnd(event) {
    const hand = event.hand;
    console.log('Hand tracking ended:', hand.handedness);
    
    // 清理手部可视化
    this.removeHandMesh(hand);
  }
  
  createHandMesh(hand) {
    // 创建手部关节可视化
    const handGroup = new THREE.Group();
    
    for (let i = 0; i < hand.joints.length; i++) {
      const jointGeometry = new THREE.SphereGeometry(0.01, 8, 6);
      const jointMaterial = new THREE.MeshBasicMaterial({ 
        color: hand.handedness === 'left' ? 0x0000ff : 0xff0000 
      });
      const jointMesh = new THREE.Mesh(jointGeometry, jointMaterial);
      
      handGroup.add(jointMesh);
    }
    
    this.handMeshes.set(hand, handGroup);
    this.scene.add(handGroup);
  }
  
  updateHandPoses(frame) {
    // 更新手部关节位置
    for (const [hand, handGroup] of this.handMeshes) {
      const jointPoses = frame.getJointPoses(hand, this.referenceSpace);
      
      for (let i = 0; i < jointPoses.length; i++) {
        const jointPose = jointPoses[i];
        const jointMesh = handGroup.children[i];
        
        if (jointPose) {
          jointMesh.matrix.fromArray(jointPose.transform.matrix);
          jointMesh.matrix.decompose(
            jointMesh.position,
            jointMesh.quaternion,
            jointMesh.scale
          );
        }
      }
    }
  }
}
```

### 空间锚点与持久化

```javascript
class SpatialAnchors {
  constructor(session, scene) {
    this.session = session;
    this.scene = scene;
    this.anchors = new Map();
  }
  
  async createAnchor(position, rotation) {
    try {
      const anchor = await this.session.createAnchor(
        new XRRigidTransform(position, rotation),
        this.referenceSpace
      );
      
      // 创建可视化锚点
      const anchorMesh = this.createAnchorMesh();
      this.anchors.set(anchor, anchorMesh);
      this.scene.add(anchorMesh);
      
      return anchor;
    } catch (error) {
      console.error('Failed to create anchor:', error);
      return null;
    }
  }
  
  createAnchorMesh() {
    const geometry = new THREE.SphereGeometry(0.05, 8, 6);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const mesh = new THREE.Mesh(geometry, material);
    
    return mesh;
  }
  
  updateAnchorPoses(frame) {
    // 更新锚点位置
    for (const [anchor, mesh] of this.anchors) {
      const anchorPose = frame.getPose(anchor.anchorSpace, this.referenceSpace);
      
      if (anchorPose) {
        mesh.matrix.fromArray(anchorPose.transform.matrix);
        mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
      }
    }
  }
}
```