# CSS 基础

## 什么是 CSS？

**CSS (Cascading Style Sheets，层叠样式表)** 是一种用来描述 **HTML 文档样式**的语言。CSS 描述了元素被渲染的方式。

## 如何在 HTML 中引入 CSS

在 HTML 中使用 CSS 有三种方式：

### Inline CSS (内联样式)

直接在标签的 `style` 属性中写样式：

```html
<p style="color: red; font-size: 18px;">这是红色文字</p>
```

适合小范围快速修改，但不利于维护。

### Internal CSS (内部样式表)

在 HTML 文件的 `<head>` 中使用 `<style>` 标签：

```html
<head>
  <style>
    p {
      color: blue;
      font-size: 16px;
    }
  </style>
</head>
```

适合单页面项目。

### External CSS (外部样式表)

将样式写在独立的 `.css` 文件中，并通过 `<link>` 引入：

```html
<head>
  <link rel="stylesheet" href="style.css" />
</head>
```

这是最推荐的方式，便于复用和维护。

## CSS 语法规则

CSS 的基本语法由**选择器**和**声明块**组成：

```css
选择器 {
  属性: 值;
  属性: 值;
}
```

- **选择器**：指定要应用样式的 HTML 元素 (如 `h1`、`.class`、`#id`)。
- **属性**：要修改的样式特性 (如 `color`、`font-size`)。
- **值**：属性对应的具体值 (如 `green`、`24px`)。

示例：

```css
h1 {
  color: green;
  font-size: 24px;
}
```

## 注释

CSS 注释不会被浏览器解析，用于代码说明：

```css
/* 这是一个注释 */
p {
  color: gray; /* 设置段落文字为灰色 */
}
```

## 单位和值

CSS 中的值有多种类型，常见的有：

### 颜色

- 关键字：`red`、`blue`
- 十六进制：`#ff0000`
- RGB：`rgb(255, 0, 0)`
- RGBA (带透明度)：`rgba(255, 0, 0, 0.5)`

```css
p {
  color: red; /* 颜色名称 */
  color: #ff0000; /* 十六进制 */
  color: rgb(255, 0, 0); /* RGB */
  color: rgba(255, 0, 0, 0.5); /* RGB + 透明度 */
}
```

### 长度

```css
div {
  width: 100px; /* 像素 */

  height: 50%; /* 父级元素的百分比 */
  height: 50vw; /* 窗口宽度的百分比 */
  height: 50vh; /* 窗口高度的百分比 */

  padding: 2em; /* 相对于当前字体大小 */
  margin: 1rem; /* 相对于根元素字体大小 */

  line-height: 1.5; /* 倍数 */
}
```
