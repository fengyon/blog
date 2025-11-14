# 加载优化

## 加载优化基础

### 加载性能指标
```
关键性能指标:
FP (First Paint)       首次绘制
FCP (First Contentful Paint) 首次内容绘制
LCP (Largest Contentful Paint) 最大内容绘制
TTI (Time to Interactive)     可交互时间
```

### 资源加载流程
```
用户请求 → DNS查询 → 建立连接 → 发送请求 → 接收响应 → 解析处理 → 渲染显示
    ↓         ↓         ↓         ↓         ↓         ↓         ↓
缓存检查   网络延迟   TCP握手   服务器处理  数据传输   资源解析   布局绘制
```

## 资源预加载

### 预加载策略
```javascript
class ResourcePreloader {
    constructor() {
        this.preloadQueue = new Map();
        this.loadedResources = new Map();
        this.priorityQueue = new PriorityQueue();
    }

    // 预加载关键资源
    preloadCriticalResources() {
        const criticalResources = [
            { url: 'textures/skybox.jpg', type: 'texture', priority: 1 },
            { url: 'models/player.glb', type: 'model', priority: 1 },
            { url: 'textures/ui/loading.png', type: 'texture', priority: 2 }
        ];

        criticalResources.forEach(resource => {
            this.addToPreloadQueue(resource);
        });

        this.startPreloading();
    }

    addToPreloadQueue(resource) {
        this.preloadQueue.set(resource.url, {
            ...resource,
            status: 'pending',
            progress: 0
        });
        this.priorityQueue.enqueue(resource, resource.priority);
    }

    async startPreloading() {
        const concurrencyLimit = 3;
        const activeLoads = new Set();

        while (this.priorityQueue.size() > 0) {
            if (activeLoads.size < concurrencyLimit) {
                const resource = this.priorityQueue.dequeue();
                this.loadResource(resource).then(() => {
                    activeLoads.delete(resource.url);
                });
                activeLoads.add(resource.url);
            } else {
                await this.waitForLoadCompletion(activeLoads);
            }
        }
    }

    async loadResource(resource) {
        try {
            this.preloadQueue.get(resource.url).status = 'loading';
            
            let data;
            switch (resource.type) {
                case 'texture':
                    data = await this.loadTexture(resource.url);
                    break;
                case 'model':
                    data = await this.loadModel(resource.url);
                    break;
                case 'audio':
                    data = await this.loadAudio(resource.url);
                    break;
            }

            this.preloadQueue.get(resource.url).status = 'loaded';
            this.preloadQueue.get(resource.url).progress = 100;
            this.loadedResources.set(resource.url, data);

        } catch (error) {
            this.preloadQueue.get(resource.url).status = 'error';
            console.error(`Failed to preload ${resource.url}:`, error);
        }
    }

    async loadTexture(url) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                url,
                (texture) => resolve(texture),
                (progress) => this.updateProgress(url, progress),
                reject
            );
        });
    }

    async loadModel(url) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            loader.load(
                url,
                (gltf) => resolve(gltf),
                (progress) => this.updateProgress(url, progress),
                reject
            );
        });
    }

    updateProgress(url, progress) {
        if (progress.lengthComputable) {
            const percent = (progress.loaded / progress.total) * 100;
            this.preloadQueue.get(url).progress = percent;
        }
    }

    getPreloadedResource(url) {
        return this.loadedResources.get(url);
    }

    getOverallProgress() {
        const total = this.preloadQueue.size;
        const loaded = Array.from(this.preloadQueue.values())
            .filter(res => res.status === 'loaded').length;
        return total > 0 ? (loaded / total) * 100 : 100;
    }
}
```

### 链接预加载
```html
<!-- 使用 rel="preload" 预加载关键资源 -->
<link rel="preload" href="textures/skybox.jpg" as="image">
<link rel="preload" href="models/player.glb" as="fetch">
<link rel="preload" href="shaders/main.vert" as="script">

<!-- 预连接重要域名 -->
<link rel="preconnect" href="https://cdn.example.com">
<link rel="dns-prefetch" href="https://api.example.com">
```

## 渐进式加载

