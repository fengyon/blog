# nuxtjs 状态管理

## 理解状态管理

在前端开发中，**状态**就是应用中会变化的数据。当多个组件需要访问和修改同一份数据时，我们就需要一种集中管理这些数据的机制。

示意图：
组件 A --> [状态数据] <-- 组件 B
        ↓
    组件 C

传统方式 (Prop Drilling) 的问题：
[父组件] --传递数据--> [子组件] --传递数据--> [孙子组件]
    ↓
[数据需要层层传递，中间组件即使不需要也要帮忙传递]

## Nuxt.js 状态管理方案概览

Nuxt.js 提供了多种状态管理方案，适应不同复杂度的应用需求：

- **useState**：轻量级共享状态
- **Pinia**：官方推荐的完整状态管理库
- **Vuex**：传统状态管理方案 (Nuxt 2 主要使用)

## useState 轻量级状态管理

### 什么是 useState

`useState` 是 Nuxt 3 内置的 SSR 友好 API，用于在组件间创建响应式的共享状态。它确保在服务端渲染时创建的状态能无缝传递到客户端。

### 基本使用

创建组合式函数：
```javascript
// composables/useCounter.js
export const useCounter = () => {
  const count = useState('counter', () => 0)
  
  const increment = () => count.value++
  const decrement = () => count.value--
  
  return { count, increment, decrement }
}
```

在组件中使用：
```vue
<template>
  <div>
    <p>当前计数: {{ count }}</p>
    <button @click="increment">增加</button>
    <button @click="decrement">减少</button>
  </div>
</template>

<script setup>
const { count, increment, decrement } = useCounter()
</script>
```

### 适用场景与限制

**适用场景**：
- 简单的全局状态 (如主题切换、弹窗状态)
- 快速原型开发
- SSR 兼容的状态管理

**局限性**：
- 结构松散，没有明确的 actions、getters 约定
- 复杂状态逻辑难以组织
- 调试工具支持有限

## Pinia 企业级状态管理

### 为什么选择 Pinia

Pinia 是 Vue 3 官方推荐的状态管理库，具有以下优势：
- 极致的 TypeScript 支持
- 直观的 API 设计
- 强大的开发工具集成
- 模块化架构

### 安装与配置

安装依赖：
```bash
npm install pinia @pinia/nuxt
```

配置 nuxt.config.ts：
```javascript
export default defineNuxtConfig({
  modules: ['@pinia/nuxt']
})
```

### 创建 Store

```javascript
// stores/cart.js
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    total: 0
  }),
  
  getters: {
    itemsCount: (state) => state.items.reduce((total, item) => total + item.quantity, 0),
    totalPrice: (state) => state.items.reduce((total, item) => total + item.price * item.quantity, 0)
  },
  
  actions: {
    addItem(product) {
      const existingItem = this.items.find(item => item.id === product.id)
      if (existingItem) {
        existingItem.quantity++
      } else {
        this.items.push({ ...product, quantity: 1 })
      }
      this.updateTotal()
    },
    
    removeItem(itemId) {
      this.items = this.items.filter(item => item.id !== itemId)
      this.updateTotal()
    },
    
    updateTotal() {
      this.total = this.totalPrice
    }
  }
})
```

### 在组件中使用

```vue
<template>
  <div>
    <div>购物车商品数量: {{ cart.itemsCount }}</div>
    <div>总价: {{ cart.totalPrice }}</div>
    <button @click="addToCart(product)">加入购物车</button>
  </div>
</template>

<script setup>
import { useCartStore } from '~/stores/cart'

const cart = useCartStore()
const product = ref({ id: 1, name: '商品', price: 100 })

const addToCart = (product) => {
  cart.addItem(product)
}
</script>
```

### Pinia 数据流

示意图：
[组件] --调用--> [actions] --修改--> [state] --自动更新--> [组件]
                            ↓
                      [getters] --计算衍生数据--> [组件]

## Vuex 传统状态管理

