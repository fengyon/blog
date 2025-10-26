# Vue 组件详解

## 1. Component 的概念

Vue 组件是 Vue.js 框架的核心概念之一，它是一个可复用的 Vue 实例，具有自己的模板、逻辑和样式。组件化开发让大型应用可以被拆分成独立、可复用的小组件，从而提高代码的可维护性和复用性。

**组件的主要特点：**

- **独立性**：每个组件都有自己的作用域
- **可复用性**：可以在多个地方重复使用
- **可组合性**：可以嵌套使用形成组件树
- **数据隔离**：组件间的数据默认是隔离的

## 2. 如何定义一个 Vue Component

### 2.1 使用 Options API

```vue
<template>
  <div class="my-component">
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <button @click="handleClick">点击我</button>
  </div>
</template>

<script>
export default {
  name: 'MyComponent',
  data() {
    return {
      title: '我的组件',
      message: '这是一个 Vue 组件',
    }
  },
  methods: {
    handleClick() {
      this.message = '按钮被点击了！'
    },
  },
  mounted() {
    console.log('组件已挂载')
  },
}
</script>

<style scoped>
.my-component {
  border: 1px solid #ccc;
  padding: 20px;
  border-radius: 8px;
}
</style>
```

### 2.2 使用 Composition API

```vue
<template>
  <div class="my-component">
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <button @click="handleClick">点击我</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const title = ref('我的组件')
const message = ref('这是一个 Vue 组件')

const handleClick = () => {
  message.value = '按钮被点击了！'
}

onMounted(() => {
  console.log('组件已挂载')
})
</script>
```

### 2.3 全局注册与局部注册

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
    MyComponent,
  },
}
```

## 3. Component Props

### 3.1 如何接收 Props

```vue
<template>
  <div class="user-card">
    <h3>{{ user.name }}</h3>
    <p>年龄: {{ user.age }}</p>
    <p v-if="showEmail">邮箱: {{ user.email }}</p>
    <button @click="onEdit">编辑</button>
  </div>
</template>

<script>
export default {
  name: 'UserCard',
  props: {
    // 基础类型检查
    user: {
      type: Object,
      required: true,
      validator: (value) => {
        return value.name && value.age > 0
      },
    },
    // 带默认值的属性
    showEmail: {
      type: Boolean,
      default: false,
    },
    // 函数类型的 prop
    onEdit: {
      type: Function,
      default: () => {},
    },
  },
}
</script>
```

### 3.2 使用 Composition API 接收 Props

```vue
<template>
  <div class="user-card">
    <h3>{{ user.name }}</h3>
    <p>年龄: {{ user.age }}</p>
  </div>
</template>

<script setup>
// 使用 defineProps 编译器宏
const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  showEmail: {
    type: Boolean,
    default: false,
  },
})

// 或者使用 TypeScript
// const props = defineProps<{
//   user: {
//     name: string
//     age: number
//     email?: string
//   }
//   showEmail?: boolean
// }>()
</script>
```

### 3.3 接收 Attrs

```vue
<template>
  <div class="custom-input">
    <label v-if="$attrs.label">{{ $attrs.label }}</label>
    <input
      v-bind="$attrs"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<script>
export default {
  name: 'CustomInput',
  inheritAttrs: false, // 禁止默认的属性继承
  props: ['modelValue'],
  emits: ['update:modelValue'],
}
</script>

<style scoped>
.custom-input {
  margin-bottom: 1rem;
}
</style>
```

### 3.4 使用 useAttrs (Composition API)

```vue
<template>
  <div class="custom-input">
    <label v-if="attrs.label">{{ attrs.label }}</label>
    <input
      v-bind="filteredAttrs"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<script setup>
import { useAttrs, computed } from 'vue'

const props = defineProps(['modelValue'])
defineEmits(['update:modelValue'])

const attrs = useAttrs()

// 过滤掉不需要的属性
const filteredAttrs = computed(() => {
  const { class: className, style, ...rest } = attrs
  return rest
})
</script>
```

## 4. Component Slots

### 4.1 默认插槽

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <div class="card-header" v-if="$slots.header">
      <slot name="header"></slot>
    </div>
    <div class="card-body">
      <!-- 默认插槽 -->
      <slot>
        <!-- 默认内容 -->
        <p>这是默认内容</p>
      </slot>
    </div>
    <div class="card-footer" v-if="$slots.footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<!-- 使用 -->
<Card>
  <template #header>
    <h3>卡片标题</h3>
  </template>
  
  <p>这是卡片的主要内容</p>
  <p>这里的内容会显示在默认插槽中</p>
  
  <template #footer>
    <button>确定</button>
    <button>取消</button>
  </template>
</Card>
```

### 4.2 具名插槽

