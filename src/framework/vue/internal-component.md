下面是一篇关于 Vue 内置组件的博客，介绍了其主要组件、作用，并提供了 `script setup` 风格的代码示例。

# Vue 内置组件详解与 `script setup` 风格实战

Vue 提供了一系列强大的**内置组件**，它们无需注册即可在模板中直接使用。这些组件能够帮助开发者高效地处理**动态组件切换**、**过渡动画**、**组件缓存**、**DOM 渲染位置**和**异步依赖**等常见场景。结合 Vue 3 的 `script setup` 语法，代码会更加简洁。

## 内置组件概览

Vue 的主要内置组件包括：

| 组件              | 作用描述                                                   |
| ----------------- | ---------------------------------------------------------- |
| `Transition`      | 为**单个**元素或组件提供过渡动画效果。                     |
| `TransitionGroup` | 为**列表**中的多个元素或组件提供过渡效果，并支持定位动画。 |
| `KeepAlive`       | 缓存包裹在其中的动态切换组件，避免重复渲染。               |
| `Teleport`        | 将其插槽内容渲染到 DOM 中的另一个指定位置。                |
| `Suspense`        | 用于协调组件树中嵌套的**异步依赖**的加载状态。             |
| `component`       | 通过 `:is` 属性动态渲染不同的组件。                        |

## 内置组件详解与代码示例

以下示例均使用 Vue 3 的 `script setup` 语法。

### 1。`Transition` 组件

`Transition` 组件通过自动应用 CSS 过渡类名，为元素或组件的进入/离开阶段添加动画。

- **作用**：为单个元素或组件提供动画过渡效果。
- **常用属性**：
  - `name`：用于自动生成过渡 CSS 类名的前缀。
  - `mode`：控制离开/进入过渡的时序，例如 `out-in` (当前元素先离开，新元素再进入)。

**示例：淡入淡出过渡**

```vue
<template>
  <button @click="show = !show">切换显示</button>
  <Transition name="fade" mode="out-in">
    <p v-if="show">你好，这是一个过渡效果！</p>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'

const show = ref(true)
</script>

<style scoped>
.fade-enter-from {
  opacity: 0;
}
.fade-enter-active {
  transition: opacity 0.5s ease;
}
.fade-enter-to {
  opacity: 1;
}
.fade-leave-from {
  opacity: 1;
}
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-leave-to {
  opacity: 0;
}
</style>
```

### 2。`TransitionGroup` 组件

`TransitionGroup` 用于对 `v-for` 列表中的元素或组件同时进行过渡处理，特别擅长处理元素位置变化的动画。

- **作用**：为列表中的多个元素或组件提供过渡效果。
- **与 `Transition` 的区别**：`TransitionGroup` 会渲染为一个真实的 DOM 元素 (默认是 `<span>`，可通过 `tag` 属性定制)，并且每个子元素都必须有独立的 `key`。

**示例：列表项过渡**

```vue
<template>
  <button @click="addItem">添加项目</button>
  <TransitionGroup name="list" tag="ul">
    <li v-for="item in items" :key="item.id">
      {{ item.text }}
      <button @click="removeItem(item.id)">移除</button>
    </li>
  </TransitionGroup>
</template>

<script setup>
import { ref } from 'vue'

let id = 0
const items = ref([
  { id: id++, text: '项目 1' },
  { id: id++, text: '项目 2' },
])

function addItem() {
  items.value.push({ id: id++, text: `项目 ${id}` })
}
function removeItem(itemId) {
  items.value = items.value.filter((item) => item.id !== itemId)
}
</script>

<style scoped>
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
.list-enter-active {
  transition: all 0.5s ease;
}
.list-leave-active {
  transition: all 0.5s ease;
  position: absolute;
}
.list-move {
  transition: transform 0.5s ease;
}
</style>
```

### 3。`KeepAlive` 组件

`KeepAlive` 是一个抽象组件，用于在动态切换多个组件时，缓存非活动组件的实例，从而保留其状态或避免重新渲染。

