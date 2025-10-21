# Transform 3D

CSS 的`transform`属性提供了强大的图形变换功能，可以对网页元素进行平面和三维空间中的旋转、缩放、平移等操作。

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

## transform-style

transform-style 是 CSS 的一个属性，主要用于控制 3D 转换元素的子元素如何在 3D 空间中呈现。

```css
transform-style: flat | preserve-3d;
/**
 * flat: 默认值，所有的子元素都将被平面化，不会被放置到3D空间中。
 *       即使你对父元素进行了3D转换，子元素的视觉效果仍然是二维的。
 * preserve-3d: 保留子元素在3D空间中的效果，允许它们进行 3D 转换。
 */
```

## transform-origin

`transform-origin` 属性定义`transform`的基准点，此点坐标为 (0, 0, 0)， 再按 x 轴、y 轴、z 轴的方向生成坐标系，计算出每个像素点的坐标。

```css
transform-origin: x-axis y-axis z-axis;
/**
 * 
 * x-axis：x方向的原点位置，默认是元素的中心点
 * 可选值有: center, left, right, Npx, N%
 * y-axis：y方向的原点位置，默认是元素的中心点
 * 可选值: center, top, bottom, Npx, N%
 * z-axis：z方向的原点位置，默认是元素的中心点
 * 可选值: Npx
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

## perspective, perspective-origin

perspective 定义了观察者在 z 轴上的位置。

```css
.element {
  perspective: <length>;
  perspective-origin: x y;
  /**
   * x：观察者在x方向的位置，默认是元素的中心点
   * 可选值有: center, left, right, Npx, N%
   * y：观察者在y方向的位置，默认是元素的中心点
   * 可选值: center, top, bottom, Npx, N%
   * length: 观察者在z方向的位置，默认是0
   */
}
```

对于 3d 变换元素的子元素，可以定义自己的 `perspective`

```css
.parent {
  transform-style: preserve-3d;
  perspective: 1px;
}
.parent .child {
  perspective: <length>;
}
```

## translate3d, translateZ

位移变换可以移动元素的位置。使用`translate3d`方法，可以在 X、Y、Z 三个轴上进行平移。

### 语法：

```css
transform: translate3d(x, y, z);
/* 等价于 translateX(x) translateY(y) translateZ(z) */
```

```css
transform: translateZ(z);
/* 等价于 translate3d(0, 0, z) */
```

## rotate3d, rotateZ

`rotate3d`用于在三维空间中围绕指定轴进行旋转。它需要四个参数：旋转轴的方向（X, Y, Z）和旋转角度。

### 语法：

```css
transform: rotate3d(x, y, z, angle);
/**
 * `x`, `y`, `z`：指定旋转轴的向量。
 * `angle`：旋转角度，单位为度（deg）或弧度（rad）。
 */
```

```css
transform: rotateZ(angle);
/* 等价于 rotate3d(0, 0, 1, angle) */
```

### 示例：

```css
div {
  /* 绕 (0, 0, 0) 指向 (1, 1, 1) 的轴 顺时针旋转 45 度 */
  transform: rotate3d(1, 1, 1, 45deg);
}
```

## scale3d, scaleZ

`scale3d`允许在三维空间内对元素进行缩放。

```css
transform: scale3d(x, y, z);
/* 等价于 transform: scaleX(x) scaleY(y) scaleZ(z) */
```

```css
transform: scaleZ(z);
/* 等价于 transform: scale(1, 1, z) */
```

## matrix3d

`matrix3d`是 CSS3 提供的一种强大的变换方式，它允许通过一个 4x4 矩阵来实现复杂的三维变换。矩阵变换提供了对多个变换操作的综合控制，包括平移、旋转、缩放等。

### 语法：

```css
transform: matrix3d(
  a1,
  b1,
  c1,
  d1,
  a2,
  b2,
  c2,
  d2,
  a3,
  b3,
  c3,
  d3,
  a4,
  b4,
  c4,
  d4
);
```

这是一个 4x4 的矩阵，每个值对应着变换的系数，具体定义如下：

```
[ a1 b1 c1 d1 ]
[ a2 b2 c2 d2 ]
[ a3 b3 c3 d3 ]
[ a4 b4 c4 d4 ]
```

### 计算原理

假如有一个坐标点 (x, y, z)，经过上述转换得到 (x', y', z'), 其计算过程为：

```
注: C为常数

 [  x' ]          [ a1 b1 c1 d1 ]     [ x ]
 [  y' ]   =  C * [ a2 b2 c2 d2 ]  *  [ y ]
 [  z' ]          [ a3 b3 c3 d3 ]     [ z ]
 [  1  ]          [ a4 b4 c4 d4 ]     [ 1 ]

                   [   a1*x+b1*y+c1*z+d1   ]
           =  C *  [   a2*x+b2*y+c2*z+d2   ]
                   [   a3*x+b3*y+c3*z+d3   ]
                   [   a4*x+b4*y+c4*z+d4   ]

由最后一项可求出C，则得出
 [  x' ]       [   (a1*x+b1*y+c1*z+d1)/(a4*x+b4*y+c4*z+d4)   ]
 [  y' ]   =   [   (a2*x+b2*y+c2*z+d2)/(a4*x+b4*y+c4*z+d4)   ]
 [  z' ]       [   (a3*x+b3*y+c3*z+d3)/(a4*x+b4*y+c4*z+d4)   ]
 [  1  ]       [                       1                     ]



x' = (a1*x+b1*y+c1*z+d1)/(a4*x+b4*y+c4*z+d4)
y' = (a2*x+b2*y+c2*z+d2)/(a4*x+b4*y+c4*z+d4)
z' = (a3*x+b3*y+c3*z+d3)/(a4*x+b4*y+c4*z+d4)
```
