# 渲染优化

## 性能瓶颈分析

Web 3D 应用性能瓶颈主要出现在以下几个关键环节：

```
渲染管线瓶颈点
CPU 侧瓶颈              GPU 侧瓶颈
├── JavaScript 逻辑       ├── 顶点处理
├── 场景图遍历            ├── 图元装配
├── 矩阵计算              ├── 光栅化
├── 物理计算              └── 像素着色
└── 动画更新

内存瓶颈
├── 几何体数据
├── 纹理资源
├── 着色器程序
└── 帧缓冲区
```

## 几何体优化

### 顶点数据优化

减少顶点数量是提升性能最直接有效的方法：

```javascript
// 原始高精度球体 (65536 个顶点)
const highPolySphere = new THREE.SphereGeometry(1, 64, 64);

// 优化后的球体 (8192 个顶点)
const optimizedSphere = new THREE.SphereGeometry(1, 32, 32);

// 极简球体 (768 个顶点，适合远距离物体)
const lowPolySphere = new THREE.SphereGeometry(1, 16, 16);
```

### 几何体合并

合并多个几何体减少绘制调用：

```javascript
// 单个几何体合并
const geometries = [];
for (let i = 0; i < 100; i++) {
  const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  geometry.translate(Math.random() * 10, Math.random() * 10, Math.random() * 10);
  geometries.push(geometry);
}

const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
const mergedMesh = new THREE.Mesh(mergedGeometry, material);
scene.add(mergedMesh);
```

### 实例化渲染

对于大量相同物体，使用实例化渲染：

```javascript
const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
const instanceCount = 1000;

const instancedMesh = new THREE.InstancedMesh(geometry, material, instanceCount);

const matrix = new THREE.Matrix4();
const color = new THREE.Color();

for (let i = 0; i < instanceCount; i++) {
  // 设置每个实例的位置和旋转
  matrix.setPosition(
    Math.random() * 20 - 10,
    Math.random() * 20 - 10,
    Math.random() * 20 - 10
  );
  
  // 随机旋转
  matrix.makeRotationFromEuler(
    new THREE.Euler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    )
  );
  
  instancedMesh.setMatrixAt(i, matrix);
  
  // 设置每个实例的颜色
  color.setHex(Math.random() * 0xffffff);
  instancedMesh.setColorAt(i, color);
}

scene.add(instancedMesh);
```

## 材质与纹理优化

### 材质重用

避免创建过多材质实例：

```javascript
// 不好的做法：每个网格创建新材质
const createInefficientScene = () => {
  for (let i = 0; i < 100; i++) {
    const material = new THREE.MeshStandardMaterial({ 
      color: Math.random() * 0xffffff 
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
  }
};

// 优化做法：重用材质
const createOptimizedScene = () => {
  const materials = [
    new THREE.MeshStandardMaterial({ color: 0xff0000 }),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 }),
    new THREE.MeshStandardMaterial({ color: 0x0000ff })
  ];
  
  for (let i = 0; i < 100; i++) {
    const material = materials[i % materials.length];
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
  }
};
```

### 纹理优化策略

```
纹理优化层级
原始纹理 (4096x4096, 16MB)
    ↓ 降采样
中等纹理 (2048x2048, 4MB) 
    ↓ 压缩
压缩纹理 (2048x2048, 1MB)
    ↓ 图集化
纹理图集 (多个小纹理合并)
```

```javascript
// 纹理压缩与MIP映射
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('texture.jpg', (texture) => {
  // 启用MIP映射
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  
  // 设置适当的各向异性过滤
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  
  // 压缩纹理格式
  if (renderer.extensions.get('WEBGL_compressed_texture_astc')) {
    // 使用ASTC压缩格式
    texture.format = THREE.RGBA_ASTC_4x4_Format;
  }
});

// 纹理图集
const atlasLoader = new THREE.TextureLoader();
const atlas = atlasLoader.load('texture-atlas.jpg');

// 为不同物体使用图集的不同区域
const material1 = new THREE.MeshStandardMaterial({
  map: atlas,
  transparent: true
});

// 通过UV变换使用图集的不同部分
geometry.attributes.uv.array = calculateUVsForAtlasRegion(0, 0, 0.5, 0.5);
```

## 渲染技术优化

### 细节层级 (LOD)

根据距离动态切换模型精度：

