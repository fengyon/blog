# 内存管理

## 内存管理基础

### WebGL 内存架构
```
WebGL 内存层次:
JavaScript 堆内存 ←→ GPU 显存 ←→ 系统内存
     ↓                    ↓           ↓
对象引用           纹理/缓冲区     驱动程序管理
垃圾回收           GPU资源        内存交换
```

### 内存生命周期
```
资源创建 → 使用中 → 未使用 → 垃圾回收
    ↓         ↓        ↓         ↓
分配内存   频繁访问   缓存池    手动释放
上传GPU   状态绑定   等待复用   dispose()
```

## 内存监控与分析

### 内存使用追踪
```javascript
class MemoryMonitor {
    constructor() {
        this.trackedResources = new Map();
        this.memoryUsage = {
            geometries: 0,
            textures: 0,
            programs: 0,
            total: 0
        };
        this.peakUsage = 0;
        
        this.setupMemoryTracking();
    }
    
    setupMemoryTracking() {
        // 定期检查内存使用情况
        setInterval(() => this.updateMemoryStats(), 1000);
    }
    
    trackGeometry(key, geometry) {
        const size = this.calculateGeometrySize(geometry);
        this.trackedResources.set(key, {
            type: 'geometry',
            size: size,
            geometry: geometry,
            lastUsed: Date.now()
        });
        this.memoryUsage.geometries += size;
        this.updateTotal();
    }
    
    trackTexture(key, texture) {
        const size = this.calculateTextureSize(texture);
        this.trackedResources.set(key, {
            type: 'texture',
            size: size,
            texture: texture,
            lastUsed: Date.now()
        });
        this.memoryUsage.textures += size;
        this.updateTotal();
    }
    
    calculateGeometrySize(geometry) {
        let size = 0;
        
        // 顶点数据
        if (geometry.attributes.position) {
            size += geometry.attributes.position.array.byteLength;
        }
        if (geometry.attributes.normal) {
            size += geometry.attributes.normal.array.byteLength;
        }
        if (geometry.attributes.uv) {
            size += geometry.attributes.uv.array.byteLength;
        }
        
        // 索引数据
        if (geometry.index) {
            size += geometry.index.array.byteLength;
        }
        
        return size;
    }
    
    calculateTextureSize(texture) {
        if (!texture.image) return 0;
        
        const width = texture.image.width || 1;
        const height = texture.image.height || 1;
        
        // 估算纹理内存 (RGBA * 4 bytes)
        let bytesPerPixel = 4;
        if (texture.format === THREE.RGBFormat) bytesPerPixel = 3;
        if (texture.type === THREE.FloatType) bytesPerPixel *= 4;
        
        return width * height * bytesPerPixel;
    }
    
    updateTotal() {
        this.memoryUsage.total = 
            this.memoryUsage.geometries + 
            this.memoryUsage.textures + 
            this.memoryUsage.programs;
        
        this.peakUsage = Math.max(this.peakUsage, this.memoryUsage.total);
    }
    
    getMemoryStats() {
        return {
            current: this.memoryUsage.total,
            peak: this.peakUsage,
            breakdown: { ...this.memoryUsage },
            resourceCount: this.trackedResources.size
        };
    }
    
    findMemoryHogs(limit = 10) {
        return Array.from(this.trackedResources.entries())
            .sort((a, b) => b[1].size - a[1].size)
            .slice(0, limit)
            .map(([key, resource]) => ({
                key,
                type: resource.type,
                size: resource.size,
                lastUsed: resource.lastUsed
            }));
    }
}
```

