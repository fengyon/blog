# Three.js 入门

## Three.js 概述

### 什么是 Three.js
Three.js 是基于 WebGL 的 3D 图形库，简化了 Web3D 开发：
```
原生 WebGL ← Three.js ← 应用程序
复杂 API       简化 API     易用接口
```

### 核心架构
Three.js 采用场景图架构：
```
Scene → Objects → Geometry + Material
                ↓
            Renderer → Canvas
```

## 基础环境搭建

### 基础 HTML 结构
```html
<!DOCTYPE html>
<html>
<head>
    <title>Three.js 入门</title>
    <style>
        body { margin: 0; overflow: hidden; }
        canvas { display: block; }
    </style>
</head>
<body>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="app.js"></script>
</body>
</html>
```

### 基础 Three.js 应用
```javascript
// 初始化场景
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75, // 视野角度
    window.innerWidth / window.innerHeight, // 宽高比
    0.1, // 近平面
    1000 // 远平面
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 创建立方体
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

// 渲染循环
function animate() {
    requestAnimationFrame(animate);
    
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    
    renderer.render(scene, camera);
}

animate();
```

## 核心概念

### 场景图结构
```
Scene (场景)
    |
    +-- Camera (相机)
    |
    +-- Mesh (网格)
        |
        +-- Geometry (几何体)
        |
        +-- Material (材质)
    |
    +-- Light (光源)
    |
    +-- Group (组)
```

### 坐标系系统
Three.js 使用右手坐标系：
```
    y
    |
    |
    +--- x
   /
  /
 z
```

## 几何体

### 内置几何体
```javascript
// 立方体
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

// 球体
const sphereGeometry = new THREE.SphereGeometry(1, 32, 16);

// 平面
const planeGeometry = new THREE.PlaneGeometry(5, 5);

// 圆柱体
const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);

// 圆环
const torusGeometry = new THREE.TorusGeometry(2, 0.5, 16, 100);

// 二十面体
const icosahedronGeometry = new THREE.IcosahedronGeometry(1);
```

### 自定义几何体
```javascript
// 使用 BufferGeometry 创建自定义几何体
const geometry = new THREE.BufferGeometry();

// 顶点位置
const vertices = new Float32Array([
    -1.0, -1.0,  0.0,
     1.0, -1.0,  0.0,
     0.0,  1.0,  0.0
]);
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

// 顶点颜色
const colors = new Float32Array([
    1.0, 0.0, 0.0, // 红色
    0.0, 1.0, 0.0, // 绿色
    0.0, 0.0, 1.0  // 蓝色
]);
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// 索引
const indices = new Uint16Array([0, 1, 2]);
geometry.setIndex(new THREE.BufferAttribute(indices, 1));
```

## 材质系统

### 基础材质类型
```javascript
// 基础材质 - 不受光照影响
const basicMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: false
});

// 标准材质 - PBR 材质
const standardMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.5
});

// 物理材质 - 更精确的 PBR
const physicalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
});

// 法线材质 - 显示法线方向
const normalMaterial = new THREE.MeshNormalMaterial();

// 线框材质
const wireframeMaterial = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 0x00ff00
});
```

### 材质属性配置
```javascript
const material = new THREE.MeshStandardMaterial({
    color: 0x3498db,           // 基础颜色
    transparent: true,          // 启用透明度
    opacity: 0.8,              // 不透明度
    roughness: 0.7,            // 粗糙度 (0-1)
    metalness: 0.2,            // 金属度 (0-1)
    side: THREE.FrontSide,     // 渲染面 (FrontSide, BackSide, DoubleSide)
    flatShading: false,        // 平面着色
    wireframe: false           // 线框模式
});
```

## 纹理与贴图

### 纹理加载
```javascript
// 纹理加载器
const textureLoader = new THREE.TextureLoader();

// 加载纹理
const diffuseMap = textureLoader.load('textures/diffuse.jpg');
const normalMap = textureLoader.load('textures/normal.jpg');
const roughnessMap = textureLoader.load('textures/roughness.jpg');

// 配置纹理
diffuseMap.wrapS = diffuseMap.wrapT = THREE.RepeatWrapping;
diffuseMap.repeat.set(2, 2);

// 使用纹理的材质
const material = new THREE.MeshStandardMaterial({
    map: diffuseMap,           // 漫反射贴图
    normalMap: normalMap,      // 法线贴图
    roughnessMap: roughnessMap, // 粗糙度贴图
    metalness: 0.5
});
```

