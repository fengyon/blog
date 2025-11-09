# Vue2 Directive

Vue2 指令是带有 v- 前缀的特殊属性，用于在表达式的值改变时响应式地将副作用施加到 DOM。

## 指令基础

指令的职责是当表达式的值改变时，将其产生的连带影响响应式地作用于 DOM。

```
指令结构:
v-指令名:参数.修饰符="值"

示例:
v-on:click.prevent="handleClick"
│    │     │       │
│    │     │       └─ 表达式
│    │     └─ 修饰符
│    └─ 参数
└─ 指令前缀
```

## 内置指令

### v-bind

动态绑定一个或多个属性，或一个组件 prop 到表达式。

```html
<!-- 绑定属性 -->
<img v-bind:src="imageSrc">

<!-- 缩写 -->
<img :src="imageSrc">

<!-- 绑定多个属性 -->
<div v-bind="{ id: someId, class: someClass }"></div>

<!-- 类名绑定 -->
<div :class="{ active: isActive, 'text-danger': hasError }"></div>
<div :class="[activeClass, errorClass]"></div>

<!-- 样式绑定 -->
<div :style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>
<div :style="[baseStyles, overridingStyles]"></div>
```

### v-model

在表单控件或组件上创建双向数据绑定。

```html
<!-- 文本输入 -->
<input v-model="message" placeholder="编辑我">
<p>输入的内容: {{ message }}</p>

<!-- 多行文本 -->
<textarea v-model="message"></textarea>

<!-- 复选框 -->
<input type="checkbox" id="checkbox" v-model="checked">
<label for="checkbox">{{ checked }}</label>

<!-- 多个复选框 -->
<input type="checkbox" value="Jack" v-model="checkedNames">
<input type="checkbox" value="John" v-model="checkedNames">
<input type="checkbox" value="Mike" v-model="checkedNames">

<!-- 单选按钮 -->
<input type="radio" value="One" v-model="picked">
<input type="radio" value="Two" v-model="picked">

<!-- 选择框 -->
<select v-model="selected">
  <option disabled value="">请选择</option>
  <option>A</option>
  <option>B</option>
</select>
```

### v-on

绑定事件监听器，事件类型由参数指定。

```html
<!-- 方法处理器 -->
<button v-on:click="doThis"></button>

<!-- 内联语句 -->
<button v-on:click="doThat('hello', $event)"></button>

<!-- 缩写 -->
<button @click="doThis"></button>

<!-- 事件修饰符 -->
<form @submit.prevent="onSubmit"></form>
<a @click.stop="doThis"></a>
<button @click.once="doThis"></button>

<!-- 按键修饰符 -->
<input @keyup.enter="submit">
<input @keyup.13="submit">
```

### v-if / v-else-if / v-else

根据表达式的值的真假条件渲染元素。

```html
<div v-if="type === 'A'">
  A
</div>
<div v-else-if="type === 'B'">
  B
</div>
<div v-else-if="type === 'C'">
  C
</div>
<div v-else>
  Not A/B/C
</div>
```

### v-show

根据表达式之真假值，切换元素的 display CSS 属性。

```html
<h1 v-show="ok">Hello!</h1>
```

v-if vs v-show 区别：

```
v-if:  条件渲染
       true  -> 元素存在DOM中
       false -> 元素从DOM移除

v-show: 显示切换  
       true  -> display: block
       false -> display: none
```

### v-for

基于源数据多次渲染元素或模板块。

```html
<!-- 数组渲染 -->
<div v-for="(item, index) in items">
  {{ index }}: {{ item.message }}
</div>

<!-- 对象渲染 -->
<div v-for="(value, key, index) in object">
  {{ index }}. {{ key }}: {{ value }}
</div>

<!-- 使用 key -->
<div v-for="item in items" :key="item.id">
  {{ item.text }}
</div>

<!-- 范围迭代 -->
<span v-for="n in 10">{{ n }} </span>
```

### v-text

更新元素的 textContent。

```html
<span v-text="msg"></span>
<!-- 等价于 -->
<span>{{ msg }}</span>
```

