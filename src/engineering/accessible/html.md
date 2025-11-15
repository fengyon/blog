# html 无障碍

## 什么是 HTML 无障碍

HTML 无障碍是通过语义化标记和标准属性，使网页内容对所有用户 (包括使用辅助技术的用户) 可访问的技术实践。核心原理是利用 HTML 元素的内置无障碍特性，为屏幕阅读器、键盘导航等辅助工具提供结构化信息。

示意图：
```
传统div布局: <div>点击这里</div>
            ↓
屏幕阅读器: "点击这里" (无上下文)
            
语义化HTML: <button>提交表单</button>
            ↓  
屏幕阅读器: "提交表单 按钮"
```

## 语义 HTML 的重要性

语义 HTML 是无障碍的基石。浏览器和辅助技术通过元素标签理解内容结构和含义，自动提供适当的交互支持。

特点：
- **内置无障碍**：原生 HTML 元素自带键盘支持和屏幕阅读器识别
- **向前兼容**：遵循标准确保与未来技术兼容
- **性能优势**：比 JavaScript 模拟的组件更轻量高效

原理示意图：
```
HTML元素 → 浏览器可访问性树 → 操作系统API → 辅助技术
<button>       按钮角色           UI Automation     屏幕阅读器语音
```

## 核心语义元素

### 文档结构元素

使用语义化容器元素定义页面区域，帮助屏幕阅读器用户理解页面布局。

代码示例：
```html
<header>
  <h1>网站标题</h1>
  <nav aria-label="主导航">...</nav>
</header>

<main>
  <article>
    <h2>文章标题</h2>
    <p>文章内容...</p>
  </article>
</main>

<aside>
  <h2>相关链接</h2>
  <ul>...</ul>
</aside>

<footer>版权信息</footer>
```

示意图：
```
页面结构:
[页眉] 标题+导航
[主内容] 文章区域  
[侧边栏] 相关内容
[页脚] 附加信息
```

屏幕阅读器导航：
```
地标导航: 页眉 → 主导航 → 主内容 → 文章 → 侧边栏 → 页脚
```

### 标题层级

正确的标题结构创建内容大纲，方便用户快速导航。

代码示例：
```html
<h1>主要页面标题</h1>
  <h2>第一部分</h2>
    <h3>子章节1.1</h3>
    <h3>子章节1.2</h3>
  <h2>第二部分</h2>
    <h3>子章节2.1</h3>
```

示意图：
```
标题大纲:
h1: 主要页面标题
  h2: 第一部分
    h3: 子章节1.1
    h3: 子章节1.2
  h2: 第二部分  
    h3: 子章节2.1
```

屏幕阅读器体验：
```
用户命令: "列出所有标题"
输出: "级别1: 主要页面标题, 级别2: 第一部分, 级别3: 子章节1.1..."
```

## 表单无障碍

### 标签关联

使用 `<label>` 元素或 aria-label 为表单控件提供可访问名称。

代码示例：
```html
<!-- 显式标签关联 -->
<label for="username">用户名:</label>
<input type="text" id="username" name="username">

<!-- 隐式标签包裹 -->
<label>
  密码:
  <input type="password" name="password">
</label>

<!-- ARIA标签 -->
<input type="search" aria-label="网站搜索" placeholder="输入关键词">
```

原理示意图：
```
标签关联前:
输入框 [       ]
屏幕阅读器: "编辑框"

标签关联后:  
用户名: [输入框]
屏幕阅读器: "用户名 编辑框"
```

### 错误处理

提供清晰的错误标识和说明。

代码示例：
```html
<label for="email">电子邮箱:</label>
<input type="email" id="email" name="email" aria-describedby="email-error" aria-invalid="true">
<span id="email-error" class="error-message">请输入有效的电子邮箱地址</span>
```

示意图：
```
表单状态:
电子邮箱: [invalid@example..] ✗
           ↑
错误消息: "请输入有效的电子邮箱地址"

屏幕阅读器: "电子邮箱 编辑框 无效 请输入有效的电子邮箱地址"
```

### 字段分组

使用 `<fieldset>` 和 `<legend>` 组织相关控件。

代码示例：
```html
<fieldset>
  <legend>支付方式</legend>
  
  <input type="radio" id="credit-card" name="payment" value="card">
  <label for="credit-card">信用卡</label>
  
  <input type="radio" id="paypal" name="payment" value="paypal">
  <label for="paypal">PayPal</label>
</fieldset>
```

## 链接与导航

### 有意义的链接文本

链接文本应能独立表达其目的。

代码示例：
```html
<!-- 不良实践 -->
<p>要了解更多信息，<a href="/about">点击这里</a>。</p>

<!-- 良好实践 -->  
<p><a href="/about">了解关于我们的更多信息</a>。</p>

<!-- 特殊情况使用ARIA -->
<a href="/annual-report.pdf" aria-label="下载2024年度报告PDF文档">
  下载报告
</a>
```

示意图：
```
链接列表:
不良: "点击这里", "阅读更多", "链接"
良好: "关于我们", "产品特性", "联系方式"
```

屏幕阅读器导航：
```
不良: "链接 点击这里", "链接 阅读更多" (无上下文)
良好: "链接 关于我们", "链接 产品特性" (清晰明确)
```

### 跳过链接

为键盘用户提供跳过重复导航的快捷方式。

