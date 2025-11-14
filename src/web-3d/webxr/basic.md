# WebXR 基础

## WebXR 概述

### WebXR 架构
WebXR 是用于在浏览器中创建虚拟现实(VR)和增强现实(AR)体验的 API：
```
WebXR API
    ↓
XR Device API
    ↓
硬件设备 (VR头显/AR设备)
    ↓
显示输出 + 用户输入
```

### XR 体验类型
```
VR (虚拟现实)          AR (增强现实)          MR (混合现实)
完全沉浸虚拟世界       虚拟内容叠加现实       虚拟与现实深度融合
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   虚拟环境   │       │ 现实世界+   │       │虚实交互环境 │
│             │       │ 虚拟对象    │       │             │
└─────────────┘       └─────────────┘       └─────────────┘
```

## 核心概念

### XR 会话类型
```javascript
// 会话模式定义
const sessionModes = {
    immersive-vr: 'immersive-vr',      // 沉浸式 VR
    immersive-ar: 'immersive-ar',      // 沉浸式 AR  
    inline: 'inline'                   // 内联模式（2D页面中显示）
};
```

### XR 参考空间
```
参考空间类型:
viewer        - 以用户头部为原点
local         - 以初始位置为原点，有限移动范围
local-floor   - 以地面为基准的本地空间
bounded-floor - 有边界的游戏区域
unbounded     - 无边界的大范围空间
```

## 环境检测与初始化

### 功能支持检测
```javascript
class XRSystemChecker {
    static async checkXRSupport() {
        if (!navigator.xr) {
            throw new Error('WebXR not supported');
        }
        
        // 检查VR支持
        const vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
        console.log('VR supported:', vrSupported);
        
        // 检查AR支持
        const arSupported = await navigator.xr.isSessionSupported('immersive-ar');
        console.log('AR supported:', arSupported);
        
        return {
            vr: vrSupported,
            ar: arSupported
        };
    }
    
    static async checkFeatures() {
        const features = {};
        
        if (navigator.xr) {
            // 检查参考空间支持
            features.localFloor = await navigator.xr.isSessionSupported('immersive-vr');
            features.handTracking = 'getHandedness' in XRHand;
            features.hitTest = 'requestHitTestSource' in XRFrame.prototype;
        }
        
        return features;
    }
}
```

### XR 会话管理
```javascript
class XRSessionManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.session = null;
        this.referenceSpace = null;
        this.onSessionStart = null;
        this.onSessionEnd = null;
    }
    
    // 请求会话
    async requestSession(mode = 'immersive-vr', options = {}) {
        try {
            const session = await navigator.xr.requestSession(mode, options);
            this.setupSession(session);
            return session;
        } catch (error) {
            console.error('Failed to start XR session:', error);
            throw error;
        }
    }
    
    // 设置会话
    setupSession(session) {
        this.session = session;
        
        // 设置渲染器
        this.renderer.xr.setSession(session);
        
        // 会话事件处理
        session.addEventListener('end', () => this.handleSessionEnd());
        session.addEventListener('visibilitychange', (event) => {
            console.log('Session visibility:', event.session.visible);
        });
        
        // 请求参考空间
        this.requestReferenceSpace();
        
        if (this.onSessionStart) {
            this.onSessionStart(session);
        }
    }
    
    // 请求参考空间
    async requestReferenceSpace(type = 'local-floor') {
        if (!this.session) return;
        
        try {
            this.referenceSpace = await this.session.requestReferenceSpace(type);
            console.log('Reference space acquired:', type);
        } catch (error) {
            console.warn(`Failed to get ${type} reference space, trying local`);
            this.referenceSpace = await this.session.requestReferenceSpace('local');
        }
    }
    
    // 结束会话
    async endSession() {
        if (this.session) {
            await this.session.end();
        }
    }
    
    handleSessionEnd() {
        this.session = null;
        this.referenceSpace = null;
        this.renderer.xr.setSession(null);
        
        if (this.onSessionEnd) {
            this.onSessionEnd();
        }
    }
}
```

