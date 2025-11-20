# 网络层优化

## 网络性能基础 {#network-performance-basics}

网络层优化关注数据在客户端与服务器间传输的效率，涵盖连接建立、请求发送、响应接收和资源加载全过程。现代 Web 应用网络性能受制于带宽、延迟、协议效率和资源调度等多个因素。

特点：网络优化需要**分层治理**，从物理传输到应用协议每个环节都存在优化机会。优化策略应基于网络环境动态调整，平衡用户体验和资源成本。

示意图：
网络请求生命周期：
DNS 查询 → TCP 连接 → TLS 握手 → HTTP 请求 → 响应接收 → 内容解析
性能瓶颈：
高延迟 > 低带宽 > 协议开销 > 资源竞争
优化目标：减少往返次数 + 压缩传输数据 + 复用连接 + 预加载资源

## HTTP 协议优化 {#http-protocol-optimization}

HTTP/1.1 到 HTTP/2、HTTP/3 的演进显著改善网络性能。HTTP/2 引入多路复用、头部压缩和服务器推送，HTTP/3 基于 QUIC 协议进一步减少连接建立延迟。

特点：协议优化核心是**减少延迟**和**提高并发**。现代协议通过连接复用、0-RTT 握手和智能优先级提升传输效率。

示意图：
HTTP/1.1：6 个 TCP 连接 → 队头阻塞 → 串行请求
HTTP/2：1 个 TCP 连接 + 多路复用 + 头部压缩 → 并行请求
HTTP/3：QUIC 协议 + 0-RTT + 无队头阻塞 → 最优性能

```javascript
// HTTP/2服务器推送配置示例
// Node.js with Express
const express = require('express');
const http2 = require('http2');
const fs = require('fs');

const app = express();

// 静态资源推送
app.use('/app.js', (req, res) => {
  const pushResources = [
    '/styles/main.css',
    '/images/logo.svg'
  ];
  
  pushResources.forEach(path => {
    res.push(path, {
      request: { accept: '*/*' },
      response: { 'content-type': getContentType(path) }
    }).end(fs.readFileSync(`./public${path}`));
  });
  
  res.sendFile(__dirname + '/public/app.js');
});

// 基于依赖的优先级推送
function prioritizeResources(mainResource) {
  const dependencyMap = {
    '/index.html': ['/styles.css', '/app.js'],
    '/app.js': ['/vendor.js', '/utils.js'],
    '/product/:id': ['/product.css', '/product.js', '/api/product/:id']
  };
  
  return dependencyMap[mainResource] || [];
}
```

## 连接管理优化 {#connection-management}

连接建立是网络延迟的主要来源。优化策略包括连接复用、预连接、TCP 优化和 QUIC 协议采用。保持活跃连接减少握手开销，预连接关键域名加速后续请求。

特点：连接优化关注**建立成本**和**利用率**。长连接、连接池和域名分片技术平衡连接数量和性能收益。

示意图：
连接建立成本：
TCP 三次握手：1.5 RTT → TLS 握手：1-2 RTT → 总计：2.5-3.5 RTT
优化后：连接复用 → 0 RTT | 预连接 → 提前完成握手
性能收益：减少 60-80%连接建立时间

```javascript
// 连接预加载与资源提示
class ConnectionOptimizer {
  constructor() {
    this.preconnectedOrigins = new Set();
  }
  
  // 预连接关键域名
  preconnectCriticalOrigins() {
    const criticalOrigins = [
      'https://fonts.googleapis.com',
      'https://cdn.example.com',
      'https://api.service.com'
    ];
    
    criticalOrigins.forEach(origin => {
      if (!this.preconnectedOrigins.has(origin)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
        
        this.preconnectedOrigins.add(origin);
      }
    });
  }
  
  // DNS预获取
  prefetchDNS(domains) {
    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });
  }
  
  // 基于用户行为的预测预连接
  setupPredictivePreconnect() {
    // 鼠标悬停时预连接
    document.querySelectorAll('[data-preconnect]').forEach(element => {
      element.addEventListener('mouseenter', () => {
        const origin = element.dataset.preconnect;
        this.preconnectOrigin(origin);
      }, { once: true });
    });
    
    // 路由变化前预连接
    this.setupRouteBasedPreconnect();
  }
  
  // TCP连接优化配置
  configureTCPOptimizations() {
    // 对于重要连接，调整TCP参数
    // 这通常需要在服务器和客户端网络栈配置
    const tcpOptimizations = {
      tcp_fastopen: true,      // 启用TCP Fast Open
      initial_cwnd: 10,        // 初始拥塞窗口
      tcp_slow_start_after_idle: false  // 空闲后不重置拥塞窗口
    };
    
    return tcpOptimizations;
  }
}
```

