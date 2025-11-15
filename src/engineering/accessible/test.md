# 手动测试无障碍

## 手动测试的重要性

手动测试是识别和验证无障碍问题的关键环节，能够发现自动化工具无法检测的上下文和体验问题。与自动化测试互补，手动测试关注真实用户场景、交互流程和主观体验质量。

示意图：

```
自动化测试: 代码扫描 → 技术合规检查 → 发现30%问题
手动测试: 真实用户模拟 → 体验质量评估 → 发现70%问题
组合效果: 全面覆盖技术要求和用户体验
```

## 测试环境配置

### 屏幕阅读器测试套件

配置主流屏幕阅读器进行跨平台测试：

代码示例 (测试环境检查)：

```javascript
// 检测屏幕阅读器活动
function isScreenReaderActive() {
  // 检查减少动画偏好
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  // 检查高对比度模式
  const highContrast = window.matchMedia(
    '(prefers-contrast: high)',
  ).matches

  // 检查光标大小
  const largeCursor = window.matchMedia('(pointer: coarse)').matches

  return {
    reducedMotion,
    highContrast,
    largeCursor,
    // 基于行为推测屏幕阅读器使用
    likelyScreenReaderUser: reducedMotion || highContrast,
  }
}

console.log('无障碍偏好检测:', isScreenReaderActive())
```

测试矩阵示意图：

```
Windows: NVDA + Firefox, JAWS + Chrome
macOS: VoiceOver + Safari
iOS: VoiceOver + Safari
Android: TalkBack + Chrome
```

### 键盘测试准备

确保完整的键盘操作环境：

测试清单：

```
☐ 断开鼠标和触摸板
☐ 启用系统焦点指示器
☐ 关闭鼠标相关浏览器扩展
☐ 准备Tab、箭头键、Enter、Space、Esc测试
```

## 屏幕阅读器测试方法

### 页面结构导航

测试页面整体结构和地标导航：

测试步骤：

```
1. 从头开始朗读页面
2. 使用快捷键跳转地标: (NVDA: D, VoiceOver: VO+U)
3. 使用标题导航: (NVDA: H, VoiceOver: VO+Cmd+H)
4. 使用列表导航: (NVDA: L, VoiceOver: VO+Cmd+X)
```

代码示例 (测试地标结构)：

```html
<!-- 测试用例：地标角色完整性 -->
<header role="banner">
  <nav role="navigation" aria-label="主导航">
    <ul>
      <li><a href="/">首页</a></li>
      <li><a href="/about">关于</a></li>
    </ul>
  </nav>
</header>

<main role="main">
  <h1>页面标题</h1>
  <article role="article">
    <!-- 内容 -->
  </article>
</main>

<aside role="complementary" aria-label="相关链接">
  <!-- 侧边内容 -->
</aside>

<footer role="contentinfo">
  <!-- 页脚内容 -->
</footer>
```

预期屏幕阅读器输出：

```
"横幅" [跳转到header]
"主导航 导航" [跳转到nav]
"列表 2个项目" [进入ul]
"链接 首页" [第一个链接]
"链接 关于" [第二个链接]
"主内容 主区域" [跳转到main]
"页面标题 标题级别1" [h1标题]
"文章" [跳转到article]
"相关链接 补充内容" [跳转到aside]
"内容信息" [跳转到footer]
```

### 表单交互测试

测试表单控件的标签、说明和错误处理：

测试步骤：

```
1. 定位到表单控件
2. 听取标签和说明朗读
3. 尝试不填必填字段提交
4. 听取错误消息宣布
5. 纠正错误后重新提交
```

代码示例 (测试表单无障碍)：

