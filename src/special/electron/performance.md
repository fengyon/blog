# Electron 性能优化

## 性能优化概述

Electron 应用性能优化是一个系统工程，涉及**启动速度**、**运行时性能**、**内存管理**和**资源使用**等多个维度。由于 Electron 应用同时包含 Node.js 后端环境和 Chromium 前端环境，性能优化需要在这两个层面协同进行。优化的核心目标是实现**更快的启动**、**更低的内存占用**和**更流畅的用户体验**。

Electron 性能瓶颈的典型分布：

```
启动阶段
├── 应用初始化延迟
├── 窗口创建耗时
└── 前端资源加载

运行阶段
├── 内存泄漏
├── 渲染性能
├── IPC 通信开销
└── 背景资源占用
```

## 启动性能优化

### 应用启动流程优化

优化 Electron 应用的启动流程，减少从启动到可交互的时间。

```javascript
// main.js - 启动优化配置
import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

class StartupOptimizer {
  constructor() {
    this.startTime = Date.now();
    this.optimizeAppConfig();
  }

  optimizeAppConfig() {
    // 禁用硬件加速（根据需求选择）
    // app.disableHardwareAcceleration();
    
    // 设置应用单例锁
    if (!app.requestSingleInstanceLock()) {
      app.quit();
      return;
    }

    // 预加载关键模块
    this.preloadCriticalModules();
  }

  preloadCriticalModules() {
    // 预加载常用 Node.js 模块
    require('fs');
    require('path');
    require('url');
  }

  async createOptimizedWindow() {
    const windowOptions = {
      width: 1200,
      height: 800,
      show: false, // 初始不显示，等待准备完成
      backgroundColor: '#2e2e2e', // 避免白色闪屏
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: join(dirname(fileURLToPath(import.meta.url)), 'preload.js'),
        // 性能相关配置
        offscreen: false,
        webgl: false, // 按需开启
        plugins: false,
        // 启用实验性功能提升性能
        experimentalFeatures: false,
        // 禁用不需要的功能
        navigateOnDragDrop: false,
        enablePreferredSize: false
      }
    };

    const mainWindow = new BrowserWindow(windowOptions);
    
    // 优化加载事件处理
    this.setupWindowEvents(mainWindow);
    
    return mainWindow;
  }

  setupWindowEvents(window) {
    // 使用 ready-to-show 事件，避免显示空白窗口
    window.once('ready-to-show', () => {
      const loadTime = Date.now() - this.startTime;
      console.log(`🔄 应用启动耗时: ${loadTime}ms`);
      
      window.show();
      window.focus();
      
      // 开发环境下显示性能信息
      if (process.env.NODE_ENV === 'development') {
        this.logPerformanceMetrics();
      }
    });

    // 优化页面加载
    window.webContents.on('did-finish-load', () => {
      this.injectPerformanceOptimizations(window);
    });
  }

  logPerformanceMetrics() {
    const metrics = {
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      versions: process.versions
    };
    console.log('📊 启动性能指标:', metrics);
  }

  injectPerformanceOptimizations(window) {
    // 注入性能优化脚本
    window.webContents.executeJavaScript(`
      // 禁用开发者工具快捷键（生产环境）
      if (process.env.NODE_ENV === 'production') {
        document.addEventListener('keydown', (e) => {
          if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
            e.preventDefault();
          }
        });
      }
      
      // 性能监控
      window.performanceMark('first-contentful-paint');
    `);
  }
}

// 应用启动优化
const startupOptimizer = new StartupOptimizer();

app.whenReady().then(async () => {
  const mainWindow = await startupOptimizer.createOptimizedWindow();
  
  // 加载应用页面
  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:3000');
  } else {
    await mainWindow.loadFile('dist/index.html');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### 代码分割与懒加载

使用现代前端构建工具的代码分割功能，减少初始加载体积。

```javascript
// src/utils/lazy-loading.js
export class LazyLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
  }

  // 动态导入模块
  async loadModule(modulePath, moduleName) {
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName);
    }

    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName);
    }

    const loadPromise = import(modulePath)
      .then(module => {
        this.loadedModules.set(moduleName, module);
        this.loadingPromises.delete(moduleName);
        console.log(`✅ 懒加载模块: ${moduleName}`);
        return module;
      })
      .catch(error => {
        this.loadingPromises.delete(moduleName);
        console.error(`❌ 加载模块失败: ${moduleName}`, error);
        throw error;
      });

    this.loadingPromises.set(moduleName, loadPromise);
    return loadPromise;
  }

  // 预加载非关键模块
  preloadModules(moduleMap) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        Object.entries(moduleMap).forEach(([name, path]) => {
          this.loadModule(path, name);
        });
      });
    } else {
      // 降级方案
      setTimeout(() => {
        Object.entries(moduleMap).forEach(([name, path]) => {
          this.loadModule(path, name);
        });
      }, 3000);
    }
  }
}

