# 内存管理

## 内存管理的重要性

在 Web 3D 应用中，内存管理直接关系到应用性能、稳定性和用户体验。不当的内存使用会导致页面卡顿、崩溃，特别是在移动设备和低配置硬件上。

```
内存问题演进过程
正常状态 → 内存泄漏 → 内存膨胀 → 性能下降 → 应用崩溃
    ↓          ↓          ↓          ↓          ↓
 稳定运行  对象未释放  资源积累  帧率下降  程序终止
```

## Web 3D 内存架构

### 内存组成结构

Web 3D 应用内存主要由以下几个部分组成：

```
应用内存组成
JavaScript 堆内存
├── Three.js 对象实例
├── 几何体数据 (CPU 侧)
├── 材质配置信息
└── 应用逻辑数据

GPU 内存
├── 顶点缓冲区 (VBO)
├── 纹理数据
├── 帧缓冲区 (FBO)
├── 着色器程序
└── 索引缓冲区 (IBO)

系统内存
├── 图像解码缓存
├── 音频缓冲区
└── 其他资源缓存
```

### 内存生命周期

```javascript
class MemoryLifecycle {
  constructor() {
    this.memoryStates = new Map();
  }
  
  trackObject(object) {
    const lifecycle = {
      created: performance.now(),
      references: 1,
      size: this.calculateObjectSize(object),
      type: object.constructor.name
    };
    
    this.memoryStates.set(object, lifecycle);
    return lifecycle;
  }
  
  addReference(object) {
    const lifecycle = this.memoryStates.get(object);
    if (lifecycle) {
      lifecycle.references++;
    }
  }
  
  removeReference(object) {
    const lifecycle = this.memoryStates.get(object);
    if (lifecycle) {
      lifecycle.references--;
      
      if (lifecycle.references === 0) {
        this.scheduleForCleanup(object);
      }
    }
  }
  
  scheduleForCleanup(object) {
    // 延迟清理，避免频繁的垃圾回收
    setTimeout(() => {
      if (this.memoryStates.get(object)?.references === 0) {
        this.disposeObject(object);
      }
    }, 1000);
  }
  
  disposeObject(object) {
    if (object.dispose && typeof object.dispose === 'function') {
      object.dispose();
    }
    this.memoryStates.delete(object);
  }
}
```

## 几何体内存管理

### 几何体内存结构

Three.js 几何体在内存中的典型结构：

```
BufferGeometry 内存布局
├── attributes (属性缓冲区)
│   ├── position: Float32Array (顶点位置)
│   ├── normal: Float32Array (法线向量)
│   ├── uv: Float32Array (纹理坐标)
│   └── color: Float32Array (顶点颜色)
├── index: Uint16Array/Uint32Array (顶点索引)
└── 元数据 (边界框、边界球等)
```

### 几何体优化策略

