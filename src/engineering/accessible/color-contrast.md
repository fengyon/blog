# 色彩与对比度

## 色彩无障碍的重要性

色彩无障碍确保信息不仅通过颜色传递，而且有足够的对比度让所有用户 (包括色盲、低视力用户) 能够区分内容和交互元素。核心原理是：视觉信息必须不依赖颜色作为唯一传达手段，同时满足最低对比度要求。

示意图：

```
依赖颜色: 🔴红色 + 🟢绿色 → 色盲用户无法区分
增强设计: 🔴●红色 + 🟢■绿色 + 文字标签 → 所有用户可区分
```

## 对比度标准与原理

### WCAG 对比度要求

Web 内容无障碍指南 (WCAG) 定义了明确的对比度标准：

- **AA 级** (最低要求)：

  - 正常文本：4.5:1
  - 大文本 (18pt+或 14pt+粗体)：3:1
  - 用户界面组件：3:1

- **AAA 级** (增强要求)：
  - 正常文本：7:1
  - 大文本：4.5:1

对比度计算原理：

```
对比度 = (L1 + 0.05) / (L2 + 0.05)
其中L1和L2是颜色的相对亮度（0-1范围）
相对亮度基于sRGB色彩空间和人眼感知
```

### 相对亮度计算

代码示例 (JavaScript 实现)：

```javascript
function getLuminance(r, g, b) {
  // 将sRGB颜色转换到线性RGB
  const [rLin, gLin, bLin] = [r, g, b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })

  // 计算相对亮度
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin
}

function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(...color1)
  const lum2 = getLuminance(...color2)

  const brighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (brighter + 0.05) / (darker + 0.05)
}

// 示例：计算白色和黑色的对比度
const white = [255, 255, 255]
const black = [0, 0, 0]
console.log(getContrastRatio(white, black)) // 输出: 21:1
```

## 色彩使用原则

### 不依赖颜色传递信息

确保信息通过多种方式传达，不单独依赖颜色差异。

代码示例 (表单验证)：

```html
<!-- 不良实践：仅用颜色表示状态 -->
<div class="status" style="color: red">错误</div>

<!-- 良好实践：颜色+图标+文字 -->
<div class="status" role="alert">
  <span aria-hidden="true">❌</span>
  <span>错误：请输入有效的邮箱地址</span>
</div>
```

示意图：

```
状态指示:
仅颜色: 红色文本 "状态" → 色盲用户无法识别
多模式: ❌ "错误状态" + 红色 → 所有用户都能理解
```

### 焦点状态对比度

确保焦点指示器与背景有足够对比度。

代码示例：

```css
/* 基础焦点样式 */
button:focus {
  outline: 2px solid #0056b3; /* 对比度检查: 4.8:1 通过 */
  outline-offset: 2px;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  button:focus {
    outline: 3px solid #000000; /* 对比度: 21:1 */
    outline-offset: 1px;
  }
}

/* 自定义焦点样式 */
.custom-button:focus {
  box-shadow: 0 0 0 3px #0056b3, 0 0 0 1px #ffffff;
}
```

## 色彩对比度实践

### 文本对比度

确保所有文本内容满足最低对比度要求。

代码示例：

```css
/* 通过AA级标准 */
.text-aa {
  color: #767676; /* 灰色文本 */
  background-color: #ffffff; /* 白色背景 */
  /* 对比度: 4.54:1 ✓ */
}

/* 通过AAA级标准 */
.text-aaa {
  color: #595959; /* 深灰文本 */
  background-color: #ffffff;
  /* 对比度: 7.01:1 ✓ */
}

/* 大文本较低要求 */
.large-text {
  font-size: 24px;
  color: #949494; /* 中灰色 */
  background-color: #ffffff;
  /* 对比度: 3.02:1 ✓ (大文本AA级) */
}
```

对比度示意图：