// 使用示例
export const lazyLoader = new LazyLoader();

// 路由级别的代码分割
export const routes = {
  home: () => lazyLoader.loadModule('./components/Home.js', 'Home'),
  settings: () => lazyLoader.loadModule('./components/Settings.js', 'Settings'),
  analytics: () => lazyLoader.loadModule('./components/Analytics.js', 'Analytics')
};

// 预加载配置
export const preloadConfig = {
  'ChartLibrary': './libs/charts.js',
  'DataGrid': './libs/data-grid.js',
  'RichEditor': './libs/rich-editor.js'
};
```

```javascript
// src/components/Router.js
import { lazyLoader, routes, preloadConfig } from '../utils/lazy-loading.js';

export class Router {
  constructor() {
    this.currentRoute = null;
    this.init();
  }

  init() {
    // 初始加载后预加载其他模块
    lazyLoader.preloadModules(preloadConfig);
    
    // 路由事件监听
    this.setupRouteListeners();
  }

  async navigateTo(routeName) {
    if (this.currentRoute === routeName) return;

    try {
      // 显示加载状态
      this.showLoading();
      
      // 动态加载路由组件
      const module = await routes[routeName]();
      
      // 渲染组件
      this.renderComponent(module.default);
      this.currentRoute = routeName;
      
      // 更新页面标题等
      this.updatePageMetadata(routeName);
      
    } catch (error) {
      console.error('路由导航失败:', error);
      this.showError('页面加载失败');
    } finally {
      this.hideLoading();
    }
  }

  showLoading() {
    // 显示加载指示器
    const loader = document.getElementById('page-loader');
    if (loader) loader.style.display = 'block';
  }

  hideLoading() {
    const loader = document.getElementById('page-loader');
    if (loader) loader.style.display = 'none';
  }

  renderComponent(Component) {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '';
      const component = new Component();
      if (typeof component.render === 'function') {
        app.appendChild(component.render());
      }
    }
  }

  setupRouteListeners() {
    // 链接点击事件委托
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (link) {
        e.preventDefault();
        const routeName = link.dataset.route;
        this.navigateTo(routeName);
      }
    });

    // 浏览器前进后退
    window.addEventListener('popstate', (e) => {
      const routeName = this.getRouteFromPath(window.location.pathname);
      this.navigateTo(routeName);
    });
  }
}
```

## 内存管理优化

### 内存泄漏检测与预防

实现系统化的内存泄漏检测和预防机制。

```javascript
// src/utils/memory-manager.js
export class MemoryManager {
  constructor() {
    this.monitoringInterval = null;
    this.leakThreshold = 10 * 1024 * 1024; // 10MB
    this.snapshots = [];
    this.eventListeners = new WeakMap();
  }

