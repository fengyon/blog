# Weex

Weex 是阿里巴巴开源的一款跨平台移动开发框架，允许开发者使用 **Web 技术** (如 JavaScript、Vue.js 等) 来构建高性能的 **Native 级别**移动应用程序。它解决了移动开发中频繁发版和多端研发的痛点，支持一次编写，在 **iOS**、**Android** 和 **Web** 等多端部署。

## 核心概念

Weex 的核心思想是通过 Web 技术来描述界面，并在运行时将其转换为原生组件渲染，从而实现跨平台的一致性体验。

- **组件化开发**：Weex 采用基于组件的开发模式，每个组件由 `<template>`、`<style>` 和 `<script>` 构成。
- **跨平台渲染**：同一套代码，通过不同的 SDK 可以分别渲染为 Native 界面或 Web 界面。
- **数据驱动视图**：采用响应式的数据绑定，当数据发生变化时，视图会自动更新。

架构示意图：
[Weex 文件 (。we/.vue)]
|
| 转换 (Transformer)
|
[JS Bundle] 部署到服务器
|
| 下载
|
[Weex SDK (iOS/Android)] <- JS Bridge -> [JavaScript 引擎]
|
|
[Native 组件渲染]

## 技术架构特点

Weex 的架构设计注重轻量、可扩展和高性能，其核心由三部分组成：

### 分层架构

Weex 的架构清晰分层，各司其职：

```
┌─────────────────────────────────────────┐
│           前端框架层 (Vue.js/Rax)         │
├─────────────────────────────────────────┤
│         JavaScript 运行时环境            │
├─────────────────────────────────────────┤
│                JS Bridge                │
├─────────────────────────────────────────┤
│          Weex SDK (Native)              │
├─────────────────────────────────────────┤
│           原生组件渲染引擎               │
└─────────────────────────────────────────┘
```

### 跨平台特性

Weex 实现了真正的跨平台开发，开发者只需编写一次代码，即可在多端运行。

```
         ┌────────────┐
         │  Weex 代码  │
         └────────────┘
            ↓    ↓
    ┌────────    ────────┐
    ↓                    ↓
┌───────┐            ┌───────┐
│ iOS   │            │ Android│
└───────┘            └───────┘
```

### 原生渲染性能

与 Hybrid 应用不同，Weex 不是通过 WebView 渲染，而是将组件映射为真正的原生组件。

```
Weex 组件 -> 原生组件映射
<container> -> UIView/ViewGroup
<text>      -> UILabel/TextView
<image>     -> UIImageView/ImageView
```

### 响应式界面

Weex 支持数据绑定，当数据发生变化时，视图会自动更新。

```
数据模型: { message: "Hello" }
模板:     <text>{{message}}</text>
渲染:     <text>Hello</text>

当 message 变为 "Hi":
数据模型: { message: "Hi" }
视图自动更新: <text>Hi</text>
```

## 开发环境与工具

### 快速开始

Weex 提供了完整的工具链，帮助开发者快速创建项目：

```bash
# 安装 Weex CLI
npm install -g @weex-cli/core

# 创建新项目
weex create my-project

# 进入项目并运行
cd my-project
npm start
```

### 开发工具

- **Weex Playground**：官方调试工具，支持实时预览和热更新。
- **Weex DevTools**：支持在 Web 端调试 App 端的 JavaScript 代码。
- **dotWe**：在线运行环境，可以快速体验 Weex 的功能。

## 常用 API 及代码示例

Weex 提供了丰富的内置模块，用于访问设备功能和原生组件。以下是一些常用 API 的使用方法。

### 模块调用规范

在 Weex 中调用 API 需要先声明模块：

```javascript
// 声明需要调用的模块
var moduleName = weex.requireModule('moduleName')

// 调用模块方法
moduleName.methodName(options, callback)
```

### 界面交互 API

#### modal 模块

