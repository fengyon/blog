# 渲染优化

## 性能分析基础

### 性能指标监控
```javascript
class PerformanceMonitor {
    constructor() {
        this.frameTimes = [];
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        
        this.setupMonitoring();
    }
    
    setupMonitoring() {
        // 使用 Performance API 监控
        if (performance.mark) {
            performance.mark('render-start');
        }
    }
    
    beginFrame() {
        this.frameStart = performance.now();
    }
    
    endFrame() {
        const frameTime = performance.now() - this.frameStart;
        this.frameTimes.push(frameTime);
        
        // 保持最近60帧数据
        if (this.frameTimes.length > 60) {
            this.frameTimes.shift();
        }
        
        // 计算FPS
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }
    
    getStats() {
        const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        return {
            fps: this.fps,
            frameTime: avgFrameTime,
            frameTimeStd: this.calculateStdDev(),
            budget: (1000 / 60) - avgFrameTime // 60FPS预算剩余
        };
    }
    
    calculateStdDev() {
        const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        const squareDiffs = this.frameTimes.map(value => Math.pow(value - avg, 2));
        return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / this.frameTimes.length);
    }
}
```

### WebGL 状态分析
```javascript
class WebGLProfiler {
    constructor(gl) {
        this.gl = gl;
        this.drawCallCount = 0;
        this.triangleCount = 0;
        this.textureUploadSize = 0;
        
        this.wrapGLFunctions();
    }
    
    wrapGLFunctions() {
        // 包装绘制调用
        const originalDrawArrays = this.gl.drawArrays;
        this.gl.drawArrays = (...args) => {
            this.drawCallCount++;
            this.countTriangles('drawArrays', args);
            return originalDrawArrays.apply(this.gl, args);
        };
        
        const originalDrawElements = this.gl.drawElements;
        this.gl.drawElements = (...args) => {
            this.drawCallCount++;
            this.countTriangles('drawElements', args);
            return originalDrawElements.apply(this.gl, args);
        };
        
        // 包装纹理上传
        const originalTexImage2D = this.gl.texImage2D;
        this.gl.texImage2D = (...args) => {
            if (args.length >= 7 && args[6]) {
                this.textureUploadSize += this.calculateTextureSize(args);
            }
            return originalTexImage2D.apply(this.gl, args);
        };
    }
    
    countTriangles(method, args) {
        if (method === 'drawArrays') {
            const mode = args[0];
            const count = args[2];
            this.triangleCount += this.verticesToTriangles(mode, count);
        } else if (method === 'drawElements') {
            const mode = args[0];
            const count = args[2];
            this.triangleCount += this.verticesToTriangles(mode, count);
        }
    }
    
    verticesToTriangles(mode, count) {
        switch (mode) {
            case this.gl.TRIANGLES: return count / 3;
            case this.gl.TRIANGLE_STRIP: return count - 2;
            case this.gl.TRIANGLE_FAN: return count - 2;
            default: return 0;
        }
    }
    
    calculateTextureSize(args) {
        // 估算纹理内存占用
        const [target, level, internalFormat, width, height, border, format, type, pixels] = args;
        
        let bytesPerPixel = 4; // 默认RGBA
        if (format === this.gl.RGB) bytesPerPixel = 3;
        if (type === this.gl.FLOAT) bytesPerPixel *= 4;
        
        return width * height * bytesPerPixel;
    }
    
    resetFrame() {
        this.drawCallCount = 0;
        this.triangleCount = 0;
        this.textureUploadSize = 0;
    }
    
    getStats() {
        return {
            drawCalls: this.drawCallCount,
            triangles: this.triangleCount,
            textureUpload: this.textureUploadSize
        };
    }
}
```

## 几何体优化

