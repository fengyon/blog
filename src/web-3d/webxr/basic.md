# WebXR 基础

## 什么是 WebXR？

**WebXR** 是一个用于在网页上实现**混合现实** (包括虚拟现实 VR 和增强现实 AR) 技术的开放标准。它由 W3C 制定，取代了已弃用的 WebVR 规范，允许开发者通过浏览器直接访问 VR 和 AR 设备，创建跨平台的沉浸式体验。

```
WebXR 生态系统
├── 设备支持
│   ├── VR 头显 (Oculus Rift, HTC Vive 等)
│   ├── AR 眼镜 (Microsoft HoloLens 等)
│   └── 移动设备 (智能手机 + Cardboard 等)
├── 技术基础
│   ├── WebGL/WebGPU 渲染
│   ├：设备传感器 API
│   └：浏览器集成
└── 应用场景
    ├── 虚拟展示
    ├── 交互培训
    ├── 沉浸游戏
    └── 教育应用
```

## WebXR 核心概念

### 设备与会话

WebXR 的核心是**设备** (XRDevice) 和**会话** (XRSession) 的概念。设备代表物理硬件，会话管理应用程序与设备的交互状态。

```javascript
// 设备检测与会话管理
async function initializeWebXR() {
  if (!navigator.xr) {
    console.error('WebXR not supported')
    return
  }

  // 检查设备支持能力
  const isVRSupported = await navigator.xr.isSessionSupported('immersive-vr')
  const isARSupported = await navigator.xr.isSessionSupported('immersive-ar')

  console.log(`VR supported: ${isVRSupported}, AR supported: ${isARSupported}`)
}

// 启动 VR 会话
async function startVRSession() {
  const session = await navigator.xr.requestSession('immersive-vr', {
    requiredFeatures: ['local-floor', 'bounded-floor'],
    optionalFeatures: ['hand-tracking'],
  })

  return session
}
```

### 会话类型示意图

```
WebXR 会话类型
├── inline (内联)
│   └── 在普通网页中显示 3D 内容
├── immersive-vr (沉浸式 VR)
│   └── 完全沉浸的虚拟环境
└── immersive-ar (沉浸式 AR)
    └── 数字内容叠加到真实世界
```

## 渲染与视图管理

### 渲染循环

WebXR 使用特殊的渲染循环来处理立体渲染和设备姿态更新：

```javascript
import * as THREE from 'three'

class WebXRApp {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.xr.enabled = true

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera()

    // 创建渲染循环
    this.renderer.setAnimationLoop(this.animate.bind(this))
  }

  async startSession() {
    const session = await navigator.xr.requestSession('immersive-vr')
    this.renderer.xr.setSession(session)
  }

  animate(time, frame) {
    if (frame) {
      const pose = frame.getViewerPose(this.referenceSpace)

      if (pose) {
        // 更新每个视图的渲染
        for (const view of pose.views) {
          const viewport = this.renderer.xr.getViewport(view)
          this.renderer.setViewport(viewport)

          // 应用视图变换并渲染
          this.camera.matrix.fromArray(view.transform.matrix)
          this.camera.projectionMatrix.fromArray(view.projectionMatrix)
          this.camera.updateMatrixWorld(true)

          this.renderer.render(this.scene, this.camera)
        }
      }
    }
  }
}
```

### 视图系统架构

```
WebXR 视图系统
XRFrame
└── XRViewerPose
    ├── XRView (左眼)
    │   ├── 变换矩阵
    │   └── 投影矩阵
    └── XRView (右眼)
        ├── 变换矩阵
        └── 投影矩阵
```

## 空间追踪与参考空间

### 参考空间类型

WebXR 使用**参考空间**来定义坐标系和追踪空间：

```javascript
// 初始化参考空间
async function setupReferenceSpace(session) {
  // 获取不同类型的参考空间
  const viewerSpace = await session.requestReferenceSpace('viewer')
  const localSpace = await session.requestReferenceSpace('local')
  const localFloorSpace = await session.requestReferenceSpace('local-floor')
  const boundedSpace = await session.requestReferenceSpace('bounded-floor')
  const unboundedSpace = await session.requestReferenceSpace('unbounded')

  return localFloorSpace // 最常用的类型
}

// 处理姿态更新
function updatePose(frame, referenceSpace) {
  const pose = frame.getViewerPose(referenceSpace)

  if (pose) {
    // 获取头部位置和方向
    const position = pose.transform.position
    const orientation = pose.transform.orientation

    // 应用到头戴设备显示
    updateCamera(position, orientation)
  }
}
```

### 空间关系示意图

```
参考空间层级
viewer-space (观察者空间)
├── 基于头戴设备当前位置
├── 适合菜单和 UI 元素
└── 随头部移动而变化

local-space (局部空间)
├── 稳定的原点位置
├── 适合房间尺度的体验
└── 支持有限的移动范围

bounded-floor (有边界地面)
├── 定义安全游玩区域
├── 显示边界网格
└── 防止用户碰撞实物

unbounded-space (无边界空间)
├── 支持大范围移动
├── 适合户外或大型场地
└── 需要外部追踪系统
```

