# Vue2 Component

Vue2 组件是 Vue 应用的核心构建块，允许将 UI 拆分为独立、可复用的代码片段。每个组件都是一个 Vue 实例，拥有自己的模板、数据、方法和生命周期。

## 组件定义

组件可以通过 Vue.component 全局注册或 options 局部注册。

### 全局组件

```javascript
Vue.component('my-component', {
  template: '<div>这是一个自定义组件</div>'
})
```

### 局部组件

```javascript
var ComponentA = {
  template: '<div>组件A</div>'
}

new Vue({
  el: '#app',
  components: {
    'component-a': ComponentA
  }
})
```

## 组件结构

典型的 Vue 组件包含以下部分：

```
组件结构:
+-------------------------------+
| 模板 (template)               |
|  +-------------------------+  |
|  | HTML 结构               |  |
|  +-------------------------+  |
+-------------------------------+
| 数据 (data)                  |
|  +-------------------------+  |
|  | 响应式状态              |  |
|  +-------------------------+  |
+-------------------------------+
| 属性 (props)                 |
|  +-------------------------+  |
|  | 外部传入数据            |  |
|  +-------------------------+  |
+-------------------------------+
| 方法 (methods)               |
|  +-------------------------+  |
|  | 事件处理函数            |  |
|  +-------------------------+  |
+-------------------------------+
```

## Props

Props 是父组件向子组件传递数据的自定义属性。

### Prop 定义

```javascript
Vue.component('blog-post', {
  props: ['title', 'content', 'likes'],
  template: `
    <div class="blog-post">
      <h3>{{ title }}</h3>
      <p>{{ content }}</p>
      <span>点赞数: {{ likes }}</span>
    </div>
  `
})
```

### Prop 使用

```html
<blog-post 
  title="我的博客标题"
  content="博客内容..."
  :likes="42">
</blog-post>
```

### Prop 验证

```javascript
props: {
  title: String,
  likes: Number,
  isPublished: Boolean,
  commentIds: Array,
  author: Object,
  callback: Function,
  contactsPromise: Promise
}
```

## 自定义事件

子组件通过自定义事件向父组件通信。

### 事件发射

```javascript
Vue.component('button-counter', {
  template: `
    <button @click="incrementCounter">
      点击了 {{ count }} 次
    </button>
  `,
  data() {
    return { count: 0 }
  },
  methods: {
    incrementCounter() {
      this.count++
      this.$emit('count-changed', this.count)
    }
  }
})
```

### 事件监听

```html
<button-counter @count-changed="handleCountChange"></button-counter>
```

```javascript
methods: {
  handleCountChange(newCount) {
    console.log('计数变为:', newCount)
  }
}
```

## 组件通信

组件间通信的几种方式：

```
通信方式:
父组件 → 子组件: Props
子组件 → 父组件: 自定义事件
兄弟组件: 事件总线或Vuex
深层嵌套: provide/inject
```

### 事件总线

```javascript
// 创建事件总线
const eventBus = new Vue()

// 组件A - 发送事件
eventBus.$emit('message-sent', 'Hello')

// 组件B - 接收事件
eventBus.$on('message-sent', function(message) {
  console.log('收到消息:', message)
})
```

### provide / inject

```javascript
// 祖先组件
const app = new Vue({
  provide: {
    theme: 'dark'
  }
})

// 后代组件
Vue.component('themed-button', {
  inject: ['theme'],
  template: '<button :class="`btn-${theme}`">主题按钮</button>'
})
```

## 插槽

插槽允许组件接收模板内容，实现内容分发。

### 基本插槽

```javascript
Vue.component('alert-box', {
  template: `
    <div class="alert-box">
      <strong>注意!</strong>
      <slot>默认内容</slot>
    </div>
  `
})
```

```html
<alert-box>
  这里是插槽内容
</alert-box>
```

### 具名插槽

```javascript
Vue.component('base-layout', {
  template: `
    <div class="container">
      <header>
        <slot name="header"></slot>
      </header>
      <main>
        <slot></slot>
      </main>
      <footer>
        <slot name="footer"></slot>
      </footer>
    </div>
  `
})
```

```html
<base-layout>
  <template v-slot:header>
    <h1>页面标题</h1>
  </template>
  
  <p>主要内容</p>
  
  <template v-slot:footer>
    <p>页脚信息</p>
  </template>
</base-layout>
```

### 作用域插槽

```javascript
Vue.component('todo-list', {
  data() {
    return {
      items: ['项目A', '项目B', '项目C']
    }
  },
  template: `
    <ul>
      <li v-for="(item, index) in items">
        <slot :item="item" :index="index"></slot>
      </li>
    </ul>
  `
})
```

```html
<todo-list>
  <template v-slot:default="slotProps">
    <span class="text">{{ slotProps.item }}</span>
    <span class="index">({{ slotProps.index }})</span>
  </template>
</todo-list>
```

## 动态组件

通过 is 特性动态切换不同组件。

```html
<component :is="currentComponent"></component>
```

```javascript
data() {
  return {
    currentComponent: 'home'
  }
},
components: {
  home: { template: '<div>首页</div>' },
  about: { template: '<div>关于</div>' },
  contact: { template: '<div>联系</div>' }
}
```

### keep-alive

保持动态组件状态，避免重新渲染。

```html
<keep-alive>
  <component :is="currentComponent"></component>
</keep-alive>
```

## 异步组件

按需加载组件，提高应用性能。

### 工厂函数

```javascript
Vue.component('async-component', function(resolve, reject) {
  setTimeout(function() {
    resolve({
      template: '<div>异步加载的组件</div>'
    })
  }, 1000)
})
```

### import 语法

```javascript
Vue.component(
  'async-webpack-component',
  () => import('./my-async-component')
)
```

## 组件生命周期

组件特有的生命周期钩子：

```
组件生命周期:
beforeCreate → created → beforeMount → mounted
           ↓
beforeUpdate → updated
           ↓
beforeDestroy → destroyed
```

## 组件边界情况

### 访问根实例

```javascript
this.$root
```

### 访问父组件

```javascript
this.$parent
```

### 访问子组件

```html
<base-input ref="usernameInput"></base-input>
```

```javascript
this.$refs.usernameInput.focus()
```

### 依赖注入

```javascript
// 祖先组件
provide: function() {
  return {
    getMap: this.getMap
  }
}

// 后代组件
inject: ['getMap']
```