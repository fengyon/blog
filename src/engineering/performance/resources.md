# 资源加载优化

## 资源加载基础 {#resource-loading-basics}

资源加载优化关注 Web 应用中各种资源 (图片、样式、脚本、字体等) 的获取时机、优先级控制和传输效率。现代 Web 应用包含数十甚至上百个资源，合理的加载策略直接影响用户体验和核心性能指标。

特点：资源加载优化需要**分层治理**，从关键路径资源到非关键资源都需要针对性策略。优化目标是在正确的时间加载正确的资源，避免阻塞渲染和浪费带宽。

示意图：
资源加载生命周期：
发现 → 排队 → 连接建立 → 请求发送 → 响应接收 → 处理完成
优化焦点：
减少关键资源数量 + 压缩资源体积 + 优化加载时机 + 提升缓存效率

## 关键渲染路径优化 {#critical-rendering-path}

关键渲染路径是浏览器首次渲染页面所需的最小资源集合。优化核心是识别并优先加载阻塞渲染的资源，延迟非关键资源。通过资源优先级分析、内联关键 CSS 和异步加载非关键 JavaScript 实现。

特点：关键路径优化强调**渲染速度**而非完全加载速度。核心指标是首次内容绘制时间，优化目标是让用户尽快看到页面内容。

示意图：
关键路径资源：
HTML → 关键 CSS → 首屏图片 → 阻塞 JavaScript
非关键资源：
非首屏图片 → 非关键 CSS/JS → 统计代码 → 第三方组件
优化策略：内联关键 CSS + 异步加载 JS + 懒加载图片

```html
<!-- 关键CSS内联 -->
<style>
/* 首屏样式内联 */
.header, .hero, .main-content { 
  /* 关键样式规则 */ 
}
</style>

<!-- 非关键CSS异步加载 -->
<link rel="preload" href="non-critical.css" as="style" onload="this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="non-critical.css"></noscript>

<!-- 阻塞JavaScript异步化 -->
<script src="critical.js" defer></script>
```

## 资源优先级控制 {#resource-priority}

现代浏览器基于资源类型、位置和声明自动分配加载优先级。通过预加载、预连接和优先级提示主动影响浏览器调度，确保关键资源优先获取。

特点：优先级控制需要**精确声明**和**合理预测**。过度预加载会浪费带宽，不足则影响用户体验。

示意图：
浏览器默认优先级：
CSS/字体 (最高) → 视口内图片 (高) → 脚本 (中高) → 视口外图片 (低)
主动控制：
preload (强制高优先级) → prefetch (低优先级缓存) → preconnect (提前连接)

```html
<!-- 资源优先级声明 -->
<!-- 关键字体预加载 -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>

<!-- 首屏图片预加载 -->
<link rel="preload" href="hero-image.jpg" as="image" media="(min-width: 600px)">

<!-- 关键脚本预加载 -->
<link rel="preload" href="critical.js" as="script">

<!-- 预连接关键域名 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://cdn.example.com" crossorigin>

<!-- 预获取下一页资源 -->
<link rel="prefetch" href="/next-page.html" as="document">
```

## 图片加载优化 {#image-loading}

图片通常是页面中体积最大的资源类别。优化策略包括格式选择、响应式图片、懒加载和渐进式加载。现代图片格式如 WebP 和 AVIF 提供更好的压缩效率。

特点：图片优化平衡**视觉质量**和**加载性能**。根据设备能力、网络条件和显示需求提供合适的图片版本。

示意图：
图片优化决策树：
格式选择 → 尺寸适配 → 压缩质量 → 加载时机
格式优先级：AVIF → WebP → JPEG/PNG
尺寸策略：响应式 srcset + 艺术方向 picture

```html
<!-- 响应式图片示例 -->
<picture>
  <!-- AVIF格式（最优） -->
  <source 
    type="image/avif" 
    srcset="
      image-400.avif 400w,
      image-800.avif 800w,
      image-1200.avif 1200w
    "
    sizes="(max-width: 600px) 400px,
           (max-width: 1200px) 800px,
           1200px">
  
  <!-- WebP格式（次优） -->
  <source 
    type="image/webp" 
    srcset="
      image-400.webp 400w,
      image-800.webp 800w, 
      image-1200.webp 1200w
    "
    sizes="(max-width: 600px) 400px,
           (max-width: 1200px) 800px,
           1200px">
  
  <!-- 原始格式（回退） -->
  <img 
    src="image-400.jpg" 
    srcset="
      image-400.jpg 400w,
      image-800.jpg 800w,
      image-1200.jpg 1200w
    "
    sizes="(max-width: 600px) 400px,
           (max-width: 1200px) 800px,
           1200px"
    alt="描述文本"
    loading="lazy"
    width="400" height="300">
</picture>
```

