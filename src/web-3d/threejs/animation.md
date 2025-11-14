# 动画系统

## 动画基础概念

### Three.js 动画架构
```
动画系统层次:
应用程序
    ↓
AnimationMixer (动画混合器)
    ↓  
AnimationClip (动画片段)
    ↓
AnimationAction (动画动作)
    ↓
KeyframeTrack (关键帧轨道)
```

### 动画数据流
```
3D模型文件 → 加载器 → AnimationClip → AnimationMixer → 对象变换
 (GLTF)          ↓                    ↓               ↓
          几何体/材质数据       关键帧数据       混合权重控制
```

## 基础动画技术

### 手动更新动画
```javascript
// 基础旋转动画
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

function animate() {
    requestAnimationFrame(animate);
    
    // 手动更新变换
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    
    // 位置动画
    cube.position.y = Math.sin(Date.now() * 0.001) * 0.5;
    
    renderer.render(scene, camera);
}

animate();
```

### 使用 Clock 管理时间
```javascript
const clock = new THREE.Clock();

function animate() {
    const delta = clock.getDelta();        // 帧间时间（秒）
    const elapsedTime = clock.getElapsedTime(); // 总运行时间
    
    // 基于时间的稳定动画
    cube.rotation.x = elapsedTime * 0.5;
    cube.position.y = Math.sin(elapsedTime * 2) * 1.5;
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
```

## 关键帧动画系统

### AnimationClip 创建
```javascript
// 创建位置关键帧动画
const positionKF = new THREE.VectorKeyframeTrack(
    '.position',           // 目标属性路径
    [0, 1, 2, 3],          // 时间点（秒）
    [
        0, 0, 0,           // t=0: 位置 (0,0,0)
        2, 0, 0,           // t=1: 位置 (2,0,0)  
        2, 3, 0,           // t=2: 位置 (2,3,0)
        0, 3, 0            // t=3: 位置 (0,3,0)
    ]
);

// 创建旋转关键帧动画
const rotationKF = new THREE.QuaternionKeyframeTrack(
    '.quaternion',
    [0, 1, 2, 3],
    [
        ...new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), 0).toArray(),
        ...new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2).toArray(),
        ...new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI).toArray(),
        ...new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI*1.5).toArray()
    ]
);

// 创建动画片段
const clip = new THREE.AnimationClip('CubeAnimation', 3, [positionKF, rotationKF]);
```

### 动画混合器使用
```javascript
// 创建动画混合器
const mixer = new THREE.AnimationMixer(cube);

// 从动画片段创建动作
const action = mixer.clipAction(clip);

// 配置动画动作
action.setLoop(THREE.LoopRepeat);    // 循环模式
action.repetitions = Infinity;       // 重复次数
action.timeScale = 1.0;              // 播放速度
action.clampWhenFinished = false;    // 播放结束后的行为

// 播放动画
action.play();

// 在动画循环中更新混合器
function animate() {
    const delta = clock.getDelta();
    mixer.update(delta);  // 必须传入时间增量
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
```

## 动画动作控制

### 动作状态管理
```javascript
class AnimationController {
    constructor(mixer, clips) {
        this.mixer = mixer;
        this.actions = new Map();
        this.currentAction = null;
        
        // 为每个片段创建动作
        clips.forEach((clip, name) => {
            const action = mixer.clipAction(clip);
            this.actions.set(name, action);
        });
    }
    
    // 播放动画
    play(name, fadeDuration = 0.5) {
        const newAction = this.actions.get(name);
        if (!newAction || newAction === this.currentAction) return;
        
        const oldAction = this.currentAction;
        
        if (oldAction) {
            // 淡出当前动作
            oldAction.fadeOut(fadeDuration);
        }
        
        // 淡入新动作
        newAction.reset();
        newAction.fadeIn(fadeDuration);
        newAction.play();
        
        this.currentAction = newAction;
    }
    
    // 停止动画
    stop(fadeDuration = 0.5) {
        if (this.currentAction) {
            this.currentAction.fadeOut(fadeDuration);
            this.currentAction = null;
        }
    }
    
    // 设置动画速度
    setSpeed(speed) {
        if (this.currentAction) {
            this.currentAction.timeScale = speed;
        }
    }
    
    // 交叉淡入淡出
    crossFade(fromName, toName, duration = 0.5) {
        const fromAction = this.actions.get(fromName);
        const toAction = this.actions.get(toName);
        
        if (!fromAction || !toAction) return;
        
        fromAction.fadeOut(duration);
        toAction.reset();
        toAction.fadeIn(duration);
        toAction.play();
        
        this.currentAction = toAction;
    }
}
```

