# nextjs 入门

## 什么是 Next.js？

Next.js 是一个基于 React 的框架，用于构建现代 Web 应用程序。它提供了服务器端渲染、静态站点生成和客户端渲染等能力，让开发更高效。

示意图：
```
传统 React 应用：浏览器加载 JS -> 渲染内容
Next.js 应用：服务器预渲染 HTML -> 发送给浏览器 -> 更快加载
```

## 为什么选择 Next.js？

- 提升性能：通过服务器渲染减少初始加载时间。
- SEO 友好：搜索引擎能直接抓取渲染后的内容。
- 简化开发：内置路由、代码分割和优化工具。

示意图：
```
优势：
- 速度: [客户端] --慢--> [服务器预渲染 --快-->]
- SEO: [爬虫直接读取 HTML] vs [传统 SPA 需 JS 执行]
```

## 开始使用

首先，确保已安装 Node.js（版本 12 或更高）。然后，通过以下命令创建新项目：

```bash
npx create-next-app@latest my-next-app
cd my-next-app
npm run dev
```

访问 http://localhost:3000 查看应用。

示意图：
```
步骤：
1. 运行命令 -> 创建项目文件夹
2. 进入目录 -> 启动开发服务器
3. 浏览器打开 -> 显示欢迎页面
```

## 项目结构

Next.js 项目有特定文件夹结构，关键部分包括：

```
my-next-app/
- pages/        # 页面文件，每个文件对应一个路由
- public/       # 静态资源（如图片）
- styles/       # CSS 文件
- components/   # 可复用 React 组件
```

示意图：
```
路由映射：
pages/index.js -> /
pages/about.js -> /about
```

## 页面和路由

在 Next.js 中，页面是 `pages` 目录下的 React 组件。文件名自动成为路由路径。

示例：创建 `pages/about.js`：

```jsx
export default function About() {
  return <h1>关于我们</h1>;
}
```

访问 `/about` 即可显示该页面。

示意图：
```
文件系统路由：
pages/
  index.js   -> [路径: /]
  about.js   -> [路径: /about]
  posts/
    [id].js  -> [动态路径: /posts/1]
```

## 渲染方式

Next.js 支持多种渲染方式：

- 静态生成（SSG）：构建时生成 HTML，适合内容不变的页面。
- 服务器端渲染（SSR）：每次请求时生成 HTML，适合动态内容。

示意图：
```
静态生成：
构建时: [数据获取] -> [生成 HTML] -> [存储]
请求时: 直接返回 HTML

服务器端渲染：
请求时: [服务器获取数据] -> [生成 HTML] -> [返回]
```

## API 路由

Next.js 允许在 `pages/api` 目录下创建 API 端点，用于处理后端逻辑。

示例：创建 `pages/api/hello.js`：

```jsx
export default function handler(req, res) {
  res.status(200).json({ message: 'Hello World' });
}
```

访问 `/api/hello` 返回 JSON 数据。

示意图：
```
API 结构：
pages/api/
  hello.js -> [端点: /api/hello]
  user.js  -> [端点: /api/user]
```