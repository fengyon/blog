# 变换与矩阵

## 变换基础概念

### 线性变换
保持向量加法和标量乘法的变换：
```
变换前：    变换后：
  A          A'
   \          \
    \          \
     B---C      B'---C'
```

### 齐次坐标
使用 4 维向量表示 3D 点和向量：
- 点：(x，y，z，1)
- 向量：(x，y，z，0)

```javascript
// 齐次坐标表示
const point = [x, y, z, 1];    // 点
const vector = [x, y, z, 0];   // 向量
```

## 基本变换矩阵

### 单位矩阵
不进行任何变换的基准矩阵：
```
[1, 0, 0, 0]
[0, 1, 0, 0]
[0, 0, 1, 0]
[0, 0, 0, 1]
```

```javascript
// 创建单位矩阵
const identityMatrix = mat4.create();  // [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]
```

### 平移变换
改变物体位置，保持形状和方向不变：
```
平移前：    平移后：
  △          △
  |          |
  |    →     |
  |          |
```
平移矩阵：
```
[1, 0, 0, tx]
[0, 1, 0, ty]
[0, 0, 1, tz]
[0, 0, 0, 1]
```

```javascript
// 创建平移矩阵
const translationMatrix = mat4.create();
mat4.translate(translationMatrix, identityMatrix, [2.0, 1.0, -3.0]);

// 手动构建平移矩阵
function createTranslationMatrix(tx, ty, tz) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    tx, ty, tz, 1
  ];
}
```

### 旋转变换

#### 绕 X 轴旋转
```
绕X轴旋转：
   y            y
   |            |
   |    →      /
   |          /
   +--- x    +--- x
  /         /
 z         z
```

X 轴旋转矩阵：
```
[1, 0, 0, 0]
[0, cos, -sin, 0]
[0, sin, cos, 0]
[0, 0, 0, 1]
```

#### 绕 Y 轴旋转
```
绕Y轴旋转：
   y            y
   |            |
   |    →       |
   |            |
   +--- x    x--+
  /            /
 z            z
```

Y 轴旋转矩阵：
```
[cos, 0, sin, 0]
[0, 1, 0, 0]
[-sin, 0, cos, 0]
[0, 0, 0, 1]
```

#### 绕 Z 轴旋转
```
绕Z轴旋转：
   y            x
   |           /
   |    →     /
   |         /
   +--- x   +--- y
  /         
 z         
```

Z 轴旋转矩阵：
```
[cos, -sin, 0, 0]
[sin, cos, 0, 0]
[0, 0, 1, 0]
[0, 0, 0, 1]
```

```javascript
// 创建旋转矩阵
const rotationMatrix = mat4.create();

// 绕X轴旋转45度
mat4.rotateX(rotationMatrix, identityMatrix, Math.PI / 4);

// 绕Y轴旋转30度
mat4.rotateY(rotationMatrix, identityMatrix, Math.PI / 6);

// 绕Z轴旋转60度
mat4.rotateZ(rotationMatrix, identityMatrix, Math.PI / 3);

// 手动构建绕X轴旋转矩阵
function createRotationXMatrix(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    1, 0, 0, 0,
    0, c, -s, 0,
    0, s, c, 0,
    0, 0, 0, 1
  ];
}
```

### 缩放变换
改变物体大小，可非均匀缩放：
```
均匀缩放：    非均匀缩放：
  △            △
  |\           |\
  | \    →     | \
  |__\         |  \
               |___\
```
缩放矩阵：
```
[sx, 0, 0, 0]
[0, sy, 0, 0]
[0, 0, sz, 0]
[0, 0, 0, 1]
```

```javascript
// 创建缩放矩阵
const scaleMatrix = mat4.create();
mat4.scale(scaleMatrix, identityMatrix, [2.0, 1.5, 0.5]); // 非均匀缩放

// 手动构建缩放矩阵
function createScaleMatrix(sx, sy, sz) {
  return [
    sx, 0, 0, 0,
    0, sy, 0, 0,
    0, 0, sz, 0,
    0, 0, 0, 1
  ];
}
```

## 变换组合与顺序

### 变换顺序重要性
矩阵乘法不满足交换律，顺序影响最终结果：
```
先平移后旋转：     先旋转后平移：
  移动物体          旋转物体
  然后旋转          然后移动
    △               △
    |               |
    |    ≠          |
   /               /
  /               /
```