## 渲染循环

### XR 渲染器配置
```javascript
class XRRendererSetup {
    static setupWebGLRenderer(canvas) {
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        
        // 配置XR渲染器
        renderer.xr.enabled = true;
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        // 物理正确的光照
        renderer.physicallyCorrectLights = true;
        renderer.outputEncoding = THREE.sRGBEncoding;
        
        return renderer;
    }
    
    static setupXRScene() {
        const scene = new THREE.Scene();
        
        // 添加基础光照
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);
        
        return scene;
    }
}
```

### XR 渲染循环
```javascript
class XRRenderLoop {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.isRunning = false;
        this.onFrame = null;
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.renderer.setAnimationLoop((time, frame) => {
            this.renderFrame(time, frame);
        });
    }
    
    stop() {
        this.isRunning = false;
        this.renderer.setAnimationLoop(null);
    }
    
    renderFrame(time, frame) {
        if (!frame) return;
        
        // 更新XR帧
        const session = frame.session;
        const referenceSpace = this.renderer.xr.getReferenceSpace();
        
        // 获取视图和姿态信息
        const pose = frame.getViewerPose(referenceSpace);
        
        if (pose) {
            // 更新相机位置
            this.camera.position.set(
                pose.transform.position.x,
                pose.transform.position.y, 
                pose.transform.position.z
            );
            
            // 更新相机方向
            this.camera.quaternion.set(
                pose.transform.orientation.x,
                pose.transform.orientation.y,
                pose.transform.orientation.z, 
                pose.transform.orientation.w
            );
        }
        
        // 自定义帧更新
        if (this.onFrame) {
            this.onFrame(time, frame, pose);
        }
        
        // 渲染场景
        this.renderer.render(this.scene, this.camera);
    }
}
```

## 输入处理

### 控制器输入
```javascript
class XRInputManager {
    constructor(session) {
        this.session = session;
        this.controllers = new Map();
        this.handlers = {
            select: [],
            squeeze: [],
            pose: []
        };
        
        this.setupInputSources();
    }
    
    setupInputSources() {
        this.session.addEventListener('inputsourceschange', (event) => {
            event.added.forEach(inputSource => {
                this.addInputSource(inputSource);
            });
            
            event.removed.forEach(inputSource => {
                this.removeInputSource(inputSource);
            });
        });
    }
    
    addInputSource(inputSource) {
        const controller = {
            inputSource: inputSource,
            gripSpace: null,
            targetRaySpace: null
        };
        
        this.controllers.set(inputSource, controller);
        
        // 创建可视化控制器
        this.createControllerVisualization(inputSource);
    }
    
    createControllerVisualization(inputSource) {
        // 创建控制器3D模型
        const controllerModel = new THREE.Group();
        
        // 射线指示器
        const rayGeometry = new THREE.CylinderGeometry(0.005, 0.005, 1, 8);
        const rayMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const ray = new THREE.Mesh(rayGeometry, rayMaterial);
        ray.rotation.x = -Math.PI / 2;
        ray.position.z = -0.5;
        controllerModel.add(ray);
        
        // 控制器本体
        const controllerGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.1);
        const controllerMaterial = new THREE.MeshBasicMaterial({ color: 0x4444ff });
        const controllerMesh = new THREE.Mesh(controllerGeometry, controllerMaterial);
        controllerModel.add(controllerMesh);
        
        // 添加到场景
        scene.add(controllerModel);
        controllerModel.visible = false;
        
        return controllerModel;
    }
    
    update(frame, referenceSpace) {
        for (const [inputSource, controller] of this.controllers) {
            // 获取控制器姿态
            const gripPose = frame.getPose(inputSource.gripSpace, referenceSpace);
            const targetRayPose = frame.getPose(inputSource.targetRaySpace, referenceSpace);
            
            if (gripPose) {
                this.updateControllerPose(controller, gripPose);
            }
            
            if (targetRayPose) {
                this.updateTargetRay(controller, targetRayPose);
            }
            
            // 处理输入事件
            this.handleInputEvents(inputSource, frame);
        }
    }
    
    handleInputEvents(inputSource, frame) {
        // 选择事件
        if (frame.getInputSourceEvent(inputSource, 'select')) {
            this.handlers.select.forEach(handler => handler(inputSource));
        }
        
        // 挤压事件
        if (frame.getInputSourceEvent(inputSource, 'squeeze')) {
            this.handlers.squeeze.forEach(handler => handler(inputSource));
        }
    }
    
    on(event, handler) {
        if (this.handlers[event]) {
            this.handlers[event].push(handler);
        }
    }
}
```