modal 模块提供了消息框功能，包括 toast、alert、confirm 和 prompt。

```javascript
// 获取 modal 模块
var modal = weex.requireModule('modal')

// 1. toast 提示
modal.toast({
  message: '这是一个 toast 提示',
  duration: 0.3,
})

// 2. alert 警告框
modal.alert(
  {
    message: '这是一个警告框',
    okTitle: '确定',
  },
  function () {
    console.log('alert 回调')
  }
)

// 3. confirm 确认框
modal.confirm(
  {
    message: '您确定要执行此操作吗？',
    okTitle: '确定',
    cancelTitle: '取消',
  },
  function (result) {
    console.log('确认框结果:', result)
  }
)

// 4. prompt 输入框
modal.prompt(
  {
    message: '请输入内容：',
    okTitle: '确定',
    cancelTitle: '取消',
  },
  function (result) {
    console.log('输入结果:', result.data)
  }
)
```

#### dom 模块

dom 模块用于操作组件节点，如滚动到指定位置或获取组件信息。

```javascript
// 获取 dom 模块
var dom = weex.requireModule('dom');

// 1. 滚动到指定元素
// 在 template 中给元素设置 ref
// <scroller>
//   <div ref="targetElement">...</div>
// </scroller>
methods: {
  scrollToElement: function() {
    const el = this.$refs.targetElement;
    dom.scrollToElement(el, {
      offset: 0,      // 偏移量
      animated: true  // 是否使用动画
    });
  }
}

// 2. 获取组件布局信息
dom.getComponentRect(this.$refs.targetElement, function(result) {
  if (result.result) {
    console.log('组件位置:', result.size);
    // {
    //   bottom: 60,
    //   height: 15,
    //   left: 0,
    //   right: 353,
    //   top: 45,
    //   width: 353
    // }
  }
});

// 3. 添加自定义字体
dom.addRule('fontFace', {
  'fontFamily': 'iconfont',
  'src': "url('https://at.alicdn.com/t/font_1469606063_76593.ttf')"
});
```

### 导航 API

#### navigator 模块

navigator 模块用于页面跳转和导航。

```javascript
// 获取 navigator 模块
var navigator = weex.requireModule('navigator')

// 跳转到新页面
navigator.push(
  {
    url: 'dist/otherPage.js',
    animated: 'true',
  },
  function (event) {
    console.log('跳转回调:', event)
  }
)

// 返回上一页
navigator.pop(
  {
    animated: 'true',
  },
  function (event) {
    console.log('返回回调:', event)
  }
)
```

### 数据存储 API

#### storage 模块

storage 模块提供了持久化数据存储功能。

```javascript
// 获取 storage 模块
var storage = weex.requireModule('storage')

// 设置数据
storage.setItem('key', 'value', function (result) {
  if (result.result === 'success') {
    console.log('保存成功')
  }
})

// 获取数据
storage.getItem('key', function (result) {
  if (result.result === 'success') {
    console.log('获取的值:', result.data)
  }
})

// 删除数据
storage.removeItem('key', function (result) {
  if (result.result === 'success') {
    console.log('删除成功')
  }
})
```

### 网络请求 API

#### stream 模块

stream 模块用于发起网络请求。

```javascript
// 获取 stream 模块
var stream = weex.requireModule('stream')

// GET 请求
stream.fetch(
  {
    method: 'GET',
    url: 'https://api.example.com/data',
    type: 'json',
  },
  function (response) {
    if (response.status === 200) {
      console.log('请求成功:', response.data)
    } else {
      console.log('请求失败:', response)
    }
  }
)

// POST 请求
stream.fetch(
  {
    method: 'POST',
    url: 'https://api.example.com/data',
    type: 'json',
    body: JSON.stringify({
      key: 'value',
    }),
  },
  function (response) {
    console.log('POST 响应:', response)
  }
)
```

## 开发实践与模式

### 组件开发示例