## 资源加载策略 {#resource-loading-strategies}

资源加载策略决定资源获取时机和优先级。核心策略包括预加载、懒加载、优先级提示和条件加载。基于用户意图和视图 port 智能调度资源加载顺序。

特点：资源加载优化平衡**即时需求**和**预测需求**。关键路径资源优先加载，非关键资源延迟加载，可能资源预加载。

示意图：
资源加载优先级：
关键资源 (CSS、首屏 JS) → 高优先级 (字体、首屏图片) → 中优先级 (可见区域内容) → 低优先级 (屏幕外内容)
加载策略：预加载关键资源 + 懒加载非关键资源 + 预获取可能资源

```javascript
// 智能资源加载管理器
class ResourceLoadManager {
  constructor() {
    this.observer = null;
    this.loadedResources = new Set();
    this.priorityQueue = new Map();
  }
  
  // 基于视口的懒加载
  setupViewportLoading() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          this.loadResource(element);
          this.observer.unobserve(element);
        }
      });
    });
    
    // 观察所有懒加载资源
    document.querySelectorAll('[data-lazy-src]').forEach(element => {
      this.observer.observe(element);
    });
  }
  
  // 优先级加载队列
  setupPriorityLoading() {
    // 定义资源优先级
    const priorityMap = {
      'critical': 1,    // 关键CSS、首屏JS
      'high': 2,        // 字体、首屏图片
      'medium': 3,      // 首屏后内容
      'low': 4          // 屏幕外内容
    };
    
    // 基于连接速度调整策略
    this.adaptToNetworkConditions();
  }
  
  // 网络自适应加载
  adaptToNetworkConditions() {
    const connection = navigator.connection;
    
    if (connection) {
      const strategy = this.getLoadingStrategy(connection);
      this.applyLoadingStrategy(strategy);
    }
  }
  
  getLoadingStrategy(connection) {
    if (connection.saveData) {
      return 'conservative';  // 省流模式
    }
    
    switch (connection.effectiveType) {
      case '4g':
        return 'aggressive';  // 积极预加载
      case '3g':
        return 'moderate';    // 适度加载
      case '2g':
      case 'slow-2g':
        return 'conservative'; // 保守加载
      default:
        return 'moderate';
    }
  }
  
  // 预加载关键资源
  preloadCriticalResources() {
    const criticalResources = [
      { href: '/styles/critical.css', as: 'style' },
      { href: '/js/main.js', as: 'script' },
      { href: '/fonts/primary.woff2', as: 'font', crossorigin: true }
    ];
    
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      
      if (resource.crossorigin) {
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
    });
  }
  
  // 预测性预获取
  predictivePrefetch() {
    // 基于用户行为预测下一步可能访问的资源
    const predictionRules = [
      {
        trigger: 'hover',
        selector: '.product-link',
        resources: ['/product-preview.css', '/product-preview.js']
      },
      {
        trigger: 'click',
        selector: '.search-btn', 
        resources: ['/search-results.css', '/search-api.js']
      }
    ];
    
    predictionRules.forEach(rule => {
      document.querySelectorAll(rule.selector).forEach(element => {
        element.addEventListener(rule.trigger, () => {
          rule.resources.forEach(resource => {
            this.prefetchResource(resource);
          });
        });
      });
    });
  }
}
```

## 缓存策略优化 {#caching-strategies}