### 三级加载策略
```javascript
class ProgressiveLoader {
    constructor() {
        this.qualityLevels = {
            low: { resolution: 0.5, textureQuality: 'low', lodDistance: 10 },
            medium: { resolution: 0.75, textureQuality: 'medium', lodDistance: 25 },
            high: { resolution: 1.0, textureQuality: 'high', lodDistance: 50 }
        };
        this.currentQuality = 'low';
    }

    async loadSceneProgressive(sceneConfig) {
        // 阶段1: 加载基础几何体
        await this.loadBaseGeometry(sceneConfig.geometry);
        
        // 阶段2: 加载低质量纹理
        await this.loadTextures(sceneConfig.textures, 'low');
        
        // 阶段3: 加载高质量资源
        this.scheduleQualityUpgrade();
    }

    async loadBaseGeometry(geometryConfig) {
        const promises = [];
        
        // 只加载可见区域的基础几何体
        geometryConfig.forEach(geom => {
            if (this.isInInitialView(geom.bounds)) {
                promises.push(this.loadSimplifiedGeometry(geom));
            }
        });

        await Promise.all(promises);
    }

    async loadTextures(texturesConfig, quality) {
        const textureLoader = new THREE.TextureLoader();
        
        for (const textureConfig of texturesConfig) {
            const qualityUrl = this.getQualityUrl(textureConfig.url, quality);
            const texture = await this.loadTextureWithFallback(qualityUrl);
            
            // 应用纹理优化
            this.optimizeTextureForQuality(texture, quality);
        }
    }

    getQualityUrl(baseUrl, quality) {
        const qualitySuffix = {
            low: '_512.jpg',
            medium: '_1024.jpg',
            high: '_2048.jpg'
        };
        
        return baseUrl.replace('.jpg', qualitySuffix[quality]);
    }

    async loadTextureWithFallback(url) {
        try {
            return await this.loadTexture(url);
        } catch (error) {
            console.warn(`Failed to load ${url}, using fallback`);
            return this.createFallbackTexture();
        }
    }

    optimizeTextureForQuality(texture, quality) {
        switch (quality) {
            case 'low':
                texture.generateMipmaps = false;
                texture.minFilter = THREE.LinearFilter;
                break;
            case 'medium':
                texture.generateMipmaps = true;
                texture.minFilter = THREE.LinearMipMapLinearFilter;
                break;
            case 'high':
                texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
                break;
        }
    }

    scheduleQualityUpgrade() {
        // 在空闲时间升级质量
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.upgradeToMediumQuality();
                
                requestIdleCallback(() => {
                    this.upgradeToHighQuality();
                });
            });
        } else {
            setTimeout(() => this.upgradeToMediumQuality(), 2000);
            setTimeout(() => this.upgradeToHighQuality(), 5000);
        }
    }

    async upgradeToMediumQuality() {
        this.currentQuality = 'medium';
        await this.loadTextures(this.sceneConfig.textures, 'medium');
        this.updateMaterialQuality('medium');
    }

    updateMaterialQuality(quality) {
        this.scene.traverse((object) => {
            if (object.isMesh) {
                const material = object.material;
                if (material) {
                    material.needsUpdate = true;
                    
                    if (quality === 'low') {
                        material.roughness = 0.8;
                        material.metalness = 0.2;
                    } else {
                        material.roughness = 0.5;
                        material.metalness = 0.5;
                    }
                }
            }
        });
    }
}
```

