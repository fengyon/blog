# 渲染管线

## 渲染管线概述

### 图形管线定义
渲染管线是将3D场景数据转换为2D图像的一系列处理阶段：
```
应用阶段 → 几何阶段 → 光栅化阶段 → 输出合并
```

### 固定功能管线 vs 可编程管线
```
固定功能管线：        可编程管线：
 固定操作流程          可编程着色器
 有限定制能力          高度可定制
                     │
                     ↓
             顶点着色器 ↔ 片段着色器
```

## 应用阶段

### CPU端处理
由应用程序准备渲染数据：
```javascript
// 应用阶段伪代码
class ApplicationStage {
  update() {
    // 1. 场景图遍历
    this.traverseSceneGraph();
    
    // 2. 视锥体剔除
    this.frustumCulling();
    
    // 3. 数据准备
    this.prepareRenderData();
    
    // 4. 设置渲染状态
    this.setRenderStates();
    
    // 5. 提交绘制命令
    this.submitDrawCommands();
  }
  
  traverseSceneGraph() {
    // 更新物体变换
    for (const object of this.sceneObjects) {
      object.updateMatrix();
    }
  }
  
  frustumCulling() {
    // 剔除视锥体外物体
    this.visibleObjects = this.sceneObjects.filter(obj => {
      return this.camera.frustum.intersects(obj.boundingVolume);
    });
  }
  
  submitDrawCommands() {
    // 向GPU提交绘制命令
    for (const object of this.visibleObjects) {
      gl.drawArrays(gl.TRIANGLES, 0, object.vertexCount);
    }
  }
}
```

## 几何阶段

### 顶点着色器
处理每个顶点的变换和属性计算：
```glsl
// 顶点着色器示例
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

varying vec3 vNormal;
varying vec2 vTexCoord;
varying vec3 vViewPosition;

void main() {
  // 模型视图变换
  vec4 viewPosition = uModelViewMatrix * vec4(aPosition, 1.0);
  vViewPosition = viewPosition.xyz;
  
  // 投影变换
  gl_Position = uProjectionMatrix * viewPosition;
  
  // 法线变换
  vNormal = normalize(uNormalMatrix * aNormal);
  
  // 传递纹理坐标
  vTexCoord = aTexCoord;
}
```

### 图元装配
将顶点组装成几何图元：
```
顶点列表 → 图元组装 → 完整几何形状

三角形列表：
v0---v1
 |   / |
 |  /  |
 | /   |
v2---v3

组装为：
三角形1: v0-v1-v2
三角形2: v1-v3-v2
```

### 几何着色器（可选）
处理整个图元，可生成新图元：
```glsl
// 几何着色器示例（WebGL2）
#version 300 es
layout(triangles) in;
layout(triangle_strip, max_vertices = 3) out;

in vec3 vNormal[];
out vec3 gNormal;

void main() {
  for(int i = 0; i < 3; i++) {
    gl_Position = gl_in[i].gl_Position;
    gNormal = vNormal[i];
    EmitVertex();
  }
  EndPrimitive();
}
```

### 裁剪
剔除视锥体外部的图元：
```
裁剪空间：
    |
   +---+
   |   |
   |   |  可见区域
   |   |
   +---+
    |
外部图元被裁剪
```

### 透视除法
将齐次坐标转换为标准化设备坐标：
```
[x, y, z, w] → [x/w, y/w, z/w, 1]
```

### 视口变换
将NDC坐标映射到屏幕坐标：
```javascript
// 视口变换实现
function viewportTransform(ndcX, ndcY, viewport) {
  const pixelX = (ndcX + 1.0) * viewport.width * 0.5 + viewport.x;
  const pixelY = (1.0 - ndcY) * viewport.height * 0.5 + viewport.y;
  return [pixelX, pixelY];
}

// WebGL设置视口
gl.viewport(0, 0, canvas.width, canvas.height);
```

## 光栅化阶段

