# JavaScript 性能优化

## JavaScript 性能基础 {#javascript-performance-basics}

JavaScript 性能优化关注执行效率、内存管理和运行时特性。现代 JavaScript 引擎采用即时编译、内联缓存和隐藏类优化等技术，但代码编写方式仍显著影响最终性能。优化核心是减少主线程阻塞，避免长任务导致的界面冻结。

特点：JavaScript 优化需要在开发效率和运行时性能间平衡。微优化在特定场景有效，但架构级优化通常收益更大。理解 V8 引擎工作机制是高效优化的前提。

示意图：
JavaScript 执行流程：
解析 → 字节码生成 → 解释执行 → 热点识别 → 优化编译 → 反优化
性能陷阱：类型变化 → 隐藏类失效 | 大对象分配 → 垃圾回收压力 | 同步操作 → 主线程阻塞

## 代码分割与懒加载 {#code-splitting-lazy-loading}

代码分割将应用拆分为按需加载的块，减少初始包体积。动态 import() 实现路由级和组件级分割，Webpack SplitChunksPlugin 提取公共依赖。懒加载延迟非关键资源加载时机，提升首屏性能。

特点：分割粒度影响加载性能和缓存效率。过细分割增加请求开销，过粗分割失去按需加载优势。预加载关键包，预获取可能使用的包。

```javascript
// 路由级代码分割
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));

// 组件级懒加载
const HeavyComponent = lazy(() => 
  import('./components/HeavyComponent').then(module => ({
    default: module.HeavyComponent
  }))
);

// 预加载策略
const preloadMap = {
  '/about': () => import('./pages/About'),
  '/contact': () => import('./pages/Contact')
};

// 鼠标悬停时预加载
function onLinkHover(route) {
  if (preloadMap[route] && !preloaded[route]) {
    preloadMap[route]();
    preloaded[route] = true;
  }
}
```

## 长任务分割与调度 {#long-task-splitting-scheduling}

长任务 (超过 50ms 的连续执行) 阻塞主线程，导致界面无响应。通过任务分解、异步执行和空闲期调度，将长任务拆分为可中断的短任务。requestIdleCallback 在浏览器空闲期执行低优先级任务，requestAnimationFrame 确保动画流畅。

特点：任务分割需要考虑任务原子性和状态一致性。调度策略应基于任务优先级和用户交互状态。

```javascript
// 使用requestIdleCallback分割任务
function processLargeData(data, callback) {
  const chunkSize = 1000;
  let index = 0;
  
  function processChunk(deadline) {
    while (index < data.length && deadline.timeRemaining() > 0) {
      // 处理数据块
      processItem(data[index]);
      index++;
    }
    
    if (index < data.length) {
      // 继续在下一个空闲期处理
      requestIdleCallback(processChunk);
    } else {
      // 全部完成
      callback?.();
    }
  }
  
  requestIdleCallback(processChunk);
}

// 使用requestAnimationFrame优化动画计算
function smoothAnimation() {
  let startTime = null;
  
  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;
    
    // 计算下一帧状态（保持轻量）
    const newPosition = calculatePosition(progress);
    updateElementPosition(newPosition);
    
    if (progress < 1000) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}

// 任务优先级调度
class TaskScheduler {
  constructor() {
    this.highPriorityTasks = [];
    this.lowPriorityTasks = [];
    this.isProcessing = false;
  }
  
  addTask(task, priority = 'low') {
    const queue = priority === 'high' ? 
      this.highPriorityTasks : this.lowPriorityTasks;
    queue.push(task);
    this.scheduleProcessing();
  }
  
  scheduleProcessing() {
    if (this.isProcessing) return;
    
    if (this.highPriorityTasks.length > 0) {
      this.processHighPriority();
    } else if (this.lowPriorityTasks.length > 0) {
      this.processLowPriority();
    }
  }
  
  processHighPriority() {
    this.isProcessing = true;
    const task = this.highPriorityTasks.shift();
    
    // 同步执行高优先级任务
    task();
    
    if (this.highPriorityTasks.length > 0) {
      // 继续处理下一个高优先级任务
      setTimeout(() => this.processHighPriority(), 0);
    } else {
      this.isProcessing = false;
      this.scheduleProcessing();
    }
  }
  
  processLowPriority() {
    this.isProcessing = true;
    
    requestIdleCallback((deadline) => {
      while (this.lowPriorityTasks.length > 0 && deadline.timeRemaining() > 0) {
        const task = this.lowPriorityTasks.shift();
        task();
      }
      
      this.isProcessing = false;
      if (this.lowPriorityTasks.length > 0 || this.highPriorityTasks.length > 0) {
        this.scheduleProcessing();
      }
    });
  }
}
```

