# 无障碍简介

## 什么是无障碍

无障碍（Accessibility）指数字产品和服务能被所有人平等访问和使用，包括残障人士。在Web和软件领域，它确保界面支持辅助技术（如屏幕阅读器、语音识别工具），遵循可访问性标准。核心目标是消除访问障碍，例如视觉、听觉、运动或认知障碍用户可能遇到的困难。

示意图：一个标准网页按钮的无障碍支持  
```
[视觉界面] 按钮显示为 "提交"  
[屏幕阅读器] 读取: "提交按钮"  
[键盘导航] 通过Tab键聚焦: [焦点框环绕按钮]  
```
这体现了多模态交互：视觉元素被转换为语音和键盘事件，确保不同用户都能感知和操作。

## 无障碍的重要性

无障碍不仅是法律要求（如美国《康复法案》第508条或欧盟《欧洲无障碍法案》），更是道德和商业最佳实践。原理基于包容性设计：通过适配多样用户能力，提升整体用户体验。特点包括：
- **平等性**：所有人享有相同访问权。
- **兼容性**：与辅助技术无缝协作。
- **可维护性**：遵循标准代码更易扩展。

示意图：无障碍缺失的影响  
```
用户尝试点击小按钮 -> 运动障碍用户无法精确点击 -> 任务失败  
修复后: 按钮增大 + 键盘支持 -> 用户通过Enter键激活 -> 任务成功  
```
这展示了无障碍如何通过设计补偿用户限制。

## 核心原则与原理

基于WCAG（Web Content Accessibility Guidelines）指南，原则分为四类：
1. **可感知**：信息必须可被用户感知。例如，提供文本替代非文本内容。
2. **可操作**：界面组件必须可操作。例如，支持键盘导航和语音输入。
3. **可理解**：内容和操作必须清晰易懂。例如，使用一致导航和错误提示。
4. **健壮**：内容必须与当前和未来工具兼容。例如，使用标准HTML和ARIA。

原理细节：屏幕阅读器解析页面时，依赖DOM结构和ARIA属性生成语音输出。  
示意图：  
```
HTML: <div role="button" tabindex="0">点击我</div>  
解析流程: DOM -> 可访问性树 -> 屏幕阅读器语音: "按钮, 点击我"  
```
键盘导航原理：通过Tab键遍历可聚焦元素，顺序由DOM顺序或tabindex定义。

## 技术实现细节

### 语义HTML
使用原生HTML元素提供内置无障碍支持。例如，`<button>`元素自动具有按钮角色和键盘事件。  
代码示例：
```html
<!-- 良好实践：语义按钮 -->
<button onclick="submitForm()">提交表单</button>

<!-- 不良实践：div模拟按钮需额外工作 -->
<div onclick="submitForm()" tabindex="0" role="button">提交表单</div>
```
特点：语义HTML减少代码量，提升兼容性。原理：浏览器将元素映射到可访问性API，如Windows的UI Automation。

### ARIA（Accessible Rich Internet Applications）
ARIA通过角色（roles）、状态（states）和属性（properties）增强动态内容的无障碍性。  
原理：ARIA属性修改可访问性树，而不改变视觉表现，辅助技术据此调整输出。  
代码示例：
```html
<!-- 定义自定义进度条 -->
<div role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100">
  进度: 75%
</div>
```
示意图：  
```
视觉显示: [=====     ] 75%  
屏幕阅读器读取: "进度条, 75%"
```

### 键盘导航
确保所有功能可通过键盘访问。原理：焦点管理通过DOM顺序或程序化控制实现。  
代码示例：
```javascript
// 添加键盘事件支持自定义组件
document.getElementById('custom-modal').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal(); // Esc键关闭模态框
  if (e.key === 'Tab') trapFocus(e); // 限制焦点在模态框内
});
```
示意图：  
```
键盘Tab顺序: 链接1 -> 链接2 -> 按钮 -> 输入框  
焦点指示器: [焦点高亮环绕当前元素]
```

### 颜色与对比度
文本和背景颜色对比度至少4.5:1（WCAG AA级），确保低视力用户可读。  
原理：使用 luminance 公式计算对比度，工具自动检测。  
代码示例：
```css
/* 高对比度样式 */
.button {
  background-color: #0056b3; /* 深蓝 */
  color: #ffffff; /* 白色 */
  border: 2px solid #000000; /* 增加边框提升可视性 */
}
```
示意图：  
```
低对比度: 浅灰文字 on 白色背景 -> 难以辨认  
高对比度: 黑色文字 on 白色背景 -> 清晰可读
```

### 多媒体无障碍
为音频和视频提供替代内容。原理：同步文本替代允许听觉障碍用户访问信息。  
代码示例：
```html
<video controls>
  <source src="tutorial.mp4" type="video/mp4">
  <track src="captions.vtt" kind="captions" srclang="en" label="English">
</video>
```
示意图：  
```
视频播放 + 字幕:  
[视频帧] 人物说话  
[字幕文本] "欢迎访问本教程"
```

## API与工具示例

### 使用Web Accessibility API
JavaScript API允许动态更新无障碍属性。  
代码示例：
```javascript
// 更新ARIA属性以反映状态变化
const liveRegion = document.getElementById('status-message');
liveRegion.setAttribute('aria-live', 'polite'); // 屏幕阅读器自动宣读更新
liveRegion.textContent = '数据加载完成'; // 辅助技术会读取此变更
```

### 测试与验证
使用开发者工具和库进行无障碍测试。  
代码示例（使用axe-core测试库）：
```javascript
// 集成axe-core进行自动化测试
const axe = require('axe-core');
axe.run(document, (err, results) => {
  if (err) throw err;
  console.log(results.violations); // 输出无障碍违规
});
```
示意图：  
```
测试流程: 代码扫描 -> 检测低对比度/缺失标签 -> 报告问题列表  
工具输出: [错误: 按钮缺少aria-label, 建议: 添加描述]
```