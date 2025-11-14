# 光照模型

## 光照基础概念

### 光线与材质交互
光照模型描述光线与物体表面材质的相互作用：
```
入射光线 → 表面材质 → 反射/折射光线
        ↓
    颜色感知
```

### 局部光照 vs 全局光照
```
局部光照：          全局光照：
只考虑直接光照      考虑所有光线交互
计算简单           计算复杂
  光源 → 物体       光源 → 物体 → 其他物体
                   ↓
                 环境光照
```

## 基础光照分量

### 环境光
模拟场景中间接光照，提供基础亮度：
```
环境光照 = 环境光颜色 × 材质环境反射系数

无环境光：    有环境光：
  ███           ███  
  █ █           ███
  ███           ███
完全黑暗       基础可见
```

GLSL实现：
```glsl
vec3 ambient = uAmbientLight * uMaterial.ambient;
```

### 漫反射
Lambertian反射，光线均匀散射：
```
漫反射强度 = 光颜色 × 材质漫反射系数 × max(0, N·L)

N: 表面法线
L: 光源方向

光线垂直照射最亮，角度越大越暗
   N
   |   L
   |  /
   | /
   |/ 
 表面
```

GLSL实现：
```glsl
vec3 lightDir = normalize(uLightPosition - fragPos);
float diff = max(dot(normal, lightDir), 0.0);
vec3 diffuse = uLightColor * uMaterial.diffuse * diff;
```

### 镜面反射
Phong模型，产生高光效果：
```
镜面反射强度 = 光颜色 × 材质镜面系数 × max(0, R·V)^光泽度

R: 反射光方向
V: 视线方向
光泽度: 控制高光范围

   L      R
    \    /
     \  /
      N        V
表面    \      /
         \    /
          \  /
           \/
```

GLSL实现：
```glsl
vec3 reflectDir = reflect(-lightDir, normal);
vec3 viewDir = normalize(uViewPosition - fragPos);
float spec = pow(max(dot(viewDir, reflectDir), 0.0), uMaterial.shininess);
vec3 specular = uLightColor * uMaterial.specular * spec;
```

## 经典光照模型

### Lambert模型
只包含漫反射分量的简单模型：
```glsl
vec3 lambertModel(vec3 normal, vec3 lightDir, vec3 lightColor, vec3 materialDiffuse) {
    float nDotL = max(dot(normal, lightDir), 0.0);
    return lightColor * materialDiffuse * nDotL;
}
```

### Phong模型
完整的漫反射+镜面反射模型：
```glsl
vec3 phongModel(vec3 normal, vec3 lightDir, vec3 viewDir, vec3 lightColor, 
                Material material) {
    // 漫反射
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = lightColor * material.diffuse * diff;
    
    // 镜面反射
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    vec3 specular = lightColor * material.specular * spec;
    
    return diffuse + specular;
}
```

### Blinn-Phong模型
改进的Phong模型，计算更高效：
```
Blinn-Phong使用半角向量H：
镜面反射强度 = 光颜色 × 材质镜面系数 × max(0, N·H)^光泽度

H = normalize(L + V)

   L      V
    \    /
     \  /
      H
       \
        N
```

GLSL实现：
```glsl
vec3 blinnPhongModel(vec3 normal, vec3 lightDir, vec3 viewDir, vec3 lightColor,
                     Material material) {
    // 漫反射
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = lightColor * material.diffuse * diff;
    
    // 镜面反射 (Blinn-Phong)
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), material.shininess);
    vec3 specular = lightColor * material.specular * spec;
    
    return diffuse + specular;
}
```

## 完整光照计算

### 单光源光照
```glsl
struct Material {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float shininess;
};

struct Light {
    vec3 position;
    vec3 color;
    vec3 ambient;
};

vec3 calculateLight(Light light, Material material, vec3 normal, 
                   vec3 fragPos, vec3 viewPos) {
    // 环境光
    vec3 ambient = light.ambient * material.ambient;
    
    // 漫反射
    vec3 lightDir = normalize(light.position - fragPos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = light.color * material.diffuse * diff;
    
    // 镜面反射 (Blinn-Phong)
    vec3 viewDir = normalize(viewPos - fragPos);
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), material.shininess);
    vec3 specular = light.color * material.specular * spec;
    
    return ambient + diffuse + specular;
}
```

### 多光源支持
```glsl
#define MAX_LIGHTS 8

struct DirectionalLight {
    vec3 direction;
    vec3 color;
    vec3 ambient;
};

struct PointLight {
    vec3 position;
    vec3 color;
    vec3 ambient;
    float constant;
    float linear;
    float quadratic;
};

struct SpotLight {
    vec3 position;
    vec3 direction;
    vec3 color;
    vec3 ambient;
    float cutOff;
    float outerCutOff;
    float constant;
    float linear;
    float quadratic;
};

uniform DirectionalLight uDirectionalLights[MAX_LIGHTS];
uniform PointLight uPointLights[MAX_LIGHTS];
uniform SpotLight uSpotLights[MAX_LIGHTS];
uniform int uNumDirectionalLights;
uniform int uNumPointLights;
uniform int uNumSpotLights;
```

