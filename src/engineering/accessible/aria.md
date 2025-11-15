# aria

## 什么是 ARIA

可访问的富互联网应用程序 (ARIA) 是一组特殊属性，用于增强 HTML 的无障碍性。当原生 HTML 无法充分描述组件的语义和行为时，ARIA 通过修改浏览器可访问性树来为辅助技术提供额外信息。

示意图：
```
标准HTML: <div>菜单</div>
          ↓
屏幕阅读器: "菜单" (无上下文)

ARIA增强: <div role="menu" aria-label="主导航">菜单</div>
          ↓  
屏幕阅读器: "主导航 菜单"
```

核心原理：ARIA 在 DOM 和可访问性树之间架起桥梁，将自定义组件映射为辅助技术能够理解的标准角色和状态。

## ARIA 的三个核心概念

### 角色 (Roles)

定义元素的类型或目的，将自定义组件映射为标准 UI 模式。

代码示例：
```html
<!-- 导航地标 -->
<nav role="navigation" aria-label="主导航">...</nav>

<!-- 自定义按钮 -->
<div role="button" tabindex="0">自定义按钮</div>

<!-- 对话框 -->
<div role="dialog" aria-labelledby="dialog-title">
  <h2 id="dialog-title">确认删除</h2>
</div>
```

角色分类示意图：
```
抽象角色: (不直接使用)
    └── 小部件角色: button, checkbox, slider
    └── 文档结构角色: heading, list, table  
    └── 地标角色: banner, navigation, main
```

### 属性 (Properties)

描述元素的特征或关系，提供额外语义信息。

代码示例：
```html
<!-- 标签和描述 -->
<input type="text" aria-label="搜索关键词" aria-describedby="search-help">
<span id="search-help">输入产品名称或关键词</span>

<!-- 关系属性 -->
<div role="menu" aria-labelledby="menu-button">
  <button id="menu-button" aria-haspopup="true">选项</button>
</div>

<!-- 实时区域 -->
<div aria-live="polite" aria-atomic="true">
  新消息到达
</div>
```

### 状态 (States)

表示元素的当前条件，通常是动态变化的。

代码示例：
```html
<!-- 切换状态 -->
<button aria-pressed="false">收藏</button>

<!-- 展开状态 -->
<div role="button" aria-expanded="false" aria-controls="content">
  显示更多
</div>
<div id="content" hidden>详细内容...</div>

<!-- 选择状态 -->
<div role="tablist">
  <div role="tab" aria-selected="true">标签一</div>
  <div role="tab" aria-selected="false">标签二</div>
</div>
```

## 可访问性树原理

### DOM 树到可访问性树

浏览器将 DOM 元素转换为辅助技术可理解的可访问性节点。

示意图：
```
DOM树:
<div class="custom-btn">点击我</div>

可访问性树:
generic container (无意义)

添加ARIA后:
<div class="custom-btn" role="button">点击我</div>

可访问性树:
button: "点击我"
```

### 浏览器映射过程

代码示例分析：
```html
<button id="native">原生按钮</button>
<div id="custom" role="button" tabindex="0">自定义按钮</div>
```

浏览器处理流程：
```
1. 解析DOM
2. 计算可访问性树:
   - 原生按钮 → button角色 + 默认属性
   - 自定义div + role="button" → button角色 + 手动属性
3. 暴露给辅助技术API
```

JavaScript 检查可访问性树：
```javascript
// 获取元素的可访问性信息
const element = document.getElementById('custom');
const name = element.getAttribute('aria-label') || element.textContent;
const role = element.getAttribute('role');
const state = {
  disabled: element.getAttribute('aria-disabled') === 'true',
  expanded: element.getAttribute('aria-expanded'),
  pressed: element.getAttribute('aria-pressed')
};

console.log(`角色: ${role}, 名称: ${name}, 状态:`, state);
```

## 核心 ARIA 模式

### 地标角色

标识页面主要区域，帮助屏幕阅读器用户快速导航。

代码示例：
```html
<header role="banner">
  <h1>网站标题</h1>
</header>

<nav role="navigation" aria-label="主导航">
  <ul>...</ul>
</nav>

<main role="main">
  <article role="article">
    <h2>文章标题</h2>
  </article>
</main>

<aside role="complementary" aria-label="相关链接">
  <section>...</section>
</aside>

<footer role="contentinfo">
  <p>版权信息</p>
</footer>
```

