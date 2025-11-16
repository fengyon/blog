# 响应式设计

响应式设计是一种网页设计和开发方法，通过灵活的网格布局、弹性图片和媒体查询等技术，使网站能够适应不同设备和屏幕尺寸，提供最佳的用户体验。在移动互联网时代，响应式设计已成为现代 Web 开发的标准实践。

## 响应式设计基础

响应式设计的核心在于创建能够自动调整布局、图片和内容的灵活界面，确保在任何设备上都能提供优秀的用户体验。

- **核心原则**：一次开发，处处适配
- **技术基础**：CSS3 媒体查询、弹性布局、相对单位
- **设计哲学**：内容优先，移动优先

设计流程示意图：
设计构思 → 移动端布局 → 平板适配 → 桌面端优化
    ↓ ↓ ↓ ↓
内容优先触控友好中等屏幕大屏体验

## 核心概念与原理

### 视口配置

视口是响应式设计的基石，正确的视口配置确保页面在移动设备上正确缩放。

```html
<!-- 基本视口配置 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- 完整视口配置 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```

视口效果对比：
无 viewport：桌面版网页在手机上缩小显示，需要手动缩放
有 viewport：网页自动适配设备宽度，内容可读性佳

### 媒体查询

媒体查询是响应式设计的核心技术，允许根据设备特性应用不同的 CSS 样式。

```css
/* 基础媒体查询语法 */
@media [媒体类型] [逻辑操作符] (条件) {
  /* CSS规则 */
}

/* 常见断点设置 */
/* 手机设备 */
@media (max-width: 767px) {
  .container { padding: 10px; }
}

/* 平板设备 */
@media (min-width: 768px) and (max-width: 1023px) {
  .container { padding: 20px; }
}

/* 桌面设备 */
@media (min-width: 1024px) {
  .container { padding: 30px; }
}

/* 高分辨率屏幕 */
@media (-webkit-min-device-pixel-ratio: 2), 
       (min-resolution: 192dpi) {
  .logo { background-image: url(logo@2x.png); }
}

/* 横屏模式 */
@media (orientation: landscape) {
  .header { height: 60px; }
}

/* 打印样式 */
@media print {
  .sidebar, .ad-banner { display: none; }
}
```

### 弹性网格布局

使用相对单位创建自适应的网格系统，替代固定像素布局。

```css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px;
}

/* 传统浮动网格 */
.row::after {
  content: "";
  display: table;
  clear: both;
}

.col {
  float: left;
  box-sizing: border-box;
}

.col-4 { width: 33.333%; }
.col-6 { width: 50%; }
.col-12 { width: 100%; }

/* 媒体查询调整网格 */
@media (max-width: 768px) {
  .col-4, .col-6 { width: 100%; }
}
```

## 响应式技术实现

### 移动优先设计

移动优先策略从小屏幕开始设计，逐步增强到大屏幕体验。

```css
/* 基础样式 - 移动设备优先 */
.container {
  padding: 15px;
  margin: 0 auto;
  max-width: 100%;
}

.nav-menu {
  display: block;
  list-style: none;
  padding: 0;
}

.nav-item {
  border-bottom: 1px solid #eee;
  padding: 10px;
}

/* 平板设备增强 */
@media (min-width: 768px) {
  .container {
    padding: 20px;
    max-width: 720px;
  }
  
  .nav-menu {
    display: flex;
    justify-content: space-between;
  }
  
  .nav-item {
    border-bottom: none;
    padding: 0 15px;
  }
}

/* 桌面设备增强 */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    padding: 30px;
  }
  
  .nav-menu {
    justify-content: flex-start;
  }
}
```

### 响应式图片

确保图片在不同设备和屏幕尺寸下都能正确显示。

```html
<!-- srcset 多分辨率图片 -->
<img 
  src="image-400.jpg" 
  srcset="image-400.jpg 400w,
          image-800.jpg 800w,
          image-1200.jpg 1200w"
  sizes="(max-width: 480px) 100vw,
         (max-width: 768px) 50vw,
         33vw"
  alt="响应式图片示例"
>

<!-- picture 元素艺术指导 -->
<picture>
  <source media="(max-width: 767px)" srcset="mobile-image.jpg">
  <source media="(min-width: 768px)" srcset="desktop-image.jpg">
  <img src="fallback-image.jpg" alt="艺术指导图片">
</picture>

<!-- CSS 背景图片响应式 -->
<div class="responsive-bg"></div>

<style>
.responsive-bg {
  background-image: url('small.jpg');
  background-size: cover;
  height: 200px;
}

@media (min-width: 768px) {
  .responsive-bg {
    background-image: url('large.jpg');
    height: 400px;
  }
}
</style>
```

