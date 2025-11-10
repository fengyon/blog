# three.js

## 什么是 three.js
three.js 是基于 WebGL 的轻量级 3D JavaScript 库，封装了复杂的 WebGL 底层 API，提供直观的 3D 场景图结构和丰富的内置功能，让开发者能够快速创建和展示 3D 图形内容。

示意图：three.js 在技术栈中的位置
```
JavaScript -> three.js -> WebGL -> GPU
```

## 核心架构

### 场景图结构
three.js 使用层次化的场景图管理所有 3D 对象，包含场景、相机、渲染器三大核心组件。

示意图：场景图层次
```
Scene
├── Camera
├── Lights
├── Mesh (Geometry + Material)
├── Group
│   ├── Mesh
│   └── Mesh
└── Helpers
```

API 示例：基础场景创建
```javascript
import * as THREE from 'three';

// 创建场景、相机、渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// 配置渲染器
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x222222); // 背景色
renderer.shadowMap.enabled = true; // 启用阴影
document.body.appendChild(renderer.domElement);

// 添加坐标轴辅助
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
```

## 几何体与材质系统

### 内置几何体
three.js 提供丰富的预设几何体，支持自定义几何体创建。

示意图：常见几何体类型
```
BoxGeometry      SphereGeometry    CylinderGeometry
   []               ()                 /|\
  [][]             ( )                 | |
 [][][]           (   )               \|/
```

API 示例：几何体创建与组合
```javascript
// 创建立方体几何体
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

// 创建球体几何体
const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);

// 创建自定义几何体
const customGeometry = new THREE.BufferGeometry();
const vertices = new Float32Array([
  -1.0, -1.0,  1.0,  // 顶点1
   1.0, -1.0,  1.0,  // 顶点2
   1.0,  1.0,  1.0,  // 顶点3
  
   1.0,  1.0,  1.0,  // 顶点3
  -1.0,  1.0,  1.0,  // 顶点4
  -1.0, -1.0,  1.0   // 顶点1
]);
customGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

// 计算法线
customGeometry.computeVertexNormals();
```

### 材质系统
材质定义物体表面的外观特性，支持从基础颜色到复杂物理渲染。

示意图：材质效果层级
```
基础颜色 -> 纹理贴图 -> 法线凹凸 -> 环境反射 -> 物理渲染
```

API 示例：多种材质创建
```javascript
// 基础材质
const basicMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  wireframe: false
});

// 标准物理材质
const standardMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.5,      // 粗糙度 0-1
  metalness: 0.8,      // 金属度 0-1
  normalScale: new THREE.Vector2(1, 1)
});

// 着色器材质
const shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 1.0 },
    resolution: { value: new THREE.Vector2() }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    varying vec2 vUv;
    void main() {
      vec3 color = vec3(sin(time + vUv.x * 10.0), cos(time + vUv.y * 10.0), 1.0);
      gl_FragColor = vec4(color, 1.0);
    }
  `
});
```

## 光照与阴影系统

### 光源类型
three.js 提供多种光源类型，模拟真实世界光照效果。

示意图：光源类型比较
```
环境光: 全局均匀照明
方向光: 平行光线 (太阳)
点光源: 球状辐射 (灯泡)
聚光灯: 锥形照射 (手电筒)
```

API 示例：光源创建与配置
```javascript
// 环境光 - 全局基础照明
const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
scene.add(ambientLight);

// 方向光 - 平行光源
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = true;

// 阴影配置
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
scene.add(directionalLight);

// 点光源 - 球状发光
const pointLight = new THREE.PointLight(0xff4000, 1, 100);
pointLight.position.set(0, 5, 0);
scene.add(pointLight);

// 聚光灯 - 锥形照射
const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(0, 10, 0);
spotLight.angle = Math.PI / 6; // 30度锥角
spotLight.penumbra = 0.1;     // 边缘柔化
scene.add(spotLight);
```

## 相机系统

### 相机类型
提供透视相机和正交相机两种主要类型，适应不同渲染需求。

示意图：相机投影类型
```
透视相机: 近大远小，真实感
    /视野\
   /      \
正交相机: 平行投影，无透视
  |视野|
```

API 示例：相机创建与控制
```javascript
// 透视相机 - 3D场景标准相机
const perspectiveCamera = new THREE.PerspectiveCamera(
  45,                                   // 视野角度
  window.innerWidth / window.innerHeight, // 宽高比
  0.1,                                  // 近平面
  1000                                  // 远平面
);
perspectiveCamera.position.set(0, 5, 10);
perspectiveCamera.lookAt(0, 0, 0);