### 模块化 Vuex

在 Nuxt.js 中，Vuex 支持文件系统为基础的模块化：

目录结构：
store/
├── index.js      # 主模块
├── user.js       # 用户模块
└── cart.js       # 购物车模块

### 基本结构

```javascript
// store/index.js
export const state = () => ({
  appVersion: '1.0.0'
})

export const mutations = {
  SET_VERSION(state, version) {
    state.appVersion = version
  }
}

export const actions = {
  updateVersion({ commit }, version) {
    commit('SET_VERSION', version)
  }
}

// store/user.js
export const state = () => ({
  user: null,
  isLoggedIn: false
})

export const mutations = {
  SET_USER(state, user) {
    state.user = user
    state.isLoggedIn = !!user
  }
}

export const actions = {
  async login({ commit }, credentials) {
    const user = await $fetch('/api/login', {
      method: 'POST',
      body: credentials
    })
    commit('SET_USER', user)
  }
}
```

### 在组件中使用

```vue
<template>
  <div>
    <div>用户: {{ $store.state.user.user?.name }}</div>
    <div>登录状态: {{ $store.state.user.isLoggedIn }}</div>
    <button @click="login">登录</button>
  </div>
</template>

<script>
export default {
  methods: {
    async login() {
      try {
        await this.$store.dispatch('user/login', {
          username: 'user',
          password: 'pass'
        })
      } catch (error) {
        console.error('登录失败', error)
      }
    }
  }
}
</script>
```

## 状态持久化

### 使用 useCookie

```javascript
// composables/useAuth.js
export const useAuth = () => {
  const token = useCookie('token')
  const user = useState('user', () => null)
  
  const login = async (credentials) => {
    const data = await $fetch('/api/login', {
      method: 'POST',
      body: credentials
    })
    
    token.value = data.token
    user.value = data.user
  }
  
  const logout = () => {
    token.value = null
    user.value = null
  }
  
  return { user, token, login, logout }
}
```

### localStorage 持久化

```javascript
// 状态持久化工具函数
export const usePersistentState = (key, defaultValue) => {
  const state = useState(key, () => {
    if (process.client) {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultValue
    }
    return defaultValue
  })
  
  watch(state, (newValue) => {
    if (process.client) {
      localStorage.setItem(key, JSON.stringify(newValue))
    }
  }, { deep: true })
  
  return state
}
```

## 状态管理最佳实践

### 选择合适的方案

| 场景 | 推荐方案 | 理由 |
|------|----------|------|
| 简单组件状态 | useState | 轻量、SSR友好 |
| 全局复杂状态 | Pinia | 类型安全、结构清晰 |
| 服务端数据 | useFetch/useAsyncData | 内置缓存、SSR优化 |
| 持久化状态 | useCookie/localStorage | 跨会话持久化 |

### 性能优化建议

1. **避免过度使用全局状态**
   - 组件状态尽量本地化
   - 仅全局共享必要数据

2. **合理使用计算属性**
   ```javascript
   // Good: 使用 getters 缓存计算结果
   getters: {
     expensiveData: (state) => {
       return state.data.filter(item => item.active).sort((a, b) => b.priority - a.priority)
     }
   }
   ```

3. **异步操作处理**
   ```javascript
   actions: {
     async fetchData({ state, commit }) {
       if (state.loading) return // 防止重复请求
       
       commit('SET_LOADING', true)
       try {
         const data = await $fetch('/api/data')
         commit('SET_DATA', data)
       } catch (error) {
         commit('SET_ERROR', error.message)
       } finally {
         commit('SET_LOADING', false)
       }
     }
   }
   ```

### 代码组织策略

```
stores/
├── index.js          # 根 store
├── user/             # 用户相关模块
│   ├── index.js
│   ├── actions.js
│   └── getters.js
├── products/         # 商品相关模块  
│   ├── index.js
│   └── actions.js
└── ui/               # UI 状态模块
    ├── index.js
    └── actions.js
```