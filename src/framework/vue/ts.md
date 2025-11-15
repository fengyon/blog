# Vue TS

## 前言

Vue 3 与 TypeScript 的结合为开发者带来了更好的类型安全和开发体验。在 `<script setup>` 语法糖中，我们可以充分利用 TypeScript 的优势，编写更加健壮和可维护的代码。

## 为什么在 Vue 3 中使用 TypeScript

### 主要优势

1. **类型安全** - 在编译时捕获类型错误
2. **更好的 IDE 支持** - 智能提示、自动补全和重构
3. **代码可读性** - 明确的接口定义和类型约束
4. **团队协作** - 清晰的组件契约和接口规范
5. **重构友好** - 类型检查确保重构的安全性

## 在 script setup 中使用 TypeScript

### 基本设置

```vue
<script setup lang="ts">
// TypeScript 代码将在这里编写
</script>
```

## 定义 Props 类型

### 方式一：使用运行时声明

```vue
<script setup lang="ts">
interface Props {
  title: string
  count: number
  isVisible?: boolean
  items: string[]
  onAction?: () => void
}

const props = defineProps<Props>()
</script>
```

### 方式二：使用响应式默认值

```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
  tags?: string[]
}

// 使用 withDefaults 为 props 提供默认值
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  tags: () => ['default'],
})
</script>
```

### 方式三：复杂对象类型

```vue
<script setup lang="ts">
interface User {
  id: number
  name: string
  email: string
  avatar?: string
}

interface Props {
  user: User
  settings: {
    theme: 'light' | 'dark'
    language: string
    notifications: boolean
  }
}

const props = defineProps<Props>()
</script>
```

## 定义 Emits 类型

### 方式一：类型字面量声明

```vue
<script setup lang="ts">
// 定义 emits 类型
const emit = defineEmits<{
  // 事件名: 参数类型
  'update:title': [value: string]
  change: [value: number, isValid: boolean]
  submit: [data: FormData]
  cancel: []
}>()

// 使用 emits
const handleUpdate = (newTitle: string) => {
  emit('update:title', newTitle)
}

const handleChange = (value: number) => {
  emit('change', value, value > 0)
}
</script>
```

### 方式二：使用泛型约束

```vue
<script setup lang="ts">
interface Emits {
  (e: 'search', query: string): void
  (e: 'select', item: Item, index: number): void
  (e: 'load-more'): void
}

const emit = defineEmits<Emits>()
</script>
```

## 定义 Provide / Inject 类型

### 提供数据 (Provide)

```vue
<script setup lang="ts">
import { provide, ref, reactive } from 'vue'

// 定义注入的键和类型
interface UserContext {
  user: {
    id: number
    name: string
    role: string
  }
  login: (credentials: LoginData) => Promise<void>
  logout: () => void
}

const userContext = reactive<UserContext>({
  user: {
    id: 1,
    name: 'John Doe',
    role: 'admin',
  },
  login: async (credentials) => {
    // 登录逻辑
  },
  logout: () => {
    // 登出逻辑
  },
})

// 提供带类型的数据
provide<UserContext>('userContext', userContext)

// 多个 provide 示例
interface ThemeConfig {
  mode: 'light' | 'dark'
  primaryColor: string
}

const theme = ref<ThemeConfig>({
  mode: 'light',
  primaryColor: '#1890ff',
})

provide<ThemeConfig>('theme', theme)
</script>
```

### 注入数据 (Inject)

```vue
<script setup lang="ts">
import { inject } from 'vue'

// 定义注入的类型
interface UserContext {
  user: {
    id: number
    name: string
    role: string
  }
  login: (credentials: LoginData) => Promise<void>
  logout: () => void
}

interface ThemeConfig {
  mode: 'light' | 'dark'
  primaryColor: string
}

// 注入数据，提供默认值
const userContext = inject<UserContext>('userContext', {
  user: {
    id: 0,
    name: 'Guest',
    role: 'user',
  },
  login: async () => {},
  logout: () => {},
})

// 注入必须的数据（不提供默认值）
const theme = inject<ThemeConfig>('theme')!

// 使用注入的数据
const handleLogin = async () => {
  await userContext.login({
    username: 'user',
    password: 'pass',
  })
}
</script>
```

## 完整的组件示例

```vue
<template>
  <div :class="['card', `theme-${theme.mode}`]">
    <h3>{{ title }}</h3>
    <p>计数: {{ count }}</p>

    <div v-if="user.user.name !== 'Guest'">
      <p>欢迎, {{ user.user.name }}</p>
      <button @click="handleIncrement">增加</button>
      <button @click="handleLogout">退出</button>
    </div>

    <div v-else>
      <button @click="handleLogin">登录</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, withDefaults } from 'vue'

// 定义 Props 类型
interface Props {
  title: string
  initialCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialCount: 0,
})

// 定义 Emits 类型
const emit = defineEmits<{
  'count-change': [newCount: number]
  'user-action': [action: string]
}>()

// 定义注入类型
interface UserContext {
  user: {
    id: number
    name: string
    role: string
  }
  login: () => Promise<void>
  logout: () => void
}

interface ThemeConfig {
  mode: 'light' | 'dark'
  primaryColor: string
}

// 注入依赖
const user = inject<UserContext>('userContext', {
  user: { id: 0, name: 'Guest', role: 'user' },
  login: async () => {},
  logout: () => {},
})

const theme = inject<ThemeConfig>('theme', {
  mode: 'light',
  primaryColor: '#1890ff',
})

// 响应式数据
const count = ref(props.initialCount)

// 方法
const handleIncrement = () => {
  count.value++
  emit('count-change', count.value)
}

const handleLogin = async () => {
  await user.login()
  emit('user-action', 'login')
}

const handleLogout = () => {
  user.logout()
  emit('user-action', 'logout')
}
</script>

<style scoped>
.card {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.theme-dark {
  background: #333;
  color: white;
}

.theme-light {
  background: white;
  color: #333;
}
</style>
```

## 最佳实践

### 1。使用类型别名和接口

```typescript
// types/user.ts
export interface User {
  id: number
  name: string
  email: string
  avatar?: string
}

export type UserRole = 'admin' | 'user' | 'guest'

// types/api.ts
export interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}
```

### 2。创建可重用的组合式函数

```typescript
// composables/useCounter.ts
interface UseCounterOptions {
  initialValue?: number
  min?: number
  max?: number
}

interface UseCounterReturn {
  count: Ref<number>
  increment: () => void
  decrement: () => void
  reset: () => void
  set: (value: number) => void
}

export function useCounter(
  options: UseCounterOptions = {},
): UseCounterReturn {
  const { initialValue = 0, min, max } = options

  const count = ref(initialValue)

  const increment = () => {
    if (max === undefined || count.value < max) {
      count.value++
    }
  }

  const decrement = () => {
    if (min === undefined || count.value > min) {
      count.value--
    }
  }

  const reset = () => {
    count.value = initialValue
  }

  const set = (value: number) => {
    if (min !== undefined && value < min) {
      count.value = min
    } else if (max !== undefined && value > max) {
      count.value = max
    } else {
      count.value = value
    }
  }

  return {
    count,
    increment,
    decrement,
    reset,
    set,
  }
}
```