### 几何体压缩
```javascript
class GeometryCompressor {
    static compressGeometry(geometry) {
        const compressed = {
            positions: this.quantizePositions(geometry.attributes.position.array),
            normals: this.quantizeNormals(geometry.attributes.normal.array),
            uvs: this.quantizeUVs(geometry.attributes.uv.array),
            indices: geometry.index ? Array.from(geometry.index.array) : null
        };
        
        return compressed;
    }
    
    static quantizePositions(positions, precision = 1024) {
        // 找到边界框
        const min = new THREE.Vector3(Infinity, Infinity, Infinity);
        const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
        
        for (let i = 0; i < positions.length; i += 3) {
            min.x = Math.min(min.x, positions[i]);
            min.y = Math.min(min.y, positions[i + 1]);
            min.z = Math.min(min.z, positions[i + 2]);
            max.x = Math.max(max.x, positions[i]);
            max.y = Math.max(max.y, positions[i + 1]);
            max.z = Math.max(max.z, positions[i + 2]);
        }
        
        const range = new THREE.Vector3().subVectors(max, min);
        const quantized = new Uint16Array(positions.length);
        
        for (let i = 0; i < positions.length; i += 3) {
            quantized[i] = Math.round((positions[i] - min.x) / range.x * precision);
            quantized[i + 1] = Math.round((positions[i + 1] - min.y) / range.y * precision);
            quantized[i + 2] = Math.round((positions[i + 2] - min.z) / range.z * precision);
        }
        
        return {
            data: quantized,
            min: [min.x, min.y, min.z],
            range: [range.x, range.y, range.z],
            precision: precision
        };
    }
    
    static quantizeNormals(normals) {
        // 将法线从 Float32 转换为 Int8
        const quantized = new Int8Array(normals.length);
        for (let i = 0; i < normals.length; i++) {
            quantized[i] = Math.round(normals[i] * 127);
        }
        return quantized;
    }
    
    static quantizeUVs(uvs) {
        // UV 坐标通常不需要高精度
        const quantized = new Uint16Array(uvs.length);
        for (let i = 0; i < uvs.length; i += 2) {
            quantized[i] = Math.round(uvs[i] * 65535);
            quantized[i + 1] = Math.round(uvs[i + 1] * 65535);
        }
        return quantized;
    }
}
```

