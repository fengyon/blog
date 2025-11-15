# Composition API

## 为什么需要 Composition API？

### Options API 的局限性

在 Vue 2 中，我们使用 Options API 来组织组件代码，将数据、方法、计算属性等分别放在不同的选项中。这种方式在简单组件中表现良好，但随着组件复杂度增加，问题逐渐显现：

```javascript
// Options API 的"碎片化"问题示例
export default {
  data() {
    return {
      // 功能A相关的数据
      listA: [],
      filterA: '',

      // 功能B相关的数据
      listB: [],
      filterB: '',

      // 功能C相关的数据
      loading: false,
      error: null,
    }
  },
  computed: {
    // 功能A的计算属性
    filteredListA() {
      /* ... */
    },

    // 功能B的计算属性
    filteredListB() {
      /* ... */
    },

    // 功能C的计算属性
    hasError() {
      /* ... */
    },
  },
  methods: {
    // 功能A的方法
    fetchDataA() {
      /* ... */
    },
    updateFilterA() {
      /* ... */
    },

    // 功能B的方法
    fetchDataB() {
      /* ... */
    },
    updateFilterB() {
      /* ... */
    },

    // 功能C的方法
    handleError() {
      /* ... */
    },
  },
  mounted() {
    // 功能A的初始化
    this.fetchDataA()

    // 功能B的初始化
    this.fetchDataB()
  },
}
```

这种“碎片化”的组织方式导致相关逻辑被分散在不同选项中，理解和维护复杂组件变得困难。

### Composition API 的优势

Composition API 通过基于逻辑功能而非选项类型来组织代码，解决了上述问题：

```javascript
import { ref, computed, onMounted } from 'vue'

export default {
  setup() {
    // 功能A：数据列表管理
    const { listA, filterA, filteredListA, fetchDataA } = useFeatureA()

    // 功能B：另一个数据列表管理
    const { listB, filterB, filteredListB, fetchDataB } = useFeatureB()

    // 功能C：状态管理
    const { loading, error, hasError, handleError } = useFeatureC()

    onMounted(() => {
      fetchDataA()
      fetchDataB()
    })

    return {
      // 功能A
      listA,
      filterA,
      filteredListA,
      fetchDataA,
      // 功能B
      listB,
      filterB,
      filteredListB,
      fetchDataB,
      // 功能C
      loading,
      error,
      hasError,
      handleError,
    }
  },
}
```

## 核心概念：`setup()` 函数与响应式引用

### `setup()` 函数详解

`setup()` 是 Composition API 的入口点，它在组件实例创建之前执行：

```javascript
export default {
  props: {
    title: String,
    count: Number,
  },
  setup(props, context) {
    // props：包含组件接收的所有 prop，是响应式的
    console.log(props.title)

    // context：包含三个属性
    const { attrs, slots, emit } = context

    // attrs：非响应式的 attribute
    console.log(attrs.class)

    // slots：插槽内容
    console.log(slots.default)

    // emit：触发事件
    const handleClick = () => {
      emit('update:count', props.count + 1)
    }

    return {
      handleClick,
    }
  },
}
```

### 响应式数据定义

#### `ref` - 用于基本类型

```javascript
import { ref } from 'vue'

export default {
  setup() {
    // 基本类型使用 ref
    const count = ref(0)
    const name = ref('Vue')

    // 访问值时需要使用 .value
    const increment = () => {
      count.value++
    }

    // 在模板中自动解包，无需 .value
    return {
      count,
      name,
      increment,
    }
  },
}
```

#### `reactive` - 用于对象类型

```javascript
import { reactive, toRefs } from 'vue'

export default {
  setup() {
    // 对象类型使用 reactive
    const state = reactive({
      count: 0,
      name: 'Vue',
      todos: [],
    })

    const addTodo = (text) => {
      state.todos.push({ text, done: false })
    }

    // 使用 toRefs 保持响应式解构
    return {
      ...toRefs(state),
      addTodo,
    }
  },
}
```

## 生命周期钩子在 `setup` 中的使用

### 生命周期渲染流程示意图

```
组件初始化
    ↓
beforeCreate    ← Options API 特有
    ↓
created         ← Options API 特有
    ↓
setup()         ← Composition API 入口
    ↓
beforeMount
    ↓
DOM 渲染
    ↓
mounted
    ↓
数据变化触发更新
    ↓
beforeUpdate
    ↓
虚拟 DOM 重新渲染和打补丁
    ↓
updated
    ↓
组件卸载前
    ↓
beforeUnmount
    ↓
组件卸载
    ↓
unmounted
```

