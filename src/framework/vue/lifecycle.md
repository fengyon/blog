# Vue 生命周期

## 什么是生命周期？

生命周期（Lifecycle）是指 Vue 实例从创建到销毁的整个过程。在这个过程中，Vue 提供了一系列的**生命周期钩子函数**（Lifecycle Hooks），允许开发者在特定的阶段执行自定义代码。

理解生命周期对于编写高质量的 Vue 应用至关重要，它能帮助我们：

- 在合适的时机执行初始化逻辑
- 管理副作用（如事件监听器、定时器）
- 优化性能
- 避免常见的内存泄漏问题

## Vue 3 生命周期钩子

Vue 3 提供了以下生命周期钩子：

| 生命周期钩子        | 执行时机                                           |
| ------------------- | -------------------------------------------------- |
| `onBeforeMount`     | 在挂载开始之前被调用                               |
| `onMounted`         | 在组件挂载完成后调用                               |
| `onBeforeUpdate`    | 在响应式数据变化后，DOM 更新前调用                 |
| `onUpdated`         | 在 DOM 更新完成后调用                              |
| `onBeforeUnmount`   | 在组件实例卸载之前调用                             |
| `onUnmounted`       | 在组件实例卸载完成后调用                           |
| `onErrorCaptured`   | 在捕获了后代组件传递的错误时调用                   |
| `onRenderTracked`   | 当响应式依赖被组件的渲染作用追踪时调用（开发模式） |
| `onRenderTriggered` | 当响应式依赖触发组件重新渲染时调用（开发模式）     |
| `onActivated`       | 当被 keep-alive 缓存的组件激活时调用               |
| `onDeactivated`     | 当被 keep-alive 缓存的组件失活时调用               |

## Script Setup 风格代码示例

```vue
<template>
  <div>
    <h1>{{ title }}</h1>
    <p>计数: {{ count }}</p>
    <button @click="increment">增加</button>
    <button @click="toggleChild">切换子组件</button>

    <ChildComponent v-if="showChild" />
  </div>
</template>

<script setup>
import {
  ref,
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onErrorCaptured,
} from 'vue'
import ChildComponent from './ChildComponent.vue'

// 响应式数据
const title = ref('Vue 生命周期演示')
const count = ref(0)
const showChild = ref(true)

// 方法
const increment = () => {
  count.value++
}

const toggleChild = () => {
  showChild.value = !showChild.value
}

// 生命周期钩子
onBeforeMount(() => {
  console.log('🚀 onBeforeMount: 组件即将挂载')
  console.log('DOM 元素:', document.querySelector('h1')) // null，此时 DOM 还未创建
})

onMounted(() => {
  console.log('✅ onMounted: 组件已挂载')
  console.log('DOM 元素:', document.querySelector('h1')) // 可访问 DOM 元素
  console.log('组件已插入到 DOM 中')
})

onBeforeUpdate(() => {
  console.log('🔄 onBeforeUpdate: 组件即将更新')
  console.log('当前计数:', count.value)
  console.log('DOM 内容:', document.querySelector('p').textContent)
})

onUpdated(() => {
  console.log('📝 onUpdated: 组件已更新')
  console.log('更新后计数:', count.value)
  console.log('更新后 DOM 内容:', document.querySelector('p').textContent)
})

onBeforeUnmount(() => {
  console.log('⏳ onBeforeUnmount: 组件即将卸载')
  // 清理工作，如清除定时器、取消事件监听等
})

onUnmounted(() => {
  console.log('🗑️ onUnmounted: 组件已卸载')
})

onErrorCaptured((err, instance, info) => {
  console.error('❌ onErrorCaptured: 捕获到错误', err)
  console.log('组件实例:', instance)
  console.log('错误信息:', info)
  // 返回 false 阻止错误继续向上传播
  return false
})

// 开发环境下的调试钩子
import { onRenderTracked, onRenderTriggered } from 'vue'

onRenderTracked((event) => {
  console.log('🎯 依赖被追踪:', event)
})

onRenderTriggered((event) => {
  console.log('🎯 依赖触发渲染:', event)
})
</script>
```

## Keep-alive 相关生命周期

```vue
<script setup>
import { onActivated, onDeactivated } from 'vue'

onActivated(() => {
  console.log('🎯 onActivated: 组件被激活')
  // 恢复组件状态，如重新开始动画、重新获取数据等
})

onDeactivated(() => {
  console.log('💤 onDeactivated: 组件被停用')
  // 暂停组件活动，如停止动画、取消请求等
})
</script>
```

## 生命周期适用场景

### onBeforeMount & onMounted

**适用场景：**

- **DOM 操作**：在 `onMounted` 中访问或操作 DOM 元素
- **数据初始化**：从 API 获取初始数据
- **第三方库初始化**：初始化图表、地图等需要 DOM 的库

```vue
<script setup>
import { ref, onMounted } from 'vue'

const chartContainer = ref(null)

onMounted(() => {
  // 初始化图表
  if (chartContainer.value) {
    initChart(chartContainer.value)
  }

  // 获取初始数据
  fetchInitialData()
})
</script>
```

### onBeforeUpdate & onUpdated

**适用场景：**

- **DOM 更新后的操作**：在 DOM 更新后执行某些操作
- **基于 DOM 状态的逻辑**：根据更新后的 DOM 状态执行逻辑

```vue
<script setup>
import { ref, onUpdated } from 'vue'

const messages = ref([])
const messageContainer = ref(null)

onUpdated(() => {
  // 自动滚动到最新消息
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
})
</script>
```

### onBeforeUnmount & onUnmounted

**适用场景：**