### 细节层次 (LOD)
```javascript
class LODSystem {
    constructor() {
        this.lodLevels = new Map();
        this.distanceThresholds = [10, 25, 50, 100];
    }
    
    createLODForObject(object, lodConfig) {
        const lodGroup = new THREE.LOD();
        
        lodConfig.levels.forEach((level, index) => {
            const geometry = this.createSimplifiedGeometry(
                object.geometry, 
                level.simplification
            );
            
            const mesh = new THREE.Mesh(geometry, object.material);
            lodGroup.addLevel(mesh, this.distanceThresholds[index]);
        });
        
        this.lodLevels.set(object, lodGroup);
        return lodGroup;
    }
    
    createSimplifiedGeometry(originalGeometry, factor) {
        if (factor >= 0.8) return originalGeometry.clone();
        
        const geometry = originalGeometry.clone();
        const positionAttribute = geometry.getAttribute('position');
        
        if (factor <= 0.3) {
            // 对于高度简化，使用更激进的方法
            return this.aggressiveSimplify(geometry, factor);
        }
        
        // 简化顶点数据
        const simplifiedPositions = [];
        const vertexMap = new Map();
        
        for (let i = 0; i < positionAttribute.count; i++) {
            if (Math.random() > factor) continue; // 随机采样
            
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            const z = positionAttribute.getZ(i);
            
            const key = `${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`;
            if (!vertexMap.has(key)) {
                vertexMap.set(key, simplifiedPositions.length / 3);
                simplifiedPositions.push(x, y, z);
            }
        }
        
        // 创建新的简化几何体
        const simplifiedGeometry = new THREE.BufferGeometry();
        simplifiedGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(simplifiedPositions, 3)
        );
        
        return simplifiedGeometry;
    }
    
    aggressiveSimplify(geometry, factor) {
        // 使用边界球简化
        const boundingSphere = new THREE.Sphere();
        geometry.boundingSphere = boundingSphere;
        
        // 创建非常简化的几何体表示
        const simplified = new THREE.SphereGeometry(
            boundingSphere.radius * 0.5,
            Math.max(4, Math.round(8 * factor)),
            Math.max(2, Math.round(4 * factor))
        );
        
        return simplified;
    }
    
    updateLOD(cameraPosition) {
        for (const [object, lodGroup] of this.lodLevels) {
            const distance = cameraPosition.distanceTo(lodGroup.position);
            lodGroup.update(distance);
        }
    }
}
```

## 渲染状态优化

### 绘制调用合并
```javascript
class BatchRenderer {
    constructor(gl) {
        this.gl = gl;
        this.batches = new Map();
        this.mergedGeometries = new Map();
    }
    
    addToBatch(key, geometry, material, matrix) {
        if (!this.batches.has(key)) {
            this.batches.set(key, {
                geometries: [],
                material: material,
                matrices: []
            });
        }
        
        const batch = this.batches.get(key);
        batch.geometries.push(geometry);
        batch.matrices.push(matrix);
    }
    
    mergeBatch(key) {
        const batch = this.batches.get(key);
        if (!batch || batch.geometries.length === 0) return null;
        
        if (batch.geometries.length === 1) {
            // 单个几何体，不需要合并
            return {
                geometry: batch.geometries[0],
                material: batch.material,
                matrices: batch.matrices
            };
        }
        
        // 合并多个几何体
        const mergedGeometry = this.mergeGeometries(batch.geometries);
        this.mergedGeometries.set(key, mergedGeometry);
        
        return {
            geometry: mergedGeometry,
            material: batch.material,
            matrices: batch.matrices
        };
    }
    
    mergeGeometries(geometries) {
        const merged = new THREE.BufferGeometry();
        const positions = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        
        let vertexOffset = 0;
        
        geometries.forEach(geometry => {
            // 合并顶点数据
            const posAttr = geometry.getAttribute('position');
            const normalAttr = geometry.getAttribute('normal');
            const uvAttr = geometry.getAttribute('uv');
            
            for (let i = 0; i < posAttr.count; i++) {
                positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
                if (normalAttr) {
                    normals.push(normalAttr.getX(i), normalAttr.getY(i), normalAttr.getZ(i));
                }
                if (uvAttr) {
                    uvs.push(uvAttr.getX(i), uvAttr.getY(i));
                }
            }
            
            // 合并索引数据
            if (geometry.index) {
                for (let i = 0; i < geometry.index.count; i++) {
                    indices.push(geometry.index.getX(i) + vertexOffset);
                }
            }
            
            vertexOffset += posAttr.count;
        });
        
        merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        if (normals.length > 0) {
            merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        }
        if (uvs.length > 0) {
            merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        }
        if (indices.length > 0) {
            merged.setIndex(indices);
        }
        
        return merged;
    }
    
    renderBatch(batchData) {
        const { geometry, material, matrices } = batchData;
        
        // 设置几何体和材质
        this.setupGeometry(geometry);
        this.setupMaterial(material);
        
        if (matrices.length === 1) {
            // 单个实例
            this.updateModelMatrix(matrices[0]);
            this.gl.drawElements(this.gl.TRIANGLES, geometry.index.count, this.gl.UNSIGNED_SHORT, 0);
        } else {
            // 实例化渲染
            this.renderInstanced(geometry, matrices);
        }
    }
    
    renderInstanced(geometry, matrices) {
        // 使用实例化数组渲染多个实例
        const matrixBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, matrixBuffer);
        
        const matrixData = new Float32Array(matrices.length * 16);
        matrices.forEach((matrix, index) => {
            matrixData.set(matrix.elements, index * 16);
        });
        
        this.gl.bufferData(this.gl.ARRAY_BUFFER, matrixData, this.gl.STATIC_DRAW);
        
        // 设置实例化属性
        for (let i = 0; i < 4; i++) {
            const location = this.getAttribLocation(`instanceMatrix_${i}`);
            this.gl.enableVertexAttribArray(location);
            this.gl.vertexAttribPointer(location, 4, this.gl.FLOAT, false, 64, i * 16);
            this.gl.vertexAttribDivisor(location, 1);
        }
        
        // 实例化绘制
        this.gl.drawElementsInstanced(
            this.gl.TRIANGLES,
            geometry.index.count,
            this.gl.UNSIGNED_SHORT,
            0,
            matrices.length
        );
    }
}
```

### 状态管理优化
```javascript
class RenderStateManager {
    constructor(gl) {
        this.gl = gl;
        this.currentState = {
            program: null,
            vertexArray: null,
            textureUnits: new Array(8).fill(null),
            blend: false,
            depthTest: false,
            cullFace: false
        };
        
        this.stateChanges = 0;
    }
    
    useProgram(program) {
        if (this.currentState.program !== program) {
            this.gl.useProgram(program);
            this.currentState.program = program;
            this.stateChanges++;
        }
    }
    
    bindVertexArray(vao) {
        if (this.currentState.vertexArray !== vao) {
            this.gl.bindVertexArray(vao);
            this.currentState.vertexArray = vao;
            this.stateChanges++;
        }
    }
    
    bindTexture(unit, texture) {
        if (this.currentState.textureUnits[unit] !== texture) {
            this.gl.activeTexture(this.gl.TEXTURE0 + unit);
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.currentState.textureUnits[unit] = texture;
            this.stateChanges++;
        }
    }
    
    setBlend(enable) {
        if (this.currentState.blend !== enable) {
            if (enable) {
                this.gl.enable(this.gl.BLEND);
            } else {
                this.gl.disable(this.gl.BLEND);
            }
            this.currentState.blend = enable;
            this.stateChanges++;
        }
    }
    
    setDepthTest(enable) {
        if (this.currentState.depthTest !== enable) {
            if (enable) {
                this.gl.enable(this.gl.DEPTH_TEST);
            } else {
                this.gl.disable(this.gl.DEPTH_TEST);
            }
            this.currentState.depthTest = enable;
            this.stateChanges++;
        }
    }
    
    setCullFace(enable) {
        if (this.currentState.cullFace !== enable) {
            if (enable) {
                this.gl.enable(this.gl.CULL_FACE);
            } else {
                this.gl.disable(this.gl.CULL_FACE);
            }
            this.currentState.cullFace = enable;
            this.stateChanges++;
        }
    }
    
    resetFrameStats() {
        this.stateChanges = 0;
    }
    
    getStats() {
        return {
            stateChanges: this.stateChanges
        };
    }
}
```

## 纹理优化

### 纹理压缩与流式加载
```javascript
class TextureOptimizer {
    constructor(gl) {
        this.gl = gl;
        this.textureCache = new Map();
        this.compressedFormats = this.detectCompressedFormats();
    }
    
    detectCompressedFormats() {
        const formats = {};
        const ext = this.gl.getExtension('WEBGL_compressed_texture_s3tc') ||
                   this.gl.getExtension('WEBGL_compressed_texture_etc') ||
                   this.gl.getExtension('WEBGL_compressed_texture_pvrtc');
        
        if (ext) {
            if (ext.COMPRESSED_RGB_S3TC_DXT1_EXT) {
                formats.dxt1 = ext.COMPRESSED_RGB_S3TC_DXT1_EXT;
            }
            if (ext.COMPRESSED_RGBA_S3TC_DXT5_EXT) {
                formats.dxt5 = ext.COMPRESSED_RGBA_S3TC_DXT5_EXT;
            }
        }
        
        return formats;
    }
    
    async loadCompressedTexture(url, format = 'dxt1') {
        const cacheKey = `${url}_${format}`;
        if (this.textureCache.has(cacheKey)) {
            return this.textureCache.get(cacheKey);
        }
        
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            
            const texture = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            
            // 解析压缩纹理数据（假设为已知格式）
            const textureData = this.parseCompressedTexture(arrayBuffer, format);
            
            this.gl.compressedTexImage2D(
                this.gl.TEXTURE_2D,
                0,
                this.compressedFormats[format],
                textureData.width,
                textureData.height,
                0,
                textureData.data
            );
            
            this.setTextureParameters();
            
            this.textureCache.set(cacheKey, texture);
            return texture;
            
        } catch (error) {
            console.error('Failed to load compressed texture:', error);
            return this.loadFallbackTexture(url);
        }
    }
    
    setTextureParameters() {
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
    }
    
    createMipmaps(texture, levels = 4) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        
        // 手动设置各层级的细节级别
        for (let i = 1; i <= levels; i++) {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAX_LEVEL, i);
        }
    }
    
    // 纹理图集
    createTextureAtlas(textures, atlasSize = 2048) {
        const canvas = document.createElement('canvas');
        canvas.width = atlasSize;
        canvas.height = atlasSize;
        const ctx = canvas.getContext('2d');
        
        const atlas = {
            texture: this.gl.createTexture(),
            regions: new Map(),
            currentX: 0,
            currentY: 0,
            rowHeight: 0
        };
        
        this.gl.bindTexture(this.gl.TEXTURE_2D, atlas.texture);
        
        // 打包纹理到图集
        textures.forEach((texture, name) => {
            const region = this.packTexture(ctx, texture, atlas);
            atlas.regions.set(name, region);
        });
        
        // 上传图集纹理
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0, this.gl.RGBA,
            this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas
        );
        
        this.setTextureParameters();
        
        return atlas;
    }
    
    packTexture(ctx, texture, atlas) {
        const img = texture.image;
        const scale = Math.min(
            (atlas.width - atlas.currentX) / img.width,
            (atlas.height - atlas.currentY) / img.height
        );
        
        const width = img.width * scale;
        const height = img.height * scale;
        
        // 检查是否需要换行
        if (atlas.currentX + width > atlas.width) {
            atlas.currentX = 0;
            atlas.currentY += atlas.rowHeight;
            atlas.rowHeight = 0;
        }
        
        ctx.drawImage(img, atlas.currentX, atlas.currentY, width, height);
        
        const region = {
            x: atlas.currentX,
            y: atlas.currentY,
            width: width,
            height: height,
            u0: atlas.currentX / atlas.width,
            v0: atlas.currentY / atlas.height,
            u1: (atlas.currentX + width) / atlas.width,
            v1: (atlas.currentY + height) / atlas.height
        };
        
        atlas.currentX += width;
        atlas.rowHeight = Math.max(atlas.rowHeight, height);
        
        return region;
    }
}
```

## 着色器优化

### 着色器复杂度管理
```javascript
class ShaderOptimizer {
    static analyzeShaderComplexity(shaderSource) {
        const analysis = {
            instructionCount: 0,
            textureSamples: 0,
            branching: 0,
            loops: 0,
            functions: 0
        };
        
        const lines = shaderSource.split('\n');
        
        lines.forEach(line => {
            const trimmed = line.trim();
            
            // 统计指令
            if (trimmed.includes('=') && trimmed.includes('+')) {
                analysis.instructionCount++;
            }
            
            // 统计纹理采样
            if (trimmed.includes('texture') || trimmed.includes('texture2D')) {
                analysis.textureSamples++;
            }
            
            // 统计分支
            if (trimmed.includes('if') || trimmed.includes('else')) {
                analysis.branching++;
            }
            
            // 统计循环
            if (trimmed.includes('for') || trimmed.includes('while')) {
                analysis.loops++;
            }
            
            // 统计函数调用
            if (trimmed.match(/[a-zA-Z_][a-zA-Z0-9_]*\(/)) {
                analysis.functions++;
            }
        });
        
        return analysis;
    }
    
    static optimizeShader(shaderSource, targetComplexity = 'medium') {
        let optimized = shaderSource;
        
        switch (targetComplexity) {
            case 'low':
                optimized = this.applyLowComplexityOptimizations(optimized);
                break;
            case 'medium':
                optimized = this.applyMediumComplexityOptimizations(optimized);
                break;
            case 'high':
                // 保持原样或应用高级优化
                break;
        }
        
        return optimized;
    }
    
    static applyLowComplexityOptimizations(shaderSource) {
        let optimized = shaderSource;
        
        // 移除复杂的光照计算
        optimized = optimized.replace(
            /vec3\s+calculate[a-zA-Z]*Lighting\([^)]*\)\s*{[^}]*}/g,
            'vec3 calculateSimpleLighting(vec3 normal, vec3 lightDir) { return vec3(1.0); }'
        );
        
        // 简化数学运算
        optimized = optimized.replace(/pow\([^,]+,\s*[0-9.]+\)/g, '1.0');
        optimized = optimized.replace(/sqrt\([^)]+\)/g, '1.0');
        
        // 移除不必要的分支
        optimized = optimized.replace(/if\s*\([^)]+\)\s*{[^}]*}/g, '');
        
        return optimized;
    }
    
    static applyMediumComplexityOptimizations(shaderSource) {
        let optimized = shaderSource;
        
        // 减少纹理采样次数
        optimized = optimized.replace(/texture2D\([^,]+,\s*[^)]+\)/g, (match) => {
            // 为重复采样添加缓存
            return match;
        });
        
        // 优化数学运算
        optimized = optimized.replace(/1\.0\s*\*\s*/g, '');
        optimized = optimized.replace(/\s*\*\s*1\.0/g, '');
        
        return optimized;
    }
    
    static precomputeShaderUniforms(shaderSource, uniforms) {
        // 预计算常量uniform值
        let optimized = shaderSource;
        
        Object.keys(uniforms).forEach(uniformName => {
            const value = uniforms[uniformName];
            if (typeof value === 'number') {
                const regex = new RegExp(`uniform\\s+float\\s+${uniformName};`, 'g');
                optimized = optimized.replace(regex, `const float ${uniformName} = ${value};`);
            }
        });
        
        return optimized;
    }
}
```

### 着色器变体系统
```javascript
class ShaderVariantSystem {
    constructor() {
        this.variants = new Map();
        this.featureFlags = new Set();
    }
    
    registerFeature(featureName, condition) {
        this.featureFlags.add(featureName);
    }
    
    createVariant(baseShader, features) {
        const variantKey = this.generateVariantKey(features);
        
        if (this.variants.has(variantKey)) {
            return this.variants.get(variantKey);
        }
        
        const variantSource = this.applyFeatures(baseShader, features);
        const variant = this.compileVariant(variantSource);
        
        this.variants.set(variantKey, variant);
        return variant;
    }
    
    generateVariantKey(features) {
        return Object.keys(features)
            .sort()
            .map(key => `${key}:${features[key]}`)
            .join('|');
    }
    
    applyFeatures(shaderSource, features) {
        let processed = shaderSource;
        
        // 处理条件编译
        Object.keys(features).forEach(feature => {
            const value = features[feature];
            const definePattern = new RegExp(`#ifdef\\s+${feature}\\s*([^#]*)#endif`, 'g');
            
            if (value) {
                // 启用特性
                processed = processed.replace(definePattern, '$1');
            } else {
                // 禁用特性
                processed = processed.replace(definePattern, '');
            }
        });
        
        // 添加特性定义
        const defines = Object.keys(features)
            .filter(feature => features[feature])
            .map(feature => `#define ${feature}`)
            .join('\n');
        
        return `#version 300 es\n${defines}\n${processed}`;
    }
    
    getOptimalVariant(performanceProfile, availableFeatures) {
        // 根据性能配置选择最佳变体
        const features = { ...availableFeatures };
        
        if (performanceProfile === 'low') {
            features.SHADOWS = false;
            features.REFLECTIONS = false;
            features.POST_PROCESSING = false;
        } else if (performanceProfile === 'medium') {
            features.SHADOWS = true;
            features.REFLECTIONS = false;
            features.POST_PROCESSING = true;
        } else {
            features.SHADOWS = true;
            features.REFLECTIONS = true;
            features.POST_PROCESSING = true;
        }
        
        return this.createVariant(this.baseShader, features);
    }
}
```

## 内存管理

### 资源池系统
```javascript
class ResourcePool {
    constructor() {
        this.geometryPool = new Map();
        this.texturePool = new Map();
        this.materialPool = new Map();
        this.maxPoolSize = 100;
    }
    