```html
<form id="signup-form">
  <fieldset>
    <legend>注册信息</legend>

    <div>
      <label for="username">用户名:</label>
      <input
        type="text"
        id="username"
        name="username"
        aria-describedby="username-help"
        required
      />
      <span id="username-help" class="help-text">
        用户名应为3-20个字符，可包含字母、数字和下划线
      </span>
    </div>

    <div>
      <label for="email">电子邮箱:</label>
      <input
        type="email"
        id="email"
        name="email"
        aria-invalid="false"
        aria-describedby="email-error"
        required
      />
      <span
        id="email-error"
        class="error-text"
        role="alert"
        aria-live="assertive"
      ></span>
    </div>

    <button type="submit">注册</button>
  </fieldset>
</form>

<script>
  // 测试错误处理
  document
    .getElementById('signup-form')
    .addEventListener('submit', function (e) {
      e.preventDefault()
      const emailInput = document.getElementById('email')
      const errorElement = document.getElementById('email-error')

      if (!emailInput.value.includes('@')) {
        emailInput.setAttribute('aria-invalid', 'true')
        errorElement.textContent = '请输入有效的电子邮箱地址'
        emailInput.focus()
      } else {
        emailInput.setAttribute('aria-invalid', 'false')
        errorElement.textContent = ''
        // 成功提交
      }
    })
</script>
```

预期屏幕阅读器交互流程：

```
"用户名 编辑框 必需"
"用户名应为3-20个字符..." [听到说明]
[输入用户名]
"电子邮箱 编辑框 必需"
[输入无效邮箱]
"注册 按钮" [点击提交]
"警报 请输入有效的电子邮箱地址" [听到错误]
"电子邮箱 无效 编辑框" [焦点返回，听到状态]
```

## 键盘导航测试

### 焦点顺序测试

验证 Tab 键导航的逻辑顺序：

测试步骤：

```
1. 打开页面，按Tab键开始导航
2. 记录焦点移动顺序
3. 检查视觉顺序与DOM顺序一致性
4. 验证跳过链接功能
5. 测试自定义组件的Tabindex
```

代码示例 (焦点顺序测试用例)：

```html
<!-- 测试焦点顺序逻辑 -->
<a href="#main" class="skip-link">跳到主内容</a>

<header>
  <nav>
    <a href="/">首页</a>
    <a href="/products">产品</a>
    <a href="/contact">联系</a>
  </nav>
</header>

<main id="main">
  <h1>主要内容</h1>

  <div class="custom-widget" tabindex="0">自定义焦点元素</div>

  <form>
    <input type="text" placeholder="搜索..." />
    <button type="submit">搜索</button>
  </form>
</main>
```

预期焦点顺序：

```
[跳过链接] → [首页链接] → [产品链接] → [联系链接] →
[自定义widget] → [搜索输入框] → [搜索按钮]
```

### 复杂组件键盘测试

测试自定义组件的完整键盘交互：

测试步骤：

```
1. Tab进入组件
2. 测试箭头键导航
3. 测试Enter/Space激活
4. 测试Esc关闭功能
5. 测试Home/End键支持
```

代码示例 (测试下拉菜单键盘交互)：

```html
<div class="dropdown">
  <button
    id="menu-button"
    aria-haspopup="true"
    aria-expanded="false"
    aria-controls="menu-items"
  >
    选项菜单
  </button>

  <ul id="menu-items" role="menu" aria-labelledby="menu-button" hidden>
    <li role="menuitem" tabindex="-1">选项一</li>
    <li role="menuitem" tabindex="-1">选项二</li>
    <li role="menuitem" tabindex="-1">选项三</li>
  </ul>
</div>

<script>
  // 手动测试键盘交互
  const menuButton = document.getElementById('menu-button')
  const menuItems = document.getElementById('menu-items')
  const menuOptions = menuItems.querySelectorAll('[role="menuitem"]')

  menuButton.addEventListener('click', () => {
    const isExpanded = menuButton.getAttribute('aria-expanded') === 'true'
    menuButton.setAttribute('aria-expanded', !isExpanded)
    menuItems.hidden = isExpanded

    if (!isExpanded) {
      menuOptions[0].focus()
    }
  })

  // 键盘事件处理
  menuButton.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      menuButton.click()
    }
  })

  menuItems.addEventListener('keydown', (e) => {
    const currentIndex = Array.from(menuOptions).indexOf(
      document.activeElement,
    )

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        menuOptions[(currentIndex + 1) % menuOptions.length].focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        menuOptions[
          (currentIndex - 1 + menuOptions.length) % menuOptions.length
        ].focus()
        break
      case 'Escape':
        e.preventDefault()
        menuItems.hidden = true
        menuButton.setAttribute('aria-expanded', 'false')
        menuButton.focus()
        break
      case 'Home':
        e.preventDefault()
        menuOptions[0].focus()
        break
      case 'End':
        e.preventDefault()
        menuOptions[menuOptions.length - 1].focus()
        break
    }
  })
</script>
```

