# 坐标系系统

## 坐标系基础概念

### 坐标系定义
坐标系是描述空间中点位置的参照系统，由原点、轴方向和单位长度定义：
```
3D坐标系：
      y
      |
      |
      +--- x
     /
    /
   z
```

### 右手坐标系
WebGL 和 OpenGL 使用右手坐标系：
- x 轴：右方向
- y 轴：上方向
- z 轴：向前方向 (屏幕向外)
```
右手定则：
食指 = x轴
中指 = y轴  
拇指 = z轴
```

## 局部坐标系

### 模型空间
每个物体自身的坐标系，原点通常位于物体中心或底部：
```
模型坐标系：
    y
    |  物体
    |  /\
    | /  \
    |/____\
    +------ x
   /
  z
```

### 顶点数据
在模型空间中定义顶点位置：
```javascript
// 立方体顶点数据（模型空间）
const cubeVertices = new Float32Array([
  // 前面
  -0.5, -0.5,  0.5,  // 左下前
   0.5, -0.5,  0.5,  // 右下前
   0.5,  0.5,  0.5,  // 右上前
  -0.5,  0.5,  0.5,  // 左上前
  
  // 后面
  -0.5, -0.5, -0.5,
   0.5, -0.5, -0.5,
   0.5,  0.5, -0.5,
  -0.5,  0.5, -0.5
]);
```

## 世界坐标系

### 世界空间
所有物体共享的全局坐标系，用于描述场景中物体的绝对位置：
```
世界坐标系：
      y
      |    物体A
      |    /\ 
      |   /  \
      |  /____\
      +---------- x
     /   物体B
    /    |==|
   z
```

### 模型变换
将物体从模型空间变换到世界空间：
```javascript
// 创建模型矩阵（世界变换）
function createModelMatrix(position, rotation, scale) {
  const modelMatrix = mat4.create();
  
  // 平移
  mat4.translate(modelMatrix, modelMatrix, position);
  
  // 旋转（绕各轴）
  mat4.rotateX(modelMatrix, modelMatrix, rotation[0]);
  mat4.rotateY(modelMatrix, modelMatrix, rotation[1]); 
  mat4.rotateZ(modelMatrix, modelMatrix, rotation[2]);
  
  // 缩放
  mat4.scale(modelMatrix, modelMatrix, scale);
  
  return modelMatrix;
}

// 使用示例
const modelMatrix = createModelMatrix(
  [2.0, 1.0, -3.0],  // 世界位置
  [0.0, Math.PI/4, 0.0],  // 旋转角度
  [1.0, 1.0, 1.0]    // 缩放
);
```

## 视图坐标系

### 相机空间
以相机为原点的坐标系，z 轴指向相机观察方向：
```
世界空间 → 视图空间

世界坐标系：
      y
      |    相机
      |    ○→ 观察方向
      |
      +--- x
     /
    z

视图坐标系：
      y
      |
      |
相机○-+--- z (观察方向)
     /
    x
```

### 视图变换
```javascript
// 创建视图矩阵
function createViewMatrix(cameraPosition, target, up) {
  const viewMatrix = mat4.create();
  mat4.lookAt(viewMatrix, cameraPosition, target, up);
  return viewMatrix;
}

// 使用示例
const viewMatrix = createViewMatrix(
  [0, 0, 5],      // 相机位置
  [0, 0, 0],      // 观察目标
  [0, 1, 0]       // 上方向
);

// 手动构建视图矩阵
function createViewMatrixManual(eye, center, up) {
  const z = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), eye, center));
  const x = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), up, z));
  const y = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), z, x));
  
  const viewMatrix = mat4.fromValues(
    x[0], x[1], x[2], -vec3.dot(x, eye),
    y[0], y[1], y[2], -vec3.dot(y, eye), 
    z[0], z[1], z[2], -vec3.dot(z, eye),
    0, 0, 0, 1
  );
  
  return viewMatrix;
}
```

## 投影坐标系

### 投影空间
将 3D 场景投影到 2D 平面的坐标系系统。

#### 透视投影
模拟人眼视觉效果，近大远小：
```
透视视锥体：
   眼位置
    /|
   / | 
  /  |
 /   |
/    |
近平面 远平面
```

```javascript
// 透视投影矩阵
function createPerspectiveMatrix(fov, aspect, near, far) {
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fov, aspect, near, far);
  return projectionMatrix;
}

// 使用示例
const perspectiveMatrix = createPerspectiveMatrix(
  45 * Math.PI / 180,  // 视野角度（弧度）
  16/9,                // 宽高比
  0.1,                 // 近平面
  100.0                // 远平面
);
```

#### 正交投影
平行投影，保持物体大小不变：
```
正交视锥体：
   +-----+
   |     |
   |     |
   |     |
   +-----+
近平面   远平面
```

```javascript
// 正交投影矩阵
function createOrthographicMatrix(left, right, bottom, top, near, far) {
  const projectionMatrix = mat4.create();
  mat4.ortho(projectionMatrix, left, right, bottom, top, near, far);
  return projectionMatrix;
}

// 使用示例
const orthoMatrix = createOrthographicMatrix(
  -10, 10,   // left, right
  -10, 10,   // bottom, top  
  -10, 10,   // near, far
);
```

## 裁剪空间

### 标准化设备坐标
经过投影变换后，坐标被规范到立方体内：
```
裁剪空间：
    y
    |
 (-1,1)------(1,1)
    |         |
    |         |
    |         |
 (-1,-1)----(1,-1)
          x
z范围：[-1, 1]
```