## 懒加载策略 {#lazy-loading}

懒加载延迟非关键资源的加载时机，直到用户需要或即将需要时再加载。适用于图片、视频、iframe 和部分 JavaScript 模块。通过 Intersection Observer API 实现精确的视口检测。

特点：懒加载显著减少**初始负载**和**带宽使用**。需要合理设置加载阈值，避免用户等待感知。

示意图：
懒加载触发条件：
元素进入视口 → 接近视口 (阈值) → 用户交互时 → 鼠标悬停时
优化平衡：过早加载浪费资源 ↔ 过晚加载影响体验

```javascript
// 高级懒加载管理器
class LazyLoadManager {
  constructor() {
    this.observer = null;
    this.config = {
      rootMargin: '50px 0px', // 提前50px开始加载
      threshold: [0, 0.1, 0.5] // 多个触发点
    };
  }
  
  // 初始化懒加载
  init() {
    this.observer = new IntersectionObserver(this.handleIntersection.bind(this), this.config);
    
    // 注册需要懒加载的元素
    document.querySelectorAll('[data-lazy]').forEach(element => {
      this.observer.observe(element);
    });
  }
  
  // 处理元素进入视口
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        this.loadResource(element);
        this.observer.unobserve(element);
      }
    });
  }
  
  // 加载资源
  loadResource(element) {
    const resourceType = element.dataset.lazyType || 'image';
    
    switch(resourceType) {
      case 'image':
        this.loadImage(element);
        break;
      case 'iframe':
        this.loadIframe(element);
        break;
      case 'component':
        this.loadComponent(element);
        break;
      case 'video':
        this.loadVideo(element);
        break;
    }
  }
  
  // 图片懒加载
  loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;
    
    // 使用Image对象预加载
    const image = new Image();
    
    image.onload = () => {
      // 图片加载完成后替换
      if (src) img.src = src;
      if (srcset) img.srcset = srcset;
      img.classList.remove('lazy');
      img.classList.add('loaded');
    };
    
    image.onerror = () => {
      // 加载失败处理
      img.classList.add('error');
      this.loadFallback(img);
    };
    
    image.src = src;
  }
  
  // 预测性懒加载（基于用户行为）
  setupPredictiveLoading() {
    // 基于滚动速度预测
    let lastScrollY = window.scrollY;
    let scrollTimer;
    
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      const scrollSpeed = Math.abs(currentScrollY - lastScrollY);
      
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        // 快速滚动时预加载更多内容
        if (scrollSpeed > 50) {
          this.preloadViewportContent(currentScrollY);
        }
      }, 100);
      
      lastScrollY = currentScrollY;
    });
  }
  
  // 预加载即将进入视口的内容
  preloadViewportContent(scrollPosition) {
    const viewportHeight = window.innerHeight;
    const preloadDistance = viewportHeight * 2; // 提前2屏加载
    
    document.querySelectorAll('[data-lazy][data-loaded="false"]').forEach(element => {
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + scrollPosition;
      
      // 如果元素在预加载范围内
      if (elementTop < scrollPosition + viewportHeight + preloadDistance) {
        this.loadResource(element);
        element.dataset.loaded = 'true';
      }
    });
  }
}
```

## 预加载与预获取 {#preloading-prefetching}

预加载强制浏览器提前获取关键资源，预获取在空闲时缓存可能需要的资源。两者结合确保即时需求及时满足，预测需求提前准备。

特点：预加载用于**确定需求**的资源，预获取用于**可能需求**的资源。需要基于用户行为分析精确预测。

示意图：
预加载时机：
当前页面关键资源 → 高优先级立即加载
预获取时机：
下一页可能资源 → 低优先级空闲加载
预测依据：用户历史 + 行为模式 + 页面结构

