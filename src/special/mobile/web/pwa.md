# PWA

PWA (Progressive Web App) 是一种通过现代 Web 技术构建的应用程序，旨在提供与原生应用相媲美的用户体验。它结合了 Web 的广泛覆盖范围和原生应用的功能特性，让用户能够**无需通过应用商店**即可安装和使用应用，同时支持离线工作和推送通知等功能。

## 核心概念与定义

PWA 不是特定的框架或技术，而是一种**设计和开发理念**，其核心在于利用现代 Web 能力逐步增强用户体验。一个合格的 PWA 应用需要具备以下关键特征：

- **可发现性**：能够被搜索引擎索引，并通过 Web 应用清单文件提供应用元数据。
- **可安装性**：用户可以将其添加到设备主屏幕，像原生应用一样启动和运行。
- **网络独立性**：通过 Service Worker 技术实现离线工作或弱网环境下的正常使用。
- **连接安全性**：必须通过 HTTPS 提供服务，防止数据被篡改或窃取。
- **响应式界面**：适应各种屏幕尺寸和设备类型，从手机到桌面电脑。
- **应用化交互**：提供类似原生应用的导航和交互体验，避免传统的浏览器界面。

PWA 生命周期示意图：
注册 Service Worker → 安装并激活 → 拦截网络请求 → 提供缓存内容
↓
用户访问 PWA 网站 → 体验原生应用般的交互 → 可选择添加到主屏幕

## 技术架构与核心组件

PWA 的技术架构建立在三个核心基础之上：Service Worker、Web 应用清单和应用程序外壳架构。这些技术协同工作，共同提供了 PWA 的独特能力和用户体验。

### Service Worker

Service Worker 是 PWA 的**核心技术**，它是在浏览器后台运行的脚本，充当 Web 应用程序与网络之间的代理。它的主要功能包括拦截和处理网络请求、管理缓存以及启用推送通知。

Service Worker 运行在独立于主浏览器线程的 Worker 上下文中，因此它无法直接访问 DOM，但可以通过 `postMessage` 接口与页面通信。

Service Worker 生命周期示意图：
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 注册 │ → │ 安装 │ → │ 激活 │
│ (Register) │ │ (Install) │ │ (Activate) │
└─────────────┘ └─────────────┘ └─────────────┘
↓ ↓ ↓
等待控制器接管 ← ┌─────────────┐ ← 处理旧缓存清理
│ 运行 │
│ (Idle) │
└─────────────┘

### Web 应用清单

Web 应用清单是一个 JSON 文件，它控制着 PWA 的**外观和启动行为**。该文件定义了应用如何显示给用户 (例如在全屏、独立或最小 UI 模式中启动)，以及主屏幕图标、主题颜色和方向等设置。

```json
// manifest.json 示例
{
  "name": "我的PWA应用",
  "short_name": "我的PWA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007bff",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "scope": "/",
  "description": "一个示例PWA应用"
}
```

### 应用程序外壳架构

应用程序外壳架构是一种设计模式，将**核心用户界面**与**动态内容**分离。它先加载应用的最小化静态界面，然后使用 JavaScript 填充内容，这显著提升了感知加载速度。

应用外壳架构示意图：
┌─────────────────────────────────────────┐
│ 应用外壳 (App Shell) │
│ ┌─────────────┐ ┌──────────────────┐ │
│ │ 头部导航 │ │ 侧边栏 │ │
│ └─────────────┘ └──────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ 动态内容区域 │ ← 从 API 或缓存加载
│ │ │ │
│ └──────────────────────────────────┘ │
└─────────────────────────────────────────┘

## 主要特点与优势

PWA 之所以受到广泛关注和应用，是因为它融合了 Web 和原生应用的优势，解决了传统 Web 应用的多个痛点。

### 跨平台兼容性

PWA 能够在各种设备和平台上提供一致的用户体验，从智能手机到桌面电脑，只需一个代码库。这种跨平台特性显著降低了开发和维护成本。

平台适配示意图：
┌─────────────┐
│ PWA 代码 │
└─────────────┘
↓ ↓ ↓
┌───────────┐ ┌───────────┐ ┌───────────┐
│ iOS │ │ Android │ │ Desktop │
└───────────┘ └───────────┘ └───────────┘

### 离线功能

通过 Service Worker 的缓存机制，PWA 可以在没有网络连接的情况下继续工作，这是与传统 Web 应用的根本区别之一。

离线策略对比：
在线体验：用户请求 → 网络获取 → 返回最新内容
离线体验：用户请求 → Service Worker → 返回缓存内容

### 可安装性

用户可以将经常访问的 PWA 添加到设备主屏幕，无需通过应用商店。这消除了传统应用安装的摩擦，同时保留了类似原生应用的启动体验。