### 响应式单位系统

使用相对单位替代固定像素，创建灵活的布局系统。

```css
.container {
  /* 视口单位 */
  width: 100vw;
  min-height: 100vh;
  padding: 2vmin; /* 取视口宽度和高度中较小的1% */
  
  /* 字体相对单位 */
  font-size: clamp(1rem, 2.5vw, 1.5rem);
  line-height: 1.6;
}

.card {
  /* 百分比单位 */
  width: 100%;
  max-width: 90%;
  margin: 0 auto;
  
  /* rem 单位 - 相对于根元素字体大小 */
  padding: 1rem;
  border-radius: 0.5rem;
  
  /* em 单位 - 相对于父元素字体大小 */
  font-size: 1em;
}

.button {
  /* 动态计算 */
  padding: calc(0.5rem + 1vw);
  font-size: max(1rem, min(1.2rem, 2vw));
}

/* 根元素字体大小设置 */
html {
  font-size: 16px;
}

@media (max-width: 768px) {
  html {
    font-size: 14px;
  }
}
```

## 常用 API 与代码示例

### CSS 容器查询

容器查询允许组件根据其容器尺寸而非视口尺寸进行样式调整。

```css
/* 定义容器 */
.component-container {
  container-type: inline-size;
  container-name: main;
}

/* 容器查询 */
@container main (min-width: 400px) {
  .card {
    display: flex;
    gap: 20px;
  }
  
  .card-image {
    width: 150px;
    height: 150px;
  }
}

@container main (min-width: 600px) {
  .card {
    padding: 30px;
  }
  
  .card-title {
    font-size: 1.5rem;
  }
}
```

### JavaScript 响应式检测

使用 JavaScript 检测设备特性和屏幕变化。

```javascript
// 检测屏幕尺寸变化
function handleResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  if (width < 768) {
    document.body.classList.add('mobile');
    document.body.classList.remove('tablet', 'desktop');
  } else if (width < 1024) {
    document.body.classList.add('tablet');
    document.body.classList.remove('mobile', 'desktop');
  } else {
    document.body.classList.add('desktop');
    document.body.classList.remove('mobile', 'tablet');
  }
}

// 监听窗口变化
window.addEventListener('resize', handleResize);
handleResize(); // 初始检测

// 检测设备像素比
const devicePixelRatio = window.devicePixelRatio || 1;
console.log(`设备像素比: ${devicePixelRatio}`);

// 检测触摸支持
const isTouchDevice = 'ontouchstart' in window || 
                      navigator.maxTouchPoints > 0 ||
                      navigator.msMaxTouchPoints > 0;

if (isTouchDevice) {
  document.body.classList.add('touch-device');
}

// 匹配媒体查询
const mediaQuery = window.matchMedia('(min-width: 768px)');

function handleTabletChange(e) {
  if (e.matches) {
    console.log('屏幕宽度 >= 768px');
    // 平板及以上布局逻辑
  } else {
    console.log('屏幕宽度 < 768px');
    // 手机布局逻辑
  }
}

mediaQuery.addListener(handleTabletChange);
handleTabletChange(mediaQuery);
```

### 响应式工具函数

创建可重用的响应式工具函数。