  startMonitoring(interval = 30000) {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(() => {
      this.takeMemorySnapshot();
      this.checkForLeaks();
    }, interval);

    console.log('🧠 内存监控已启动');
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🧠 内存监控已停止');
    }
  }

  takeMemorySnapshot() {
    if (performance.memory) {
      const snapshot = {
        timestamp: Date.now(),
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };

      this.snapshots.push(snapshot);
      
      // 保持最近50个快照
      if (this.snapshots.length > 50) {
        this.snapshots.shift();
      }

      return snapshot;
    }
    return null;
  }

  checkForLeaks() {
    if (this.snapshots.length < 2) return;

    const recent = this.snapshots[this.snapshots.length - 1];
    const previous = this.snapshots[this.snapshots.length - 2];

    const growth = recent.used - previous.used;
    
    if (growth > this.leakThreshold) {
      console.warn('⚠️ 检测到可能的内存泄漏:', {
        增长量: `${(growth / 1024 / 1024).toFixed(2)} MB`,
        当前使用: `${(recent.used / 1024 / 1024).toFixed(2)} MB`,
        时间间隔: `${(recent.timestamp - previous.timestamp) / 1000} 秒`
      });

      this.analyzePotentialLeaks();
    }
  }

  analyzePotentialLeaks() {
    // 检查常见的内存泄漏模式
    this.checkDetachedDOMNodes();
    this.checkEventListenerLeaks();
    this.checkTimerLeaks();
  }

  checkDetachedDOMNodes() {
    // 检查分离的DOM节点
    const detachedNodes = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      if (!document.body.contains(node)) {
        detachedNodes.push(node);
      }
    }

    if (detachedNodes.length > 0) {
      console.warn(`发现 ${detachedNodes.length} 个分离的DOM节点`);
    }
  }

  checkEventListenerLeaks() {
    // 简化的事件监听器泄漏检查
    const elements = document.querySelectorAll('*');
    let totalListeners = 0;

    elements.forEach(element => {
      // 这里可以扩展更详细的事件监听器检查
      if (element._events) {
        totalListeners += Object.keys(element._events).length;
      }
    });

    if (totalListeners > 1000) { // 阈值
      console.warn(`检测到大量事件监听器: ${totalListeners}`);
    }
  }

  checkTimerLeaks() {
    // 检查未清理的定时器
    const timerCount = this.getActiveTimersCount();
    if (timerCount > 50) {
      console.warn(`检测到大量活跃定时器: ${timerCount}`);
    }
  }

  getActiveTimersCount() {
    // 通过重写 setTimeout 和 setInterval 来跟踪
    return window._activeTimers ? window._activeTimers.size : 0;
  }

  // 安全的事件监听器包装
  safeAddEventListener(element, event, handler, options) {
    const wrappedHandler = (...args) => {
      try {
        return handler(...args);
      } catch (error) {
        console.error('事件处理器错误:', error);
      }
    };

    element.addEventListener(event, wrappedHandler, options);
    
    // 跟踪监听器以便后续清理
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, []);
    }
    this.eventListeners.get(element).push({ event, handler: wrappedHandler });
    
    return () => {
      element.removeEventListener(event, wrappedHandler, options);
      const listeners = this.eventListeners.get(element);
      if (listeners) {
        const index = listeners.findIndex(l => l.handler === wrappedHandler);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  // 清理所有跟踪的事件监听器
  cleanupEventListeners(element) {
    const listeners = this.eventListeners.get(element);
    if (listeners) {
      listeners.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this.eventListeners.delete(element);
    }
  }

  getMemoryStats() {
    if (performance.memory) {
      return {
        used: `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
        usage: `${((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(1)}%`
      };
    }
    return { error: '内存API不可用' };
  }
}

// 全局内存管理器实例
export const memoryManager = new MemoryManager();

// 启动内存监控（开发环境）
if (process.env.NODE_ENV === 'development') {
  memoryManager.startMonitoring();
}
```

### 资源生命周期管理

```javascript
// src/utils/resource-manager.js
export class ResourceManager {
  constructor() {
    this.resources = new Map();
    this.cache = new Map();
    this.cleanupCallbacks = new Map();
  }

  // 注册资源并自动管理生命周期
  registerResource(id, resource, cleanupCallback) {
    this.resources.set(id, resource);
    
    if (cleanupCallback) {
      this.cleanupCallbacks.set(id, cleanupCallback);
    }

    return id;
  }

  // 获取资源
  getResource(id) {
    return this.resources.get(id);
  }

  // 释放资源
  releaseResource(id) {
    const resource = this.resources.get(id);
    const cleanupCallback = this.cleanupCallbacks.get(id);

    if (cleanupCallback && resource) {
      cleanupCallback(resource);
    }

    this.resources.delete(id);
    this.cleanupCallbacks.delete(id);
    
    console.log(`🗑️ 释放资源: ${id}`);
  }

  // 批量释放资源
  releaseResources(ids) {
    ids.forEach(id => this.releaseResource(id));
  }

  // 释放所有资源
  releaseAll() {
    const resourceIds = Array.from(this.resources.keys());
    resourceIds.forEach(id => this.releaseResource(id));
    
    console.log(`🗑️ 释放所有资源: ${resourceIds.length} 个`);
  }

  // 缓存管理
  setCache(key, value, ttl = 300000) { // 默认5分钟
    const cacheItem = {
      value,
      timestamp: Date.now(),
      ttl
    };
    
    this.cache.set(key, cacheItem);
    return value;
  }

  getCache(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clearExpiredCache() {
    const now = Date.now();
    let clearedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        clearedCount++;
      }
    }
    
    if (clearedCount > 0) {
      console.log(`🧹 清理过期缓存: ${clearedCount} 项`);
    }
  }

  // 图片资源懒加载
  createLazyImageLoader() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        }
      });
    });

    return observer;
  }

  // 预加载关键资源
  preloadCriticalResources() {
    const criticalResources = [
      '/fonts/main.woff2',
      '/css/critical.css',
      '/images/logo.svg'
    ];

    criticalResources.forEach(resource => {
      this.preloadResource(resource);
    });
  }

  preloadResource(url) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    
    if (url.endsWith('.woff2')) {
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
    } else if (url.endsWith('.css')) {
      link.as = 'style';
    } else if (url.endsWith('.js')) {
      link.as = 'script';
    } else {
      link.as = 'image';
    }
    
    document.head.appendChild(link);
  }
}

export const resourceManager = new ResourceManager();

// 自动清理过期缓存
setInterval(() => {
  resourceManager.clearExpiredCache();
}, 60000); // 每分钟清理一次
```

## 渲染性能优化

### 虚拟滚动与列表优化

```javascript
// src/components/VirtualScroll.js
export class VirtualScroll {
  constructor(container, options = {}) {
    this.container = container;
    this.itemHeight = options.itemHeight || 50;
    this.overscan = options.overscan || 5;
    this.items = options.items || [];
    this.renderItem = options.renderItem;
    
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.visibleItems = [];
    
    this.init();
  }

  init() {
    this.setupContainer();
    this.calculateVisibleRange();
    this.renderVisibleItems();
    this.setupScrollListener();
  }

  setupContainer() {
    this.container.style.overflowY = 'auto';
    this.container.style.position = 'relative';
    
    // 设置容器高度以启用滚动
    this.container.style.height = `${this.container.clientHeight}px`;
    
    // 创建内容包装器
    this.content = document.createElement('div');
    this.content.style.position = 'relative';
    this.content.style.height = `${this.items.length * this.itemHeight}px`;
    this.container.appendChild(this.content);
  }

  calculateVisibleRange() {
    const scrollTop = this.container.scrollTop;
    const visibleHeight = this.container.clientHeight;
    
    this.visibleStart = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.overscan);
    this.visibleEnd = Math.min(
      this.items.length,
      Math.ceil((scrollTop + visibleHeight) / this.itemHeight) + this.overscan
    );
  }

  renderVisibleItems() {
    // 移除不可见的项目
    this.visibleItems.forEach(item => {
      if (item.index < this.visibleStart || item.index >= this.visibleEnd) {
        item.element.remove();
      }
    });

    // 更新可见项目数组
    this.visibleItems = this.visibleItems.filter(item => 
      item.index >= this.visibleStart && item.index < this.visibleEnd
    );

    // 添加新可见的项目
    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      const existingItem = this.visibleItems.find(item => item.index === i);
      
      if (!existingItem) {
        const itemElement = this.renderItem(this.items[i], i);
        itemElement.style.position = 'absolute';
        itemElement.style.top = `${i * this.itemHeight}px`;
        itemElement.style.width = '100%';
        itemElement.style.height = `${this.itemHeight}px`;
        
        this.content.appendChild(itemElement);
        this.visibleItems.push({ index: i, element: itemElement });
      }
    }
  }

  setupScrollListener() {
    let scrollTimeout;
    
    this.container.addEventListener('scroll', () => {
      // 防抖处理
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.calculateVisibleRange();
        this.renderVisibleItems();
      }, 16); // 约60fps
    });
  }

  updateItems(newItems) {
    this.items = newItems;
    this.content.style.height = `${this.items.length * this.itemHeight}px`;
    this.calculateVisibleRange();
    this.renderVisibleItems();
  }

  // 性能监控
  getPerformanceStats() {
    return {
      totalItems: this.items.length,
      visibleItems: this.visibleItems.length,
      renderStart: this.visibleStart,
      renderEnd: this.visibleEnd,
      memoryUsage: performance.memory ? {
        used: `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`
      } : null
    };
  }
}

// 使用示例
export function createOptimizedList(containerId, data, renderFunction) {
  const container = document.getElementById(containerId);
  
  const virtualScroll = new VirtualScroll(container, {
    itemHeight: 60,
    overscan: 10,
    items: data,
    renderItem: renderFunction
  });

  return virtualScroll;
}
```

### 动画与渲染优化

```javascript
// src/utils/animation-optimizer.js
export class AnimationOptimizer {
  constructor() {
    this.animations = new Map();
    this.rafCallbacks = new Map();
  }

  // 使用 requestAnimationFrame 优化动画
  optimizedAnimation(callback, element = null) {
    let animationId;
    
    const animate = (timestamp) => {
      callback(timestamp);
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    // 跟踪动画以便后续清理
    if (element) {
      if (!this.animations.has(element)) {
        this.animations.set(element, []);
      }
      this.animations.get(element).push(animationId);
    }
    
    return animationId;
  }

  // 停止元素的所有动画
  stopAnimations(element) {
    const animations = this.animations.get(element);
    if (animations) {
      animations.forEach(id => cancelAnimationFrame(id));
      this.animations.delete(element);
    }
  }

  // 使用 CSS transform 代替直接修改位置
  transformElement(element, translateX = 0, translateY = 0, scale = 1) {
    element.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
  }

  // 批量DOM操作
  batchDOMUpdates(callback) {
    // 使用 requestAnimationFrame 批量更新
    requestAnimationFrame(() => {
      callback();
    });
  }

  // 防抖滚动处理
  createDebouncedScrollHandler(callback, delay = 16) {
    let timeoutId;
    
    return (event) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        callback(event);
      }, delay);
    };
  }

  // 使用 will-change 提示浏览器优化
  optimizeForAnimation(element, properties = ['transform', 'opacity']) {
    element.style.willChange = properties.join(', ');
    
    // 动画完成后移除 will-change
    return () => {
      element.style.willChange = 'auto';
    };
  }

  // 检测帧率
  startFPSCounter(callback, duration = 1000) {
    let frames = 0;
    let startTime = performance.now();
    
    const countFrame = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime - startTime >= duration) {
        const fps = Math.round((frames * 1000) / (currentTime - startTime));
        callback(fps);
        frames = 0;
        startTime = currentTime;
      }
      
      requestAnimationFrame(countFrame);
    };
    
    countFrame();
  }
}

export const animationOptimizer = new AnimationOptimizer();

// 使用示例
export function createSmoothScroll(container) {
  let targetScroll = container.scrollTop;
  let currentScroll = targetScroll;
  
  const scrollHandler = animationOptimizer.optimizedAnimation(() => {
    const diff = targetScroll - currentScroll;
    
    if (Math.abs(diff) < 1) {
      currentScroll = targetScroll;
    } else {
      currentScroll += diff * 0.1; // 缓动效果
    }
    
    container.scrollTop = currentScroll;
  }, container);
  
  return {
    scrollTo: (position) => {
      targetScroll = position;
    },
    destroy: () => {
      animationOptimizer.stopAnimations(container);
    }
  };
}
```

## IPC 通信优化

### 高效的进程间通信

```javascript
// src/utils/ipc-optimizer.js
export class IPCOptimizer {
  constructor() {
    this.pendingRequests = new Map();
    this.batchQueue = new Map();
    this.batchTimeout = 16; // 16ms 批处理间隔
    this.cache = new Map();
  }

  // 批处理 IPC 调用
  batchedInvoke(channel, data, options = {}) {
    const cacheKey = options.cacheKey || this.generateCacheKey(channel, data);
    
    // 检查缓存
    if (options.cache && this.cache.has(cacheKey)) {
      return Promise.resolve(this.cache.get(cacheKey));
    }
    
    // 添加到批处理队列
    if (!this.batchQueue.has(channel)) {
      this.batchQueue.set(channel, []);
      
      // 设置批处理超时
      setTimeout(() => {
        this.processBatch(channel);
      }, this.batchTimeout);
    }
    
    return new Promise((resolve, reject) => {
      this.batchQueue.get(channel).push({ data, resolve, reject, cacheKey });
    });
  }

  processBatch(channel) {
    const batch = this.batchQueue.get(channel);
    if (!batch || batch.length === 0) return;
    
    this.batchQueue.delete(channel);
    
    const batchData = batch.map(item => item.data);
    
    // 发送批处理请求
    window.electronAPI.invokeBatch(channel, batchData)
      .then(results => {
        batch.forEach((item, index) => {
          const result = results[index];
          
          // 缓存结果
          if (item.cacheKey) {
            this.cache.set(item.cacheKey, result);
          }
          
          item.resolve(result);
        });
      })
      .catch(error => {
        batch.forEach(item => {
          item.reject(error);
        });
      });
  }

  // 生成缓存键
  generateCacheKey(channel, data) {
    return `${channel}:${JSON.stringify(data)}`;
  }

  // 清理缓存
  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // 带超时的 IPC 调用
  invokeWithTimeout(channel, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`IPC调用超时: ${channel}`));
      }, timeout);
      
      window.electronAPI.invoke(channel, data)
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  // 监控 IPC 性能
  monitorIPCPerformance() {
    const originalInvoke = window.electronAPI.invoke;
    
    window.electronAPI.invoke = async (channel, data) => {
      const startTime = performance.now();
      
      try {
        const result = await originalInvoke(channel, data);
        const duration = performance.now() - startTime;
        
        // 记录性能数据
        this.logIPCPerformance(channel, duration, true);
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.logIPCPerformance(channel, duration, false);
        throw error;
      }
    };
  }

  logIPCPerformance(channel, duration, success) {
    if (duration > 100) { // 记录超过100ms的调用
      console.warn(`⚠️ 慢IPC调用: ${channel}`, {
        耗时: `${duration.toFixed(2)}ms`,
        状态: success ? '成功' : '失败'
      });
    }
  }
}

export const ipcOptimizer = new IPCOptimizer();

// 在主进程中实现批处理处理器
export function setupBatchHandler(ipcMain) {
  ipcMain.handle('invoke-batch', async (event, channel, batchData) => {
    const results = [];
    
    for (const data of batchData) {
      try {
        // 这里需要根据实际IPC处理器来执行
        const result = await processIPCBatch(channel, data);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  });
}

async function processIPCBatch(channel, data) {
  // 根据通道名称执行相应的处理逻辑
  // 这里需要根据实际应用实现
  switch (channel) {
    case 'get-file-info':
      return await getFileInfoBatch(data);
    case 'query-data':
      return await queryDataBatch(data);
    default:
      throw new Error(`未知的批处理通道: ${channel}`);
  }
}
```

## 构建与打包优化

### 生产环境构建优化

```javascript
// webpack.config.js - Electron 生产构建配置
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import webpack from 'webpack';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  mode: 'production',
  target: 'electron-renderer',
  
  entry: {
    main: './src/renderer/index.js',
    preload: './src/preload/index.js'
  },
  
  output: {
    path: resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    clean: true
  },
  
  optimization: {
    minimize: true,
    minimizer: [
      // 使用 Terser 进行代码压缩
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: {
            drop_console: true, // 生产环境移除 console
            drop_debugger: true
          },
          mangle: {
            safari10: true
          }
        }
      })
    ],
    
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5
        }
      }
    },
    
    runtimeChunk: {
      name: 'runtime'
    }
  },
  
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { 
                targets: { 
                  electron: '22.0.0' 
                },
                useBuiltIns: 'usage',
                corejs: 3
              }]
            ],
            plugins: [
              '@babel/plugin-syntax-dynamic-import',
              'lodash' // 优化 lodash 引入
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: false,
              sourceMap: false
            }
          }
        ]
      }
    ]
  },
  
  plugins: [
    // 定义环境变量
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.ELECTRON_IS_DEV': JSON.stringify(false)
    }),
    
    // 压缩 CSS
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[name].[contenthash].chunk.css'
    }),
    
    // 分析包大小
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-report.html'
    })
  ],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'components': resolve(__dirname, 'src/components')
    },
    extensions: ['.js', '.json']
  },
  
  // 排除 Electron 和 Node.js 内置模块
  externals: {
    electron: 'commonjs electron',
    fs: 'commonjs fs',
    path: 'commonjs path',
    os: 'commonjs os'
  }
};
```

### 资源压缩与优化

```javascript
// scripts/optimize-assets.js
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export class AssetOptimizer {
  constructor() {
    this.imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
    this.optimizedCount = 0;
  }

  async optimizeImages(sourceDir, targetDir) {
    try {
      const files = await fs.readdir(sourceDir);
      
      for (const file of files) {
        const filePath = path.join(sourceDir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
          await this.optimizeImages(filePath, path.join(targetDir, file));
        } else if (this.isImageFile(file)) {
          await this.optimizeSingleImage(filePath, path.join(targetDir, file));
          this.optimizedCount++;
        }
      }
      
      console.log(`✅ 优化完成: ${this.optimizedCount} 个图片文件`);
    } catch (error) {
      console.error('❌ 资源优化失败:', error);
    }
  }

  isImageFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return this.imageExtensions.includes(ext);
  }

  async optimizeSingleImage(sourcePath, targetPath) {
    const ext = path.extname(sourcePath).toLowerCase();
    
    // 确保目标目录存在
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    
    try {
      switch (ext) {
        case '.png':
          // 使用 pngquant 优化 PNG
          await execAsync(`pngquant --quality=65-80 --force --output "${targetPath}" "${sourcePath}"`);
          break;
          
        case '.jpg':
        case '.jpeg':
          // 使用 mozjpeg 优化 JPEG
          await execAsync(`cjpeg -quality 80 -optimize -outfile "${targetPath}" "${sourcePath}"`);
          break;
          
        case '.svg':
          // 使用 svgo 优化 SVG
          await execAsync(`svgo "${sourcePath}" -o "${targetPath}"`);
          break;
          
        default:
          // 直接复制不支持优化的文件
          await fs.copyFile(sourcePath, targetPath);
      }
    } catch (error) {
      // 如果优化工具不可用，直接复制文件
      console.warn(`⚠️ 优化失败，直接复制: ${sourcePath}`);
      await fs.copyFile(sourcePath, targetPath);
    }
  }

  async createOptimizedBuild() {
    const buildStartTime = Date.now();
    
    console.log('🚀 开始优化构建...');
    
    // 优化图片资源
    await this.optimizeImages('src/assets', 'dist/assets');
    
    // 复制其他资源
    await this.copyOtherAssets('src/static', 'dist/static');
    
    const buildTime = Date.now() - buildStartTime;
    console.log(`🎉 构建完成，耗时: ${buildTime}ms`);
  }

  async copyOtherAssets(sourceDir, targetDir) {
    try {
      await fs.mkdir(targetDir, { recursive: true });
      
      const files = await fs.readdir(sourceDir);
      
      for (const file of files) {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);
        const stat = await fs.stat(sourcePath);
        
        if (stat.isDirectory()) {
          await this.copyOtherAssets(sourcePath, targetPath);
        } else if (!this.isImageFile(file)) {
          await fs.copyFile(sourcePath, targetPath);
        }
      }
    } catch (error) {
      console.error('复制资源失败:', error);
    }
  }
}

// 执行优化
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new AssetOptimizer();
  optimizer.createOptimizedBuild();
}
```

## 监控与持续优化

### 性能监控系统

```javascript
// src/utils/performance-monitor.js
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.reports = [];
    this.monitoringEnabled = true;
  }

  startMonitoring() {
    this.recordNavigationTiming();
    this.recordResourceTiming();
    this.recordPaintTiming();
    this.startLongTaskMonitoring();
  }

  recordNavigationTiming() {
    if (!performance.getEntriesByType) return;

    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      this.metrics.set('navigation', {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnect: navigation.connectEnd - navigation.connectStart,
        requestResponse: navigation.responseEnd - navigation.requestStart
      });
    }
  }

  recordResourceTiming() {
    if (!performance.getEntriesByType) return;

    const resources = performance.getEntriesByType('resource');
    const resourceMetrics = resources.map(resource => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize || 0,
      type: this.getResourceType(resource.name)
    }));

    this.metrics.set('resources', resourceMetrics);
  }

  recordPaintTiming() {
    if (!performance.getEntriesByType) return;

    const paints = performance.getEntriesByType('paint');
    paints.forEach(paint => {
      this.metrics.set(paint.name, paint.startTime);
    });
  }

  startLongTaskMonitoring() {
    if (!PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.duration > 50) { // 超过50ms的任务
          console.warn('⏱️ 长任务检测:', {
            时长: `${entry.duration.toFixed(2)}ms`,
            开始时间: entry.startTime
          });
        }
      });
    });

    observer.observe({ entryTypes: ['longtask'] });
  }

  getResourceType(url) {
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.js')) return 'script';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null,
      metrics: Object.fromEntries(this.metrics),
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null
    };

    this.reports.push(report);
    return report;
  }

  // 获取性能评分
  getPerformanceScore() {
    const navigation = this.metrics.get('navigation');
    if (!navigation) return null;

    let score = 100;
    
    // 基于加载时间的扣分
    if (navigation.domContentLoaded > 3000) score -= 20;
    else if (navigation.domContentLoaded > 2000) score -= 10;
    
    if (navigation.loadComplete > 5000) score -= 20;
    else if (navigation.loadComplete > 3000) score -= 10;
    
    // 基于资源数量的扣分
    const resources = this.metrics.get('resources') || [];
    if (resources.length > 50) score -= 10;
    else if (resources.length > 30) score -= 5;
    
    return Math.max(0, score);
  }

  // 发送性能报告（可选）
  async sendPerformanceReport() {
    const report = this.generatePerformanceReport();
    
    try {
      // 在实际应用中，这里可以发送到性能监控服务
      if (window.electronAPI) {
        await window.electronAPI.sendPerformanceReport(report);
      }
      
      console.log('📊 性能报告已生成:', {
        评分: this.getPerformanceScore(),
        加载时间: report.metrics.navigation?.loadComplete
      });
    } catch (error) {
      console.error('发送性能报告失败:', error);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// 自动开始监控
document.addEventListener('DOMContentLoaded', () => {
  performanceMonitor.startMonitoring();
  
  // 页面加载完成后发送初始报告
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.sendPerformanceReport();
    }, 1000);
  });
});
```