安装流程示意图：
用户访问网站 → 浏览器检测到 Manifest → 显示安装提示 → 用户确认添加
↓
应用图标出现在主屏幕 → 点击图标以独立窗口启动

### 推送通知

PWA 支持推送通知功能，即使应用未主动运行，也能通过 Service Worker 在后台接收和显示通知，这大大提高了用户参与度和回头率。

推送机制示意图：
服务器发送通知 → 推送服务中转 → Service Worker 接收 → 显示通知给用户

### 性能优势

PWA 通过缓存和智能预加载策略，可以实现近乎瞬时的加载速度，即使在不确定的网络条件下也能立即加载。

性能对比示意图：
传统网站：请求 → 下载 HTML → 下载 CSS/JS → 下载数据 → 渲染
PWA：请求 → 从缓存返回 App Shell → 显示 → 异步加载数据

## 常用 API 及代码示例

PWA 的实现依赖于一系列现代 Web API，这些 API 共同赋予了 PWA 强大的功能和优异的用户体验。

### Service Worker 注册与安装

Service Worker 是 PWA 的核心，负责缓存管理和离线支持。

```javascript
// 主线程中注册 Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('/sw.js')
      .then(function (registration) {
        console.log('Service Worker 注册成功: ', registration.scope)
      })
      .catch(function (error) {
        console.log('Service Worker 注册失败: ', error)
      })
  })
}

// sw.js - Service Worker 安装和激活
const CACHE_NAME = 'my-pwa-cache-v1'
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/scripts/app.js',
  '/images/logo.png',
]

// 安装阶段：预缓存关键资源
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log('已打开缓存')
      return cache.addAll(urlsToCache)
    })
  )
})

// 激活阶段：清理旧缓存
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存：', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})
```

### 缓存策略实现

不同的资源类型需要不同的缓存策略，以实现性能与内容新鲜度的平衡。

```javascript
// sw.js - 缓存策略实现
self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // 缓存命中 - 返回缓存内容
      if (response) {
        return response
      }

      // 克隆请求，因为请求是流，只能使用一次
      const fetchRequest = event.request.clone()

      return fetch(fetchRequest).then(function (response) {
        // 检查响应是否有效
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // 克隆响应，因为响应是流，只能使用一次
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then(function (cache) {
          // 将新资源加入缓存
          cache.put(event.request, responseToCache)
        })

        return response
      })
    })
  )
})

// 更精细的缓存策略：网络优先，失败时使用缓存
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, networkResponse.clone())
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    return cachedResponse || Response.error()
  }
}

// 缓存优先，适用于静态资源
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  try {
    const networkResponse = await fetch(request)
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, networkResponse.clone())
    return networkResponse
  } catch (error) {
    return Response.error()
  }
}
```

### Web 应用清单配置

Web 应用清单定义了 PWA 的显示方式和外观。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>我的PWA应用</title>

    <!-- 链接 Web 应用清单 -->
    <link rel="manifest" href="manifest.json" />

    <!-- 主题颜色，用于地址栏等系统UI -->
    <meta name="theme-color" content="#007bff" />

    <!-- iOS 特定配置 -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="我的PWA" />
    <link rel="apple-touch-icon" href="icons/icon-192x192.png" />
  </head>
  <body>
    <!-- 应用内容 -->
    <div id="app">
      <header>我的PWA应用</header>
      <main>
        <h1>欢迎使用PWA</h1>
        <p>这是一个渐进式Web应用的示例</p>
      </main>
    </div>

    <script>
      // 注册 Service Worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
      }

      // 监听 beforeinstallprompt 事件，用于自定义安装提示
      let deferredPrompt

      window.addEventListener('beforeinstallprompt', (e) => {
        // 阻止浏览器默认的安装提示
        e.preventDefault()
        // 保存事件，以便后续触发
        deferredPrompt = e
        // 显示自定义安装按钮
        showInstallPromotion()
      })

      function showInstallPromotion() {
        // 显示自定义安装界面
        const installButton = document.createElement('button')
        installButton.textContent = '安装应用'
        installButton.addEventListener('click', installApp)
        document.body.appendChild(installButton)
      }

      async function installApp() {
        if (!deferredPrompt) return
        // 显示安装提示
        deferredPrompt.prompt()
        // 等待用户选择
        const { outcome } = await deferredPrompt.userChoice
        // 清理引用
        deferredPrompt = null
        // 移除安装按钮
        document.querySelector('button').remove()
      }
    </script>
  </body>
