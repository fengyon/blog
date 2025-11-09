# nuxtjs 入门

## 什么是 Nuxt.js

Nuxt.js 是一个基于 Vue.js 的框架，用于简化服务器端渲染（SSR）、静态站点生成等应用的开发。它提供默认配置，让您快速构建高性能的 Web 应用。

示意图：  
传统 Vue.js 应用（客户端渲染）：  
[浏览器] -> [加载 HTML] -> [执行 JavaScript] -> [渲染页面]  
Nuxt.js 应用（服务器端渲染）：  
[浏览器] -> [服务器生成 HTML] -> [直接显示页面] -> [增强交互]

## 为什么选择 Nuxt.js

- 自动路由：基于文件系统生成路由，无需手动配置。  
- 服务器端渲染：提升首屏加载速度和 SEO。  
- 代码分割：自动优化资源加载。  
- 开发体验：热重载、ES6+ 支持等。

## 安装和创建项目

使用以下命令创建新项目：  
```bash  
npx create-nuxt-app my-nuxt-project  
```  
示意图：  
命令行输出：  
```  
? 选择项目配置（如 UI 框架、测试工具等）  
...  
项目创建完成！  
```  
进入项目目录：  
```bash  
cd my-nuxt-project  
npm run dev  
```  
访问 http://localhost:3000 查看应用。

## 项目结构

Nuxt.js 项目有标准目录结构：  
```  
my-nuxt-project/  
├── pages/          # 页面文件，自动生成路由  
├── components/     # 可复用组件  
├── layouts/        # 布局文件  
├── assets/         # 静态资源（如图片）  
├── store/          # Vuex 状态管理  
└── nuxt.config.js  # 配置文件  
```  
示意图：  
树状结构显示目录层次。

## 页面和路由

在 `pages` 目录中创建 `.vue` 文件，Nuxt.js 会自动生成路由。  
例如：  
- `pages/index.vue` -> 对应路由 `/`  
- `pages/about.vue` -> 对应路由 `/about`  
示意图：  
文件路径：  
pages/  
├── index.vue    (路径: /)  
└── about.vue   (路径: /about)  
嵌套路由：创建子目录，如 `pages/users/index.vue` 和 `pages/users/_id.vue` 生成 `/users` 和 `/users/:id`。

## 布局

布局用于定义公共页面结构（如页眉、页脚）。在 `layouts` 目录中创建文件，例如 `default.vue`：  
```vue  
<template>  
  <div>  
    <header>页眉内容</header>  
    <nuxt />  <!-- 页面内容插入点 -->  
    <footer>页脚内容</footer>  
  </div>  
</template>  
```  
在页面中通过 `layout` 属性指定布局。  
示意图：  
布局结构：  
[页眉]  
[页面内容]  
[页脚]

## 数据获取

Nuxt.js 提供 `asyncData` 方法在页面渲染前获取数据。  
示例（在页面组件中）：  
```javascript  
export default {  
  async asyncData({ params }) {  
    const data = await fetch('https://api.example.com/data').then(res => res.json())  
    return { items: data }  
  }  
}  
```  
数据将合并到组件数据中，可用于模板渲染。

## 部署

构建生产版本：  
```bash  
npm run build  
npm start  
```  
对于静态站点，使用：  
```bash  
npm run generate  
```  
生成 `dist` 目录，可部署到任何静态托管服务。