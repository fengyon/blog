# 加载优化

## 加载性能的重要性

在 Web 3D 应用中，加载性能直接影响用户体验和转化率。研究表明，页面加载时间每增加1秒，转化率下降 7%。对于 3D 应用，优化的加载流程能够显著提升用户留存率和满意度。

```
加载体验对比
优化前体验             优化后体验
├── 长时间白屏          ├── 即时内容展示
├── 进度不明确          ├── 清晰加载进度
├── 资源阻塞交互        ├── 渐进式交互启用
└── 用户流失率高        └── 用户参与度高
```

## 资源分析与优化

### 资源类型分析

Web 3D 应用主要包含以下资源类型：

```
资源类型与特点
几何体资源
├── 顶点数据 (位置、法线、UV等)
├── 索引数据
└── 蒙皮与动画数据

纹理资源
├── 颜色贴图
├── 法线贴图
├── 粗糙度贴图
└── 环境贴图

其他资源
├── 着色器代码
├── 配置文件
└── 音频文件
```

### 资源体积优化

```javascript
class ResourceOptimizer {
  constructor() {
    this.optimizationStrategies = new Map();
    this.setupStrategies();
  }
  
  setupStrategies() {
    // 几何体优化策略
    this.optimizationStrategies.set('geometry', {
      maxVertices: 50000,
      quantization: true,
      compression: true
    });
    
    // 纹理优化策略
    this.optimizationStrategies.set('texture', {
      maxSize: 2048,
      format: 'webp',
      quality: 0.8
    });
  }
  
  async optimizeGeometry(geometry, options = {}) {
    const strategy = this.optimizationStrategies.get('geometry');
    
    // 顶点数量检查
    if (geometry.attributes.position.count > strategy.maxVertices) {
      geometry = await this.decimateGeometry(geometry, strategy.maxVertices);
    }
    
    // 数据量化
    if (strategy.quantization) {
      geometry = this.quantizeGeometry(geometry);
    }
    
    // 压缩
    if (strategy.compression) {
      geometry = await this.compressGeometry(geometry);
    }
    
    return geometry;
  }
  
  async optimizeTexture(texture, options = {}) {
    const strategy = this.optimizationStrategies.get('texture');
    
    // 尺寸调整
    if (texture.image.width > strategy.maxSize || 
        texture.image.height > strategy.maxSize) {
      texture = await this.resizeTexture(texture, strategy.maxSize);
    }
    
    // 格式转换
    if (strategy.format !== 'original') {
      texture = await this.convertTextureFormat(texture, strategy.format);
    }
    
    return texture;
  }
  
  async decimateGeometry(geometry, targetVertices) {
    // 使用简化算法减少顶点数量
    const simplifiedGeometry = geometry.clone();
    const ratio = targetVertices / geometry.attributes.position.count;
    
    // 应用简化算法 (实际项目中可使用专业简化库)
    return this.applySimplification(simplifiedGeometry, ratio);
  }
  
  quantizeGeometry(geometry) {
    // 量化顶点数据以减少精度
    const positionAttribute = geometry.attributes.position;
    const array = positionAttribute.array;
    
    for (let i = 0; i < array.length; i++) {
      // 将浮点数量化为16位精度
      array[i] = Math.round(array[i] * 1000) / 1000;
    }
    
    positionAttribute.needsUpdate = true;
    return geometry;
  }
  
  async resizeTexture(texture, maxSize) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const scale = Math.min(
        maxSize / texture.image.width,
        maxSize / texture.image.height
      );
      
      canvas.width = texture.image.width * scale;
      canvas.height = texture.image.height * scale;
      
      ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
      
      const resizedTexture = new THREE.Texture(canvas);
      resizedTexture.needsUpdate = true;
      resolve(resizedTexture);
    });
  }
}
```

## 网络层优化

### 资源压缩与 CDN

```
资源传输优化流程
原始资源 → 压缩处理 → CDN分发 → 浏览器缓存
    ↓           ↓           ↓           ↓
 未优化       Gzip压缩    边缘节点    本地存储
 大小        体积-70%    低延迟     快速加载
```