缓存通过存储重复使用的资源减少网络请求。分层缓存策略包括浏览器缓存、Service Worker 缓存、CDN 缓存和服务器缓存。合理的缓存策略平衡新鲜度和性能。

特点：缓存优化核心是**命中率**和**新鲜度**的平衡。静态资源长期缓存，动态内容条件缓存，个性化内容谨慎缓存。

示意图：
缓存层次结构：
浏览器内存缓存 → HTTP 缓存 → Service Worker 缓存 → CDN 缓存 → 源服务器
缓存策略：
强缓存 (Cache-Control) → 协商缓存 (ETag/Last-Modified) → 网络优先 → 缓存优先

```javascript
// Service Worker 缓存策略
class CacheStrategyManager {
  constructor() {
    this.cacheName = 'app-v1';
    this.strategies = new Map();
  }
  
  // 注册不同资源的缓存策略
  registerStrategies() {
    // 静态资源 - 缓存优先
    this.strategies.set(/\.(css|js|woff2)$/, {
      strategy: 'cache-first',
      cacheName: 'static-assets'
    });
    
    // 图片 - 缓存优先，可过期
    this.strategies.set(/\.(jpg|png|webp|avif)$/, {
      strategy: 'cache-first',
      cacheName: 'images',
      options: { maxEntries: 100, maxAgeSeconds: 86400 * 30 } // 30天
    });
    
    // API数据 - 网络优先
    this.strategies.set(/\/api\//, {
      strategy: 'network-first', 
      cacheName: 'api-data',
      options: { maxEntries: 50, maxAgeSeconds: 300 } // 5分钟
    });
    
    // HTML页面 - 网络优先
    this.strategies.set(/\/($|\?)/, {
      strategy: 'network-first',
      cacheName: 'pages'
    });
  }
  
  // 获取资源的缓存策略
  getStrategy(url) {
    for (const [pattern, strategy] of this.strategies) {
      if (pattern.test(url)) {
        return strategy;
      }
    }
    return { strategy: 'network-only' }; // 默认策略
  }
  
  // 缓存优先实现
  async cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      // 网络失败时返回兜底响应
      return new Response('', { status: 408, statusText: 'Request timeout' });
    }
  }
  
  // 网络优先实现
  async networkFirst(request, cacheName) {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);
      return cachedResponse || this.offlineResponse();
    }
  }
}
```

## 内容分发网络优化 {#cdn-optimization}

CDN 通过地理分布的边缘节点缓存内容，减少传输延迟。优化策略包括智能路由、动态加速、边缘计算和缓存策略调优。现代 CDN 支持 HTTP/3、Brotli 压缩和实时日志分析。

特点：CDN 优化关注**覆盖范围**和**缓存效率**。多 CDN 策略提升可用性，边缘计算减少回源请求，实时监控优化节点选择。

示意图：
CDN 请求流程：
用户请求 → DNS 智能解析 → 最优边缘节点 → 缓存检查 → 命中则返回 → 未命中则回源
优化维度：节点覆盖 + 缓存命中率 + 协议支持 + 安全防护

