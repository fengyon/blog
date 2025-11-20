# 渲染性能优化

## 渲染基础概念 {#rendering-fundamentals}

浏览器渲染是将 HTML、CSS 和 JavaScript 转换为用户可见像素的复杂过程。现代浏览器采用多阶段渲染流水线：解析、样式计算、布局、绘制和合成。理解这些阶段是优化渲染性能的基础。

特点：渲染性能优化关注**减少计算量**和**避免重复工作**。优化策略需要针对不同渲染阶段的特点，平衡视觉质量和执行效率。

示意图：
渲染流水线：
HTML 解析 → DOM 构建 → CSS 解析 → 样式计算 → 布局 → 绘制 → 合成
性能瓶颈：
重排 (Layout) > 重绘 (Paint) > 合成 (Composite)
优化目标：减少重排 → 减少重绘 → 提升合成效率

## 关键渲染路径优化 {#critical-rendering-path}

关键渲染路径是从接收 HTML 到首次渲染的时间线。优化核心是**优先显示关键内容**，通过资源优先级控制、CSS 和 JavaScript 优化，最小化首屏渲染时间。

特点：关键路径优化强调**资源加载顺序**和**执行时机**。阻塞渲染的资源应内联或异步加载，非关键内容延迟处理。

示意图：
关键路径时间线：
HTML 下载 → DOM 构建 → CSSOM 构建 → JavaScript 执行 → 渲染树 → 布局 → 绘制
优化策略：
CSS 内联关键样式 + 异步加载非关键 CSS
JavaScript 使用 async/defer 避免阻塞
图片懒加载 + 字体加载优化

## 布局与重排优化 {#layout-and-reflow}

布局 (重排) 是计算元素几何信息的过程，代价昂贵。触发条件包括：尺寸变化、位置变化、内容变化和窗口调整。优化策略包括批量读写、使用 transform 替代位置调整、避免强制同步布局。

特点：布局优化核心是**读写分离**和**样式计算最小化**。现代浏览器通过队列机制批量处理样式变更，但强制同步布局会破坏这种优化。

```javascript
// 避免强制同步布局
function efficientLayoutUpdates() {
  // 不良模式：读写交替导致强制布局
  for (let i = 0; i < items.length; i++) {
    // 读取（触发布局）
    const height = items[i].offsetHeight;
    // 写入（再次触发布局）
    items[i].style.height = height + 10 + 'px';
  }
  
  // 优化模式：批量读写
  const heights = [];
  // 批量读取
  for (let i = 0; i < items.length; i++) {
    heights.push(items[i].offsetHeight);
  }
  // 批量写入
  for (let i = 0; i < items.length; i++) {
    items[i].style.height = heights[i] + 10 + 'px';
  }
}

// 使用FastDOM模式
class FastDOM {
  static reads = [];
  static writes = [];
  
  static scheduleRead(fn) {
    this.reads.push(fn);
    this.scheduleFlush();
  }
  
  static scheduleWrite(fn) {
    this.writes.push(fn);
    this.scheduleFlush();
  }
  
  static scheduleFlush() {
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => {
        // 先执行所有读取
        this.reads.forEach(fn => fn());
        this.reads.length = 0;
        
        // 再执行所有写入
        this.writes.forEach(fn => fn());
        this.writes.length = 0;
        
        this.scheduled = false;
      });
    }
  }
}
```

## 绘制与重绘优化 {#paint-and-repaint}

绘制是将布局信息转换为像素的过程，重绘是更新元素视觉属性 (颜色、背景等)。优化策略包括减少绘制区域、使用 CSS 硬件加速、避免昂贵属性和使用 will-change 提示。

特点：绘制优化关注**绘制复杂度**和**区域大小**。使用 Chrome DevTools 的 Paint Flashing 可以识别重绘区域，针对性优化。

示意图：
绘制性能影响因素：
绘制区域大小 ← 样式复杂度 ← 浏览器优化能力
优化技术：
减少 DOM 数量 + 使用 opacity/transform + 图层提升 + 避免 box-shadow 过度使用