键盘测试序列：

```
1. Tab到菜单按钮
2. 按Enter/Space/↓打开菜单
3. 用↓键移动到"选项二"
4. 用↑键回到"选项一"
5. 用Home跳到"选项一"，End跳到"选项三"
6. 按Esc关闭菜单，焦点返回按钮
```

## 视觉无障碍测试

### 颜色对比度验证

手动验证文本和 UI 元素的对比度：

测试工具和方法：

```
工具: Colour Contrast Analyser, browser DevTools
方法:
  1. 取样文本和背景颜色
  2. 验证对比度比率 ≥ 4.5:1 (正常文本)
  3. 验证对比度比率 ≥ 3:1 (UI组件)
  4. 检查不同状态(悬停、焦点、禁用)
```

代码示例 (对比度测试用例)：

```html
<!-- 测试各种颜色组合 -->
<div class="test-cases">
  <div class="case-pass" style="color: #000000; background: #ffffff;">
    通过: 黑色文字 on 白色背景 (21:1)
  </div>

  <div class="case-warning" style="color: #767676; background: #ffffff;">
    警告: 中灰文字 on 白色背景 (4.5:1 - 刚好通过)
  </div>

  <div class="case-fail" style="color: #cccccc; background: #ffffff;">
    失败: 浅灰文字 on 白色背景 (1.6:1)
  </div>

  <button class="btn-primary" style="background: #0056b3; color: #ffffff;">
    按钮: 深蓝背景 on 白色文字 (7.4:1 ✓)
  </button>

  <button
    class="btn-disabled"
    style="background: #cccccc; color: #666666;"
  >
    禁用按钮: 浅灰背景 on 中灰文字 (4.0:1 ✓)
  </button>
</div>
```

### 视觉焦点测试

验证焦点指示器的可见性和准确性：

测试步骤：

```
1. Tab遍历所有交互元素
2. 检查焦点环是否清晰可见
3. 验证焦点环不遮挡内容
4. 测试高对比度模式下的焦点样式
5. 检查自定义焦点样式
```

代码示例 (焦点样式测试)：

```css
/* 基础焦点样式 */
button:focus,
input:focus,
a:focus {
  outline: 2px solid #0056b3;
  outline-offset: 2px;
}

/* 高对比度支持 */
@media (prefers-contrast: high) {
  button:focus,
  input:focus,
  a:focus {
    outline: 3px solid #000000;
    outline-offset: 1px;
  }
}

/* 自定义组件焦点 */
.custom-component:focus {
  box-shadow: 0 0 0 3px rgba(0, 86, 179, 0.5);
  border-color: #0056b3;
}

/* 测试焦点状态 */
.focus-test-element:focus {
  /* 确保有可见的焦点指示 */
}
```

焦点测试清单：

```
☐ 默认焦点环不被CSS意外移除
☐ 自定义焦点样式对比度足够
☐ 焦点环不改变元素布局
☐ 高对比度模式下焦点仍然可见
☐ 触摸目标尺寸 ≥ 44×44px
```

## 认知无障碍测试

### 内容可读性评估

测试内容的清晰度和理解难度：

评估标准：

```
- 阅读等级: 目标为初中水平(约8年级)
- 句子长度: 平均15-20个词
- 段落长度: 3-5句话
- 专业术语: 提供解释或链接
- 指令清晰度: 步骤明确无歧义
```

代码示例 (可读性测试内容)：