### 环境贴图
```javascript
// 立方体贴图加载
const cubeTextureLoader = new THREE.CubeTextureLoader();
const environmentMap = cubeTextureLoader.load([
    'px.jpg', 'nx.jpg', // 右, 左
    'py.jpg', 'ny.jpg', // 上, 下  
    'pz.jpg', 'nz.jpg'  // 后, 前
]);

// 设置场景环境
scene.background = environmentMap;

// 设置材质环境
material.envMap = environmentMap;
material.envMapIntensity = 1.0;
```

## 光照系统

### 光源类型
```javascript
// 环境光 - 均匀照亮所有表面
const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
scene.add(ambientLight);

// 定向光 - 模拟太阳光
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// 点光源 - 模拟灯泡
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 5, 0);
pointLight.castShadow = true;
scene.add(pointLight);

// 聚光灯 - 模拟手电筒
const spotLight = new THREE.SpotLight(0xffffff, 1, 100, Math.PI / 4, 0.5, 1);
spotLight.position.set(0, 10, 0);
spotLight.target.position.set(0, 0, 0);
scene.add(spotLight);
scene.add(spotLight.target);
```

### 阴影配置
```javascript
// 启用渲染器阴影
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// 配置光源阴影
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;

// 物体投射和接收阴影
cube.castShadow = true;
cube.receiveShadow = true;

// 平面接收阴影
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ color: 0xcccccc })
);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);
```

## 相机系统

### 相机类型
```javascript
// 透视相机 - 3D 场景
const perspectiveCamera = new THREE.PerspectiveCamera(
    75,                                   // 视野角度
    window.innerWidth / window.innerHeight, // 宽高比
    0.1,                                  // 近平面
    1000                                  // 远平面
);

// 正交相机 - 2D 场景或等距视图
const orthographicCamera = new THREE.OrthographicCamera(
    window.innerWidth / -2,   // 左
    window.innerWidth / 2,    // 右  
    window.innerHeight / 2,   // 上
    window.innerHeight / -2,  // 下
    0.1,                      // 近平面
    1000                      // 远平面
);

// 阵列相机 - 多视图
const arrayCamera = new THREE.ArrayCamera([
    perspectiveCamera,
    orthographicCamera
]);
```

### 相机控制
```javascript
// OrbitControls - 轨道控制器
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;      // 启用阻尼
controls.dampingFactor = 0.05;     // 阻尼系数
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 100;
controls.maxPolarAngle = Math.PI;   // 垂直旋转限制

// 在动画循环中更新
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // 只在阻尼启用时需要
    renderer.render(scene, camera);
}
```

## 动画系统

### 基础动画
```javascript
// 使用 requestAnimationFrame
function animate() {
    requestAnimationFrame(animate);
    
    // 旋转动画
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    
    // 位置动画
    cube.position.y = Math.sin(Date.now() * 0.001) * 0.5;
    
    renderer.render(scene, camera);
}

animate();
```

### 使用 Clock 管理时间
```javascript
const clock = new THREE.Clock();

function animate() {
    const delta = clock.getDelta(); // 获取帧间时间
    const elapsedTime = clock.getElapsedTime(); // 获取总时间
    
    // 基于时间的动画
    cube.rotation.x = elapsedTime * 0.5;
    cube.position.y = Math.sin(elapsedTime) * 2;
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
```

### 补间动画
```javascript
import { TWEEN } from 'three/examples/jsm/libs/tween.module.js';

// 创建补间动画
new TWEEN.Tween(cube.position)
    .to({ x: 5, y: 2, z: 0 }, 2000) // 目标位置，持续时间
    .easing(TWEEN.Easing.Quadratic.Out) // 缓动函数
    .start();

// 在动画循环中更新
function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    renderer.render(scene, camera);
}
```

## 加载器系统

### 模型加载
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const gltfLoader = new GLTFLoader();

