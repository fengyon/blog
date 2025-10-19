# CSS 选择器

## 基本选择器

### 元素选择器

通过 HTML 元素名称选择元素

```css
p {
  color: blue;
}
```

### 类选择器

通过 class 属性选择元素，使用点号(.)前缀

```css
.class-name {
  font-size: 16px;
}
```

### ID 选择器

通过 id 属性选择元素，使用井号(#)前缀

```css
#element-id {
  background-color: yellow;
}
```

### 通配符选择器

选择所有元素，使用星号(\*)

```css
* {
  margin: 0;
  padding: 0;
}
```

## 组合选择器

### 后代选择器

选择指定元素内的所有后代元素（包括嵌套多层的元素）

```css
div p {
  color: red;
}
```

### 子选择器

仅选择指定元素的直接子元素，使用大于号(>)

```css
div > p {
  border: 1px solid black;
}
```

### 相邻兄弟选择器

选择紧接在另一个元素后的兄弟元素，使用加号(+)

```css
h1 + p {
  margin-top: 0;
}
```

### 通用兄弟选择器

选择指定元素之后的所有兄弟元素，使用波浪号(~)

```css
h1 ~ p {
  font-style: italic;
}
```

## 属性选择器

### 基础属性选择器

选择具有特定属性的元素

```css
[target] {
  background-color: yellow;
}
```

### 精确属性值选择器

选择属性值完全匹配的元素

```css
[type='submit'] {
  background-color: blue;
}
```

### 包含属性值选择器

选择属性值包含指定字符串的元素

```css
[class*='btn'] {
  padding: 10px;
}
```

### 开头匹配选择器

选择属性值以指定字符串开头的元素

```css
[href^='https'] {
  color: green;
}
```

### 结尾匹配选择器

选择属性值以指定字符串结尾的元素

```css
[src$='.jpg'] {
  border: 2px solid red;
}
```

### 空格分隔选择器

选择属性值中包含指定单词（空格分隔）的元素

```css
[class~='important'] {
  font-weight: bold;
}
```

## 伪类选择器

### 链接伪类

```css
/* 未访问的链接 */
a:link {
  color: blue;
}

/* 已访问的链接 */
a:visited {
  color: purple;
}

/* 鼠标悬停 */
a:hover {
  color: red;
}

/* 被点击时 */
a:active {
  color: green;
}
```

### 状态伪类

```css
/* 获取焦点的元素 */
input:focus {
  border-color: blue;
}

/* 启用的元素 */
input:enabled {
  background-color: white;
}

/* 禁用的元素 */
input:disabled {
  background-color: gray;
}

/* 被选中的复选框或单选按钮 */
input:checked {
  outline: 2px solid orange;
}
```

### 结构伪类

```css
/* 第一个子元素 */
p:first-child {
  font-size: 1.2em;
}

/* 最后一个子元素 */
p:last-child {
  margin-bottom: 0;
}

/* 第n个子元素 */
li:nth-child(3) {
  color: red;
}

/* 奇数子元素 */
tr:nth-child(odd) {
  background-color: #f2f2f2;
}

/* 偶数子元素 */
tr:nth-child(even) {
  background-color: #fff;
}

/* 唯一子元素 */
p:only-child {
  text-align: center;
}

/* 空元素 */
div:empty {
  display: none;
}
```

### 其他常用伪类

```css
/* 不是指定选择器的元素 */
p:not(.special) {
  color: black;
}

/* 根元素 */
:root {
  --main-color: #06c;
}

/* 目标元素（URL片段标识符指向的元素） */
:target {
  background-color: yellow;
}
```

## 伪元素选择器

### 常用伪元素

```css
/* 元素内容的第一个字母或汉字 */
p::first-letter {
  font-size: 2em;
  font-weight: bold;
}

/* 元素内容的第一行 */
p::first-line {
  text-transform: uppercase;
}

/* 在元素内容前插入内容 */
h1::before {
  content: '📌 ';
}

/* 在元素内容后插入内容 */
h1::after {
  content: ' 🎯';
}

/* 用户选中的文本部分 */
::selection {
  background-color: yellow;
  color: black;
}

/* 输入框的占位符文本 */
input::placeholder {
  color: #999;
  font-style: italic;
}
```

## 选择器的优先级和权重

当一个元素含有属性重复的 CSS 样式的`属性: 值`时，浏览器通过优先级来确定最终生效的样式。CSS 选择器的优先级由 **权重** 决定，规则如下：

| 选择器类型       | 示例                                     | 权重值           |
| ---------------- | ---------------------------------------- | ---------------- |
| 内联样式         | `<div style="color:red">`                | 1000             |
| ID 选择器        | `#header`                                | 100              |
| 类 / 属性 / 伪类 | `.box`, `[type="text"]`, `:hover`        | 10               |
| 元素 / 伪元素    | `div`, `p::before`                       | 1                |
| 通配符           | `*`                                      | 0                |
|  组合选择器    | `div p`, `div > p`, `div + p`, `div ~ p` | 2 （选择器相加） |

**计算规则**：

- 多个选择器组合时，权重相加。
- 若权重相同，则后出现的样式覆盖前面的样式。
- 使用 `!important` 的样式具有最高优先级

示例：

```html
<p>黑色</p>
<div class="container">
  <p>蓝色</p>
  <p class="special">绿色</p>
</div>
<style>
  p {
    color: black;
  }
  .container p {
    color: blue;
  }
  p.special {
    color: green;
  }
</style>
```

## 最佳实践建议

1. 尽量避免使用 `!important`
2. 尽量使用低权重的选择器
3. 使用类选择器替代 ID 选择器以提高可维护性
4. 保持选择器的简洁性和可读性
