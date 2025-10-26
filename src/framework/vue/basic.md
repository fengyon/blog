# Vue 基础

Vue（读作 /vjuː/，类似于“view”）是一款用于构建用户界面的渐进式 JavaScript 框架。它以“**数据驱动视图**”为核心理念，结合模板语法、组件化设计、响应式系统，使前端开发变得更直观高效。

## template (模板)

Vue 的模板语法允许我们在 HTML 中声明式地绑定数据。模板会被编译为高效的 JavaScript 渲染函数，并在数据变化时自动更新视图。

### 插值表达式

```vue
<template>
  <h1>{{ message }}</h1>
</template>

<script setup>
const message = 'Hello Vue 3!'
</script>
```

### 属性绑定（v-bind）

Vue 提供 `v-bind` 指令将数据绑定到 HTML 属性上：

```vue
<template>
  <img v-bind:src="imageUrl" alt="example" />
  <!-- 简写形式 -->
  <img :src="imageUrl" alt="example" />
</template>

<script setup>
const imageUrl = 'https://vuejs.org/images/logo.png'
</script>
```

> `v-bind` 会在属性值变化时自动更新 DOM。

### 事件绑定（v-on）

Vue 使用 `v-on` 指令监听事件：

```vue
<template>
  <button v-on:click="count++">点击了 {{ count }} 次</button>
  <!-- 简写形式 -->
  <button @click="add">点击增加</button>
</template>

<script setup>
import { ref } from 'vue'
const count = ref(0)
const add = () => count.value++
</script>
```

> 使用 `ref` 创建响应式数据，Vue 会自动追踪其依赖并更新视图。

### 常用模板指令

| 指令                            | 功能                    | 示例                                            |
| ------------------------------- | ----------------------- | ----------------------------------------------- |
| `v-if` / `v-else-if` / `v-else` | 条件渲染                | `<p v-if="ok">Yes</p>`                          |
| `v-show`                        | 通过 `display` 控制显隐 | `<p v-show="visible">Show</p>`                  |
| `v-for`                         | 列表渲染                | `<li v-for="item in list" :key="item.id"></li>` |
| `v-model`                       | 双向数据绑定            | `<input v-model="text" />`                      |
| `v-bind`                        | 绑定属性                | `<img :src="url" />`                            |
| `v-on`                          | 绑定事件                | `<button @click="doSomething">Click</button>`   |

## script（脚本）

### `<script setup>`

Vue 3 引入了 **Composition API** 和 `<script setup>` 语法糖，使组件逻辑更简洁。

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)
const add = () => count.value++
</script>

<template>
  <button @click="add">点击 {{ count }}</button>
</template>
```

#### 优点：

- 语法更简洁，无需 `return`；
- 自动将定义的变量暴露给模板；
- 更好的 TypeScript 类型推导；
- 支持顶层 `await`。

#### setup 的运行原理

`<script setup>` 在编译阶段会被转换为：

```js
export default {
  setup() {
    // 这里的代码就是 <script setup> 中的逻辑
    const count = ref(0)
    const add = () => count.value++
    return {
      count,
      add,
    }
  },
}
```

也就是说，`setup()` 是组件初始化时执行的一个函数，它返回的变量和方法会暴露给模板使用。

### vue jsx

vue 的 jsx 在`script`中指定`lang="jsx"`或`lang="tsx"`，返回 `() => <div></div>`

```vue
<script setup lang="tsx">
import { ref, onMounted } from 'vue'

const msg = ref('Hello Vue JSX!')

onMounted(() => {
  console.log('JSX组件已挂载')
})

export default () => <h1>{msg.value}</h1>
</script>
```

### 传统写法

```vue
<script>
import { ref } from 'vue'

export default {
  setup() {
    const count = ref(0)
    const add = () => count.value++
    return {
      count,
      add,
    }
  },
}
</script>
```

### 使用 TypeScript

要启用 TypeScript，只需在 `<script setup>` 中声明 `lang="ts"`或者`lang="tsx"`：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref<number>(0)
const add = (): void => count.value++
</script>
```

Vue 对类型的推导非常友好，VSCode + Volar 插件能提供出色的类型提示与自动补全。

## style（样式）

### 基础用法

```vue
<style>
h1 {
  color: green;
}
</style>
```

> 样式默认是全局作用的。如果希望样式仅在当前组件生效，可添加 `scoped`。

```vue
<style scoped>
h1 {
  color: blue;
}
</style>
```

### 预处理器（Less / SCSS）

Vue 支持在 `<style>` 标签中直接使用 Less 或 SCSS，只需安装对应依赖。

```bash
# 安装依赖
npm install -D less less-loader
# 或
npm install -D sass
```

然后在组件中：

```vue
<style lang="scss" scoped>
$title-color: #42b983;

h1 {
  color: $title-color;
  &:hover {
    opacity: 0.8;
  }
}
</style>
```

或使用 Less：

```vue
<style lang="less" scoped>
@title-color: #42b983;

h1 {
  color: @title-color;
}
</style>
```

### 引入外部样式文件

```vue
<style src="@/assets/styles/global.scss"></style>
```

或在入口文件 `main.ts` 中全局引入：

```ts
import '@/assets/styles/global.scss'
```
