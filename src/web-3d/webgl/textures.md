# 纹理与材质

纹理和材质是 WebGL 中赋予 3D 对象视觉细节的核心技术。纹理是应用到模型表面的 2D 图像，而材质则定义了表面对光线的反应方式。两者结合创造了丰富多彩、细节丰富的视觉体验。

## 纹理基础

纹理是存储在 GPU 内存中的图像数据，通过纹理坐标映射到 3D 模型表面。WebGL 支持多种纹理格式和类型，为表面提供颜色、法线、高光等细节信息。

特点：
- 将 2D 图像映射到 3D 几何体
- 支持多种像素格式和数据类型
- 硬件加速的纹理采样和滤波

示意图 (纹理映射)：
```
2D纹理图像         3D模型表面
+---------+        +---------+
|#########|        |#########|
|#########| 映射到  |#########|
|#########|  ===>  |#########|
+---------+        +---------+
纹理坐标(u,v)       模型表面点
```

## 纹理坐标

纹理坐标 (UV 坐标) 定义纹理图像到模型表面的映射关系。坐标范围通常为 [0,1]，表示纹理图像的相对位置。

特点：
- 每个顶点关联纹理坐标 (u,v)
- u 表示水平方向，v 表示垂直方向
- 支持多种环绕模式处理坐标超出范围的情况

纹理坐标示意图：
```
纹理坐标空间 (0,0)到(1,1)：
(0,0) -------- (1,0)
  |               |
  |   纹理图像    |
  |               |
(0,1) -------- (1,1)

模型表面UV映射：
   v0(0,0) ---- v1(1,0)
     |            |
     |  表面      |
     |            |
   v2(0,1) ---- v3(1,1)
```

## 纹理创建与加载

在 WebGL 中创建纹理涉及多个步骤：创建纹理对象、设置参数、加载图像数据、生成 MIPMAP。

特点：
- 异步图像加载需要回调处理
- 纹理参数控制采样行为
- MIPMAP 提高渲染质量和性能

纹理创建流程：
```javascript
// 创建纹理对象
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

// 设置临时纹理（1x1像素）
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
              new Uint8Array([255, 0, 0, 255]));

// 加载图像
const image = new Image();
image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
};
image.src = 'texture.jpg';
```

## 纹理滤波

纹理滤波控制纹理采样时如何从纹素 (纹理像素) 计算片段颜色。主要滤波模式包括最近邻和线性滤波。

特点：
- 放大滤波：处理纹理被放大的情况
- 缩小滤波：处理纹理被缩小的情况
- 影响视觉质量和性能

滤波模式示意图：
```
最近邻滤波：      线性滤波：
+---+---+        +---+---+
|A  |B  |        |A  |B  |
|   |   |   =>   |   |   |
+---+---+        +---+---+
|C  |D  |        |C  |D  |
|   |   |        |   |   |
+---+---+        +---+---+

采样点(×)        采样点(×)
结果：最近纹素    结果：周围纹素加权平均
```

滤波设置代码：
```javascript
// 缩小滤波（纹理比屏幕像素小）
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

// 放大滤波（纹理比屏幕像素大）
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
```

## 纹理环绕

纹理环绕模式定义当纹理坐标超出 [0,1] 范围时的行为。常用模式包括重复、镜像重复和钳制到边缘。

特点：
- 控制纹理在模型表面的平铺方式
- 不同模式适合不同使用场景
- 影响纹理接缝处理

环绕模式示意图：
```
重复(REPEAT)：     镜像重复(MIRRORED_REPEAT)：
[AB][AB][AB]      [AB][BA][AB]
                  ←→ ←→ ←→

钳制到边缘(CLAMP_TO_EDGE)：
[AB][BB][BB]
      ↑
  边缘延伸
```

环绕模式设置：
```javascript
// S方向（水平）环绕
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);

// T方向（垂直）环绕  
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
```

## MIPMAP

MIPMAP 是纹理的一系列逐渐缩小的版本，用于提高缩小滤波的质量和性能。WebGL 可以自动生成 MIPMAP 链。

特点：
- 减少远处物体的闪烁和锯齿
- 提高纹理缓存效率
- 占用额外内存 (约多 33%)

MIPMAP 链示意图：
```
MIPMAP 级别：
级别0: 256x256  (原始纹理)
级别1: 128x128
级别2: 64x64
级别3: 32x32
...
级别8: 1x1
```

MIPMAP 生成和使用：
```javascript
// 生成 MIPMAP
gl.generateMipmap(gl.TEXTURE_2D);

// 使用 MIPMAP 滤波
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
```

## 纹理单元与采样器

WebGL 使用纹理单元管理多个纹理，采样器定义如何在着色器中访问纹理。一个着色器程序可以同时使用多个纹理。

特点：
- 支持多纹理渲染
- 纹理单元数量有限 (通常 8-16 个)
- 采样器统一变量连接纹理单元

纹理绑定流程：
```
激活纹理单元 → 绑定纹理 → 设置采样器统一变量
     ↓            ↓            ↓
gl.activeTexture() gl.bindTexture() gl.uniform1i()
```

多纹理使用代码：
```javascript
// 绑定漫反射纹理到单元0
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);
gl.uniform1i(diffuseSamplerLocation, 0);

// 绑定法线纹理到单元1  
gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, normalTexture);
gl.uniform1i(normalSamplerLocation, 1);
```

## 材质系统

材质定义表面对光线的反应方式，包括颜色、反射率、粗糙度等物理属性。材质与纹理结合创建逼真表面。

特点：
- 基于物理的渲染 (PBR) 材质
- 多纹理输入定义不同材质属性
- 实时着色计算

