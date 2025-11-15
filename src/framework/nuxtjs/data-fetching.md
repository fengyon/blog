# nuxtjs 数据获取

## 理解数据获取

在现代 Web 开发中，数据获取是连接前端界面与后端服务的桥梁。Nuxt.js 提供了多种数据获取方式，适应不同的渲染模式和应用场景。

示意图：
[浏览器请求] → [Nuxt 应用] → [API 服务器]  
        ↓  
[数据返回] → [页面渲染]

## 数据获取方案概览

Nuxt.js 提供了丰富的数据获取方法，主要分为：

- **useAsyncData**：Composition API 风格，适用于 Nuxt 3
- **useFetch**：基于 useAsyncData 的快捷方式
- **asyncData**：Options API 风格，仅限页面组件
- **fetch**：组件级数据获取，支持更多配置选项
- **直接调用 API**：使用 $fetch、axios 等 HTTP 客户端

## useAsyncData

### 核心概念

`useAsyncData` 是 Nuxt 3 的 Composition API 函数，用于在组件中加载和管理异步数据。它与 Nuxt 的响应式系统和页面生命周期紧密集成。

### 基本用法

```javascript
<template>
  <div>
    <p v-if="pending">正在加载...</p>
    <p v-if="error">加载错误: {{ error.message }}</p>
    <div v-if="data">
      <p>{{ data }}</p>
    </div>
  </div>
</template>

<script setup>
const { data, pending, error } = await useAsyncData('unique-key', async () => {
  const response = await fetch('https://api.example.com/data')
  if (!response.ok) {
    throw new Error('网络错误')
  }
  return response.json()
})
</script>
```

### 高级配置

```javascript
const { data, refresh } = await useAsyncData(
  'posts',
  async () => {
    const posts = await $fetch('/api/posts')
    return posts
  },
  {
    cache: true,        // 启用缓存
    retry: 3,           // 失败时重试次数
    transform: (data) => {
      // 数据转换
      return data.map(item => ({ ...item, processed: true }))
    }
  }
)
```

## useFetch  composable

### 智能获取

`useFetch` 是基于 `useAsyncData` 的封装，能自动根据 URL 生成 key，并内置了请求能力。

```javascript
<script setup>
const { data: posts, pending, error } = await useFetch('/api/posts')

// 带参数请求
const { data: user } = await useFetch('/api/users', {
  query: { id: 1 },
  watch: [userId]  // 监听响应式数据变化
})
</script>
```

## asyncData 方法

### 页面级数据获取

`asyncData` 是 Nuxt.js 的传统数据获取方法，专门用于页面组件。它在组件初始化前被调用，因此无法通过 `this` 访问组件实例。

### 执行时机

示意图：
[页面请求] → [asyncData 执行] → [组件初始化] → [页面渲染]

### 基本用法

```javascript
export default {
  async asyncData(context) {
    const post = await context.$http.$get(`/api/posts/${context.params.id}`)
    return { post }
  },
  data() {
    return { localData: 'default' }
  }
}
```

### 上下文参数