```javascript
class NetworkOptimizer {
  constructor() {
    this.cdnBaseUrl = 'https://cdn.example.com';
    this.compressionFormats = this.detectSupportedFormats();
  }
  
  detectSupportedFormats() {
    const formats = ['br', 'gzip']; // 支持的压缩格式
    
    // 检测浏览器支持的压缩格式
    if (typeof CompressionStream !== 'undefined') {
      formats.push('br', 'gzip');
    }
    
    return formats;
  }
  
  async loadResource(url, options = {}) {
    const optimizedUrl = this.optimizeUrl(url, options);
    
    // 添加缓存破坏参数
    const cacheBustUrl = this.addCacheBuster(optimizedUrl);
    
    // 设置适当的请求头
    const headers = this.getOptimizedHeaders(options);
    
    try {
      const response = await fetch(cacheBustUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await this.processResponse(response, options);
    } catch (error) {
      return this.handleLoadError(error, url, options);
    }
  }
  
  optimizeUrl(url, options) {
    let optimizedUrl = url;
    
    // 使用CDN路径
    if (options.useCDN && !url.startsWith('http')) {
      optimizedUrl = `${this.cdnBaseUrl}${url}`;
    }
    
    // 添加格式参数
    if (options.format) {
      const separator = optimizedUrl.includes('?') ? '&' : '?';
      optimizedUrl += `${separator}format=${options.format}`;
    }
    
    return optimizedUrl;
  }
  
  getOptimizedHeaders(options) {
    const headers = new Headers();
    
    // 接受压缩格式
    if (this.compressionFormats.length > 0) {
      headers.set('Accept-Encoding', this.compressionFormats.join(', '));
    }
    
    // 添加缓存控制
    if (options.cacheStrategy === 'aggressive') {
      headers.set('Cache-Control', 'max-age=31536000'); // 1年
    }
    
    return headers;
  }
  
  addCacheBuster(url) {
    // 对开发环境添加缓存破坏参数
    if (process.env.NODE_ENV === 'development') {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}_=${Date.now()}`;
    }
    
    return url;
  }
  
  async processResponse(response, options) {
    let data = await response.arrayBuffer();
    
    // 处理压缩内容
    const contentEncoding = response.headers.get('Content-Encoding');
    if (contentEncoding && typeof DecompressionStream !== 'undefined') {
      data = await this.decompressData(data, contentEncoding);
    }
    
    return data;
  }
  
  async decompressData(compressedData, encoding) {
    const ds = new DecompressionStream(encoding);
    const decompressedStream = new Response(compressedData).body.pipeThrough(ds);
    return new Response(decompressedStream).arrayBuffer();
  }
}
```

### 预连接与 DNS 预解析

```javascript
class ConnectionOptimizer {
  constructor() {
    this.preconnectedOrigins = new Set();
  }
  
  preconnectToOrigins(origins) {
    origins.forEach(origin => {
      if (!this.preconnectedOrigins.has(origin)) {
        this.createPreconnectLink(origin);
        this.preconnectedOrigins.add(origin);
      }
    });
  }
  
  createPreconnectLink(origin) {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
  
  prefetchResources(resourceUrls) {
    resourceUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = this.getResourceType(url);
      document.head.appendChild(link);
    });
  }
  
  getResourceType(url) {
    if (url.includes('.gltf') || url.includes('.glb')) return 'model';
    if (url.includes('.jpg') || url.includes('.png')) return 'image';
    if (url.includes('.json')) return 'json';
    return 'other';
  }
  
  // 关键资源预加载
  preloadCriticalResources() {
    const criticalResources = [
      '/models/main-scene.glb',
      '/textures/environment.hdr',
      '/textures/brdfLUT.png'
    ];
    
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = this.getResourceType(resource);
      
      if (resource.includes('.glb')) {
        link.setAttribute('fetchpriority', 'high');
      }
      
      document.head.appendChild(link);
    });
  }
}
```

## 加载策略与流程

### 渐进式加载

```javascript
class ProgressiveLoader {
  constructor() {
    this.phases = [
      'initial',
      'geometry',
      'textures',
      'animations',
      'details'
    ];
    
    this.currentPhase = 0;
    this.loadingQueue = new Map();
  }
  