### 动画权重混合
```javascript
// 多个动画同时播放并混合
const walkAction = mixer.clipAction(walkClip);
const runAction = mixer.clipAction(runClip);
const jumpAction = mixer.clipAction(jumpClip);

// 设置初始权重
walkAction.setEffectiveWeight(1.0);
runAction.setEffectiveWeight(0.0);
jumpAction.setEffectiveWeight(0.0);

// 播放所有动作
walkAction.play();
runAction.play();
jumpAction.play();

// 动态混合权重
function updateBlendWeights(speed, isJumping) {
    // 根据速度混合行走和奔跑
    const walkWeight = THREE.MathUtils.clamp(1 - speed, 0, 1);
    const runWeight = THREE.MathUtils.clamp(speed, 0, 1);
    
    walkAction.setEffectiveWeight(walkWeight);
    runAction.setEffectiveWeight(runWeight);
    
    // 跳跃动画权重
    jumpAction.setEffectiveWeight(isJumping ? 1.0 : 0.0);
}
```

## 骨骼动画

### 骨骼动画基础
```javascript
// 加载带骨骼的模型
const loader = new THREE.GLTFLoader();
loader.load('character.gltf', (gltf) => {
    const model = gltf.scene;
    const animations = gltf.animations;
    
    // 创建动画混合器
    const mixer = new THREE.AnimationMixer(model);
    
    // 创建所有动画动作
    const actions = {};
    animations.forEach((clip) => {
        actions[clip.name] = mixer.clipAction(clip);
    });
    
    // 播放空闲动画
    actions['idle'].play();
    
    scene.add(model);
    
    // 在动画循环中更新
    function animate() {
        mixer.update(clock.getDelta());
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
});
```

### 骨骼动画控制
```javascript
class CharacterAnimator {
    constructor(model, animations) {
        this.model = model;
        this.mixer = new THREE.AnimationMixer(model);
        this.actions = {};
        this.currentAction = null;
        
        // 初始化所有动画
        animations.forEach(clip => {
            this.actions[clip.name] = this.mixer.clipAction(clip);
        });
        
        // 设置默认动画
        this.playAction('idle');
    }
    
    playAction(name, fadeDuration = 0.2) {
        const newAction = this.actions[name];
        if (!newAction) return;
        
        const oldAction = this.currentAction;
        
        if (oldAction === newAction) return;
        
        if (oldAction) {
            oldAction.fadeOut(fadeDuration);
        }
        
        newAction.reset();
        newAction.fadeIn(fadeDuration);
        newAction.play();
        
        this.currentAction = newAction;
    }
    
    update(delta) {
        this.mixer.update(delta);
    }
    
    // 基于角色状态更新动画
    updateFromInput(moveDirection, isRunning, isJumping) {
        if (isJumping) {
            this.playAction('jump');
        } else if (moveDirection.length() > 0) {
            if (isRunning) {
                this.playAction('run');
            } else {
                this.playAction('walk');
            }
        } else {
            this.playAction('idle');
        }
    }
}
```

## 变形目标动画