### 性能内存分析
```javascript
class MemoryProfiler {
    constructor() {
        this.snapshots = [];
        this.leakDetector = new LeakDetector();
    }
    
    takeSnapshot(label) {
        if (window.performance && performance.memory) {
            const memory = performance.memory;
            const snapshot = {
                label,
                timestamp: Date.now(),
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit
            };
            
            this.snapshots.push(snapshot);
            return snapshot;
        }
        return null;
    }
    
    analyzeMemoryGrowth() {
        if (this.snapshots.length < 2) return null;
        
        const growth = [];
        for (let i = 1; i < this.snapshots.length; i++) {
            const current = this.snapshots[i];
            const previous = this.snapshots[i - 1];
            
            const growthAmount = current.usedJSHeapSize - previous.usedJSHeapSize;
            const growthTime = current.timestamp - previous.timestamp;
            
            growth.push({
                period: `${previous.label} → ${current.label}`,
                growth: growthAmount,
                rate: growthAmount / (growthTime / 1000), // bytes per second
                duration: growthTime
            });
        }
        
        return growth;
    }
    
    detectMemoryLeaks() {
        return this.leakDetector.analyze(this.snapshots);
    }
    
    generateReport() {
        const growth = this.analyzeMemoryGrowth();
        const leaks = this.detectMemoryLeaks();
        
        return {
            summary: {
                totalSnapshots: this.snapshots.length,
                totalDuration: this.snapshots.length > 0 ? 
                    this.snapshots[this.snapshots.length - 1].timestamp - this.snapshots[0].timestamp : 0,
                averageGrowth: growth ? growth.reduce((sum, g) => sum + g.growth, 0) / growth.length : 0
            },
            growthAnalysis: growth,
            leakDetection: leaks
        };
    }
}

class LeakDetector {
    analyze(snapshots) {
        const leaks = [];
        const threshold = 1024 * 1024; // 1MB 增长阈值
        
        for (let i = 2; i < snapshots.length; i++) {
            const trend = this.calculateTrend(snapshots.slice(0, i + 1));
            if (trest.growth > threshold && trend.confidence > 0.8) {
                leaks.push({
                    detectedAt: snapshots[i].label,
                    estimatedLeakSize: trend.growth,
                    confidence: trend.confidence
                });
            }
        }
        
        return leaks;
    }
    
    calculateTrend(snapshots) {
        // 简单线性回归分析内存增长趋势
        const n = snapshots.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        
        snapshots.forEach((snapshot, index) => {
            const x = index;
            const y = snapshot.usedJSHeapSize;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        });
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const growth = slope * n; // 总增长量
        
        // 计算趋势置信度
        const meanY = sumY / n;
        let ssTot = 0, ssRes = 0;
        
        snapshots.forEach((snapshot, index) => {
            const y = snapshot.usedJSHeapSize;
            const yPred = slope * index + (sumY / n - slope * sumX / n);
            ssTot += Math.pow(y - meanY, 2);
            ssRes += Math.pow(y - yPred, 2);
        });
        
        const confidence = 1 - (ssRes / ssTot);
        
        return { growth, confidence };
    }
}
```

## 资源生命周期管理