```vue
<!-- Layout.vue -->
<template>
  <div class="layout">
    <header class="layout-header">
      <slot name="header"></slot>
    </header>
    <aside class="layout-sidebar">
      <slot name="sidebar"></slot>
    </aside>
    <main class="layout-main">
      <slot name="main"></slot>
    </main>
    <footer class="layout-footer">
      <slot name="footer"></slot>
    </footer>
  </div>
</template>

<!-- 使用 -->
<Layout>
  <template #header>
    <h1>网站标题</h1>
    <nav>导航菜单</nav>
  </template>
  
  <template #sidebar>
    <ul>
      <li>菜单项1</li>
      <li>菜单项2</li>
    </ul>
  </template>
  
  <template #main>
    <article>
      <h2>文章标题</h2>
      <p>文章内容...</p>
    </article>
  </template>
  
  <template #footer>
    <p>版权信息</p>
  </template>
</Layout>
```

### 4.3 条件插槽

```vue
<!-- ConditionalWrapper.vue -->
<template>
  <div class="conditional-wrapper">
    <!-- 根据条件决定是否渲染插槽内容 -->
    <template v-if="condition">
      <slot name="true-content"></slot>
    </template>
    <template v-else>
      <slot name="false-content">
        <!-- 默认的 false 状态内容 -->
        <p>条件不满足时的默认内容</p>
      </slot>
    </template>

    <!-- 或者使用 v-show 保持 DOM 存在 -->
    <div v-show="alwaysVisible">
      <slot name="always-visible"></slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    condition: Boolean,
    alwaysVisible: {
      type: Boolean,
      default: true,
    },
  },
}
</script>
```

### 4.4 作用域插槽

```vue
<!-- DataList.vue -->
<template>
  <div class="data-list">
    <div v-for="(item, index) in items" :key="item.id" class="list-item">
      <!-- 向插槽传递数据 -->
      <slot
        name="item"
        :item="item"
        :index="index"
        :is-even="index % 2 === 0"
      >
        <!-- 默认的渲染方式 -->
        <div class="default-item">
          {{ item.name }}
        </div>
      </slot>
    </div>

    <!-- 传递多个数据 -->
    <div class="list-info">
      <slot
        name="info"
        :total="items.length"
        :isEmpty="items.length === 0"
      >
        <p>共 {{ items.length }} 项</p>
      </slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    items: {
      type: Array,
      default: () => [],
    },
  },
}
</script>

<!-- 使用 -->
<DataList :items="userList">
  <template #item="{ item, index, isEven }">
    <div :class="['user-item', { even: isEven }]">
      <span class="index">{{ index + 1 }}.</span>
      <span class="name">{{ item.name }}</span>
      <span class="age">{{ item.age }}岁</span>
    </div>
  </template>
  
  <template #info="{ total, isEmpty }">
    <div class="custom-info">
      <p v-if="isEmpty">暂无数据</p>
      <p v-else>总共 {{ total }} 个用户</p>
    </div>
  </template>
</DataList>
```

### 4.5 动态插槽

```vue
<!-- DynamicSlotContainer.vue -->
<template>
  <div class="dynamic-container">
    <!-- 动态插槽名 -->
    <slot :name="dynamicSlotName" :data="slotData"></slot>

    <!-- 多个动态插槽 -->
    <template v-for="slotName in slotNames" :key="slotName">
      <slot :name="slotName" :data="getSlotData(slotName)"></slot>
    </template>

    <!-- 作用域插槽与动态插槽结合 -->
    <template v-for="section in sections" :key="section.id">
      <div :class="`section-${section.type}`">
        <slot :name="`section-${section.type}`" :section="section">
          <!-- 默认内容 -->
          <h3>{{ section.title }}</h3>
          <p>{{ section.content }}</p>
        </slot>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  props: {
    slotNames: {
      type: Array,
      default: () => [],
    },
    sections: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      dynamicSlotName: 'header',
      slotData: {
        message: '动态插槽数据',
      },
    }
  },
  methods: {
    getSlotData(slotName) {
      return {
        slotName,
        timestamp: Date.now(),
        data: `这是 ${slotName} 的数据`,
      }
    },
  },
}
</script>

<!-- 使用 -->
<DynamicSlotContainer
  :slot-names="['header', 'footer']"
  :sections="sections"
>
  <!-- 动态插槽 -->
  <template #header="{ data }">
    <header>{{ data.message }}</header>
  </template>
  
  <!-- 循环生成的插槽 -->
  <template v-for="section in sections" #[`section-${section.type}`]="{ section }">
    <div :class="`custom-${section.type}`">
      <h2>{{ section.title }}</h2>
      <div v-html="section.content"></div>
    </div>
  </template>
</DynamicSlotContainer>
```

## 5. 组件如何复用

### 5.1 通过 Props 定制化