### 变形动画配置
```javascript
// 创建带变形目标的几何体
const geometry = new THREE.BoxGeometry(1, 1, 1);

// 添加变形目标
geometry.morphAttributes.position = [];
geometry.morphTargetsRelative = true;

// 变形目标1：拉伸
const morphTarget1 = [];
for (let i = 0; i < geometry.attributes.position.count; i++) {
    const x = geometry.attributes.position.getX(i);
    const y = geometry.attributes.position.getY(i);
    const z = geometry.attributes.position.getZ(i);
    
    // 在Y轴上拉伸
    morphTarget1.push(x, y * 2, z);
}
geometry.morphAttributes.position[0] = new THREE.Float32BufferAttribute(morphTarget1, 3);

// 变形目标2：扭曲
const morphTarget2 = [];
for (let i = 0; i < geometry.attributes.position.count; i++) {
    const x = geometry.attributes.position.getX(i);
    const y = geometry.attributes.position.getY(i);
    const z = geometry.attributes.position.getZ(i);
    
    // 在X轴上扭曲
    morphTarget2.push(x + y * 0.5, y, z);
}
geometry.morphAttributes.position[1] = new THREE.Float32BufferAttribute(morphTarget2, 3);

// 创建材质（支持变形）
const material = new THREE.MeshBasicMaterial({
    morphTargets: true
});

const mesh = new THREE.Mesh(geometry, material);
```

### 变形动画控制
```javascript
class MorphAnimator {
    constructor(mesh) {
        this.mesh = mesh;
        this.influences = new Array(mesh.morphTargetInfluences.length).fill(0);
        this.targets = new Array(mesh.morphTargetInfluences.length).fill(0);
    }
    
    // 设置变形目标权重
    setInfluence(index, value, duration = 1000) {
        this.targets[index] = value;
        
        // 平滑过渡到目标权重
        const startTime = Date.now();
        const startValue = this.influences[index];
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.influences[index] = THREE.MathUtils.lerp(
                startValue, value, progress
            );
            
            this.mesh.morphTargetInfluences[index] = this.influences[index];
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    // 表情混合（用于角色面部动画）
    setExpression(expressionWeights) {
        expressionWeights.forEach((weight, index) => {
            this.setInfluence(index, weight);
        });
    }
    
    // 随机表情动画
    randomExpression(duration = 2000) {
        const randomWeights = this.influences.map(() => Math.random());
        this.setExpression(randomWeights);
        
        // 定时切换表情
        setTimeout(() => {
            this.randomExpression(duration);
        }, duration);
    }
}
```

## 补间动画系统

### Tween.js 集成
```javascript
import TWEEN from 'three/examples/jsm/libs/tween.module.js';

// 位置补间动画
const positionTween = new TWEEN.Tween(cube.position)
    .to({ x: 5, y: 2, z: 0 }, 2000)        // 目标位置，持续时间
    .easing(TWEEN.Easing.Quadratic.Out)    // 缓动函数
    .onUpdate(() => {
        console.log('当前位置:', cube.position);
    })
    .onComplete(() => {
        console.log('动画完成');
    })
    .start();

// 旋转补间动画
const rotationTween = new TWEEN.Tween({ rotation: 0 })
    .to({ rotation: Math.PI * 2 }, 3000)
    .easing(TWEEN.Easing.Elastic.Out)
    .onUpdate((obj) => {
        cube.rotation.y = obj.rotation;
    })
    .start();

// 在动画循环中更新Tween
function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    renderer.render(scene, camera);
}
```

### 复杂补间序列
```javascript
// 创建动画序列
const animationSequence = new TWEEN.Tween(cube.position)
    .to({ x: 3, y: 0, z: 0 }, 1000)
    .easing(TWEEN.Easing.Quadratic.Out)
    
    .chain(
        new TWEEN.Tween(cube.position)
            .to({ x: 3, y: 3, z: 0 }, 1000)
            .easing(TWEEN.Easing.Quadratic.Out),
            
        new TWEEN.Tween(cube.position)
            .to({ x: 0, y: 3, z: 0 }, 1000)
            .easing(TWEEN.Easing.Quadratic.Out),
            
        new TWEEN.Tween(cube.position)
            .to({ x: 0, y: 0, z: 0 }, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(() => {
                console.log('动画序列完成');
            })
    )
    .start();
```