屏幕阅读器导航命令：
```
地标导航: "按D键跳转下一个地标"
输出: "横幅, 主导航 导航, 主内容 主区域, 文章, 相关链接 补充内容, 内容信息"
```

### 实时区域 (Live Regions)

声明动态更新内容，控制屏幕阅读器如何宣布变化。

代码示例：
```html
<!-- 重要通知 - 立即中断 -->
<div role="alert" aria-live="assertive">
  系统错误：请立即保存工作
</div>

<!-- 普通更新 - 等待当前阅读完成 -->
<div aria-live="polite" aria-atomic="true">
  消息已发送
</div>

<!-- 复杂更新 - 只读相关部分 -->
<div aria-live="polite" aria-atomic="false">
  更新了<span>5条</span>新消息
</div>
```

实时区域行为示意图：
```
aria-live="off":     更新被忽略
aria-live="polite":  "消息已发送" (等待合适时机)
aria-live="assertive": "系统错误!" (立即中断)

aria-atomic="true":  "消息已发送" (朗读整个区域)
aria-atomic="false": "5条" (只读变化部分)
```

### 表单验证

提供错误状态和描述信息。

代码示例：
```html
<label for="email">邮箱地址:</label>
<input type="email" 
       id="email" 
       name="email"
       aria-required="true"
       aria-invalid="false"
       aria-describedby="email-error email-help">

<span id="email-help">请输入有效的邮箱地址</span>
<span id="email-error" role="alert" aria-live="polite"></span>

<script>
document.getElementById('email').addEventListener('blur', function() {
  const errorElement = document.getElementById('email-error');
  const isValid = this.value.includes('@');
  
  this.setAttribute('aria-invalid', !isValid);
  
  if (!isValid) {
    errorElement.textContent = '请输入包含@符号的有效邮箱地址';
  } else {
    errorElement.textContent = '';
  }
});
</script>
```

验证状态流程图：
```
用户输入 → 失去焦点 → 验证检查
         ↓
有效: aria-invalid="false" → 无错误消息
无效: aria-invalid="true" + 错误描述 → 屏幕阅读器宣布错误
```

## 复杂组件模式

### 标签页组件

实现完整的标签页交互模式。

代码示例：
```html
<div role="tablist" aria-label="内容分类">
  <button role="tab" 
          aria-selected="true" 
          aria-controls="panel-1"
          id="tab-1"
          tabindex="0">
    基本信息
  </button>
  <button role="tab" 
          aria-selected="false" 
          aria-controls="panel-2"
          id="tab-2"
          tabindex="-1">
    高级设置
  </button>
</div>

<div role="tabpanel" 
     id="panel-1" 
     aria-labelledby="tab-1"
     tabindex="0">
  基本信息内容...
</div>

<div role="tabpanel" 
     id="panel-2" 
     aria-labelledby="tab-2"
     hidden 
     tabindex="0">
  高级设置内容...
</div>
```

JavaScript 交互实现：
```javascript
class TabComponent {
  constructor(container) {
    this.tablist = container.querySelector('[role="tablist"]');
    this.tabs = container.querySelectorAll('[role="tab"]');
    this.panels = container.querySelectorAll('[role="tabpanel"]');
    
    this.bindEvents();
  }
  
  bindEvents() {
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => this.activateTab(tab));
      tab.addEventListener('keydown', (e) => this.handleKeydown(e, tab));
    });
  }
  
  activateTab(selectedTab) {
    // 更新标签状态
    this.tabs.forEach(tab => {
      const isSelected = tab === selectedTab;
      tab.setAttribute('aria-selected', isSelected);
      tab.setAttribute('tabindex', isSelected ? '0' : '-1');
    });
    
    // 更新面板显示
    this.panels.forEach(panel => {
      const isActive = panel.getAttribute('aria-labelledby') === selectedTab.id;
      panel.hidden = !isActive;
    });
  }
  
  handleKeydown(event, tab) {
    const key = event.key;
    const currentIndex = Array.from(this.tabs).indexOf(tab);
    
    switch(key) {
      case 'ArrowRight':
        event.preventDefault();
        const nextTab = this.tabs[(currentIndex + 1) % this.tabs.length];
        nextTab.focus();
        this.activateTab(nextTab);
        break;
        
      case 'ArrowLeft':
        event.preventDefault();
        const prevTab = this.tabs[(currentIndex - 1 + this.tabs.length) % this.tabs.length];
        prevTab.focus();
        this.activateTab(prevTab);
        break;
        
      case 'Home':
        event.preventDefault();
        this.tabs[0].focus();
        this.activateTab(this.tabs[0]);
        break;
        
      case 'End':
        event.preventDefault();
        this.tabs[this.tabs.length - 1].focus();
        this.activateTab(this.tabs[this.tabs.length - 1]);
        break;
    }
  }
}
```

