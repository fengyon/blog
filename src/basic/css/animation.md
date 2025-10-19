# CSS 动画

## 简介

CSS 动画允许元素在不同样式之间平滑过渡，无需使用 JavaScript。

```
静态元素  →  [动画过程]  →  结束状态
   ↓            ↓           ↓
初始样式      中间状态      最终样式
```

## 过渡 (Transitions)

### 基本概念

过渡动画在对应的样式改变时自动发生：

```
元素状态变化（由js、css等引起）:
┌─────────────┐   过渡过程    ┌─────────────┐
│  样式 A      │ ──────────→ │  样式 B      │
│  color: red │              │ color: blue │
└─────────────┘              └─────────────┘
```

### 语法

```css
.element {
  transition: css-property duration timing-function delay, css-property2
      duration2 timing-function2 delay2;
  transition: margin-right 2s ease-in-out 0.5s;
}
```

## 动画

```css
animation: name duration timing-function delay iteration-count direction
    fill-mode, name2 duration2 timing-functio2n delay2 iteration-count2
    direction2 fill-mode2;
```

### 关键帧 (Keyframes)

关键帧动画通过定义多个关键点来控制动画序列：

```
@keyframes 动画名称 {
  0% { /* 起始状态 */ }
  50% { /* 中间状态 */ }
  100% { /* 结束状态 */ }
}
```

示例：

```css
@keyframes bounce {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-30px);
  }
  100% {
    transform: translateY(0);
  }
}
```

视觉表示：

```
位置变化:
     50%: ↑ (-30px)
     ↗ ↘
0%: ○    ○: 100%
```

### 动画方向 (animation-direction)

```
normal (正常):
0% → 25% → 50% → 75% → 100% → 结束

reverse (反向):
100% → 75% → 50% → 25% → 0% → 结束

alternate (交替):
0% → 100% → 0% → 100% → ...

alternate-reverse (反向交替):
100% → 0% → 100% → 0% → ...
```

### 重复次数 (animation-iteration-count)

```
animation-iteration-count: 1
[======] 播放一次结束

animation-iteration-count: 3
[======][======][======] 播放三次结束

animation-iteration-count: infinite
[======][======][======][======]... 无限循环
```

### 填充模式 (animation-fill-mode)

```
none:
开始前: 初始样式
结束后: 回到初始样式

forwards:
开始前: 初始样式
结束后: 保持最后帧样式

backwards:
开始前: 应用第一帧样式
结束后: 回到初始样式

both:
开始前: 应用第一帧样式
结束后: 保持最后帧样式
```

### 缓动函数 (Timing Functions)

`transition-timing-function` 属性定义了过渡效果中速度变化的方式，控制动画在不同时间点的执行速度。

#### ease (默认值)

```css
/* 速度:     慢---快---慢 */
/* 相当于 cubic-bezier(0.25, 0.1, 0.25, 1.0) */
transition-timing-function: ease;
```

#### linear

```css
/* 匀速 */
transition-timing-function: linear;
```

#### ease-in

```css
/* 速度:     慢---快 */
/* 相当于 cubic-bezier(0.42, 0, 1.0, 1.0) */
transition-timing-function: ease-in;
```

#### ease-out

```css
/* 速度:     快---慢 */
/* 相当于 cubic-bezier(0, 0, 0.58, 1.0) */
transition-timing-function: ease-out;
```

#### ease-in-out

```css
/* 速度:     慢---快---慢 */
/* 相当于 cubic-bezier(0.42, 0, 0.58, 1.0) */
transition-timing-function: ease-in-out;
```

#### step-start

```css
/** 
 * 效果：立即跳到结束状态
 * 进度:     0% → 100% (瞬间完成)------- 100%
 */
transition-timing-function: step-start;
```

#### step-end

```css
/**
 * 效果：在过渡结束时瞬间完成
 * 进度:     0% --------0% → 100% (瞬间完成)
 */
transition-timing-function: step-end;
```

#### steps()

`steps()` 是 CSS `transition-timing-function` 属性的一个特殊函数，它允许将动画或过渡分成若干个离散的步骤，而不是平滑的连续变化。这种函数常用于创建逐帧动画或模拟数字效果。

```css
/**
 * n：正整数，表示动画被分成的步骤数量
 * <jumpterm>：可选参数，定义步骤变化发生的时机，可以是以下值之：
 *   jump-end 或 end（默认值）
 *   jump-start 或 start
 *   jump-none
 *   jump-both
 */
transition-timing-function: steps(n, <jumpterm>);
```

效果对比

```
steps(5, jumpterm)

时间轴:       0% ---- 25% ---- 50% ---- 75% ---- 100%
end:         A ---- B ---- C ---- D ---- E ····          跳过结束
start:         ····  A ---- B ---- C ---- D ---- E       跳过开始
jump-both:     ····  A -- B -- C -- D -- E  ····         跳过开始、结束
jump-none:   A  ----  B  ----  C  ----  D  ----  E       不跳过
             ↑               ↑                   ↑
            开始             变化点               结束
```

#### cubic-bezier()

cubic-bezier 函数定义了一个贝塞尔曲线，该曲线描述了动画的速度随时间的变化。

```css
/**
 * x1, x2 ∈ [0, 1]
 */
transition-timing-function: cubic-bezier(x1, y1, x2, y2);
```

由于贝塞尔曲线复杂，难以直观描述，[可以进入 cubic-bezier.com 进行在线调试](https://cubic-bezier.com)