```vue
<!-- ReusableButton.vue -->
<template>
  <button
    :class="[
      'reusable-button',
      `button-${variant}`,
      `button-${size}`,
      {
        'button-disabled': disabled,
        'button-loading': loading,
      },
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="loading-spinner"></span>
    <slot>{{ label }}</slot>
  </button>
</template>

<script>
export default {
  name: 'ReusableButton',
  props: {
    variant: {
      type: String,
      default: 'primary', // primary, secondary, danger
      validator: (value) =>
        ['primary', 'secondary', 'danger'].includes(value),
    },
    size: {
      type: String,
      default: 'medium', // small, medium, large
      validator: (value) => ['small', 'medium', 'large'].includes(value),
    },
    disabled: Boolean,
    loading: Boolean,
    label: String,
  },
  emits: ['click'],
  methods: {
    handleClick(event) {
      if (!this.disabled && !this.loading) {
        this.$emit('click', event)
      }
    },
  },
}
</script>

<style scoped>
.reusable-button {
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.button-primary {
  background-color: #007bff;
  color: white;
}
.button-secondary {
  background-color: #6c757d;
  color: white;
}
.button-danger {
  background-color: #dc3545;
  color: white;
}

.button-small {
  padding: 4px 8px;
  font-size: 12px;
}
.button-medium {
  padding: 8px 16px;
  font-size: 14px;
}
.button-large {
  padding: 12px 24px;
  font-size: 16px;
}

.button-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
```

### 5.2 通过插槽实现布局复用

```vue
<!-- ReusableModal.vue -->
<template>
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" :style="containerStyle" @click.stop>
      <!-- 头部插槽 -->
      <div v-if="$slots.header" class="modal-header">
        <slot name="header"></slot>
        <button v-if="closable" class="close-button" @click="handleClose">
          &times;
        </button>
      </div>

      <!-- 内容插槽 -->
      <div class="modal-content">
        <slot></slot>
      </div>

      <!-- 底部插槽 -->
      <div v-if="$slots.footer" class="modal-footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReusableModal',
  props: {
    visible: Boolean,
    closable: {
      type: Boolean,
      default: true,
    },
    closeOnOverlay: {
      type: Boolean,
      default: true,
    },
    width: {
      type: [String, Number],
      default: '600px',
    },
  },
  emits: ['update:visible', 'close'],
  computed: {
    containerStyle() {
      return {
        width:
          typeof this.width === 'number' ? `${this.width}px` : this.width,
      }
    },
  },
  methods: {
    handleClose() {
      this.$emit('update:visible', false)
      this.$emit('close')
    },
    handleOverlayClick() {
      if (this.closeOnOverlay && this.closable) {
        this.handleClose()
      }
    },
  },
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-content {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eaeaea;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
```

### 5.3 使用 Composables 实现逻辑复用

```javascript
// composables/useCounter.js
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0, options = {}) {
  const { min = -Infinity, max = Infinity, step = 1 } = options

  const count = ref(initialValue)

  const increment = () => {
    count.value = Math.min(count.value + step, max)
  }

  const decrement = () => {
    count.value = Math.max(count.value - step, min)
  }

  const reset = () => {
    count.value = initialValue
  }

  const isMin = computed(() => count.value <= min)
  const isMax = computed(() => count.value >= max)

  return {
    count,
    increment,
    decrement,
    reset,
    isMin,
    isMax,
  }
}
```

```vue
<!-- CounterComponent.vue -->
<template>
  <div class="counter">
    <button :disabled="isMin" @click="decrement">-</button>
    <span class="count">{{ count }}</span>
    <button :disabled="isMax" @click="increment">+</button>
    <button @click="reset">重置</button>
  </div>
</template>

<script setup>
import { useCounter } from '../composables/useCounter'

const { count, increment, decrement, reset, isMin, isMax } = useCounter(
  0,
  {
    min: 0,
    max: 10,
    step: 1,
  },
)
</script>
```

## 6. 组件引用

### 6.1 模板引用 (Template Refs)

```vue
<template>
  <div>
    <!-- 普通元素的引用 -->
    <input ref="inputRef" type="text" placeholder="请输入内容" />

    <!-- 子组件的引用 -->
    <ChildComponent ref="childRef" />

    <!-- 动态引用 -->
    <div
      v-for="item in items"
      :key="item.id"
      :ref="(el) => setItemRef(el, item.id)"
    >
      {{ item.name }}
    </div>

    <button @click="handleFocus">聚焦输入框</button>
    <button @click="callChildMethod">调用子组件方法</button>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import ChildComponent from './ChildComponent.vue'

export default {
  components: { ChildComponent },
  setup() {
    const inputRef = ref(null)
    const childRef = ref(null)
    const itemRefs = ref(new Map())

    const items = ref([
      { id: 1, name: '项目1' },
      { id: 2, name: '项目2' },
      { id: 3, name: '项目3' },
    ])

    const setItemRef = (el, id) => {
      if (el) {
        itemRefs.value.set(id, el)
      } else {
        itemRefs.value.delete(id)
      }
    }

    const handleFocus = () => {
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
      console.log('所有项目引用:', itemRefs.value)
    })

    return {
      inputRef,
      childRef,
      items,
      setItemRef,
      handleFocus,
      callChildMethod,
    }
  },
}
</script>
```