- **作用**：缓存包裹在其中的动态切换组件。
- **常用属性**：
  - `include` / `exclude`：明确哪些组件需要缓存或排除。
  - `max`：限制最大缓存实例数，使用 LRU (最近最少使用) 算法进行置换。
- **生命周期**：被缓存的组件会额外触发 `activated` (激活) 和 `deactivated` (失活) 生命周期钩子。

**示例：缓存标签页**

```vue
<template>
  <div>
    <button v-for="tab in tabs" :key="tab" @click="currentTab = tab">
      {{ tab }}
    </button>

    <KeepAlive :include="['Posts']" :max="2">
      <component :is="currentTabComponent" />
    </KeepAlive>
  </div>
</template>

<script setup>
import { ref, computed, shallowRef } from 'vue'
import Home from './Home.vue'
import Posts from './Posts.vue'
import Archive from './Archive.vue'

const currentTab = ref('Home')
const tabs = ['Home', 'Posts', 'Archive']

// 使用 shallowRef 避免不必要的深度响应式转换
const components = shallowRef({
  Home,
  Posts,
  Archive,
})

const currentTabComponent = computed(
  () => components.value[currentTab.value],
)
</script>
```

### 4。`Teleport` 组件

`Teleport` 可以将组件的一部分模板“传送”到该组件 DOM 层级之外的其他位置，常用于处理模态框、提示框等需要突破父容器布局限制的场景。

- **作用**：将其插槽内容渲染到 DOM 中的另一个位置。
- **常用属性**：
  - `to`：指定目标容器，可以是 CSS 选择器或实际的 DOM 元素。
  - `disabled`：用于动态禁用传送功能。

**示例：模态框**

```vue
<template>
  <button @click="modalOpen = true">打开模态框</button>

  <!-- 将模态框内容传送到 body 元素下 -->
  <Teleport to="body">
    <div v-if="modalOpen" class="modal-mask">
      <div class="modal-container">
        <p>这是一个模态框！</p>
        <button @click="modalOpen = false">关闭</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const modalOpen = ref(false)
</script>

<style scoped>
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
}
</style>
```

### 5。`Suspense` 组件 (实验性组件)

`Suspense` 组件可以优雅地处理异步组件 (或具有 `async setup` 的组件) 的加载状态，在异步依赖解析完成前显示一个回退内容。

- **作用**：用于协调对组件树中嵌套的异步依赖的处理。
- **插槽**：
  - `#default`：用于放置异步组件。
  - `#fallback`：用于在异步组件加载期间显示备用内容。

**示例：处理异步组件**

```vue
<template>
  <Suspense>
    <template #default>
      <AsyncComponent />
    </template>
    <template #fallback>
      <div>组件加载中...</div>
    </template>
  </Suspense>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'

// 定义一个异步组件
const AsyncComponent = defineAsyncComponent(() =>
  import('./AsyncComponent.vue'),
)
</script>
```

### 6。动态组件：`component` 与 `:is`

`component` 是一个抽象的元组件，通过绑定 `:is` 属性，可以动态地渲染不同的组件。

- **作用**：动态地渲染不同的组件或元素。
- **`:is` 属性值**：可以是已注册的组件名、组件选项对象，或者一个组件构造函数。

**示例：动态切换视图**

```vue
<template>
  <div>
    <button v-for="tab in tabs" :key="tab" @click="currentTab = tab">
      {{ tab }}
    </button>

    <component :is="currentTabComponent" />
  </div>
</template>

<script setup>
import { ref, computed, shallowRef } from 'vue'
import Home from './Home.vue'
import Posts from './Posts.vue'
import Archive from './Archive.vue'

const currentTab = ref('Home')
const tabs = ['Home', 'Posts', 'Archive']

const components = shallowRef({
  Home,
  Posts,
  Archive,
})

const currentTabComponent = computed(
  () => components.value[currentTab.value],
)
</script>
```