### 手部追踪
```javascript
class XRHandTracking {
    constructor(session) {
        this.session = session;
        this.hands = new Map();
        this.handMeshes = new Map();
        
        this.setupHandTracking();
    }
    
    async setupHandTracking() {
        if (!this.session.enabledFeatures.includes('hand-tracking')) {
            console.warn('Hand tracking not supported');
            return;
        }
        
        // 请求手部追踪
        const handTrackingFeature = await this.session.requestFeature('hand-tracking');
        console.log('Hand tracking enabled:', handTrackingFeature);
        
        this.createHandMeshes();
    }
    
    createHandMeshes() {
        // 创建左手和右手的3D模型
        const leftHandMesh = this.createHandModel();
        const rightHandMesh = this.createHandModel();
        
        this.handMeshes.set('left', leftHandMesh);
        this.handMeshes.set('right', rightHandMesh);
        
        scene.add(leftHandMesh);
        scene.add(rightHandMesh);
    }
    
    createHandModel() {
        const handGroup = new THREE.Group();
        
        // 创建手掌
        const palmGeometry = new THREE.SphereGeometry(0.03, 8, 6);
        const palmMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const palm = new THREE.Mesh(palmGeometry, palmMaterial);
        handGroup.add(palm);
        
        // 创建手指关节（简化版本）
        for (let i = 0; i < 5; i++) {
            const finger = this.createFinger();
            finger.position.x = (i - 2) * 0.02;
            handGroup.add(finger);
        }
        
        return handGroup;
    }
    
    update(frame, referenceSpace) {
        // 获取手部姿态
        const leftHand = frame.getJointPoses('left', referenceSpace);
        const rightHand = frame.getJointPoses('right', referenceSpace);
        
        if (leftHand) {
            this.updateHandMesh('left', leftHand);
        }
        
        if (rightHand) {
            this.updateHandMesh('right', rightHand);
        }
    }
    
    updateHandMesh(handedness, jointPoses) {
        const handMesh = this.handMeshes.get(handedness);
        if (!handMesh) return;
        
        // 更新手部关节位置（简化实现）
        // 实际实现需要根据jointPoses更新所有关节
        handMesh.visible = true;
    }
}
```

## 空间追踪

### 命中检测
```javascript
class XRHitTest {
    constructor(session) {
        this.session = session;
        this.hitTestSource = null;
        this.hitTestResults = [];
        
        this.initHitTest();
    }
    
    async initHitTest() {
        if (!this.session.enabledFeatures.includes('hit-test')) {
            console.warn('Hit test not supported');
            return;
        }
        
        const referenceSpace = await this.session.requestReferenceSpace('viewer');
        this.hitTestSource = await this.session.requestHitTestSource({
            space: referenceSpace
        });
    }
    
    update(frame, referenceSpace) {
        if (!this.hitTestSource) return;
        
        const hitTestResults = frame.getHitTestResults(this.hitTestSource);
        this.hitTestResults = hitTestResults;
        
        return hitTestResults;
    }
    
    // 获取命中点
    getHitPoint(hitTestResult) {
        if (!hitTestResult) return null;
        
        const pose = hitTestResult.getPose(referenceSpace);
        if (pose) {
            return {
                position: pose.transform.position,
                orientation: pose.transform.orientation
            };
        }
        
        return null;
    }
    
    // 在命中点创建对象
    createObjectAtHitPoint(hitTestResult, object) {
        const hitPoint = this.getHitPoint(hitTestResult);
        if (!hitPoint) return null;
        
        object.position.copy(hitPoint.position);
        object.quaternion.copy(hitPoint.orientation);
        
        scene.add(object);
        return object;
    }
}
```