### 智能资源管理器
```javascript
class ResourceManager {
    constructor() {
        this.resources = new Map();
        this.referenceCounts = new Map();
        this.disposalQueue = new Set();
        this.autoCleanup = true;
        
        this.setupCleanupInterval();
    }
    
    registerResource(key, resource, type) {
        const resourceInfo = {
            resource,
            type,
            size: this.estimateSize(resource, type),
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            accessCount: 0
        };
        
        this.resources.set(key, resourceInfo);
        this.referenceCounts.set(key, 1);
        
        return key;
    }
    
    acquireReference(key) {
        if (this.referenceCounts.has(key)) {
            const count = this.referenceCounts.get(key);
            this.referenceCounts.set(key, count + 1);
            
            const resourceInfo = this.resources.get(key);
            resourceInfo.lastAccessed = Date.now();
            resourceInfo.accessCount++;
            
            // 从处置队列中移除
            this.disposalQueue.delete(key);
        }
        return this.resources.get(key)?.resource;
    }
    
    releaseReference(key) {
        if (this.referenceCounts.has(key)) {
            const count = this.referenceCounts.get(key) - 1;
            this.referenceCounts.set(key, count);
            
            if (count === 0) {
                if (this.autoCleanup) {
                    this.scheduleDisposal(key);
                }
            }
        }
    }
    
    scheduleDisposal(key) {
        this.disposalQueue.add(key);
    }
    
    forceDispose(key) {
        if (this.resources.has(key)) {
            const resourceInfo = this.resources.get(key);
            this.disposeResource(resourceInfo.resource, resourceInfo.type);
            
            this.resources.delete(key);
            this.referenceCounts.delete(key);
            this.disposalQueue.delete(key);
        }
    }
    
    disposeResource(resource, type) {
        try {
            if (resource.dispose && typeof resource.dispose === 'function') {
                resource.dispose();
            } else {
                // 手动释放不同类型的资源
                switch (type) {
                    case 'geometry':
                        this.disposeGeometry(resource);
                        break;
                    case 'texture':
                        this.disposeTexture(resource);
                        break;
                    case 'material':
                        this.disposeMaterial(resource);
                        break;
                }
            }
        } catch (error) {
            console.warn('Error disposing resource:', error);
        }
    }
    
    disposeGeometry(geometry) {
        if (geometry.attributes) {
            Object.values(geometry.attributes).forEach(attribute => {
                if (attribute.array && attribute.array.buffer) {
                    // 清除数组引用
                    attribute.array = null;
                }
            });
        }
        if (geometry.index) {
            geometry.index.array = null;
        }
    }
    
    disposeTexture(texture) {
        if (texture.image) {
            texture.image = null;
        }
    }
    
    setupCleanupInterval() {
        setInterval(() => this.cleanup(), 30000); // 每30秒清理一次
    }
    
    cleanup() {
        const now = Date.now();
        const cleanupThreshold = 60000; // 1分钟
        
        for (const key of this.disposalQueue) {
            const resourceInfo = this.resources.get(key);
            if (resourceInfo && now - resourceInfo.lastAccessed > cleanupThreshold) {
                this.forceDispose(key);
            }
        }
    }
    
    estimateSize(resource, type) {
        switch (type) {
            case 'geometry':
                return this.estimateGeometrySize(resource);
            case 'texture':
                return this.estimateTextureSize(resource);
            case 'material':
                return 1024; // 固定估计值
            default:
                return 0;
        }
    }
    
    getResourceStats() {
        let totalSize = 0;
        const typeStats = {};
        
        for (const [key, info] of this.resources) {
            totalSize += info.size;
            typeStats[info.type] = (typeStats[info.type] || 0) + info.size;
        }
        
        return {
            totalResources: this.resources.size,
            totalSize,
            typeStats,
            referencedResources: Array.from(this.referenceCounts.values())
                .filter(count => count > 0).length,
            queuedForDisposal: this.disposalQueue.size
        };
    }
}
```

### 对象池系统
```javascript
class ObjectPool {
    constructor(createFn, resetFn = null, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.available = [];
        this.inUse = new Set();
        
        this.initialize(initialSize);
    }
    
    initialize(size) {
        for (let i = 0; i < size; i++) {
            this.available.push(this.createFn());
        }
    }
    
    acquire() {
        let obj;
        
        if (this.available.length > 0) {
            obj = this.available.pop();
        } else {
            obj = this.createFn();
        }
        
        this.inUse.add(obj);
        return obj;
    }
    
    release(obj) {
        if (this.inUse.has(obj)) {
            if (this.resetFn) {
                this.resetFn(obj);
            }
            
            this.inUse.delete(obj);
            this.available.push(obj);
        }
    }
    
    releaseAll() {
        for (const obj of this.inUse) {
            if (this.resetFn) {
                this.resetFn(obj);
            }
            this.available.push(obj);
        }
        this.inUse.clear();
    }
    
    preallocate(count) {
        const needed = count - (this.available.length + this.inUse.size);
        if (needed > 0) {
            for (let i = 0; i < needed; i++) {
                this.available.push(this.createFn());
            }
        }
    }
    
    getStats() {
        return {
            available: this.available.length,
            inUse: this.inUse.size,
            total: this.available.length + this.inUse.size
        };
    }
}

// 专用对象池
class GeometryPool extends ObjectPool {
    constructor(geometryTemplate, initialSize = 10) {
        super(
            () => geometryTemplate.clone(),
            (geometry) => {
                // 重置几何体状态
                geometry.position.set(0, 0, 0);
                geometry.rotation.set(0, 0, 0);
                geometry.scale.set(1, 1, 1);
                geometry.visible = true;
            },
            initialSize
        );
    }
}

class MaterialPool extends ObjectPool {
    constructor(materialTemplate, initialSize = 5) {
        super(
            () => materialTemplate.clone(),
            (material) => {
                // 重置材质状态
                material.opacity = materialTemplate.opacity;
                material.transparent = materialTemplate.transparent;
            },
            initialSize
        );
    }
}
```

