# Vue2 简介

Vue2 是一个渐进式 JavaScript 框架，用于构建用户界面。它专注于视图层，采用基于 HTML 的模板语法，提供响应式数据绑定和组件化开发能力，帮助开发者高效创建交互式 Web 应用。

## 响应式数据绑定

Vue2 的核心是响应式系统：当数据发生变化时，视图自动更新。它通过 Object.defineProperty 实现数据劫持，监听属性变化。

示意图：
```
Data -------> View
  |             |
  | 变化时自动更新 |
  |             |
  v             v
新Data ------> 新View
```

示例：当 data 中的 message 改变，页面中的文本即时刷新。
```html
<div id="app">
  {{ message }}
</div>
<script>
  var app = new Vue({
    el: '#app',
    data: {
      message: 'Hello Vue!'
    }
  })
</script>
```

## 组件系统

组件是可复用的 Vue 实例，允许将 UI 拆分为独立模块。每个组件包含自己的模板、逻辑和样式。

示意图：
```
+-----------------------+
|  根组件               |
|  +-----------------+  |
|  | 子组件A         |  |
|  | +-------------+ |  |
|  | | 孙组件       | |  |
|  | +-------------+ |  |
|  +-----------------+  |
|  +-----------------+  |
|  | 子组件B         |  |
|  +-----------------+  |
+-----------------------+
```

示例：定义一个组件并复用。
```javascript
Vue.component('my-component', {
  template: '<div>自定义组件内容</div>'
})
```

## 模板语法

Vue2 使用基于 HTML 的模板，通过双大插值表达式绑定数据，指令添加特殊属性。

示例：
```html
<div id="app">
  <p>{{ text }}</p>
  <button v-on:click="reverseText">反转文本</button>
</div>
```

## 指令

指令是带有 v- 前缀的特殊属性，用于响应式地操作 DOM。

常见指令：
- v-bind：动态绑定属性，简写为 `:`
- v-model：实现表单输入双向绑定
- v-for：渲染列表
- v-if / v-show：条件渲染
- v-on：监听事件，简写为 `@`

示意图 (v-model 双向绑定)：
```
Input 元素
   ↓
v-model 绑定
   ↓
Data 属性
   ↓
自动同步更新
```

示例：
```html
<input v-model="message">
<p>{{ message }}</p>
```

## 计算属性和侦听器

计算属性 (computed) 用于复杂逻辑计算，缓存结果以提高性能。侦听器 (watch) 用于观察数据变化并执行异步操作。

区别示意图：
```
Data 变化 ---> 计算属性（自动重新计算，缓存结果）
        ---> 侦听器（执行自定义函数）
```

示例：
```javascript
computed: {
  reversedMessage: function () {
    return this.message.split('').reverse().join('')
  }
},
watch: {
  message: function (newVal, oldVal) {
    console.log('消息从', oldVal, '变为', newVal)
  }
}
```

## 生命周期钩子

Vue 实例从创建到销毁会经历一系列生命周期，钩子函数允许在特定阶段执行代码。

生命周期流程图：
```
创建前(beforeCreate)
   ↓
创建完成(created)
   ↓
挂载前(beforeMount)
   ↓
挂载完成(mounted)
   ↓
更新前(beforeUpdate)
   ↓
更新完成(updated)
   ↓
销毁前(beforeDestroy)
   ↓
销毁完成(destroyed)
```

## 事件处理

使用 v-on 指令监听 DOM 事件，触发方法或内联表达式。

示例：
```html
<button v-on:click="handleClick">点击我</button>
```

## 条件渲染

v-if 和 v-show 控制元素显示隐藏。v-if 是条件渲染，v-show 是 CSS 显示切换。

示意图：
```
v-if: 条件为真 -> 元素存在
       条件为假 -> 元素移除

v-show: 条件为真 -> display: block
         条件为假 -> display: none
```

## 列表渲染

v-for 指令基于数组渲染列表，需使用 key 属性标识唯一性。

示例：
```html
<ul>
  <li v-for="item in items" :key="item.id">
    {{ item.name }}
  </li>
</ul>
```

## 表单输入绑定

v-model 在表单元素上创建双向数据绑定，支持输入框、复选框、单选按钮等。

示例：
```html
<input type="text" v-model="inputText">
<select v-model="selected">
  <option value="A">选项A</option>
</select>
```