### 模态对话框

创建可访问的模态对话框。

代码示例：
```html
<button aria-haspopup="dialog" onclick="openModal()">
  打开设置
</button>

<div id="modal" 
     role="dialog" 
     aria-labelledby="modal-title"
     aria-modal="true"
     aria-describedby="modal-desc"
     hidden>
     
  <h2 id="modal-title">系统设置</h2>
  <p id="modal-desc">修改您的个人偏好设置</p>
  
  <form>
    <label>
      主题:
      <select>
        <option>浅色</option>
        <option>深色</option>
      </select>
    </label>
    
    <button type="button" onclick="closeModal()">取消</button>
    <button type="submit">保存</button>
  </form>
</div>
```

模态框管理 JavaScript：
```javascript
let previousActiveElement;

function openModal() {
  const modal = document.getElementById('modal');
  previousActiveElement = document.activeElement;
  
  // 显示模态框
  modal.hidden = false;
  
  // 设置焦点陷阱
  trapFocus(modal);
  
  // 将焦点移动到模态框
  const firstFocusable = modal.querySelector('button, input, select');
  firstFocusable.focus();
  
  // 隐藏背景内容
  document.querySelector('main').setAttribute('aria-hidden', 'true');
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.hidden = true;
  
  // 恢复背景内容
  document.querySelector('main').removeAttribute('aria-hidden');
  
  // 恢复焦点
  if (previousActiveElement) {
    previousActiveElement.focus();
  }
}

function trapFocus(modal) {
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    } else if (e.key === 'Escape') {
      closeModal();
    }
  });
}
```

## ARIA 属性分类详解

### 标签和描述属性

```html
<!-- 直接标签 -->
<button aria-label="关闭对话框">X</button>

<!-- 引用标签 -->
<label for="search">搜索</label>
<input id="search" type="text" aria-describedby="search-help">
<span id="search-help">输入关键词进行搜索</span>

<!-- 组合标签 -->
<div role="group" aria-labelledby="address-heading">
  <h3 id="address-heading">邮寄地址</h3>
  <!-- 地址字段 -->
</div>
```

### 关系属性

建立元素间的关系连接。

代码示例：
```html
<!-- 控制关系 -->
<button aria-expanded="false" aria-controls="dropdown-menu">
  选项菜单
</button>
<ul id="dropdown-menu" role="menu" hidden>
  <li role="menuitem">选项一</li>
</ul>

<!-- 所属关系 -->
<div role="toolbar" aria-labelledby="toolbar-label">
  <span id="toolbar-label" class="visually-hidden">格式工具栏</span>
  <button aria-pressed="false">粗体</button>
  <button aria-pressed="false">斜体</button>
</div>

<!-- 弹出框关系 -->
<button aria-haspopup="true" aria-expanded="false">
  用户菜单
</button>
```

### 状态属性

表示动态交互状态。

代码示例：
```html
<!-- 选择状态 -->
<div role="listbox">
  <div role="option" aria-selected="true">选项一</div>
  <div role="option" aria-selected="false">选项二</div>
</div>

<!-- 禁用状态 -->
<button aria-disabled="true">正在提交...</button>

<!-- 拖放状态 -->
<div role="button" aria-grabbed="false" draggable="true">
  可拖动项目
</div>

<!-- 必需状态 -->
<input type="text" aria-required="true">
```