### 透视除法
将齐次坐标转换为 3D 坐标：
```
[x, y, z, w] → [x/w, y/w, z/w]
```

## 屏幕坐标系

### 视口变换
从标准化设备坐标到屏幕像素坐标的变换：
```
标准化坐标 → 屏幕坐标
(-1,1)       (0,0)----(width,0)
  |            |          |
  |    →       |          |
(-1,-1)      (0,height)-(width,height)
```

```javascript
// 设置视口
gl.viewport(0, 0, canvas.width, canvas.height);

// 视口变换计算
function viewportTransform(ndcX, ndcY, viewport) {
  const pixelX = (ndcX + 1) * viewport.width / 2 + viewport.x;
  const pixelY = (1 - ndcY) * viewport.height / 2 + viewport.y;
  return [pixelX, pixelY];
}
```

## 坐标系变换流程

### 完整变换管线
```
局部坐标 → 世界坐标 → 视图坐标 → 投影坐标 → 标准化坐标 → 屏幕坐标

模型矩阵     视图矩阵     投影矩阵     透视除法     视口变换
```

### 变换矩阵组合
```javascript
// 完整的MVP矩阵
const modelMatrix = createModelMatrix(position, rotation, scale);
const viewMatrix = createViewMatrix(cameraPosition, target, up);
const projectionMatrix = createPerspectiveMatrix(fov, aspect, near, far);

// 组合变换矩阵
const mvpMatrix = mat4.create();
mat4.multiply(mvpMatrix, projectionMatrix, viewMatrix);
mat4.multiply(mvpMatrix, mvpMatrix, modelMatrix);

// 在着色器中使用
gl.uniformMatrix4fv(uMVPMatrix, false, mvpMatrix);
```

### 顶点着色器中的变换
```glsl
// 顶点着色器
attribute vec3 aPosition;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  // 完整的坐标系变换
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vec4 viewPosition = uViewMatrix * worldPosition;
  vec4 clipPosition = uProjectionMatrix * viewPosition;
  
  gl_Position = clipPosition;
}
```

## 法线变换

### 法线坐标系
法线向量需要特殊处理，使用逆转置矩阵：
```javascript
// 法线矩阵计算
function createNormalMatrix(modelViewMatrix) {
  const normalMatrix = mat3.create();
  mat3.normalFromMat4(normalMatrix, modelViewMatrix);
  return normalMatrix;
}

// 在着色器中使用
const normalMatrix = createNormalMatrix(modelViewMatrix);
gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix);
```

```glsl
// 法线变换
uniform mat3 uNormalMatrix;
attribute vec3 aNormal;

varying vec3 vNormal;

void main() {
  vNormal = uNormalMatrix * aNormal;
}
```

## 纹理坐标系

### UV 坐标系统
2D 纹理映射使用的坐标系：
```
纹理坐标：
(0,0)---(1,0)
  |       |
  |       |
  |       |
(0,1)---(1,1)
```

### 立方体贴图坐标系
用于环境映射的 6 个面：
```
立方体贴图：
    +y
 -x +z +x -z
    -y
```

```javascript
// 纹理坐标数据
const texCoords = new Float32Array([
  // 前面
  0.0, 0.0,
  1.0, 0.0, 
  1.0, 1.0,
  0.0, 1.0,
  
  // 右面
  0.0, 0.0,
  1.0, 0.0,
  1.0, 1.0,
  0.0, 1.0
]);
```

## 坐标系实践应用

### 鼠标交互
将屏幕坐标转换为 3D 世界坐标：
```javascript
// 屏幕到世界坐标转换
function screenToWorld(mouseX, mouseY, canvas, mvpMatrix) {
  // 标准化设备坐标
  const x = (mouseX / canvas.width) * 2 - 1;
  const y = -(mouseY / canvas.height) * 2 + 1;
  
  // 反投影
  const inverseMVP = mat4.create();
  mat4.invert(inverseMVP, mvpMatrix);
  
  const nearPoint = unproject(x, y, -1, inverseMVP);
  const farPoint = unproject(x, y, 1, inverseMVP);
  
  return { nearPoint, farPoint };
}

function unproject(x, y, z, inverseMatrix) {
  const point = vec4.fromValues(x, y, z, 1.0);
  vec4.transformMat4(point, point, inverseMatrix);
  
  // 透视除法
  point[0] /= point[3];
  point[1] /= point[3];
  point[2] /= point[3];
  
  return vec3.fromValues(point[0], point[1], point[2]);
}
```

### 坐标系调试
可视化坐标系轴：
```javascript
// 绘制坐标系轴
function drawCoordinateAxes(gl, program) {
  const axisVertices = new Float32Array([
    // x轴 (红色)
    0,0,0, 1,0,0, 1,0,0, 1,0,0,
    // y轴 (绿色)  
    0,0,0, 0,1,0, 0,1,0, 0,1,0,
    // z轴 (蓝色)
    0,0,0, 0,0,1, 0,0,1, 0,0,1
  ]);
  
  const axisColors = new Float32Array([
    // x轴：红
    1,0,0, 1,0,0, 1,0,0, 1,0,0,
    // y轴：绿
    0,1,0, 0,1,0, 0,1,0, 0,1,0, 
    // z轴：蓝
    0,0,1, 0,0,1, 0,0,1, 0,0,1
  ]);
  
  // 绘制轴线
  gl.drawArrays(gl.LINES, 0, 6);
}
```