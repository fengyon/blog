# 键盘无障碍

## 什么是键盘无障碍

键盘无障碍是指所有网站功能和交互都能通过键盘独立完成，不依赖鼠标或其他指点设备。这是 Web 无障碍的核心要求，服务于运动障碍用户、盲人用户和高效键盘用户。

示意图：

```
鼠标用户: 点击按钮 → 执行操作
键盘用户: Tab到按钮 → 按Enter/Space → 执行操作
```

核心原理：键盘导航通过焦点管理系统，让用户按逻辑顺序遍历所有交互元素，使用标准键或自定义快捷键激活功能。

## 键盘导航基础

### 焦点与焦点指示器

焦点是键盘导航中当前选中的界面元素，焦点指示器是显示焦点位置的视觉反馈。

代码示例：

```html
<button class="focused">提交</button>
```

CSS 焦点样式：

```css
/* 默认焦点样式 */
button:focus {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}

/* 高对比度支持 */
@media (prefers-contrast: high) {
  button:focus {
    outline: 3px solid #000000;
  }
}

/* 自定义焦点样式 */
.custom-button:focus {
  box-shadow: 0 0 0 3px rgba(0, 95, 204, 0.5);
  border-color: #005fcc;
}
```

示意图：

```
焦点移动: [按钮1] → Tab → [按钮2] (带焦点环) → Tab → [链接1]
视觉反馈: 蓝色轮廓环围绕当前焦点元素
```

### 标准键盘导航模式

不同操作系统和浏览器的键盘导航行为基本一致：

```
Tab键: 向前移动到下一个可聚焦元素
Shift+Tab: 向后移动到上一个可聚焦元素
Enter/Space: 激活按钮、链接等元素
箭头键: 在组件内导航（单选按钮、菜单等）
Esc: 关闭模态框、弹出层
```

## 焦点管理原理

### 焦点顺序

焦点顺序由 DOM 顺序和 tabindex 属性共同决定。

代码示例：

```html
<button tabindex="0">按钮A</button>
<div tabindex="0">自定义焦点元素</div>
<button tabindex="1">优先焦点按钮</button>
<button tabindex="0">按钮B</button>
<button tabindex="-1">编程焦点元素</button>
```

焦点顺序示意图：

```
tabindex="1" → tabindex="0" (按DOM顺序) → 跳过tabindex="-1"
按钮顺序: [优先焦点按钮] → [按钮A] → [自定义焦点元素] → [按钮B]
```

### tabindex 属性详解

```html
<!-- 自然焦点顺序 (默认) -->
<button>按钮</button>
<!-- tabindex="0" 隐式 -->

<!-- 显式包含在焦点顺序 -->
<div tabindex="0">可聚焦div</div>

<!-- 优先焦点 (避免使用) -->
<span tabindex="1">不推荐</span>

<!-- 编程焦点，不在自然顺序 -->
<div tabindex="-1" id="programmatic-focus">编程控制</div>
```

JavaScript 焦点控制：

```javascript
// 设置焦点
document.getElementById('programmatic-focus').focus()

// 焦点陷阱（模态框内）
function trapFocus(modalElement) {
  const focusableElements = modalElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  modalElement.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
  })
}
```

## 原生 HTML 元素的键盘支持

### 表单控件

不同表单元素有特定的键盘交互模式。

代码示例：

```html
<!-- 文本输入 -->
<input type="text" placeholder="输入姓名" />

<!-- 单选按钮组 -->
<fieldset>
  <legend>选择支付方式</legend>
  <input type="radio" id="credit" name="payment" value="credit" />
  <label for="credit">信用卡</label>

  <input type="radio" id="paypal" name="payment" value="paypal" />
  <label for="paypal">PayPal</label>
</fieldset>

<!-- 下拉选择 -->
<select>
  <option value="1">选项一</option>
  <option value="2">选项二</option>
</select>
```

键盘交互示意图：

```
文本输入: 直接输入文字
单选按钮: ↓/→ 下一个选项, ↑/← 上一个选项
下拉菜单: ↓ 打开, ↑/↓ 选择选项, Enter 确认
```