### 流式几何体加载
```javascript
class StreamableGeometry {
    constructor(url, chunkSize = 1000) {
        this.url = url;
        this.chunkSize = chunkSize;
        this.loadedChunks = new Map();
        this.geometry = new THREE.BufferGeometry();
    }

    async loadProgressive() {
        // 首先加载元数据
        const metadata = await this.loadMetadata();
        
        // 创建基础几何体结构
        this.setupBaseGeometry(metadata);
        
        // 流式加载顶点数据
        await this.streamVertexData(metadata);
    }

    async loadMetadata() {
        const response = await fetch(`${this.url}/metadata.json`);
        return response.json();
    }

    setupBaseGeometry(metadata) {
        // 预分配缓冲区
        const positionArray = new Float32Array(metadata.vertexCount * 3);
        const normalArray = new Float32Array(metadata.vertexCount * 3);
        const uvArray = new Float32Array(metadata.vertexCount * 2);

        this.geometry.setAttribute('position', 
            new THREE.BufferAttribute(positionArray, 3));
        this.geometry.setAttribute('normal', 
            new THREE.BufferAttribute(normalArray, 3));
        this.geometry.setAttribute('uv', 
            new THREE.BufferAttribute(uvArray, 2));
    }

    async streamVertexData(metadata) {
        const totalChunks = Math.ceil(metadata.vertexCount / this.chunkSize);
        
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const chunk = await this.loadChunk(chunkIndex);
            this.applyChunkToGeometry(chunk, chunkIndex);
            
            // 每加载几个区块后让出主线程
            if (chunkIndex % 5 === 0) {
                await this.yieldToMainThread();
            }
        }
    }

    async loadChunk(chunkIndex) {
        const response = await fetch(`${this.url}/chunk_${chunkIndex}.bin`);
        const arrayBuffer = await response.arrayBuffer();
        
        // 解析二进制数据
        return this.parseChunkData(arrayBuffer);
    }

    applyChunkToGeometry(chunk, chunkIndex) {
        const startVertex = chunkIndex * this.chunkSize;
        const positionAttribute = this.geometry.attributes.position;
        const normalAttribute = this.geometry.attributes.normal;
        const uvAttribute = this.geometry.attributes.uv;

        // 将区块数据复制到主几何体
        positionAttribute.array.set(chunk.positions, startVertex * 3);
        normalAttribute.array.set(chunk.normals, startVertex * 3);
        uvAttribute.array.set(chunk.uvs, startVertex * 2);

        // 标记属性需要更新
        positionAttribute.needsUpdate = true;
        normalAttribute.needsUpdate = true;
        uvAttribute.needsUpdate = true;
    }

    async yieldToMainThread() {
        return new Promise(resolve => {
            setTimeout(resolve, 0);
        });
    }
}
```

## 代码分割与懒加载

### 动态导入
```javascript
class DynamicModuleLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadingModules = new Map();
    }

    // 按需加载功能模块
    async loadModule(moduleName) {
        if (this.loadedModules.has(moduleName)) {
            return this.loadedModules.get(moduleName);
        }

        if (this.loadingModules.has(moduleName)) {
            return this.loadingModules.get(moduleName);
        }

        const loadPromise = this.importModule(moduleName);
        this.loadingModules.set(moduleName, loadPromise);

        try {
            const module = await loadPromise;
            this.loadedModules.set(moduleName, module);
            this.loadingModules.delete(moduleName);
            return module;
        } catch (error) {
            this.loadingModules.delete(moduleName);
            throw error;
        }
    }

    async importModule(moduleName) {
        switch (moduleName) {
            case 'physics':
                return import('./physics/physics-engine.js');
            case 'ai':
                return import('./ai/navigation-system.js');
            case 'particles':
                return import('./effects/particle-system.js');
            case 'postprocessing':
                return import('./rendering/post-processing.js');
            default:
                throw new Error(`Unknown module: ${moduleName}`);
        }
    }

    // 预加载可能需要的模块
    preloadLikelyModules(userActions) {
        const likelyModules = this.predictModules(userActions);
        
        likelyModules.forEach(moduleName => {
            if (!this.loadedModules.has(moduleName) && 
                !this.loadingModules.has(moduleName)) {
                this.loadModule(moduleName);
            }
        });
    }

    predictModules(userActions) {
        const predictions = new Set();
        
        if (userActions.includes('move')) {
            predictions.add('physics');
        }
        
        if (userActions.includes('interact')) {
            predictions.add('ai');
        }
        
        if (userActions.includes('shoot')) {
            predictions.add('particles');
        }

        return Array.from(predictions);
    }
}
```