## 内存管理与垃圾回收 {#memory-management-garbage-collection}

JavaScript 内存管理基于自动垃圾回收，但不当引用仍导致内存泄漏。优化策略包括及时释放引用、避免全局变量、使用对象池复用对象。WeakMap 和 WeakSet 不阻止垃圾回收，适合缓存场景。

特点：内存优化重点是识别和防止泄漏，而非微观管理。性能分析工具监控内存使用模式，发现异常增长。

```javascript
// 对象池实现
class ObjectPool {
  constructor(createFn, resetFn = (obj) => obj) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.freeList = [];
    this.count = 0;
  }
  
  acquire() {
    if (this.freeList.length > 0) {
      return this.freeList.pop();
    }
    this.count++;
    return this.createFn();
  }
  
  release(obj) {
    this.resetFn(obj);
    this.freeList.push(obj);
  }
  
  // 使用示例：向量对象池
  static vectorPool = new ObjectPool(
    () => ({ x: 0, y: 0 }),
    (vec) => { vec.x = 0; vec.y = 0; }
  );
}

// 避免内存泄漏的模式
function createEventListener(element) {
  const handler = () => { /* 处理逻辑 */ };
  element.addEventListener('click', handler);
  
  // 提供清理方法
  return () => {
    element.removeEventListener('click', handler);
  };
}

// 使用WeakMap做缓存（不阻止垃圾回收）
const weakCache = new WeakMap();
function getExpensiveValue(object) {
  if (!weakCache.has(object)) {
    const value = computeExpensiveValue(object);
    weakCache.set(object, value);
  }
  return weakCache.get(object);
}
```

## 函数优化与执行效率 {#function-optimization-execution-efficiency}

函数级别优化包括减少重复计算、优化热路径和使用高效算法。记忆化缓存计算结果，内联小函数减少调用开销，避免在热循环中创建对象。

特点：函数优化应基于性能分析数据，避免过早优化。关注算法复杂度，但实际性能受常数因子和硬件特性影响。

```javascript
// 记忆化优化
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// 防抖与节流优化频繁调用
function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 热路径优化：减少函数调用和对象创建
function optimizedHotPath(data) {
  // 预先计算长度避免重复访问
  const len = data.length;
  let result = 0;
  
  // 使用局部变量缓存频繁访问的属性
  const { property } = data;
  
  for (let i = 0; i < len; i++) {
    // 内联简单计算，避免函数调用开销
    result += property[i] * property[i];
  }
  
  return result;
}
```

## DOM 操作优化 {#dom-manipulation-optimization}

DOM 操作是 JavaScript 性能主要瓶颈。优化策略包括批量更新、减少重排重绘、使用文档碎片和事件委托。虚拟 DOM 库通过差异比对最小化实际 DOM 操作。

特点：DOM 访问比 JavaScript 执行慢几个数量级。读写分离减少布局抖动，离线操作避免中间渲染。

```javascript
// 批量DOM更新
function batchDOMUpdates(elements, updates) {
  // 触发批量更新前
  const fragment = document.createDocumentFragment();
  
  updates.forEach(update => {
    const element = document.createElement(update.tag);
    element.textContent = update.content;
    fragment.appendChild(element);
  });
  
  // 单次插入到DOM
  container.appendChild(fragment);
}

// 减少重排重绘
function efficientStyleChanges(element) {
  // 触发一次重排
  element.style.display = 'none';
  
  // 批量修改样式（不会触发重排）
  element.style.width = '100px';
  element.style.height = '200px';
  element.style.padding = '10px';
  
  // 触发一次重排
  element.style.display = 'block';
}

// 使用requestAnimationFrame集合DOM更新
let scheduledUpdate = false;
const pendingUpdates = new Set();

function scheduleUpdate(callback) {
  pendingUpdates.add(callback);
  
  if (!scheduledUpdate) {
    scheduledUpdate = true;
    requestAnimationFrame(() => {
      scheduledUpdate = false;
      const updates = Array.from(pendingUpdates);
      pendingUpdates.clear();
      
      updates.forEach(update => update());
    });
  }
}

// 事件委托优化
document.getElementById('list').addEventListener('click', function(event) {
  if (event.target.tagName === 'LI') {
    // 处理列表项点击，无需为每个li绑定监听器
    handleItemClick(event.target);
  }
});
```

## 异步操作优化 {#async-operations-optimization}

异步代码优化关注 Promise 性能、异步函数开销和并发控制。避免 Promise 构造函数重复执行同步代码，优化 async/await 使用模式，限制并发请求数量。

