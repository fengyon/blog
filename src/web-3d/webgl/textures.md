# WebGL 基础

## WebGL 概述

### WebGL 架构
WebGL 是基于 OpenGL ES 的 JavaScript API，在浏览器中提供硬件加速的 3D 图形渲染：
```
JavaScript 应用
    ↓
WebGL API (OpenGL ES 2.0)
    ↓
图形驱动程序
    ↓
GPU 硬件
```

### 上下文获取
```javascript
// 获取 WebGL 上下文
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

// 或者 WebGL2
const gl2 = canvas.getContext('webgl2');

if (!gl) {
    console.error('WebGL 不支持');
}
```

## 渲染管线核心概念

### 状态机模型
WebGL 是基于状态机的 API，通过改变状态控制渲染行为：
```javascript
// 设置状态示例
gl.enable(gl.DEPTH_TEST);        // 开启深度测试
gl.depthFunc(gl.LEQUAL);         // 设置深度测试函数
gl.clearColor(0, 0, 0, 1);       // 设置清除颜色
gl.clearDepth(1.0);              // 设置清除深度
```

### 数据流架构
```
CPU 数据 → 缓冲区 → 顶点着色器 → 片段着色器 → 帧缓冲区
     ↓         ↓          ↓           ↓          ↓
JavaScript   ArrayBuffer GLSL        GLSL      Canvas
```

## 缓冲区管理

### 顶点缓冲区
```javascript
// 创建顶点数据
const vertices = new Float32Array([
    // x, y, z
    -0.5, -0.5, 0.0,
     0.5, -0.5, 0.0,
     0.0,  0.5, 0.0
]);

// 创建并绑定缓冲区
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// 设置顶点属性指针
gl.vertexAttribPointer(
    0,                    // 属性位置
    3,                    // 每个顶点的分量数
    gl.FLOAT,             // 数据类型
    false,                // 是否归一化
    0,                    // 步长
    0                     // 偏移量
);
gl.enableVertexAttribArray(0);
```

### 索引缓冲区
```javascript
// 创建索引数据
const indices = new Uint16Array([
    0, 1, 2  // 三角形索引
]);

// 创建索引缓冲区
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
```

## 着色器编程

### 着色器创建与编译
```javascript
// 顶点着色器源码
const vsSource = `
    attribute vec4 aPosition;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
    }
`;

// 片段着色器源码
const fsSource = `
    precision mediump float;
    uniform vec4 uColor;
    
    void main() {
        gl_FragColor = uColor;
    }
`;

// 编译着色器函数
function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('着色器编译错误:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    
    return shader;
}

// 创建着色器程序
function createProgram(gl, vsSource, fsSource) {
    const vertexShader = compileShader(gl, vsSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('程序链接错误:', gl.getProgramInfoLog(program));
        return null;
    }
    
    return program;
}
```

### Uniform 和 Attribute 管理
```javascript
class ShaderProgram {
    constructor(gl, vsSource, fsSource) {
        this.gl = gl;
        this.program = createProgram(gl, vsSource, fsSource);
        this.uniforms = new Map();
        this.attributes = new Map();
    }
    
    use() {
        this.gl.useProgram(this.program);
    }
    
    getUniformLocation(name) {
        if (!this.uniforms.has(name)) {
            const location = this.gl.getUniformLocation(this.program, name);
            this.uniforms.set(name, location);
        }
        return this.uniforms.get(name);
    }
    
    getAttribLocation(name) {
        if (!this.attributes.has(name)) {
            const location = this.gl.getAttribLocation(this.program, name);
            this.attributes.set(name, location);
        }
        return this.attributes.get(name);
    }
    
    setUniform1f(name, value) {
        this.gl.uniform1f(this.getUniformLocation(name), value);
    }
    
    setUniform3f(name, x, y, z) {
        this.gl.uniform3f(this.getUniformLocation(name), x, y, z);
    }
    
    setUniformMatrix4fv(name, matrix) {
        this.gl.uniformMatrix4fv(this.getUniformLocation(name), false, matrix);
    }
}
```