```javascript
class GeometryManager {
  constructor() {
    this.geometries = new Map();
    this.referenceCounts = new Map();
  }
  
  createOptimizedGeometry(originalGeometry) {
    // 移除重复顶点
    const mergedGeometry = this.mergeVertices(originalGeometry);
    
    // 量化顶点数据
    const quantizedGeometry = this.quantizeGeometry(mergedGeometry);
    
    // 压缩索引数据
    const compressedGeometry = this.compressIndices(quantizedGeometry);
    
    return compressedGeometry;
  }
  
  mergeVertices(geometry) {
    // 使用 Three.js 的合并顶点工具
    const mergedGeometry = geometry.clone();
    mergedGeometry.mergeVertices();
    return mergedGeometry;
  }
  
  quantizeGeometry(geometry, precision = 1000) {
    // 量化顶点数据以减少内存占用
    const positionAttribute = geometry.getAttribute('position');
    const array = positionAttribute.array;
    
    for (let i = 0; i < array.length; i++) {
      // 将浮点数转换为定点数
      array[i] = Math.round(array[i] * precision) / precision;
    }
    
    positionAttribute.needsUpdate = true;
    return geometry;
  }
  
  compressIndices(geometry) {
    const indexAttribute = geometry.getIndex();
    if (!indexAttribute) return geometry;
    
    const array = indexAttribute.array;
    
    // 检查是否可以使用更小的数据类型
    const maxIndex = Math.max(...array);
    if (maxIndex < 65535) {
      // 使用 Uint16Array 代替 Uint32Array
      const newArray = new Uint16Array(array);
      geometry.setIndex(new THREE.BufferAttribute(newArray, 1));
    }
    
    return geometry;
  }
  
  // 几何体实例化
  createInstancedGeometry(baseGeometry, instanceCount) {
    const instancedGeometry = new THREE.InstancedBufferGeometry();
    
    // 复制基础几何体的属性
    instancedGeometry.copy(baseGeometry);
    
    // 添加实例化属性
    const instanceMatrix = new THREE.InstancedBufferAttribute(
      new Float32Array(instanceCount * 16), 16
    );
    instancedGeometry.setAttribute('instanceMatrix', instanceMatrix);
    
    return instancedGeometry;
  }
}
```

### 几何体内存池

```javascript
class GeometryPool {
  constructor() {
    this.pools = new Map();
    this.usedGeometries = new Set();
  }
  
  getGeometry(type, parameters) {
    const key = this.getGeometryKey(type, parameters);
    
    if (!this.pools.has(key)) {
      this.pools.set(key, []);
    }
    
    const pool = this.pools.get(key);
    let geometry;
    
    if (pool.length > 0) {
      geometry = pool.pop();
    } else {
      geometry = this.createGeometry(type, parameters);
    }
    
    this.usedGeometries.add(geometry);
    return geometry;
  }
  
  returnGeometry(geometry) {
    if (this.usedGeometries.has(geometry)) {
      this.usedGeometries.delete(geometry);
      
      // 重置几何体状态
      this.resetGeometry(geometry);
      
      const key = this.getGeometryKeyFromInstance(geometry);
      if (this.pools.has(key)) {
        this.pools.get(key).push(geometry);
      }
    }
  }
  
  createGeometry(type, parameters) {
    switch (type) {
      case 'box':
        return new THREE.BoxGeometry(...parameters);
      case 'sphere':
        return new THREE.SphereGeometry(...parameters);
      case 'plane':
        return new THREE.PlaneGeometry(...parameters);
      default:
        throw new Error(`Unknown geometry type: ${type}`);
    }
  }
  
  getGeometryKey(type, parameters) {
    return `${type}_${parameters.join('_')}`;
  }
  
  getGeometryKeyFromInstance(geometry) {
    // 根据几何体特征生成键值
    if (geometry instanceof THREE.BoxGeometry) {
      const params = geometry.parameters;
      return `box_${params.width}_${params.height}_${params.depth}`;
    }
    // 其他几何体类型的处理...
  }
  
  resetGeometry(geometry) {
    // 重置几何体的变换和自定义属性
    geometry.position.set(0, 0, 0);
    geometry.rotation.set(0, 0, 0);
    geometry.scale.set(1, 1, 1);
    
    // 清除自定义属性
    geometry.userData = {};
  }
  
  cleanup() {
    // 清理长时间未使用的几何体
    const now = performance.now();
    const maxAge = 60000; // 1分钟
    
    for (const [key, pool] of this.pools) {
      for (let i = pool.length - 1; i >= 0; i--) {
        const geometry = pool[i];
        if (now - geometry.userData.lastUsed > maxAge) {
          geometry.dispose();
          pool.splice(i, 1);
        }
      }
    }
  }
}
```

## 纹理内存管理

### 纹理内存优化

纹理通常是 Web 3D 应用中最大的内存消耗者：

