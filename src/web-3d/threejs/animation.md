# 动画系统

## 动画系统概述

Three.js 提供了强大的动画系统，支持从简单的变换动画到复杂的骨骼动画。动画系统核心基于**关键帧**和**插值**概念，能够创建平滑自然的运动效果。

```
动画系统架构
├── 关键帧数据 (KeyframeTrack)
├── 动画剪辑 (AnimationClip)
├── 混合器 (AnimationMixer)
└── 动画动作 (AnimationAction)
```

## 基础变换动画

### 手动更新动画

最简单的动画方式是在渲染循环中手动更新对象属性：

```javascript
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 创建动画对象
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  
  // 旋转动画
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  
  // 上下浮动动画
  cube.position.y = Math.sin(Date.now() * 0.001) * 2;
  
  // 缩放动画
  cube.scale.x = 1 + Math.sin(Date.now() * 0.002) * 0.5;
  
  renderer.render(scene, camera);
}

animate();
```

### 动画曲线示意图

```
线性插值: 点A -------- 点B

缓动动画: 点A ╰──────╯ 点B
         慢→快→慢

弹性动画: 点A ╰─╮╭─╮╭─╯ 点B
         过冲+反弹
```

## 关键帧动画系统

### 动画剪辑 (AnimationClip)

AnimationClip 是一组关键帧轨道，定义了对象在特定时间段内如何变化。

```javascript
import * as THREE from 'three';

// 创建位置关键帧轨道
const positionKF = new THREE.KeyframeTrack(
  '.position',           // 目标属性路径
  [0, 1, 2, 3],          // 时间点（秒）
  [0,0,0, 2,0,0, 2,2,0, 0,0,0] // 位置值 [x,y,z, x,y,z, ...]
);

// 创建旋转关键帧轨道
const rotationKF = new THREE.KeyframeTrack(
  '.rotation[y]',        // Y轴旋转
  [0, 1, 2, 3],          // 时间点
  [0, Math.PI, Math.PI * 2, 0] // 旋转角度
);

// 创建缩放关键帧轨道
const scaleKF = new THREE.KeyframeTrack(
  '.scale',              // 缩放属性
  [0, 0.5, 1.5, 3],      // 时间点
  [1,1,1, 1.5,1.5,1.5, 0.5,0.5,0.5, 1,1,1] // 缩放值
);

// 创建动画剪辑
const clip = new THREE.AnimationClip('CubeAnimation', 3, [
  positionKF, 
  rotationKF, 
  scaleKF
]);
```

### 动画混合器 (AnimationMixer)

AnimationMixer 是动画系统的核心，用于播放和控制多个动画剪辑。

```javascript
// 创建动画混合器
const mixer = new THREE.AnimationMixer(cube);

// 从剪辑创建动画动作
const action = mixer.clipAction(clip);

// 配置动画动作
action.setLoop(THREE.LoopRepeat);    // 循环模式
action.setDuration(3);               // 持续时间
action.timeScale = 1.0;              // 播放速度
action.clampWhenFinished = true;     // 播放结束时保持最后一帧
action.weight = 1.0;                 // 混合权重

// 播放动画
action.play();

// 在动画循环中更新混合器
function animate() {
  requestAnimationFrame(animate);
  
  // 更新混合器（传入时间增量）
  const delta = clock.getDelta();
  mixer.update(delta);
  
  renderer.render(scene, camera);
}

const clock = new THREE.Clock();
animate();
```

### 动画动作控制

```javascript
// 动画动作状态管理
action.play();      // 开始播放
action.stop();      // 停止播放
action.reset();     // 重置到开始
action.pause();     // 暂停
action.isRunning(); // 检查是否正在运行

// 动画播放控制
action.time = 1.5;          // 跳转到特定时间
action.setEffectiveTimeScale(0.5); // 设置播放速度（0.5倍速）
action.setEffectiveWeight(0.5);    // 设置混合权重

// 循环模式设置
action.setLoop(THREE.LoopOnce);    // 播放一次
action.setLoop(THREE.LoopRepeat);  // 重复播放
action.setLoop(THREE.LoopPingPong); // 来回播放
```

## 骨骼动画

### 骨骼系统架构