### v-html

更新元素的 innerHTML。

```html
<div v-html="htmlContent"></div>
```

### v-pre

跳过这个元素和它的子元素的编译过程。

```html
<span v-pre>{{ 这里不会编译 }}</span>
```

### v-cloak

保持在元素上直到关联实例结束编译，配合 CSS 解决闪动问题。

```html
<div v-cloak>
  {{ message }}
</div>

<style>
[v-cloak] {
  display: none;
}
</style>
```

### v-once

只渲染元素和组件一次，随后的重新渲染被跳过。

```html
<span v-once>这个将不会改变: {{ msg }}</span>
```

## 自定义指令

除了内置指令，Vue 也允许注册自定义指令。

### 指令注册

```javascript
// 全局注册
Vue.directive('focus', {
  inserted: function (el) {
    el.focus()
  }
})

// 局部注册
directives: {
  focus: {
    inserted: function (el) {
      el.focus()
    }
  }
}
```

```html
<input v-focus>
```

### 钩子函数

自定义指令提供多个钩子函数：

```
指令生命周期:
bind - 只调用一次，指令第一次绑定到元素时调用
inserted - 被绑定元素插入父节点时调用
update - 所在组件的 VNode 更新时调用
componentUpdated - 指令所在组件的 VNode 及其子 VNode 全部更新后调用
unbind - 只调用一次，指令与元素解绑时调用
```

### 钩子函数参数

每个钩子函数都有以下参数：
- el：指令所绑定的元素
- binding：包含指令信息的对象
- vnode：Vue 编译生成的虚拟节点
- oldVnode：上一个虚拟节点

```javascript
Vue.directive('demo', {
  bind: function (el, binding, vnode) {
    var s = JSON.stringify
    el.innerHTML =
      'name: '       + s(binding.name) + '<br>' +
      'value: '      + s(binding.value) + '<br>' +
      'expression: ' + s(binding.expression) + '<br>' +
      'argument: '   + s(binding.arg) + '<br>' +
      'modifiers: '  + s(binding.modifiers) + '<br>' +
      'vnode keys: ' + Object.keys(vnode).join(', ')
  }
})
```

### 对象字面量

如果指令需要多个值，可以传入一个 JavaScript 对象字面量。

```html
<div v-demo="{ color: 'white', text: 'hello!' }"></div>
```

```javascript
Vue.directive('demo', function (el, binding) {
  console.log(binding.value.color) // => "white"
  console.log(binding.value.text)  // => "hello!"
})
```

### 函数简写

在很多时候，你可能想在 bind 和 update 时触发相同行为，而不关心其它的钩子。

```javascript
Vue.directive('color-swatch', function (el, binding) {
  el.style.backgroundColor = binding.value
})
```

## 实用自定义指令示例

### 点击外部指令

```javascript
Vue.directive('click-outside', {
  bind: function (el, binding, vnode) {
    el.clickOutsideEvent = function (event) {
      if (!(el == event.target || el.contains(event.target))) {
        vnode.context[binding.expression](event)
      }
    }
    document.body.addEventListener('click', el.clickOutsideEvent)
  },
  unbind: function (el) {
    document.body.removeEventListener('click', el.clickOutsideEvent)
  }
})
```

```html
<div v-click-outside="closeModal">模态框内容</div>
```

### 权限指令

```javascript
Vue.directive('permission', {
  inserted: function (el, binding) {
    const permissions = ['read', 'write', 'delete']
    if (!permissions.includes(binding.value)) {
      el.parentNode && el.parentNode.removeChild(el)
    }
  }
})
```

```html
<button v-permission="'delete'">删除</button>
```

### 复制指令

```javascript
Vue.directive('copy', {
  bind: function (el, binding) {
    el.addEventListener('click', function () {
      const textarea = document.createElement('textarea')
      textarea.value = binding.value
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      
      if (binding.arg === 'callback') {
        vnode.context[binding.expression]()
      }
    })
  }
})
```

```html
<button v-copy="'要复制的文本'">复制</button>
```