## GPU 内存管理

### WebGL 资源管理
```javascript
class WebGLResourceManager {
    constructor(gl) {
        this.gl = gl;
        this.buffers = new Map();
        this.textures = new Map();
        this.programs = new Map();
        this.framebuffers = new Map();
        this.renderbuffers = new Map();
        
        this.setupResourceTracking();
    }
    
    setupResourceTracking() {
        // 包装 WebGL 函数以跟踪资源
        this.wrapGLCreationFunctions();
    }
    
    wrapGLCreationFunctions() {
        const originalCreateBuffer = this.gl.createBuffer;
        this.gl.createBuffer = () => {
            const buffer = originalCreateBuffer.call(this.gl);
            this.trackBuffer(buffer);
            return buffer;
        };
        
        const originalCreateTexture = this.gl.createTexture;
        this.gl.createTexture = () => {
            const texture = originalCreateTexture.call(this.gl);
            this.trackTexture(texture);
            return texture;
        };
        
        const originalCreateProgram = this.gl.createProgram;
        this.gl.createProgram = () => {
            const program = originalCreateProgram.call(this.gl);
            this.trackProgram(program);
            return program;
        };
    }
    
    trackBuffer(buffer) {
        this.buffers.set(buffer, {
            size: 0,
            usage: null,
            lastUsed: Date.now()
        });
    }
    
    trackTexture(texture) {
        this.textures.set(texture, {
            width: 0,
            height: 0,
            format: null,
            size: 0,
            lastUsed: Date.now()
        });
    }
    
    updateBufferData(buffer, data, usage) {
        if (this.buffers.has(buffer)) {
            const info = this.buffers.get(buffer);
            info.size = data.byteLength;
            info.usage = usage;
            info.lastUsed = Date.now();
        }
    }
    
    updateTextureData(texture, width, height, format, type) {
        if (this.textures.has(texture)) {
            const info = this.textures.get(texture);
            info.width = width;
            info.height = height;
            info.format = format;
            
            // 估算纹理大小
            let bytesPerPixel = 4;
            if (format === this.gl.RGB) bytesPerPixel = 3;
            if (type === this.gl.FLOAT) bytesPerPixel *= 4;
            
            info.size = width * height * bytesPerPixel;
            info.lastUsed = Date.now();
        }
    }
    
    cleanupUnusedResources(ageThreshold = 60000) { // 1分钟
        const now = Date.now();
        
        // 清理缓冲区
        for (const [buffer, info] of this.buffers) {
            if (now - info.lastUsed > ageThreshold) {
                this.gl.deleteBuffer(buffer);
                this.buffers.delete(buffer);
            }
        }
        
        // 清理纹理
        for (const [texture, info] of this.textures) {
            if (now - info.lastUsed > ageThreshold) {
                this.gl.deleteTexture(texture);
                this.textures.delete(texture);
            }
        }
    }
    
    getGPUMemoryUsage() {
        let total = 0;
        const breakdown = {
            buffers: 0,
            textures: 0,
            programs: 0
        };
        
        for (const info of this.buffers.values()) {
            total += info.size;
            breakdown.buffers += info.size;
        }
        
        for (const info of this.textures.values()) {
            total += info.size;
            breakdown.textures += info.size;
        }
        
        return { total, breakdown };
    }
    
    // 内存压力处理
    handleMemoryPressure() {
        const memoryUsage = this.getGPUMemoryUsage();
        
        if (memoryUsage.total > this.getMemoryBudget()) {
            this.aggressiveCleanup();
        }
    }
    
    getMemoryBudget() {
        // 基于设备能力的启发式内存预算
        if (this.isLowEndDevice()) {
            return 128 * 1024 * 1024; // 128MB
        }
        return 512 * 1024 * 1024; // 512MB
    }
    
    isLowEndDevice() {
        // 简单的设备能力检测
        const canvas = this.gl.canvas;
        const maxSize = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
        return maxSize < 4096;
    }
    
    aggressiveCleanup() {
        // 更激进的清理策略
        const now = Date.now();
        const shortThreshold = 10000; // 10秒
        
        for (const [buffer, info] of this.buffers) {
            if (now - info.lastUsed > shortThreshold) {
                this.gl.deleteBuffer(buffer);
                this.buffers.delete(buffer);
            }
        }
        
        for (const [texture, info] of this.textures) {
            if (now - info.lastUsed > shortThreshold && !info.isEssential) {
                this.gl.deleteTexture(texture);
                this.textures.delete(texture);
            }
        }
    }
}
```