```
文本对比度示例:
低对比度: #CCCCCC on #FFFFFF → 1.6:1 ✗ (难以阅读)
AA级:    #767676 on #FFFFFF → 4.5:1 ✓
AAA级:   #595959 on #FFFFFF → 7.0:1 ✓
```

### 用户界面组件

按钮、输入框等交互元素需要足够的对比度。

代码示例：

```css
/* 按钮状态对比度 */
.btn {
  background-color: #0056b3; /* 深蓝 */
  color: #ffffff; /* 白色 */
  border: 2px solid #003d82;
  /* 文本对比度: 7.43:1 ✓ */
  /* 边框对比度: 3.02:1 ✓ */
}

.btn:hover {
  background-color: #003d82;
  /* 悬停状态保持足够对比度 */
}

.btn:disabled {
  background-color: #cccccc;
  color: #666666;
  /* 禁用状态对比度: 4.02:1 ✓ */
}

/* 输入框对比度 */
.input-field {
  border: 2px solid #767676;
  background-color: #ffffff;
  color: #000000;
  /* 文本对比度: 21:1 ✓ */
  /* 边框对比度: 4.54:1 ✓ */
}
```

## 色盲友好的色彩选择

### 常见色盲类型

- **红色盲**：难以区分红色和绿色
- **绿色盲**：难以区分绿色和红色
- **蓝色盲**：难以区分蓝色和黄色
- **全色盲**：只能看到灰度

示意图：

```
正常视觉: 🔴 🟢 🟡 🔵
红色盲:   🟤 🟤 🟡 🔵 (红绿变棕色)
绿色盲:   🟤 🟤 🟡 🔵 (红绿变棕色)
全色盲:   ⚫ ⚫ ⚫ ⚫ (全部灰度)
```

### 色盲安全调色板

选择在多种色盲类型下都可区分的颜色。

代码示例 (CSS 变量定义)：

```css
:root {
  /* 色盲安全颜色 */
  --color-primary: #1f77b4; /* 蓝色 */
  --color-secondary: #ff7f0e; /* 橙色 */
  --color-success: #2ca02c; /* 绿色 */
  --color-warning: #d62728; /* 红色 */
  --color-info: #9467bd; /* 紫色 */

  /* 确保足够的亮度差异 */
  --color-text: #333333;
  --color-background: #ffffff;
  --color-border: #cccccc;
}

.chart-item-1 {
  fill: var(--color-primary);
  stroke: var(--color-text);
}

.chart-item-2 {
  fill: var(--color-secondary);
  stroke: var(--color-text);
}
```

## 高对比度模式支持

### 检测高对比度偏好

使用 CSS 媒体查询适配高对比度模式。

代码示例：

```css
/* 基础样式 */
.button {
  background-color: #0056b3;
  color: #ffffff;
  border: 1px solid #003d82;
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .button {
    background-color: #000000;
    color: #ffffff;
    border: 2px solid #ffffff;
  }
}

/* 强制颜色模式 */
@media (forced-colors: active) {
  .button {
    background-color: ButtonFace;
    color: ButtonText;
    border-color: ButtonText;
  }
}
```

### 系统颜色使用

在强制颜色模式下使用系统定义的颜色。

代码示例：

```css
.custom-element {
  /* 基础样式 */
  background-color: #f0f0f0;
  color: #333333;

  /* 强制颜色模式适配 */
  @media (forced-colors: active) {
    background-color: Canvas;
    color: CanvasText;
    border: 1px solid ButtonText;
  }
}
```

## 动态对比度调整

### JavaScript 对比度检查

使用 API 动态验证和调整对比度。

代码示例：