```javascript
const lod = new THREE.LOD();

// 高细节模型 (近距离)
const highDetailGeometry = new THREE.SphereGeometry(1, 32, 32);
const highDetailMesh = new THREE.Mesh(highDetailGeometry, material);
lod.addLevel(highDetailMesh, 0);

// 中等细节模型 (中距离)
const mediumDetailGeometry = new THREE.SphereGeometry(1, 16, 16);
const mediumDetailMesh = new THREE.Mesh(mediumDetailGeometry, material);
lod.addLevel(mediumDetailMesh, 50);

// 低细节模型 (远距离)
const lowDetailGeometry = new THREE.SphereGeometry(1, 8, 8);
const lowDetailMesh = new THREE.Mesh(lowDetailGeometry, material);
lod.addLevel(lowDetailMesh, 100);

scene.add(lod);
```

### 视锥体裁剪

自动剔除视野外物体：

```javascript
// Three.js 默认启用视锥体裁剪
// 手动优化：对静态物体进行空间分割

class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }
  
  addObject(object, position) {
    const cellKey = this.getCellKey(position);
    if (!this.grid.has(cellKey)) {
      this.grid.set(cellKey, []);
    }
    this.grid.get(cellKey).push(object);
  }
  
  getVisibleObjects(camera) {
    const visibleCells = this.getCellsInFrustum(camera);
    const visibleObjects = [];
    
    for (const cellKey of visibleCells) {
      const objects = this.grid.get(cellKey);
      if (objects) {
        visibleObjects.push(...objects);
      }
    }
    
    return visibleObjects;
  }
  
  getCellsInFrustum(camera) {
    // 计算相机视锥体与网格的交集
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix, 
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(matrix);
    
    // 返回相交的网格单元键值
    return this.calculateIntersectingCells(frustum);
  }
}
```

### 遮挡剔除

```javascript
class OcclusionCulling {
  constructor(renderer, camera) {
    this.renderer = renderer;
    this.camera = camera;
    this.occlusionQuery = null;
  }
  
  async isObjectVisible(object) {
    // 使用硬件遮挡查询
    if (!this.occlusionQuery) {
      this.occlusionQuery = this.renderer.createOcclusionQuery();
    }
    
    this.renderer.beginOcclusionQuery(this.occlusionQuery);
    
    // 渲染对象的简化边界框
    this.renderBoundingBox(object);
    
    this.renderer.endOcclusionQuery();
    
    // 检查查询结果
    const visiblePixels = await this.renderer.getOcclusionQueryResult(this.occlusionQuery);
    return visiblePixels > 0;
  }
  
  renderBoundingBox(object) {
    const box = new THREE.Box3().setFromObject(object);
    const helper = new THREE.Box3Helper(box, 0xffffff);
    this.renderer.render(helper, this.camera);
    helper.dispose();
  }
}
```

## 着色器优化

### 着色器复杂度控制

```
着色器优化策略
高复杂度着色器 → 简化版本
├── PBR 材质 → Phong 材质
├── 动态光照 → 烘焙光照
├── 实时阴影 → 预计算阴影
└── 复杂后处理 → 选择性启用
```

```javascript
// 高质量 PBR 着色器
const highQualityMaterial = new THREE.MeshStandardMaterial({
  metalness: 0.5,
  roughness: 0.5,
  envMap: environmentTexture,
  envMapIntensity: 1.0
});

// 性能优化版着色器
const optimizedMaterial = new THREE.MeshLambertMaterial({
  color: 0xffffff
});

// 根据性能需求动态切换
function adjustMaterialQuality(performanceLevel) {
  if (performanceLevel === 'high') {
    mesh.material = highQualityMaterial;
  } else {
    mesh.material = optimizedMaterial;
  }
}
```

### 着色器预处理

```javascript
// 预编译着色器
class ShaderPrecompiler {
  constructor() {
    this.shaderCache = new Map();
  }
  
  precompileShaders(materials) {
    materials.forEach(material => {
      // 强制编译着色器
      material.needsUpdate = true;
      
      // 缓存编译结果
      const shaderKey = this.getShaderKey(material);
      this.shaderCache.set(shaderKey, material.program);
    });
  }
  
  getShaderKey(material) {
    return `${material.type}_${material.id}`;
  }
}
```

## 内存管理优化

### 资源生命周期管理