### 交互元素

按钮、链接等基础交互元素的键盘行为。

代码示例：

```html
<!-- 按钮 -->
<button onclick="submitForm()">提交</button>

<!-- 链接 -->
<a href="/about">关于我们</a>

<!-- 详情折叠 -->
<details>
  <summary>更多信息</summary>
  <p>详细内容...</p>
</details>
```

键盘行为：

```
按钮: Enter/Space 激活
链接: Enter 跳转
详情折叠: Enter/Space 切换展开状态
```

## 自定义组件的键盘无障碍

### 自定义按钮

使用 JavaScript 增强自定义元素的键盘交互。

代码示例：

```html
<div
  class="custom-button"
  role="button"
  tabindex="0"
  onclick="handleClick()"
  onkeydown="handleKeydown(event)"
>
  自定义按钮
</div>
```

JavaScript 实现：

```javascript
function handleKeydown(event) {
  // 支持Enter和Space激活
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault() // 防止Space滚动页面
    handleClick()
  }
}

function handleClick() {
  // 按钮点击逻辑
  console.log('按钮被激活')
}
```

### 自定义下拉菜单

实现完整的键盘导航模式。

代码示例：

```html
<div class="custom-select">
  <button
    id="select-button"
    aria-haspopup="listbox"
    aria-expanded="false"
    onkeydown="handleSelectKeydown(event)"
  >
    选择选项
  </button>
  <ul
    id="select-list"
    role="listbox"
    aria-labelledby="select-button"
    hidden
  >
    <li role="option" tabindex="-1">选项一</li>
    <li role="option" tabindex="-1">选项二</li>
    <li role="option" tabindex="-1">选项三</li>
  </ul>
</div>
```

JavaScript 实现：

```javascript
function handleSelectKeydown(event) {
  const list = document.getElementById('select-list')
  const options = list.querySelectorAll('[role="option"]')

  switch (event.key) {
    case 'Enter':
    case ' ':
    case 'ArrowDown':
      event.preventDefault()
      list.hidden = false
      options[0].focus()
      break
    case 'ArrowUp':
      event.preventDefault()
      list.hidden = false
      options[options.length - 1].focus()
      break
  }
}

// 选项键盘处理
function handleOptionKeydown(event, index) {
  const options = document.querySelectorAll('[role="option"]')

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      options[(index + 1) % options.length].focus()
      break
    case 'ArrowUp':
      event.preventDefault()
      options[(index - 1 + options.length) % options.length].focus()
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      selectOption(event.target)
      break
    case 'Escape':
      event.preventDefault()
      closeDropdown()
      break
  }
}
```

## 复杂组件的键盘模式

### 模态对话框

模态框需要焦点管理和焦点陷阱。

代码示例：

```html
<div
  id="modal"
  role="dialog"
  aria-labelledby="modal-title"
  aria-modal="true"
>
  <h2 id="modal-title">确认操作</h2>
  <p>您确定要执行此操作吗？</p>
  <div>
    <button onclick="confirmAction()">确认</button>
    <button onclick="closeModal()">取消</button>
  </div>
</div>
```

JavaScript 焦点管理：

```javascript
let previousActiveElement

function openModal() {
  const modal = document.getElementById('modal')
  previousActiveElement = document.activeElement

  // 显示模态框
  modal.style.display = 'block'

  // 焦点陷阱
  trapFocus(modal)

  // 初始焦点
  const firstFocusable = modal.querySelector('button')
  firstFocusable.focus()
}

function closeModal() {
  const modal = document.getElementById('modal')
  modal.style.display = 'none'

  // 恢复焦点
  if (previousActiveElement) {
    previousActiveElement.focus()
  }
}
```

### 标签页组件

实现箭头键导航和 Home/End 支持。

代码示例：