    acquireGeometry(key, createCallback) {
        if (this.geometryPool.has(key)) {
            const geometry = this.geometryPool.get(key);
            this.geometryPool.delete(key);
            return geometry;
        }
        
        return createCallback();
    }
    
    releaseGeometry(key, geometry) {
        if (this.geometryPool.size < this.maxPoolSize) {
            this.geometryPool.set(key, geometry);
        } else {
            // 池已满，销毁几何体
            geometry.dispose();
        }
    }
    
    acquireTexture(key, createCallback) {
        if (this.texturePool.has(key)) {
            const texture = this.texturePool.get(key);
            this.texturePool.delete(key);
            return texture;
        }
        
        return createCallback();
    }
    
    releaseTexture(key, texture) {
        if (this.texturePool.size < this.maxPoolSize) {
            this.texturePool.set(key, texture);
        } else {
            texture.dispose();
        }
    }
    
    cleanupUnusedResources(frameCount = 60) {
        // 清理长时间未使用的资源
        const now = Date.now();
        const cleanupThreshold = 60000; // 1分钟
        
        this.cleanupPool(this.geometryPool, cleanupThreshold);
        this.cleanupPool(this.texturePool, cleanupThreshold);
        this.cleanupPool(this.materialPool, cleanupThreshold);
    }
    