```javascript
// 响应式断点管理器
class ResponsiveManager {
  constructor(breakpoints) {
    this.breakpoints = breakpoints || {
      xs: 0,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200
    };
    
    this.currentBreakpoint = this.getCurrentBreakpoint();
    this.init();
  }
  
  init() {
    window.addEventListener('resize', this.handleResize.bind(this));
  }
  
  getCurrentBreakpoint() {
    const width = window.innerWidth;
    
    if (width >= this.breakpoints.xl) return 'xl';
    if (width >= this.breakpoints.lg) return 'lg';
    if (width >= this.breakpoints.md) return 'md';
    if (width >= this.breakpoints.sm) return 'sm';
    return 'xs';
  }
  
  handleResize() {
    const newBreakpoint = this.getCurrentBreakpoint();
    
    if (newBreakpoint !== this.currentBreakpoint) {
      const oldBreakpoint = this.currentBreakpoint;
      this.currentBreakpoint = newBreakpoint;
      
      // 触发断点变化事件
      this.onBreakpointChange(newBreakpoint, oldBreakpoint);
    }
  }
  
  onBreakpointChange(newBreakpoint, oldBreakpoint) {
    // 自定义断点变化处理逻辑
    console.log(`断点变化: ${oldBreakpoint} -> ${newBreakpoint}`);
    
    // 分发自定义事件
    const event = new CustomEvent('breakpointchange', {
      detail: {
        newBreakpoint,
        oldBreakpoint
      }
    });
    window.dispatchEvent(event);
  }
  
  isAbove(breakpoint) {
    const breakpoints = Object.keys(this.breakpoints);
    const currentIndex = breakpoints.indexOf(this.currentBreakpoint);
    const targetIndex = breakpoints.indexOf(breakpoint);
    
    return currentIndex >= targetIndex;
  }
}

// 使用示例
const responsive = new ResponsiveManager();

window.addEventListener('breakpointchange', (e) => {
  const { newBreakpoint, oldBreakpoint } = e.detail;
  console.log(`响应式变化: ${oldBreakpoint} → ${newBreakpoint}`);
});

// 条件执行
if (responsive.isAbove('md')) {
  // 只在中等屏幕及以上执行
  initDesktopFeatures();
}
```

### 现代 CSS 响应式特性

使用现代 CSS 特性创建更简洁的响应式布局。

```css
/* clamp() 函数 - 动态值范围 */
.heading {
  font-size: clamp(1.5rem, 4vw, 3rem);
  margin: clamp(1rem, 3vw, 2rem);
}

/* aspect-ratio 属性 */
.video-container {
  aspect-ratio: 16 / 9;
  width: 100%;
  background: #000;
}

/* grid 自动适应 */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

/* 容器查询实际应用 */
.product-grid {
  container-type: inline-size;
}

@container (min-width: 500px) {
  .product-card {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 1rem;
  }
}

/* 响应式间距工具类 */
.space-sm { gap: 0.5rem; }
.space-md { gap: 1rem; }
.space-lg { gap: 2rem; }

@container (min-width: 768px) {
  .space-sm { gap: 1rem; }
  .space-md { gap: 1.5rem; }
  .space-lg { gap: 3rem; }
}
```

## 响应式设计模式

### 导航模式适配

不同屏幕尺寸下的导航设计模式。

```css
/* 移动端汉堡菜单 */
.mobile-nav {
  position: fixed;
  top: 0;
  left: -100%;
  width: 80%;
  height: 100vh;
  background: white;
  transition: left 0.3s ease;
  z-index: 1000;
}

.mobile-nav.open {
  left: 0;
}

/* 桌面端水平导航 */
.desktop-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 响应式切换 */
.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hamburger {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
}

@media (max-width: 767px) {
  .desktop-nav {
    display: none;
  }
  
  .hamburger {
    display: block;
  }
}
```

### 内容重新布局

基于屏幕尺寸的内容布局调整策略。

```css
/* 卡片布局 - 移动端堆叠 */
.card-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 平板端 - 2列 */
@media (min-width: 768px) {
  .card-layout {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .card {
    flex: 1 1 calc(50% - 20px);
    min-width: 300px;
  }
}

/* 桌面端 - 3列 */
@media (min-width: 1024px) {
  .card {
    flex: 1 1 calc(33.333% - 20px);
  }
}

/* 内容显示/隐藏策略 */
.mobile-only {
  display: block;
}

.desktop-only {
  display: none;
}

.tablet-hidden {
  display: block;
}

@media (min-width: 768px) {
  .mobile-only {
    display: none;
  }
  
  .tablet-hidden {
    display: none;
  }
}

@media (min-width: 1024px) {
  .desktop-only {
    display: block;
  }
}
```

## 性能优化考虑

响应式设计需要考虑的性能优化策略。

```css
/* 条件加载资源 */
.desktop-hero {
  background-image: url('desktop-hero.jpg');
}

@media (max-width: 767px) {
  .desktop-hero {
    background-image: url('mobile-hero.jpg');
  }
}

/* 减少移动端动画 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 移动端优化 */
@media (max-width: 767px) and (orientation: portrait) {
  .complex-animation {
    animation: none;
  }
  
  .heavy-computation {
    /* 简化计算密集型样式 */
    filter: none;
    transform: none;
  }
}
```