## 物理基础动画

### 弹簧动画系统
```javascript
class SpringAnimation {
    constructor(target, stiffness = 100, damping = 10, mass = 1) {
        this.target = target;
        this.stiffness = stiffness;
        this.damping = damping;
        this.mass = mass;
        
        this.position = target.position.clone();
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
    }
    
    update(delta) {
        // 计算弹簧力 (F = -k * x)
        const springForce = this.position.clone()
            .sub(this.target.position)
            .multiplyScalar(-this.stiffness);
        
        // 计算阻尼力 (F = -c * v)
        const dampingForce = this.velocity.clone()
            .multiplyScalar(-this.damping);
        
        // 总力
        const totalForce = springForce.add(dampingForce);
        
        // 加速度 (a = F / m)
        this.acceleration.copy(totalForce).divideScalar(this.mass);
        
        // 更新速度 (v = v + a * dt)
        this.velocity.add(this.acceleration.clone().multiplyScalar(delta));
        
        // 更新位置 (x = x + v * dt)
        this.position.add(this.velocity.clone().multiplyScalar(delta));
        
        // 应用位置
        this.target.position.copy(this.position);
    }
    
    // 添加冲击力
    addForce(force) {
        this.velocity.add(force);
    }
}
```

### 粒子系统动画
```javascript
class ParticleSystem {
    constructor(count = 1000) {
        this.particles = [];
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(count * 3);
        this.velocities = new Float32Array(count * 3);
        
        // 初始化粒子
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            // 随机位置
            this.positions[i3] = (Math.random() - 0.5) * 10;
            this.positions[i3 + 1] = (Math.random() - 0.5) * 10;
            this.positions[i3 + 2] = (Math.random() - 0.5) * 10;
            
            // 随机速度
            this.velocities[i3] = (Math.random() - 0.5) * 0.1;
            this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
            this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
        }
        
        this.geometry.setAttribute('position', 
            new THREE.BufferAttribute(this.positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1
        });
        
        this.points = new THREE.Points(this.geometry, material);
    }
    
    update(delta) {
        const positions = this.geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;
            
            // 更新位置
            positions[i3] += this.velocities[i3] * delta;
            positions[i3 + 1] += this.velocities[i3 + 1] * delta;
            positions[i3 + 2] += this.velocities[i3 + 2] * delta;
            
            // 简单的边界检查
            if (Math.abs(positions[i3]) > 5) this.velocities[i3] *= -1;
            if (Math.abs(positions[i3 + 1]) > 5) this.velocities[i3 + 1] *= -1;
            if (Math.abs(positions[i3 + 2]) > 5) this.velocities[i3 + 2] *= -1;
        }
        
        this.geometry.attributes.position.needsUpdate = true;
    }
}
```

## 高级动画技术

### 动画事件系统
```javascript
class AnimationEventSystem {
    constructor(mixer) {
        this.mixer = mixer;
        this.events = new Map();
        this.listeners = new Map();
    }
    
    // 添加动画事件
    addEvent(clipName, time, callback) {
        if (!this.events.has(clipName)) {
            this.events.set(clipName, []);
        }
        
        this.events.get(clipName).push({ time, callback });
    }
    
    // 监听动画混合器
    startListening() {
        this.mixer.addEventListener('loop', (event) => {
            this.handleAnimationEvent(event);
        });
        
        this.mixer.addEventListener('finished', (event) => {
            this.handleAnimationEvent(event);
        });
    }
    
    handleAnimationEvent(event) {
        const action = event.action;
        const clipName = action.getClip().name;
        const currentTime = action.time;
        
        const clipEvents = this.events.get(clipName);
        if (!clipEvents) return;
        
        clipEvents.forEach(event => {
            // 检查是否到达事件时间
            if (Math.abs(currentTime - event.time) < 0.016) { // 约1帧的容差
                event.callback();
            }
        });
    }
}
```

