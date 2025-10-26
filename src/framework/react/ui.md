# React UI 组件库

React 生态中有大量优秀的 UI 组件库，可以帮助开发者快速构建高质量、现代化的界面。本文介绍当前主流的 React UI 库、接入方式以及常用 API。

## 一、Ant Design

**简介**：由阿里巴巴开源的企业级 UI 库，设计体系完善，组件丰富。
**适用场景**：后台管理系统、中后台产品。

### 安装与使用

```bash
npm install antd
```

在入口文件中引入样式：

```jsx
import 'antd/dist/reset.css'
import { Button } from 'antd'

function App() {
  return <Button type="primary">主要按钮</Button>
}
```

### 常用组件与 API

| 组件   | 功能   | 常用属性                              |
| ------ | ------ | ------------------------------------- |
| Button | 按钮   | `type`、`onClick`、`disabled`         |
| Input  | 输入框 | `value`、`onChange`、`placeholder`    |
| Table  | 表格   | `columns`、`dataSource`、`pagination` |
| Modal  | 弹窗   | `open`、`onOk`、`onCancel`            |

---

## 二、Material UI (MUI)

**简介**：Google Material Design 官方实现，视觉现代、国际化支持完善。
**适用场景**：通用前台应用、跨平台项目。

### 安装与使用

```bash
npm install @mui/material @emotion/react @emotion/styled
```

```jsx
import Button from '@mui/material/Button'

function App() {
  return <Button variant="contained">Contained</Button>
}
```

### 常用组件与 API

| 组件      | 功能     | 常用属性                        |
| --------- | -------- | ------------------------------- |
| Button    | 按钮     | `variant`、`color`、`onClick`   |
| TextField | 输入框   | `label`、`value`、`onChange`    |
| Dialog    | 对话框   | `open`、`onClose`               |
| Grid      | 栅格布局 | `container`、`item`、`xs`、`md` |

---

## 三、Chakra UI

**简介**：轻量、响应式、可定制性强的现代化 UI 库。
**适用场景**：快速原型、响应式网站。

### 安装与使用

```bash
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion
```

```jsx
import { ChakraProvider, Button } from '@chakra-ui/react'

function App() {
  return (
    <ChakraProvider>
      <Button colorScheme="teal">Hello Chakra</Button>
    </ChakraProvider>
  )
}
```

### 常用组件与 API

| 组件   | 功能     | 常用属性                        |
| ------ | -------- | ------------------------------- |
| Button | 按钮     | `colorScheme`、`size`           |
| Box    | 通用容器 | `p`、`m`、`bg`、`borderRadius`  |
| Flex   | 布局容器 | `direction`、`align`、`justify` |
| Modal  | 弹窗     | `isOpen`、`onClose`             |

---

## 四、shadcn/ui

**简介**：基于 Radix UI + Tailwind CSS 的现代组件集合，支持深度定制。
**适用场景**：追求设计一致性与高可定制性的项目。

### 安装与使用

```bash
npx shadcn@latest init
```

添加组件：

```bash
npx shadcn@latest add button
```

```jsx
import { Button } from '@/components/ui/button'

function App() {
  return <Button>Click me</Button>
}
```

### 常用组件

- **Button**
- **Input**
- **Card**
- **Dialog**
- **DropdownMenu**

---

## 五、对比总结

| 特性           | Ant Design              | Material UI      | Chakra UI          | shadcn/ui        |
| -------------- | ----------------------- | ---------------- | ------------------ | ---------------- |
| **设计体系**   | Ant Design System       | Material Design  | 无固定体系（灵活） | Tailwind + Radix |
| **组件数量**   | ★★★★★                   | ★★★★☆            | ★★★☆☆              | ★★☆☆☆（可扩展）  |
| **主题定制**   | 支持 CSS 变量、主题配置 | 支持主题系统     | 内置主题配置       | 完全自定义       |
| **体积**       | 较大（>1MB）            | 中等（约 700KB） | 较小（<500KB）     | 依赖 Tailwind    |
| **学习曲线**   | 中等                    | 中等偏高         | 低                 | 中等             |
| **适用场景**   | 企业后台系统            | 通用前台         | 响应式网站         | 现代个性化项目   |
| **国际化支持** | 强                      | 强               | 一般               | 一般             |
| **社区活跃度** | ★★★★★                   | ★★★★★            | ★★★★☆              | ★★★☆☆            |