Weex 组件采用类似 Web 组件的结构，由 `<template>`、`<style>` 和 `<script>` 组成。

```html
<template>
  <div class="container">
    <text class="title">{{title}}</text>
    <image class="image" :src="imageUrl"></image>
    <div class="button" @click="handleClick">
      <text class="button-text">点击我</text>
    </div>
  </div>
</template>

<style>
  .container {
    flex-direction: column;
    align-items: center;
    padding: 40px;
  }
  .title {
    font-size: 48px;
    color: #333333;
    margin-bottom: 40px;
  }
  .image {
    width: 300px;
    height: 300px;
    margin-bottom: 40px;
  }
  .button {
    padding: 20px 40px;
    background-color: #007aff;
    border-radius: 8px;
  }
  .button-text {
    color: #ffffff;
    font-size: 32px;
  }
</style>

<script>
  export default {
    data: {
      title: '欢迎使用 Weex',
      imageUrl: 'https://example.com/image.png',
    },
    methods: {
      handleClick: function () {
        const modal = weex.requireModule('modal')
        modal.toast({
          message: '按钮被点击了!',
          duration: 0.3,
        })
      },
    },
    created: function () {
      // 组件创建时的逻辑
      console.log('组件已创建')
    },
  }
</script>
```

### 事件处理

Weex 支持丰富的事件处理机制：

```html
<template>
  <div>
    <!-- 点击事件 -->
    <div @click="handleClick">
      <text>点击我</text>
    </div>

    <!-- 长按事件 -->
    <div @longpress="handleLongPress">
      <text>长按我</text>
    </div>

    <!-- 输入事件 -->
    <input type="text" @input="handleInput" @change="handleChange" />

    <!-- 滚动事件 -->
    <scroller @scroll="handleScroll">
      <!-- 内容 -->
    </scroller>
  </div>
</template>

<script>
  export default {
    methods: {
      handleClick: function (event) {
        console.log('点击事件:', event)
      },
      handleLongPress: function (event) {
        console.log('长按事件:', event)
      },
      handleInput: function (event) {
        console.log('输入值:', event.value)
      },
      handleChange: function (event) {
        console.log('值改变:', event.value)
      },
      handleScroll: function (event) {
        console.log('滚动位置:', event.contentOffset)
      },
    },
  }
</script>
```

### 条件渲染和列表渲染

```html
<template>
  <div>
    <!-- 条件渲染 -->
    <text v-if="showText">显示文本</text>
    <text v-else>其他文本</text>

    <!-- 列表渲染 -->
    <list :data-items="items">
      <cell v-for="(item, index) in items" :key="index">
        <div class="item">
          <image class="item-image" :src="item.imageUrl"></image>
          <text class="item-title">{{item.title}}</text>
          <text class="item-price">￥{{item.price}}</text>
        </div>
      </cell>
    </list>
  </div>
</template>

<script>
  export default {
    data: {
      showText: true,
      items: [
        {
          imageUrl: 'https://example.com/1.png',
          title: '商品1',
          price: '99.00',
        },
        {
          imageUrl: 'https://example.com/2.png',
          title: '商品2',
          price: '129.00',
        },
      ],
    },
  }
</script>
```

## 优势与局限

### 主要优势

- **高性能体验**：通过原生组件渲染，避免了 WebView 的性能瓶颈，实现流畅的用户体验。
- **开发效率高**：使用熟悉的 Web 技术栈，降低学习成本，支持热加载等调试功能。
- **跨平台一致性**：不同平台的组件与模块保持接口统一，支持动态扩展。
- **轻量级框架**：框架体积小巧，网络传输代价低，初始化成本低。

### 当前局限

- **社区生态相对较小**：相比 React Native 和 Flutter，Weex 的社区和第三方库较少。
- **功能限制**：某些复杂的原生功能可能需要自定义模块开发。
- **调试复杂度**：JavaScript 与原生代码交互调试相对复杂。