### 生命周期对比表

| Options API       | Composition API     | 执行时机              |
| ----------------- | ------------------- | --------------------- |
| `beforeCreate`    | 无直接对应          | 在 `setup()` 之前执行 |
| `created`         | 无直接对应          | 在 `setup()` 之前执行 |
| `beforeMount`     | `onBeforeMount`     | 挂载开始之前调用      |
| `mounted`         | `onMounted`         | 组件挂载后调用        |
| `beforeUpdate`    | `onBeforeUpdate`    | 数据变化，DOM 更新前  |
| `updated`         | `onUpdated`         | 数据变化，DOM 更新后  |
| `beforeUnmount`   | `onBeforeUnmount`   | 组件卸载前调用        |
| `unmounted`       | `onUnmounted`       | 组件卸载后调用        |
| `errorCaptured`   | `onErrorCaptured`   | 捕获后代组件错误时    |
| `renderTracked`   | `onRenderTracked`   | 渲染依赖被追踪时      |
| `renderTriggered` | `onRenderTriggered` | 渲染依赖被触发时      |
| `activated`       | `onActivated`       | keep-alive 组件激活时 |
| `deactivated`     | `onDeactivated`     | keep-alive 组件停用时 |

### 在 `setup` 中使用生命周期

```javascript
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  ref,
} from 'vue'

export default {
  setup() {
    const count = ref(0)
    const message = ref('Hello Vue 3')

    onBeforeMount(() => {
      console.log('组件即将挂载')
    })

    onMounted(() => {
      console.log('组件已挂载，可以访问 DOM')
      // 在这里进行数据初始化
      fetchInitialData()
    })

    onBeforeUpdate(() => {
      console.log('数据即将更新，DOM 还未更新')
    })

    onUpdated(() => {
      console.log('数据已更新，DOM 也已更新')
    })

    onBeforeUnmount(() => {
      console.log('组件即将卸载')
      // 清理定时器、取消订阅等
      clearInterval(timer)
    })

    onUnmounted(() => {
      console.log('组件已卸载')
    })

    const fetchInitialData = async () => {
      // 获取初始数据
    }

    return {
      count,
      message,
    }
  },
}
```

## 逻辑复用利器：自定义 Hook

### 什么是自定义 Hook？

自定义 Hook 是一个 JavaScript 函数，它使用 Composition API 来封装和复用有状态的逻辑。约定上，自定义 Hook 以“use”开头。

### 封装 `useMouse` Hook

```javascript
// useMouse.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  const update = (event) => {
    x.value = event.pageX
    y.value = event.pageY
  }

  onMounted(() => {
    window.addEventListener('mousemove', update)
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', update)
  })

  return { x, y }
}
```

### 使用自定义 Hook

```javascript
// 在组件中使用
import { useMouse } from './useMouse'

export default {
  setup() {
    const { x, y } = useMouse()

    return {
      x,
      y,
    }
  },
}
```

### 更复杂的示例：`useFetch`

```javascript
// useFetch.js
import { ref, onUnmounted } from 'vue'

export function useFetch(url) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  let abortController = null

  const fetchData = async () => {
    loading.value = true
    error.value = null

    // 如果已有请求在进行，取消它
    if (abortController) {
      abortController.abort()
    }

    abortController = new AbortController()

    try {
      const response = await fetch(url, {
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      data.value = await response.json()
    } catch (err) {
      if (err.name !== 'AbortError') {
        error.value = err.message
      }
    } finally {
      loading.value = false
      abortController = null
    }
  }

  onUnmounted(() => {
    if (abortController) {
      abortController.abort()
    }
  })

  return {
    data,
    loading,
    error,
    fetchData,
  }
}
```

### 在多个组件中复用

```javascript
// UserList.vue
import { useFetch } from '../composables/useFetch'

export default {
  setup() {
    const { data: users, loading, error, fetchData } = useFetch('/api/users')

    return {
      users,
      loading,
      error,
      refresh: fetchData
    }
  }
}

// PostList.vue
import { useFetch } from '../composables/useFetch'

export default {
  setup() {
    const { data: posts, loading, error, fetchData } = useFetch('/api/posts')

    return {
      posts,
      loading,
      error,
      refresh: fetchData
    }
  }
}
```