```javascript
// 绘制优化实践
function optimizePainting() {
  // 使用transform和opacity触发合成层
  // 这些属性不会触发重绘
  element.style.transform = 'translateX(100px)';
  element.style.opacity = '0.5';
  
  // 避免在动画中修改布局属性
  // 不良：触发重排和重绘
  // element.style.width = '200px';
  
  // 使用will-change预提示浏览器
  element.style.willChange = 'transform';
  
  // 动画结束后移除will-change
  element.addEventListener('transitionend', () => {
    element.style.willChange = 'auto';
  });
}

// 减少绘制区域技术
function reducePaintAreas() {
  // 使用clip-path限制绘制区域
  element.style.clipPath = 'circle(50% at 50% 50%)';
  
  // 对于固定位置元素，使用contain属性
  element.style.contain = 'layout paint style';
}
```

## 合成层优化 {#composite-layer}

合成是将多个图层组合为最终画面的过程。通过创建独立合成层，可以避免不必要的重绘和重排。优化策略包括合理使用 transform、opacity、will-change 和合理管理图层数量。

特点：合成层优化平衡**性能收益**和**内存开销**。过多的合成层会增加内存使用和管理成本，需要针对性创建。

示意图：
合成层创建条件：
transform3d/opacity/will-change/filter/video/canvas
图层树：根图层 → 子图层 → 孙子图层
合成过程：图层光栅化 → 图层组合 → 屏幕显示

```javascript
// 合成层管理
class LayerManager {
  constructor() {
    this.activeLayers = new Set();
  }
  
  // 创建合成层用于动画
  promoteToLayer(element, reason = 'animation') {
    if (reason === 'animation') {
      element.style.transform = 'translateZ(0)';
    } else if (reason === 'will-change') {
      element.style.willChange = 'transform';
    }
    
    this.activeLayers.add(element);
    
    // 自动清理长时间未使用的图层
    setTimeout(() => {
      if (this.activeLayers.has(element)) {
        this.demoteFromLayer(element);
      }
    }, 5000);
  }
  
  // 降级合成层
  demoteFromLayer(element) {
    element.style.transform = '';
    element.style.willChange = 'auto';
    this.activeLayers.delete(element);
  }
  
  // 批量管理图层
  optimizeLayers(elements) {
    // 对需要频繁更新的元素创建图层
    elements.forEach(element => {
      if (this.needsFrequentUpdates(element)) {
        this.promoteToLayer(element, 'animation');
      }
    });
  }
  
  needsFrequentUpdates(element) {
    // 检测元素是否在动画或频繁更新
    const computedStyle = window.getComputedStyle(element);
    return computedStyle.animationName !== 'none' || 
           computedStyle.transitionProperty !== 'none';
  }
}
```

## CSS 性能优化 {#css-performance}

CSS 性能影响样式计算、布局和绘制各个阶段。优化策略包括选择器性能优化、减少样式复杂度、使用高效属性和避免样式计算阻塞。

特点：CSS 优化关注**选择器效率**和**样式计算成本**。现代浏览器优化了大部分选择器性能，但深层嵌套和通用选择器仍需避免。

示意图：
选择器性能排序：
ID 选择器 > 类选择器 > 标签选择器 > 通用选择器
样式计算：匹配选择器 → 计算特异性 → 应用样式
优化重点：减少选择器复杂度 + 避免频繁修改样式 + 使用 CSS 变量

```css
/* CSS优化示例 */
/* 不良：过于复杂的选择器 */
.container ul li a span.highlight { 
  color: red; 
}

/* 优化：使用类选择器 */
.text-highlight { 
  color: red; 
}

/* 使用CSS变量减少计算 */
:root {
  --primary-color: #007bff;
  --spacing-unit: 8px;
}

.component {
  color: var(--primary-color);
  padding: calc(var(--spacing-unit) * 2);
}

/* 使用contain属性限制样式计算范围 */
.isolated-component {
  contain: layout style;
}

/* 高效动画属性 */
.efficient-animation {
  /* 使用transform和opacity */
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.expensive-animation {
  /* 避免使用布局属性动画 */
  transition: width 0.3s ease, height 0.3s ease;
}
```