```html
<div role="tablist" aria-label="内容标签">
  <button
    role="tab"
    aria-selected="true"
    aria-controls="panel1"
    id="tab1"
    onkeydown="handleTabKeydown(event, 0)"
  >
    标签一
  </button>
  <button
    role="tab"
    aria-selected="false"
    aria-controls="panel2"
    id="tab2"
    onkeydown="handleTabKeydown(event, 1)"
  >
    标签二
  </button>
</div>

<div role="tabpanel" id="panel1" aria-labelledby="tab1">标签一内容</div>
<div role="tabpanel" id="panel2" aria-labelledby="tab2" hidden>
  标签二内容
</div>
```

键盘处理函数：

```javascript
function handleTabKeydown(event, index) {
  const tabs = document.querySelectorAll('[role="tab"]')

  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault()
      tabs[(index + 1) % tabs.length].focus()
      break
    case 'ArrowLeft':
      event.preventDefault()
      tabs[(index - 1 + tabs.length) % tabs.length].focus()
      break
    case 'Home':
      event.preventDefault()
      tabs[0].focus()
      break
    case 'End':
      event.preventDefault()
      tabs[tabs.length - 1].focus()
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      activateTab(index)
      break
  }
}
```

## 高级键盘导航特性

### 跳过链接

为键盘用户提供跳过重复导航的快捷方式。

代码示例：

```html
<a href="#main-content" class="skip-link">跳到主内容</a>

<nav>...</nav>

<main id="main-content">
  <!-- 页面主要内容 -->
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
  text-decoration: none;
}

.skip-link:focus {
  top: 6px;
}
```

### 键盘快捷键

实现自定义快捷键，避免与浏览器和屏幕阅读器冲突。

代码示例：

```javascript
document.addEventListener('keydown', (event) => {
  // Ctrl+K 聚焦搜索框 (常见模式)
  if (event.ctrlKey && event.key === 'k') {
    event.preventDefault()
    document.getElementById('search-input').focus()
  }

  // ? 打开帮助
  if (event.key === '?' && !event.ctrlKey && !event.altKey) {
    event.preventDefault()
    openHelpDialog()
  }
})
```

ARIA 标注快捷键：

```html
<button aria-keyshortcuts="Shift+S" onclick="openSettings()">设置</button>
```

## 测试键盘无障碍

### 手动测试流程

完整的键盘测试检查清单：

```
1. Tab导航测试
   - 按Tab向前移动焦点
   - 按Shift+Tab向后移动焦点
   - 检查焦点顺序是否合理

2. 焦点指示器测试
   - 每个焦点元素都有可见焦点指示器
   - 焦点环不遮挡内容

3. 组件交互测试
   - 按钮: Enter/Space激活
   - 菜单: 箭头键导航
   - 模态框: Esc关闭，焦点陷阱

4. 跳过链接测试
   - 跳过链接在焦点时可见
   - 正确跳转到目标内容

5. 快捷键测试
   - 自定义快捷键正常工作
   - 不冲突于浏览器快捷键
```

### 自动化测试

使用 JavaScript 检测键盘无障碍问题。

代码示例：

```javascript
// 检查所有交互元素是否可键盘访问
function testKeyboardAccessibility() {
  const interactiveSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ]

  const interactiveElements = document.querySelectorAll(
    interactiveSelectors.join(','),
  )

  interactiveElements.forEach((element) => {
    const style = window.getComputedStyle(element)

    // 检查焦点样式
    if (style.outlineStyle === 'none' && style.outlineWidth === '0px') {
      console.warn('元素缺少可见焦点样式:', element)
    }

    // 检查尺寸（运动障碍用户需要足够大的点击目标）
    const rect = element.getBoundingClientRect()
    if (rect.width < 44 || rect.height < 44) {
      console.warn('交互元素尺寸过小:', element)
    }
  })
}
```

### 开发者工具测试

使用浏览器开发者工具验证焦点顺序：

```
Chrome DevTools:
  1. 打开Elements面板
  2. 运行 document.activeElement 查看当前焦点
  3. 使用 Accessibility面板检查焦点树

Firefox Accessibility Inspector:
  1. 打开Accessibility面板
  2. 查看可访问性树中的焦点顺序
  3. 检查键盘属性
```