基础材质属性：
```
漫反射颜色：表面基础颜色
镜面反射：高光颜色和强度
光泽度：表面光滑程度
法线：表面微观朝向
环境光遮蔽：环境光遮挡效果
```

## 漫反射纹理

漫反射纹理 (基础颜色纹理) 定义表面的基本颜色和图案，是最常用的纹理类型。

特点：
- 包含表面颜色信息
- 通常使用 sRGB 色彩空间
- 影响漫反射光照计算

漫反射纹理示意图：
```
表面外观由漫反射纹理决定：
砖墙纹理 → 砖墙表面
木纹纹理 → 木质表面
金属纹理 → 金属表面
```

着色器采样代码：
```glsl
uniform sampler2D uDiffuseMap;
varying vec2 vTexCoord;

void main() {
    vec4 diffuseColor = texture2D(uDiffuseMap, vTexCoord);
    // 使用 diffuseColor 进行光照计算
}
```

## 法线纹理

法线纹理存储表面法线向量信息，用于模拟微观几何细节而不增加顶点数量。

特点：
- RGB 通道编码法线向量 (x,y,z)
- 切线空间法线便于模型重用
- 显著增强表面细节感

法线向量编码：
```
法线向量范围：(-1,-1,-1) 到 (1,1,1)
纹理颜色范围：(0,0,0) 到 (1,1,1)
编码：color = normal * 0.5 + 0.5
解码：normal = color * 2.0 - 1.0
```

法线贴图效果示意图：
```
平面几何 + 法线贴图 = 细节丰富的表面
  □□□        /\/\/\
  □□□  =>  /\/\/\/\
  □□□      \/\/\/\/
```

法线纹理使用：
```glsl
uniform sampler2D uNormalMap;
varying vec2 vTexCoord;
varying vec3 vTangent;
varying vec3 vBitangent;
varying vec3 vNormal;

void main() {
    // 从法线贴图获取切线空间法线
    vec3 tangentNormal = texture2D(uNormalMap, vTexCoord).xyz * 2.0 - 1.0;
    
    // 构建切线空间到世界空间的矩阵
    mat3 TBN = mat3(vTangent, vBitangent, vNormal);
    
    // 转换到世界空间
    vec3 worldNormal = TBN * tangentNormal;
}
```

## 高光纹理

高光纹理控制表面的镜面反射特性，定义不同区域的反光强度和颜色。

特点：
- 单通道或多通道控制反射
- 金属工作流使用金属度贴图
- 镜面工作流使用镜面贴图

高光纹理类型：
```
金属度贴图：  粗糙度贴图：  镜面贴图：
[0.0-1.0]    [0.0-1.0]    [RGB颜色]
金属/非金属   表面粗糙度   镜面反射颜色
```

## 环境光遮蔽纹理

环境光遮蔽 (AO) 纹理模拟环境光在表面凹陷处的遮挡效果，增强场景的深度感和真实感。

特点：
- 单通道灰度图像
- 预计算的静态光照信息
- 增强几何感知

AO 效果示意图：
```
无AO：        有AO：
均匀照明      角落变暗
[    ]       [ 暗 ]
/    \       / 暗 \
|    |      | 暗  |
\    /       \ 暗 /
```

## 立方体贴图

立方体贴图由 6 个 2D 纹理组成立方体，用于环境映射、天空盒和反射效果。

特点：
- 六个面：+X， -X， +Y， -Y， +Z， -Z
- 3D 纹理坐标 (方向向量)
- 适合全场景环境

立方体贴图结构：
```
    +Y
 -X +Z +X -Z
    -Y

采样使用方向向量而非UV坐标
```

天空盒使用代码：
```glsl
uniform samplerCube uSkybox;
varying vec3 vWorldPosition;

void main() {
    // 从相机位置到片段的方向
    vec3 viewDirection = normalize(vWorldPosition - uCameraPosition);
    
    // 立方体贴图采样
    vec4 skyColor = textureCube(uSkyBox, viewDirection);
    
    gl_FragColor = skyColor;
}
```

## 渲染目标纹理

渲染目标纹理 (FBO 附件) 允许将渲染结果输出到纹理而非屏幕，用于后期处理、阴影映射等高级效果。

特点：
- 离屏渲染到纹理
- 支持多渲染目标 (MRT)
- 用于多通道渲染

渲染到纹理流程：
```
创建FBO → 附加纹理 → 渲染到FBO → 使用纹理
   ↓         ↓          ↓         ↓
gl.createFramebuffer() gl.framebufferTexture2D() gl.bindFramebuffer() 作为输入纹理
```

后期处理示意图：
```
场景渲染 → 渲染目标纹理 → 后期处理着色器 → 最终输出
   ↓           ↓              ↓            ↓
几何通道     颜色纹理       模糊/调色等    屏幕显示
```

## 纹理压缩

纹理压缩减少显存占用和提高加载速度。WebGL 支持多种压缩纹理格式，如 ETC、ASTC、S3TC。

特点：
- 减少内存使用和带宽
- 保持视觉质量
- 硬件解码支持

压缩纹理使用：
```javascript
// 检查压缩纹理支持
const ext = gl.getExtension('WEBGL_compressed_texture_etc');

if (ext) {
    // 加载压缩纹理数据
    gl.compressedTexImage2D(gl.TEXTURE_2D, 0, ext.COMPRESSED_RGB8_ETC2, 
                           width, height, 0, compressedData);
}
```

## 性能优化

纹理使用对性能有显著影响，优化策略包括纹理图集、MIPMAP、压缩格式和合理的纹理尺寸。

优化策略示意图：
```
高内存使用 → 纹理压缩 → 合适尺寸 → MIPMAP → 纹理图集
    ↓           ↓           ↓         ↓         ↓
 原始纹理      ETC/ASTC   1024x1024  多级细节  批处理绘制
```