```javascript
class ContrastChecker {
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : null
  }

  static getContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(...color1)
    const lum2 = this.getLuminance(...color2)
    return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05)
  }

  static checkElementContrast(element) {
    const style = getComputedStyle(element)
    const bgColor = this.hexToRgb(style.backgroundColor)
    const textColor = this.hexToRgb(style.color)

    if (bgColor && textColor) {
      const ratio = this.getContrastRatio(textColor, bgColor)
      const fontSize = parseInt(style.fontSize)
      const fontWeight = parseInt(style.fontWeight)

      const isLargeText =
        fontSize >= 24 || (fontSize >= 18.5 && fontWeight >= 700)
      const minRatio = isLargeText ? 3 : 4.5

      return {
        ratio: Math.round(ratio * 100) / 100,
        meetsAA: ratio >= minRatio,
        meetsAAA: ratio >= (isLargeText ? 4.5 : 7),
        isLargeText,
      }
    }
    return null
  }
}

// 使用示例
const result = ContrastChecker.checkElementContrast(
  document.querySelector('.text-element'),
)
console.log(
  `对比度: ${result.ratio}:1, AA级: ${result.meetsAA ? '通过' : '失败'}`,
)
```

### 实时对比度调整

根据背景色自动调整文本颜色。

代码示例：

```javascript
function adjustTextColorForBackground(element) {
  const bgColor = getComputedStyle(element).backgroundColor
  const rgb = bgColor.match(/\d+/g).map(Number)

  // 计算背景亮度
  const luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]

  // 根据亮度选择文本颜色
  element.style.color = luminance > 128 ? '#000000' : '#ffffff'
}

// 监听背景色变化
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (
      mutation.type === 'attributes' &&
      mutation.attributeName === 'style'
    ) {
      adjustTextColorForBackground(mutation.target)
    }
  })
})
```

## 测试与验证工具

### 自动化测试

使用工具进行对比度检查。

代码示例 (使用 axe-core)：

```javascript
// 使用axe-core进行对比度测试
const axe = require('axe-core')

axe.run(
  document,
  {
    rules: {
      'color-contrast': { enabled: true },
    },
  },
  (err, results) => {
    if (err) throw err

    results.violations.forEach((violation) => {
      if (violation.id === 'color-contrast') {
        violation.nodes.forEach((node) => {
          console.log('对比度违规:', node.html)
          console.log(
            '预期对比度:',
            node.any[0].data.expectedContrastRatio,
          )
          console.log('实际对比度:', node.any[0].data.contrastRatio)
        })
      }
    })
  },
)
```

### 浏览器开发工具

使用浏览器内置工具检查对比度。

示意图：

```
Chrome DevTools 检查流程:
1. 右键点击元素 → 检查
2. 在Styles面板点击颜色预览
3. 查看对比度比率和WCAG等级
4. 调整颜色实时预览效果
```

### 视觉模拟测试

模拟各种视觉条件测试色彩可用性。

代码示例 (色盲模拟)：

```css
/* 红色盲模拟滤镜 */
.protanopia-simulation {
  filter: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><filter id="protanopia"><feColorMatrix values="0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0"/></filter></svg>#protanopia');
}

/* 绿色盲模拟滤镜 */
.deuteranopia-simulation {
  filter: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><filter id="deuteranopia"><feColorMatrix values="0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0"/></filter></svg>#deuteranopia');
}
```

## 设计系统集成

### CSS 自定义属性策略

在设计中系统化管理色彩对比度。

代码示例：

```css
:root {
  /* 基础色彩令牌 */
  --color-primary-50: #f0f9ff;
  --color-primary-500: #0ea5e9;
  --color-primary-900: #0c4a6e;

  /* 语义色彩令牌 */
  --color-text-primary: var(--color-gray-900);
  --color-text-secondary: var(--color-gray-600);
  --color-background: #ffffff;

  /* 对比度安全组合 */
  --color-combination-1: var(--color-primary-500) on var(
      --color-background
    );
  /* 对比度: 4.6:1 ✓ */
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #1a1a1a;
    --color-text-primary: #ffffff;
    /* 确保暗色模式下对比度仍然达标 */
  }
}
```
