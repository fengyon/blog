# CSS 动画

## 简介

CSS 动画允许元素的样式在不同时间发生特定变化，而无需使用 JavaScript。

```
静态元素  →  [动画过程]  →  结束状态
   ↓            ↓           ↓
初始样式      中间状态      最终样式
```

## 坐标系

坐标系用于描述网页中的位置和方向。

- X 轴：屏幕水平方向，向右为正
- Y 轴：屏幕垂直方向，向下为正
- Z 轴：屏幕深度方向，从屏幕背面朝向正面为正
- 零点：根据元素的位置、动画、样式等确定

```
 z
  \
   \
    \
     \
      \
       +------------------->x
       |
       |
       |    显示屏正面
       |
       |
       |
       |
       ↓
       y
```

## transform

`transform` 可以对元素进行旋转、缩放、移动或倾斜等变换。

### transform-origin (变换基准点)

`transform-origin` 属性定义`transform`的基准点，此点坐标为 (0, 0, 0)， 再按 x 轴、y 轴、z 轴的方向生成坐标系，计算出每个像素点的坐标。

```css
transform-origin: x-axis y-axis z-axis;
/**
 * x-axis：x方向的原点位置，默认是元素的中心点
 * 可选值有: center, left, right, Npx, N%
 * y-axis：y方向的原点位置，默认是元素的中心点
 * 可选值: center, top, bottom, Npx, N%
 * z-axis：z方向的原点位置，默认是元素的中心点
 * 可选值: Npx Nem ，，，
 */
```

```
默认原点 (50% 50%) (center, center)
┌───────────┐
│           │
│     •     │
│     ⭡     │
└───────────┘

左上角原点 (0 0) (left, top)
⭣
•───────────┐
│           |
│           │
│           │
└───────────┘

右下角原点 (100% 100%) (right, bottom)
┌───────────┐
│           │
│           │
│           │
└───────────•
            ⭡
```

### translate (位移)

将元素从当前位置移动。

```css
transform: translate(50px, -30px);
/* 等价于 transform: translateX(50px) translateY(-30px) */
```

```
变换前：
┌─────────────┐
│             │
│   元素      │
│             │
└─────────────┘
    原点 (0,0)

变换后：
 ┌───────────────────────────────
 |
 |         ┌─────────────┐
 |         │             │
 |         │   元素      │
 |         │             │
 |         └─────────────┘
           距离原点 (50,-30)
```

### rotate (旋转)

围绕变换原点按顺时针方向旋转元素。

```css
transform: rotate(90deg);
/* 可以通过 transform-origin 定义旋转原点 */
```

```
旋转前：  ↷     旋转90度后：
┌─────┐
│     │       ┌──────────┐
│     │  -->  |          |
│     │       └──────────┘
└─────┘
```

### scale (缩放)

改变元素的尺寸。

```css
transform: scale(1.5);
/* 等价于 transform: scaleX(1.5) scaleY(1.5) */
```

```
缩放前：       scale(1.5) 放大1.5倍
┌──────┐        ┌────────────┐
│ 元素 │        │            │
│      │  -->   │    元素    │
└──────┘        │            │
                │            │
                └────────────┘
```

### skew (倾斜)

往 X 轴, Y 轴方向倾斜元素。

```css
/* transform: skew(ax, ay) */
transform: skew(30deg);
/**
 * 其变换后的坐标点为
 * x' = x + tan(ay) * y
 * y' = y + tan(ax) * x
 */
```

```
skewX(30deg)
坐标系0点为元素中心点
x' = x + 1.57 * y
y' = y

       倾斜前：           倾斜后：
(-1,-1)   (1,-1)   (-1.57, -1)
       ┌─────┐         ──────  (0.57, -1)
       │  ·  │ ----->   \  ·  \
       └─────┘           ──────  (1.57, 1)
 (-1,1)     (1,1)     (-0.43, 1)



skewY(60deg)
坐标系0点为元素中心点
x' = x
y' = y + 1.73 * x

       倾斜前：           倾斜后：
(-1,-1)   (1,-1)         (-1, -1.73)
       ┌─────┐              |\
       │  ·  │ -------->    | \
       └─────┘              |  \
 (-1,1)     (1,1) (-1,-0.73) \ ·\  (1, 0.73)
                              \  |
                               \ |
                                \|
                                (1, 2.73)

```

### matrix (矩阵变换)

使用 6 值矩阵进行复杂变换。

```css
transform: matrix(a, b, c, d, e, f);
```

矩阵表示：

```
[ a  c  e ]
[ b  d  f ]
[ 0  0  1 ]
```

假如有一个坐标点 (x, y)，经过 `matrix(a, b, c, d, e, f)`得到 (x', y'), 其计算过程为：

```

 [  x' ]       [ a  c  e ]   [ x ]
 [  y' ]   =   [ b  d  f ] * [ y ]
 [  1  ]       [ 0  0  1 ]   [ 1 ]

               [   a*x+c*y+e   ]
           =   [   b*x+d*y+f   ]
               [       1       ]

x' = a*x+c*y+e
y' = b*x+d*y+f
```

对于一个元素，把元素上的每个像素点都进行此计算，就可以得到新的元素。
上述的 translate, rotate, scale, skew 都可以看作是特殊的矩阵变换，在只设定一种变换时（多种变换不成立），其对应关系如下

```
[ scaleX  skewY   translateX ]       [ a  c  e ]
[  skewX  scaleY  translateY ]  ==>  [ b  d  f ]
[    0      0         1      ]       [ 0  0  1 ]

matrix(scaleX(), skewY(), skewX(), scaleY(), translateX(), translateY())
```

每种 transform 都可以看作与矩阵相乘，矩阵乘法运算不满足交换律，即 AB ≠ BA

这意味着有多个转换时，转换的顺序会影响到最终的效果

## transition

### 基本概念

transition 用来定义对应的样式发生改变时的改变时间、快慢、进度等

```
元素状态变化 (由js、css等引起) :
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

## animation

```css
animation: name duration timing-function delay iteration-count direction
    fill-mode, name2 duration2 timing-functio2n delay2 iteration-count2
    direction2 fill-mode2;
```

### animation-name (动画名称)

keyframes 通过定义多个关键点来控制动画序列：

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

### animation-direction (动画方向)

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

### animation-iteration-count (重复次数)

```
animation-iteration-count: 1
[======] 播放一次结束

animation-iteration-count: 3
[======][======][======] 播放三次结束

animation-iteration-count: infinite
[======][======][======][======]... 无限循环
```

### animation-fill-mode (填充模式)

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

### Timing Functions (缓动函数)

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
 *   jump-end 或 end (默认值) 
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