### 路由级代码分割
```javascript
class RouteBasedLoader {
    constructor(routes) {
        this.routes = routes;
        this.preloadedRoutes = new Set();
        this.setupRoutePreloading();
    }

    setupRoutePreloading() {
        // 预加载可见区域的路线
        this.preloadVisibleRoutes();
        
        // 监听路由变化
        window.addEventListener('popstate', () => {
            this.handleRouteChange();
        });
    }

    preloadVisibleRoutes() {
        const visibleRoutes = this.getVisibleRoutes();
        
        visibleRoutes.forEach(route => {
            if (!this.preloadedRoutes.has(route)) {
                this.preloadRoute(route);
            }
        });
    }

    getVisibleRoutes() {
        // 基于视口和用户行为预测可见路线
        const routes = [];
        
        if (this.isInViewport('main-scene')) {
            routes.push('main-scene');
        }
        
        if (this.isUserNearPortal()) {
            routes.push('dungeon-scene');
        }

        return routes;
    }

    async loadRoute(routeName) {
        const route = this.routes[routeName];
        
        if (!route) {
            throw new Error(`Route ${routeName} not found`);
        }

        // 并行加载路由资源
        const [scene, textures, models] = await Promise.all([
            this.loadScene(route.scene),
            this.loadTextures(route.textures),
            this.loadModels(route.models)
        ]);

        return { scene, textures, models };
    }

    async preloadRoute(routeName) {
        try {
            const route = this.routes[routeName];
            
            // 只预加载关键资源
            await Promise.all([
                this.preloadTextures(route.criticalTextures),
                this.preloadModels(route.criticalModels)
            ]);
            
            this.preloadedRoutes.add(routeName);
        } catch (error) {
            console.warn(`Failed to preload route ${routeName}:`, error);
        }
    }

    async loadScene(sceneConfig) {
        const loader = new THREE.ObjectLoader();
        return loader.parse(sceneConfig);
    }

    async loadTextures(textureUrls) {
        const loader = new THREE.TextureLoader();
        const promises = textureUrls.map(url => 
            new Promise((resolve, reject) => {
                loader.load(url, resolve, null, reject);
            })
        );
        
        return Promise.all(promises);
    }

    async loadModels(modelUrls) {
        const loader = new THREE.GLTFLoader();
        const promises = modelUrls.map(url =>
            new Promise((resolve, reject) => {
                loader.load(url, resolve, null, reject);
            })
        );
        
        return Promise.all(promises);
    }
}
```

## 缓存策略