```javascript
class TextureManager {
  constructor() {
    this.textures = new Map();
    this.textureCache = new Map();
    this.memoryBudget = 256 * 1024 * 1024; // 256MB 纹理内存预算
    this.currentMemoryUsage = 0;
  }
  
  async loadTexture(url, options = {}) {
    const cacheKey = this.getTextureCacheKey(url, options);
    
    // 检查缓存
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey);
    }
    
    // 检查内存预算
    if (!this.checkMemoryBudget(options.estimatedSize)) {
      await this.freeMemory(options.estimatedSize);
    }
    
    const texture = await this.loadTextureInternal(url, options);
    
    // 计算实际内存使用量
    const memoryUsage = this.calculateTextureMemory(texture);
    this.currentMemoryUsage += memoryUsage;
    
    texture.userData.memoryUsage = memoryUsage;
    texture.userData.lastUsed = performance.now();
    
    this.textureCache.set(cacheKey, texture);
    return texture;
  }
  
  calculateTextureMemory(texture) {
    const { width, height } = texture.image || texture;
    let bytesPerPixel = 4; // 默认 RGBA
    
    if (texture.format === THREE.RGBFormat) bytesPerPixel = 3;
    if (texture.format === THREE.RGBAFormat) bytesPerPixel = 4;
    if (texture.format === THREE.LuminanceFormat) bytesPerPixel = 1;
    
    return width * height * bytesPerPixel;
  }
  
  checkMemoryBudget(requiredSize) {
    return this.currentMemoryUsage + requiredSize <= this.memoryBudget;
  }
  
  async freeMemory(requiredSize) {
    const textures = Array.from(this.textureCache.values())
      .sort((a, b) => a.userData.lastUsed - b.userData.lastUsed);
    
    let freedMemory = 0;
    
    for (const texture of textures) {
      if (freedMemory >= requiredSize) break;
      
      // 释放最久未使用的纹理
      this.currentMemoryUsage -= texture.userData.memoryUsage;
      freedMemory += texture.userData.memoryUsage;
      
      texture.dispose();
      
      // 从缓存中移除
      for (const [key, cachedTexture] of this.textureCache) {
        if (cachedTexture === texture) {
          this.textureCache.delete(key);
          break;
        }
      }
    }
  }
  
  getTextureCacheKey(url, options) {
    return `${url}_${JSON.stringify(options)}`;
  }
  
  async loadTextureInternal(url, options) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      
      loader.load(
        url,
        (texture) => {
          // 应用优化设置
          this.optimizeTexture(texture, options);
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }
  
  optimizeTexture(texture, options) {
    // 启用 MIP 映射
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    
    // 设置适当的包装模式
    texture.wrapS = options.wrapS || THREE.ClampToEdgeWrapping;
    texture.wrapT = options.wrapT || THREE.ClampToEdgeWrapping;
    
    // 压缩纹理如果支持
    if (options.compressed && this.supportsTextureCompression()) {
      this.compressTexture(texture);
    }
    
    // 限制最大尺寸
    if (options.maxSize) {
      this.limitTextureSize(texture, options.maxSize);
    }
  }
  
  supportsTextureCompression() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    return !!(gl.getExtension('WEBGL_compressed_texture_astc') ||
              gl.getExtension('WEBGL_compressed_texture_s3tc'));
  }
}
```

### 纹理压缩与格式选择

```
纹理格式内存对比
格式             质量     内存占用   兼容性
RGBA (未压缩)   最高      100%      所有设备
RGB            高        75%       所有设备
ASTC 4x4       高        25%       现代设备
S3TC/DXT5      中        25%       PC/部分移动设备
PVRTC 4bpp     中        25%       iOS 设备
```

