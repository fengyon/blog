# 网站渲染优化

## 渲染基础概念 {#rendering-basics}

网站渲染优化关注如何提升页面在浏览器中的绘制速度和交互响应性。现代 web 渲染涉及关键渲染路径优化，包括 HTML 解析、CSSOM 构建、布局、绘制和合成等阶段。优化目标是通过减少阻塞资源和最小化主线程工作量，实现快速的首屏渲染和流畅的用户交互。

特点：渲染优化需要平衡“加载性能”与“运行时性能”。它关注真实用户指标 (Core Web Vitals) 而非单纯的技术指标。优化策略需针对不同渲染模式 (CSR、SSR、SSG) 量身定制。

示意图：
HTML 下载 -> DOM 构建 + CSSOM 构建 -> 渲染树 -> 布局 -> 绘制 -> 合成
          ↓
    JavaScript 执行可能阻塞解析
          ↓
    CSS 阻塞渲染，JS 可能阻塞 DOM 构建

## 关键渲染路径优化 {#critical-rendering-path}

关键渲染路径 (CRP) 是浏览器将 HTML、CSS 和 JavaScript 转换为像素的步骤序列。优化核心在于优先加载可视区域内容，延迟非关键资源。通过最小化关键资源数量、减少关键字节数和缩短关键路径长度来加速首屏渲染。

特点：CRP 优化强调资源加载优先级管理。关键 CSS 应内联，非关键 CSS 异步加载。JavaScript 使用 defer 或 async 避免解析阻塞。

示意图：
关键路径：HTML -> 关键 CSS -> 首屏内容渲染
非关键路径：非关键 CSS、JS、图片 -> 延迟加载
优化后路径变短：内联关键 CSS + defer JS -> 更快首屏

## 服务器端渲染优化 {#server-side-rendering}

SSR 在服务器生成完整 HTML，减少客户端渲染工作量。优化重点包括组件级缓存、流式响应和预取数据。Next.js、Nuxt.js 等框架内置 SSR 优化，但需合理配置缓存策略和负载均衡。

特点：SSR 改善首屏加载和 SEO，但增加服务器压力。优化需要在 TTFB (首字节时间) 和缓存效率间平衡。静态部分预渲染，动态部分按需渲染。

```javascript
// Next.js SSR优化示例
import { getServerSideProps } from 'next';

export async function getServerSideProps(context) {
  // 数据预取 - 减少客户端请求
  const data = await fetch('https://api.example.com/data');
  const products = await data.json();

  // 设置缓存头 - 减少服务器压力
  context.res.setHeader(
    'Cache-Control',
    'public, s-maxage=10, stale-while-revalidate=59'
  );

  return {
    props: { products },
  };
}

// 流式渲染组件
import { Suspense } from 'react';

export default function Page({ products }) {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <ProductList products={products} />
      </Suspense>
    </div>
  );
}
```

## 客户端渲染优化 {#client-side-rendering}

CSR 优化关注减少 JavaScript 包体积、优化运行时性能和实现渐进式渲染。代码分割按需加载组件，虚拟滚动优化长列表，Web Worker 处理复杂计算避免主线程阻塞。

特点：CSR 优化核心是“按需加载”和“计算卸载”。监控运行时性能，识别并优化缓慢组件。使用生产模式构建和 Tree Shaking 减少包体积。

```javascript
// React.lazy 代码分割
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <HeavyComponent />
      </Suspense>
    </div>
  );
}

// 虚拟滚动优化 - 使用react-window
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => (
  <List
    height={400}
    itemCount={items.length}
    itemSize={50}
    itemData={items}
  >
    {({ index, style, data }) => (
      <div style={style}>
        {data[index].name}
      </div>
    )}
  </List>
);

export default VirtualizedList;
```

## 静态站点生成优化 {#static-site-generation}

SSG 在构建时生成静态 HTML，提供最佳加载性能。优化策略包括增量静态再生、按需重新验证和智能缓存。Next.js、Gatsby 等框架支持混合渲染模式，结合 SSG 速度和动态内容灵活性。

特点：SSG 优化重点是构建时间优化和 CDN 分发。大型站点采用增量构建，仅更新变更内容。预生成关键页面，非关键页面按需生成。

