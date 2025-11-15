# Vue 指令详解

## 什么是 Vue 指令

Vue 指令是带有 `v-` 前缀的特殊属性，用于在模板中为元素添加特殊行为。指令的值是一个 JavaScript 表达式 (除了 `v-for`)，指令会在表达式值改变时响应式地作用在 DOM 上。

## 内置指令及作用

### 常用内置指令

| 指令        | 作用                       | 示例                                  |
| ----------- | -------------------------- | ------------------------------------- |
| `v-text`    | 更新元素的 textContent     | `v-text="message"`                    |
| `v-html`    | 更新元素的 innerHTML       | `v-html="htmlContent"`                |
| `v-show`    | 根据条件显示/隐藏元素      | `v-show="isVisible"`                  |
| `v-if`      | 条件渲染元素               | `v-if="isActive"`                     |
| `v-else`    | 与 v-if 搭配使用           | `v-else`                              |
| `v-else-if` | v-if 的 else-if 块         | `v-else-if="condition"`               |
| `v-for`     | 循环渲染元素               | `v-for="item in items"`               |
| `v-on`      | 绑定事件监听器             | `v-on:click="handleClick"`            |
| `v-bind`    | 动态绑定属性               | `v-bind:class="{ active: isActive }"` |
| `v-model`   | 表单输入双向绑定           | `v-model="username"`                  |
| `v-slot`    | 插槽指令                   | `v-slot:header`                       |
| `v-pre`     | 跳过编译过程               | `v-pre`                               |
| `v-once`    | 一次性插值                 | `v-once`                              |
| `v-cloak`   | 隐藏未编译的 Mustache 标签 | `v-cloak`                             |

## 结构指令 vs 功能指令

### 结构指令

结构指令会更改 DOM 的结构，添加、移除或替换元素。

**特点：**

- 直接影响 DOM 结构
- 通常与条件渲染或列表渲染相关
- 如：`v-if`，`v-for`，`v-show`

**适用场景：**

- 条件性显示/隐藏内容
- 列表数据渲染
- 动态组件切换

### 功能指令

功能指令用于添加特定功能或行为，但不改变 DOM 结构。

**特点：**

- 为元素添加交互行为
- 处理事件、属性绑定等
- 如：`v-on`，`v-bind`，`v-model`

**适用场景：**

- 事件处理
- 属性动态绑定
- 表单处理

## 自定义指令

### 注册自定义指令

#### 全局注册

```javascript
// main.js
const app = createApp(App)

app.directive('focus', {
  mounted(el) {
    el.focus()
  },
})
```

#### 局部注册

```vue
<script setup>
// 在 <script setup> 中，任何以 v 开头的驼峰式命名的变量都可以被用作一个自定义指令
const vFocus = {
  mounted: (el) => el.focus(),
}
</script>

<template>
  <input v-focus />
</template>
```

### 指令钩子函数

```javascript
const myDirective = {
  // 在绑定元素的 attribute 前
  // 或事件监听器应用前调用
  created(el, binding, vnode, prevVnode) {
    // 下面会介绍各个参数的细节
  },
  // 在元素被插入到 DOM 前调用
  beforeMount(el, binding, vnode, prevVnode) {},
  // 在绑定元素的父组件
  // 及他自己的所有子节点都挂载完成后调用
  mounted(el, binding, vnode, prevVnode) {},
  // 绑定元素的父组件更新前调用
  beforeUpdate(el, binding, vnode, prevVnode) {},
  // 在绑定元素的父组件
  // 及他自己的所有子节点都更新后调用
  updated(el, binding, vnode, prevVnode) {},
  // 绑定元素的父组件卸载前调用
  beforeUnmount(el, binding, vnode, prevVnode) {},
  // 绑定元素的父组件卸载后调用
  unmounted(el, binding, vnode, prevVnode) {},
}
```

### 钩子函数参数

- `el`：指令绑定到的元素
- `binding`：包含以下属性的对象
  - `value`：传递给指令的值
  - `oldValue`：之前的值
  - `arg`：传递给指令的参数
  - `modifiers`：包含修饰符的对象
  - `instance`：使用该指令的组件实例
- `vnode`：代表绑定元素的底层 VNode
- `prevNode`：之前的渲染中代表指令所绑定元素的 VNode

## 实用自定义指令示例

### 1。点击外部关闭指令

```vue
<template>
  <div>
    <button @click="showDropdown = true">打开下拉菜单</button>
    <div
      v-if="showDropdown"
      v-click-outside="closeDropdown"
      class="dropdown"
    >
      下拉菜单内容
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showDropdown = ref(false)

const vClickOutside = {
  beforeMount(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  },
}

const closeDropdown = () => {
  showDropdown.value = false
}
</script>
```

### 2。权限控制指令

```vue
<template>
  <div>
    <button v-permission="'admin'">管理员按钮</button>
    <button v-permission="'user'">用户按钮</button>
    <button v-permission="['admin', 'editor']">编辑者按钮</button>
  </div>
</template>

<script setup>
import { useUserStore } from './stores/user'

const userStore = useUserStore()

const vPermission = {
  mounted(el, binding) {
    const { value } = binding
    const userRoles = userStore.roles

    if (!value) return

    const requiredRoles = Array.isArray(value) ? value : [value]
    const hasPermission = requiredRoles.some((role) =>
      userRoles.includes(role),
    )

    if (!hasPermission) {
      el.parentNode?.removeChild(el)
    }
  },
}
</script>
```

### 3。图片懒加载指令