## 渲染循环

### 基础渲染流程
```javascript
class WebGLRenderer {
    constructor(canvas) {
        this.gl = canvas.getContext('webgl');
        this.canvas = canvas;
        this.programs = new Map();
        this.buffers = new Map();
        
        this.initGL();
    }
    
    initGL() {
        const gl = this.gl;
        
        // 设置视口
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // 启用深度测试
        gl.enable(gl.DEPTH_TEST);
        
        // 设置清除颜色和深度
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clearDepth(1.0);
    }
    
    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    
    render() {
        this.clear();
        
        // 渲染逻辑
        this.renderScene();
        
        // 请求下一帧
        requestAnimationFrame(() => this.render());
    }
    
    start() {
        this.render();
    }
}
```

## 纹理系统

### 纹理创建与绑定
```javascript
class Texture {
    constructor(gl, options = {}) {
        this.gl = gl;
        this.texture = gl.createTexture();
        this.options = {
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
            minFilter: gl.LINEAR,
            magFilter: gl.LINEAR,
            format: gl.RGBA,
            internalFormat: gl.RGBA,
            type: gl.UNSIGNED_BYTE,
            ...options
        };
    }
    
    loadFromImage(image) {
        const gl = this.gl;
        
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        
        // 设置纹理参数
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.options.wrapS);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.options.wrapT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.options.minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.options.magFilter);
        
        // 上传纹理数据
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            this.options.internalFormat,
            this.options.format,
            this.options.type,
            image
        );
        
        // 生成mipmap（如果需要）
        if (this.options.minFilter === gl.LINEAR_MIPMAP_LINEAR) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
        
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    
    bind(unit = 0) {
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
    }
}
```

### 纹理加载工具
```javascript
function loadTexture(gl, url, options = {}) {
    return new Promise((resolve, reject) => {
        const texture = new Texture(gl, options);
        const image = new Image();
        
        image.onload = () => {
            texture.loadFromImage(image);
            resolve(texture);
        };
        
        image.onerror = reject;
        image.src = url;
    });
}
```

## 帧缓冲区与离屏渲染

### 帧缓冲区创建
```javascript
class FrameBuffer {
    constructor(gl, width, height) {
        this.gl = gl;
        this.width = width;
        this.height = height;
        
        this.createFramebuffer();
    }
    
    createFramebuffer() {
        const gl = this.gl;
        
        // 创建帧缓冲区
        this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        
        // 创建颜色附件纹理
        this.colorTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, 
            this.width, this.height, 0, 
            gl.RGBA, gl.UNSIGNED_BYTE, null
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        // 创建深度附件
        this.depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
        gl.renderbufferStorage(
            gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 
            this.width, this.height
        );
        
        // 附加到帧缓冲区
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
            gl.TEXTURE_2D, this.colorTexture, 0
        );
        gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, 
            gl.RENDERBUFFER, this.depthBuffer
        );
        
        // 检查帧缓冲区状态
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('帧缓冲区不完整');
        }
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    
    bind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
        this.gl.viewport(0, 0, this.width, this.height);
    }
    
    unbind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
}
```

## 高级渲染特性

### 混合与透明度
```javascript
function setupBlending(gl, blendFunc = null) {
    gl.enable(gl.BLEND);
    
    if (blendFunc) {
        gl.blendFunc(blendFunc.src, blendFunc.dst);
    } else {
        // 标准alpha混合
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    
    // 可选：设置混合方程
    gl.blendEquation(gl.FUNC_ADD);
}
```

### 面剔除
```javascript
function setupFaceCulling(gl, cullFace = gl.BACK, frontFace = gl.CCW) {
    gl.enable(gl.CULL_FACE);
    gl.cullFace(cullFace);
    gl.frontFace(frontFace);
}
```

## 性能优化