## ARIA 使用最佳实践

### ARIA 第一规则

“如果你能使用原生 HTML 元素或属性具有所需的语义和行为，而不是重新使用 ARIA 来补充，那么就这样做。”

代码示例对比：
```html
<!-- 不良实践：用ARIA模拟原生元素 -->
<div role="button" tabindex="0" onclick="handleClick()">点击</div>

<!-- 良好实践：使用原生按钮 -->
<button onclick="handleClick()">点击</button>

<!-- 例外情况：需要增强语义时 -->
<button aria-pressed="false" aria-label="静音">
  🔇
</button>
```

### 角色和属性验证

确保 ARIA 使用符合规范。

代码示例：
```html
<!-- 无效：button角色不能包含子按钮 -->
<div role="button">
  <button>子按钮</button> <!-- 无效嵌套 -->
</div>

<!-- 有效：使用适当的容器角色 -->
<div role="toolbar">
  <button>工具一</button>
  <button>工具二</button>
</div>
```

### 动态更新管理

正确处理 ARIA 状态的动态变化。

代码示例：
```javascript
class AccessibleComponent {
  constructor(element) {
    this.element = element;
    this.updateAriaAttributes();
  }
  
  updateAriaAttributes() {
    // 根据组件状态更新ARIA
    const isExpanded = this.element.classList.contains('expanded');
    this.element.setAttribute('aria-expanded', isExpanded);
    
    const isDisabled = this.element.disabled;
    this.element.setAttribute('aria-disabled', isDisabled);
  }
  
  // 使用MutationObserver监听变化
  observeChanges() {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes') {
          this.updateAriaAttributes();
        }
      });
    });
    
    observer.observe(this.element, {
      attributes: true,
      attributeFilter: ['class', 'disabled']
    });
  }
}
```

## 测试和调试

### 屏幕阅读器测试

使用不同屏幕阅读器验证 ARIA 实现。

测试流程：
```
1. NVDA + Firefox: 检查角色宣布
2. VoiceOver + Safari: 验证交互状态
3. JAWS + Chrome: 测试键盘导航
```

### 开发者工具检查

使用浏览器开发者工具检查可访问性树。

代码示例：
```html
<div role="navigation" aria-label="侧边栏导航">
  <ul role="list">
    <li role="listitem"><a href="#">链接一</a></li>
  </ul>
</div>
```

浏览器工具显示：
```
可访问性树:
navigation: "侧边栏导航"
  list: ""
    listitem: ""
      link: "链接一"
```

### 自动化测试

使用工具验证 ARIA 使用正确性。

代码示例 (使用 axe-core)：
```javascript
// ARIA规则测试
axe.run(document, {
  rules: {
    'aria-valid-attr': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-required-parent': { enabled: true },
    'aria-required-children': { enabled: true }
  }
}, (err, results) => {
  if (err) throw err;
  
  results.violations.forEach(violation => {
    console.log('ARIA违规:', violation.description);
    violation.nodes.forEach(node => {
      console.log('问题节点:', node.html);
      console.log('修复建议:', node.any.map(fix => fix.message));
    });
  });
});
```

### ARIA 属性验证函数

自定义验证工具检查常见错误。

代码示例：
```javascript
function validateAriaUsage(element) {
  const issues = [];
  
  // 检查无效属性
  const validAttrs = [
    'role', 'aria-label', 'aria-labelledby', 'aria-describedby',
    'aria-hidden', 'aria-disabled', 'aria-expanded', 'aria-pressed',
    // ... 其他有效属性
  ];
  
  Array.from(element.attributes).forEach(attr => {
    if (attr.name.startsWith('aria-') && !validAttrs.includes(attr.name)) {
      issues.push(`无效ARIA属性: ${attr.name}`);
    }
  });
  
  // 检查必需属性
  const role = element.getAttribute('role');
  if (role === 'button' && !element.hasAttribute('tabindex')) {
    issues.push('自定义按钮需要tabindex属性');
  }
  
  // 检查关系完整性
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy && !document.getElementById(labelledBy)) {
    issues.push(`aria-labelledby指向不存在的元素: ${labelledBy}`);
  }
  
  return issues;
}
```