### 逆向运动学
```javascript
class SimpleIKSystem {
    constructor(chain) {
        this.chain = chain; // 骨骼链数组
        this.iterations = 10;
        this.tolerance = 0.01;
    }
    
    solve(target) {
        for (let i = 0; i < this.iterations; i++) {
            // 前向传递：从末端效应器到根节点
            let current = this.chain[this.chain.length - 1];
            let effectorPos = current.getWorldPosition(new THREE.Vector3());
            
            // 检查是否达到目标
            if (effectorPos.distanceTo(target) < this.tolerance) {
                break;
            }
            
            // 逆向传递：从末端效应器到根节点
            for (let j = this.chain.length - 1; j >= 0; j--) {
                const bone = this.chain[j];
                const bonePos = bone.getWorldPosition(new THREE.Vector3());
                const effectorPos = this.chain[this.chain.length - 1]
                    .getWorldPosition(new THREE.Vector3());
                
                // 计算到目标和到效应器的方向
                const toTarget = new THREE.Vector3().subVectors(target, bonePos).normalize();
                const toEffector = new THREE.Vector3().subVectors(effectorPos, bonePos).normalize();
                
                // 计算旋转
                const rotation = new THREE.Quaternion().setFromUnitVectors(toEffector, toTarget);
                
                // 应用旋转（简化版本）
                bone.quaternion.multiplyQuaternions(rotation, bone.quaternion);
                bone.quaternion.normalize();
            }
        }
    }
}
```

## 性能优化

### 动画性能监控
```javascript
class AnimationProfiler {
    constructor() {
        this.stats = {
            frameTime: 0,
            animationTime: 0,
            activeAnimations: 0,
            keyframeCount: 0
        };
        
        this.mixers = new Set();
    }
    
    addMixer(mixer) {
        this.mixers.add(mixer);
    }
    
    startFrame() {
        this.stats.frameStart = performance.now();
        this.stats.animationTime = 0;
        this.stats.activeAnimations = 0;
    }
    
    endFrame() {
        this.stats.frameTime = performance.now() - this.stats.frameStart;
    }
    
    // 包装混合器更新以进行性能监控
    wrapMixerUpdate() {
        this.mixers.forEach(mixer => {
            const originalUpdate = mixer.update;
            mixer.update = (delta) => {
                const start = performance.now();
                originalUpdate.call(mixer, delta);
                this.stats.animationTime += performance.now() - start;
                
                // 统计活跃动画
                this.stats.activeAnimations += mixer._actions.filter(action => 
                    action.isRunning()
                ).length;
            };
        });
    }
    
    getStats() {
        return this.stats;
    }
}
```

### 动画LOD系统
```javascript
class AnimationLOD {
    constructor(mixer, camera) {
        this.mixer = mixer;
        this.camera = camera;
        this.lodDistances = [10, 25, 50]; // LOD距离阈值
    }
    
    update(objectPosition) {
        const distance = this.camera.position.distanceTo(objectPosition);
        
        // 根据距离调整动画质量
        if (distance > this.lodDistances[2]) {
            // 最低质量：降低更新频率或停止动画
            this.mixer.timeScale = 0.5;
        } else if (distance > this.lodDistances[1]) {
            // 中等质量：正常速度
            this.mixer.timeScale = 1.0;
        } else {
            // 最高质量：正常速度
            this.mixer.timeScale = 1.0;
        }
        
        // 根据距离简化骨骼层次（如果适用）
        this.updateSkeletonLOD(distance);
    }
    
    updateSkeletonLOD(distance) {
        // 简化骨骼更新的实现
        // 在远距离时可以跳过某些骨骼的更新
    }
}
```