### 平面检测
```javascript
class XRPlaneDetection {
    constructor(session) {
        this.session = session;
        this.detectedPlanes = new Map();
        this.planeMeshes = new Map();
        
        this.initPlaneDetection();
    }
    
    async initPlaneDetection() {
        if (!this.session.enabledFeatures.includes('plane-detection')) {
            console.warn('Plane detection not supported');
            return;
        }
        
        // 启用平面检测
        await this.session.updateWorldTrackingState({
            planeDetectionState: { enabled: true }
        });
    }
    
    update(frame) {
        const worldInformation = frame.worldInformation;
        if (!worldInformation) return;
        
        // 获取检测到的平面
        const detectedPlanes = worldInformation.detectedPlanes;
        
        // 更新平面可视化
        detectedPlanes.forEach(plane => {
            this.updatePlaneMesh(plane);
        });
        
        // 移除不再存在的平面
        this.cleanupRemovedPlanes(detectedPlanes);
    }
    
    updatePlaneMesh(plane) {
        if (!this.planeMeshes.has(plane)) {
            this.createPlaneMesh(plane);
        }
        
        const planeMesh = this.planeMeshes.get(plane);
        const pose = frame.getPose(plane.planeSpace, referenceSpace);
        
        if (pose) {
            planeMesh.position.copy(pose.transform.position);
            planeMesh.quaternion.copy(pose.transform.orientation);
            planeMesh.scale.set(plane.width, 1, plane.height);
            planeMesh.visible = true;
        }
    }
    
    createPlaneMesh(plane) {
        const planeGeometry = new THREE.PlaneGeometry(1, 1);
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        scene.add(planeMesh);
        
        this.planeMeshes.set(plane, planeMesh);
    }
    
    cleanupRemovedPlanes(currentPlanes) {
        for (const [plane, mesh] of this.planeMeshes) {
            if (!currentPlanes.has(plane)) {
                scene.remove(mesh);
                mesh.geometry.dispose();
                mesh.material.dispose();
                this.planeMeshes.delete(plane);
            }
        }
    }
}
```

## AR 特定功能

### 光照估计
```javascript
class XRLightEstimation {
    constructor(session) {
        this.session = session;
        this.lightProbe = null;
        this.lightEstimation = null;
        
        this.initLightEstimation();
    }
    
    async initLightEstimation() {
        if (!this.session.enabledFeatures.includes('light-estimation')) {
            console.warn('Light estimation not supported');
            return;
        }
        
        const lightProbe = new THREE.LightProbe();
        scene.add(lightProbe);
        
        this.lightEstimation = await this.session.requestLightProbe();
    }
    
    update(frame) {
        if (!this.lightEstimation) return;
        
        const lightEstimate = frame.getLightEstimate(this.lightEstimation);
        if (lightEstimate && this.lightProbe) {
            // 更新光照探针
            const sphericalHarmonics = new THREE.SphericalHarmonics3();
            sphericalHarmonics.fromArray(lightEstimate.sphericalHarmonicsCoefficients);
            this.lightProbe.sh.copy(sphericalHarmonics);
            
            // 更新环境强度
            scene.environmentIntensity = lightEstimate.primaryLightIntensity;
        }
    }
}
```

