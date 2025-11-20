# Vue 状态管理

## 什么是状态？

在前端开发中，**状态**指的是应用程序在运行过程中需要管理和维护的数据。这些数据会随着用户交互、网络请求或其他事件而发生变化，并直接影响应用的显示和行为。

```javascript
// 简单的状态示例
const state = {
  user: {
    name: '张三',
    isLoggedIn: true,
  },
  products: [
    { id: 1, name: '商品A', price: 100 },
    { id: 2, name: '商品B', price: 200 },
  ],
  loading: false,
}
```

## 为什么需要状态管理？

### 适用场景

1. **用户信息**：登录状态、用户资料、权限等
2. **全局配置**：主题、语言、布局设置
3. **业务数据**：商品列表、购物车、订单信息
4. **UI 状态**：加载状态、弹窗显示、表单数据

### 状态管理解决的问题

- **数据一致性**：多个组件依赖同一份数据时保持同步
- **可预测性**：状态变化遵循明确的规则
- **可调试性**：便于追踪状态变化和问题定位
- **组件通信**：简化跨层级组件间的数据传递

## Vue 中的状态

### 组件内状态

在单个组件中，可以使用 `ref` 或 `reactive` 管理局部状态：

```vue
<template>
  <div>
    <p>计数器: {{ count }}</p>
    <button @click="increment">增加</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 组件内状态
const count = ref(0)
const increment = () => {
  count.value++
}
</script>
```

### 跨组件共享状态

#### Props 和 Events

```vue
<!-- 父组件 -->
<template>
  <ChildComponent :message="sharedMessage" @update="handleUpdate" />
</template>

<script setup>
import { ref } from 'vue'
import ChildComponent from './ChildComponent.vue'

const sharedMessage = ref('Hello World')
const handleUpdate = (newMessage) => {
  sharedMessage.value = newMessage
}
</script>

<!-- 子组件 -->
<template>
  <div>
    <p>{{ message }}</p>
    <button @click="$emit('update', 'New Message')">更新</button>
  </div>
</template>

<script setup>
defineProps(['message'])
defineEmits(['update'])
</script>
```

#### Provide / Inject

```vue
<!-- 祖先组件 -->
<template>
  <div>
    <ParentComponent />
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import ParentComponent from './ParentComponent.vue'

const globalUser = ref({ name: '张三', age: 25 })

// 提供状态
provide('user', globalUser)
provide('updateUser', (newUser) => {
  globalUser.value = newUser
})
</script>

<!-- 后代组件 -->
<template>
  <div>
    <p>用户: {{ user.name }}</p>
    <button @click="updateUser({ name: '李四', age: 30 })">
      更新用户
    </button>
  </div>
</template>

<script setup>
import { inject } from 'vue'

// 注入状态
const user = inject('user')
const updateUser = inject('updateUser')
</script>
```

## Pinia 状态管理

Pinia 是 Vue 官方推荐的状态管理库，提供更简洁、类型安全的 API。

### 安装和配置

```bash
npm install pinia
```

```javascript
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app')
```

### 创建 Store

#### Option Store

```javascript
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: '我的计数器',
  }),

  getters: {
    doubleCount: (state) => state.count * 2,
    greeting: (state) => `Hello, ${state.name}!`,
  },

  actions: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
    async incrementAsync() {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      this.increment()
    },
  },
})
```

#### Setup Store

```javascript
// stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref('')

  const isLoggedIn = computed(() => !!user.value)

  function login(userData, authToken) {
    user.value = userData
    token.value = authToken
    localStorage.setItem('token', authToken)
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('token')
  }

  async function fetchUser() {
    const response = await fetch('/api/user')
    user.value = await response.json()
  }

  return {
    user,
    token,
    isLoggedIn,
    login,
    logout,
    fetchUser,
  }
})
```

### 在组件中使用 Store

```vue
<template>
  <div>
    <h2>计数器示例</h2>
    <p>当前计数: {{ counterStore.count }}</p>
    <p>双倍计数: {{ counterStore.doubleCount }}</p>
    <p>{{ counterStore.greeting }}</p>

    <button @click="counterStore.increment()">增加</button>
    <button @click="counterStore.decrement()">减少</button>
    <button @click="counterStore.incrementAsync()">异步增加</button>

    <hr />

    <h2>用户信息</h2>
    <div v-if="userStore.isLoggedIn">
      <p>欢迎, {{ userStore.user?.name }}</p>
      <button @click="userStore.logout()">退出登录</button>
    </div>
    <div v-else>
      <button @click="handleLogin">登录</button>
    </div>
  </div>
</template>

<script setup>
import { useCounterStore } from '@/stores/counter'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

// 使用 store
const counterStore = useCounterStore()
const userStore = useUserStore()

// 如果需要解构并保持响应式，使用 storeToRefs
const { count, doubleCount } = storeToRefs(counterStore)

const handleLogin = () => {
  userStore.login(
    { name: '张三', email: 'zhangsan@example.com' },
    'token123',
  )
}
</script>
```

### Store 间的相互调用

```javascript
// stores/cart.js
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
  }),

  actions: {
    addItem(product) {
      // 调用其他 store
      const userStore = useUserStore()

      if (!userStore.isLoggedIn) {
        throw new Error('请先登录')
      }

      this.items.push({
        ...product,
        id: Date.now(),
        addedBy: userStore.user.name,
      })
    },
  },
})
```

## 最佳实践

### 状态结构设计

```javascript
// 良好的状态结构
const state = () => ({
  // 按功能模块组织
  auth: {
    user: null,
    token: '',
    permissions: [],
  },
  products: {
    items: [],
    filters: {},
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
    },
  },
  ui: {
    loading: false,
    theme: 'light',
    sidebarCollapsed: false,
  },
})
```

### 组合式 Store

```javascript
// stores/composables/useApi.js
import { ref } from 'vue'

export function useApi() {
  const loading = ref(false)
  const error = ref(null)

  async function callApi(apiFn, ...args) {
    loading.value = true
    error.value = null

    try {
      return await apiFn(...args)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    callApi,
  }
}

// stores/products.js
import { defineStore } from 'pinia'
import { useApi } from './composables/useApi'

export const useProductsStore = defineStore('products', () => {
  const products = ref([])
  const { loading, error, callApi } = useApi()

  async function fetchProducts() {
    const data = await callApi(() =>
      fetch('/api/products').then((res) => res.json()),
    )
    products.value = data
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
  }
})
```

## 总结

Vue 状态管理从简单的组件内状态到复杂的全局状态管理，提供了多种解决方案：

- **简单场景**：使用 `ref`、`reactive` 管理组件内状态
- **组件通信**：使用 `props/emit` 或 `provide/inject`
- **复杂应用**：使用 Pinia 进行集中式状态管理