## 输入设备处理

### 控制器输入

WebXR 支持多种输入设备，包括手柄、手势和触控输入：

```javascript
class InputManager {
  constructor(session) {
    this.session = session
    this.inputSources = new Map()

    session.addEventListener(
      'inputsourceschange',
      this.onInputSourcesChange.bind(this)
    )
    session.addEventListener('selectstart', this.onSelectStart.bind(this))
    session.addEventListener('selectend', this.onSelectEnd.bind(this))
  }

  onInputSourcesChange(event) {
    // 处理输入设备连接/断开
    for (const inputSource of event.added) {
      this.inputSources.set(inputSource, {
        handedness: inputSource.handenedness,
        targetRayMode: inputSource.targetRayMode,
      })
    }

    for (const inputSource of event.removed) {
      this.inputSources.delete(inputSource)
    }
  }

  onSelectStart(event) {
    const inputSource = event.inputSource
    console.log(`Input selected: ${inputSource.handenedness} hand`)

    // 处理选择开始（如抓取、按钮按下）
    this.handleGrabStart(inputSource)
  }

  onSelectEnd(event) {
    // 处理选择结束
    this.handleGrabEnd(event.inputSource)
  }

  update(frame, referenceSpace) {
    // 更新所有输入设备的状态
    for (const inputSource of this.inputSources.keys()) {
      const gripPose = frame.getPose(inputSource.gripSpace, referenceSpace)
      const targetRayPose = frame.getPose(
        inputSource.targetRaySpace,
        referenceSpace
      )

      if (gripPose) {
        this.updateControllerModel(inputSource, gripPose)
      }

      if (targetRayPose) {
        this.updatePointerRay(inputSource, targetRayPose)
      }
    }
  }
}
```

### 输入类型架构

```
WebXR 输入系统
XRInputSource
├── handedness (左右手)
│   ├── none
│   ├── left
│   └── right
├── targetRayMode (目标射线模式)
│   ├── gaze (凝视)
│   ├── tracked-pointer (追踪指针)
│   └── screen (屏幕)
└── 输入能力
    ├── 选择按钮
    ├── 抓取按钮
    ├── 触摸板
    └── 手势追踪
```

## 集成 Three.js 开发

### Three.js WebXR 集成

Three.js 提供了完整的 WebXR 支持，简化了开发流程：

```javascript
import * as THREE from 'three'
import { VRButton } from 'three/addons/webxr/VRButton.js'
import { ARButton } from 'three/addons/webxr/ARButton.js'

class ThreeJSWebXRExample {
  constructor() {
    this.init()
  }

  init() {
    // 创建场景
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x444444)

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    this.camera.position.set(0, 1.6, 3)

    // 创建渲染器并启用 WebXR
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.xr.enabled = true

    document.body.appendChild(this.renderer.domElement)

    // 添加 XR 按钮
    document.body.appendChild(VRButton.createButton(this.renderer))

    // 添加场景内容
    this.setupScene()

    // 启动渲染循环
    this.renderer.setAnimationLoop(this.render.bind(this))
  }

  setupScene() {
    // 添加灯光
    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(1, 1, 1)
    this.scene.add(light)

    // 添加地板
    const floorGeometry = new THREE.PlaneGeometry(20, 20)
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    this.scene.add(floor)

    // 添加交互对象
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
    const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    this.box = new THREE.Mesh(boxGeometry, boxMaterial)
    this.box.position.set(0, 0.25, -2)
    this.scene.add(this.box)

    // 添加控制器
    this.controller = this.renderer.xr.getController(0)
    this.controller.addEventListener(
      'selectstart',
      this.onSelectStart.bind(this)
    )
    this.controller.addEventListener('selectend', this.onSelectEnd.bind(this))
    this.scene.add(this.controller)
  }

  onSelectStart() {
    // 开始交互
    this.box.material.color.set(0xff0000)
  }

  onSelectEnd() {
    // 结束交互
    this.box.material.color.set(0x00ff00)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }
}

new ThreeJSWebXRExample()
```

### 使用 A-Frame 快速开发

A-Frame 提供了声明式的 WebXR 开发方式：

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
  </head>
  <body>
    <a-scene
      background="color: #444444"
      embedded
      webxr="required: local-floor; optional: hand-tracking"
      vr-mode-ui="enabled: true"
      xr-mode-ui="enabled: true"
    >
      <!-- 3D 场景内容 -->
      <a-box position="0 1 -3" rotation="0 45 0" color="#4CC3D9" shadow></a-box>

      <a-sphere
        position="-1 1.25 -3"
        radius="0.5"
        color="#EF2D5E"
        shadow
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

      <!-- 控制器 -->
      <a-entity
        laser-controls="hand: right"
        raycaster="objects: .interactive"
      ></a-entity>
    </a-scene>
  </body>
</html>
```

## 性能优化与最佳实践

### 渲染优化

```javascript
class WebXROptimizer {
  constructor(renderer) {
    this.renderer = renderer
    this.setupOptimizations()
  }