```javascript
class TextureCompressor {
  constructor() {
    this.supportedFormats = this.detectSupportedFormats();
  }
  
  detectSupportedFormats() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const formats = [];
    
    if (gl.getExtension('WEBGL_compressed_texture_astc')) {
      formats.push('astc');
    }
    if (gl.getExtension('WEBGL_compressed_texture_s3tc')) {
      formats.push('s3tc');
    }
    if (gl.getExtension('WEBGL_compressed_texture_etc')) {
      formats.push('etc');
    }
    if (gl.getExtension('WEBGL_compressed_texture_pvrtc')) {
      formats.push('pvrtc');
    }
    
    return formats;
  }
  
  getOptimalFormat(quality = 'medium') {
    const formatPreferences = {
      high: ['astc', 's3tc', 'etc', 'pvrtc', 'rgba'],
      medium: ['s3tc', 'etc', 'pvrtc', 'astc', 'rgb'],
      low: ['pvrtc', 'etc', 's3tc', 'astc', 'rgb']
    };
    
    const preferences = formatPreferences[quality];
    return preferences.find(format => this.supportedFormats.includes(format)) || 'rgba';
  }
  
  async compressTexture(texture, format) {
    if (format === 'rgba') return texture; // 无需压缩
    
    // 在实际项目中，这里会调用压缩服务或使用预压缩的纹理
    // 返回压缩后的纹理对象
    return texture;
  }
}
```

## 材质内存管理

### 材质共享与重用

```javascript
class MaterialManager {
  constructor() {
    this.materialTemplates = new Map();
    this.materialInstances = new Map();
    this.materialVariants = new Map();
  }
  
  createMaterialTemplate(type, baseParameters) {
    const template = {
      type,
      baseParameters,
      instances: new Set(),
      variantCache: new Map()
    };
    
    this.materialTemplates.set(type, template);
    return template;
  }
  
  getMaterial(type, variantParameters = {}) {
    const template = this.materialTemplates.get(type);
    if (!template) {
      throw new Error(`Material template not found: ${type}`);
    }
    
    // 检查变体缓存
    const variantKey = this.getVariantKey(variantParameters);
    if (template.variantCache.has(variantKey)) {
      return template.variantCache.get(variantKey);
    }
    
    // 创建新变体
    const parameters = { ...template.baseParameters, ...variantParameters };
    const material = this.createMaterialInstance(template.type, parameters);
    
    template.variantCache.set(variantKey, material);
    template.instances.add(material);
    
    this.materialInstances.set(material, {
      template,
      variantKey,
      referenceCount: 0
    });
    
    return material;
  }
  
  createMaterialInstance(type, parameters) {
    switch (type) {
      case 'standard':
        return new THREE.MeshStandardMaterial(parameters);
      case 'physical':
        return new THREE.MeshPhysicalMaterial(parameters);
      case 'basic':
        return new THREE.MeshBasicMaterial(parameters);
      default:
        throw new Error(`Unknown material type: ${type}`);
    }
  }
  
  getVariantKey(parameters) {
    return JSON.stringify(parameters);
  }
  
  addReference(material) {
    const info = this.materialInstances.get(material);
    if (info) {
      info.referenceCount++;
    }
  }
  
  removeReference(material) {
    const info = this.materialInstances.get(material);
    if (info) {
      info.referenceCount--;
      
      if (info.referenceCount === 0) {
        this.scheduleMaterialCleanup(material);
      }
    }
  }
  
  scheduleMaterialCleanup(material) {
    // 延迟清理，避免频繁创建销毁
    setTimeout(() => {
      const info = this.materialInstances.get(material);
      if (info && info.referenceCount === 0) {
        this.disposeMaterial(material);
      }
    }, 5000); // 5秒后清理
  }
  
  disposeMaterial(material) {
    const info = this.materialInstances.get(material);
    if (info) {
      // 从模板中移除
      info.template.instances.delete(material);
      info.template.variantCache.delete(info.variantKey);
      
      // 销毁材质
      material.dispose();
      this.materialInstances.delete(material);
    }
  }
  
  // 批量材质更新
  updateMaterialParameters(type, parameterUpdates) {
    const template = this.materialTemplates.get(type);
    if (!template) return;
    
    // 更新所有实例
    template.instances.forEach(material => {
      Object.assign(material, parameterUpdates);
      material.needsUpdate = true;
    });
  }
}
```

