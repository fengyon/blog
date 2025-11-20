# Vue3 响应式原理详解

## 什么是响应式？

Vue3 的响应式系统是其核心特性之一，它允许我们声明式地描述数据与视图的关系。当数据发生变化时，依赖这些数据的视图会自动更新，无需手动操作 DOM。

## 响应式的好处

1. **声明式编程**：只需关注数据状态，无需关心 DOM 操作
2. **自动依赖追踪**：系统自动追踪数据依赖关系
3. **高效更新**：精确更新依赖变化的组件，避免不必要的渲染
4. **更好的开发体验**：代码更简洁，逻辑更清晰

## Vue3 响应式实现原理

### 核心 API：Proxy

Vue3 使用 ES6 的 Proxy 替代了 Vue2 的 Object.defineProperty，提供了更强大的拦截能力。

```javascript
// 简化的 reactive 实现原理
function reactive(target) {
  return new Proxy(target, {
    get(obj, key) {
      track(obj, key) // 依赖收集
      return obj[key]
    },
    set(obj, key, value) {
      obj[key] = value
      trigger(obj, key) // 触发更新
      return true
    },
  })
}
```

### 完整的响应式系统

```javascript
// 简化版的响应式系统实现
const targetMap = new WeakMap() // 存储所有响应式对象的依赖关系
let activeEffect = null

function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Set()))
    }
    dep.add(activeEffect)
  }
}

function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep = depsMap.get(key)
  if (dep) {
    dep.forEach((effect) => effect())
  }
}

function effect(fn) {
  activeEffect = fn
  fn()
  activeEffect = null
}
```

## 实际使用示例

### 基本响应式数据

```vue
<template>
  <div>
    <h2>计数器: {{ count }}</h2>
    <button @click="increment">增加</button>
    <button @click="decrement">减少</button>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// 使用 ref 创建响应式基本类型数据
const count = ref(0)

// 使用 reactive 创建响应式对象
const state = reactive({
  message: 'Hello Vue3!',
})

const increment = () => {
  count.value++ // ref 需要通过 .value 访问
}

const decrement = () => {
  count.value--
}

// 响应式对象可以直接访问
console.log(state.message)
</script>
```

### 计算属性

```vue
<template>
  <div>
    <p>价格: {{ price }}</p>
    <p>数量: {{ quantity }}</p>
    <p>总价: {{ totalPrice }}</p>
    <button @click="addQuantity">增加数量</button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const price = ref(10)
const quantity = ref(1)

// 计算属性
const totalPrice = computed(() => {
  return price.value * quantity.value
})

const addQuantity = () => {
  quantity.value++
}
</script>
```

### 监听器

```vue
<template>
  <div>
    <input v-model="searchText" placeholder="搜索..." />
    <p>搜索结果: {{ searchResults }}</p>
  </div>
</template>

<script setup>
import { ref, watch, watchEffect } from 'vue'

const searchText = ref('')
const searchResults = ref('')

// watch 监听特定数据源
watch(searchText, (newValue, oldValue) => {
  console.log(`搜索词从 "${oldValue}" 变为 "${newValue}"`)
  searchResults.value = `正在搜索: ${newValue}`
})

// watchEffect 立即执行，自动追踪依赖
watchEffect(() => {
  console.log(`当前搜索词: ${searchText.value}`)
})
</script>
```

### 复杂对象响应式

```vue
<template>
  <div>
    <h3>用户信息</h3>
    <p>姓名: {{ user.name }}</p>
    <p>年龄: {{ user.age }}</p>
    <p>地址: {{ user.address.city }}</p>

    <button @click="updateUser">更新用户信息</button>
    <button @click="addHobby">添加爱好</button>

    <ul>
      <li v-for="hobby in user.hobbies" :key="hobby">
        {{ hobby }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const user = reactive({
  name: '张三',
  age: 25,
  address: {
    city: '北京',
    street: '朝阳区',
  },
  hobbies: ['篮球', '游泳'],
})

const updateUser = () => {
  // 深层响应式更新
  user.age++
  user.address.city = '上海'
}

const addHobby = () => {
  // 数组响应式更新
  user.hobbies.push('阅读')
}
</script>
```

## 响应式 API 对比

| API           | 用途                   | 返回值           | 特点                   |
| ------------- | ---------------------- | ---------------- | ---------------------- |
| `ref`         | 创建基本类型响应式数据 | Ref 对象         | 需要通过 `.value` 访问 |
| `reactive`    | 创建对象响应式数据     | Proxy 对象       | 直接访问属性           |
| `computed`    | 创建计算属性           | ComputedRef 对象 | 缓存计算结果           |
| `watch`       | 监听数据变化           | 停止监听的函数   | 可监听特定数据源       |
| `watchEffect` | 立即执行副作用         | 停止监听的函数   | 自动追踪依赖           |