  setupOptimizations() {
    // 设置适当的像素比例
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

    // 启用多重采样抗锯齿
    const gl = this.renderer.getContext()
    if (gl.getContextAttributes().antialias) {
      this.renderer.antialias = true
    }

    // 配置渲染优化
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // 设置适当的帧率限制
    this.frameRateLimit = 90 // 匹配头显刷新率
  }

  adjustQualityForPerformance() {
    // 基于设备性能动态调整质量
    const xrSession = this.renderer.xr.getSession()
    if (xrSession) {
      const layer = xrSession.renderState.baseLayer

      // 监控帧率并动态调整
      this.monitorFrameRate().then((actualFrameRate) => {
        if (actualFrameRate < this.frameRateLimit * 0.9) {
          this.reduceRenderQuality()
        }
      })
    }
  }

  reduceRenderQuality() {
    // 降低渲染质量以保持性能
    this.renderer.setPixelRatio(1.0)

    // 减少阴影质量
    this.renderer.shadowMap.autoUpdate = false

    // 可以在这里添加更多优化策略
  }

  async monitorFrameRate() {
    let frameCount = 0
    const startTime = performance.now()

    return new Promise((resolve) => {
      const checkFrameRate = () => {
        frameCount++
        const elapsed = performance.now() - startTime

        if (elapsed >= 1000) {
          // 测量 1 秒
          const frameRate = frameCount / (elapsed / 1000)
          resolve(frameRate)
        } else {
          requestAnimationFrame(checkFrameRate)
        }
      }

      checkFrameRate()
    })
  }
}
```

### 用户体验最佳实践

```javascript
class UXBestPractices {
  constructor() {
    this.setupUserComfort()
  }

  setupUserComfort() {
    // 防止运动不适
    this.setupComfortMode()

    // 提供用户引导
    this.provideTutorial()

    // 设置适当的移动机制
    this.setupMovementSystems()
  }

  setupComfortMode() {
    // 添加舒适模式选项
    this.comfortMode = {
      snapTurn: true, // 瞬时转向
      teleportation: true, // 传送移动
      vignette: true, // 移动时边缘变暗
      comfortMode: false, // 减少移动效果
    }

    this.applyComfortSettings()
  }

  provideTutorial() {
    // 首次体验引导
    if (!this.hasSeenTutorial()) {
      this.showTutorial()
      this.markTutorialSeen()
    }
  }

  setupMovementSystems() {
    // 提供多种移动选项
    this.movementModes = {
      teleport: this.teleportMovement.bind(this),
      smooth: this.smoothMovement.bind(this),
      armSwinger: this.armSwingerMovement.bind(this),
    }

    // 默认使用最舒适的移动方式
    this.currentMovementMode = 'teleport'
  }

  teleportMovement(targetPosition) {
    // 实现传送移动逻辑
    // 显示传送弧线
    this.showTeleportArc()

    // 瞬时移动，减少晕动症
    this.player.position.copy(targetPosition)
  }
}
```

## 设备兼容性与检测

### 功能检测

```javascript
class WebXRCompatibility {
  static async checkCompatibility() {
    const compatibilityReport = {
      webXRSupported: false,
      vrSupported: false,
      arSupported: false,
      features: {},
      limitations: [],
    }

    // 基础 WebXR 支持检测
    if (!navigator.xr) {
      compatibilityReport.limitations.push(
        'WebXR not available in this browser'
      )
      return compatibilityReport
    }

    compatibilityReport.webXRSupported = true

    // 检测 VR 支持
    try {
      compatibilityReport.vrSupported = await navigator.xr.isSessionSupported(
        'immersive-vr'
      )
    } catch (error) {
      compatibilityReport.limitations.push('VR not supported: ' + error.message)
    }

    // 检测 AR 支持
    try {
      compatibilityReport.arSupported = await navigator.xr.isSessionSupported(
        'immersive-ar'
      )
    } catch (error) {
      compatibilityReport.limitations.push('AR not supported: ' + error.message)
    }

    // 检测特定功能支持
    compatibilityReport.features = await this.detectFeatures()

    return compatibilityReport
  }

  static async detectFeatures() {
    const features = {}

    // 测试会话以检测可用功能
    const sessionTypes = ['immersive-vr', 'immersive-ar', 'inline']

    for (const sessionType of sessionTypes) {
      if (await navigator.xr.isSessionSupported(sessionType)) {
        features[sessionType] = await this.getSessionFeatures(sessionType)
      }
    }

    return features
  }

  static async getSessionFeatures(sessionType) {
    // 这里可以添加更详细的功能检测
    return {
      localFloor: true,
      boundedFloor: true,
      handTracking: await this.checkHandTrackingSupport(sessionType),
      layers: await this.checkLayerSupport(sessionType),
    }
  }

  static async checkHandTrackingSupport(sessionType) {
    // 检测手部追踪支持
    try {
      const session = await navigator.xr.requestSession(sessionType, {
        optionalFeatures: ['hand-tracking'],
      })
      session.end()
      return true
    } catch {
      return false
    }
  }
}
```