代码示例：
```html
<a href="#main-content" class="skip-link">跳到主内容</a>

<header>...</header>

<main id="main-content">
  <!-- 页面主内容 -->
</main>
```

CSS 实现：
```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}
```

## 表格无障碍

### 数据表格

使用 `<caption>`、`<th>` 和 scope 属性提供表格结构信息。

代码示例：
```html
<table>
  <caption>2024年销售数据</caption>
  <thead>
    <tr>
      <th scope="col">产品</th>
      <th scope="col">季度1</th>
      <th scope="col">季度2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">笔记本电脑</th>
      <td>120台</td>
      <td>150台</td>
    </tr>
  </tbody>
</table>
```

示意图：
```
表格结构:
[标题: 2024年销售数据]
[列头] 产品    | 季度1 | 季度2
[行头] 笔记本电脑 | 120台 | 150台
```

屏幕阅读器朗读：
```
"表格 2024年销售数据 包含3列2行"
"行1 列头: 产品 笔记本电脑, 季度1 120台, 季度2 150台"
```

## 图像与多媒体

### 替代文本

根据图像功能提供恰当的 alt 文本。

代码示例：
```html
<!-- 信息性图像 -->
<img src="chart.jpg" alt="2024年季度销售趋势图，显示持续增长">

<!-- 装饰性图像 -->
<img src="divider.png" alt="">

<!-- 链接中的图像 -->
<a href="/home">
  <img src="logo.png" alt="公司首页 - 返回主页">
</a>

<!-- 复杂图像 -->
<img src="organization-chart.jpg" alt="公司组织结构图">
<details>
  <summary>详细文字描述</summary>
  <p>CEO下设技术部、市场部、财务部...</p>
</details>
```

原理示意图：
```
图像访问流程:
图像加载 → 屏幕阅读器检测alt属性 → 朗读描述或跳过
         ↓
信息性图像: "2024年季度销售趋势图，显示持续增长"
装饰性图像: (静默跳过)
```

### 多媒体字幕

为音视频内容提供文本替代。

代码示例：
```html
<video controls>
  <source src="tutorial.mp4" type="video/mp4">
  <track src="captions.vtt" kind="captions" srclang="zh" label="中文字幕">
  <track src="descriptions.vtt" kind="descriptions" srclang="zh" label="音频描述">
</video>
```

## ARIA 在 HTML 中的合理使用

### 何时使用 ARIA

ARIA 应作为语义 HTML 的补充，而非替代。

代码示例：
```html
<!-- 原生HTML已足够 -->
<button>保存更改</button>

<!-- 需要ARIA增强的动态内容 -->
<div class="alert" role="alert" aria-live="assertive">
  数据保存成功！
</div>

<!-- 自定义组件 -->
<div class="tablist" role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel1">
    选项卡一
  </button>
  <div role="tabpanel" id="panel1">...</div>
</div>
```

### 实时区域

使用 aria-live 声明动态更新内容的优先级。

代码示例：
```html
<!-- 重要通知 - 立即中断 -->
<div role="alert" aria-live="assertive">
  连接丢失，请检查网络设置
</div>

<!-- 普通更新 - 空闲时宣读 -->
<div aria-live="polite" aria-atomic="true">
  新消息已加载
</div>
```

示意图：
```
实时区域行为:
assertive: "[紧急!] 连接丢失" (立即中断当前语音)
polite:    "新消息已加载" (等待当前语句结束)
```

## 键盘导航支持

### 焦点管理

确保所有交互元素都可键盘访问。

代码示例：
```html
<!-- 原生可聚焦元素 -->
<button>可点击</button>
<a href="#">可链接</a>
<input type="text">

<!-- 自定义可聚焦元素 -->
<div tabindex="0" role="button">自定义按钮</div>

<!-- 编程焦点控制 -->
<button onclick="document.getElementById('modal').focus()">
  打开对话框
</button>
```

焦点顺序示意图：
```
页面标签索引:
[链接1] tabindex=0 → [按钮] tabindex=0 → [输入框] tabindex=0
```

### 视觉焦点指示

确保焦点状态清晰可见。

代码示例：
```css
/* 基础焦点样式 */
button:focus, a:focus, input:focus {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  button:focus, a:focus, input:focus {
    outline: 3px solid #000000;
  }
}

/* 自定义组件焦点 */
[role="button"]:focus {
  box-shadow: 0 0 0 3px rgba(0, 95, 204, 0.5);
}
```

## 测试与验证

### 手动测试技术

代码示例：
```html
<!-- 测试页面结构 -->
<h1>主要标题</h1>
<nav aria-label="测试导航">
  <h2 class="visually-hidden">导航菜单</h2>
  <ul>...</ul>
</nav>

<main>
  <h2>内容区域</h2>
  <!-- 测试内容 -->
</main>
```

测试流程示意图：
```
键盘测试: Tab遍历所有交互元素
          ↓
屏幕阅读器测试: 聆听页面朗读
          ↓  
颜色对比度测试: 验证文字可读性
          ↓
HTML验证: 检查语义结构
```

### 开发工具验证

使用浏览器开发者工具检查无障碍树。

代码示例：
```html
<!-- 检查此元素的无障碍属性 -->
<button aria-expanded="false" aria-controls="dropdown-menu">
  菜单
</button>
<div id="dropdown-menu" hidden>
  下拉内容
</div>
```

浏览器工具显示：
```
无障碍属性:
角色: button
名称: "菜单"  
状态: expanded=false
控件: dropdown-menu
```