## 场景图内存管理

### 对象生命周期管理

```javascript
class SceneGraphManager {
  constructor(scene) {
    this.scene = scene;
    this.objectRegistry = new Map();
    this.dependencyGraph = new Map();
  }
  
  addObject(object, parent = this.scene) {
    parent.add(object);
    
    // 注册对象及其依赖
    this.registerObject(object);
    
    // 建立依赖关系
    this.buildDependencyGraph(object);
    
    return object;
  }
  
  registerObject(object) {
    const objectInfo = {
      object,
      references: 1,
      dependencies: new Set(),
      dependents: new Set(),
      memoryUsage: this.calculateObjectMemory(object)
    };
    
    this.objectRegistry.set(object, objectInfo);
    
    // 递归注册子对象
    object.traverse(child => {
      if (child !== object) {
        this.registerObject(child);
      }
    });
  }
  
  calculateObjectMemory(object) {
    let memory = 0;
    
    if (object.geometry) {
      memory += this.calculateGeometryMemory(object.geometry);
    }
    
    if (object.material) {
      memory += this.calculateMaterialMemory(object.material);
    }
    
    // 其他内存计算...
    return memory;
  }
  
  calculateGeometryMemory(geometry) {
    let memory = 0;
    
    // 计算属性缓冲区内存
    for (const name in geometry.attributes) {
      const attribute = geometry.attributes[name];
      memory += attribute.array.byteLength;
    }
    
    // 计算索引缓冲区内存
    if (geometry.index) {
      memory += geometry.index.array.byteLength;
    }
    
    return memory;
  }
  
  calculateMaterialMemory(material) {
    // 材质本身内存较小，主要计算纹理内存
    let memory = 0;
    
    const textures = [
      material.map,
      material.normalMap,
      material.roughnessMap,
      material.metalnessMap,
      material.envMap
    ];
    
    textures.forEach(texture => {
      if (texture && texture.userData?.memoryUsage) {
        memory += texture.userData.memoryUsage;
      }
    });
    
    return memory;
  }
  
  buildDependencyGraph(object) {
    const dependencies = new Set();
    
    // 收集几何体和材质依赖
    if (object.geometry) {
      dependencies.add(object.geometry);
    }
    
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(mat => dependencies.add(mat));
      } else {
        dependencies.add(object.material);
      }
    }
    
    // 收集纹理依赖
    this.collectTextureDependencies(object, dependencies);
    
    this.dependencyGraph.set(object, dependencies);
    
    // 更新依赖对象的被依赖关系
    dependencies.forEach(dep => {
      const depInfo = this.objectRegistry.get(dep);
      if (depInfo) {
        depInfo.dependents.add(object);
      }
    });
  }
  
  collectTextureDependencies(object, dependencies) {
    const material = object.material;
    if (!material) return;
    
    const materials = Array.isArray(material) ? material : [material];
    
    materials.forEach(mat => {
      const textureProperties = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'envMap'];
      
      textureProperties.forEach(prop => {
        if (mat[prop]) {
          dependencies.add(mat[prop]);
        }
      });
    });
  }
  
  removeObject(object) {
    const objectInfo = this.objectRegistry.get(object);
    if (!objectInfo) return;
    
    objectInfo.references--;
    
    if (objectInfo.references === 0) {
      this.disposeObjectTree(object);
    }
  }
  
  disposeObjectTree(object) {
    const objectInfo = this.objectRegistry.get(object);
    if (!objectInfo) return;
    
    // 从父级移除
    if (object.parent) {
      object.parent.remove(object);
    }
    
    // 处理依赖关系
    const dependencies = this.dependencyGraph.get(object) || new Set();
    
    dependencies.forEach(dep => {
      const depInfo = this.objectRegistry.get(dep);
      if (depInfo) {
        depInfo.dependents.delete(object);
        
        // 如果没有其他依赖者，安排清理
        if (depInfo.dependents.size === 0) {
          this.scheduleResourceCleanup(dep);
        }
      }
    });
    
    // 递归处理子对象
    object.traverse(child => {
      if (child !== object) {
        this.removeObject(child);
      }
    });
    
    // 清理对象本身
    this.objectRegistry.delete(object);
    this.dependencyGraph.delete(object);
  }
  
  scheduleResourceCleanup(resource) {
    // 延迟清理资源
    setTimeout(() => {
      const info = this.objectRegistry.get(resource);
      if (info && info.dependents.size === 0) {
        this.disposeResource(resource);
      }
    }, 3000);
  }
  
  disposeResource(resource) {
    if (resource.dispose && typeof resource.dispose === 'function') {
      resource.dispose();
    }
    this.objectRegistry.delete(resource);
    this.dependencyGraph.delete(resource);
  }
}
```