### 智能缓存系统
```javascript
class SmartCacheSystem {
    constructor() {
        this.caches = new Map();
        this.setupCaches();
    }

    setupCaches() {
        // 内存缓存 - 快速访问
        this.caches.set('memory', new MemoryCache({
            maxSize: 50 * 1024 * 1024, // 50MB
            ttl: 5 * 60 * 1000 // 5分钟
        }));

        // 磁盘缓存 - 大容量存储
        this.caches.set('disk', new DiskCache({
            maxSize: 500 * 1024 * 1024, // 500MB
            ttl: 24 * 60 * 60 * 1000 // 24小时
        }));

        // 预取缓存 - 预测性加载
        this.caches.set('prefetch', new PrefetchCache());
    }

    async get(url, options = {}) {
        // 检查内存缓存
        let data = await this.caches.get('memory').get(url);
        if (data) {
            this.recordCacheHit('memory');
            return data;
        }

        // 检查磁盘缓存
        data = await this.caches.get('disk').get(url);
        if (data) {
            this.recordCacheHit('disk');
            // 回填到内存缓存
            this.caches.get('memory').set(url, data);
            return data;
        }

        // 从网络加载
        this.recordCacheMiss();
        data = await this.fetchFromNetwork(url, options);
        
        // 缓存到各级存储
        await this.cacheData(url, data, options);
        
        return data;
    }

    async cacheData(url, data, options) {
        const cachePriority = options.priority || 'medium';
        
        // 总是缓存到磁盘
        await this.caches.get('disk').set(url, data);
        
        // 根据优先级决定是否缓存到内存
        if (cachePriority === 'high') {
            await this.caches.get('memory').set(url, data);
        }
        
        // 预取相关资源
        if (options.prefetchRelated) {
            this.prefetchRelatedResources(url, data);
        }
    }

    async prefetchRelatedResources(url, data) {
        const relatedUrls = this.extractRelatedResourceUrls(data);
        
        relatedUrls.forEach(relatedUrl => {
            if (!this.caches.get('prefetch').has(relatedUrl)) {
                this.caches.get('prefetch').prefetch(relatedUrl);
            }
        });
    }

    extractRelatedResourceUrls(data) {
        const urls = [];
        
        if (data.textures) {
            urls.push(...data.textures);
        }
        
        if (data.geometries) {
            urls.push(...data.geometries);
        }
        
        if (data.animations) {
            urls.push(...data.animations);
        }

        return urls;
    }

    recordCacheHit(cacheLevel) {
        // 记录缓存命中统计
        performance.mark(`cache-hit-${cacheLevel}`);
    }

    recordCacheMiss() {
        performance.mark('cache-miss');
    }

    clearExpired() {
        this.caches.forEach(cache => cache.clearExpired());
    }

    getCacheStats() {
        const stats = {};
        
        this.caches.forEach((cache, name) => {
            stats[name] = cache.getStats();
        });
        
        return stats;
    }
}

class MemoryCache {
    constructor(options) {
        this.maxSize = options.maxSize;
        this.ttl = options.ttl;
        this.cache = new Map();
        this.currentSize = 0;
        this.hits = 0;
        this.misses = 0;
    }

    set(key, value) {
        const size = this.estimateSize(value);
        
        // 如果超过大小限制，清理空间
        while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
            this.evictLeastUsed();
        }

        this.cache.set(key, {
            value,
            size,
            lastAccessed: Date.now(),
            accessCount: 0
        });
        
        this.currentSize += size;
    }

    get(key) {
        const item = this.cache.get(key);
        
        if (item) {
            if (Date.now() - item.lastAccessed > this.ttl) {
                // 已过期
                this.cache.delete(key);
                this.currentSize -= item.size;
                this.misses++;
                return null;
            }
            
            item.lastAccessed = Date.now();
            item.accessCount++;
            this.hits++;
            return item.value;
        }
        
        this.misses++;
        return null;
    }

    evictLeastUsed() {
        let leastUsedKey = null;
        let minScore = Infinity;

        for (const [key, item] of this.cache) {
            const score = this.calculateEvictionScore(item);
            if (score < minScore) {
                minScore = score;
                leastUsedKey = key;
            }
        }

        if (leastUsedKey) {
            const item = this.cache.get(leastUsedKey);
            this.currentSize -= item.size;
            this.cache.delete(leastUsedKey);
        }
    }

    calculateEvictionScore(item) {
        const age = Date.now() - item.lastAccessed;
        const frequency = 1 / (item.accessCount + 1); // 避免除零
        return age * frequency;
    }

    estimateSize(value) {
        // 简单的大小估算
        if (value instanceof THREE.BufferGeometry) {
            return this.estimateGeometrySize(value);
        } else if (value instanceof THREE.Texture) {
            return this.estimateTextureSize(value);
        } else {
            return JSON.stringify(value).length;
        }
    }

    getStats() {
        return {
            size: this.currentSize,
            items: this.cache.size,
            hitRate: this.hits / (this.hits + this.misses) || 0
        };
    }
}
```

## 网络优化

### 资源压缩与优化
```javascript
class ResourceCompressor {
    constructor() {
        this.supportedFormats = this.detectSupportedFormats();
    }

    detectSupportedFormats() {
        const formats = {
            draco: false,
            basis: false,
            ktx2: false
        };

        // 检测 Draco 压缩支持
        if (THREE.DRACOLoader) {
            formats.draco = true;
        }

        // 检测 Basis 压缩支持
        if (THREE.BasisTextureLoader) {
            formats.basis = true;
        }

        return formats;
    }

    async compressGeometry(geometry, options = {}) {
        const format = options.format || 'draco';
        
        switch (format) {
            case 'draco':
                return await this.compressWithDraco(geometry, options);
            case 'meshopt':
                return await this.compressWithMeshopt(geometry, options);
            default:
                return geometry;
        }
    }

    async compressWithDraco(geometry, options) {
        if (!this.supportedFormats.draco) {
            console.warn('Draco compression not supported');
            return geometry;
        }

        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('path/to/draco/decoder/');

        return new Promise((resolve) => {
            // 简化几何体用于压缩
            const simplified = this.simplifyGeometry(geometry, options.quality);
            
            // 这里应该是实际的 Draco 压缩逻辑
            // 实际实现需要 Draco 编码器
            resolve(simplified);
        });
    }

    simplifyGeometry(geometry, quality = 0.5) {
        const simplified = geometry.clone();
        
        // 简化顶点数据
        if (quality < 0.3) {
            this.aggressiveSimplify(simplified);
        } else if (quality < 0.7) {
            this.moderateSimplify(simplified);
        }
        
        return simplified;
    }

    async compressTexture(texture, options = {}) {
        const format = options.format || 'basis';
        
        switch (format) {
            case 'basis':
                return await this.compressWithBasis(texture, options);
            case 'ktx2':
                return await this.compressWithKtx2(texture, options);
            default:
                return texture;
        }
    }

    getOptimalFormat(resourceType, capabilities) {
        if (resourceType === 'geometry') {
            return capabilities.draco ? 'draco' : 'none';
        }
        
        if (resourceType === 'texture') {
            if (capabilities.basis) return 'basis';
            if (capabilities.ktx2) return 'ktx2';
            return 'webp';
        }
        
        return 'none';
    }

    createFallbackChain(primaryFormat, resourceType) {
        const fallbacks = {
            draco: ['meshopt', 'none'],
            basis: ['ktx2', 'webp', 'jpg'],
            ktx2: ['basis', 'webp', 'jpg']
        };
        
        return fallbacks[primaryFormat] || ['none'];
    }
}
```