### 矩阵乘法
```javascript
// 组合变换：先缩放，再旋转，最后平移
const modelMatrix = mat4.create();
mat4.translate(modelMatrix, modelMatrix, [2, 1, 0]);
mat4.rotateY(modelMatrix, modelMatrix, Math.PI / 4);
mat4.scale(modelMatrix, modelMatrix, [1, 2, 1]);

// 等效的手动组合
const translation = createTranslationMatrix(2, 1, 0);
const rotation = createRotationYMatrix(Math.PI / 4);
const scale = createScaleMatrix(1, 2, 1);

const combinedMatrix = mat4.create();
mat4.multiply(combinedMatrix, translation, rotation);
mat4.multiply(combinedMatrix, combinedMatrix, scale);
```

### 局部与全局变换
```javascript
// 局部坐标系变换（相对于自身）
function localTransform(object, localTranslation, localRotation) {
  const modelMatrix = mat4.create();
  
  // 应用局部变换
  mat4.translate(modelMatrix, modelMatrix, localTranslation);
  mat4.rotateY(modelMatrix, modelMatrix, localRotation);
  
  return modelMatrix;
}

// 全局坐标系变换（相对于世界）
function globalTransform(object, worldPosition, worldOrientation) {
  const modelMatrix = mat4.create();
  
  // 先定位到世界位置，再应用方向
  mat4.translate(modelMatrix, modelMatrix, worldPosition);
  mat4.multiply(modelMatrix, modelMatrix, worldOrientation);
  
  return modelMatrix;
}
```

## 视图变换矩阵

### 相机变换
将世界坐标转换到相机坐标系：
```javascript
// 创建视图矩阵
function createViewMatrix(eye, target, up) {
  const viewMatrix = mat4.create();
  mat4.lookAt(viewMatrix, eye, target, up);
  return viewMatrix;
}

// 手动实现lookAt
function lookAtManual(eye, target, up) {
  const z = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), eye, target));
  const x = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), up, z));
  const y = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), z, x));
  
  return [
    x[0], x[1], x[2], -vec3.dot(x, eye),
    y[0], y[1], y[2], -vec3.dot(y, eye),
    z[0], z[1], z[2], -vec3.dot(z, eye),
    0, 0, 0, 1
  ];
}
```

## 投影变换矩阵

### 透视投影
```javascript
// 透视投影矩阵
function createPerspectiveProjection(fov, aspect, near, far) {
  const projMatrix = mat4.create();
  mat4.perspective(projMatrix, fov, aspect, near, far);
  return projMatrix;
}

// 手动构建透视投影矩阵
function perspectiveManual(fov, aspect, near, far) {
  const f = 1.0 / Math.tan(fov / 2);
  const rangeInv = 1.0 / (near - far);
  
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, 2 * near * far * rangeInv, 0
  ];
}
```

### 正交投影
```javascript
// 正交投影矩阵
function createOrthographicProjection(left, right, bottom, top, near, far) {
  const projMatrix = mat4.create();
  mat4.ortho(projMatrix, left, right, bottom, top, near, far);
  return projMatrix;
}

// 手动构建正交投影矩阵
function orthoManual(left, right, bottom, top, near, far) {
  const lr = 1.0 / (left - right);
  const bt = 1.0 / (bottom - top);
  const nf = 1.0 / (near - far);
  
  return [
    -2 * lr, 0, 0, 0,
    0, -2 * bt, 0, 0,
    0, 0, 2 * nf, 0,
    (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1
  ];
}
```

## 法线变换矩阵

### 法线矩阵计算
法线向量需要特殊变换，使用模型视图矩阵的逆转置：
```javascript
// 计算法线矩阵
function createNormalMatrix(modelViewMatrix) {
  const normalMatrix = mat3.create();
  
  // 从4x4矩阵提取3x3部分
  const m3 = mat3.fromMat4(mat3.create(), modelViewMatrix);
  
  // 计算逆转置
  mat3.invert(normalMatrix, m3);
  mat3.transpose(normalMatrix, normalMatrix);
  
  return normalMatrix;
}

// 使用glMatrix简化版本
function createNormalMatrixGL(modelViewMatrix) {
  const normalMatrix = mat3.create();
  mat3.normalFromMat4(normalMatrix, modelViewMatrix);
  return normalMatrix;
}
```

## 矩阵运算与性能

### 矩阵乘法优化
```javascript
// 手动4x4矩阵乘法（理解原理）
function multiplyMat4(a, b) {
  const result = new Float32Array(16);
  
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result[i * 4 + j] = 
        a[i * 4 + 0] * b[0 * 4 + j] +
        a[i * 4 + 1] * b[1 * 4 + j] +
        a[i * 4 + 2] * b[2 * 4 + j] +
        a[i * 4 + 3] * b[3 * 4 + j];
    }
  }
  
  return result;
}
```