```javascript
class ResourceManager {
  constructor() {
    this.geometries = new Set();
    this.textures = new Set();
    this.materials = new Set();
  }
  
  trackGeometry(geometry) {
    this.geometries.add(geometry);
    return geometry;
  }
  
  trackTexture(texture) {
    this.textures.add(texture);
    return texture;
  }
  
  disposeUnusedResources() {
    // 清理未使用的几何体
    this.geometries.forEach(geometry => {
      if (geometry.userData.refCount === 0) {
        geometry.dispose();
        this.geometries.delete(geometry);
      }
    });
    
    // 清理未使用的纹理
    this.textures.forEach(texture => {
      if (texture.userData.refCount === 0) {
        texture.dispose();
        this.textures.delete(texture);
      }
    });
  }
  
  // 引用计数管理
  addReference(resource) {
    if (!resource.userData.refCount) {
      resource.userData.refCount = 0;
    }
    resource.userData.refCount++;
  }
  
  removeReference(resource) {
    if (resource.userData.refCount) {
      resource.userData.refCount--;
    }
  }
}
```

### 对象池模式

```javascript
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.used = new Set();
    
    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }
  
  acquire() {
    let obj;
    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      obj = this.createFn();
    }
    
    this.used.add(obj);
    return obj;
  }
  
  release(obj) {
    if (this.used.has(obj)) {
      this.resetFn(obj);
      this.used.delete(obj);
      this.pool.push(obj);
    }
  }
  
  releaseAll() {
    this.used.forEach(obj => {
      this.resetFn(obj);
      this.pool.push(obj);
    });
    this.used.clear();
  }
}

// 使用对象池管理临时几何体
const geometryPool = new ObjectPool(
  () => new THREE.BoxGeometry(1, 1, 1),
  (geometry) => {
    // 重置几何体状态
    geometry.position.set(0, 0, 0);
    geometry.rotation.set(0, 0, 0);
    geometry.scale.set(1, 1, 1);
  }
);
```

## 渲染管线优化

### 多线程渲染

使用 Web Workers 分担计算任务：

```javascript
// 主线程
const geometryWorker = new Worker('geometry-worker.js');

geometryWorker.onmessage = (event) => {
  const { geometryData, id } = event.data;
  const geometry = createGeometryFromData(geometryData);
  scene.add(new THREE.Mesh(geometry, material));
};

function generateComplexGeometry() {
  geometryWorker.postMessage({
    type: 'generateGeometry',
    config: { segments: 64 },
    id: 'geometry-1'
  });
}

// Worker 线程 (geometry-worker.js)
self.onmessage = (event) => {
  if (event.data.type === 'generateGeometry') {
    const geometryData = generateGeometryData(event.data.config);
    self.postMessage({
      geometryData,
      id: event.data.id
    });
  }
};
```

### 渐进式加载

```javascript
class ProgressiveLoader {
  constructor() {
    this.priorityQueue = [];
    this.loading = false;
  }
  
  addToQueue(resource, priority) {
    this.priorityQueue.push({ resource, priority });
    this.priorityQueue.sort((a, b) => b.priority - a.priority);
    
    if (!this.loading) {
      this.processQueue();
    }
  }
  
  async processQueue() {
    this.loading = true;
    
    while (this.priorityQueue.length > 0) {
      const { resource } = this.priorityQueue.shift();
      
      try {
        await this.loadResource(resource);
        
        // 每加载完一个资源检查帧率
        if (this.shouldYieldToMainThread()) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      } catch (error) {
        console.error('Failed to load resource:', error);
      }
    }
    
    this.loading = false;
  }
  
  shouldYieldToMainThread() {
    // 检查帧率，如果低于阈值则让出主线程
    return this.getCurrentFPS() < 50;
  }
  
  getCurrentFPS() {
    // 计算当前帧率
    return 60; // 简化实现
  }
}
```

## 性能监控与自适应

### 实时性能监控