```javascript
// 多CDN负载均衡与故障转移
class MultiCDNManager {
  constructor() {
    this.cdnProviders = [
      { 
        name: 'cdn-primary',
        domains: ['cdn1.example.com', 'cdn2.example.com'],
        weight: 10,
        health: true
      },
      {
        name: 'cdn-backup', 
        domains: ['backup1.example.com', 'backup2.example.com'],
        weight: 5,
        health: true
      }
    ];
    
    this.currentProvider = 0;
    this.healthCheckInterval = 30000; // 30秒健康检查
  }
  
  // 获取最优CDN域名
  getOptimalCDNDomain(resourcePath) {
    const provider = this.getHealthyProvider();
    const domains = provider.domains;
    
    // 基于地理位置、延迟等选择域名
    const optimalDomain = this.selectOptimalDomain(domains, resourcePath);
    return `https://${optimalDomain}${resourcePath}`;
  }
  
  // 选择健康提供商
  getHealthyProvider() {
    const healthyProviders = this.cdnProviders.filter(p => p.health);
    
    if (healthyProviders.length === 0) {
      // 所有CDN都不可用，回源
      return { domains: ['origin.example.com'] };
    }
    
    // 加权随机选择
    return this.weightedRandomSelect(healthyProviders);
  }
  
  // CDN健康检查
  async performHealthChecks() {
    const checkPromises = this.cdnProviders.map(async (provider) => {
      try {
        const response = await fetch(`https://${provider.domains[0]}/health-check`, {
          method: 'HEAD',
          timeout: 5000
        });
        
        provider.health = response.ok;
      } catch (error) {
        provider.health = false;
        console.warn(`CDN ${provider.name} health check failed:`, error);
      }
    });
    
    await Promise.allSettled(checkPromises);
  }
  
  // 基于资源类型选择CDN策略
  getCDNStrategyForResource(url) {
    if (url.includes('/video/')) {
      return {
        provider: 'video-cdn',
        protocol: 'h2', // HTTP/2 for multiplexing
        cacheTtl: 3600
      };
    }
    
    if (url.includes('/images/')) {
      return {
        provider: 'image-cdn', 
        protocol: 'h3', // HTTP/3 for better performance
        cacheTtl: 86400,
        format: 'webp,avif' // 自动格式转换
      };
    }
    
    if (url.includes('/api/')) {
      return {
        provider: 'api-cdn',
        protocol: 'h2',
        cacheTtl: 60, // 短缓存
        dynamicAcceleration: true
      };
    }
    
    return {
      provider: 'default-cdn',
      protocol: 'h2',
      cacheTtl: 3600
    };
  }
}
```

## 压缩与编码优化 {#compression-encoding}

数据压缩减少传输字节数，提升网络效率。现代压缩算法如 Brotli 和 Zstandard 提供比 Gzip 更好的压缩率。内容编码优化包括图片格式选择、视频编码和文本压缩。

特点：压缩优化平衡**压缩率**和**计算成本**。Brotli 适合文本压缩，WebP/AVIF 适合图片，动态内容使用流式压缩。

示意图：
压缩算法比较：
Gzip：中等压缩率 + 低 CPU 成本 → 通用场景
Brotli：高压缩率 + 中等 CPU 成本 → 文本资源
Zstandard：极高压缩率 + 低 CPU 成本 → 大型文件
优化选择：静态资源用 Brotli + 动态内容用 Gzip + 图片用现代格式

```javascript
// 压缩策略管理器
class CompressionManager {
  constructor() {
    this.supportedEncodings = this.detectSupportedEncodings();
  }
  
  // 检测支持的压缩编码
  detectSupportedEncodings() {
    // 在实际应用中，这通常通过Accept-Encoding头检测
    // 这里简化为基于浏览器特性检测
    const encodings = ['gzip', 'deflate'];
    
    // 检测Brotli支持
    if (typeof BrotliDecode !== 'undefined') {
      encodings.push('br');
    }
    
    return encodings;
  }
  
  // 为资源选择最优压缩
  getOptimalCompression(resourceType, content) {
    const strategies = {
      'text/html': { encoding: 'br', level: 5 },
      'text/css': { encoding: 'br', level: 6 },
      'application/javascript': { encoding: 'br', level: 5 },
      'application/json': { encoding: 'gzip', level: 6 },
      'image/svg+xml': { encoding: 'br', level: 7 }
    };
    
    const strategy = strategies[resourceType] || { encoding: 'gzip', level: 5 };
    
    // 对于小文件，可能不需要压缩
    if (content.length < 150) {
      return { encoding: null, reason: 'content_too_small' };
    }
    
    return strategy;
  }
  
  // 图片格式优化
  optimizeImageFormat(originalImage, context) {
    const { format, width, height, quality } = this.selectImageFormat(
      originalImage, 
      context
    );
    
    return {
      format,
      width, 
      height,
      quality,
      url: this.generateImageURL(originalImage, { format, width, height, quality })
    };
  }
  