### 自适应比特率加载
```javascript
class AdaptiveBitrateLoader {
    constructor() {
        this.networkMonitor = new NetworkMonitor();
        this.qualityLevels = ['low', 'medium', 'high', 'ultra'];
        this.currentQuality = 'medium';
    }

    async loadAdaptiveResource(resourceUrl, resourceType) {
        const networkConditions = await this.networkMonitor.getConditions();
        const targetQuality = this.selectQualityLevel(networkConditions, resourceType);
        
        try {
            return await this.loadResourceWithQuality(resourceUrl, targetQuality);
        } catch (error) {
            // 降级到较低质量
            return await this.loadWithFallback(resourceUrl, targetQuality);
        }
    }

    selectQualityLevel(networkConditions, resourceType) {
        const { bandwidth, latency, packetLoss } = networkConditions;
        
        let qualityIndex = 1; // 默认中等质量
        
        if (bandwidth > 5000 && latency < 50) { // 5Mbps, 50ms
            qualityIndex = 3; // ultra
        } else if (bandwidth > 2000 && latency < 100) { // 2Mbps, 100ms
            qualityIndex = 2; // high
        } else if (bandwidth < 500 || latency > 300) { // 500Kbps, 300ms
            qualityIndex = 0; // low
        }

        // 根据资源类型调整
        if (resourceType === 'texture' && bandwidth < 1000) {
            qualityIndex = Math.max(0, qualityIndex - 1);
        }

        return this.qualityLevels[qualityIndex];
    }

    async loadResourceWithQuality(resourceUrl, quality) {
        const qualityUrl = this.getQualitySpecificUrl(resourceUrl, quality);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.getTimeoutForQuality(quality));
        
        try {
            const response = await fetch(qualityUrl, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await this.processResponse(response, quality);
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    getQualitySpecificUrl(baseUrl, quality) {
        const qualitySuffixes = {
            low: '_512',
            medium: '_1024', 
            high: '_2048',
            ultra: '_4096'
        };
        
        return baseUrl.replace(/(\.\w+)$/, `${qualitySuffixes[quality]}$1`);
    }

    getTimeoutForQuality(quality) {
        const timeouts = {
            low: 10000,    // 10秒
            medium: 15000, // 15秒
            high: 20000,   // 20秒
            ultra: 30000   // 30秒
        };
        
        return timeouts[quality];
    }

    async loadWithFallback(resourceUrl, failedQuality) {
        const currentIndex = this.qualityLevels.indexOf(failedQuality);
        
        for (let i = currentIndex - 1; i >= 0; i--) {
            const fallbackQuality = this.qualityLevels[i];
            
            try {
                console.log(`Trying fallback quality: ${fallbackQuality}`);
                return await this.loadResourceWithQuality(resourceUrl, fallbackQuality);
            } catch (error) {
                console.warn(`Fallback ${fallbackQuality} also failed:`, error);
                continue;
            }
        }
        
        throw new Error('All quality levels failed');
    }
}

class NetworkMonitor {
    constructor() {
        this.conditions = {
            bandwidth: 0,
            latency: 0,
            packetLoss: 0
        };
        
        this.startMonitoring();
    }

    async startMonitoring() {
        // 使用 Navigation Timing API
        this.analyzeNavigationTiming();
        
        // 使用 Resource Timing API
        this.analyzeResourceTiming();
        
        // 定期测试网络条件
        setInterval(() => this.performNetworkTest(), 30000);
    }

    analyzeNavigationTiming() {
        if (window.performance && performance.getEntriesByType) {
            const navigation = performance.getEntriesByType('navigation')[0];
            
            if (navigation) {
                this.conditions.latency = navigation.domainLookupEnd - navigation.domainLookupStart;
                
                // 估算带宽
                const totalBytes = navigation.transferSize || 0;
                const loadTime = navigation.responseEnd - navigation.requestStart;
                
                if (loadTime > 0) {
                    this.conditions.bandwidth = (totalBytes * 8) / (loadTime / 1000); // bits per second
                }
            }
        }
    }

    async performNetworkTest() {
        const testUrl = '/network-test?size=100000'; // 100KB 测试文件
        const startTime = performance.now();
        
        try {
            const response = await fetch(testUrl, { cache: 'no-store' });
            const endTime = performance.now();
            
            const duration = endTime - startTime;
            const size = Number(response.headers.get('content-length')) || 100000;
            
            this.conditions.bandwidth = (size * 8) / (duration / 1000);
            this.conditions.latency = duration;
            
        } catch (error) {
            console.warn('Network test failed:', error);
        }
    }

    getConditions() {
        return { ...this.conditions };
    }
}
```