## 内存监控与分析

### 实时内存监控

```javascript
class MemoryMonitor {
  constructor() {
    this.metrics = {
      totalJSHeap: 0,
      usedJSHeap: 0,
      jsHeapLimit: 0,
      gpuMemory: 0,
      objectCount: 0,
      geometryMemory: 0,
      textureMemory: 0
    };
    
    this.history = [];
    this.maxHistorySize = 300; // 保存300个采样点
    
    this.startMonitoring();
  }
  
  startMonitoring() {
    // 定期采样内存状态
    setInterval(() => {
      this.sampleMemory();
    }, 1000);
  }
  
  sampleMemory() {
    // 获取 JavaScript 堆内存
    if (performance.memory) {
      this.metrics.totalJSHeap = performance.memory.totalJSHeapSize;
      this.metrics.usedJSHeap = performance.memory.usedJSHeapSize;
      this.metrics.jsHeapLimit = performance.memory.jsHeapLimit;
    }
    
    // 估算 GPU 内存
    this.metrics.gpuMemory = this.estimateGPUMemory();
    
    // 记录历史
    this.history.push({
      timestamp: performance.now(),
      ...this.metrics
    });
    
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
    
    // 检查内存泄漏
    this.checkMemoryLeaks();
  }
  
  estimateGPUMemory() {
    let memory = 0;
    
    // 遍历场景估算 GPU 内存
    this.scene.traverse(object => {
      if (object.geometry) {
        memory += this.calculateGeometryGPUMemory(object.geometry);
      }
      
      if (object.material) {
        memory += this.calculateMaterialGPUMemory(object.material);
      }
    });
    
    return memory;
  }
  
  calculateGeometryGPUMemory(geometry) {
    let memory = 0;
    
    for (const name in geometry.attributes) {
      const attribute = geometry.attributes[name];
      memory += attribute.array.byteLength;
    }
    
    if (geometry.index) {
      memory += geometry.index.array.byteLength;
    }
    
    return memory;
  }
  
  calculateMaterialGPUMemory(material) {
    let memory = 0;
    
    const materials = Array.isArray(material) ? material : [material];
    
    materials.forEach(mat => {
      const textures = [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap, mat.envMap];
      
      textures.forEach(texture => {
        if (texture && texture.image) {
          const width = texture.image.width || texture.image.videoWidth;
          const height = texture.image.height || texture.image.videoHeight;
          
          let bytesPerPixel = 4; // RGBA
          if (texture.format === THREE.RGBFormat) bytesPerPixel = 3;
          if (texture.format === THREE.LuminanceFormat) bytesPerPixel = 1;
          
          memory += width * height * bytesPerPixel;
          
          // MIP maps 占用额外 1/3 内存
          if (texture.generateMipmaps) {
            memory += (width * height * bytesPerPixel) / 3;
          }
        }
      });
    });
    
    return memory;
  }
  
  checkMemoryLeaks() {
    if (this.history.length < 10) return;
    
    const recent = this.history.slice(-10);
    const oldest = this.history.slice(0, 10);
    
    const recentAvg = this.calculateAverage(recent);
    const oldestAvg = this.calculateAverage(oldest);
    
    // 如果内存使用持续增长，可能存在内存泄漏
    const growthRate = (recentAvg.usedJSHeap - oldestAvg.usedJSHeap) / oldestAvg.usedJSHeap;
    
    if (growthRate > 0.1) { // 增长超过10%
      this.triggerMemoryWarning('Possible memory leak detected');
    }
  }
  
  calculateAverage(samples) {
    const sum = samples.reduce((acc, sample) => ({
      usedJSHeap: acc.usedJSHeap + sample.usedJSHeap,
      gpuMemory: acc.gpuMemory + sample.gpuMemory
    }), { usedJSHeap: 0, gpuMemory: 0 });
    
    return {
      usedJSHeap: sum.usedJSHeap / samples.length,
      gpuMemory: sum.gpuMemory / samples.length
    };
  }
  
  triggerMemoryWarning(message) {
    console.warn(`Memory Warning: ${message}`);
    
    // 触发内存清理
    if (typeof this.onMemoryWarning === 'function') {
      this.onMemoryWarning(this.metrics);
    }
  }
  
  getMemoryReport() {
    const current = this.metrics;
    const peak = this.findPeakMemory();
    
    return {
      current,
      peak,
      trends: this.analyzeMemoryTrends(),
      recommendations: this.generateRecommendations()
    };
  }
  
  findPeakMemory() {
    return this.history.reduce((peak, sample) => ({
      usedJSHeap: Math.max(peak.usedJSHeap, sample.usedJSHeap),
      gpuMemory: Math.max(peak.gpuMemory, sample.gpuMemory)
    }), { usedJSHeap: 0, gpuMemory: 0 });
  }
  
  analyzeMemoryTrends() {
    if (this.history.length < 2) return {};
    
    const recent = this.history.slice(-5);
    const trend = {
      jsHeap: this.calculateTrend(recent.map(h => h.usedJSHeap)),
      gpuMemory: this.calculateTrend(recent.map(h => h.gpuMemory))
    };
    
    return trend;
  }
  
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = (last - first) / first;
    
    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }
  
  generateRecommendations() {
    const recommendations = [];
    
    if (this.metrics.usedJSHeap > this.metrics.jsHeapLimit * 0.8) {
      recommendations.push('JavaScript heap near limit. Consider reducing object count.');
    }
    
    if (this.metrics.textureMemory > 200 * 1024 * 1024) {
      recommendations.push('High texture memory usage. Consider using texture compression.');
    }
    
    if (this.metrics.geometryMemory > 100 * 1024 * 1024) {
      recommendations.push('High geometry memory usage. Consider using LOD or geometry compression.');
    }
    
    return recommendations;
  }
}
```

