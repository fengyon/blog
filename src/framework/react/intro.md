# React 简介

## 什么是 React？

React 是一个用于构建用户界面的 JavaScript 库，由 Facebook (现 Meta) 开发并维护。自 2013 年开源以来，它彻底改变了前端开发的方式，引入了组件化、虚拟 DOM 等创新概念，成为当今最流行的前端框架之一。

## React 的历史沿革

### 诞生背景 (2011-2013)

- **内部项目起源**：React 最初是 Facebook 为了解决复杂的用户界面开发问题而创建的内部项目
- **Instagram 收购契机**：2012 年 Facebook 收购 Instagram 后，React 在该平台得到进一步应用和验证
- **正式开源**：2013 年 5 月，React 在 JSConf US 大会上首次公开亮相

### 重要发展里程碑

- **2015 年**：推出 React Native，扩展至移动端开发
- **2016 年**：引入 Redux 状态管理解决方案
- **2018 年**：发布 React 16，新增 Fiber 架构和 Hooks
- **2019 年**：发布 React 17，作为渐进式升级版本
- **2022 年**：发布 React 18，新增并发特性
- **2024 年**：发布 React 19，新增 `Server Components` 特性

## React 解决的核心问题

### 复杂的数据流管理

在传统的前端开发中，当应用状态变化时，手动更新 DOM 既繁琐又容易出错。React 通过声明式编程和单向数据流，让开发者只需关注状态变化，UI 会自动更新。

### 组件复用与维护

大型应用中，代码重复和耦合度高是常见问题。React 的组件化架构允许开发者创建可复用的 UI 组件，提高代码的可维护性和可测试性。

### 性能优化挑战

直接操作 DOM 代价高昂。React 的虚拟 DOM 机制通过差异比较算法，最小化实际 DOM 操作，显著提升应用性能。

## React 的核心优势

### 组件化架构

```jsx
// 可复用的按钮组件
function Button({ onClick, children }) {
  return (
    <button className="btn" onClick={onClick}>
      {children}
    </button>
  )
}

// 使用组件
function App() {
  return (
    <div>
      <Button onClick={() => console.log('Clicked!')}>点击我</Button>
    </div>
  )
}
```

### 声明式编程范式

```jsx
// 声明式 - 关注结果，不关注过程
function UserList({ users }) {
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

### 虚拟 DOM 带来的性能提升

- **批量更新**：多个状态变化合并为单次渲染
- **差异检测**：只更新必要的 DOM 节点
- **跨平台能力**：React Native 让代码可运行在多个平台

### 丰富的生态系统

- **状态管理**：Redux、MobX、Zustand
- **路由**：React Router
- **构建工具**：Create React App、Next.js、vite
- **UI 库**：Material-UI、Ant Design

### 渐进式学习曲线

React API 相对简洁，新手可以快速上手基础功能，随着技能提升逐步学习高级特性。

## React 快速开始

### 引入 React.js (适合学习)

```html
<!DOCTYPE html>
<html>
  <body>
    <div id="root"></div>
    <script type="module">
      // 使用 es module引入react
      import React from 'https://esm.sh/react@19'
      import { jsx } from 'https://esm.sh/react@19/jsx-runtime'

      import ReactDOMClient from 'https://esm.sh/react-dom@19/client'
      // 使用 jsx函数 创建元素
      const container = jsx('div', {
        className: 'container',
        children: [
          jsx('h1', {
            className: 'title',
            id: 'main-title',
            children: ['Hello, React!'],
          }),
        ],
      })
      const root = ReactDOMClient.createRoot(
        document.getElementById('root'),
      )
      root.render(container)

      // React 18 之前使用 React.createElement 创建元素
      //   const container = React.createElement(
      //     'div',
      //     { className: 'container' },
      //     React.createElement(
      //       'h1',
      //       { className: 'title', id: 'main-title' },
      //       'Hello, React!',
      //     ),
      //   )

      // React 18 之前使用 ReactDOMClient.render 渲染
      // ReactDOMClient.render(container, document.getElementById('root'));
    </script>
  </body>
</html>
```

### 脚手架工具

这些构建工具提供了打包和运行源代码的功能，提供本地开发的开发服务器，以及部署应用到生产服务器的构建命令。

#### Vite

[Vite](https://vite.dev/) 是一个构建工具，旨在为现代网络项目提供更快更简洁的开发体验。

```bash
npm create vite@latest my-app -- --template react
```

Vite 采用约定式设计，开箱即提供合理的默认配置。它拥有丰富的插件生态系统，能够支持快速热更新、JSX、Babel/SWC 等常见功能。你可以查看 Vite 的 [React 插件](https://vite.dev/plugins/#vitejs-plugin-react)或 [React SWC 插件](https://vite.dev/plugins/#vitejs-plugin-react-swc)和 [React 服务器端渲染示例项目](https://vite.dev/guide/ssr.html#example-projects)来开始使用。

#### Parcel

[Parcel](https://parceljs.org/) 结合了出色的开箱即用开发体验和可扩展的架构，可以将你的项目从刚开始的阶段推向大规模的生产应用。

```bash
npm create parcel react-client my-react-app
cd my-react-app
npm start
```

Parcel 支持快速刷新、JSX、TypeScript、Flow 和开箱即用的样式。请查看 [Parcel 的 React 教程](https://parceljs.org/recipes/react/#getting-started)以开始。

#### Rsbuild

[Rsbuild](https://rsbuild.dev/) 是一个基于 Rspack 的构建工具，旨在为 React 应用程序提供无缝的开发体验。它配备了精心调优的默认设置和现成的性能优化。

```bash
npx create-rsbuild --template react
```

Rsbuild 内置了对 React 特性的支持，如快速刷新、JSX、TypeScript 和样式。请查看 [Rsbuild 的 React 指南](https://rsbuild.dev/zh/guide/framework/react)以开始使用。