### 三角形设置
将三角形顶点转换为边方程和扫描线数据：
```
三角形顶点：
    v0
    /\
   /  \
  /    \
v1-----v2

计算：
- 边方程
- 包围盒
- 重心坐标
```

### 三角形遍历
确定哪些像素被三角形覆盖：
```javascript
// 三角形遍历伪代码
function rasterizeTriangle(v0, v1, v2) {
  // 计算包围盒
  const bbox = computeBoundingBox(v0, v1, v2);
  
  // 遍历包围盒内所有像素
  for (let y = bbox.minY; y <= bbox.maxY; y++) {
    for (let x = bbox.minX; x <= bbox.maxX; x++) {
      // 计算重心坐标
      const barycentric = computeBarycentric(x, y, v0, v1, v2);
      
      // 检查像素是否在三角形内
      if (isInsideTriangle(barycentric)) {
        // 计算深度值
        const depth = interpolateDepth(barycentric, v0, v1, v2);
        
        // 处理片段
        processFragment(x, y, depth, barycentric);
      }
    }
  }
}
```

### 插值计算
使用重心坐标插值顶点属性：
```glsl
// 片段着色器中的插值
varying vec3 vNormal;
varying vec2 vTexCoord;

void main() {
  // 所有varying变量已由光栅器自动插值
  vec3 normal = normalize(vNormal);
  vec2 texCoord = vTexCoord;
  
  // 使用插值后的属性进行计算
  // ...
}
```

## 像素处理阶段

### 片段着色器
计算每个片段的最终颜色：
```glsl
// 片段着色器示例
precision mediump float;

uniform sampler2D uDiffuseMap;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;

varying vec3 vNormal;
varying vec2 vTexCoord;

void main() {
  // 采样纹理
  vec4 diffuseColor = texture2D(uDiffuseMap, vTexCoord);
  
  // 计算光照
  vec3 normal = normalize(vNormal);
  float nDotL = max(dot(normal, uLightDirection), 0.0);
  vec3 diffuse = uLightColor * nDotL;
  
  // 组合最终颜色
  gl_FragColor = vec4(diffuseColor.rgb * diffuse, diffuseColor.a);
}
```

### 早期深度测试
在片段着色器执行前进行深度测试：
```
深度测试流程：
片段位置 → 深度测试 → 通过 → 片段着色器
              |
             失败 → 丢弃片段
```

## 输出合并阶段

### 深度测试
解决可见性问题：
```javascript
// 深度测试设置
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL); // 深度比较函数

// 深度缓冲区清除
gl.clear(gl.DEPTH_BUFFER_BIT);
```

### 模板测试
基于模板缓冲区进行像素级遮挡：
```javascript
// 模板测试设置
gl.enable(gl.STENCIL_TEST);
gl.stencilFunc(gl.EQUAL, 1, 0xFF); // 测试函数
gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE); // 测试操作

// 模板缓冲区清除
gl.clear(gl.STENCIL_BUFFER_BIT);
```

### 颜色混合
组合当前片段颜色与帧缓冲区颜色：
```javascript
// 混合设置
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // 混合函数
gl.blendEquation(gl.FUNC_ADD); // 混合方程
```

### 颜色写入
最终写入帧缓冲区：
```javascript
// 颜色掩码控制
gl.colorMask(true, true, true, true); // 启用RGBA写入

// 帧缓冲区清除
gl.clearColor(0.0, 0.0, 0.0, 1.0); // 黑色背景
gl.clear(gl.COLOR_BUFFER_BIT);
```

## 现代渲染管线特性

### 变换反馈
捕获顶点着色器输出：
```javascript
// 变换反馈设置 (WebGL2)
const transformFeedback = gl.createTransformFeedback();
gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);

// 绑定缓冲区到变换反馈
gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, outputBuffer);

// 开始变换反馈
gl.beginTransformFeedback(gl.POINTS);
gl.drawArrays(gl.POINTS, 0, vertexCount);
gl.endTransformFeedback();
```

