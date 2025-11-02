# Vue3 组件开发指南

## 1. Component 的概念

在 Vue3 中，组件是可复用的 Vue 实例，具有自己的模板、逻辑和样式。组件是 Vue 应用的基本构建块，允许我们将 UI 拆分为独立、可复用的部分。

```vue
<!-- 组件示例 -->
<template>
  <div class="custom-component">
    <h2>这是一个 Vue 组件</h2>
    <p>组件让我们能够构建可复用的 UI 模块</p>
  </div>
</template>
```

## 2. 如何定义一个 Vue Component

### 使用 Composition API 定义组件

```vue
<template>
  <div>
    <h1>{{ title }}</h1>
    <p>计数: {{ count }}</p>
    <button @click="increment">增加</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 响应式数据
const title = ref('Vue3 组件示例')
const count = ref(0)

// 方法
const increment = () => {
  count.value++
}

// 生命周期钩子
onMounted(() => {
  console.log('组件已挂载')
})
</script>

<style scoped>
h1 {
  color: #2c3e50;
}
</style>
```

### 组件注册

```javascript
// 全局注册
import { createApp } from 'vue'
import MyComponent from './MyComponent.vue'

const app = createApp({})
app.component('MyComponent', MyComponent)

// 局部注册
import MyComponent from './MyComponent.vue'

export default {
  components: {
    MyComponent
  }
}
```

## 3. Component Props

### 如何接收 Props

```vue
<template>
  <div class="user-card">
    <h3>{{ name }}</h3>
    <p>年龄: {{ age }}</p>
    <p v-if="email">邮箱: {{ email }}</p>
    <p :class="customClass">自定义类名</p>
  </div>
</template>

<script setup>
import { defineProps, withDefaults } from 'vue'

// 定义 props
const props = defineProps({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    default: 18
  },
  email: String,
  customClass: String
})

// 使用默认值
withDefaults(defineProps({
  isActive: Boolean
}), {
  isActive: false
})
</script>
```

### 接收 Attrs

```vue
<template>
  <div>
    <input v-bind="attrs" />
    <p>非 props 属性数量: {{ Object.keys(attrs).length }}</p>
  </div>
</template>

<script setup>
import { useAttrs } from 'vue'

const attrs = useAttrs()
console.log('所有属性:', attrs)
</script>
```

### 特殊的 Prop: class 和 ref

```vue
<template>
  <!-- class 会自动合并 -->
  <div class="base-class" :class="$attrs.class">
    <p>这个 div 会合并基础类和传入的 class</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// ref 处理
const internalRef = ref(null)

onMounted(() => {
  console.log('内部元素:', internalRef.value)
})

// 暴露给父组件的 ref
defineExpose({
  internalRef
})
</script>
```

## 4. Component Slots

### 基本插槽

```vue
<!-- 子组件 -->
<template>
  <div class="card">
    <header class="card-header">
      <slot name="header">
        <!-- 默认内容 -->
        <h3>默认标题</h3>
      </slot>
    </header>
    <div class="card-body">
      <slot>
        <!-- 默认内容 -->
        <p>这是默认内容</p>
      </slot>
    </div>
    <footer class="card-footer">
      <slot name="footer"></slot>
    </footer>
  </div>
</template>
```

### 作用域插槽

```vue
<!-- 子组件 -->
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      <slot name="item" :item="item" :index="index">
        {{ item.name }}
      </slot>
    </li>
  </ul>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    default: () => []
  }
})
</script>
```

### 父组件使用插槽

```vue
<template>
  <ChildComponent>
    <!-- 默认插槽 -->
    <p>这是插入的内容</p>
    
    <!-- 具名插槽 -->
    <template #header>
      <h2>自定义标题</h2>
    </template>
    
    <!-- 作用域插槽 -->
    <template #item="{ item, index }">
      <span :class="{ active: item.isActive }">
        {{ index + 1 }}. {{ item.name }}
      </span>
    </template>
    
    <!-- 作用域插槽的另一种写法 -->
    <template v-slot:footer="{ data }">
      <button @click="handleFooterClick(data)">操作</button>
    </template>
  </ChildComponent>
</template>
```

## 5. 组件如何复用

### 使用 Composables 实现逻辑复用

```javascript
// composables/useCounter.js
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  
  const increment = () => count.value++
  const decrement = () => count.value--
  const reset = () => count.value = initialValue
  const double = computed(() => count.value * 2)
  
  return {
    count,
    increment,
    decrement,
    reset,
    double
  }
}
```

### 在组件中使用 Composables

```vue
<template>
  <div>
    <p>计数: {{ count }}</p>
    <p>双倍: {{ double }}</p>
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
    <button @click="reset">重置</button>
  </div>
</template>

<script setup>
import { useCounter } from './composables/useCounter'

const { count, increment, decrement, reset, double } = useCounter(10)
</script>
```