## 缓存策略

### 智能缓存系统
```javascript
class SmartCache {
    constructor(maxSize = 100 * 1024 * 1024) { // 100MB
        this.maxSize = maxSize;
        this.currentSize = 0;
        this.items = new Map();
        this.accessQueue = [];
        this.hitCount = 0;
        this.missCount = 0;
    }
    
    set(key, value, size, metadata = {}) {
        // 如果缓存已满，移除最旧的项
        while (this.currentSize + size > this.maxSize && this.items.size > 0) {
            this.evictOldest();
        }
        
        this.items.set(key, {
            value,
            size,
            metadata,
            lastAccessed: Date.now(),
            accessCount: 0
        });
        
        this.currentSize += size;
        this.maintainAccessQueue(key);
    }
    
    get(key) {
        if (this.items.has(key)) {
            const item = this.items.get(key);
            item.lastAccessed = Date.now();
            item.accessCount++;
            this.hitCount++;
            
            this.maintainAccessQueue(key);
            return item.value;
        }
        
        this.missCount++;
        return null;
    }
    
    maintainAccessQueue(key) {
        // 从队列中移除现有项
        this.accessQueue = this.accessQueue.filter(k => k !== key);
        // 添加到队列末尾
        this.accessQueue.push(key);
    }
    
    evictOldest() {
        if (this.accessQueue.length > 0) {
            const oldestKey = this.accessQueue.shift();
            this.evict(oldestKey);
        }
    }
    
    evict(key) {
        if (this.items.has(key)) {
            const item = this.items.get(key);
            this.currentSize -= item.size;
            this.items.delete(key);
            
            // 如果资源有清理方法，调用它
            if (item.value && typeof item.value.dispose === 'function') {
                item.value.dispose();
            }
        }
    }
    
    evictByPattern(pattern) {
        for (const [key, item] of this.items) {
            if (key.match(pattern)) {
                this.evict(key);
            }
        }
    }
    
    preload(keys, loadFn) {
        keys.forEach(key => {
            if (!this.items.has(key)) {
                const { value, size } = loadFn(key);
                this.set(key, value, size);
            }
        });
    }
    
    getStats() {
        const hitRate = this.hitCount / (this.hitCount + this.missCount) || 0;
        
        return {
            size: this.currentSize,
            maxSize: this.maxSize,
            items: this.items.size,
            hitRate: hitRate,
            hitCount: this.hitCount,
            missCount: this.missCount,
            efficiency: this.calculateEfficiency()
        };
    }
    
    calculateEfficiency() {
        let weightedAccess = 0;
        let totalSize = 0;
        
        for (const item of this.items.values()) {
            weightedAccess += item.accessCount * item.size;
            totalSize += item.size;
        }
        
        return totalSize > 0 ? weightedAccess / totalSize : 0;
    }
    
    // 基于使用模式的智能预取
    analyzeAccessPattern() {
        const patterns = {};
        
        for (const [key, item] of this.items) {
            const pattern = this.extractPattern(key);
            if (!patterns[pattern]) {
                patterns[pattern] = {
                    totalAccess: 0,
                    totalSize: 0,
                    count: 0
                };
            }
            
            patterns[pattern].totalAccess += item.accessCount;
            patterns[pattern].totalSize += item.size;
            patterns[pattern].count++;
        }
        
        return patterns;
    }
    
    extractPattern(key) {
        // 从key中提取模式，例如 "texture_512x512" → "texture_*x*"
        return key.replace(/\d+/g, '*');
    }
}
```

