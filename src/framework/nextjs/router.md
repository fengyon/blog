# nextjs 路由系统

Next.js 提供了强大且直观的文件系统路由。通过约定的目录结构，你可以轻松创建页面和 API 端点，无需复杂配置。

## 路由基础

Next.js 有两种主要的路由系统：**Pages Router** (传统) 和 **App Router** (新版)。

示意图：

```
Pages Router: pages/目录 -> 自动成为路由
App Router: app/目录 -> 基于文件系统的路由
```

### Pages Router

在 `pages` 目录中，每个文件自动映射为路由。

示意图：

```
pages/index.js → /
pages/about.js → /about
pages/blog/index.js → /blog
pages/contact.js → /contact
```

### App Router

从 Next.js 13 开始，推荐使用 `app` 目录。项目结构通常如下：

```
my-next-app/
├── app/
│   ├── layout.js       # 根布局
│   ├── page.js         # 首页
│   ├── about/
│   │   └── page.js     # 关于页面
│   └── blog/
│       ├── page.js     # 博客列表
│       └── [slug]/
│           └── page.js # 动态路由
├── components/         # 可复用组件
└── public/            # 静态资源
```

## 路由类型

### 静态路由

通过创建命名文件或文件夹来定义固定路径。

示意图：

```
app/
├── page.js        → /
├── about/
│   └── page.js    → /about
└── dashboard/
    └── page.js    → /dashboard
```

### 动态路由

对于不确定的路由段，使用方括号创建动态路由。

示意图：

```
app/
└── blog/
    └── [id]/
        └── page.js
```

匹配路径：

```
/blog/1     → params: {id: '1'}
/blog/abc   → params: {id: 'abc'}
```

### 捕获所有路由

使用 `[...slug]` 匹配多个路径段。

示意图：

```
app/
└── shop/
    └── [...slug]/
        └── page.js
```

匹配路径：

```
/shop/a        → params: {slug: ['a']}
/shop/a/b/c    → params: {slug: ['a', 'b', 'c']}
```

### 可选捕获所有路由

使用 `[[...slug]]` 使捕获所有路由成为可选。

示意图：

```
app/
└── post/
    └── [[...slug]]/
        └── page.js
```

匹配路径：

```
/post         → params: {}
/post/a       → params: {slug: ['a']}
/post/a/b     → params: {slug: ['a', 'b']}
```

## 路由组和私有文件夹

### 路由组

使用括号 `(folderName)` 创建路由组，用于组织路由而不影响 URL 路径。

示意图：

```
app/
├── (marketing)/
│   ├── page.js        → /
│   └── about/
│       └── page.js    → /about
└── (admin)/
    ├── dashboard/
    │   └── page.js    → /dashboard
    └── users/
        └── page.js    → /users
```

### 私有文件夹

使用下划线前缀 `_folderName` 创建私有文件夹，这些文件夹不会参与路由。

示意图：

```
app/
├── _components/      # 不参与路由
├── _utils/          # 不参与路由
└── blog/
    └── page.js      → /blog
```

## 布局系统

### 根布局

`app/layout.js` 是根布局，包裹所有页面。

```jsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <nav>全局导航</nav>
        {children}
        <footer>全局页脚</footer>
      </body>
    </html>
  )
}
```

### 嵌套布局

每个目录可以有自己的布局，这些布局会嵌套在父布局中。

示意图：

```
布局层次：
根布局 (app/layout.js)
└── 仪表盘布局 (app/dashboard/layout.js)
    └── 页面内容 (app/dashboard/page.js)
```

示例：

```jsx
// app/dashboard/layout.js
export default function DashboardLayout({ children }) {
  return (
    <div>
      <aside>仪表盘侧边栏</aside>
      <main>{children}</main>
    </div>
  )
}
```

## 页面和特殊文件

### 页面约定

每个路由段都需要 `page.js` 文件来定义页面内容。

```jsx
// app/about/page.js
export default function About() {
  return <h1>关于我们</h1>
}
```

### 特殊文件

Next.js 提供了多种特殊文件来处理特定场景：

- `loading.js` - 显示加载状态
- `error.js` - 错误处理
- `not-found.js` - 404 页面
- `layout.js` - 布局组件
- `template.js` - 可重新渲染的布局

示意图：

```
组件渲染层次：
layout.js
├── template.js
├── error.js
├── loading.js
├── not-found.js
└── page.js
```

## 导航

### Link 组件

使用 `next/link` 进行客户端导航。

```jsx
import Link from 'next/link'

function Navigation() {
  return (
    <nav>
      <Link href="/">首页</Link>
      <Link href="/about">关于</Link>
      <Link href="/blog/first-post">博客</Link>
    </nav>
  )
}
```

### 动态路径导航

对于动态路由，可以 interpolate 路径或使用 URL 对象。

```jsx
<Link href={`/blog/${post.slug}`}>
  {post.title}
</Link>

// 或使用 URL 对象
<Link
  href={{
    pathname: '/blog/[slug]',
    query: { slug: post.slug },
  }}
>
  {post.title}
</Link>
```

## 路由处理程序

App Router 使用 `route.js` 文件创建 API 端点。

示意图：

```
app/
├── api/
│   └── users/
│       └── route.js   → /api/users
└── blog/
    └── page.js        → /blog
```

示例：

```jsx
// app/api/users/route.js
export async function GET() {
  const users = await fetchUsers()
  return Response.json(users)
}

export async function POST(request) {
  const user = await request.json()
  const newUser = await createUser(user)
  return Response.json(newUser, { status: 201 })
}
```

## 数据获取

### 服务端数据获取

在服务端组件中直接获取数据。

```jsx
async function getData() {
  const res = await fetch('https://api.example.com/data')
  return res.json()
}

export default async function Page() {
  const data = await getData()
  return <div>{data.message}</div>
}
```

### 客户端数据获取

使用 `use client` 指令创建客户端组件。

```jsx
'use client'

import { useState, useEffect } from 'react'

function Profile() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/profile-data')
      .then((res) => res.json())
      .then((data) => setData(data))
  }, [])

  if (!data) return <div>加载中...</div>
  return <div>{data.name}</div>
}
```