// 加载 GLTF 模型
gltfLoader.load(
    'models/scene.gltf',
    function(gltf) {
        const model = gltf.scene;
        scene.add(model);
        
        // 遍历模型设置阴影
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    },
    function(progress) {
        // 加载进度
        console.log('加载进度:', (progress.loaded / progress.total) * 100 + '%');
    },
    function(error) {
        console.error('加载错误:', error);
    }
);
```

### 纹理加载管理器
```javascript
const loadingManager = new THREE.LoadingManager();

loadingManager.onStart = function(url, itemsLoaded, itemsTotal) {
    console.log('开始加载: ' + url);
};

loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    console.log('加载进度: ' + itemsLoaded + '/' + itemsTotal);
};

loadingManager.onLoad = function() {
    console.log('所有资源加载完成');
};

loadingManager.onError = function(url) {
    console.log('加载错误: ' + url);
};

const textureLoader = new THREE.TextureLoader(loadingManager);
```

## 性能优化

### 几何体合并
```javascript
// 使用 InstancedMesh 进行实例化
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
const instancedMesh = new THREE.InstancedMesh(geometry, material, 1000);

const matrix = new THREE.Matrix4();
const color = new THREE.Color();

for (let i = 0; i < 1000; i++) {
    // 设置每个实例的位置和旋转
    matrix.setPosition(
        Math.random() * 100 - 50,
        Math.random() * 100 - 50, 
        Math.random() * 100 - 50
    );
    instancedMesh.setMatrixAt(i, matrix);
    
    // 设置每个实例的颜色
    color.setHex(Math.random() * 0xffffff);
    instancedMesh.setColorAt(i, color);
}

scene.add(instancedMesh);
```

### LOD (Level of Detail)
```javascript
const lod = new THREE.LOD();

// 创建不同细节级别的几何体
const highDetailGeometry = new THREE.SphereGeometry(1, 32, 32);
const mediumDetailGeometry = new THREE.SphereGeometry(1, 16, 16);
const lowDetailGeometry = new THREE.SphereGeometry(1, 8, 8);

// 添加细节级别
lod.addLevel(new THREE.Mesh(highDetailGeometry, material), 0);
lod.addLevel(new THREE.Mesh(mediumDetailGeometry, material), 50);
lod.addLevel(new THREE.Mesh(lowDetailGeometry, material), 100);

scene.add(lod);
```

### 视锥体剔除
```javascript
// 启用自动更新
camera.updateMatrixWorld();
camera.updateProjectionMatrix();

// 手动检查可见性
const frustum = new THREE.Frustum();
frustum.setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
    )
);

// 检查物体是否在视锥体内
if (frustum.intersectsObject(mesh)) {
    // 物体可见，进行渲染
}
```

## 后期处理

### 基础后期处理
```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// 创建后期处理器
const composer = new EffectComposer(renderer);

// 添加渲染通道
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// 添加辉光效果
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,   // 强度
    0.4,   // 阈值
    0.85   // 平滑度
);
composer.addPass(bloomPass);

// 在动画循环中使用后期处理器
function animate() {
    requestAnimationFrame(animate);
    composer.render();
}
```

## 响应式设计

### 窗口大小适应
```javascript
function onWindowResize() {
    // 更新相机
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // 更新渲染器
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // 更新后期处理器（如果使用）
    if (composer) {
        composer.setSize(window.innerWidth, window.innerHeight);
    }
}

window.addEventListener('resize', onWindowResize);
```

### 像素比率适配
```javascript
// 设置合适的像素比率
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 性能监控
const stats = new Stats();
document.body.appendChild(stats.dom);

function animate() {
    requestAnimationFrame(animate);
    stats.update();
    // ... 其他动画逻辑
}
```

## 实用工具

### 辅助工具
```javascript
// 坐标轴辅助
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// 网格辅助
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

// 光源辅助
const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
scene.add(lightHelper);

// 相机辅助
const cameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
scene.add(cameraHelper);
```

### 射线检测
```javascript
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
    // 将鼠标位置归一化为 -1 到 1
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function checkIntersection() {
    // 更新射线
    raycaster.setFromCamera(mouse, camera);
    
    // 计算相交物体
    const intersects = raycaster.intersectObjects(scene.children);
    
    if (intersects.length > 0) {
        // 处理相交
        const object = intersects[0].object;
        console.log('选中物体:', object);
    }
}

window.addEventListener('mousemove', onMouseMove);
```