  async loadScene(sceneConfig) {
    // 阶段1: 初始加载 - 基础几何体
    await this.loadPhase('initial', sceneConfig.essential);
    
    // 阶段2: 主要几何体
    await this.loadPhase('geometry', sceneConfig.geometry);
    
    // 阶段3: 纹理
    await this.loadPhase('textures', sceneConfig.textures);
    
    // 阶段4: 动画
    await this.loadPhase('animations', sceneConfig.animations);
    
    // 阶段5: 细节优化
    await this.loadPhase('details', sceneConfig.details);
  }
  
  async loadPhase(phaseName, resources) {
    this.setPhase(phaseName);
    
    const promises = resources.map(resource => 
      this.loadWithPriority(resource, this.getPhasePriority(phaseName))
    );
    
    await Promise.all(promises);
    this.completePhase(phaseName);
  }
  
  setPhase(phaseName) {
    this.currentPhase = this.phases.indexOf(phaseName);
    this.dispatchEvent(new CustomEvent('phaseStart', { detail: { phase: phaseName } }));
  }
  
  completePhase(phaseName) {
    this.dispatchEvent(new CustomEvent('phaseComplete', { detail: { phase: phaseName } }));
  }
  
  getPhasePriority(phaseName) {
    const priorities = {
      'initial': 'high',
      'geometry': 'medium',
      'textures': 'medium',
      'animations': 'low',
      'details': 'low'
    };
    
    return priorities[phaseName] || 'low';
  }
  
  async loadWithPriority(resource, priority) {
    // 设置资源加载优先级
    if (priority === 'high' && 'scheduler' in window) {
      // 使用 Priority Hints API
      return scheduler.postTask(() => this.loadResource(resource), { priority });
    }
    
    return this.loadResource(resource);
  }
  
  async loadResource(resource) {
    const startTime = performance.now();
    
    try {
      const result = await this.fetchResource(resource);
      const loadTime = performance.now() - startTime;
      
      this.recordMetric('loadTime', resource.url, loadTime);
      return result;
    } catch (error) {
      this.recordMetric('loadError', resource.url, error);
      throw error;
    }
  }
}
```

### 流式加载与显示

```
流式加载流程
占位几何体 → 低精度模型 → 完整几何体 → 基础纹理 → 高清纹理
    ↓           ↓           ↓           ↓           ↓
 即时显示     快速替换     详细形状     基础外观     最终质量
```

```javascript
class StreamingLoader {
  constructor() {
    this.lodLevels = new Map();
    this.activeStreams = new Set();
  }
  
  async streamModel(modelUrl, options = {}) {
    const streamId = this.generateStreamId();
    this.activeStreams.add(streamId);
    
    try {
      // 1. 加载占位几何体
      const placeholder = await this.loadPlaceholderGeometry();
      this.dispatchEvent('placeholderReady', { streamId, geometry: placeholder });
      
      // 2. 加载低精度版本
      const lowResModel = await this.loadLODModel(modelUrl, 'low');
      this.dispatchEvent('lowResReady', { streamId, model: lowResModel });
      
      // 3. 加载完整几何体
      const fullGeometry = await this.loadLODModel(modelUrl, 'medium');
      this.dispatchEvent('geometryReady', { streamId, geometry: fullGeometry });
      
      // 4. 加载基础纹理
      const baseTextures = await this.loadTextures(modelUrl, 'base');
      this.dispatchEvent('texturesReady', { streamId, textures: baseTextures });
      
      // 5. 加载高清纹理
      const highResTextures = await this.loadTextures(modelUrl, 'high');
      this.dispatchEvent('highResReady', { streamId, textures: highResTextures });
      
      this.activeStreams.delete(streamId);
      return { geometry: fullGeometry, textures: highResTextures };
      
    } catch (error) {
      this.activeStreams.delete(streamId);
      this.dispatchEvent('streamError', { streamId, error });
      throw error;
    }
  }
  
  async loadLODModel(modelUrl, lodLevel) {
    const lodUrl = this.getLODUrl(modelUrl, lodLevel);
    
    // 根据LOD级别调整加载参数
    const loadOptions = this.getLODOptions(lodLevel);
    
    return await this.loadResource(lodUrl, loadOptions);
  }
  