```html
<!-- 良好实践示例 -->
<section aria-labelledby="clear-instructions">
  <h2 id="clear-instructions">设置您的账户</h2>

  <p>请按照以下步骤完成账户设置：</p>

  <ol>
    <li>输入您的电子邮件地址</li>
    <li>
      创建安全密码
      <ul>
        <li>至少8个字符</li>
        <li>包含字母和数字</li>
      </ul>
    </li>
    <li>点击"创建账户"按钮</li>
  </ol>

  <p><strong>提示：</strong>保存您的登录信息以备后用。</p>
</section>

<!-- 不良实践示例 -->
<section>
  <h2>账户初始化流程</h2>
  <p>
    用户须于相应字段输入有效电邮地址并构想符合安全规范的密码组合，随后触发账户创建程序。
  </p>
</section>
```

### 导航一致性测试

验证网站导航模式的统一性：

测试要点：

```
- 一致的导航位置和样式
- 面包屑导航的准确性
- 当前页面状态的视觉指示
- 错误页面的有用导航选项
- 搜索功能的可发现性
```

代码示例 (一致性导航测试)：

```html
<!-- 测试主导航一致性 -->
<nav aria-label="主要导航">
  <ul class="main-nav">
    <li><a href="/" aria-current="page">首页</a></li>
    <li><a href="/products">产品</a></li>
    <li><a href="/about">关于我们</a></li>
    <li><a href="/contact">联系我们</a></li>
  </ul>
</nav>

<!-- 测试面包屑导航 -->
<nav aria-label="面包屑导航">
  <ol class="breadcrumbs">
    <li><a href="/">首页</a></li>
    <li><a href="/products">产品</a></li>
    <li><a href="/products/software" aria-current="location">软件</a></li>
  </ol>
</nav>

<!-- 测试页脚导航一致性 -->
<footer>
  <nav aria-label="辅助导航">
    <ul>
      <li><a href="/privacy">隐私政策</a></li>
      <li><a href="/accessibility">无障碍声明</a></li>
      <li><a href="/sitemap">网站地图</a></li>
    </ul>
  </nav>
</footer>
```

## 移动设备无障碍测试

### 触摸目标测试

验证触摸目标尺寸和间距：

测试标准：

```
- 最小触摸目标: 44×44像素
- 触摸目标间距: ≥ 8像素
- 错误预防: 危险操作确认
- 手势支持: 提供替代操作方式
```

代码示例 (触摸目标测试)：

```html
<!-- 符合标准的触摸目标 -->
<div class="touch-targets">
  <button
    class="btn-large"
    style="min-width: 44px; min-height: 44px; padding: 12px;"
  >
    大按钮 ✓
  </button>

  <button
    class="btn-small"
    style="min-width: 32px; min-height: 32px; padding: 6px;"
  >
    小按钮 ✗ (太小)
  </button>

  <div
    class="icon-button"
    style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;"
  >
    <span aria-hidden="true">🔍</span>
    <span class="visually-hidden">搜索</span>
  </div>
</div>

<style>
  /* 触摸目标增强 */
  .btn-small {
    /* 通过增加点击区域修复小按钮 */
    position: relative;
  }

  .btn-small::after {
    content: '';
    position: absolute;
    top: -8px;
    left: -8px;
    right: -8px;
    bottom: -8px;
  }
</style>
```

### 移动屏幕阅读器测试

测试移动端 VoiceOver/TalkBack 交互：

测试步骤：

```
VoiceOver (iOS):
1. 开启VoiceOver: 设置 → 辅助功能 → VoiceOver
2. 单指滑动浏览元素
3. 双击激活选中元素
4. 使用转子功能导航

TalkBack (Android):
1. 开启TalkBack: 设置 → 辅助功能 → TalkBack
2. 单指滑动浏览
3. 双击激活
4. 使用局部扫描功能
```

代码示例 (移动端 ARIA 测试)：

```html
<!-- 移动端自定义控件 -->
<div
  role="button"
  aria-label="打开菜单"
  onclick="openMenu()"
  onkeydown="handleMobileKey(event)"
  class="mobile-menu-button"
>
  <span aria-hidden="true">☰</span>
</div>

<script>
  function handleMobileKey(event) {
    // 移动端键盘和屏幕阅读器支持
    if (
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.key === 'Spacebar'
    ) {
      // 一些移动浏览器的空格键
      event.preventDefault()
      openMenu()
    }
  }
</script>
```

## 测试文档和报告

