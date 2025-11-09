# Angular 模板

## 模板概述

Angular 模板是基于 HTML 的视图定义，通过 Angular 特有的模板语法扩展了标准 HTML，实现动态数据绑定和逻辑控制。

示意图：
```
Angular 模板 = HTML + 模板语法
├── 数据绑定：{{表达式}}、[属性]="值"
├── 事件绑定：(事件)="处理方法"
├── 指令：*ngIf、*ngFor、[ngClass]
└── 管道：{{值 | 管道}}
```

## 插值

插值用于在模板中显示组件属性的值，使用双花括号语法。

示意图：
```
组件属性 → 模板显示
组件: title = "欢迎"
模板: <h1>{{ title }}</h1>
渲染: <h1>欢迎</h1>
```

表达式示例：
```html
<p>当前计数：{{ count }}</p>
<p>计算结果：{{ 2 + 3 }}</p>
<p>方法调用：{{ getMessage() }}</p>
```

## 属性绑定

### 基本属性绑定
将组件属性绑定到 HTML 元素属性。

示意图：
```
组件属性 → [属性绑定] → HTML属性
组件: imageUrl = "logo.png"
模板: <img [src]="imageUrl">
渲染: <img src="logo.png">
```

### 类与样式绑定
动态控制 CSS 类和样式。

示意图：
```
类绑定：
[class.active]="isActive" → isActive为true时添加active类

样式绑定：
[style.color]="textColor" → 动态设置颜色样式
```

示例：
```html
<div [class.highlight]="isImportant" [style.font-size]="fontSize">
  动态样式文本
</div>
```

## 事件绑定

事件绑定用于响应用户操作，如点击、输入等。

示意图：
```
用户操作 → (事件) → 组件方法
模板: <button (click)="onClick()">点击</button>
组件: onClick() { ... }
```

事件参数传递：
```html
<input (input)="onInput($event)">
<!-- $event 包含事件对象 -->
```

## 双向绑定

双向绑定结合属性绑定和事件绑定，实现数据的双向同步。

示意图：
```
组件属性 ↔ 表单输入
组件: userName = "张三"
模板: <input [(ngModel)]="userName">
效果: 输入框显示"张三"，修改输入框内容自动更新组件属性
```

等价写法：
```html
<input [ngModel]="userName" (ngModelChange)="userName = $event">
```

## 结构指令

### *ngIf 条件渲染
根据条件显示或隐藏元素。

示意图：
```
条件为真 → 显示元素
条件为假 → 移除元素

模板: <div *ngIf="isVisible">可见内容</div>
```

else 分支：
```html
<div *ngIf="user; else noUser">
  欢迎，{{ user.name }}
</div>
<ng-template #noUser>
  请先登录
</ng-template>
```

### *ngFor 循环渲染
遍历数组或可迭代对象。

示意图：
```
数组: items = ['A', 'B', 'C']
模板: <li *ngFor="let item of items">{{ item }}</li>
渲染:
<li>A</li>
<li>B</li>
<li>C</li>
```

跟踪标识：
```html
<div *ngFor="let user of users; trackBy: trackById">
  {{ user.name }}
</div>
```

### *ngSwitch 多条件渲染
根据多个条件选择显示不同的内容块。

示意图：
```
当前状态 → 匹配条件 → 显示对应内容

模板结构:
<div [ngSwitch]="status">
  <div *ngSwitchCase="'loading'">加载中...</div>
  <div *ngSwitchCase="'success'">成功</div>
  <div *ngSwitchDefault>未知状态</div>
</div>
```

## 属性指令

### NgClass 动态类管理
根据条件动态添加或移除 CSS 类。

示意图：
```
条件对象 → [ngClass] → 应用的CSS类

组件: { active: true, error: false }
模板: <div [ngClass]="{ active: isActive, error: hasError }">
渲染: <div class="active">
```

### NgStyle 动态样式
动态设置内联样式。

示意图：
```
样式对象 → [ngStyle] → 应用的样式

组件: { color: 'red', 'font-size': '16px' }
模板: <div [ngStyle]="currentStyles">
渲染: <div style="color: red; font-size: 16px;">
```

## 模板引用变量

模板引用变量用于在模板中直接引用 DOM 元素或指令。

示意图：
```
创建引用 → #变量名 → 在模板中使用

模板: <input #emailInput type="email">
     <button (click)="focusInput(emailInput)">聚焦</button>
组件: focusInput(input: HTMLInputElement) { input.focus(); }
```

## 安全导航操作符

安全导航操作符 `?.` 防止在属性路径中出现 null 或 undefined 时出错。

示意图：
```
可能为null的对象 → ?. → 安全访问

模板: {{ user?.address?.street }}
效果: 如果user或address为null，不报错，显示空值
```

对比：
```html
<!-- 可能出错 -->
<p>{{ user.address.street }}</p>

<!-- 安全访问 -->
<p>{{ user?.address?.street }}</p>
```

## 管道

管道用于在模板中转换数据显示格式。

示意图：
```
原始值 → | 管道 → 格式化显示

模板: {{ today | date:'yyyy-MM-dd' }}
原始: Wed Dec 25 2024 10:30:00 GMT+0800
显示: 2024-12-25
```

常用管道：
```html
<p>{{ price | currency:'CNY' }}</p>        <!-- 货币格式 -->
<p>{{ text | uppercase }}</p>              <!-- 大写转换 -->
<p>{{ percentage | percent }}</p>          <!-- 百分比 -->
<p>{{ items | slice:0:3 }}</p>             <!-- 数组切片 -->
```

链式管道：
```html
<p>{{ message | uppercase | slice:0:10 }}</p>
```