asyncData 接收上下文对象，包含：
- `params`：路由参数
- `query`：查询字符串
- `store`：Vuex 状态
- `req`/**`res`**：HTTP 请求/响应对象 (服务端)
- `redirect`：重定向方法
- `error`：错误处理方法

## fetch 方法

### 组件级数据获取

Nuxt.js 提供了 `fetch` 方法，允许在任何组件中获取数据。自 Nuxt.js 2.12 版本开始引入，为数据获取提供了更加灵活和强大的解决方案。

### 核心特性

**执行时机**：
- 服务端渲染时：首次访问或刷新页面
- 客户端导航时：前端路由切换页面

**状态管理**：通过 `$fetchState` 提供：
- `pending`：数据加载状态 (仅客户端有效)
- `error`：错误信息对象
- `timestamp`：最后一次获取数据的时间戳

### 基本用法

```javascript
export default {
  data() {
    return {
      posts: []
    }
  },
  async fetch() {
    this.posts = await this.$http.$get('https://api.example.com/posts')
  },
  mounted() {
    // 手动触发数据刷新
    this.$fetch()
  }
}
```

### 高级配置

```javascript
export default {
  fetchOnServer: false,  // 仅在客户端执行
  fetchDelay: 300,       // 延迟执行，防止闪烁
  fetchKey: 'unique-key', // 缓存标识
  
  async fetch() {
    // 数据获取逻辑
  }
}
```

## 数据获取与状态管理

### 与 Vuex 集成

在 Nuxt.js 中，数据获取常与 Vuex 状态管理结合使用。

**Store 定义**：
```javascript
// store/posts.js
export const state = () => ({
  list: [],
  current: null
})

export const mutations = {
  SET_POSTS(state, posts) {
    state.list = posts
  },
  SET_CURRENT_POST(state, post) {
    state.current = post
  }
}

export const actions = {
  async fetchPosts({ commit }) {
    const posts = await this.$axios.$get('/api/posts')
    commit('SET_POSTS', posts)
  }
}
```

**在组件中使用**：
```javascript
export default {
  async fetch({ store, params }) {
    await store.dispatch('posts/fetchPosts')
  },
  computed: {
    posts() {
      return this.$store.state.posts.list
    }
  }
}
```

### 服务端初始化

使用 `nuxtServerInit` 在服务端初始化全局数据：

```javascript
// store/index.js
export const actions = {
  async nuxtServerInit({ commit }, { req }) {
    // 从 cookie 获取 token
    const token = getTokenFromCookie(req.headers.cookie)
    commit('auth/SET_TOKEN', token)
    
    // 获取用户信息
    if (token) {
      const user = await this.$axios.$get('/api/user')
      commit('auth/SET_USER', user)
    }
  }
}
```

## API 调用方式

### $fetch 使用

Nuxt 3 提供了全局的 `$fetch` 方法用于 API 调用：

```javascript
<script setup>
const data = await $fetch('/api/endpoint', {
  method: 'POST',
  body: { key: 'value' },
  baseURL: 'https://api.example.com',
  onRequest({ request, options }) {
    // 请求拦截
  },
  onResponse({ response, options }) {
    // 响应处理
  }
})
</script>
```

### 使用 axios

安装并配置 axios 插件：

```javascript
// plugins/axios.js
export default function({ $axios, redirect }) {
  $axios.onError(error => {
    if (error.response.status === 500) {
      redirect('/sorry')
    }
  })
}

// 在组件中使用
export default {
  async asyncData({ $axios }) {
    const posts = await $axios.$get('/api/posts')
    return { posts }
  }
}
```

## 性能优化策略

### 缓存策略

示意图：
[首次请求] → [数据获取] → [缓存存储]  
[后续请求] → [缓存命中] → [直接返回]

**useAsyncData 缓存**：
```javascript
const { data } = await useAsyncData('cached-data', 
  () => $fetch('/api/data'),
  {
    cache: true,
    maxAge: 3600 // 缓存1小时
  }
)
```

### 预加载与懒加载

**预加载关键数据**：
```javascript
// 在父组件预加载子组件数据
onMounted(async () => {
  await preloadComponents(['/pages/child.vue'])
})
```

**懒加载非关键数据**：
```javascript
const loadAdditionalData = async () => {
  const { data } = await useAsyncData('additional', 
    () => $fetch('/api/additional'),
    { server: false } // 仅在客户端获取
  )
}
```

## 错误处理与加载状态

### 统一错误处理

```javascript
export default {
  async asyncData({ error }) {
    try {
      const data = await $fetch('/api/data')
      return { data }
    } catch (err) {
      error({ 
        statusCode: 404, 
        message: '数据获取失败' 
      })
    }
  }
}
```

### 加载状态管理

```javascript
<template>
  <div>
    <div v-if="$fetchState.pending" class="loading">
      加载中...
    </div>
    <div v-else-if="$fetchState.error" class="error">
      加载失败
    </div>
    <div v-else>
      <!-- 正常内容 -->
    </div>
    
    <button @click="$fetch" :disabled="$fetchState.pending">
      刷新数据
    </button>
  </div>
</template>
```

## 最佳实践指南

### 选择合适的数据获取方法

| 场景 | 推荐方案 | 理由 |
|------|----------|------|
| Nuxt 3 页面组件 | useAsyncData/useFetch | 更好的 TypeScript 支持，Composition API |
| Nuxt 2 页面组件 | asyncData | 传统稳定，Options API 风格 |
| 非页面组件 | fetch | 支持组件级数据获取 |
| 全局数据 | Vuex + nuxtServerInit | 多组件共享数据 |

### 性能优化建议

1. **合理使用缓存**
   ```javascript
   // 适合缓存的数据
   const { data: categories } = await useAsyncData('categories',
     () => $fetch('/api/categories'),
     { cache: true, maxAge: 86400 } // 缓存24小时
   )
   ```

2. **减少服务端负载**
   ```javascript
   // 非关键数据在客户端获取
   const { data: analytics } = await useAsyncData('analytics',
     () => $fetch('/api/analytics'),
     { server: false }
   )
   ```

3. **代码分割优化**
   ```javascript
   // 大型数据集分页加载
   const { data: items } = await useAsyncData('items',
     () => $fetch(`/api/items?page=${page.value}&limit=20`)
   )
   ```

### 开发体验提升

**类型安全**：
```typescript
interface Post {
  id: number
  title: string
  content: string
}

const { data: posts } = await useAsyncData<Post[]>('posts',
  () => $fetch('/api/posts')
)
```

**组合式函数复用**：
```javascript
// composables/usePosts.js
export const usePosts = () => {
  return useAsyncData('posts', () => $fetch('/api/posts'))
}

// 在组件中使用
const { data: posts } = usePosts()
```