```
骨骼层级结构
Skeleton
├── Bone (根骨骼)
│   ├── Bone (子骨骼1)
│   │   └── Bone (末端骨骼)
│   └── Bone (子骨骼2)
└── 绑定姿势矩阵
```

### 创建骨骼动画

```javascript
import * as THREE from 'three';

// 创建骨骼
const bones = [];
const rootBone = new THREE.Bone();
bones.push(rootBone);

const childBone1 = new THREE.Bone();
childBone1.position.y = 1;
rootBone.add(childBone1);
bones.push(childBone1);

const childBone2 = new THREE.Bone();
childBone2.position.y = 1;
childBone1.add(childBone2);
bones.push(childBone2);

// 创建骨架
const skeleton = new THREE.Skeleton(bones);

// 创建蒙皮几何体（如手臂）
const geometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
geometry.translate(0, 1, 0); // 移动到骨骼位置

// 为每个顶点分配骨骼权重
const position = geometry.attributes.position;
const vertex = new THREE.Vector3();
const skinIndices = [];
const skinWeights = [];

for (let i = 0; i < position.count; i++) {
  vertex.fromBufferAttribute(position, i);
  
  // 根据Y坐标分配骨骼影响
  const y = vertex.y + 1; // 归一化到 [0, 2]
  
  if (y < 1) {
    // 主要受根骨骼影响
    skinIndices.push(0, 0, 0, 0);
    skinWeights.push(1, 0, 0, 0);
  } else {
    // 受两个骨骼影响
    skinIndices.push(1, 2, 0, 0);
    skinWeights.push(0.5, 0.5, 0, 0);
  }
}

geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

// 创建蒙皮网格
const material = new THREE.MeshStandardMaterial({ 
  skinning: true, // 启用蒙皮
  color: 0xffffff 
});

const skinnedMesh = new THREE.SkinnedMesh(geometry, material);
skinnedMesh.add(rootBone);
skinnedMesh.bind(skeleton);

scene.add(skinnedMesh);

// 创建骨骼动画剪辑
const times = [0, 0.5, 1, 1.5, 2];
const values = [
  0, 0, 0,           // 初始旋转
  0, Math.PI/4, 0,   // 旋转45度
  0, -Math.PI/4, 0,  // 旋转-45度
  0, Math.PI/4, 0,   // 旋转45度
  0, 0, 0            // 回到初始
];

const rotationTrack = new THREE.VectorKeyframeTrack(
  '.bones[1].rotation',
  times,
  values
);

const clip = new THREE.AnimationClip('ArmAnimation', 2, [rotationTrack]);
const mixer = new THREE.AnimationMixer(skinnedMesh);
const action = mixer.clipAction(clip);
action.play();
```

## 动画库集成

### Tween.js 补间动画

Tween.js 提供简单的补间动画功能，适合简单的属性过渡。

```javascript
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
scene.add(cube);

// 创建从当前位置到新位置的补间动画
const tween = new TWEEN.Tween(cube.position)
  .to({ x: 5, y: 2, z: 0 }, 2000) // 目标位置和持续时间
  .easing(TWEEN.Easing.Quadratic.Out) // 缓动函数
  .onUpdate(() => {
    console.log('动画进行中:', cube.position.x);
  })
  .onComplete(() => {
    console.log('动画完成');
  })
  .start();

// 在动画循环中更新Tween
function animate() {
  requestAnimationFrame(animate);
  TWEEN.update(); // 更新所有补间动画
  renderer.render(scene, camera);
}
```

### GSAP 高级动画

GSAP 提供更强大的时间轴和复杂动画序列控制。

```javascript
import { gsap } from 'gsap';

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0x00ff00 })
);
scene.add(cube);

// 创建动画时间轴
const tl = gsap.timeline({
  repeat: -1,        // 无限循环
  yoyo: true         // 往返播放
});

// 链式动画序列
tl.to(cube.position, {
  duration: 1,
  x: 3,
  ease: "power2.out"
})
.to(cube.rotation, {
  duration: 1,
  y: Math.PI * 2,
  ease: "power2.inOut"
})
.to(cube.scale, {
  duration: 0.5,
  x: 2,
  y: 2,
  z: 2,
  ease: "elastic.out(1, 0.3)"
}, "-=0.5"); // 与前一个动画重叠0.5秒
```

