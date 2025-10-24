# React 快速开始

本篇将带你快速上手 React，从最原始的引入方式到使用现代脚手架工具创建完整项目，并深入理解 JSX 的底层原理。

## 引入 React.js (适合学习)

```html
<!DOCTYPE html>
<html>
  <body>
    <div id="root"></div>
    <script type="module">
      // 使用 es module引入react
      import React from 'https://esm.sh/react@19'
      import ReactDOMClient from 'https://esm.sh/react-dom@19/client'
      // 使用 React.createElement 创建元素
      const container = React.createElement(
        'div',
        { className: 'container' },
        React.createElement(
          'h1',
          { className: 'title', id: 'main-title' },
          'Hello, React!',
        ),
      )

      // 使用 ReactDOMClient.render 渲染（React 18 之前的方式）
      // ReactDOMClient.render(container, document.getElementById('root'));

      // React 18 后的新方式
      const root = ReactDOMClient.createRoot(
        document.getElementById('root'),
      )
      root.render(container)
    </script>
  </body>
</html>
```

## 脚手架工具

这些构建工具提供了打包和运行源代码的功能，提供本地开发的开发服务器，以及部署应用到生产服务器的构建命令。

### Vite

[Vite](https://vite.dev/) 是一个构建工具，旨在为现代网络项目提供更快更简洁的开发体验。

```bash
npm create vite@latest my-app -- --template react
```

Vite 采用约定式设计，开箱即提供合理的默认配置。它拥有丰富的插件生态系统，能够支持快速热更新、JSX、Babel/SWC 等常见功能。你可以查看 Vite 的 [React 插件](https://vite.dev/plugins/#vitejs-plugin-react) 或 [React SWC 插件](https://vite.dev/plugins/#vitejs-plugin-react-swc) 和 [React 服务器端渲染示例项目](https://vite.dev/guide/ssr.html#example-projects) 来开始使用。

### Parcel

[Parcel](https://parceljs.org/) 结合了出色的开箱即用开发体验和可扩展的架构，可以将你的项目从刚开始的阶段推向大规模的生产应用。

```bash
npm install --save-dev parcel
```

Parcel 支持快速刷新、JSX、TypeScript、Flow 和开箱即用的样式。请查看 [Parcel 的 React 教程](https://parceljs.org/recipes/react/#getting-started) 以开始。

### Rsbuild

[Rsbuild](https://rsbuild.dev/) 是一个基于 Rspack 的构建工具，旨在为 React 应用程序提供无缝的开发体验。它配备了精心调优的默认设置和现成的性能优化。

```bash
npx create-rsbuild --template react
```

Rsbuild 内置了对 React 特性的支持，如快速刷新、JSX、TypeScript 和样式。请查看 [Rsbuild 的 React 指南](https://rsbuild.dev/zh/guide/framework/react) 以开始使用。

## JSX 语法详解

网页是构建在 HTML、CSS 和 JavaScript 之上的。
多年以来，web 开发者都是将网页内容存放在 HTML 中，样式放在 CSS 中，而逻辑则放在 JavaScript 中 —— 通常是在不同的文件中！
页面的内容通过标签语言描述并存放在 HTML 文件中，而逻辑则单独存放在 JavaScript 文件中。
但随着 Web 的交互性越来越强，逻辑越来越决定页面中的内容。JavaScript 控制着 HTML 的内容！
因此，React 推荐使用`JSX`语法扩展将渲染逻辑和标签渲染都放在 JavaScript 中。

### 从 HTML 到 JSX

JSX 是 React 最具代表性的语法扩展，它让我们可以在 JavaScript 中书写类似 HTML 的结构。

比如想要在 JavaScript 中渲染如下 html 结构

```html
<div class="container">
  <h1 id="title">Hello World</h1>
  <button onclick="handleClick()">Click me</button>
</div>
```

可以使用`React.createElement`创建 react 元素，然后进一步渲染

```javascript
const container = React.createElement(
  'div',
  { className: 'container' },
  React.createElement('h1', { id: 'title' }, 'Hello World'),
  React.createElement('button', { onClick: handleClick }, 'Click me'),
)
```

在 JavaScript 中使用`React.createElement`编写 html 结构非常繁琐，而且写完之后难以阅读，很难跟真正的 html 结构联系起来。

因此 react 推出了`jsx`语法扩展，可以在 JavaScript 中使用类 html 语法书写 html 结构，方便编码与阅读。

```jsx
const container = (
  <div className="container">
    <h1 id="title">Hello World</h1>
    <button onClick={handleClick}>Click me</button>
  </div>
)
```

### 基本语法

`jsx`的语法跟 html 语法大部分类似，但是 JSX 语法更加严格并且相比 HTML 有更多的规则。

#### 必须有一个根元素

如果想要在一个组件中包含多个元素，需要用一个根元素把它们包裹起来。
如果不想在 html 中增加额外的元素，可以用`<>`和`</>`代替，这个元素会被渲染成 html 中的[Fragment](https://zh-hans.react.dev/reference/react/Fragment)

```jsx
// 1. 必须有一个根元素
const element = (
  <div>
    <h1>标题</h1>
    <p>段落</p>
  </div>
)
// 2. 根元素为空
const element2 = (
  <>
    <h1>标题</h1>
    <p>段落</p>
  </>
)
```

#### 标签必须闭合

JSX 要求标签必须正确闭合，像 `<img>`、`<input>`这样的自闭合标签必须书写成 `<img />`、`<input />`

```jsx
// 正确
const element = (
  <div>
    <img src="image.jpg" alt="描述" />
    <input type="text" />
    <br />
  </div>
)
```

#### 大部分属性使用驼峰式命名法

为了在 JavaScript 中保持统一风格，不使用`-`符号，而是使用小驼峰时命名 (第一个单词首字母小写，后面单词首字母大写)。但是由于历史原因，`aria-*` 和 `data-*` 属性是以带 `-` 符号的 HTML 格式书写的。

```jsx
<div>
  {/* 驼峰式命名法 */}
  <img customAttr="123" />
  {/* aria-* 和 `data-*` HTML 格式书 */}
  <img data-v="123" />
  <div aria-v="123"> </div>
</div>
```

#### 嵌入 JavaScript 表达式

跟 html 一样，JSX 使用`""`或者`''`包裹字符串

```jsx
<img customAttr="123" />
```

如果你想传递 JS 变量来动态修改值，可以使用 `{}` 包裹 JavaScript 表达式，`{}`只能在以下两种场景中使用

- JSX 标签内

```jsx
const str = '字符串'
const element = (
  <div>
    {str}
    {/* 标签内的数组会被拍平 */}
    {[<p></p>, <span></span>]}
  </div>
)
```

- 紧跟 `属性=` 后面的值

```jsx
const src = 'https://hookall.pages.dev/logo.svg'
const description = 'HookAll'
const element = <img src={src} alt={descriptionF} />
```

`{}` 里面可以放入任意 JavaScript 表达式，但是要注意表达式的返回值正确与否

#### 添加样式

可以通过内联方式、添加 css 方式添加样式

```jsx
// 内联样式 - 使用对象
const element = (
  <div
    style={{
      color: 'red',
      // style 属性 使用驼峰
      fontSize: '20px',
      backgroundColor: '#f0f0f0',
    }}
  >
    带样式的元素
  </div>
)

// 通过 className 添加 CSS 类
const element = <div className="my-component">使用外部样式</div>
```

#### 添加事件

JSX 的事件属性为 `on` + EventName，比如 `onClick`, `onChange`, `onFocus`，值为函数

```jsx
const handleClick = () => {
  console.log('按钮被点击了!')
}

const element = (
  <div>
    {/* 通过变量传递函数 */}
    <button onClick={handleClick}>点击我</button>
    {/* 传递匿名函数 */}
    <input
      onChange={(event) => {
        console.log('输入值:', event.target.value)
      }}
    />
  </div>
)
```

### JSX 编译过程

JSX 会被编译成 `React.createElement` 调用：

**编译前（JSX）：**

```jsx
const handleClick = () => {
  console.log('按钮被点击了!')
}
const element = (
  <div className="container">
    <h1>Hello {name}</h1>
    <button onClick={handleClick}>Click</button>
  </div>
)
```

**编译后（JavaScript）：**

```javascript
const handleClick = () => {
  console.log('按钮被点击了!')
}
const element = React.createElement(
  'div',
  { className: 'container' },
  React.createElement('h1', null, 'Hello ', name),
  React.createElement('button', { onClick: handleClick }, 'Click'),
)
```