  selectImageFormat(image, context) {
    const { clientWidth, network } = context;
    
    // 基于网络条件和屏幕尺寸选择格式
    if (this.supportsAvif() && network !== 'slow-2g') {
      return { format: 'avif', quality: 65, width: clientWidth * 2 };
    }
    
    if (this.supportsWebp()) {
      return { format: 'webp', quality: 75, width: clientWidth * 2 };
    }
    
    // 回退到JPEG或PNG
    return image.hasAlpha ? 
      { format: 'png', quality: 100, width: clientWidth } :
      { format: 'jpeg', quality: 80, width: clientWidth };
  }
  
  // 响应压缩中间件示例（Node.js）
  static createCompressionMiddleware() {
    const compression = require('compression');
    
    return compression({
      // 只压缩超过1KB的响应
      threshold: 1024,
      // 基于内容类型过滤
      filter: (req, res) => {
        const type = res.getHeader('Content-Type');
        return !!type && (
          type.includes('text/') ||
          type.includes('application/') ||
          type.includes('image/svg')
        );
      },
      // Brotli配置
      brotli: {
        enabled: true,
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 5,
        },
      },
    });
  }
}
```

## 移动网络优化 {#mobile-network-optimization}

移动网络具有高延迟、不稳定和流量限制特点。优化策略包括减少请求数量、压缩传输数据、适应网络变化和节省电量。使用 Network Information API 适配不同网络条件。

特点：移动网络优化强调**适应性**和**经济性**。根据网络类型调整资源策略，优先考虑数据用量和电池消耗。

示意图：
移动网络特性：
高延迟 (100-500ms) + 不稳定带宽 + 数据限制 + 电池约束
优化策略：减少 DNS 查询 + 合并请求 + 压缩资源 + 缓存积极 + 预连接谨慎

```javascript
// 移动网络自适应优化
class MobileNetworkOptimizer {
  constructor() {
    this.connection = navigator.connection;
    this.currentStrategy = this.detectNetworkStrategy();
  }
  
  // 检测网络策略
  detectNetworkStrategy() {
    if (!this.connection) {
      return 'moderate';
    }
    
    const { effectiveType, saveData } = this.connection;
    
    if (saveData) {
      return 'data-saver';
    }
    
    switch (effectiveType) {
      case '4g':
        return 'aggressive';
      case '3g':
        return 'moderate';
      case '2g':
      case 'slow-2g':
        return 'conservative';
      default:
        return 'moderate';
    }
  }
  
  // 应用网络策略
  applyNetworkStrategy() {
    const strategies = {
      'aggressive': {
        preload: true,
        prefetch: true,
        imageQuality: 'high',
        videoAutoplay: true,
        lazyLoadThreshold: 0.1 // 较早开始懒加载
      },
      'moderate': {
        preload: true,
        prefetch: false,
        imageQuality: 'medium', 
        videoAutoplay: false,
        lazyLoadThreshold: 0.5
      },
      'conservative': {
        preload: false,
        prefetch: false,
        imageQuality: 'low',
        videoAutoplay: false,
        lazyLoadThreshold: 0.8
      },
      'data-saver': {
        preload: false,
        prefetch: false,
        imageQuality: 'very-low',
        videoAutoplay: false,
        lazyLoadThreshold: 1.0,
        disableAnimations: true
      }
    };
    
    const strategy = strategies[this.currentStrategy];
    this.configureResourceLoading(strategy);
  }
  
  // 配置资源加载策略
  configureResourceLoading(strategy) {
    // 调整图片质量
    this.adjustImageQuality(strategy.imageQuality);
    
    // 控制预加载
    this.togglePreloading(strategy.preload);
    
    // 配置懒加载阈值
    this.setLazyLoadThreshold(strategy.lazyLoadThreshold);
    
    // 禁用动画（在省流模式）
    if (strategy.disableAnimations) {
      this.disableNonEssentialAnimations();
    }
  }
  
  // 网络变化监听
  setupNetworkChangeListener() {
    if (this.connection) {
      this.connection.addEventListener('change', () => {
        const newStrategy = this.detectNetworkStrategy();
        
        if (newStrategy !== this.currentStrategy) {
          this.currentStrategy = newStrategy;
          this.applyNetworkStrategy();
          this.emitNetworkChangeEvent(newStrategy);
        }
      });
    }
  }
  