  getLODUrl(baseUrl, lodLevel) {
    const extension = baseUrl.split('.').pop();
    const baseName = baseUrl.replace(`.${extension}`, '');
    
    return `${baseName}_${lodLevel}.${extension}`;
  }
  
  getLODOptions(lodLevel) {
    const options = {
      low: {
        decode: false,
        progressive: true,
        maxResolution: 512
      },
      medium: {
        decode: true,
        progressive: true,
        maxResolution: 1024
      },
      high: {
        decode: true,
        progressive: false,
        maxResolution: 2048
      }
    };
    
    return options[lodLevel] || options.medium;
  }
  
  cancelStream(streamId) {
    if (this.activeStreams.has(streamId)) {
      // 中止相关加载任务
      this.abortLoadingTasks(streamId);
      this.activeStreams.delete(streamId);
    }
  }
  
  abortLoadingTasks(streamId) {
    // 实现加载任务中止逻辑
    console.log(`Aborting loading tasks for stream: ${streamId}`);
  }
}
```

## 缓存策略

### 多级缓存系统

```javascript
class MultiLevelCache {
  constructor() {
    this.caches = new Map();
    this.setupCacheLayers();
  }
  
  setupCacheLayers() {
    // 内存缓存 (短期)
    this.caches.set('memory', new Map());
    
    // Session Storage缓存 (会话级)
    this.caches.set('session', new SessionStorageCache());
    
    // Local Storage缓存 (长期)
    this.caches.set('local', new LocalStorageCache());
    
    // IndexedDB缓存 (大文件)
    this.caches.set('indexeddb', new IndexedDBCache());
  }
  
  async get(key) {
    // 按层级查找缓存
    for (const [layerName, cache] of this.caches) {
      const value = await cache.get(key);
      if (value !== undefined) {
        // 更新其他层级的缓存
        this.populateUpperLayers(key, value, layerName);
        return value;
      }
    }
    
    return undefined;
  }
  
  async set(key, value, options = {}) {
    const { ttl, priority } = options;
    
    // 设置所有层级的缓存
    const setPromises = [];
    
    for (const [layerName, cache] of this.caches) {
      // 根据优先级决定缓存到哪些层级
      if (this.shouldCacheInLayer(layerName, priority)) {
        setPromises.push(cache.set(key, value, { ttl }));
      }
    }
    
    await Promise.all(setPromises);
  }
  
  shouldCacheInLayer(layerName, priority) {
    const layerPriorities = {
      'memory': ['high', 'medium', 'low'],
      'session': ['high', 'medium'],
      'local': ['high'],
      'indexeddb': ['high', 'medium']
    };
    
    return layerPriorities[layerName].includes(priority);
  }
  
  async populateUpperLayers(key, value, sourceLayer) {
    const layers = Array.from(this.caches.keys());
    const sourceIndex = layers.indexOf(sourceLayer);
    
    // 更新上层缓存
    for (let i = 0; i < sourceIndex; i++) {
      const layerName = layers[i];
      await this.caches.get(layerName).set(key, value);
    }
  }
  
  async preloadCriticalResources() {
    const criticalResources = [
      { key: 'brdfLUT', url: '/textures/brdfLUT.png', priority: 'high' },
      { key: 'envMap', url: '/textures/environment.hdr', priority: 'high' },
      { key: 'defaultMaterial', url: '/materials/default.json', priority: 'medium' }
    ];
    
    for (const resource of criticalResources) {
      const cached = await this.get(resource.key);
      if (!cached) {
        const data = await this.fetchResource(resource.url);
        await this.set(resource.key, data, { priority: resource.priority });
      }
    }
  }
}

class SessionStorageCache {
  constructor() {
    this.prefix = 'cache_';
  }
  
  async get(key) {
    try {
      const item = sessionStorage.getItem(this.prefix + key);
      if (item) {
        const { value, expiry } = JSON.parse(item);
        
        if (!expiry || Date.now() < expiry) {
          return value;
        } else {
          this.delete(key);
        }
      }
    } catch (error) {
      console.warn('SessionStorage cache get error:', error);
    }
    
    return undefined;
  }
  