### 组件组合

```vue
<template>
  <div class="dashboard">
    <CounterWidget title="用户计数" />
    <CounterWidget title="订单计数" :initial-value="5" />
    <SearchableList :items="users" />
  </div>
</template>

<script setup>
import CounterWidget from './CounterWidget.vue'
import SearchableList from './SearchableList.vue'
import { ref } from 'vue'

const users = ref([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
])
</script>
```

## 6. 组件引用 (useTemplateRef)

### 模板引用基础用法

```vue
<template>
  <div>
    <!-- 引用 DOM 元素 -->
    <input ref="inputRef" type="text" placeholder="请输入内容" />
    
    <!-- 引用子组件 -->
    <ChildComponent ref="childRef" />
    
    <!-- 动态引用 -->
    <div 
      v-for="item in items" 
      :key="item.id"
      :ref="el => { if (el) itemRefs[item.id] = el }"
    >
      {{ item.name }}
    </div>
    
    <button @click="focusInput">聚焦输入框</button>
    <button @click="callChildMethod">调用子组件方法</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ChildComponent from './ChildComponent.vue'

// 单个引用
const inputRef = ref(null)
const childRef = ref(null)

// 多个引用
const items = ref([
  { id: 1, name: '项目1' },
  { id: 2, name: '项目2' }
])
const itemRefs = ref({})

const focusInput = () => {
  if (inputRef.value) {
    inputRef.value.focus()
  }
}

const callChildMethod = () => {
  if (childRef.value) {
    childRef.value.someMethod()
  }
}

onMounted(() => {
  console.log('输入框元素:', inputRef.value)
  console.log('子组件实例:', childRef.value)
  console.log('项目引用:', itemRefs.value)
})
</script>
```

### 函数模板引用

```vue
<template>
  <div>
    <input :ref="setupInputRef" type="text" />
    <canvas :ref="setupCanvasRef"></canvas>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

let inputElement = null
let canvasElement = null

const setupInputRef = (el) => {
  inputElement = el
  if (el) {
    console.log('输入框已设置:', el)
  }
}

const setupCanvasRef = (el) => {
  canvasElement = el
  if (el) {
    const ctx = el.getContext('2d')
    // 进行 canvas 操作
  }
}

onMounted(() => {
  if (inputElement) {
    inputElement.focus()
  }
})
</script>
```

### 在 Composables 中使用模板引用

```javascript
// composables/useElementSize.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useElementSize() {
  const elementRef = ref(null)
  const width = ref(0)
  const height = ref(0)

  const updateSize = () => {
    if (elementRef.value) {
      width.value = elementRef.value.offsetWidth
      height.value = elementRef.value.offsetHeight
    }
  }

  onMounted(() => {
    updateSize()
    window.addEventListener('resize', updateSize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateSize)
  })

  return {
    elementRef,
    width,
    height,
    updateSize
  }
}
```

```vue
<template>
  <div ref="elementRef" class="resizable-box">
    <p>宽度: {{ width }}px</p>
    <p>高度: {{ height }}px</p>
  </div>
</template>

<script setup>
import { useElementSize } from './composables/useElementSize'

const { elementRef, width, height } = useElementSize()
</script>

<style scoped>
.resizable-box {
  resize: both;
  overflow: auto;
  border: 1px solid #ccc;
  padding: 20px;
}
</style>
```

### 组件引用最佳实践

```vue
<template>
  <div>
    <!-- 使用 v-if 时的引用处理 -->
    <CustomModal v-if="showModal" ref="modalRef" />
    
    <button @click="showModal = true">打开模态框</button>
    <button @click="handleModalAction">操作模态框</button>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import CustomModal from './CustomModal.vue'

const showModal = ref(false)
const modalRef = ref(null)

const handleModalAction = async () => {
  if (!showModal.value) {
    showModal.value = true
    // 等待 DOM 更新和组件挂载
    await nextTick()
  }
  
  if (modalRef.value) {
    modalRef.value.open()
  }
}
</script>
```

## 总结

Vue3 的 Composition API 提供了更灵活和强大的组件开发方式：

- **组件定义**: 使用 `<script setup>` 语法糖简化组件编写
- **Props 处理**: 使用 `defineProps` 和 `useAttrs` 处理属性和非属性特性
- **插槽系统**: 提供默认插槽、具名插槽和作用域插槽
- **组件复用**: 通过 Composables 实现逻辑复用，通过组件组合实现 UI 复用
- **模板引用**: 使用 `ref` 访问 DOM 元素和子组件实例

这些特性使得 Vue3 组件开发更加模块化、可维护和类型安全。