## 动画混合与过渡

### 动画混合技术

```javascript
// 创建多个动画动作
const walkAction = mixer.clipAction(walkClip);
const runAction = mixer.clipAction(runClip);
const idleAction = mixer.clipAction(idleClip);

// 设置初始状态
idleAction.play();
idleAction.weight = 1;

// 动画混合函数
function blendToAction(newAction, blendTime = 0.3) {
  // 淡入新动画
  newAction.play();
  newAction.weight = 0;
  
  // 创建权重动画
  gsap.to(newAction, {
    weight: 1,
    duration: blendTime,
    ease: "power2.inOut"
  });
  
  // 淡出当前动画
  const currentActions = mixer._actions;
  currentActions.forEach(action => {
    if (action !== newAction && action.weight > 0) {
      gsap.to(action, {
        weight: 0,
        duration: blendTime,
        ease: "power2.inOut",
        onComplete: () => action.stop()
      });
    }
  });
}

// 使用混合过渡
blendToAction(walkAction);  // 过渡到行走动画
```

### 动画状态机

```javascript
class AnimationStateMachine {
  constructor(mixer, states) {
    this.mixer = mixer;
    this.states = states;
    this.currentState = null;
  }
  
  setState(stateName) {
    if (this.currentState === stateName) return;
    
    const newState = this.states[stateName];
    if (!newState) return;
    
    // 停止当前状态
    if (this.currentState) {
      const current = this.states[this.currentState];
      current.action.fadeOut(current.transitionOut);
    }
    
    // 播放新状态
    newState.action
      .reset()
      .setEffectiveTimeScale(newState.speed || 1)
      .fadeIn(newState.transitionIn)
      .play();
    
    this.currentState = stateName;
  }
}

// 使用状态机
const stateMachine = new AnimationStateMachine(mixer, {
  idle: {
    action: idleAction,
    transitionIn: 0.2,
    transitionOut: 0.2
  },
  walk: {
    action: walkAction,
    transitionIn: 0.3,
    transitionOut: 0.2,
    speed: 1.0
  },
  run: {
    action: runAction,
    transitionIn: 0.2,
    transitionOut: 0.1,
    speed: 1.5
  }
});

// 切换状态
stateMachine.setState('walk');
```

## 性能优化

### 动画性能优化技巧

```javascript
// 1. 使用实例化动画
const instancedMixers = [];
for (let i = 0; i < instanceCount; i++) {
  const mixer = new THREE.AnimationMixer(instancedMesh);
  const action = mixer.clipAction(clip);
  action.play();
  instancedMixers.push(mixer);
}

// 2. 按需更新动画
function animate() {
  const delta = clock.getDelta();
  
  // 只在需要时更新动画
  if (animationsNeedUpdate) {
    instancedMixers.forEach(mixer => mixer.update(delta));
  }
  
  renderer.render(scene, camera);
}

// 3. 动画LOD系统
function updateAnimations(distance) {
  if (distance > 100) {
    // 远处：降低更新频率
    mixer.timeScale = 0.5;
  } else if (distance > 50) {
    // 中距离：正常更新
    mixer.timeScale = 1.0;
  } else {
    // 近距离：高质量更新
    mixer.timeScale = 1.0;
  }
}

// 4. 动画裁剪
function checkAnimationVisibility() {
  const inView = isMeshInView(mesh);
  action.enabled = inView; // 禁用不可见动画
}
```

### 内存管理

```javascript
// 清理动画资源
function disposeAnimationResources() {
  // 停止所有动画
  mixer.stopAllAction();
  
  // 取消绑定剪辑
  mixer.uncacheClip(clip);
  
  // 清理混合器
  mixer.uncacheRoot(mesh);
}

// 动画资源预加载
class AnimationLoader {
  async preloadAnimations(animations) {
    const promises = animations.map(anim => 
      this.loadAnimation(anim.url)
    );
    return Promise.all(promises);
  }
  
  async loadAnimation(url) {
    const loader = new THREE.AnimationLoader();
    return loader.loadAsync(url);
  }
}
```