</html>
```

### 现代 Web API 集成

PWA 可以集成各种现代 Web API 来增强功能，提供更接近原生应用的体验。

```javascript
// 推送通知 API
function requestNotificationPermission() {
  return new Promise((resolve, reject) => {
    if (!('Notification' in window)) {
      reject(new Error('浏览器不支持通知'))
    } else if (Notification.permission === 'granted') {
      resolve('granted')
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        resolve(permission)
      })
    } else {
      reject(new Error('通知权限已被拒绝'))
    }
  })
}

function showLocalNotification(title, options) {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, options)
    })
  }
}

// 使用示例
document.getElementById('notify-btn').addEventListener('click', () => {
  requestNotificationPermission()
    .then(() => {
      showLocalNotification('欢迎使用PWA', {
        body: '这是一个推送通知示例',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        actions: [
          { action: 'like', title: '👍 喜欢' },
          { action: 'dismiss', title: '关闭' },
        ],
      })
    })
    .catch((error) => console.error(error))
})

// 后台同步 API
function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.sync
        .register('background-sync')
        .then(() => console.log('后台同步已注册'))
        .catch(() => console.log('后台同步注册失败'))
    })
  }
}

// 在 Service Worker 中处理后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // 执行后台同步任务，如发送待发送的数据
  const pendingData = await getPendingData()
  for (const data of pendingData) {
    try {
      await sendToServer(data)
      await markAsSent(data.id)
    } catch (error) {
      console.error('同步失败:', error)
    }
  }
}

// 使用 Web Share API 实现内容分享
function shareContent(shareData) {
  if (navigator.share) {
    navigator
      .share(shareData)
      .then(() => console.log('分享成功'))
      .catch((error) => console.log('分享失败:', error))
  } else {
    // 降级方案：复制到剪贴板
    fallbackShare(shareData)
  }
}

// 使用示例
document.getElementById('share-btn').addEventListener('click', () => {
  shareContent({
    title: '我的PWA应用',
    text: '看看这个很棒的PWA应用!',
    url: window.location.href,
  })
})
```

## 开发实践与调试

PWA 的开发流程和调试方法与传统 Web 开发有所不同，需要特别关注一些工具和技巧。

### 开发工具与调试

现代浏览器提供了强大的 PWA 开发工具，帮助开发者调试和优化应用。

```javascript
// 检查 Service Worker 状态
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    console.log(`已注册 ${registrations.length} 个 Service Worker`)
    registrations.forEach((registration) => {
      console.log('Scope:', registration.scope)
      console.log('状态:', registration.active ? '激活' : '未激活')
    })
  })
}

// 检查缓存内容
caches.keys().then((cacheNames) => {
  console.log('现有缓存:', cacheNames)
  cacheNames.forEach((cacheName) => {
    caches.open(cacheName).then((cache) => {
      cache.keys().then((requests) => {
        console.log(
          `缓存 ${cacheName} 中的内容:`,
          requests.map((req) => req.url)
        )
      })
    })
  })
})

// 监听 Service Worker 消息
navigator.serviceWorker.addEventListener('message', (event) => {
  console.log('收到来自 Service Worker 的消息:', event.data)
})

// 向 Service Worker 发送消息
function sendMessageToSW(message) {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message)
  }
}
```

### 性能优化策略

PWA 的性能优化需要综合考虑缓存策略、资源加载和用户体验。

```javascript
// 预缓存关键资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('critical-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/styles/main.css',
        '/scripts/main.js',
        '/images/hero-image.jpg',
      ])
    })
  )
})

// 延迟缓存非关键资源
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // API 请求：网络优先策略
    event.respondWith(networkFirst(event.request))
  } else if (event.request.destination === 'image') {
    // 图片：缓存优先，后台更新
    event.respondWith(cacheFirst(event.request))
  } else {
    // 其他资源：网络优先
    event.respondWith(networkFirst(event.request))
  }
})

// 使用 Workbox 简化 PWA 开发
importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js'
)

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30天
      }),
    ],
  })
)

workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-responses',
    networkTimeoutSeconds: 3,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5分钟
      }),
    ],
  })
)
```

## 实际应用案例

众多知名公司已成功采用 PWA 技术，并取得了显著的业务成果。

- **Tinder**：PWA 版本比原生 Android 应用小 90%，加载时间从 11.91 秒减少到 4.69 秒。
- **Trivago**：用户将 PWA 添加到主屏幕后增长了 150%，离线支持下用户参与度显著提升。
- **Pinterest**：将移动网站升级为 PWA 后，核心用户参与度增加了 60%，广告收入增加了 44%。
- **Uber**：构建了仅 50KB 的核心应用，即使在 2G 网络下也能在 3 秒内完成加载。

这些案例证明了 PWA 在提升性能、用户参与度和业务指标方面的显著效果。