    cleanupPool(pool, threshold) {
        for (const [key, resource] of pool) {
            if (Date.now() - resource.lastUsed > threshold) {
                resource.dispose();
                pool.delete(key);
            }
        }
    }
}
```

### 垃圾回收优化
```javascript
class MemoryManager {
    constructor() {
        this.allocations = new Map();
        this.memoryBudget = 256 * 1024 * 1024; // 256MB
        this.currentUsage = 0;
    }
    
    trackAllocation(key, size, object) {
        this.allocations.set(key, {
            size: size,
            object: object,
            timestamp: Date.now(),
            accessCount: 0
        });
        
        this.currentUsage += size;
        
        // 检查内存预算
        if (this.currentUsage > this.memoryBudget) {
            this.cleanup();
        }
    }
    
    recordAccess(key) {
        const allocation = this.allocations.get(key);
        if (allocation) {
            allocation.accessCount++;
            allocation.timestamp = Date.now();
        }
    }
    
    cleanup() {
        // 按访问频率和时间排序
        const sortedAllocations = Array.from(this.allocations.entries())
            .sort((a, b) => {
                const aScore = this.calculateCleanupScore(a[1]);
                const bScore = this.calculateCleanupScore(b[1]);
                return aScore - bScore;
            });
        
        let freedMemory = 0;
        const targetFree = this.currentUsage * 0.3; // 释放30%的内存
        
        for (const [key, allocation] of sortedAllocations) {
            if (freedMemory >= targetFree) break;
            
            // 释放资源
            if (allocation.object.dispose) {
                allocation.object.dispose();
            }
            
            this.allocations.delete(key);
            freedMemory += allocation.size;
            this.currentUsage -= allocation.size;
        }
    }
    