  async set(key, value, options = {}) {
    try {
      const item = {
        value,
        expiry: options.ttl ? Date.now() + options.ttl : null
      };
      
      sessionStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('SessionStorage cache set error:', error);
    }
  }
  
  delete(key) {
    try {
      sessionStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn('SessionStorage cache delete error:', error);
    }
  }
}
```

### 智能缓存策略

```javascript
class IntelligentCache {
  constructor() {
    this.accessPatterns = new Map();
    this.cacheDecisions = new Map();
    this.setupLearning();
  }
  
  setupLearning() {
    // 收集访问模式数据
    this.collectAccessPatterns();
    
    // 基于历史数据做出缓存决策
    this.analyzePatterns();
  }
  
  collectAccessPatterns() {
    // 监控资源访问频率和时间模式
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.recordResourceAccess(entry.name, entry);
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }
  
  recordResourceAccess(url, metrics) {
    const pattern = this.accessPatterns.get(url) || {
      accessCount: 0,
      lastAccess: 0,
      averageSize: 0,
      accessTimes: []
    };
    
    pattern.accessCount++;
    pattern.lastAccess = Date.now();
    pattern.averageSize = (pattern.averageSize * (pattern.accessCount - 1) + metrics.transferSize) / pattern.accessCount;
    pattern.accessTimes.push(Date.now());
    
    this.accessPatterns.set(url, pattern);
  }
  
  analyzePatterns() {
    // 分析访问模式，制定缓存策略
    for (const [url, pattern] of this.accessPatterns) {
      const strategy = this.determineCachingStrategy(pattern);
      this.cacheDecisions.set(url, strategy);
    }
  }
  
  determineCachingStrategy(pattern) {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // 基于访问频率和新鲜度要求制定策略
    if (pattern.accessCount > 10 && (now - pattern.lastAccess) < oneDay) {
      return {
        cache: true,
        layer: 'memory',
        ttl: 30 * 60 * 1000, // 30分钟
        preload: true
      };
    } else if (pattern.accessCount > 5) {
      return {
        cache: true,
        layer: 'session',
        ttl: 2 * 60 * 60 * 1000, // 2小时
        preload: false
      };
    } else {
      return {
        cache: false,
        preload: false
      };
    }
  }
  
  shouldPreload(url) {
    const decision = this.cacheDecisions.get(url);
    return decision ? decision.preload : false;
  }
  
  getCacheStrategy(url) {
    return this.cacheDecisions.get(url) || { cache: false, preload: false };
  }
}
```

## 加载状态与用户体验

### 进度反馈系统

```javascript
class LoadingProgress {
  constructor() {
    this.totalResources = 0;
    this.loadedResources = 0;
    this.totalBytes = 0;
    this.loadedBytes = 0;
    this.phases = new Map();
    this.listeners = new Set();
  }
  
  addResource(resource) {
    this.totalResources++;
    this.totalBytes += resource.estimatedSize || 0;
    
    this.updateProgress();
  }
  
  resourceLoaded(resource, actualSize) {
    this.loadedResources++;
    this.loadedBytes += actualSize || resource.estimatedSize || 0;
    
    this.updateProgress();
  }
  
  updateProgress() {
    const progress = {
      resources: {
        loaded: this.loadedResources,
        total: this.totalResources,
        percent: (this.loadedResources / this.totalResources) * 100
      },
      bytes: {
        loaded: this.loadedBytes,
        total: this.totalBytes,
        percent: (this.loadedBytes / this.totalBytes) * 100
      },
      overall: this.calculateOverallProgress()
    };
    
    this.notifyListeners(progress);
  }
  
  calculateOverallProgress() {
    // 综合考虑资源数量和字节大小
    const resourceProgress = this.loadedResources / this.totalResources;
    const byteProgress = this.loadedBytes / this.totalBytes;
    
    // 资源数量占60%权重，字节大小占40%
    return (resourceProgress * 0.6 + byteProgress * 0.4) * 100;
  }
  
  addPhase(phaseName, weight) {
    this.phases.set(phaseName, {
      weight: weight,
      progress: 0
    });
  }
  
  updatePhaseProgress(phaseName, progress) {
    const phase = this.phases.get(phaseName);
    if (phase) {
      phase.progress = progress;
      this.updateProgress();
    }
  }
  