```javascript
// Next.js SSG with ISR (增量静态再生)
import { getStaticProps } from 'next';

export async function getStaticProps() {
  const data = await fetch('https://api.example.com/posts');
  const posts = await data.json();

  return {
    props: { posts },
    // 每60秒重新生成页面
    revalidate: 60,
  };
}

// Gatsby 页面生成优化
import { graphql } from 'gatsby';

export const query = graphql`
  query {
    allMarkdownRemark(limit: 1000) {
      nodes {
        fields {
          slug
        }
        frontmatter {
          title
          date
        }
      }
    }
  }
`;

export async function config() {
  // 动态导入重型组件，减少主包体积
  const HeavyComponent = (await import('../components/Heavy')).default;
  return {
    component: HeavyComponent,
  };
}
```

## 图片与媒体优化 {#image-and-media-optimization}

现代图片优化包括响应式图片、下一代格式 (WebP/AVIF) 和懒加载。使用 sharp 进行图片处理，Intersection Observer 实现视口触发加载，picture 元素提供格式回退。

特点：图片优化平衡视觉质量和加载速度。根据设备像素比和视口尺寸提供合适尺寸。视频使用预加载提示和懒加载。

```javascript
// 图片懒加载与响应式处理
import { useEffect, useRef, useState } from 'react';

function LazyImage({ src, alt, width, height }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    });

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          style={{ opacity: isLoaded ? 1 : 0.3 }}
        />
      )}
    </div>
  );
}

// 使用sharp进行图片优化 (Node.js环境)
import sharp from 'sharp';

export async function optimizeImage(inputPath, outputPath) {
  await sharp(inputPath)
    .resize(1200, 800, { fit: 'inside' })
    .webp({ quality: 80 })
    .toFile(outputPath);

  // 生成多种尺寸用于srcset
  await sharp(inputPath)
    .resize(600, 400)
    .webp({ quality: 80 })
    .toFile(outputPath.replace('.webp', '-600.webp'));
}
```

## 性能监控与调试 {#performance-monitoring}

使用 Performance API 测量真实用户指标，Web Vitals 库标准化核心指标收集。Chrome DevTools Performance 面板分析运行时性能，Lighthouse 进行综合质量评估。

特点：性能监控关注真实场景而非实验室环境。长期趋势分析识别性能回归。用户体验分段分析 (慢速设备、弱网条件)。

```javascript
// Web Vitals 核心指标监控
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  };

  // 发送到分析服务
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
getFCP(sendToAnalytics);
getTTFB(sendToAnalytics);

// 自定义性能测量
export function measurePerf(metricName, callback) {
  const startTime = performance.now();
  
  return function(...args) {
    const result = callback.apply(this, args);
    const duration = performance.now() - startTime;
    
    // 记录到性能时间线
    performance.measure(metricName, {
      start: startTime,
      end: performance.now(),
    });
    
    console.log(`${metricName} took ${duration}ms`);
    return result;
  };
}

// 使用示例
const optimizedFunction = measurePerf('heavyCalculation', () => {
  // 复杂计算
  return heavyCalculation();
});
```

## 资源加载优化 {#resource-loading-optimization}

资源加载优化通过预加载、预连接和懒加载策略优化资源获取时机。使用 Resource Hints (preload、prefetch、preconnect) 指导浏览器优先级，Service Worker 实现智能缓存。

特点：资源优化基于用户行为预测。关键资源预加载，可能资源预连接，非关键资源懒加载。缓存策略区分静态资源和 API 响应。

```javascript
// 资源提示管理
export function useResourceHints() {
  useEffect(() => {
    // 预连接关键第三方域名
    const preconnectLinks = [
      'https://fonts.googleapis.com',
      'https://cdn.example.com',
    ];

    preconnectLinks.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      document.head.appendChild(link);
    });

    // 预加载关键图片
    const criticalImages = [
      '/images/hero-image.webp',
      '/images/logo.svg',
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = src;
      link.as = 'image';
      document.head.appendChild(link);
    });
  }, []);
}

// Service Worker 缓存策略
// sw.js
const CACHE_NAME = 'v1';
const STATIC_CACHE = 'static-v1';

const staticAssets = [
  '/',
  '/styles/main.css',
  '/scripts/app.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(staticAssets))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 缓存优先策略 for 静态资源
        if (response) return response;
        
        return fetch(event.request).then(response => {
          // 动态资源网络优先，然后缓存
          if (event.request.url.includes('/api/')) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseClone));
          }
          return response;
        });
      })
  );
});
```