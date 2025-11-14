# 3D 图形学基础

## 三维坐标系

3D图形学使用三维坐标系描述物体位置：
```
      y
      |
      |
      +--- x
     /
    /
   z
```

右手坐标系规则：
- x轴：右方向
- y轴：上方向  
- z轴：向前方向

## 顶点与图元

### 顶点定义
顶点包含位置、颜色、法线等属性：
```javascript
// WebGL顶点数据示例
const vertices = new Float32Array([
  // x,   y,   z,   r,   g,   b
   0.0, 0.5, 0.0, 1.0, 0.0, 0.0,  // 红色顶点
  -0.5,-0.5, 0.0, 0.0, 1.0, 0.0,  // 绿色顶点
   0.5,-0.5, 0.0, 0.0, 0.0, 1.0   // 蓝色顶点
]);
```

### 图元类型
基本图元包括：
- 点：单个顶点
- 线：两个顶点连线
- 三角形：三个顶点构成的面片
```
点：    *  
线：    *---*
三角形： *
        /\
       /  \
      *----*
```

## 变换系统

### 模型变换
物体从模型空间到世界空间的变换：
```javascript
// 模型矩阵计算
function createModelMatrix(translation, rotation, scale) {
  const modelMatrix = mat4.create();
  mat4.translate(modelMatrix, modelMatrix, translation);
  mat4.rotateX(modelMatrix, modelMatrix, rotation[0]);
  mat4.rotateY(modelMatrix, modelMatrix, rotation[1]);
  mat4.rotateZ(modelMatrix, modelMatrix, rotation[2]);
  mat4.scale(modelMatrix, modelMatrix, scale);
  return modelMatrix;
}
```

### 视图变换
从世界空间到相机空间的变换：
```
世界坐标系       相机坐标系
    y              z
    |             /
    |            /
    +--- x      *--- x
   /            |
  /             y
 z
```

### 投影变换

#### 正交投影
平行投影，无透视效果：
```
近裁剪面    远裁剪面
  |          |
  |  物体    |
  |  大小    |
  |  不变    |
  |          |
```

#### 透视投影
模拟人眼视觉效果，近大远小：
```
   视锥体
    /|
   / |
  /  |
 /   |
```

```javascript
// 透视投影矩阵
const projectionMatrix = mat4.create();
mat4.perspective(
  projectionMatrix,
  45 * Math.PI / 180, // 视野角度
  canvas.width / canvas.height, // 宽高比
  0.1,  // 近平面
  100.0 // 远平面
);
```

## 渲染管线

### 图形管线流程
```
顶点数据 → 顶点着色器 → 图元装配 → 光栅化 → 片段着色器 → 帧缓冲区
```

### 顶点着色器
处理每个顶点的变换：
```glsl
// GLSL顶点着色器
attribute vec3 aPosition;
attribute vec3 aColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec3 vColor;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
  vColor = aColor;
}
```

### 片段着色器
计算每个像素的颜色：
```glsl
// GLSL片段着色器
precision mediump float;

varying vec3 vColor;

void main() {
  gl_FragColor = vec4(vColor, 1.0);
}
```

## 光照模型

### 冯氏光照模型
包含环境光、漫反射、镜面反射三个分量：
```
最终颜色 = 环境光 + 漫反射 + 镜面反射
```

#### 环境光
模拟间接光照：
```
环境光强度 = 环境光颜色 × 材质环境系数
```

#### 漫反射
Lambert余弦定律：
```
漫反射强度 = 光颜色 × 材质漫反射系数 × max(0, dot(N, L))
```
其中：
- N：表面法线
- L：光源方向

#### 镜面反射
Phong模型：
```
镜面反射强度 = 光颜色 × 材质镜面系数 × pow(max(0, dot(R, V)), 光泽度)
```
其中：
- R：反射光方向
- V：视线方向

```glsl
// 光照计算GLSL实现
vec3 calculateLight(Light light, vec3 normal, vec3 fragPos, vec3 viewDir) {
  // 环境光
  vec3 ambient = light.ambient * material.ambient;
  
  // 漫反射
  vec3 lightDir = normalize(light.position - fragPos);
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = light.diffuse * (diff * material.diffuse);
  
  // 镜面反射
  vec3 reflectDir = reflect(-lightDir, normal);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
  vec3 specular = light.specular * (spec * material.specular);
  
  return ambient + diffuse + specular;
}
```

## 纹理映射

### 纹理坐标系统
2D纹理使用UV坐标：
```
(0,1)---(1,1)
  |       |
  |       |
  |       |
(0,0)---(1,0)
```

### 纹理过滤

#### 最近邻过滤
取最近的纹素，产生块状效果：
```
纹理坐标 → 找到最近纹素 → 输出颜色
```

#### 双线性过滤
四个相邻纹素的加权平均：
```
A---B
|   |
|   |
C---D
权重基于相对位置插值
```

```javascript
// WebGL纹理设置
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
```

## 深度测试

### Z-Buffer算法
每个像素存储深度值，解决遮挡问题：
```
深度缓冲区初始化：所有像素深度 = 最大值

对于每个三角形：
  对于每个覆盖的像素：
    计算该像素深度值
    如果深度值 < 缓冲区深度值：
      更新颜色缓冲区
      更新深度缓冲区
```

## 着色技术

### 平面着色
每个多边形使用单一颜色：
```
三角形：恒定颜色
    /\
   /  \
  /    \
 /______\
```

### Gouraud着色
顶点颜色插值：
```
顶点计算光照 → 三角形内颜色插值
    /\
   /  \
  /    \
 /______\
颜色平滑过渡
```

### Phong着色
顶点法线插值，每个像素计算光照：
```
顶点法线插值 → 每个像素独立计算光照
    /\
   /  \
  /    \
 /______\
高光效果更精确
```

## 几何处理

### 背面剔除
基于法线与视线方向剔除背面三角形：
```
法线N，视线V
如果 dot(N, V) > 0：正面可见
如果 dot(N, V) < 0：背面剔除
```

### 视锥体裁剪
剔除视锥体外部的几何体：
```
视锥体六个平面：
  左、右、上、下、近、远
顶点与平面方程测试：
  Ax + By + Cz + D > 0：外部
  Ax + By + Cz + D ≤ 0：内部
```

## 现代图形API

### WebGL渲染循环
```javascript
function render() {
  // 清除缓冲区
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // 更新变换
  const modelViewMatrix = updateModelViewMatrix();
  
  // 设置着色器 uniform
  gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
  
  // 绘制
  gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
  
  // 下一帧
  requestAnimationFrame(render);
}
```

### 缓冲区管理
```javascript
// 创建顶点缓冲区
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// 设置顶点属性指针
gl.vertexAttribPointer(
  aPosition,
  3,        // 每个顶点的分量数
  gl.FLOAT, // 数据类型
  false,    // 是否归一化
  24,       // 步长 (6个float × 4字节)
  0         // 偏移量
);
gl.enableVertexAttribArray(aPosition);
```