    calculateCleanupScore(allocation) {
        const timeScore = (Date.now() - allocation.timestamp) / 1000; // 秒
        const accessScore = 1 / (allocation.accessCount + 1); // 访问次数越少，分数越高
        const sizeScore = allocation.size / 1024 / 1024; // MB
        
        return timeScore * accessScore * sizeScore;
    }
    
    getMemoryStats() {
        return {
            currentUsage: this.currentUsage,
            budget: this.memoryBudget,
            allocationCount: this.allocations.size,
            usagePercentage: (this.currentUsage / this.memoryBudget) * 100
        };
    }
}
```

## 高级优化技术

### 视锥体剔除优化
```javascript
class AdvancedCullingSystem {
    constructor(camera) {
        this.camera = camera;
        this.frustum = new THREE.Frustum();
        this.occlusionQueries = new Map();
        this.visibleObjects = new Set();
    }
    
    updateFrustum() {
        this.frustum.setFromProjectionMatrix(
            new THREE.Matrix4().multiplyMatrices(
                this.camera.projectionMatrix,
                this.camera.matrixWorldInverse
            )
        );
    }
    
    isInFrustum(object) {
        const boundingBox = new THREE.Box3().setFromObject(object);
        return this.frustum.intersectsBox(boundingBox);
    }
    