### 问题记录模板

使用标准化模板记录测试发现：

代码示例 (测试问题记录)：

````markdown
## 问题报告

**页面**: 产品列表页 (/products)
**测试环境**: Windows 11 + NVDA + Firefox
**严重程度**: 高

### 问题描述

搜索表单缺少无障碍标签，屏幕阅读器用户无法理解表单用途。

### 复现步骤

1. 使用 NVDA 屏幕阅读器导航到产品页面
2. 尝试找到搜索功能
3. 听到"编辑框"但没有上下文说明

### 当前代码

```html
<input type="text" placeholder="搜索产品..." /> <button>搜索</button>
```
````

### 建议修复

```html
<label for="product-search" class="visually-hidden">搜索产品</label>
<input type="text" id="product-search" placeholder="输入产品名称..." />
<button aria-label="执行搜索">搜索</button>
```

### 测试证据

- 屏幕阅读器输出：“编辑框”(缺少标签)
- 键盘测试：可通过 Tab 访问，但目的不明确

````

### 测试清单自动化

创建交互式测试清单：

代码示例（测试清单生成器）：
```javascript
class ManualTestingChecklist {
  constructor() {
    this.checklist = {
      keyboard: [
        '所有交互元素可通过键盘访问',
        '焦点顺序逻辑合理',
        '自定义组件支持键盘交互',
        '无键盘陷阱',
        '跳过链接工作正常'
      ],
      screenReader: [
        '页面标题描述准确',
        '地标角色正确设置',
        '标题层级结构合理',
        '表单控件正确标签',
        '图片有有意义的alt文本',
        '动态内容更新正确宣布'
      ],
      visual: [
        '颜色对比度符合标准',
        '文本可缩放至200%',
        '焦点指示器清晰可见',
        '无仅依赖颜色的信息传达',
        '动画可禁用'
      ]
    };
  }

  generateChecklist() {
    let html = '<div class="testing-checklist">';

    for (const [category, items] of Object.entries(this.checklist)) {
      html += `<h3>${this.formatCategory(category)}</h3>`;
      html += '<ul>';

      items.forEach(item => {
        html += `
          <li>
            <label>
              <input type="checkbox" data-category="${category}">
              ${item}
            </label>
          </li>
        `;
      });

      html += '</ul>';
    }

    html += '</div>';
    return html;
  }

  formatCategory(category) {
    const names = {
      keyboard: '键盘无障碍',
      screenReader: '屏幕阅读器兼容',
      visual: '视觉无障碍'
    };
    return names[category] || category;
  }
}

// 使用示例
const checklist = new ManualTestingChecklist();
document.getElementById('checklist-container').innerHTML = checklist.generateChecklist();
````

### 测试进度跟踪

创建可视化测试进度仪表板：

代码示例 (测试进度监控)：

```javascript
// 测试进度跟踪
class TestingProgress {
  constructor() {
    this.tests = {
      completed: 0,
      total: 0,
      byCategory: {},
    }

    this.loadProgress()
  }

  loadProgress() {
    const saved = localStorage.getItem('a11y-testing-progress')
    if (saved) {
      this.tests = JSON.parse(saved)
    }
  }

  saveProgress() {
    localStorage.setItem(
      'a11y-testing-progress',
      JSON.stringify(this.tests),
    )
  }

  updateProgress(category, completed, total) {
    this.tests.byCategory[category] = { completed, total }
    this.calculateTotals()
    this.saveProgress()
    this.updateUI()
  }

  calculateTotals() {
    let completed = 0
    let total = 0

    for (const category in this.tests.byCategory) {
      completed += this.tests.byCategory[category].completed
      total += this.tests.byCategory[category].total
    }

    this.tests.completed = completed
    this.tests.total = total
  }

  updateUI() {
    const progress = (this.tests.completed / this.tests.total) * 100
    document.getElementById('progress-bar').style.width = `${progress}%`
    document.getElementById('progress-text').textContent = `${
      this.tests.completed
    }/${this.tests.total} 测试完成 (${Math.round(progress)}%)`
  }
}

// 初始化进度跟踪
const progressTracker = new TestingProgress()
```