### 分层缓存系统
```javascript
class LayeredCache {
    constructor() {
        this.layers = new Map();
        this.accessHistory = [];
        this.setupDefaultLayers();
    }
    
    setupDefaultLayers() {
        // L1: 高频小资源 (内存缓存)
        this.addLayer('L1', {
            maxSize: 10 * 1024 * 1024, // 10MB
            evictionPolicy: 'LRU',
            priority: 1
        });
        
        // L2: 中频中等资源
        this.addLayer('L2', {
            maxSize: 50 * 1024 * 1024, // 50MB
            evictionPolicy: 'LFU',
            priority: 2
        });
        
        // L3: 低频大资源 (可能存储在IndexedDB)
        this.addLayer('L3', {
            maxSize: 200 * 1024 * 1024, // 200MB
            evictionPolicy: 'SIZE',
            priority: 3
        });
    }
    
    addLayer(name, config) {
        this.layers.set(name, {
            cache: new SmartCache(config.maxSize),
            config: config,
            stats: {
                hits: 0,
                misses: 0
            }
        });
    }
    
    set(key, value, size, metadata = {}) {
        const accessPattern = this.analyzeAccessPattern(key);
        const targetLayer = this.selectLayer(size, accessPattern);
        
        targetLayer.cache.set(key, value, size, metadata);
        this.recordAccess(key, size);
    }
    
    get(key) {
        // 从L1开始逐层查找
        for (const [layerName, layer] of this.getLayersByPriority()) {
            const value = layer.cache.get(key);
            if (value !== null) {
                layer.stats.hits++;
                
                // 如果找到且在较低层级，考虑提升到更高层级
                if (layer.config.priority > 1) {
                    this.considerPromotion(key, layerName);
                }
                
                return value;
            }
            layer.stats.misses++;
        }
        
        return null;
    }
    
    getLayersByPriority() {
        return Array.from(this.layers.entries())
            .sort((a, b) => a[1].config.priority - b[1].config.priority);
    }
    
    selectLayer(size, accessPattern) {
        // 基于大小和访问模式选择合适层级
        const layers = this.getLayersByPriority();
        
        for (const [name, layer] of layers) {
            if (size <= layer.cache.maxSize * 0.1) { // 不超过层级容量的10%
                return layer;
            }
        }
        
        // 如果都放不下，返回最大层级
        return layers[layers.length - 1][1];
    }
    
    considerPromotion(key, currentLayer) {
        const layer = this.layers.get(currentLayer);
        const item = layer.cache.items.get(key);
        
        if (item && item.accessCount > 5) { // 访问次数阈值
            const higherLayer = this.getNextHigherLayer(currentLayer);
            if (higherLayer) {
                // 移动到更高层级
                higherLayer.cache.set(key, item.value, item.size, item.metadata);
                layer.cache.evict(key);
            }
        }
    }
    
    getNextHigherLayer(currentLayer) {
        const currentPriority = this.layers.get(currentLayer).config.priority;
        for (const [name, layer] of this.layers) {
            if (layer.config.priority === currentPriority - 1) {
                return layer;
            }
        }
        return null;
    }
    
    analyzeAccessPattern(key) {
        const history = this.accessHistory.filter(access => access.key === key);
        const recentAccess = history.slice(-10); // 最近10次访问
        
        return {
            frequency: recentAccess.length,
            recency: Date.now() - (recentAccess[0]?.timestamp || 0),
            pattern: this.extractAccessPattern(history)
        };
    }
    
    recordAccess(key, size) {
        this.accessHistory.push({
            key,
            size,
            timestamp: Date.now()
        });
        
        // 保持历史记录大小
        if (this.accessHistory.length > 1000) {
            this.accessHistory = this.accessHistory.slice(-500);
        }
    }
    
    getCacheStats() {
        const stats = {
            layers: {},
            overall: {
                hits: 0,
                misses: 0,
                hitRate: 0,
                totalSize: 0
            }
        };
        
        for (const [name, layer] of this.layers) {
            const layerStats = layer.cache.getStats();
            stats.layers[name] = {
                ...layerStats,
                hits: layer.stats.hits,
                misses: layer.stats.misses
            };
            
            stats.overall.hits += layer.stats.hits;
            stats.overall.misses += layer.stats.misses;
            stats.overall.totalSize += layerStats.size;
        }
        
        const totalAccess = stats.overall.hits + stats.overall.misses;
        stats.overall.hitRate = totalAccess > 0 ? stats.overall.hits / totalAccess : 0;
        
        return stats;
    }
}
```