## JavaScript 渲染优化 {#javascript-rendering}

JavaScript 执行可能阻塞渲染，优化策略包括任务分割、异步执行、使用 requestAnimationFrame 和减少 DOM 操作。现代框架的虚拟 DOM 和增量更新机制也显著提升渲染性能。

特点：JavaScript 渲染优化核心是**减少主线程阻塞时间**和**优化 DOM 操作**。将任务分解为小块，在浏览器空闲期执行非关键任务。

```javascript
// 使用requestAnimationFrame优化渲染
class AnimationOptimizer {
  constructor() {
    this.animations = new Map();
    this.frameId = null;
  }
  
  // 注册动画更新函数
  registerAnimation(key, updateFn) {
    this.animations.set(key, updateFn);
    this.scheduleFrame();
  }
  
  // 调度动画帧
  scheduleFrame() {
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.updateAnimations.bind(this));
    }
  }
  
  // 更新所有动画
  updateAnimations(timestamp) {
    this.animations.forEach(updateFn => {
      updateFn(timestamp);
    });
    
    this.frameId = null;
    if (this.animations.size > 0) {
      this.scheduleFrame();
    }
  }
  
  // 停止动画
  stopAnimation(key) {
    this.animations.delete(key);
  }
}

// 优化DOM操作批次
function batchDOMOperations(operations) {
  // 使用文档片段批量操作
  const fragment = document.createDocumentFragment();
  
  operations.forEach(op => {
    const element = document.createElement(op.tag);
    element.textContent = op.content;
    fragment.appendChild(element);
  });
  
  // 单次插入到DOM
  document.getElementById('container').appendChild(fragment);
}

// 使用微任务批量更新
function scheduleMicrotaskUpdate(updateFn) {
  let scheduled = false;
  
  return function() {
    if (!scheduled) {
      scheduled = true;
      Promise.resolve().then(() => {
        scheduled = false;
        updateFn();
      });
    }
  };
}
```

## 图片与媒体渲染优化 {#image-and-media}

图片和媒体资源是渲染性能的重要影响因素。优化策略包括格式选择、响应式图片、懒加载和渐进式加载。现代图片格式如 WebP 和 AVIF 提供更好的压缩效率。

特点：图片优化平衡**视觉质量**和**加载性能**。根据设备能力和网络条件提供合适的资源版本。

示意图：
图片优化策略：
格式选择 (WebP/AVIF) → 尺寸适配 (响应式) → 压缩质量 (80-85%) → 加载时机 (懒加载)
性能收益：减少 60-80%图片体积 + 更快首屏渲染

```javascript
// 响应式图片优化
class ResponsiveImageLoader {
  constructor() {
    this.breakpoints = [400, 800, 1200, 1920];
    this.formats = ['webp', 'avif', 'jpg'];
  }
  
  // 生成图片srcset
  generateSrcSet(basePath, imageName) {
    const srcset = {};
    
    this.formats.forEach(format => {
      srcset[format] = this.breakpoints.map(width => 
        `${basePath}/${imageName}-${width}.${format} ${width}w`
      ).join(', ');
    });
    
    return srcset;
  }
  
  // 懒加载图片
  setupLazyLoading(images) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });
    
    images.forEach(img => {
      observer.observe(img);
    });
  }
  
  // 渐进式图片加载
  setupProgressiveLoading(container) {
    // 先加载低质量占位图
    const placeholder = this.createLowQualityPlaceholder();
    container.appendChild(placeholder);
    
    // 然后加载高质量图片
    this.loadHighQualityImage().then(highResImg => {
      container.replaceChild(highResImg, placeholder);
    });
  }
}
```

## 字体渲染优化 {#font-rendering}

字体加载和渲染影响文本显示性能和视觉稳定性。优化策略包括字体显示控制、子集化、预加载和 FOUT/FOIT 管理。使用 font-display 属性控制字体加载行为。

特点：字体优化关注**加载时机**和**渲染行为**。避免布局偏移和不可见文本闪烁，提供平滑的字体加载体验。

