# Vue2 Slot

Vue2 插槽是组件的一个核心特性，允许组件接收模板内容，实现内容分发和组合。

## 插槽基本概念

插槽是组件内部的占位符，父组件可以在这个占位符中插入任何模板内容。

```
组件结构示意图:
+-----------------------+
| 子组件                |
| +-------------------+ |
| |  <slot></slot>    | | ← 插槽占位符
| +-------------------+ |
+-----------------------+

父组件使用:
+-----------------------+
| 父组件                |
| +-------------------+ |
| |   <子组件>        | |
| |     内容          | | ← 插入的内容
| |   </子组件>       | |
| +-------------------+ |
+-----------------------+

渲染结果:
+-----------------------+
| 子组件                |
| +-------------------+ |
| |     内容          | | ← 替换插槽
| +-------------------+ |
+-----------------------+
```

## 默认插槽

最基本的插槽类型，当父组件没有提供内容时显示默认内容。

### 子组件定义

```javascript
Vue.component('alert-box', {
  template: `
    <div class="alert-box">
      <strong>注意!</strong>
      <slot>
        这是默认内容，当父组件没有提供内容时显示
      </slot>
    </div>
  `
})
```

### 父组件使用

```html
<!-- 使用默认内容 -->
<alert-box></alert-box>

<!-- 提供自定义内容 -->
<alert-box>
  这里是自定义的警告信息
</alert-box>
```

## 具名插槽

当组件需要多个插槽时，使用具名插槽来区分不同的插槽位置。

### 子组件定义

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

### 父组件使用

```html
<base-layout>
  <template v-slot:header>
    <h1>这里是页面标题</h1>
  </template>

  <p>这里是主要内容，会插入到默认插槽中</p>
  <p>另一段主要内容</p>

  <template v-slot:footer>
    <p>这里是页脚信息</p>
  </template>
</base-layout>
```

### 具名插槽缩写

```html
<base-layout>
  <template #header>
    <h1>页面标题</h1>
  </template>

  <p>主要内容</p>

  <template #footer>
    <p>页脚信息</p>
  </template>
</base-layout>
```

## 作用域插槽

让父组件能够访问子组件中的数据，实现更灵活的模板定制。

### 子组件定义

```javascript
Vue.component('todo-list', {
  data() {
    return {
      todos: [
        { id: 1, text: '学习 Vue', isComplete: true },
        { id: 2, text: '学习 JavaScript', isComplete: false },
        { id: 3, text: '学习 CSS', isComplete: false }
      ]
    }
  },
  template: `
    <ul>
      <li v-for="todo in todos" :key="todo.id">
        <slot :todo="todo" :index="$index">
          {{ todo.text }}
        </slot>
      </li>
    </ul>
  `
})
```

### 父组件使用

```html
<todo-list>
  <template v-slot:default="slotProps">
    <span :class="{ complete: slotProps.todo.isComplete }">
      {{ slotProps.todo.text }}
    </span>
    <button v-if="!slotProps.todo.isComplete">
      标记完成
    </button>
  </template>
</todo-list>
```

### 解构插槽 Prop

```html
<todo-list>
  <template v-slot:default="{ todo, index }">
    <span>第 {{ index + 1 }} 项: {{ todo.text }}</span>
  </template>
</todo-list>
```

## 独占默认插槽的缩写语法

当只有默认插槽时，可以直接在组件上使用作用域插槽语法。

### 子组件

```javascript
Vue.component('current-user', {
  data() {
    return {
      user: {
        firstName: '张',
        lastName: '三',
        email: 'zhangsan@example.com'
      }
    }
  },
  template: `
    <span>
      <slot :user="user">
        {{ user.lastName }}
      </slot>
    </span>
  `
})
```

### 父组件使用

```html
<!-- 常规写法 -->
<current-user>
  <template v-slot:default="slotProps">
    {{ slotProps.user.firstName }} {{ slotProps.user.lastName }}
  </template>
</current-user>

<!-- 缩写写法 -->
<current-user v-slot="slotProps">
  {{ slotProps.user.firstName }} {{ slotProps.user.lastName }}
</current-user>

<!-- 解构写法 -->
<current-user v-slot="{ user }">
  {{ user.firstName }} {{ user.lastName }}
</current-user>
```

## 动态插槽名

使用动态指令参数定义动态插槽名。

```html
<base-layout>
  <template v-slot:[dynamicSlotName]>
    <!-- 动态插槽内容 -->
  </template>
</base-layout>
```

```javascript
data() {
  return {
    dynamicSlotName: 'header'
  }
}
```

## 插槽高级用法

### 嵌套插槽

```javascript
Vue.component('card-component', {
  template: `
    <div class="card">
      <div class="card-header">
        <slot name="header"></slot>
      </div>
      <div class="card-body">
        <slot name="body"></slot>
      </div>
    </div>
  `
})

Vue.component('user-card', {
  template: `
    <card-component>
      <template #header>
        <slot name="user-header"></slot>
      </template>
      <template #body>
        <slot name="user-body"></slot>
      </template>
    </card-component>
  `
})
```

### 条件插槽

```javascript
Vue.component('conditional-slot', {
  props: ['showSlot'],
  template: `
    <div>
      <slot v-if="showSlot" name="conditional"></slot>
      <slot v-else name="fallback"></slot>
    </div>
  `
})
```

### 列表渲染插槽

```javascript
Vue.component('data-table', {
  props: ['items'],
  template: `
    <table>
      <thead>
        <slot name="header"></slot>
      </thead>
      <tbody>
        <tr v-for="(item, index) in items" :key="item.id">
          <slot name="row" :item="item" :index="index"></slot>
        </tr>
      </tbody>
    </table>
  `
})
```

```html
<data-table :items="users">
  <template #header>
    <tr>
      <th>姓名</th>
      <th>邮箱</th>
      <th>操作</th>
    </tr>
  </template>
  
  <template #row="{ item, index }">
    <tr>
      <td>{{ item.name }}</td>
      <td>{{ item.email }}</td>
      <td>
        <button @click="editUser(item)">编辑</button>
      </td>
    </tr>
  </template>
</data-table>
```

## 插槽作用域规则

父级模板里的所有内容都是在父级作用域中编译的，子模板里的所有内容都是在子作用域中编译的。

```
作用域示意图:
父模板 → 父作用域数据
        ↓
插槽内容 → 仍访问父作用域
        ↓  
子模板 → 子作用域数据 (通过作用域插槽暴露给父级)
```

```html
<!-- 父组件 -->
<div>
  <child-component>
    <!-- 这里访问的是父组件的数据 -->
    {{ parentData }}
    
    <!-- 通过作用域插槽访问子组件数据 -->
    <template v-slot:default="slotProps">
      {{ slotProps.childData }}
    </template>
  </child-component>
</div>
```

## 插槽性能提示

- 插槽内容在父组件中编译，有更高的性能开销
- 作用域插槽可以实现更灵活的组件设计
- 合理使用具名插槽提高代码可读性
- 动态插槽名提供更大的灵活性