## 自动化内存管理

### 智能垃圾回收

```javascript
class SmartGarbageCollector {
  constructor(scene, memoryMonitor) {
    this.scene = scene;
    this.memoryMonitor = memoryMonitor;
    this.cleanupThresholds = {
      jsHeap: 0.8,    // 80% of heap limit
      gpuMemory: 300 * 1024 * 1024, // 300MB
      inactivityTime: 30000 // 30 seconds
    };
    
    this.inactiveObjects = new Map();
    this.startCleanupCycle();
  }
  
  startCleanupCycle() {
    setInterval(() => {
      this.performCleanup();
    }, 10000); // 每10秒检查一次
  }
  
  performCleanup() {
    const memoryState = this.memoryMonitor.getMemoryReport();
    
    // 检查是否需要紧急清理
    if (this.needsEmergencyCleanup(memoryState)) {
      this.emergencyCleanup();
      return;
    }
    
    // 常规清理
    if (this.shouldPerformCleanup(memoryState)) {
      this.standardCleanup();
    }
    
    // 清理长时间未使用的对象
    this.cleanupInactiveObjects();
  }
  
  needsEmergencyCleanup(memoryState) {
    return memoryState.current.usedJSHeap > this.cleanupThresholds.jsHeap * memoryState.current.jsHeapLimit;
  }
  
  shouldPerformCleanup(memoryState) {
    return memoryState.current.usedJSHeap > this.cleanupThresholds.jsHeap * 0.7 * memoryState.current.jsHeapLimit ||
           memoryState.current.gpuMemory > this.cleanupThresholds.gpuMemory * 0.8;
  }
  
  emergencyCleanup() {
    console.warn('Performing emergency memory cleanup');
    
    // 1. 释放所有缓存
    this.clearAllCaches();
    
    // 2. 移除不可见对象
    this.removeInvisibleObjects();
    
    // 3. 降低渲染质量
    this.reduceRenderQuality();
    
    // 4. 强制垃圾回收 (如果环境支持)
    this.forceGarbageCollection();
  }
  
  standardCleanup() {
    console.log('Performing standard memory cleanup');
    
    // 1. 清理长时间未使用的纹理
    this.cleanupUnusedTextures();
    
    // 2. 合并小几何体
    this.mergeSmallGeometries();
    
    // 3. 释放未引用的材质
    this.cleanupUnusedMaterials();
  }
  
  cleanupInactiveObjects() {
    const now = performance.now();
    
    for (const [object, lastUsed] of this.inactiveObjects) {
      if (now - lastUsed > this.cleanupThresholds.inactivityTime) {
        this.disposeObject(object);
        this.inactiveObjects.delete(object);
      }
    }
  }
  
  markObjectInactive(object) {
    this.inactiveObjects.set(object, performance.now());
  }
  
  markObjectActive(object) {
    this.inactiveObjects.delete(object);
  }
  
  clearAllCaches() {
    // 清理所有缓存系统
    if (THREE.Cache) {
      THREE.Cache.clear();
    }
    
    // 清理自定义缓存
    this.textureManager?.textureCache.clear();
    this.geometryPool?.cleanup();
  }
  
  removeInvisibleObjects() {
    const objectsToRemove = [];
    
    this.scene.traverse(object => {
      if (!object.visible && object.userData?.disposable) {
        objectsToRemove.push(object);
      }
    });
    
    objectsToRemove.forEach(object => {
      this.scene.remove(object);
      this.disposeObject(object);
    });
  }
  
  reduceRenderQuality() {
    // 降低渲染质量以节省内存
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = false;
    
    // 降低纹理质量
    this.scene.traverse(object => {
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        
        materials.forEach(material => {
          if (material.map) {
            material.map.anisotropy = 1;
          }
        });
      }
    });
  }
  
  forceGarbageCollection() {
    // 在某些环境中可以触发垃圾回收
    if (window.gc) {
      window.gc();
    }
  }
  
  cleanupUnusedTextures() {
    const now = performance.now();
    const maxAge = 60000; // 1分钟
    
    this.textureManager?.textureCache.forEach((texture, key) => {
      if (now - texture.userData.lastUsed > maxAge) {
        this.textureManager.freeTexture(texture);
      }
    });
  }
  
  mergeSmallGeometries() {
    // 合并小的静态几何体以减少绘制调用和内存占用
    const smallGeometries = [];
    
    this.scene.traverse(object => {
      if (object.isMesh && 
          object.geometry && 
          object.geometry.attributes.position.count < 100 &&
          object.static) {
        smallGeometries.push(object);
      }
    });
    
    if (smallGeometries.length > 10) {
      this.mergeGeometryGroup(smallGeometries);
    }
  }
  
  disposeObject(object) {
    if (object.geometry) {
      object.geometry.dispose();
    }
    
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => material.dispose());
    }
    
    if (object.dispose && typeof object.dispose === 'function') {
      object.dispose();
    }
  }
}
```