特点：异步操作优化减少微任务队列压力，避免内存泄漏。错误处理不影响性能关键路径。

```javascript
// Promise优化模式
class PromiseOptimizer {
  // 缓存Promise结果
  static cache = new Map();
  
  static cachedAsyncOperation(key, operation) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const promise = operation().finally(() => {
      // 可选的缓存过期策略
      setTimeout(() => this.cache.delete(key), 30000);
    });
    
    this.cache.set(key, promise);
    return promise;
  }
  
  // 并发控制
  static async limitedConcurrency(tasks, limit) {
    const results = [];
    const executing = new Set();
    
    for (const task of tasks) {
      if (executing.size >= limit) {
        await Promise.race(executing);
      }
      
      const promise = task().finally(() => {
        executing.delete(promise);
      });
      
      executing.add(promise);
      results.push(promise);
    }
    
    return Promise.all(results);
  }
}

// 优化的async/await模式
async function optimizedAsyncFlow() {
  // 并行发起不依赖的请求
  const [user, settings] = await Promise.all([
    fetchUser(),
    fetchSettings()
  ]);
  
  // 避免不必要的await
  const validationPromise = validateUser(user);
  const processingPromise = processSettings(settings);
  
  // 需要结果时再await
  const [isValid, processedSettings] = await Promise.all([
    validationPromise,
    processingPromise
  ]);
  
  return { user: isValid ? user : null, settings: processedSettings };
}
```

## 模块与打包优化 {#module-bundling-optimization}

模块系统优化关注 Tree Shaking 效果、循环引用处理和动态导入开销。使用 ES 模块确保静态分析，避免运行时动态导入影响关键路径。

特点：模块结构影响打包工具优化能力。深层嵌套导入增加解析开销，Barrel 文件 (索引文件) 可能阻碍 Tree Shaking。

```javascript
// 优化模块结构
// 避免：
// export * from './utils'; // 阻碍Tree Shaking

// 推荐：明确导出
export { formatDate } from './dateUtils';
export { debounce } from './functionUtils';
export { storage } from './storageUtils';

// 动态导入优化
const getHeavyModule = () => {
  let modulePromise = null;
  
  return () => {
    if (!modulePromise) {
      // 预加载但不阻塞
      modulePromise = import('./heavyModule.js')
        .then(module => module.default)
        .catch(error => {
          modulePromise = null; // 失败时重置
          throw error;
        });
    }
    return modulePromise;
  };
};

// 使用Intersection Observer触发动态加载
const lazyLoadModule = (element, modulePath, callback) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        import(modulePath).then(module => {
          callback(module.default);
        });
        observer.unobserve(entry.target);
      }
    });
  });
  
  observer.observe(element);
};
```

## 性能监控与检测 {#performance-monitoring-detection}

运行时性能监控识别实际性能瓶颈。Performance API 测量具体操作耗时，Long Tasks API 检测阻塞任务，Memory API 监控内存使用。

特点：性能监控应同时关注实验室数据和真实用户数据。监控代码本身需要优化，避免影响测量结果。

```javascript
// 性能测量工具
class PerformanceMonitor {
  static measurements = new Map();
  
  static startMeasure(name) {
    this.measurements.set(name, {
      startTime: performance.now(),
      startMemory: performance.memory?.usedJSHeapSize
    });
  }
  
  static endMeasure(name) {
    const measurement = this.measurements.get(name);
    if (!measurement) return null;
    
    const duration = performance.now() - measurement.startTime;
    const memoryUsed = performance.memory ? 
      performance.memory.usedJSHeapSize - measurement.startMemory : 0;
    
    this.measurements.delete(name);
    
    return { duration, memoryUsed };
  }
  
  // 自动测量函数执行
  static measureFunction(fn, context = null) {
    return function(...args) {
      this.startMeasure(fn.name);
      try {
        return fn.apply(context, args);
      } finally {
        const result = this.endMeasure(fn.name);
        if (result && result.duration > 100) {
          console.warn(`Slow function ${fn.name}: ${result.duration}ms`);
        }
      }
    }.bind(this);
  }
}

// 长任务监控
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.duration > 50) {
        console.warn('Long task detected:', entry);
        // 上报到监控系统
      }
    });
  });
  
  observer.observe({ entryTypes: ['longtask'] });
}

// 内存监控
function monitorMemory() {
  if (performance.memory) {
    const memory = performance.memory;
    const used = memory.usedJSHeapSize;
    const limit = memory.jsHeapSizeLimit;
    
    if (used / limit > 0.9) {
      console.warn('High memory usage detected');
    }
  }
}

setInterval(monitorMemory, 30000);
```