// 正交相机 - 2D/等距视图
const orthographicCamera = new THREE.OrthographicCamera(
  window.innerWidth / -2,   // left
  window.innerWidth / 2,    // right  
  window.innerHeight / 2,   // top
  window.innerHeight / -2,  // bottom
  0.1,                      // near
  1000                      // far
);

// 相机控制器
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
const controls = new OrbitControls(perspectiveCamera, renderer.domElement);
controls.enableDamping = true;      // 平滑阻尼
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 100;
```

## 动画与交互系统

### 动画循环
使用 requestAnimationFrame 实现平滑动画，支持多种动画技术。

示意图：动画循环流程
```
初始化 -> 更新状态 -> 渲染场景 -> 循环
```

API 示例：动画系统实现
```javascript
// 基础动画循环
function animate() {
  requestAnimationFrame(animate);
  
  // 更新控制器
  controls.update();
  
  // 更新对象动画
  updateAnimations();
  
  // 渲染场景
  renderer.render(scene, camera);
}
animate();

// GSAP 动画库集成
import gsap from 'gsap';
const box = new THREE.Mesh(boxGeometry, standardMaterial);
scene.add(box);

// 补间动画
gsap.to(box.position, {
  duration: 2,
  x: 5,
  y: 3, 
  z: 2,
  ease: "power2.inOut",
  repeat: -1,
  yoyo: true
});

// 骨骼动画
const mixer = new THREE.AnimationMixer(model);
const clip = THREE.AnimationClip.findByName(model.animations, 'run');
const action = mixer.clipAction(clip);
action.play();

// 在动画循环中更新
function updateAnimations() {
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
}
```

## 加载器与资源管理

### 模型加载
支持多种 3D 模型格式加载，提供统一的加载接口。

示意图：模型加载流程
```
模型文件 -> 加载器 -> 解析 -> 场景添加 -> 后处理
```

API 示例：各类资源加载
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { TextureLoader } from 'three';

// GLTF 加载器 (推荐格式)
const gltfLoader = new GLTFLoader();

// Draco 压缩支持
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/examples/js/libs/draco/');
gltfLoader.setDRACOLoader(dracoLoader);

// 加载 GLTF 模型
gltfLoader.load(
  'models/scene.gltf',
  function(gltf) {
    const model = gltf.scene;
    model.traverse(function(node) {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    scene.add(model);
  },
  function(progress) {
    console.log('加载进度:', (progress.loaded / progress.total * 100) + '%');
  },
  function(error) {
    console.error('加载错误:', error);
  }
);

// 纹理加载
const textureLoader = new TextureLoader();
const diffuseMap = textureLoader.load('textures/diffuse.jpg');
const normalMap = textureLoader.load('textures/normal.jpg');
const material = new THREE.MeshStandardMaterial({
  map: diffuseMap,
  normalMap: normalMap
});
```

## 后期处理效果

### 后处理管道
通过多通道渲染实现各种屏幕空间效果。

示意图：后处理管道
```
场景渲染 -> 渲染目标 -> 效果1 -> 效果2 -> ... -> 屏幕输出
```

API 示例：后处理配置
```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';

// 创建后处理合成器
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

// 添加胶片颗粒效果
const filmPass = new FilmPass(0.35, 0.025, 648, false);
composer.addPass(filmPass);

// 在动画循环中使用合成器
function animate() {
  requestAnimationFrame(animate);
  composer.render();
}
```

## 性能优化技术

### 渲染优化
多种技术提升渲染性能，支持复杂场景。

示意图：优化技术层级
```
几何体合并 -> LOD系统 -> 视锥裁剪 -> 实例化渲染 -> 遮挡剔除
```