## 光源类型实现

### 定向光
模拟无限远光源（如太阳）：
```glsl
vec3 calculateDirectionalLight(DirectionalLight light, Material material,
                              vec3 normal, vec3 viewDir) {
    vec3 lightDir = normalize(-light.direction);
    
    // 漫反射
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = light.color * material.diffuse * diff;
    
    // 镜面反射
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    vec3 specular = light.color * material.specular * spec;
    
    // 环境光
    vec3 ambient = light.ambient * material.ambient;
    
    return ambient + diffuse + specular;
}
```

### 点光源
模拟灯泡等放射状光源，支持衰减：
```
衰减公式：
衰减因子 = 1.0 / (常数项 + 线性项×距离 + 二次项×距离²)

光照强度随距离衰减：
  ● 光源
  /|\
 / | \  强度递减
/  |  \
```

GLSL实现：
```glsl
vec3 calculatePointLight(PointLight light, Material material, vec3 normal,
                        vec3 fragPos, vec3 viewDir) {
    vec3 lightDir = normalize(light.position - fragPos);
    float distance = length(light.position - fragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + 
                              light.quadratic * (distance * distance));
    
    // 漫反射
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = light.color * material.diffuse * diff;
    
    // 镜面反射
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    vec3 specular = light.color * material.specular * spec;
    
    // 环境光
    vec3 ambient = light.ambient * material.ambient;
    
    return (ambient + diffuse + specular) * attenuation;
}
```

### 聚光灯
模拟手电筒等锥形光源：
```
聚光灯锥体：
     光源位置
      /|\
     / | \  内锥角
    /  |  \ 外锥角
   /---|---\
```

GLSL实现：
```glsl
vec3 calculateSpotLight(SpotLight light, Material material, vec3 normal,
                       vec3 fragPos, vec3 viewDir) {
    vec3 lightDir = normalize(light.position - fragPos);
    float distance = length(light.position - fragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + 
                              light.quadratic * (distance * distance));
    
    // 聚光强度
    float theta = dot(lightDir, normalize(-light.direction));
    float epsilon = light.cutOff - light.outerCutOff;
    float intensity = clamp((theta - light.outerCutOff) / epsilon, 0.0, 1.0);
    
    // 漫反射
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = light.color * material.diffuse * diff;
    
    // 镜面反射
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    vec3 specular = light.color * material.specular * spec;
    
    // 环境光
    vec3 ambient = light.ambient * material.ambient;
    
    return (ambient + diffuse + specular) * attenuation * intensity;
}
```

## 高级光照技术

### 法线映射
使用纹理存储表面细节法线：
```glsl
uniform sampler2D uNormalMap;

vec3 calculateNormalFromMap(vec2 texCoords, vec3 normal, vec3 position) {
    vec3 tangentNormal = texture(uNormalMap, texCoords).xyz * 2.0 - 1.0;
    
    // 切线空间计算
    vec3 Q1 = dFdx(position);
    vec3 Q2 = dFdy(position);
    vec2 st1 = dFdx(texCoords);
    vec2 st2 = dFdy(texCoords);
    
    vec3 T = normalize(Q1 * st2.t - Q2 * st1.t);
    vec3 B = normalize(-Q1 * st2.s + Q2 * st1.s);
    mat3 TBN = mat3(T, B, normal);
    
    return normalize(TBN * tangentNormal);
}
```

### 视差映射
模拟深度效果：
```glsl
uniform sampler2D uDepthMap;

vec2 parallaxMapping(vec2 texCoords, vec3 viewDir) {
    float height = texture(uDepthMap, texCoords).r;
    vec2 p = viewDir.xy / viewDir.z * (height * uHeightScale);
    return texCoords - p;
}
```

### 高动态范围
```glsl
// 色调映射
vec3 toneMapping(vec3 hdrColor) {
    // Reinhard色调映射
    return hdrColor / (hdrColor + vec3(1.0));
    
    // ACES近似
    // return (hdrColor * (2.51 * hdrColor + 0.03)) / 
    //        (hdrColor * (2.43 * hdrColor + 0.59) + 0.14);
}
```

## 基于物理的渲染

### 微表面模型
```glsl
// Cook-Torrance BRDF
float distributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float nom = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / denom;
}

float geometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;

    float nom = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}

float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = geometrySchlickGGX(NdotV, roughness);
    float ggx1 = geometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}
```

### 完整PBR光照
```glsl
vec3 calculatePBR(Material material, vec3 normal, vec3 viewDir, 
                 vec3 lightDir, vec3 lightColor, vec3 radiance) {
    vec3 H = normalize(viewDir + lightDir);
    
    // Cook-Torrance BRDF
    float NDF = distributionGGX(normal, H, material.roughness);
    float G = geometrySmith(normal, viewDir, lightDir, material.roughness);
    vec3 F = fresnelSchlick(max(dot(H, viewDir), 0.0), material.F0);
    
    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * max(dot(normal, viewDir), 0.0) * max(dot(normal, lightDir), 0.0);
    vec3 specular = numerator / max(denominator, 0.001);
    
    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - material.metallic;
    
    float NdotL = max(dot(normal, lightDir), 0.0);
    
    return (kD * material.albedo / PI + specular) * radiance * NdotL;
}
```

