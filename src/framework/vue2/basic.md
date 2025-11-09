# Vue2 基础

Vue2 是一个渐进式 JavaScript 框架，用于构建用户界面。它采用基于 HTML 的模板语法，提供声明式渲染和组件化开发能力。

## Vue 实例

每个 Vue 应用都是通过创建 Vue 实例开始的。

示意图：
```
new Vue({
  el: '#app',          // 挂载点
  data: { ... },       // 数据
  methods: { ... },    // 方法
  computed: { ... }    // 计算属性
})
```

示例：
```javascript
var vm = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!'
  },
  methods: {
    showMessage: function() {
      alert(this.message)
    }
  }
})
```

## 模板语法

Vue 使用基于 HTML 的模板语法，允许声明式地将数据绑定到 DOM。

### 插值

```html
<div id="app">
  <span>{{ message }}</span>
  <span v-once>{{ neverChange }}</span>
</div>
```

### 原始 HTML

```html
<div id="app">
  <p>{{ rawHtml }}</p>
  <p><span v-html="rawHtml"></span></p>
</div>
```

## 计算属性

计算属性基于响应式依赖进行缓存，只在相关依赖改变时重新求值。

示意图：
```
数据A  ──> 计算属性 ──> 显示结果
数据B  ──┘
```

示例：
```javascript
computed: {
  reversedMessage: function() {
    return this.message.split('').reverse().join('')
  }
}
```

## 侦听器

侦听器用于观察和响应数据的变化，适合执行异步或开销较大的操作。

示例：
```javascript
watch: {
  message: function(newVal, oldVal) {
    console.log('消息变化:', oldVal, '->', newVal)
  }
}
```

## 条件渲染

### v-if vs v-show

```
v-if:  条件为假时完全移除元素
       true:  [元素存在]
       false: [元素移除]

v-show: 条件为假时只是隐藏元素
       true:  display: block
       false: display: none
```

示例：
```html
<div v-if="type === 'A'">显示A</div>
<div v-else-if="type === 'B'">显示B</div>
<div v-else>显示其他</div>

<div v-show="isVisible">可见内容</div>
```

## 列表渲染

v-for 指令基于数组渲染列表，需要指定 key 属性。

示例：
```html
<ul>
  <li v-for="(item, index) in items" :key="item.id">
    {{ index }} - {{ item.name }}
  </li>
</ul>
```

对象迭代：
```html
<div v-for="(value, key) in object">
  {{ key }}: {{ value }}
</div>
```

## 事件处理

### 方法事件处理器

```html
<button v-on:click="greet">打招呼</button>
```

### 内联处理器

```html
<button v-on:click="say('hi')">说 hi</button>
```

### 事件修饰符

```html
<form v-on:submit.prevent="onSubmit">...</form>
<a v-on:click.stop="doThis">...</a>
```

## 表单输入绑定

v-model 指令在表单元素上创建双向数据绑定。

### 文本输入

```html
<input v-model="message" placeholder="编辑我">
<p>输入的内容: {{ message }}</p>
```

### 复选框

```html
<input type="checkbox" id="checkbox" v-model="checked">
<label for="checkbox">{{ checked }}</label>
```

### 单选按钮

```html
<input type="radio" id="one" value="One" v-model="picked">
<input type="radio" id="two" value="Two" v-model="picked">
<span>选中: {{ picked }}</span>
```

### 选择框

```html
<select v-model="selected">
  <option disabled value="">请选择</option>
  <option>A</option>
  <option>B</option>
</select>
<span>选择: {{ selected }}</span>
```

## 组件基础

### 组件定义

```javascript
Vue.component('button-counter', {
  data: function() {
    return {
      count: 0
    }
  },
  template: '<button v-on:click="count++">点击了 {{ count }} 次</button>'
})
```

### 组件使用

```html
<div id="app">
  <button-counter></button-counter>
  <button-counter></button-counter>
</div>
```

### 通过 Prop 传递数据

```javascript
Vue.component('blog-post', {
  props: ['title'],
  template: '<h3>{{ title }}</h3>'
})
```

```html
<blog-post title="我的博文"></blog-post>
```

### 通过事件传递消息

```javascript
Vue.component('blog-post', {
  template: `
    <div>
      <button v-on:click="$emit('enlarge-text')">
        放大字体
      </button>
    </div>
  `
})
```

```html
<blog-post v-on:enlarge-text="postFontSize += 0.1"></blog-post>
```

## Class 与 Style 绑定

### 对象语法

```html
<div v-bind:class="{ active: isActive, 'text-danger': hasError }"></div>
```

### 数组语法

```html
<div v-bind:class="[activeClass, errorClass]"></div>
```

### 内联样式

```html
<div v-bind:style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>
```