  addListener(callback) {
    this.listeners.add(callback);
  }
  
  removeListener(callback) {
    this.listeners.delete(callback);
  }
  
  notifyListeners(progress) {
    this.listeners.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Progress listener error:', error);
      }
    });
  }
}

class LoadingUI {
  constructor() {
    this.progressSystem = new LoadingProgress();
    this.setupUI();
    this.setupEventListeners();
  }
  
  setupUI() {
    this.container = document.createElement('div');
    this.container.className = 'loading-ui';
    
    this.container.innerHTML = `
      <div class="loading-overlay">
        <div class="loading-content">
          <div class="spinner"></div>
          <div class="progress-text">Loading...</div>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="phase-info"></div>
          <div class="tip-container"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.container);
    
    this.progressFill = this.container.querySelector('.progress-fill');
    this.progressText = this.container.querySelector('.progress-text');
    this.phaseInfo = this.container.querySelector('.phase-info');
    this.tipContainer = this.container.querySelector('.tip-container');
  }
  
  setupEventListeners() {
    this.progressSystem.addListener(this.updateUI.bind(this));
  }
  
  updateUI(progress) {
    // 更新进度条
    this.progressFill.style.width = `${progress.overall}%`;
    
    // 更新文本
    this.progressText.textContent = 
      `Loading... ${Math.round(progress.overall)}%`;
    
    // 更新阶段信息
    this.updatePhaseInfo();
    
    // 显示加载提示
    this.showLoadingTip(progress.overall);
    
    // 加载完成时隐藏UI
    if (progress.overall >= 100) {
      this.hide();
    }
  }
  
  updatePhaseInfo() {
    const phases = Array.from(this.progressSystem.phases.entries());
    const phaseText = phases.map(([name, data]) => 
      `${name}: ${Math.round(data.progress * 100)}%`
    ).join(' | ');
    
    this.phaseInfo.textContent = phaseText;
  }
  
  showLoadingTip(progress) {
    const tips = [
      "Optimizing 3D models for your device...",
      "Loading high-resolution textures...",
      "Preparing interactive elements...",
      "Almost ready to explore..."
    ];
    
    const tipIndex = Math.floor(progress / (100 / tips.length));
    if (tipIndex < tips.length) {
      this.tipContainer.textContent = tips[tipIndex];
    }
  }
  
  hide() {
    this.container.style.opacity = '0';
    
    setTimeout(() => {
      this.container.style.display = 'none';
    }, 500);
  }
  
  show() {
    this.container.style.display = 'block';
    this.container.style.opacity = '1';
  }
}
```

### 错误处理与降级

```javascript
class ErrorHandler {
  constructor() {
    this.fallbackStrategies = new Map();
    this.setupFallbacks();
  }
  
  setupFallbacks() {
    // 模型加载失败时的降级策略
    this.fallbackStrategies.set('model', {
      levels: [
        {
          condition: (error) => error.status === 404,
          action: async (url) => this.loadPlaceholderModel()
        },
        {
          condition: (error) => error.message.includes('format'),
          action: async (url) => this.convertModelFormat(url)
        },
        {
          condition: () => true, // 默认降级
          action: async (url) => this.loadSimplifiedModel(url)
        }
      ]
    });
    
    // 纹理加载失败时的降级策略
    this.fallbackStrategies.set('texture', {
      levels: [
        {
          condition: (error) => error.status === 404,
          action: async (url) => this.generateProceduralTexture()
        },
        {
          condition: (error) => error.message.includes('memory'),
          action: async (url) => this.loadLowResTexture(url)
        }
      ]
    });
  }
  
  async handleLoadError(error, resourceType, url, context) {
    console.warn(`Load error for ${resourceType}:`, error);
    
    const strategy = this.fallbackStrategies.get(resourceType);
    if (!strategy) {
      throw error; // 没有降级策略，重新抛出错误
    }
    
    // 找到合适的降级策略
    for (const level of strategy.levels) {
      if (level.condition(error)) {
        try {
          const fallbackResult = await level.action(url, context);
          this.recordFallbackUsage(resourceType, url, level);
          return fallbackResult;
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          continue;
        }
      }
    }
    
    // 所有降级策略都失败
    throw error;
  }
  
  async loadPlaceholderModel() {
    // 返回基础几何体作为占位符
    return new THREE.BoxGeometry(1, 1, 1);
  }
  
  async loadSimplifiedModel(originalUrl) {
    // 尝试加载简化版本的模型
    const simplifiedUrl = originalUrl.replace('.glb', '_simple.glb');
    
    try {
      return await this.loadResource(simplifiedUrl);
    } catch (error) {
      return this.loadPlaceholderModel();
    }
  }
  
  async generateProceduralTexture() {
    // 生成程序化纹理作为降级
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, '#888888');
    gradient.addColorStop(1, '#cccccc');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    
    return texture;
  }
  
  recordFallbackUsage(resourceType, url, fallbackLevel) {
    // 记录降级使用情况，用于分析和优化
    const metric = {
      type: resourceType,
      url,
      fallback: fallbackLevel.condition.toString(),
      timestamp: Date.now()
    };
    
    this.reportMetric('fallback_used', metric);
  }
}
```

## 性能监控与自适应

### 实时性能监控

```javascript
class LoadingPerformanceMonitor {
  constructor() {
    this.metrics = {
      loadTimes: new Map(),
      resourceSizes: new Map(),
      cacheHits: 0,
      cacheMisses: 0,
      errors: new Map()
    };
    
    this.thresholds = {
      slowLoadTime: 3000, // 3秒
      largeResource: 5 * 1024 * 1024, // 5MB
      errorRate: 0.1 // 10%
    };
    
    this.startMonitoring();
  }
  
  startMonitoring() {
    // 监听资源加载性能
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.recordResourceMetric(entry);
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
    
    // 监控内存使用
    this.startMemoryMonitoring();
  }
  
  recordResourceMetric(entry) {
    const url = entry.name;
    
    this.metrics.loadTimes.set(url, entry.duration);
    this.metrics.resourceSizes.set(url, entry.transferSize);
    
    // 检查是否超过阈值
    if (entry.duration > this.thresholds.slowLoadTime) {
      this.reportSlowResource(url, entry.duration);
    }
    
    if (entry.transferSize > this.thresholds.largeResource) {
      this.reportLargeResource(url, entry.transferSize);
    }
  }
  
  reportSlowResource(url, duration) {
    console.warn(`Slow resource load: ${url} took ${duration}ms`);
    
    // 触发优化建议
    this.suggestOptimization(url, 'slow_load', { duration });
  }
  
  reportLargeResource(url, size) {
    console.warn(`Large resource: ${url} size ${this.formatBytes(size)}`);
    
    this.suggestOptimization(url, 'large_size', { size });
  }
  
  suggestOptimization(url, issue, data) {
    const suggestions = {
      'slow_load': [
        'Consider using CDN for better delivery',
        'Enable compression for this resource',
        'Implement progressive loading'
      ],
      'large_size': [
        'Optimize resource size',
        'Use more efficient format',
        'Implement LOD system'
      ]
    };
    
    const applicableSuggestions = suggestions[issue] || [];
    
    this.dispatchEvent('optimizationSuggested', {
      url,
      issue,
      data,
      suggestions: applicableSuggestions
    });
  }
  
  calculateCacheEfficiency() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? this.metrics.cacheHits / total : 0;
  }
  
  getPerformanceReport() {
    return {
      averageLoadTime: this.calculateAverageLoadTime(),
      totalResources: this.metrics.loadTimes.size,
      cacheEfficiency: this.calculateCacheEfficiency(),
      largeResources: this.findLargeResources(),
      slowResources: this.findSlowResources()
    };
  }
  
  calculateAverageLoadTime() {
    const times = Array.from(this.metrics.loadTimes.values());
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
  
  findLargeResources() {
    return Array.from(this.metrics.resourceSizes.entries())
      .filter(([url, size]) => size > this.thresholds.largeResource)
      .sort((a, b) => b[1] - a[1]);
  }
  
  findSlowResources() {
    return Array.from(this.metrics.loadTimes.entries())
      .filter(([url, time]) => time > this.thresholds.slowLoadTime)
      .sort((a, b) => b[1] - a[1]);
  }
  
  formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}
```