## 内存优化策略

### 垃圾回收优化
```javascript
class GarbageCollectionOptimizer {
    constructor() {
        this.gcTriggers = new Set();
        this.gcAvoidanceZones = new Set();
        this.lastGCTime = 0;
        this.gcCount = 0;
        
        this.setupGCMonitoring();
    }
    
    setupGCMonitoring() {
        if (window.gc) {
            // 在开发环境中可以手动触发GC进行测试
            this.manualGC = window.gc;
        }
        
        // 监听可能触发GC的操作
        this.monitorGCPotential();
    }
    
    monitorGCPotential() {
        let largeAllocationCount = 0;
        const originalPush = Array.prototype.push;
        
        // 监控大数组操作
        Array.prototype.push = function(...args) {
            if (this.length + args.length > 10000) {
                largeAllocationCount++;
                if (largeAllocationCount > 10) {
                    GarbageCollectionOptimizer.instance.recordGCPotential('large_array_allocation');
                }
            }
            return originalPush.apply(this, args);
        };
    }
    
    recordGCPotential(reason) {
        this.gcTriggers.add({
            reason,
            timestamp: Date.now(),
            stack: new Error().stack
        });
    }
    
    enterGCAvoidanceZone() {
        const zone = {
            id: Math.random().toString(36).substr(2, 9),
            startTime: Date.now(),
            allowedAllocations: 0
        };
        
        this.gcAvoidanceZones.add(zone);
        return zone.id;
    }
    
    exitGCAvoidanceZone(zoneId) {
        for (const zone of this.gcAvoidanceZones) {
            if (zone.id === zoneId) {
                this.gcAvoidanceZones.delete(zone);
                break;
            }
        }
    }
    
    shouldAvoidGC() {
        return this.gcAvoidanceZones.size > 0;
    }
    
    // 手动内存整理
    defragment() {
        console.log('Starting memory defragmentation...');
        
        // 强制GC（如果可用）
        if (this.manualGC) {
            this.manualGC();
        }
        
        // 整理对象池
        this.defragmentObjectPools();
        
        // 清理缓存
        this.defragmentCaches();
        
        console.log('Memory defragmentation completed');
    }
    
    defragmentObjectPools() {
        // 释放未使用的对象池实例
        for (const pool of ObjectPool.instances || []) {
            if (pool.getStats().available > pool.getStats().inUse * 2) {
                // 释放一半的可用对象
                const toRelease = Math.floor(pool.available.length / 2);
                pool.available.length = pool.available.length - toRelease;
            }
        }
    }
    
    defragmentCaches() {
        // 清理低效的缓存项
        for (const cache of SmartCache.instances || []) {
            const stats = cache.getStats();
            if (stats.efficiency < 0.1) { // 效率阈值
                cache.evictByPattern(/.*/); // 清理所有项
            }
        }
    }
    
    generateMemoryReport() {
        const report = {
            gcTriggers: Array.from(this.gcTriggers),
            avoidanceZones: this.gcAvoidanceZones.size,
            lastGCTime: this.lastGCTime,
            gcCount: this.gcCount,
            memoryState: this.getMemoryState()
        };
        
        return report;
    }
    
    getMemoryState() {
        if (window.performance && performance.memory) {
            const memory = performance.memory;
            return {
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit,
                usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
            };
        }
        return null;
    }
}

// 单例模式
GarbageCollectionOptimizer.instance = new GarbageCollectionOptimizer();
```