## 光照优化技术

### 光照计算优化
```glsl
// 1. 提前计算常用值
vec3 calculateOptimizedLight(Light light, Material material, vec3 normal, 
                            vec3 fragPos, vec3 viewPos) {
    vec3 lightVec = light.position - fragPos;
    float distance = length(lightVec);
    vec3 lightDir = lightVec / distance; // 避免重复归一化
    
    // 2. 使用近似函数
    float attenuation = 1.0 / (distance * distance);
    
    // 3. 分支优化
    float nDotL = dot(normal, lightDir);
    if (nDotL <= 0.0) {
        return vec3(0.0); // 背面直接返回
    }
    
    // 继续计算...
}
```

### 延迟着色
```glsl
// G-Buffer结构
layout(location = 0) out vec4 gPosition;
layout(location = 1) out vec4 gNormal;
layout(location = 2) out vec4 gAlbedo;
layout(location = 3) out vec4 gMaterial;

void main() {
    // 存储几何信息到G-Buffer
    gPosition = vec4(fragPos, 1.0);
    gNormal = vec4(normalize(normal), 1.0);
    gAlbedo.rgb = texture(uAlbedoMap, texCoords).rgb;
    gMaterial.r = material.roughness;
    gMaterial.g = material.metallic;
}
```

## 实时阴影技术

### 阴影映射基础
```glsl
// 阴影计算
float calculateShadow(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir) {
    // 透视除法
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    projCoords = projCoords * 0.5 + 0.5;
    
    float closestDepth = texture(uShadowMap, projCoords.xy).r;
    float currentDepth = projCoords.z;
    
    // 阴影比较
    float shadow = currentDepth > closestDepth ? 1.0 : 0.0;
    return shadow;
}
```

### 百分比渐进软阴影
```glsl
float calculatePCFShadow(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir) {
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    projCoords = projCoords * 0.5 + 0.5;
    
    float shadow = 0.0;
    vec2 texelSize = 1.0 / textureSize(uShadowMap, 0);
    
    for(int x = -1; x <= 1; ++x) {
        for(int y = -1; y <= 1; ++y) {
            float pcfDepth = texture(uShadowMap, projCoords.xy + vec2(x, y) * texelSize).r;
            shadow += currentDepth - uShadowBias > pcfDepth ? 1.0 : 0.0;
        }
    }
    shadow /= 9.0;
    
    return shadow;
}
```

## JavaScript端光照设置

### 光照数据管理
```javascript
class LightManager {
    constructor(gl, program) {
        this.gl = gl;
        this.program = program;
        this.lights = [];
    }
    
    addDirectionalLight(direction, color, ambient) {
        this.lights.push({
            type: 'directional',
            direction: direction,
            color: color,
            ambient: ambient
        });
    }
    
    addPointLight(position, color, ambient, constant = 1.0, linear = 0.09, quadratic = 0.032) {
        this.lights.push({
            type: 'point',
            position: position,
            color: color,
            ambient: ambient,
            constant: constant,
            linear: linear,
            quadratic: quadratic
        });
    }
    
    updateShaderUniforms() {
        let dirCount = 0, pointCount = 0, spotCount = 0;
        
        this.lights.forEach((light, index) => {
            const prefix = this.getLightUniformPrefix(light.type, index);
            
            if (light.type === 'directional') {
                this.setUniform3f(`${prefix}.direction`, light.direction);
                dirCount++;
            } else if (light.type === 'point') {
                this.setUniform3f(`${prefix}.position`, light.position);
                this.setUniform1f(`${prefix}.constant`, light.constant);
                this.setUniform1f(`${prefix}.linear`, light.linear);
                this.setUniform1f(`${prefix}.quadratic`, light.quadratic);
                pointCount++;
            }
            
            this.setUniform3f(`${prefix}.color`, light.color);
            this.setUniform3f(`${prefix}.ambient`, light.ambient);
        });
        
        this.gl.uniform1i(this.gl.getUniformLocation(this.program, 'uNumDirectionalLights'), dirCount);
        this.gl.uniform1i(this.gl.getUniformLocation(this.program, 'uNumPointLights'), pointCount);
        this.gl.uniform1i(this.gl.getUniformLocation(this.program, 'uNumSpotLights'), spotCount);
    }
    
    getLightUniformPrefix(type, index) {
        const prefixes = {
            directional: 'uDirectionalLights',
            point: 'uPointLights',
            spot: 'uSpotLights'
        };
        return `${prefixes[type]}[${index}]`;
    }
    
    setUniform3f(name, value) {
        const location = this.gl.getUniformLocation(this.program, name);
        this.gl.uniform3f(location, value[0], value[1], value[2]);
    }
}
```