### 矩阵求逆
```javascript
// 使用glMatrix进行矩阵求逆
const matrix = mat4.create();
mat4.rotateX(matrix, matrix, Math.PI / 4);

const inverseMatrix = mat4.create();
mat4.invert(inverseMatrix, matrix);

// 验证：矩阵 × 逆矩阵 = 单位矩阵
const identity = mat4.create();
mat4.multiply(identity, matrix, inverseMatrix);
```

## 变换层级系统

### 父子变换关系
```javascript
class TransformNode {
  constructor() {
    this.localMatrix = mat4.create();
    this.worldMatrix = mat4.create();
    this.children = [];
    this.parent = null;
  }
  
  // 更新世界矩阵
  updateWorldMatrix(parentWorldMatrix = null) {
    if (parentWorldMatrix) {
      mat4.multiply(this.worldMatrix, parentWorldMatrix, this.localMatrix);
    } else {
      mat4.copy(this.worldMatrix, this.localMatrix);
    }
    
    // 更新所有子节点
    for (const child of this.children) {
      child.updateWorldMatrix(this.worldMatrix);
    }
  }
  
  // 添加局部变换
  translate(x, y, z) {
    mat4.translate(this.localMatrix, this.localMatrix, [x, y, z]);
  }
  
  rotateY(angle) {
    mat4.rotateY(this.localMatrix, this.localMatrix, angle);
  }
  
  scale(x, y, z) {
    mat4.scale(this.localMatrix, this.localMatrix, [x, y, z]);
  }
}
```

## 变换动画

### 矩阵插值
```javascript
// 矩阵插值（用于动画）
function interpolateMat4(result, start, end, t) {
  for (let i = 0; i < 16; i++) {
    result[i] = start[i] + (end[i] - start[i]) * t;
  }
}

// 使用四元数进行旋转插值（更平滑）
function interpolateRotation(result, startQuat, endQuat, t) {
  const interpolatedQuat = quat.create();
  quat.slerp(interpolatedQuat, startQuat, endQuat, t);
  mat4.fromQuat(result, interpolatedQuat);
}
```

## 着色器中的矩阵变换

### 顶点着色器
```glsl
// 完整的变换管线
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // 位置变换
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vec4 viewPosition = uViewMatrix * worldPosition;
  gl_Position = uProjectionMatrix * viewPosition;
  
  // 法线变换
  vNormal = normalize(uNormalMatrix * aNormal);
  vPosition = worldPosition.xyz;
}
```

### 矩阵传递
```javascript
// 设置着色器uniform
function setMatrixUniforms(gl, program, modelMatrix, viewMatrix, projectionMatrix) {
  // 计算MVP矩阵
  const mvpMatrix = mat4.create();
  mat4.multiply(mvpMatrix, projectionMatrix, viewMatrix);
  mat4.multiply(mvpMatrix, mvpMatrix, modelMatrix);
  
  // 计算法线矩阵
  const modelViewMatrix = mat4.create();
  mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
  const normalMatrix = mat3.create();
  mat3.normalFromMat4(normalMatrix, modelViewMatrix);
  
  // 传递到着色器
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModelMatrix'), false, modelMatrix);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uViewMatrix'), false, viewMatrix);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProjectionMatrix'), false, projectionMatrix);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uMVPMatrix'), false, mvpMatrix);
  gl.uniformMatrix3fv(gl.getUniformLocation(program, 'uNormalMatrix'), false, normalMatrix);
}
```

## 变换调试与可视化

### 变换辅助显示
```javascript
// 显示变换矩阵信息
function debugTransform(label, matrix) {
  console.log(`${label}:`);
  for (let i = 0; i < 4; i++) {
    console.log(
      matrix[i * 4].toFixed(3),
      matrix[i * 4 + 1].toFixed(3),
      matrix[i * 4 + 2].toFixed(3),
      matrix[i * 4 + 3].toFixed(3)
    );
  }
}

// 提取变换信息
function extractTransformInfo(matrix) {
  const position = vec3.create();
  const scale = vec3.create();
  const rotation = quat.create();
  
  mat4.getTranslation(position, matrix);
  mat4.getScaling(scale, matrix);
  mat4.getRotation(rotation, matrix);
  
  return { position, scale, rotation };
}
```