API 示例：性能优化实现
```javascript
// 几何体合并 - 减少绘制调用
const geometry1 = new THREE.BoxGeometry(1, 1, 1);
const geometry2 = new THREE.SphereGeometry(0.5, 32, 32);

geometry1.translate(2, 0, 0);  // 移动几何体位置
const mergedGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(
  [geometry1, geometry2]
);
const mergedMesh = new THREE.Mesh(mergedGeometry, material);
scene.add(mergedMesh);

// LOD (层次细节) 系统
const lod = new THREE.LOD();

// 添加不同细节级别的几何体
const highDetailGeo = new THREE.SphereGeometry(1, 32, 32);
const mediumDetailGeo = new THREE.SphereGeometry(1, 16, 16);
const lowDetailGeo = new THREE.SphereGeometry(1, 8, 8);

lod.addLevel(highDetailGeo, 0);    // 0-10单位距离使用高模
lod.addLevel(mediumDetailGeo, 10); // 10-20单位距离使用中模  
lod.addLevel(lowDetailGeo, 20);    // 20+单位距离使用低模

scene.add(lod);

// 实例化渲染 - 大量相同物体
const instanceCount = 1000;
const instancedGeometry = new THREE.InstancedBufferGeometry();
instancedGeometry.copy(geometry);

const instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(instanceCount * 16), 16);
const instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(instanceCount * 3), 3);

for (let i = 0; i < instanceCount; i++) {
  const matrix = new THREE.Matrix4();
  matrix.setPosition(
    Math.random() * 100 - 50,
    Math.random() * 100 - 50, 
    Math.random() * 100 - 50
  );
  matrix.toArray(instanceMatrix.array, i * 16);
  
  // 设置实例颜色
  instanceColor.setXYZ(i, Math.random(), Math.random(), Math.random());
}

instancedGeometry.setAttribute('instanceMatrix', instanceMatrix);
instancedGeometry.setAttribute('instanceColor', instanceColor);

const instancedMesh = new THREE.Mesh(instancedGeometry, material);
scene.add(instancedMesh);
```

## 物理与交互

### 物理引擎集成
与主流物理引擎集成，实现真实物理交互。

API 示例：物理系统设置
```javascript
import { AmmoPhysics } from 'three/examples/jsm/physics/AmmoPhysics';

// 初始化物理引擎
let physics;
AmmoPhysics().then((physicsInstance) => {
  physics = physicsInstance;
  
  // 创建物理地面
  const groundGeometry = new THREE.PlaneGeometry(50, 50);
  const ground = new THREE.Mesh(groundGeometry, material);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  
  // 添加物理属性
  physics.addMesh(ground, 0); // 质量为0表示静态物体
  
  // 创建物理立方体
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const box = new THREE.Mesh(boxGeometry, material);
  box.position.set(0, 10, 0);
  scene.add(box);
  
  physics.addMesh(box, 1); // 质量为1表示动态物体
});

// 在动画循环中更新物理
function animate() {
  requestAnimationFrame(animate);
  
  if (physics) {
    physics.step(); // 更新物理模拟
  }
  
  renderer.render(scene, camera);
}
```

## 相关技术列表

### 核心引擎技术
- **场景图系统**: 层次化对象管理
- **渲染引擎**: WebGL 1.0/2.0 渲染后端
- **数学库**: 向量、矩阵、四元数运算
- **几何体系统**: BufferGeometry、自定义几何体
- **材质系统**: 从 BasicMaterial 到 PhysicalMaterial

### 加载器与格式支持
- **GLTFLoader**: 标准 3D 格式加载
- **OBJLoader**: OBJ 格式支持
- **FBXLoader**: FBX 格式支持
- **DRACOLoader**: 网格压缩解码
- **KTX2Loader**: 纹理压缩格式
- **RGBELoader**: HDR 环境贴图

### 动画系统
- **AnimationMixer**: 动画混合器
- **关键帧动画**: 基于时间的动画控制
- **骨骼动画**: 角色动画支持
- **变形目标**: 面部表情、形变动画
- **补间动画**: 属性过渡动画

### 后期处理效果
- **EffectComposer**: 后处理管道
- **SSAA**: 超级采样抗锯齿
- **SSR**: 屏幕空间反射
- **SSAO**: 屏幕空间环境光遮蔽
- **Bloom**: 辉光效果
- **DoF**: 景深效果

### 物理与交互
- **Ammo.js**: 物理引擎绑定
- **Cannon.js**: 物理引擎集成
- **射线检测**: 鼠标交互、碰撞检测
- **控制器**: OrbitControls、FlyControls、PointerLockControls

### 可视化与特效
- **粒子系统**: 点精灵、GPU 粒子
- **精灵系统**: 公告牌精灵
- **线条渲染**: Line2、LineGeometry
- **文本渲染**: TextGeometry、字体支持
- **镜头光晕**: LensFlare 效果

### 工具与扩展
- **BufferGeometryUtils**: 几何体工具
- **SceneUtils**: 场景工具
- **ShapeUtils**: 形状工具
- **自定义着色器**: ShaderMaterial、RawShaderMaterial
- **VR/AR 支持**: WebXR 设备集成