示意图：
字体加载时间线：
字体请求 → 字体阻塞期 → 交换期 → 失败期
font-display 控制：
block：阻塞文本显示 | swap：立即回退 | optional：可能不显示
优化目标：最小化布局偏移 + 快速显示内容

```css
/* 字体加载优化 */
@font-face {
  font-family: 'OptimizedFont';
  src: url('font.woff2') format('woff2'),
       url('font.woff') format('woff');
  font-display: swap; /* 使用系统字体立即显示，然后交换 */
  font-weight: 400;
  unicode-range: U+000-5FF; /* 拉丁字符子集 */
}

/* 预加载关键字体 */
<link rel="preload" href="critical-font.woff2" as="font" type="font/woff2" crossorigin>

/* 使用CSS大小调整避免布局偏移 */
.text-element {
  font-size: clamp(1rem, 2.5vw, 2rem);
  line-height: 1.4;
}

/* 字体加载完成后的优化 */
.font-loaded .text-element {
  font-family: 'OptimizedFont', system-ui;
}
```

```javascript
// 字体加载状态管理
class FontLoadManager {
  constructor() {
    this.loadedFonts = new Set();
  }
  
  // 监控字体加载
  monitorFontLoad(fontFamily) {
    const font = new FontFaceObserver(fontFamily);
    
    font.load().then(() => {
      this.loadedFonts.add(fontFamily);
      document.documentElement.classList.add('fonts-loaded');
      
      // 触发字体加载完成事件
      this.onFontLoaded(fontFamily);
    }).catch((error) => {
      console.warn(`Font ${fontFamily} failed to load:`, error);
    });
  }
  
  onFontLoaded(fontFamily) {
    // 更新CSS变量或触发重新渲染
    document.documentElement.style.setProperty(
      '--font-loaded', 
      Date.now().toString()
    );
  }
  
  // 预连接字体域名
  preconnectFontHosts(hosts) {
    hosts.forEach(host => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = host;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }
}
```

## 渲染性能监控 {#rendering-performance-monitoring}

实时监控渲染性能指标，识别瓶颈和优化机会。使用 Performance API、Frame Timing API 和自定义指标跟踪渲染性能。

特点：渲染监控关注**真实用户数据**和**关键性能指标**。结合实验室测试和现场监控，全面了解渲染性能状况。

```javascript
// 渲染性能监控
class RenderingMonitor {
  constructor() {
    this.metrics = new Map();
    this.observer = null;
  }
  
  // 监控帧率
  startFrameRateMonitoring() {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const checkFrames = () => {
      const currentTime = performance.now();
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.recordMetric('fps', fps);
        
        frameCount = 0;
        lastTime = currentTime;
        
        // 低帧率警告
        if (fps < 30) {
          this.reportLowFPS(fps);
        }
      }
      
      requestAnimationFrame(checkFrames);
    };
    
    requestAnimationFrame(checkFrames);
  }
  
  // 监控布局偏移
  startLayoutShiftMonitoring() {
    let clsValue = 0;
    
    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.recordMetric('cls', clsValue);
        }
      }
    });
    
    this.observer.observe({ type: 'layout-shift', buffered: true });
  }
  
  // 记录渲染指标
  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name).push({
      value,
      timestamp: Date.now()
    });
  }
  
  // 生成性能报告
  generateReport() {
    const report = {};
    
    for (const [name, values] of this.metrics) {
      const recentValues = values.slice(-100); // 最近100个样本
      report[name] = {
        current: recentValues[recentValues.length - 1]?.value,
        average: this.calculateAverage(recentValues),
        min: this.calculateMin(recentValues),
        max: this.calculateMax(recentValues),
        trend: this.calculateTrend(recentValues)
      };
    }
    
    return report;
  }
  
  // 监控强制同步布局
  monitorForcedSyncLayout() {
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype, 'offsetHeight'
    ).get;
    
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      get: function() {
        const value = originalOffsetHeight.call(this);
        // 检测到在样式修改后立即读取布局属性
        performance.mark('forced-sync-layout');
        return value;
      }
    });
  }
}
```