```javascript
// 智能预加载管理器
class PreloadManager {
  constructor() {
    this.preloaded = new Set();
    this.prefetched = new Set();
  }
  
  // 基于页面结构预加载
  preloadBasedOnStructure() {
    const criticalResources = this.analyzeCriticalResources();
    
    criticalResources.forEach(resource => {
      if (!this.preloaded.has(resource.url)) {
        this.preloadResource(resource);
        this.preloaded.add(resource.url);
      }
    });
  }
  
  // 分析关键资源
  analyzeCriticalResources() {
    const resources = [];
    
    // 分析CSS中的字体引用
    const styleSheets = document.styleSheets;
    for (let sheet of styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (let rule of rules) {
          if (rule.style && rule.style.fontFamily) {
            // 提取字体资源
            const fontUrls = this.extractFontUrls(rule.style.fontFamily);
            resources.push(...fontUrls.map(url => ({ url, type: 'font' })));
          }
        }
      } catch (e) {
        // 跨域样式表可能无法访问
      }
    }
    
    // 分析首屏图片
    const viewportImages = document.querySelectorAll('img[loading="eager"]');
    viewportImages.forEach(img => {
      if (img.src && this.isInViewport(img)) {
        resources.push({ url: img.src, type: 'image' });
      }
    });
    
    return resources;
  }
  
  // 基于用户意图预获取
  setupIntentBasedPrefetch() {
    // 链接悬停预获取
    document.querySelectorAll('a[href^="/"]').forEach(link => {
      link.addEventListener('mouseenter', this.handleLinkHover.bind(this));
      link.addEventListener('touchstart', this.handleLinkHover.bind(this));
    });
    
    // 表单交互预获取
    document.querySelectorAll('form').forEach(form => {
      form.addEventListener('input', this.handleFormInteraction.bind(this));
    });
  }
  
  // 链接悬停处理
  handleLinkHover(event) {
    const link = event.currentTarget;
    const href = link.href;
    
    // 添加延迟，避免过于敏感
    setTimeout(() => {
      if (link.matches(':hover') || event.type === 'touchstart') {
        this.prefetchPage(href);
      }
    }, 100);
  }
  
  // 预获取页面
  prefetchPage(url) {
    if (!this.prefetched.has(url)) {
      // 预获取HTML
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'document';
      document.head.appendChild(link);
      
      // 分析并预获取页面关键资源
      this.analyzeAndPrefetchPageResources(url);
      
      this.prefetched.add(url);
    }
  }
  
  // 基于网络条件调整策略
  adaptToNetworkConditions() {
    if (!navigator.connection) return;
    
    const connection = navigator.connection;
    
    if (connection.saveData) {
      // 省流模式：禁用预获取
      this.disablePrefetch();
    }
    
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      // 慢速网络：只预加载最关键资源
      this.preloadOnlyCritical();
    }
  }
  
  // 预加载资源
  preloadResource(resource) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.url;
    link.as = resource.type;
    
    if (resource.type === 'font') {
      link.crossOrigin = 'anonymous';
    }
    
    if (resource.media) {
      link.media = resource.media;
    }
    
    document.head.appendChild(link);
  }
}
```

## 第三方资源优化 {#third-party-optimization}

第三方资源如分析工具、广告、社交媒体插件等往往不可控且影响性能。优化策略包括异步加载、懒加载、资源监控和备用方案。

特点：第三方资源优化需要**平衡功能**和**性能**。通过合理的加载时机和故障处理，最小化对核心体验的影响。

示意图：
第三方资源影响：
主线程竞争 → 网络请求竞争 → 内存占用 → 潜在故障
优化策略：异步加载 + 懒加载 + 超时控制 + 降级方案