    // 层次视锥体剔除
    hierarchicalCulling(scene) {
        this.visibleObjects.clear();
        this.traverseScene(scene, (object) => {
            if (this.isInFrustum(object)) {
                this.visibleObjects.add(object);
                return true; // 继续遍历子节点
            }
            return false; // 跳过子节点
        });
    }
    
    traverseScene(object, callback, depth = 0) {
        const shouldContinue = callback(object);
        
        if (shouldContinue && object.children) {
            object.children.forEach(child => {
                this.traverseScene(child, callback, depth + 1);
            });
        }
    }
    
    // 遮挡剔除
    setupOcclusionQuery(object) {
        const query = this.gl.createQuery();
        this.occlusionQueries.set(object, query);
        
        // 使用简化边界框进行遮挡查询
        const boundingBox = new THREE.Box3().setFromObject(object);
        const simpleGeometry = this.createBoundingBoxGeometry(boundingBox);
        
        this.gl.beginQuery(this.gl.ANY_SAMPLES_PASSED, query);
        this.renderBoundingBox(simpleGeometry);
        this.gl.endQuery(this.gl.ANY_SAMPLES_PASSED);
        
        return query;
    }
    
    checkOcclusion(object) {
        const query = this.occlusionQueries.get(object);
        if (!query) return true;
        
        const available = this.gl.getQueryParameter(query, this.gl.QUERY_RESULT_AVAILABLE);
        if (available) {
            const passed = this.gl.getQueryParameter(query, this.gl.QUERY_RESULT);
            this.occlusionQueries.delete(object);
            return passed;
        }
        
        return true; // 默认可见
    }
}
```

### 动态分辨率缩放
```javascript
class DynamicResolutionScaling {
    constructor(renderer, targetFrameTime = 16.67) { // 60FPS
        this.renderer = renderer;
        this.targetFrameTime = targetFrameTime;
        this.currentScale = 1.0;
        this.minScale = 0.5;
        this.maxScale = 1.0;
        this.frameTimes = [];
    }
    
    update(frameTime) {
        this.frameTimes.push(frameTime);
        if