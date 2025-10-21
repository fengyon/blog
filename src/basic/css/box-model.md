# CSS 盒模型

## 什么是盒模型

CSS 盒模型是网页布局的基础概念，每个元素都被表示为一个矩形盒子，这个盒子由四个部分组成：

```
 ┌─────────────────────────────────────────┐
 │               外边距 Margin              │
 │  ┌───────────────────────────────────┐  │
 │  │            边框 Border             │  │
 │  │  ┌─────────────────────────────┐  │  │
 │  │  │        内边距 Padding        │  │  │
 │  │  │  ┌───────────────────────┐  │  │  │
 │  │  │  │     元素内容 Content   │  │  │  │
 │  │  │  └───────────────────────┘  │  │  │
 │  │  └─────────────────────────────┘  │  │
 │  └───────────────────────────────────┘  │
 └─────────────────────────────────────────┘
```

## Border Box vs IE Content Box

### Border Box (IE 盒模型)

- **width/height** = `content + padding + border`
- 真实占位 = `content + padding + border` = `width/height`

### Content Box (标准盒模型)

- **width/height** = `content`
- 真实占位 = `content + padding + border` = `width/height + padding + border`

### 对比示例

```html
<div class="standard-box">标准盒模型</div>
<div class="border-box">IE盒模型</div>
<style>
  .standard-box {
    box-sizing: content-box;
    width: 200px;
    padding: 20px;
    border: 5px solid red;
    /* 真实占位: 200 + 20*2 + 5*2 = 250px */
  }

  .border-box {
    box-sizing: border-box;
    width: 200px;
    padding: 20px;
    border: 5px solid blue;
    /* 真实占位: 200px */
  }
</style>
```

### 最佳实践

在布局中，首先要考虑的就是元素的真实占位，而`content box`的真实占位 = `width/height + padding + border`，需要多个变量并进行相加，复杂难用。

因此在实践中，首先使用`border box`，只有浏览器不兼容或者极特殊情况才使用`content box`。

```css
* {
  box-sizing: border-box;
}
```

## 外边距合并（折叠）

### 什么是外边距合并？

当两个垂直相邻的块级元素相遇时，它们的外边距会合并成一个外边距，取两者中的较大值。

### 合并的三种情况

#### 相邻兄弟元素

```html
<div class="box1">上边盒子</div>
<div class="box2">下边盒子</div>
<style>
  .box1 {
    margin-bottom: 30px;
  }
  .box2 {
    margin-top: 20px;
  }
  /* 实际间距 = max(30px, 20px) = 30px */
</style>
```

#### 父元素与第一个/最后一个子元素

```html
<div class="parent">
  <div class="child">子元素</div>
</div>
<style>
  .parent {
    margin-top: 20px;
  }
  .child {
    margin-top: 30px;
  }
</style>
```

#### 空块元素

```html
<div class="empty"></div>
<style>
  .empty {
    margin-top: 20px;
    margin-bottom: 30px;
  }
</style>
```

### 解决合并的方法

#### 使用 padding 替代 margin

```css
.parent {
  padding-top: 1px; /* 阻断合并 */
}
.child {
  margin-top: 30px;
}
```

#### 使用边框

```css
.parent {
  border-top: 1px solid transparent;
}
```

#### 创建 BFC（块级格式化上下文）

```css
.parent {
  overflow: hidden; /* 或 auto, scroll */
  /* 或者使用 display: flow-root; */
}
```

#### 使用浮动或定位

```css
.parent {
  position: absolute; /* fixed */
}
```

```css
.parent {
  float: left; /* 有副作用，谨慎使用 */
}
```