```javascript
// 第三方资源管理器
class ThirdPartyManager {
  constructor() {
    this.loaded = new Map();
    this.pending = new Map();
  }
  
  // 异步加载第三方脚本
  loadScript(url, options = {}) {
    return new Promise((resolve, reject) => {
      if (this.loaded.has(url)) {
        resolve();
        return;
      }
      
      if (this.pending.has(url)) {
        this.pending.get(url).push({ resolve, reject });
        return;
      }
      
      this.pending.set(url, [{ resolve, reject }]);
      
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      
      if (options.crossOrigin) {
        script.crossOrigin = options.crossOrigin;
      }
      
      // 设置超时
      const timeout = options.timeout || 10000;
      const timeoutId = setTimeout(() => {
        this.handleLoadError(url, new Error(`Load timeout: ${url}`));
      }, timeout);
      
      script.onload = () => {
        clearTimeout(timeoutId);
        this.handleLoadSuccess(url);
      };
      
      script.onerror = () => {
        clearTimeout(timeoutId);
        this.handleLoadError(url, new Error(`Failed to load: ${url}`));
      };
      
      // 根据优先级插入到合适位置
      this.insertScript(script, options.priority);
    });
  }
  
  // 基于优先级的脚本插入
  insertScript(script, priority = 'medium') {
    const head = document.head;
    const firstScript = head.querySelector('script');
    
    switch(priority) {
      case 'high':
        // 高优先级：尽早执行
        head.insertBefore(script, firstScript);
        break;
      case 'medium':
        // 中优先级：在现有脚本后
        if (firstScript) {
          firstScript.parentNode.insertBefore(script, firstScript.nextSibling);
        } else {
          head.appendChild(script);
        }
        break;
      case 'low':
        // 低优先级：最后执行
        head.appendChild(script);
        break;
    }
  }
  
  // 懒加载第三方资源
  lazyLoadThirdParty(selector, callback) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target);
          observer.unobserve(entry.target);
        }
      });
    });
    
    document.querySelectorAll(selector).forEach(element => {
      observer.observe(element);
    });
  }
  
  // 社交媒体按钮懒加载
  lazyLoadSocialButtons() {
    this.lazyLoadThirdParty('.social-widget', (element) => {
      const platform = element.dataset.platform;
      
      switch(platform) {
        case 'twitter':
          this.loadTwitterWidget(element);
          break;
        case 'facebook':
          this.loadFacebookWidget(element);
          break;
        case 'linkedin':
          this.loadLinkedInWidget(element);
          break;
      }
    });
  }
  
  // 第三方分析优化
  optimizeAnalytics() {
    // 使用requestIdleCallback发送统计
    const sendAnalytics = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          this.loadScript('https://www.google-analytics.com/analytics.js', {
            priority: 'low'
          });
        });
      } else {
        // 回退方案
        setTimeout(() => {
          this.loadScript('https://www.google-analytics.com/analytics.js', {
            priority: 'low'
          });
        }, 3000);
      }
    };
    
    // 页面加载完成后发送统计
    if (document.readyState === 'complete') {
      sendAnalytics();
    } else {
      window.addEventListener('load', sendAnalytics);
    }
  }
  
  // 处理加载成功
  handleLoadSuccess(url) {
    const pending = this.pending.get(url) || [];
    this.loaded.set(url, true);
    this.pending.delete(url);
    
    pending.forEach(({ resolve }) => resolve());
  }
  
  // 处理加载失败
  handleLoadError(url, error) {
    const pending = this.pending.get(url) || [];
    this.loaded.set(url, false);
    this.pending.delete(url);
    
    console.warn(`Failed to load third-party resource: ${url}`, error);
    pending.forEach(({ reject }) => reject(error));
  }
}
```

## 缓存策略优化 {#caching-strategy}

缓存通过存储重复使用的资源减少网络请求。分层缓存策略包括浏览器缓存、Service Worker 缓存和 CDN 缓存。合理的缓存策略平衡新鲜度和性能。

特点：缓存优化核心是**命中率**和**新鲜度**的平衡。静态资源长期缓存，动态内容条件缓存，个性化内容谨慎缓存。

示意图：
缓存层次：
内存缓存 (最快) → HTTP 缓存 → Service Worker 缓存 → CDN 缓存
策略选择：
静态资源：长期缓存 + 内容哈希
动态内容：短时间缓存 + 验证刷新
用户数据：不缓存或短期缓存