```javascript
class PerformanceMonitor {
  constructor() {
    this.frameTimes = [];
    this.memoryUsage = [];
    this.metrics = {
      fps: 0,
      frameTime: 0,
      memory: 0,
      drawCalls: 0
    };
    
    this.lastTime = performance.now();
    this.frameCount = 0;
  }
  
  update() {
    const currentTime = performance.now();
    const delta = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // 计算帧率
    this.frameTimes.push(delta);
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }
    
    const averageFrameTime = this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length;
    this.metrics.fps = 1000 / averageFrameTime;
    this.metrics.frameTime = averageFrameTime;
    
    // 监控内存使用
    if (performance.memory) {
      this.metrics.memory = performance.memory.usedJSHeapSize;
    }
    
    this.frameCount++;
  }
  
  shouldReduceQuality() {
    return this.metrics.fps < 50 || 
           this.metrics.frameTime > 20 ||
           (this.metrics.memory > 500 * 1024 * 1024); // 500MB
  }
  
  getQualityLevel() {
    if (this.metrics.fps > 55) return 'high';
    if (this.metrics.fps > 45) return 'medium';
    return 'low';
  }
}
```

### 自适应渲染质量

```javascript
class AdaptiveRenderer {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.performanceMonitor = new PerformanceMonitor();
    this.qualitySettings = {
      high: { pixelRatio: 2, shadows: true, antialias: true },
      medium: { pixelRatio: 1.5, shadows: true, antialias: false },
      low: { pixelRatio: 1, shadows: false, antialias: false }
    };
    
    this.currentQuality = 'high';
  }
  
  update() {
    this.performanceMonitor.update();
    const newQuality = this.performanceMonitor.getQualityLevel();
    
    if (newQuality !== this.currentQuality) {
      this.applyQualitySettings(newQuality);
      this.currentQuality = newQuality;
    }
  }
  
  applyQualitySettings(quality) {
    const settings = this.qualitySettings[quality];
    
    // 应用渲染设置
    this.renderer.setPixelRatio(settings.pixelRatio);
    this.renderer.shadowMap.enabled = settings.shadows;
    
    // 更新场景质量
    this.updateSceneQuality(quality);
  }
  
  updateSceneQuality(quality) {
    this.scene.traverse(child => {
      if (child.isMesh) {
        // 根据质量调整材质
        this.adjustMaterialForQuality(child.material, quality);
        
        // 启用/禁用细节层级
        if (child.lod) {
          child.lod.autoUpdate = quality === 'high';
        }
      }
    });
  }
  
  adjustMaterialForQuality(material, quality) {
    if (Array.isArray(material)) {
      material.forEach(mat => this.adjustSingleMaterial(mat, quality));
    } else {
      this.adjustSingleMaterial(material, quality);
    }
  }
  
  adjustSingleMaterial(material, quality) {
    switch (quality) {
      case 'high':
        if (material instanceof THREE.MeshLambertMaterial) {
          // 升级到更高质量的材质
          const newMaterial = new THREE.MeshStandardMaterial({
            color: material.color,
            map: material.map
          });
          material.dispose();
          return newMaterial;
        }
        break;
        
      case 'low':
        if (material instanceof THREE.MeshStandardMaterial) {
          // 降级到性能更好的材质
          const newMaterial = new THREE.MeshLambertMaterial({
            color: material.color,
            map: material.map
          });
          material.dispose();
          return newMaterial;
        }
        break;
    }
    
    return material;
  }
}
```

## 浏览器特定优化

### 利用现代浏览器特性

```javascript
class BrowserOptimizations {
  constructor() {
    this.checkBrowserFeatures();
  }
  
  checkBrowserFeatures() {
    this.features = {
      webGL2: this.checkWebGL2(),
      compressedTextures: this.checkCompressedTextures(),
      parallelShaderCompile: this.checkParallelShaderCompile(),
      hardwareAcceleration: this.checkHardwareAcceleration()
    };
  }
  
  applyOptimizations(renderer) {
    const gl = renderer.getContext();
    
    // 启用并行着色器编译
    if (this.features.parallelShaderCompile) {
      gl.getExtension('KHR_parallel_shader_compile');
    }
    
    // 使用高性能渲染模式
    if (this.features.hardwareAcceleration) {
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    } else {
      renderer.setPixelRatio(1);
    }
  }
  
  checkWebGL2() {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2'));
  }
  
  checkCompressedTextures() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    return !!(gl.getExtension('WEBGL_compressed_texture_astc') ||
              gl.getExtension('WEBGL_compressed_texture_s3tc'));
  }
  
  checkParallelShaderCompile() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    return !!gl.getExtension('KHR_parallel_shader_compile');
  }
  
  checkHardwareAcceleration() {
    // 检测硬件加速支持
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return renderer.indexOf('GPU') !== -1 || 
             renderer.indexOf('Graphics') !== -1;
    }
    return true; // 假设支持硬件加速
  }
}
```