## 性能监控与优化

### 加载性能监控
```javascript
class LoadingPerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.marks = new Map();
        this.setupPerformanceObserver();
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // 监控资源加载
            const resourceObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    this.recordResourceLoad(entry);
                });
            });
            
            resourceObserver.observe({ entryTypes: ['resource'] });

            // 监控长任务
            const longTaskObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    this.recordLongTask(entry);
                });
            });
            
            longTaskObserver.observe({ entryTypes: ['longtask'] });
        }
    }

    recordResourceLoad(entry) {
        const resource = {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize || 0,
            type: this.getResourceType(entry.name)
        };

        this.metrics.set(entry.name, resource);
    }

    getResourceType(url) {
        if (url.includes('.glb') || url.includes('.gltf')) return 'model';
        if (url.includes('.jpg') || url.includes('.png')) return 'texture';
        if (url.includes('.js')) return 'script';
        if (url.includes('.css')) return 'style';
        return 'other';
    }

    recordLongTask(entry) {
        console.warn('Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime
        });
    }

    markLoadPhase(phase) {
        performance.mark(`${phase}-start`);
        this.marks.set(phase, performance.now());
    }

    endLoadPhase(phase) {
        performance.mark(`${phase}-end`);
        performance.measure(phase, `${phase}-start`, `${phase}-end`);
    }

    getLoadPhases() {
        const phases = {};
        const measures = performance.getEntriesByType('measure');
        
        measures.forEach(measure => {
            phases[measure.name] = measure.duration;
        });
        
        return phases;
    }

    generateLoadingReport() {
        const resources = Array.from(this.metrics.values());
        const phases = this.getLoadPhases();
        
        const totalSize = resources.reduce((sum, res) => sum + res.size, 0);
        const totalDuration = resources.reduce((sum, res) => sum + res.duration, 0);
        
        return {
            summary: {
                totalResources: resources.length,
                totalSize,
                totalDuration,
                averageLoadTime: totalDuration / resources.length
            },
            byType: this.groupByType(resources),
            slowResources: resources.filter(r => r.duration > 1000),
            loadPhases: phases
        };
    }

    groupByType(resources) {
        const groups = {};
        
        resources.forEach(resource => {
            if (!groups[resource.type]) {
                groups[resource.type] = {
                    count: 0,
                    totalSize: 0,
                    totalDuration: 0
                };
            }
            
            groups[resource.type].count++;
            groups[resource.type].totalSize += resource.size;
            groups[resource.type].totalDuration += resource.duration;
        });
        
        return groups;
    }
}
```