```javascript
// Service Worker 缓存策略管理器
class CacheStrategyManager {
  constructor() {
    this.strategies = new Map();
    this.setupStrategies();
  }
  
  // 设置缓存策略
  setupStrategies() {
    // 静态资源 - 缓存优先
    this.strategies.set(/\.(css|js|woff2)$/, {
      strategy: 'cache-first',
      cacheName: 'static-assets-v1',
      options: {
        maxEntries: 100,
        maxAgeSeconds: 86400 * 365 // 1年
      }
    });
    
    // 图片 - 缓存优先，可过期
    this.strategies.set(/\.(jpg|png|webp|avif|svg)$/, {
      strategy: 'cache-first',
      cacheName: 'images-v1',
      options: {
        maxEntries: 200,
        maxAgeSeconds: 86400 * 30 // 30天
      }
    });
    
    // API数据 - 网络优先
    this.strategies.set(/\/api\//, {
      strategy: 'network-first',
      cacheName: 'api-data-v1',
      options: {
        maxEntries: 50,
        maxAgeSeconds: 300 // 5分钟
      }
    });
    
    // HTML页面 - 网络优先
    this.strategies.set(/\/($|\?)/, {
      strategy: 'network-first',
      cacheName: 'pages-v1',
      options: {
        maxEntries: 20,
        maxAgeSeconds: 86400 // 24小时
      }
    });
  }
  
  // 获取资源的缓存策略
  getStrategy(url) {
    for (const [pattern, strategy] of this.strategies) {
      if (pattern.test(url)) {
        return strategy;
      }
    }
    // 默认策略：仅网络
    return { strategy: 'network-only' };
  }
  
  // 缓存优先实现
  async cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // 检查缓存是否新鲜
      if (this.isCacheFresh(cachedResponse)) {
        return cachedResponse;
      }
    }
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        // 更新缓存
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      // 网络失败时返回缓存内容（即使不新鲜）
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  }
  
  // 网络优先实现
  async networkFirst(request, cacheName) {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  }
  
  // 检查缓存新鲜度
  isCacheFresh(cachedResponse) {
    const dateHeader = cachedResponse.headers.get('date');
    if (!dateHeader) return true;
    
    const cacheTime = new Date(dateHeader).getTime();
    const currentTime = Date.now();
    const maxAge = 86400 * 365 * 1000; // 1年
    
    return (currentTime - cacheTime) < maxAge;
  }
  
  // 预缓存关键资源
  async precacheCriticalResources() {
    const criticalResources = [
      '/styles/main.css',
      '/js/app.js',
      '/images/logo.svg',
      '/fonts/primary.woff2'
    ];
    
    const cache = await caches.open('critical-v1');
    
    await Promise.all(
      criticalResources.map(async (resource) => {
        try {
          const response = await fetch(resource);
          if (response.ok) {
            await cache.put(resource, response);
          }
        } catch (error) {
          console.warn(`Failed to precache: ${resource}`, error);
        }
      })
    );
  }
}
```

## 自适应加载策略 {#adaptive-loading}

自适应加载根据设备能力、网络条件和用户偏好动态调整资源加载策略。使用 Network Information API、Device Memory API 和 Save-Data 头实现精确适配。

特点：自适应加载强调**上下文感知**和**动态调整**。同一网站在不同环境下提供最适合的资源和体验。

示意图：
自适应维度：
网络条件 (2G/3G/4G/5G/WiFi) → 设备能力 (内存/CPU) → 用户偏好 (省流模式)
资源调整：图片质量 + 代码分割 + 功能裁剪 + 加载时机