### 6.2 组件实例方法

```vue
<!-- ChildComponent.vue -->
<template>
  <div class="child-component">
    <h3>子组件</h3>
    <p>计数: {{ count }}</p>
    <button @click="increment">增加</button>
  </div>
</template>

<script>
export default {
  name: 'ChildComponent',
  data() {
    return {
      count: 0,
    }
  },
  methods: {
    // 公共方法，可以被父组件调用
    increment() {
      this.count++
      this.$emit('count-changed', this.count)
    },

    // 另一个公共方法
    reset() {
      this.count = 0
      this.$emit('count-reset')
    },

    // 带参数的方法
    setCount(value) {
      this.count = value
      this.$emit('count-set', value)
    },

    // 返回数据的方法
    getCount() {
      return this.count
    },
  },

  // 生命周期钩子
  mounted() {
    console.log('子组件已挂载')
  },
}
</script>

<!-- 父组件使用 -->
<template>
  <div>
    <ChildComponent ref="childRef" @count-changed="handleCountChanged" />
    <button @click="callChildMethods">调用子组件方法</button>
  </div>
</template>

<script>
import ChildComponent from './ChildComponent.vue'

export default {
  components: { ChildComponent },
  methods: {
    callChildMethods() {
      // 调用子组件方法
      this.$refs.childRef.increment()
      this.$refs.childRef.setCount(5)

      // 获取子组件数据
      const count = this.$refs.childRef.getCount()
      console.log('当前计数:', count)
    },

    handleCountChanged(count) {
      console.log('计数发生变化:', count)
    },
  },
}
</script>
```

### 6.3 使用 defineExpose (Composition API)

```vue
<!-- ExposableComponent.vue -->
<template>
  <div class="exposable-component">
    <h3>可暴露的组件</h3>
    <p>内部状态: {{ internalState }}</p>
    <p>公共数据: {{ publicData }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const internalState = ref('这是内部状态，不应该被外部访问')
const publicData = ref('这是公开数据')

const publicMethod = () => {
  console.log('公共方法被调用')
  return '方法返回值'
}

const anotherPublicMethod = (value) => {
  publicData.value = value
  return `设置的值: ${value}`
}

const computedValue = computed(() => publicData.value.toUpperCase())

// 使用 defineExpose 暴露需要公开的属性和方法
defineExpose({
  publicData,
  publicMethod,
  anotherPublicMethod,
  computedValue,
})

// 这些不会被暴露给父组件
const privateMethod = () => {
  console.log('私有方法')
}
</script>

<!-- 父组件使用 -->
<template>
  <div>
    <ExposableComponent ref="exposableRef" />
    <button @click="callExposedMethods">调用暴露的方法</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ExposableComponent from './ExposableComponent.vue'

const exposableRef = ref(null)

const callExposedMethods = () => {
  if (exposableRef.value) {
    // 调用暴露的方法
    const result1 = exposableRef.value.publicMethod()
    console.log(result1)

    const result2 = exposableRef.value.anotherPublicMethod('新的值')
    console.log(result2)

    // 访问暴露的属性
    console.log('公共数据:', exposableRef.value.publicData)
    console.log('计算属性:', exposableRef.value.computedValue)

    // 以下代码会报错，因为 internalState 没有被暴露
    // console.log(exposableRef.value.internalState)
  }
}
</script>
```

### 6.4 引用数组和函数引用

```vue
<template>
  <div>
    <!-- 引用数组 -->
    <div v-for="(item, index) in items" :key="item.id" :ref="addItemRef">
      {{ item.name }}
    </div>

    <!-- 函数引用 -->
    <input :ref="(el) => (inputRef = el)" type="text" />

    <button @click="logRefs">打印引用</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [
        { id: 1, name: '项目1' },
        { id: 2, name: '项目2' },
        { id: 3, name: '项目3' },
      ],
      itemRefs: [],
      inputRef: null,
    }
  },
  methods: {
    addItemRef(el) {
      if (el) {
        this.itemRefs.push(el)
      }
    },
    logRefs() {
      console.log('项目引用数组:', this.itemRefs)
      console.log('输入框引用:', this.inputRef)
    },
  },
  mounted() {
    // 在 mounted 后引用才可用
    console.log('组件挂载完成，引用已设置')
  },
}
</script>
```