### 图像追踪
```javascript
class XRImageTracking {
    constructor(session) {
        this.session = session;
        this.trackedImages = new Map();
        
        this.initImageTracking();
    }
    
    async initImageTracking() {
        if (!this.session.enabledFeatures.includes('image-tracking')) {
            console.warn('Image tracking not supported');
            return;
        }
        
        // 创建要追踪的图像集
        const trackableImages = await this.createTrackableImages();
        
        await this.session.updateWorldTrackingState({
            imageTrackingState: {
                trackedImages: trackableImages
            }
        });
    }
    
    async createTrackableImages() {
        // 在实际应用中，这里会加载实际的图像
        const trackableImages = [
            {
                image: await this.loadImage('qrcode.png'),
                widthInMeters: 0.1,
                trackingScore: 0.8
            }
        ];
        
        return trackableImages;
    }
    
    update(frame) {
        const worldInformation = frame.worldInformation;
        if (!worldInformation) return;
        
        const trackedImages = worldInformation.trackedImages;
        
        trackedImages.forEach(trackedImage => {
            this.handleTrackedImage(trackedImage, frame);
        });
    }
    
    handleTrackedImage(trackedImage, frame) {
        const pose = frame.getPose(trackedImage.imageSpace, referenceSpace);
        if (!pose) return;
        
        // 在追踪到的图像位置显示虚拟内容
        if (!this.trackedImages.has(trackedImage)) {
            this.createTrackedImageContent(trackedImage);
        }
        
        const content = this.trackedImages.get(trackedImage);
        content.position.copy(pose.transform.position);
        content.quaternion.copy(pose.transform.orientation);
    }
    
    createTrackedImageContent(trackedImage) {
        const content = new THREE.Group();
        
        // 在追踪到的图像上显示3D内容
        const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const cube = new THREE.Mesh(geometry, material);
        content.add(cube);
        
        scene.add(content);
        this.trackedImages.set(trackedImage, content);
        
        return content;
    }
}
```

## 用户体验优化

### UI 交互提示
```javascript
class XRUIHelpers {
    // 创建注视点指示器
    static createGazeIndicator() {
        const geometry = new THREE.RingGeometry(0.01, 0.02, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        const gazeIndicator = new THREE.Mesh(geometry, material);
        gazeIndicator.rotation.x = -Math.PI / 2;
        gazeIndicator.visible = false;
        
        scene.add(gazeIndicator);
        return gazeIndicator;
    }
    
    // 更新注视点指示器
    static updateGazeIndicator(gazeIndicator, hitTestResult) {
        if (hitTestResult && hitTestResult.length > 0) {
            const pose = hitTestResult[0].getPose(referenceSpace);
            if (pose) {
                gazeIndicator.position.copy(pose.transform.position);
                gazeIndicator.visible = true;
                return;
            }
        }
        
        gazeIndicator.visible = false;
    }
    
    // 创建控制器提示
    static createControllerHint(controller, hintType) {
        const hint = new THREE.Group();
        
        switch (hintType) {
            case 'select':
                const selectGeometry = new THREE.SphereGeometry(0.01, 8, 6);
                const selectMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                const selectHint = new THREE.Mesh(selectGeometry, selectMaterial);
                hint.add(selectHint);
                break;
                
            case 'grab':
                const grabGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.02);
                const grabMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
                const grabHint = new THREE.Mesh(grabGeometry, grabMaterial);
                hint.add(grabHint);
                break;
        }
        
        controller.add(hint);
        return hint;
    }
}
```

### 性能优化
```javascript
class XRPerformanceManager {
    constructor(renderer, session) {
        this.renderer = renderer;
        this.session = session;
        this.frameRate = 90; // VR典型帧率
        
        this.setupPerformanceMonitoring();
    }
    
    setupPerformanceMonitoring() {
        // 监听性能事件
        this.session.addEventListener('frameratechange', (event) => {
            this.handleFrameRateChange(event.frameRate);
        });
        
        // 设置性能偏好
        this.setPerformancePreferences();
    }
    
    setPerformancePreferences() {
        // 根据设备能力调整渲染设置
        if (this.session.renderState.layers) {
            const layer = this.session.renderState.layers[0];
            
            // 调整分辨率尺度以平衡性能和质量
            const scaleFactor = this.calculateOptimalScale();
            layer.updateResolutionScale(scaleFactor);
        }
    }
    
    calculateOptimalScale() {
        // 根据设备性能调整分辨率
        // 返回0.5到1.0之间的值
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return isMobile ? 0.7 : 0.9;
    }
    
    handleFrameRateChange(newFrameRate) {
        console.log('Frame rate changed to:', newFrameRate);
        this.frameRate = newFrameRate;
        
        // 根据帧率调整渲染设置
        this.adjustRenderingForFrameRate();
    }
    
    adjustRenderingForFrameRate() {
        if (this.frameRate < 60) {
            // 低帧率时降低质量
            this.renderer.shadowMap.enabled = false;
        } else {
            // 高帧率时启用高级特性
            this.renderer.shadowMap.enabled = true;
        }
    }
    
    // 动态LOD系统
    setupDynamicLOD() {
        // 根据距离和性能调整细节级别
        // 实现基于距离的几何体简化
    }
}
```