### 实例化渲染
单次调用渲染多个相似物体：
```javascript
// 实例化数组设置
const instanceMatrixBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, instanceMatrixBuffer);
gl.bufferData(gl.ARRAY_BUFFER, instanceMatrices, gl.STATIC_DRAW);

// 设置实例化属性
for (let i = 0; i < 4; i++) {
  const loc = attribLocation + i;
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 64, i * 16);
  gl.vertexAttribDivisor(loc, 1); // 每实例更新一次
}

// 实例化绘制
gl.drawArraysInstanced(gl.TRIANGLES, 0, vertexCount, instanceCount);
```

### 多重采样抗锯齿
```javascript
// 多重采样渲染缓冲区
const sampleRenderbuffer = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, sampleRenderbuffer);
gl.renderbufferStorageMultisample(
  gl.RENDERBUFFER, 
  4, // 采样数
  gl.RGBA8, 
  width, 
  height
);
```

## 渲染状态管理

### 状态对象
```javascript
// 创建渲染状态
class RenderState {
  constructor() {
    this.depthTest = true;
    this.depthFunc = gl.LEQUAL;
    this.blend = true;
    this.blendFunc = [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA];
    this.cullFace = true;
    this.cullFaceMode = gl.BACK;
  }
  
  apply() {
    if (this.depthTest) {
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(this.depthFunc);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
    
    if (this.blend) {
      gl.enable(gl.BLEND);
      gl.blendFunc(this.blendFunc[0], this.blendFunc[1]);
    } else {
      gl.disable(gl.BLEND);
    }
    
    if (this.cullFace) {
      gl.enable(gl.CULL_FACE);
      gl.cullFace(this.cullFaceMode);
    } else {
      gl.disable(gl.CULL_FACE);
    }
  }
}
```

### 渲染通道组织
```javascript
// 渲染通道管理
class RenderPass {
  constructor() {
    this.objects = [];
    this.shader = null;
    this.renderState = new RenderState();
  }
  
  render(camera) {
    this.renderState.apply();
    
    gl.useProgram(this.shader.program);
    
    // 设置相机uniform
    this.shader.setUniform('uViewMatrix', camera.viewMatrix);
    this.shader.setUniform('uProjectionMatrix', camera.projectionMatrix);
    
    // 渲染所有物体
    for (const object of this.objects) {
      object.render(this.shader);
    }
  }
}
```

## 性能优化技术

### 顶点处理优化
```javascript
// 顶点缓冲区优化
const interleavedBuffer = new Float32Array([
  // 位置, 法线, 纹理坐标
  x, y, z, nx, ny, nz, u, v,
  // ...
]);

// 使用索引绘制减少顶点处理
gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
```

### 批次渲染
```javascript
// 批次渲染实现
class BatchRenderer {
  constructor() {
    this.batches = new Map(); // shader -> geometry
  }
  
  addObject(object) {
    const key = object.shader.id;
    if (!this.batches.has(key)) {
      this.batches.set(key, []);
    }
    this.batches.get(key).push(object);
  }
  
  render() {
    for (const [shader, objects] of this.batches) {
      gl.useProgram(shader);
      
      // 合并几何数据
      const mergedGeometry = this.mergeGeometry(objects);
      
      // 单次绘制调用
      this.renderMergedGeometry(mergedGeometry);
    }
  }
}
```

### 管线统计
```javascript
// 渲染性能监控
class PipelineStats {
  constructor() {
    this.frameTime = 0;
    this.triangleCount = 0;
    this.drawCallCount = 0;
  }
  
  beginFrame() {
    this.frameStart = performance.now();
    this.triangleCount = 0;
    this.drawCallCount = 0;
  }
  
  recordDrawCall(vertexCount, mode) {
    this.drawCallCount++;
    
    // 计算三角形数量
    if (mode === gl.TRIANGLES) {
      this.triangleCount += vertexCount / 3;
    } else if (mode === gl.TRIANGLE_STRIP) {
      this.triangleCount += vertexCount - 2;
    }
  }
  
  endFrame() {
    this.frameTime = performance.now() - this.frameStart;
  }
}
```