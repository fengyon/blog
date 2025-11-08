# nextjs 数据获取

Next.js 提供了多种数据获取方式，适应不同的渲染模式和场景需求。通过合理的策略选择，可以优化应用性能和用户体验。

## 数据获取概览

Next.js 根据渲染位置和时机，将数据获取分为几个核心模式：

```
数据获取方式矩阵：
        ┌─────────────┬──────────────┬──────────────┐
        │  服务端获取   │   构建时获取   │   客户端获取   │
        ├─────────────┼──────────────┼──────────────┤
        │ getServer-  │ getStatic-   │ useEffect    │
        │ SideProps   │ Props        │ + fetch      │
        ├─────────────┼──────────────┼──────────────┤
        │ Server      │ Static       │ Client       │
        │ Components  │ Generation   │ Components   │
        └─────────────┴──────────────┴──────────────┘
```

## 服务端数据获取

### Server Components

在 App Router 中，Server Components 可以直接使用 async/await 获取数据。

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

示意图：
```
Server Component 数据流：
[请求到达] → [服务器获取数据] → [渲染组件] → [返回完整HTML]
```

### getServerSideProps

在 Pages Router 中，使用 `getServerSideProps` 在每次请求时获取数据。

```jsx
function Page({ data }) {
  // 渲染数据
}

export async function getServerSideProps() {
  const res = await fetch('https://.../data')
  const data = await res.json()

  return { props: { data } }
}

export default Page
```

适用场景：
```
getServerSideProps 适合：
- 个性化页面数据
- 实时性要求高的内容
- 需要请求时信息的场景
```

## 构建时数据获取

### getStaticProps

在构建时获取数据，生成静态页面。

```jsx
export default function Blog({ posts }) {
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

export async function getStaticProps() {
  const res = await fetch('https://.../posts')
  const posts = await res.json()

  return {
    props: { posts }
  }
}
```

示意图：
```
Static Generation 流程：
[构建时] → [获取数据] → [生成HTML] → [部署为静态文件]
        ↓
[用户访问] → [直接返回静态HTML]
```

### getStaticPaths

对于动态路由，需要预定义所有可能的路径。

```jsx
export async function getStaticPaths() {
  const res = await fetch('https://.../posts')
  const posts = await res.json()

  const paths = posts.map(post => ({
    params: { id: post.id }
  }))

  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const res = await fetch(`https://.../posts/${params.id}`)
  const post = await res.json()

  return { props: { post } }
}
```

## 客户端数据获取

### useEffect + Fetch

在客户端组件中，使用 useEffect 获取数据。

```jsx
'use client'

import { useState, useEffect } from 'react'

function Profile() {
  const [data, setData] = useState(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/profile-data')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
  }, [])

  if (isLoading) return <p>加载中...</p>
  if (!data) return <p>无数据</p>

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.bio}</p>
    </div>
  )
}
```

示意图：
```
客户端数据获取流程：
[组件挂载] → [useEffect执行] → [fetch请求] 
    ↓
[数据返回] → [更新状态] → [重新渲染]
```

### SWR 数据获取

Next.js 团队推荐的 React Hooks 库，提供缓存、重新验证等功能。

```jsx
'use client'

import useSWR from 'swr'

const fetcher = (...args) => fetch(...args).then(res => res.json())

function Profile() {
  const { data, error } = useSWR('/api/profile-data', fetcher)

  if (error) return <div>加载失败</div>
  if (!data) return <div>加载中...</div>

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.bio}</p>
    </div>
  )
}
```

SWR 优势：
```
自动缓存： [请求] → [缓存存储] → [下次相同请求使用缓存]
重新验证： [焦点时] / [网络重连时] / [定时] 自动重新验证
```

## 增量静态再生

ISR 允许在构建后更新静态页面，无需重新构建整个站点。

```jsx
function Blog({ posts }) {
  // 渲染博客列表
}

export async function getStaticProps() {
  const res = await fetch('https://.../posts')
  const posts = await res.json()

  return {
    props: { posts },
    revalidate: 60 // 每60秒重新验证
  }
}
```

ISR 工作流程：
```
首次访问：用户请求 → 生成页面 → 缓存
重新验证期：后续请求 → 返回缓存 → 后台重新生成
过期后：用户请求 → 返回旧缓存 → 触发重新生成 → 更新缓存
```

## 数据获取模式

### 并行数据获取

同时启动多个数据请求，减少等待时间。

```jsx
async function Page() {
  const [userData, postData] = await Promise.all([
    fetch('/api/user').then(res => res.json()),
    fetch('/api/posts').then(res => res.json())
  ])

  return (
    <div>
      <UserProfile data={userData} />
      <PostList data={postData} />
    </div>
  )
}
```

### 顺序数据获取

某些场景需要按顺序获取数据。

```jsx
async function Page() {
  const user = await fetch('/api/user').then(res => res.json())
  const posts = await fetch(`/api/posts/${user.id}`).then(res => res.json())

  return (
    <div>
      <UserProfile data={user} />
      <UserPosts data={posts} />
    </div>
  )
}
```

## 数据缓存策略

### fetch 缓存

Next.js 扩展了 fetch API，提供内置缓存机制。

```jsx
// 默认缓存
const data = await fetch('https://api.example.com/data')

// 不缓存
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store'
})

// 定时重新验证
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 }
})
```

缓存策略比较：
```
策略         缓存时间    适用场景
force-cache  长期       静态内容
no-store     不缓存     实时数据
revalidate   定时更新   增量更新内容
```

## 流式渲染

使用 Suspense 实现渐进式数据加载。

```jsx
import { Suspense } from 'react'

async function SlowComponent() {
  const data = await fetchSlowData()
  return <div>{data}</div>
}

export default function Page() {
  return (
    <div>
      <h1>即时内容</h1>
      <Suspense fallback={<div>加载中...</div>}>
        <SlowComponent />
      </Suspense>
    </div>
  )
}
```

流式渲染效果：
```
初始渲染： [布局] + [加载状态]
数据就绪： [布局] + [实际内容]
          ↓
用户感知： 立即看到部分内容，逐步完善
```

## 错误处理

### 错误边界

处理数据获取中的错误情况。

```jsx
'use client'

import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div>
      <p>加载失败: {error.message}</p>
      <button onClick={resetErrorBoundary}>重试</button>
    </div>
  )
}

function Profile() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <UserProfile />
    </ErrorBoundary>
  )
}
```

## 数据获取最佳实践

### 选择合适的方法

根据内容特性选择数据获取策略：

```
内容类型               推荐方法
静态内容              getStaticProps
个性化内容            getServerSideProps
实时数据              客户端获取 + SWR
大型网站              ISR
交互式功能            客户端组件
```

### 性能优化

- 在服务端获取 SEO 关键数据
- 使用 CDN 缓存静态资源
- 实现正确的加载状态
- 按需加载非关键数据

```jsx
// 关键数据在服务端获取
async function ProductPage({ params }) {
  const product = await fetchProduct(params.id)
  
  return (
    <div>
      <ProductDetails product={product} />
      <Suspense fallback={<div>加载评论...</div>}>
        <ProductReviews productId={params.id} />
      </Suspense>
    </div>
  )
}
```

Next.js 的多样化数据获取方式让开发者能够根据具体场景选择最优策略，在性能、数据实时性和开发体验之间找到最佳平衡。