### 内存预算系统
```javascript
class MemoryBudgetSystem {
    constructor() {
        this.budgets = new Map();
        this.currentUsage = new Map();
        this.overBudgetHandlers = new Map();
        
        this.setupDefaultBudgets();
    }
    
    setupDefaultBudgets() {
        // 设置默认内存预算
        this.setBudget('geometries', 50 * 1024 * 1024); // 50MB
        this.setBudget('textures', 100 * 1024 * 1024); // 100MB
        this.setBudget('materials', 10 * 1024 * 1024); // 10MB
        this.setBudget('total', 256 * 1024 * 1024); // 256MB
    }
    
    setBudget(category, budget) {
        this.budgets.set(category, budget);
        this.currentUsage.set(category, 0);
    }
    
    allocate(category, size) {
        const current = this.currentUsage.get(category) || 0;
        const budget = this.budgets.get(category);
        
        if (current + size > budget) {
            this.handleOverBudget(category, current + size, budget);
            return false;
        }
        
        this.currentUsage.set(category, current + size);
        return true;
    }
    
    release(category, size) {
        const current = this.currentUsage.get(category) || 0;
        this.currentUsage.set(category, Math.max(0, current - size));
    }
    
    handleOverBudget(category, requested, budget) {
        const handler = this.overBudgetHandlers.get(category);
        if (handler) {
            handler(requested, budget);
        } else {
            this.defaultOverBudgetHandler(category, requested, budget);
        }
    }
    
    defaultOverBudgetHandler(category, requested, budget) {
        console.warn(`Memory budget exceeded for ${category}: ${requested} > ${budget}`);
        
        // 自动尝试释放内存
        this.attemptMemoryRecovery(category);
    }
    
    attemptMemoryRecovery(category) {
        switch (category) {
            case 'geometries':
                this.releaseUnusedGeometries();
                break;
            case 'textures':
                this.compressTextures();
                break;
            case 'total':
                this.aggressiveCleanup();
                break;
        }
    }
    
    releaseUnusedGeometries() {
        // 释放长时间未使用的几何体
        const geometryManager = ResourceManager.getInstance();
        const stats = geometryManager.getResourceStats();
        
        for (const [key, info] of geometryManager.resources) {
            if (info.type === 'geometry' && Date.now() - info.lastAccessed > 30000) {
                geometryManager.forceDispose(key);
            }
        }
    }
    
    compressTextures() {
        // 降低纹理质量以节省内存
        const textureManager = TextureManager.getInstance();
        textureManager.compressTextures(0.5); // 50% 质量
    }
    
    setOverBudgetHandler(category, handler) {
        this.overBudgetHandlers.set(category, handler);
    }
    
    getBudgetStatus() {
        const status = {};
        
        for (const [category, budget] of this.budgets) {
            const usage = this.currentUsage.get(category) || 0;
            status[category] = {
                usage,
                budget,
                percentage: (usage / budget) * 100,
                remaining: budget - usage
            };
        }
        
        return status;
    }
    
    isUnderBudget(category, margin = 0.1) {
        const status = this.get