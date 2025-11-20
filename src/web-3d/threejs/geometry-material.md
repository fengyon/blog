# Three.js 入门

## 什么是 Three.js？

Three.js 是一个基于 WebGL 的 JavaScript 3D 图形库，它通过封装底层图形接口让开发者能够用更简洁的代码在浏览器中创建交互式 3D 体验。它充当了 WebGL 复杂性的抽象层，使 3D 编程变得像操作高级对象一样直观。

## 为什么选择 Three.js？

- **开发效率**：原生 WebGL 需要数百行代码的基础渲染，Three.js 只需几十行
- **功能集成**：内置几何体、材质系统、光影计算和模型加载器
- **跨平台能力**：基于 Web 标准，支持桌面/移动端浏览器
- **扩展生态**：物理引擎、后期处理、控件系统等可选模块

## 核心架构解析

### 场景图结构

Three.js 采用树状场景图管理所有对象：
```
Scene (根容器)
    ├── PerspectiveCamera (视角相机)
    ├── AmbientLight (环境光)
    ├── DirectionalLight (定向光)
    └── Group (组对象)
        ├── Mesh (网格实例)
        │   ├── BoxGeometry (立方体几何)
        │   └── MeshStandardMaterial (标准材质)
        └── Mesh
            ├── SphereGeometry (球体几何)
            └── MeshPhysicalMaterial (物理材质)
```

### 渲染循环机制

核心渲染流程示意图：
```
初始化 → 资源加载 → 场景构建
    ↓
主循环开始 → 更新矩阵 → 执行动画
    ↓
渲染通道 → 相机裁剪 → 着色器执行
    ↓
帧缓冲 → 屏幕绘制 → 循环继续
```

## 核心组件详解

### 场景 (Scene)

场景是所有 3D 对象的容器，管理渲染层级和雾效等全局属性。它就像虚拟摄影棚：

```
    +-------------------+
    |      Scene        |
    | +---------------+ |
    | |    Objects    | |
    | | +-----------+ | |
    | | |   Mesh    | | |
    | | +-----------+ | |
    | +---------------+ |
    +-------------------+
```

### 相机系统

**透视相机** (最常用)：
```
      视锥体示意图
        /|\
       / | \
      /  |  \  近裁剪面
     /   |   \   /
    /    |    \ /
   /     |     \
  /      |      \
 /       |       \
/________|________\ 远裁剪面
   相机位置
```

**正交相机**：
```
+-------------------+
|                   |
|   uniform scale   |
|                   |
+-------------------+
```

### 几何体 (Geometry)

定义物体形状数据结构：
```
BoxGeometry (立方体)
    ▲
    │ vertices: [x,y,z,...]
    │ faces: [a,b,c,...]
    │ uvs: [u,v,...]
    ▼
BufferGeometry (高效格式)
    ▲
    │ attributes: {
    │   position: Float32Array,
    │   normal: Float32Array,
    │   uv: Float32Array
    │ }
```

立方体线框示意图：
```
    +-----+
   /     /|
  +-----+ |
  |     | +
  |     |/
  +-----+
```

### 材质系统

材质类型对比：
- **BasicMaterial**：基础材质，无视光照
  ```
  表面着色：直接显示颜色/纹理
  光照影响：无
  性能开销：低
  ```
- **StandardMaterial**：基于物理渲染 (PBR)
  ```
  表面着色：漫反射 + 高光反射
  光照影响：漫反射/镜面反射/环境光遮蔽
  物理属性：金属度/粗糙度
  ```

### 光源类型

光照模型示意图：
```
环境光
    ↓
全局均匀照明
    +
平行光
    ↓
方向性阴影
    +
点光源
    ↓
径向衰减照明
```

## 关键特性深度解析

### 坐标系系统

Three.js 使用右手坐标系：
```
    y ▲
     │
     │   / z
     │  /
     │ /
     └───────▶ x
```

### 矩阵变换链

对象变换流程：
```
本地坐标 → 模型矩阵 → 世界坐标
    ↓
视图矩阵 → 相机空间
    ↓
投影矩阵 → 裁剪空间
    ↓
透视除法 → 标准化设备坐标
```

### 着色器定制

可编程渲染管线支持：
```
顶点着色器
输入：顶点位置/法线/UV
处理：坐标变换
输出：裁剪空间坐标
    ↓
片元着色器
输入：插值后的变量
处理：颜色计算
输出：最终像素颜色
```

### 后期处理通道

渲染效果叠加流程：
```
主场景渲染 → 颜色缓冲
    ↓
效果通道1 → 亮度过滤
    ↓
效果通道2 → 高斯模糊
    ↓
合成通道 → 屏幕输出
```

## 实战入门示例

### 基础场景搭建

```javascript
// 1. 创建场景容器
const scene = new THREE.Scene();

// 2. 初始化透视相机（视野角度，宽高比，近裁剪面，远裁剪面）
const camera = new THREE.PerspectiveCamera(
  75, 
  window.innerWidth / window.innerHeight,
  0.1, 
  1000
);

// 3. 实例化WebGL渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. 创建立方体几何（宽度，高度，深度，分段数）
const geometry = new THREE.BoxGeometry(1, 1, 1, 32, 32, 32);

// 5. 创建PBR材质
const material = new THREE.MeshStandardMaterial({ 
  color: 0x2194ce,
  roughness: 0.3,
  metalness: 0.8
});

// 6. 生成网格对象
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 7. 添加环境光照
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// 8. 添加定向光源
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// 9. 调整相机位置
camera.position.z = 5;

// 10. 渲染循环实现
function animate() {
  requestAnimationFrame(animate);
  
  // 旋转变换：每帧绕Y轴旋转0.01弧度
  cube.rotation.y += 0.01;
  
  // 执行渲染
  renderer.render(scene, camera);
}
animate();
```

### 性能优化要点

- **几何体合并**：减少绘制调用
- **纹理图集**：合并小纹理
- **LOD 系统**：根据距离切换细节层级
- **视锥裁剪**：自动剔除不可见对象
- **实例化渲染**：大量重复对象优化

### 资源加载模式

```javascript
// GLTF模型加载示例
const loader = new THREE.GLTFLoader();
loader.load('model.gltf', (gltf) => {
  scene.add(gltf.scene);
  
  // 遍历场景图调整材质
  gltf.scene.traverse((node) => {
    if (node.isMesh) {
      node.material.roughness = 0.5;
    }
  });
});
```