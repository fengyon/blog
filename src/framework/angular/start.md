# Angular 入门

## 什么是 Angular？

Angular 是一个由 Google 维护的开源前端框架，用于构建动态的单页应用程序（SPA）。它使用 TypeScript 语言，提供了强大的工具来管理组件、数据流和用户界面。

核心特点：
- 基于组件化架构
- 支持双向数据绑定
- 依赖注入系统
- 模块化设计

示意图：
```
Angular 应用
├── 组件树结构
├── 服务注入
└── 模块组织
```

## 核心概念

### 组件
组件是 Angular 应用的基本构建块，包含模板、样式和逻辑。每个组件控制屏幕的一部分。

示意图：
```
组件示例：
+---------------------+
|  组件类             |
|  - 属性: title      |
|  - 方法: onClick()  |
+---------------------+
         |
         v
+---------------------+
|  模板 (HTML)        |
|  <h1>{{title}}</h1> |
|  <button (click)="onClick()"> |
+---------------------+
```

### 模块
模块用于组织应用代码，将相关组件、服务和其他功能分组。每个应用至少有一个根模块。

示意图：
```
AppModule
├── 声明组件
├── 导入其他模块
└── 提供全局服务
```

### 数据绑定
数据绑定连接组件类和模板，实现动态更新。

示意图：
```
类型：
- 插值: {{ value }}
- 属性绑定: [property]="expression"
- 事件绑定: (event)="handler()"
示例：
组件属性 -> [绑定] -> 模板显示
用户输入 -> (事件) -> 组件方法
```

## 环境设置

安装 Angular CLI 并创建新项目：

步骤：
1. 确保已安装 Node.js（版本 14 或更高）。
2. 在终端中运行以下命令：
   ```
   npm install -g @angular/cli
   ng new my-app
   cd my-app
   ng serve
   ```
3. 打开浏览器访问 http://localhost:4200，查看默认应用。

示意图：
```
命令流：
npm install -> ng new -> ng serve -> 浏览器显示
```

## 创建第一个组件

使用 Angular CLI 生成组件：
```
ng generate component hello
```

文件结构：
```
src/app/hello/
├── hello.component.ts
├── hello.component.html
├── hello.component.css
```

编辑组件：
- 在 hello.component.ts 中：
  ```typescript
  export class HelloComponent {
    message = '欢迎使用 Angular！';
  }
  ```
- 在 hello.component.html 中：
  ```html
  <p>{{ message }}</p>
  ```

示意图：
```
组件生成：
CLI 命令 -> 创建文件 -> 编辑代码 -> 在模板中使用
```

## 数据绑定示例

### 属性绑定
将组件属性绑定到 HTML 元素属性。

示例代码：
```html
<img [src]="imageUrl">
```
在组件中：
```typescript
imageUrl = 'assets/logo.png';
```

示意图：
```
组件属性 [src]="imageUrl" -> 模板渲染为 <img src="assets/logo.png">
```

### 事件绑定
响应用户操作，如点击按钮。

示例代码：
```html
<button (click)="showAlert()">点击这里</button>
```
在组件中：
```typescript
showAlert() {
  alert('Hello Angular！');
}
```

示意图：
```
用户点击 -> (click)事件 -> 调用 showAlert() 方法 -> 显示警告框
```

### 插值
在模板中显示组件属性值。

示例代码：
```html
<h1>{{ title }}</h1>
```
在组件中：
```typescript
title = '我的 Angular 应用';
```

示意图：
```
组件属性 title -> 插值 {{ title }} -> 渲染为 <h1>我的 Angular 应用</h1>
```