```javascript
// 自适应加载管理器
class AdaptiveLoadingManager {
  constructor() {
    this.networkInfo = navigator.connection;
    this.deviceMemory = navigator.deviceMemory || 4; // 默认4GB
    this.saveData = this.networkInfo ? this.networkInfo.saveData : false;
  }
  
  // 初始化自适应策略
  init() {
    this.applyNetworkAdaptation();
    this.applyDeviceAdaptation();
    this.applyUserPreferences();
  }
  
  // 网络自适应
  applyNetworkAdaptation() {
    const effectiveType = this.networkInfo ? this.networkInfo.effectiveType : '4g';
    
    const strategies = {
      'slow-2g': this.getSlow2GStrategy(),
      '2g': this.get2GStrategy(),
      '3g': this.get3GStrategy(),
      '4g': this.get4GStrategy()
    };
    
    const strategy = strategies[effectiveType] || strategies['4g'];
    this.applyLoadingStrategy(strategy);
  }
  
  // 慢速2G策略
  getSlow2GStrategy() {
    return {
      imageQuality: 'low',
      lazyLoadThreshold: 0.1,
      preload: false,
      prefetch: false,
      videoAutoplay: false,
      disableAnimations: true,
      codeSplitting: 'minimal'
    };
  }
  
  // 设备能力自适应
  applyDeviceAdaptation() {
    if (this.deviceMemory < 2) {
      // 低内存设备优化
      this.limitConcurrentDownloads();
      this.aggressiveMemoryCleanup();
      this.disableHeavyFeatures();
    }
    
    // CPU核心数考虑
    this.adaptToCPUCores();
  }
  
  // 用户偏好适配
  applyUserPreferences() {
    if (this.saveData) {
      this.enableDataSaverMode();
    }
    
    // 检查减少动画偏好
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.disableAnimations();
    }
    
    // 检查颜色方案偏好
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    this.applyColorScheme(colorScheme);
  }
  
  // 应用加载策略
  applyLoadingStrategy(strategy) {
    // 调整图片质量
    this.adjustImageQuality(strategy.imageQuality);
    
    // 配置懒加载
    this.setLazyLoadThreshold(strategy.lazyLoadThreshold);
    
    // 控制预加载
    this.togglePreloading(strategy.preload);
    
    // 禁用动画
    if (strategy.disableAnimations) {
      this.disableNonEssentialAnimations();
    }
  }
  
  // 调整图片质量
  adjustImageQuality(quality) {
    const qualityMap = {
      'low': 50,
      'medium': 70,
      'high': 85,
      'very-high': 95
    };
    
    const qualityValue = qualityMap[quality] || 70;
    
    // 为图片URL添加质量参数
    document.querySelectorAll('img[data-src]').forEach(img => {
      const src = img.dataset.src;
      if (src && !src.includes('quality=')) {
        const separator = src.includes('?') ? '&' : '?';
        img.dataset.src = `${src}${separator}quality=${qualityValue}`;
      }
    });
  }
  
  // 设置懒加载阈值
  setLazyLoadThreshold(threshold) {
    // 更新Intersection Observer配置
    if (window.lazyLoadManager) {
      window.lazyLoadManager.config.rootMargin = `${threshold * 100}px 0px`;
    }
  }
  
  // 省流模式
  enableDataSaverMode() {
    document.documentElement.classList.add('data-saver');
    
    // 禁用视频自动播放
    document.querySelectorAll('video[autoplay]').forEach(video => {
      video.removeAttribute('autoplay');
    });
    
    // 降低图片质量
    this.adjustImageQuality('low');
    
    // 禁用非关键背景图片
    const styles = document.createElement('style');
    styles.textContent = `
      .data-saver [data-bg] {
        background-image: none !important;
      }
    `;
    document.head.appendChild(styles);
  }
  
  // 动态加载资源
  loadResourceAdaptive(url, options = {}) {
    const context = this.getLoadContext();
    const adaptedUrl = this.adaptResourceUrl(url, context);
    
    return this.loadResource(adaptedUrl, options);
  }
  
  // 获取加载上下文
  getLoadContext() {
    return {
      network: this.networkInfo ? this.networkInfo.effectiveType : '4g',
      saveData: this.saveData,
      deviceMemory: this.deviceMemory,
      cpuCores: navigator.hardwareConcurrency || 4
    };
  }
  
  // 适配资源URL
  adaptResourceUrl(url, context) {
    // 根据上下文修改资源URL参数
    if (url.includes('/images/')) {
      return this.adaptImageUrl(url, context);
    }
    
    if (url.includes('/js/')) {
      return this.adaptScriptUrl(url, context);
    }
    
    return url;
  }
  
  // 适配图片URL
  adaptImageUrl(url, context) {
    const params = new URLSearchParams();
    
    // 根据网络条件设置质量
    if (context.network === 'slow-2g' || context.saveData) {
      params.set('quality', '50');
      params.set('format', 'webp');
    } else if (context.network === '2g') {
      params.set('quality', '65');
      params.set('format', 'webp');
    } else if (context.network === '3g') {
      params.set('quality', '75');
      params.set('format', 'webp');
    }
    
    // 根据设备内存设置尺寸
    if (context.deviceMemory < 2) {
      params.set('width', '800');
    }
    
    const paramString = params.toString();
    if (paramString) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}${paramString}`;
    }
    
    return url;
  }
}
```