- **资源清理**：清除定时器、取消网络请求
- **事件监听器移除**：移除全局事件监听器
- **内存泄漏预防**：清理第三方库实例

```vue
<script setup>
import { onUnmounted } from 'vue'

let intervalId = null

// 启动定时器
const startTimer = () => {
  intervalId = setInterval(() => {
    console.log('定时器执行...')
  }, 1000)
}

onUnmounted(() => {
  // 清理定时器
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }

  // 移除事件监听器
  window.removeEventListener('resize', handleResize)
})
</script>
```

### onErrorCaptured

**适用场景：**

- **错误边界**：捕获子组件错误并显示降级 UI
- **错误报告**：将错误发送到错误监控服务

```vue
<template>
  <div>
    <div v-if="hasError" class="error-fallback">组件渲染失败</div>
    <slot v-else />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const hasError = ref(false)

onErrorCaptured((error) => {
  hasError.value = true
  console.error('捕获到组件错误:', error)
  // 发送错误到监控服务
  reportError(error)
  return false // 阻止错误继续传播
})
</script>
```

## 生命周期执行顺序

### 单个组件生命周期流程

```
创建阶段：
1. setup() 执行
2. onBeforeMount()
3. 编译模板 → 创建虚拟 DOM → 渲染真实 DOM
4. onMounted()

更新阶段：
1. 响应式数据变化
2. onBeforeUpdate()
3. 重新渲染虚拟 DOM → 更新真实 DOM
4. onUpdated()

卸载阶段：
1. onBeforeUnmount()
2. 移除 DOM 元素、清理副作用
3. onUnmounted()
```

### 父子组件生命周期顺序

**挂载时：**

```
父组件 onBeforeMount
子组件 onBeforeMount
子组件 onMounted
父组件 onMounted
```

**更新时：**

```
父组件 onBeforeUpdate
子组件 onBeforeUpdate
子组件 onUpdated
父组件 onUpdated
```

**卸载时：**

```
父组件 onBeforeUnmount
子组件 onBeforeUnmount
子组件 onUnmounted
父组件 onUnmounted
```

## 生命周期渲染示意图

```
Vue 组件生命周期流程
┌─────────────────────────────────────────────────────────────────┐
│                        创建阶段                                 │
├─────────────────────────────────────────────────────────────────┤
│  setup() 执行                                                  │
│    ↓                                                           │
│  onBeforeMount()   ← 此时 DOM 尚未创建                         │
│    ↓                                                           │
│  编译模板 → 创建虚拟 DOM → 渲染真实 DOM                        │
│    ↓                                                           │
│  onMounted()      ← 此时可访问 DOM 元素                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ 响应式数据变化
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        更新阶段                                 │
├─────────────────────────────────────────────────────────────────┤
│  onBeforeUpdate() ← DOM 更新前，可访问旧 DOM 状态              │
│    ↓                                                           │
│  重新渲染虚拟 DOM → 更新真实 DOM                               │
│    ↓                                                           │
│  onUpdated()      ← DOM 已更新，可访问新 DOM 状态              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ 组件卸载
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        卸载阶段                                 │
├─────────────────────────────────────────────────────────────────┤
│  onBeforeUnmount() ← 组件实例仍完全可用                         │
│    ↓                                                           │
│  清理工作：移除 DOM、取消事件监听、清理定时器等                 │
│    ↓                                                           │
│  onUnmounted()     ← 组件已完全卸载                            │
└─────────────────────────────────────────────────────────────────┘

Keep-alive 组件特殊流程：
┌─────────────────────────────────────────────────────────────────┐
│  激活: onActivated()    ← 组件从缓存中激活时调用                │
│  停用: onDeactivated()  ← 组件被缓存时调用                     │
└─────────────────────────────────────────────────────────────────┘
```

## 最佳实践与注意事项

### 1. 避免在 `onUpdated` 中修改状态

```vue
<script setup>
// ❌ 避免这样做 - 可能导致无限循环
onUpdated(() => {
  if (someCondition) {
    count.value++ // 这会再次触发更新
  }
})

// ✅ 更好的做法 - 使用计算属性或侦听器
const computedCount = computed(() => {
  return someCondition ? count.value + 1 : count.value
})
</script>
```

### 2. 合理使用异步操作

```vue
<script setup>
import { onMounted, ref } from 'vue'

const data = ref(null)

onMounted(async () => {
  // ✅ 可以在生命周期钩子中使用 async/await
  try {
    data.value = await fetchData()
  } catch (error) {
    console.error('数据获取失败:', error)
  }
})
</script>
```

### 3. 清理副作用

```vue
<script setup>
import { onUnmounted } from 'vue'

// 事件监听器
const handleClick = () => {
  /* ... */
}
document.addEventListener('click', handleClick)

// 定时器
const timer = setInterval(() => {
  /* ... */
}, 1000)

onUnmounted(() => {
  // ✅ 记得清理所有副作用
  document.removeEventListener('click', handleClick)
  clearInterval(timer)
})
</script>
```

## 总结

Vue 生命周期是 Vue 框架的核心概念之一，它为开发者提供了在组件不同阶段执行代码的能力：

1. **理解执行时机**：每个生命周期钩子都有其特定的执行时机和用途
2. **合理使用**：根据需求选择合适的生命周期钩子，避免滥用
3. **资源管理**：在卸载阶段及时清理资源，防止内存泄漏
4. **性能优化**：利用生命周期进行性能监控和优化
5. **错误处理**：使用 `onErrorCaptured` 构建健壮的错误处理机制

掌握 Vue 生命周期将帮助你编写出更加健壮、可维护的 Vue 应用程序，并能够更好地理解和调试组件的行为。