## 完整示例

### 基础 VR 体验
```javascript
class BasicVRExperience {
    constructor() {
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.sessionManager = null;
        this.renderLoop = null;
        this.inputManager = null;
        
        this.init();
    }
    
    async init() {
        // 检查XR支持
        const xrSupport = await XRSystemChecker.checkXRSupport();
        if (!xrSupport.vr) {
            alert('VR not supported on this device');
            return;
        }
        
        // 初始化Three.js场景
        this.setupScene();
        
        // 初始化XR系统
        this.setupXR();
        
        // 启动渲染循环
        this.startRendering();
    }
    
    setupScene() {
        // 创建渲染器
        this.renderer = XRRendererSetup.setupWebGLRenderer(document.getElementById('canvas'));
        
        // 创建场景
        this.scene = XRRendererSetup.setupXRScene();
        
        // 创建相机
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);
        
        // 添加测试对象
        this.addTestObjects();
    }
    
    setupXR() {
        // 创建会话管理器
        this.sessionManager = new XRSessionManager(this.renderer);
        this.sessionManager.onSessionStart = (session) => this.onSessionStart(session);
        this.sessionManager.onSessionEnd = () => this.onSessionEnd();
        
        // 创建渲染循环
        this.renderLoop = new XRRenderLoop(this.renderer, this.scene, this.camera);
        this.renderLoop.onFrame = (time, frame, pose) => this.onXRFrame(time, frame, pose);
    }
    
    addTestObjects() {
        // 添加一个立方体
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 1.6, -0.5); // 放在用户面前
        this.scene.add(cube);
        
        // 添加地面
        const floorGeometry = new THREE.PlaneGeometry(10, 10);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);
    }
    
    async startVR() {
        try {
            await this.sessionManager.requestSession('immersive-vr', {
                requiredFeatures: ['local-floor', 'hit-test']
            });
        } catch (error) {
            console.error('Failed to start VR session:', error);
        }
    }
    
    onSessionStart(session) {
        console.log('VR session started');
        
        // 初始化输入管理
        this.inputManager = new XRInputManager(session);
        
        // 开始渲染循环
        this.renderLoop.start();
    }
    
    onSessionEnd() {
        console.log('VR session ended');
        this.renderLoop.stop();
    }
    
    onXRFrame(time, frame, pose) {
        // 更新输入
        if (this.inputManager && this.sessionManager.referenceSpace) {
            this.inputManager.update(frame, this.sessionManager.referenceSpace);
        }
        
        // 更新场景动画
        this.updateScene(time);
    }
    
    updateScene(time) {
        // 场景动画逻辑
        const cubes = this.scene.children.filter(child => child.isMesh && child.geometry.type === 'BoxGeometry');
        cubes.forEach((cube, index) => {
            cube.rotation.y = time * 0.001 * (index + 1);
        });
    }
    
    startRendering() {
        // 非XR模式下的渲染循环
        if (!this.renderer.xr.isPresenting) {
            this.renderer.setAnimationLoop(() => {
                this.renderer.render(this.scene, this.camera);
            });
        }
    }
}

// 启动体验
const vrExperience = new BasicVRExperience();

// 添加启动按钮
document.getElementById('start-vr').addEventListener('click', () => {
    vrExperience.startVR();
});
```