### 缓冲区更新策略
```javascript
class DynamicBuffer {
    constructor(gl, target, usage = gl.DYNAMIC_DRAW) {
        this.gl = gl;
        this.target = target;
        this.usage = usage;
        this.buffer = gl.createBuffer();
        this.size = 0;
    }
    
    setData(data) {
        const gl = this.gl;
        gl.bindBuffer(this.target, this.buffer);
        
        if (data.byteLength <= this.size) {
            // 子数据更新
            gl.bufferSubData(this.target, 0, data);
        } else {
            // 重新分配缓冲区
            gl.bufferData(this.target, data, this.usage);
            this.size = data.byteLength;
        }
    }
}
```

### 绘制调用优化
```javascript
class BatchRenderer {
    constructor(gl) {
        this.gl = gl;
        this.batches = new Map();
    }
    
    addToBatch(key, geometry, material) {
        if (!this.batches.has(key)) {
            this.batches.set(key, {
                geometries: [],
                material: material
            });
        }
        this.batches.get(key).geometries.push(geometry);
    }
    
    render() {
        for (const [key, batch] of this.batches) {
            // 设置材质
            this.setupMaterial(batch.material);
            
            // 合并几何数据
            const mergedGeometry = this.mergeGeometries(batch.geometries);
            
            // 单次绘制调用
            this.renderMergedGeometry(mergedGeometry);
        }
        
        this.batches.clear();
    }
}
```

## 错误处理与调试

### WebGL 错误检查
```javascript
function checkGLError(gl, operation) {
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
        console.error(`WebGL 错误在 ${operation}:`, getGLErrorString(gl, error));
    }
}

function getGLErrorString(gl, error) {
    const errorMap = {
        [gl.INVALID_ENUM]: 'INVALID_ENUM',
        [gl.INVALID_VALUE]: 'INVALID_VALUE',
        [gl.INVALID_OPERATION]: 'INVALID_OPERATION',
        [gl.INVALID_FRAMEBUFFER_OPERATION]: 'INVALID_FRAMEBUFFER_OPERATION',
        [gl.OUT_OF_MEMORY]: 'OUT_OF_MEMORY',
        [gl.CONTEXT_LOST_WEBGL]: 'CONTEXT_LOST_WEBGL'
    };
    return errorMap[error] || `未知错误: ${error}`;
}

// 使用示例
gl.drawArrays(gl.TRIANGLES, 0, 3);
checkGLError(gl, 'drawArrays');
```

### 调试信息输出
```javascript
function getGLInfo(gl) {
    return {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxTextureUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS)
    };
}

console.log('WebGL 信息:', getGLInfo(gl));
```

## 完整示例

### 简单三角形渲染
```javascript
class SimpleTriangle {
    constructor(canvas) {
        this.gl = canvas.getContext('webgl');
        this.canvas = canvas;
        this.init();
    }
    
    init() {
        // 初始化WebGL状态
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        
        // 创建着色器程序
        this.program = this.createProgram();
        
        // 创建几何数据
        this.setupGeometry();
        
        // 开始渲染循环
        this.render();
    }
    
    createProgram() {
        const vsSource = `
            attribute vec4 aPosition;
            void main() {
                gl_Position = aPosition;
            }
        `;
        
        const fsSource = `
            precision mediump float;
            void main() {
                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            }
        `;
        
        return createProgram(this.gl, vsSource, fsSource);
    }
    
    setupGeometry() {
        const vertices = new Float32Array([
            -0.5, -0.5, 0.0,
             0.5, -0.5, 0.0,
             0.0,  0.5, 0.0
        ]);
        
        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        
        const positionLocation = this.gl.getAttribLocation(this.program, 'aPosition');
        this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(positionLocation);
    }
    
    render() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        this.gl.useProgram(this.program);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
        
        requestAnimationFrame(() => this.render());
    }
}

// 使用
const canvas = document.getElementById('canvas');
const triangle = new SimpleTriangle(canvas);
```