  // 移动网络特定优化
  applyMobileSpecificOptimizations() {
    // TCP优化 - 更积极的拥塞控制
    this.optimizeTCPForMobile();
    
    // 减少DNS查询
    this.minimizeDNSLookups();
    
    // 避免重定向链
    this.eliminateRedirects();
    
    // 启用TLS会话恢复
    this.enableTLSSessionResumption();
  }
  
  // 省流模式优化
  setupDataSaverOptimizations() {
    if (this.connection && this.connection.saveData) {
      // 降低图片质量
      document.documentElement.classList.add('data-saver-mode');
      
      // 禁用视频自动播放
      const videos = document.querySelectorAll('video[autoplay]');
      videos.forEach(video => {
        video.removeAttribute('autoplay');
      });
      
      // 减少非关键请求
      this.deferNonCriticalRequests();
    }
  }
}
```

## 安全与性能平衡 {#security-performance-balance}

安全措施如 TLS 加密和 CSP 策略可能影响性能。优化策略包括 TLS 会话恢复、OCSP 装订、证书优化和安全头精简。平衡安全要求和性能影响。

特点：安全优化关注**加密效率**和**策略开销**。使用现代密码套件，优化证书链，减少安全检查的往返次数。

示意图：
TLS 性能优化：
完全握手：2 RTT + 高 CPU 成本 → 会话恢复：1 RTT → 0-RTT：0 RTT
安全头优化：精简 CSP 策略 + 合理 HSTS 配置 + 移除不必要头
平衡点：足够安全 + 最小性能影响

```javascript
// TLS与安全优化配置
class SecurityPerformanceOptimizer {
  constructor() {
    this.tlsConfig = this.getOptimalTLSConfig();
  }
  
  // 获取最优TLS配置
  getOptimalTLSConfig() {
    return {
      // 现代密码套件，平衡安全和性能
      ciphers: [
        'TLS_AES_128_GCM_SHA256',
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256'
      ].join(':'),
      
      // 启用会话恢复
      sessionTickets: true,
      sessionTimeout: 3600,
      
      // OCSP装订减少往返
      ocspStapling: true,
      
      // 支持0-RTT（权衡安全）
      earlyData: true,
      
      // 证书优化
      certificateTypes: ['ECDSA', 'RSA'],
      keyCurves: ['X25519', 'P-256']
    };
  }
  
  // 安全头优化
  optimizeSecurityHeaders() {
    const headers = {
      // 精简的CSP策略
      'Content-Security-Policy': this.generateOptimalCSP(),
      
      // 合理的HSTS配置
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      
      // 性能友好的特性策略
      'Permissions-Policy': this.generatePermissionsPolicy(),
      
      // 移除不必要头
      // 'X-Powered-By': '', // 移除
      // 'Server': '', // 移除或简化
    };
    
    return headers;
  }
  
