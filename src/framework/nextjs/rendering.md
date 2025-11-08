# nextjs 渲染模式

Next.js 提供了多种渲染模式，让开发者可以根据不同场景选择最优的页面生成方式，平衡性能、新鲜度和用户体验。

## 渲染模式概览

Next.js 主要支持四种渲染模式，分别适用于不同的使用场景：

示意图：
```
渲染模式谱系：
客户端渲染 (CSR) ----- 混合渲染 ----- 服务端渲染 (SSR)
        │              │              │
        │              │              │
  静态生成 (SSG)   增量静态再生 (ISR)  流式渲染
```

## 静态生成

静态生成在构建时生成HTML页面，这些页面可以被CDN缓存，提供最佳性能。

示意图：
```
构建时：
[数据获取] → [生成HTML] → [存储静态文件]

请求时：
用户请求 → CDN返回静态HTML → 极快加载
```

### 基本静态生成

```jsx
// 页面内容在构建时确定
export default function Home() {
  return <h1>欢迎访问首页</h1>;
}
```

### 带数据的静态生成

```jsx
// 在构建时获取数据
export async function getStaticProps() {
  const data = await fetchData();
  
  return {
    props: { data },
  };
}

function Blog({ data }) {
  return <div>{data.posts.map(post => 
    <article key={post.id}>{post.title}</article>
  )}</div>;
}
```

适用场景：
```
静态生成适合：
- 营销页面
- 博客文章
- 产品展示
- 文档网站
```

## 服务器端渲染

服务器端渲染在每次请求时生成HTML，确保内容最新。

示意图：
```
请求时：
用户请求 → 服务器获取数据 → 生成HTML → 返回给用户
        │
        └── 每次都是新鲜内容
```

### 基础SSR

```jsx
// 每次请求时获取数据
export async function getServerSideProps() {
  const data = await fetchFreshData();
  
  return {
    props: { data },
  };
}

function Profile({ data }) {
  return <div>用户资料: {data.userInfo}</div>;
}
```

适用场景：
```
SSR适合：
- 个性化页面
- 实时数据展示
- 需要认证的页面
- 频繁更新的内容
```

## 客户端渲染

客户端渲染在浏览器中执行JavaScript来渲染内容，类似传统React应用。

示意图：
```
初始加载：
服务器返回空HTML + JS包
        ↓
浏览器执行JS → 获取数据 → 渲染内容
        ↓
用户看到完整页面
```

### CSR实现

```jsx
'use client';

import { useState, useEffect } from 'react';

function Dashboard() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <div>加载中...</div>;
  
  return <div>{/* 渲染数据 */}</div>;
}
```

适用场景：
```
CSR适合：
- 高度交互的仪表板
- 不需要SEO的页面
- 实时更新的应用
```

## 增量静态再生

ISR允许在构建后更新静态页面，无需重新构建整个站点。

示意图：
```
首次访问：
用户A请求 → CDN无缓存 → 服务器生成页面 → 返回 + 缓存
        │
后续访问：
用户B请求 → CDN返回缓存 → 快速响应
        │
重新验证：
后台检查数据更新 → 必要时重新生成
```

### ISR配置

```jsx
export async function getStaticProps() {
  const data = await fetchData();
  
  return {
    props: { data },
    revalidate: 60, // 每60秒重新验证
  };
}
```

适用场景：
```
ISR适合：
- 电商产品页
- 新闻网站
- 频繁更新但不需要实时性的内容
```

## 流式渲染

流式渲染将页面分割为多个块，逐步发送到客户端，提升感知性能。

示意图：
```
传统渲染：
[等待所有数据] → [生成完整HTML] → [发送整个页面]

流式渲染：
[部分数据就绪] → [发送第一个块] → 用户立即看到内容
        ↓
[更多数据就绪] → [发送下一个块] → 逐步完善页面
```

### 流式渲染实现

```jsx
import { Suspense } from 'react';

async function SlowComponent() {
  const data = await fetchSlowData();
  return <div>{data}</div>;
}

export default function Page() {
  return (
    <div>
      <h1>即时内容</h1>
      <Suspense fallback={<div>加载中...</div>}>
        <SlowComponent />
      </Suspense>
    </div>
  );
}
```

## 混合渲染策略

实际应用中，通常混合使用多种渲染模式。

示意图：
```
网站结构：
首页 (SSG) ----------- 产品页 (ISR)
  │                      │
  │                      │
博客 (SSG) ----------- 用户面板 (CSR)
  │                      │
  │                      │
新闻 (SSR) ----------- 实时数据 (SSR)
```

### 按路由选择渲染模式

```jsx
// app/ 目录结构示例：
app/
├── page.js                 # 首页 - SSG
├── blog/
│   ├── page.js            # 博客列表 - ISR
│   └── [slug]/
│       └── page.js        # 博客文章 - SSG
├── news/
│   └── page.js            # 新闻 - SSR
└── dashboard/
    └── page.js            # 仪表板 - CSR
```

## 渲染模式选择指南

根据内容特性选择合适的渲染模式：

```
内容类型                 推荐模式
─────────────────────────────────────
几乎不变的内容            静态生成 (SSG)
定期更新的内容            增量静态再生 (ISR)
高度个性化的内容          服务器端渲染 (SSR)
需要SEO的动态内容         服务器端渲染 (SSR)
高度交互的应用界面        客户端渲染 (CSR)
```

### 性能对比

```
加载速度:    SSG > ISR > SSR > CSR
内容新鲜度:  SSR > ISR > SSG > CSR
开发复杂度:   CSR > SSR > ISR > SSG
SEO友好度:   SSG = SSR > ISR > CSR
```

Next.js 的多样化渲染模式让开发者能够为每个页面选择最合适的策略，在性能、用户体验和开发效率之间找到最佳平衡点。