```vue
<template>
  <div class="image-container">
    <img
      v-for="image in images"
      :key="image.id"
      v-lazy-load="image.url"
      alt="懒加载图片"
      class="lazy-image"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const images = ref([
  { id: 1, url: 'https://example.com/image1.jpg' },
  { id: 2, url: 'https://example.com/image2.jpg' },
  // ... more images
])

const vLazyLoad = {
  mounted(el, binding) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.src = binding.value
            el.classList.add('loaded')
            observer.unobserve(el)
          }
        })
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1,
      },
    )

    observer.observe(el)

    // 保存 observer 到元素上，以便在卸载时断开连接
    el._lazyLoadObserver = observer
  },
  unmounted(el) {
    if (el._lazyLoadObserver) {
      el._lazyLoadObserver.unobserve(el)
    }
  },
}
</script>

<style>
.lazy-image {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lazy-image.loaded {
  opacity: 1;
}
</style>
```

### 4。复制到剪贴板指令

```vue
<template>
  <div>
    <input v-model="textToCopy" placeholder="输入要复制的文本" />
    <button v-copy="textToCopy" @success="onCopySuccess">复制文本</button>
    <p v-if="copyMessage">{{ copyMessage }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const textToCopy = ref('')
const copyMessage = ref('')

const vCopy = {
  mounted(el, binding) {
    el.addEventListener('click', async () => {
      try {
        if (!binding.value) {
          throw new Error('没有文本可复制')
        }

        await navigator.clipboard.writeText(binding.value)

        // 触发成功事件
        el.dispatchEvent(new CustomEvent('success'))
      } catch (err) {
        // 触发错误事件
        el.dispatchEvent(new CustomEvent('error', { detail: err }))
      }
    })
  },
}

const onCopySuccess = () => {
  copyMessage.value = '复制成功！'
  setTimeout(() => {
    copyMessage.value = ''
  }, 2000)
}
</script>
```

## 自定义结构指令

自定义结构指令需要操作 DOM 结构，通常使用 Vue 的渲染函数或 `<teleport>` 来实现。

### 条件权限渲染指令

```vue
<template>
  <div>
    <h1>用户权限演示</h1>

    <!-- 使用自定义结构指令 -->
    <v-permission role="admin">
      <div class="admin-panel">
        <h2>管理员面板</h2>
        <button>删除用户</button>
        <button>修改系统设置</button>
      </div>
    </v-permission>

    <v-permission :role="['admin', 'editor']">
      <div class="editor-panel">
        <h2>编辑者面板</h2>
        <button>发布文章</button>
        <button>编辑内容</button>
      </div>
    </v-permission>

    <v-permission role="user">
      <div class="user-panel">
        <h2>用户面板</h2>
        <button>查看内容</button>
      </div>
    </v-permission>
  </div>
</template>

<script setup>
import { h, resolveComponent } from 'vue'
import { useUserStore } from './stores/user'

const userStore = useUserStore()

const VPermission = (props, { slots }) => {
  const { role } = props
  const userRoles = userStore.roles

  if (!role) {
    return slots.default?.()
  }

  const requiredRoles = Array.isArray(role) ? role : [role]
  const hasPermission = requiredRoles.some((r) => userRoles.includes(r))

  if (hasPermission) {
    return slots.default?.()
  }

  return null
}

// 为组件添加 displayName 便于调试
VPermission.props = ['role']
</script>
```

### 延迟加载内容指令

```vue
<template>
  <div class="container">
    <h1>延迟加载演示</h1>

    <v-lazy-load :timeout="1000">
      <div class="heavy-content">
        <h2>这个内容会延迟加载</h2>
        <p>这里可能包含大量图片、视频或其他重型资源</p>
        <!-- 模拟重型内容 -->
        <div v-for="n in 10" :key="n" class="content-block">
          内容块 {{ n }}
        </div>
      </div>

      <template #loading>
        <div class="loading-spinner">⏳ 加载中...</div>
      </template>
    </v-lazy-load>

    <v-lazy-load :timeout="2000" :immediate="false">
      <div class="another-content">
        <h2>另一个延迟加载的内容</h2>
        <p>这个内容需要用户交互或滚动到视口才加载</p>
      </div>

      <template #loading>
        <div class="loading-spinner">🔄 等待触发...</div>
      </template>
    </v-lazy-load>
  </div>
</template>

<script setup>
import { h, ref, onMounted, onUnmounted, resolveComponent } from 'vue'

const VLazyLoad = (props, { slots, attrs }) => {
  const isLoaded = ref(props.immediate !== false)
  const isInViewport = ref(false)
  let observer = null
  let timeoutId = null

  const loadContent = () => {
    if (isLoaded.value) return

    timeoutId = setTimeout(() => {
      isLoaded.value = true
    }, props.timeout || 0)
  }

  const setupIntersectionObserver = (el) => {
    if (props.immediate === false) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isInViewport.value = true
            loadContent()
            observer.unobserve(el)
          }
        })
      })

      observer.observe(el)
    } else {
      loadContent()
    }
  }

  onMounted(() => {
    // 在客户端才执行
    if (typeof window !== 'undefined') {
      const el = document.querySelector('[data-lazy-load]')
      if (el) {
        setupIntersectionObserver(el)
      }
    }
  })

  onUnmounted(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    if (observer) {
      observer.disconnect()
    }
  })

  return () => {
    if (isLoaded.value) {
      return h(
        'div',
        { ...attrs, 'data-lazy-load': '' },
        slots.default?.(),
      )
    } else {
      return h(
        'div',
        { ...attrs, 'data-lazy-load': '' },
        slots.loading?.(),
      )
    }
  }
}

VLazyLoad.props = ['timeout', 'immediate']
</script>

<style scoped>
.loading-spinner {
  padding: 20px;
  text-align: center;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 10px 0;
}

.content-block {
  padding: 10px;
  margin: 5px 0;
  background: #e9e9e9;
  border-radius: 4px;
}

.heavy-content,
.another-content {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 10px 0;
}
</style>
```