  // 生成优化的CSP策略
  generateOptimalCSP() {
    // 基于应用需求生成最小化的CSP
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.example.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.example.com",
      "frame-ancestors 'none'",
      "base-uri 'self'"
    ].join('; ');
  }
  
  // 证书优化建议
  suggestCertificateOptimizations() {
    return {
      useECDSA: true,           // ECDSA证书更小更快
      preferLetsEncrypt: true,  // 短的证书链
      ocspMustStaple: true,     // 强制OCSP装订
      certificateTransparency: true, // 证书透明度
      renewBeforeExpiry: 30     // 提前30天续期
    };
  }
  
  // 安全扫描性能影响评估
  assessSecurityScanImpact() {
    const securityChecks = [
      { name: 'CSP Validation', impact: 'low', duration: '1-5ms' },
      { name: 'XSS Filter', impact: 'low', duration: '1-3ms' },
      { name: 'TLS Handshake', impact: 'medium', duration: '100-300ms' },
      { name: 'Certificate Verification', impact: 'low', duration: '5-20ms' },
      { name: 'Request Signature Validation', impact: 'high', duration: '10-50ms' }
    ];
    
    return securityChecks.filter(check => check.impact === 'high');
  }
}
```

## 网络性能监控 {#network-performance-monitoring}

实时监控网络性能指标，识别瓶颈和优化机会。使用 Navigation Timing API、Resource Timing API 和 Performance Observer 收集网络性能数据。

特点：网络监控关注**真实用户体验**和**关键性能指标**。结合合成监控和真实用户监控，全面了解网络性能状况。

```javascript
// 网络性能监控器
class NetworkPerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observer = null;
  }
  
  // 开始监控网络性能
  startMonitoring() {
    this.setupNavigationTiming();
    this.setupResourceTiming();
    this.setupNetworkInformation();
  }
  
  // 导航计时监控
  setupNavigationTiming() {
    const navigation = performance.getEntriesByType('navigation')[0];
    
    if (navigation) {
      this.recordNavigationMetrics(navigation);
    }
  }
  
  // 资源计时监控
  setupResourceTiming() {
    this.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.recordResourceMetrics(entry);
      });
    });
    
    this.observer.observe({ entryTypes: ['resource'] });
  }
  
  // 记录导航指标
  recordNavigationMetrics(navigation) {
    const metrics = {
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnect: navigation.connectEnd - navigation.connectStart,
      tlsHandshake: navigation.connectEnd - navigation.secureConnectionStart,
      ttfb: navigation.responseStart - navigation.requestStart,
      contentLoad: navigation.responseEnd - navigation.responseStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      fullLoad: navigation.loadEventEnd - navigation.loadEventStart
    };
    
    this.metrics.set('navigation', metrics);
    this.analyzeNavigationPerformance(metrics);
  }
  
  // 分析导航性能
  analyzeNavigationPerformance(metrics) {
    const thresholds = {
      dnsLookup: 100,    // 100ms
      tcpConnect: 150,   // 150ms  
      tlsHandshake: 200, // 200ms
      ttfb: 600,         // 600ms
      contentLoad: 500   // 500ms
    };
    
    Object.entries(metrics).forEach(([metric, value]) => {
      if (thresholds[metric] && value > thresholds[metric]) {
        this.reportPerformanceIssue(metric, value, thresholds[metric]);
      }
    });
  }
  
  // 网络信息监控
  setupNetworkInformation() {
    if (navigator.connection) {
      const connection = navigator.connection;
      
      connection.addEventListener('change', () => {
        this.recordConnectionChange({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      });
    }
  }
  
  // 生成网络性能报告
  generateNetworkReport() {
    const report = {
      summary: this.calculateSummaryMetrics(),
      resources: this.analyzeResourcePerformance(),
      recommendations: this.generateOptimizationRecommendations()
    };
    
    return report;
  }
  
  // 计算摘要指标
  calculateSummaryMetrics() {
    const navigation = this.metrics.get('navigation') || {};
    const resources = Array.from(this.metrics.values())
      .filter(metric => metric.resourceType);
    
    return {
      averageTTFB: navigation.ttfb,
      totalResources: resources.length,
      totalBytes: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      slowResources: resources.filter(r => r.duration > 1000).length
    };
  }
  
  // CDN性能分析
  analyzeCDNPerformance() {
    const resourcesByDomain = new Map();
    
    Array.from(this.metrics.values()).forEach(metric => {
      if (metric.resourceType) {
        const domain = new URL(metric.name).hostname;
        
        if (!resourcesByDomain.has(domain)) {
          resourcesByDomain.set(domain, []);
        }
        
        resourcesByDomain.get(domain).push(metric);
      }
    });
    
    // 分析每个域名的性能
    const cdnPerformance = [];
    
    resourcesByDomain.forEach((resources, domain) => {
      const avgResponseTime = resources.reduce((sum, r) => sum + r.duration, 0) / resources.length;
      const successRate = resources.filter(r => r.responseStatus < 400).length / resources.length;
      
      cdnPerformance.push({
        domain,
        avgResponseTime,
        successRate,
        requestCount: resources.length
      });
    });
    
    return cdnPerformance.sort((a, b) => a.avgResponseTime - b.avgResponseTime);
  }
}
```