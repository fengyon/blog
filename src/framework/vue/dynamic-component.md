# Vue 动态组件

## 什么是动态组件？

动态组件是 Vue 中一个强大的功能，它允许您在不同的组件之间动态切换，而无需在模板中硬编码特定的组件名称。通过动态组件，您可以根据应用程序的状态、用户交互或其他条件来动态决定要渲染哪个组件。

## 动态组件的好处

1. **灵活性** - 根据运行时条件动态切换组件
2. **代码简洁** - 避免使用大量的 `v-if`/`v-else` 条件渲染
3. **可维护性** - 组件逻辑更清晰，易于扩展
4. **复用性** - 同一位置可以渲染不同的组件

## 定义动态组件

### 基本语法

使用 Vue 的 `<component>` 元素配合 `:is` 属性来定义动态组件：

```vue
<template>
  <component :is="currentComponent"></component>
</template>
```

## 使用动态组件

### 基本使用

```vue
<template>
  <div>
    <button @click="currentComponent = 'ComponentA'">显示组件 A</button>
    <button @click="currentComponent = 'ComponentB'">显示组件 B</button>

    <component :is="currentComponent"></component>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ComponentA from './ComponentA.vue'
import ComponentB from './ComponentB.vue'

const currentComponent = ref('ComponentA')
</script>
```

### 使用组件对象引用

```vue
<template>
  <div>
    <button @click="currentComponent = CompA">显示组件 A</button>
    <button @click="currentComponent = CompB">显示组件 B</button>

    <component :is="currentComponent"></component>
  </div>
</template>

<script setup>
import { ref, shallowRef } from 'vue'
import CompA from './ComponentA.vue'
import CompB from './ComponentB.vue'

const currentComponent = shallowRef(CompA)
</script>
```

### 带参数的动态组件

```vue
<template>
  <div>
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        @click="currentTab = tab.name"
        :class="{ active: currentTab === tab.name }"
      >
        {{ tab.label }}
      </button>
    </div>

    <component
      :is="currentTabComponent"
      :message="currentMessage"
      @custom-event="handleCustomEvent"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import HomePage from './components/HomePage.vue'
import AboutPage from './components/AboutPage.vue'
import ContactPage from './components/ContactPage.vue'

const tabs = [
  { name: 'HomePage', label: '首页' },
  { name: 'AboutPage', label: '关于' },
  { name: 'ContactPage', label: '联系' },
]

const currentTab = ref('HomePage')
const currentMessage = ref('欢迎使用动态组件！')

// 计算当前组件
const currentTabComponent = computed(() => {
  switch (currentTab.value) {
    case 'HomePage':
      return HomePage
    case 'AboutPage':
      return AboutPage
    case 'ContactPage':
      return ContactPage
    default:
      return HomePage
  }
})

const handleCustomEvent = (data) => {
  console.log('收到自定义事件:', data)
}
</script>

<style scoped>
.tabs {
  margin-bottom: 20px;
}

.tabs button {
  padding: 10px 20px;
  margin-right: 10px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
}

.tabs button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}
</style>
```

### 保持组件状态 (keep-alive)

使用 `<keep-alive>` 包裹动态组件可以保持组件状态，避免重复渲染：

```vue
<template>
  <div>
    <button @click="currentView = 'UserList'">用户列表</button>
    <button @click="currentView = 'UserForm'">用户表单</button>

    <keep-alive>
      <component :is="currentView"></component>
    </keep-alive>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import UserList from './components/UserList.vue'
import UserForm from './components/UserForm.vue'

const currentView = ref('UserList')
</script>
```

### 完整的示例项目

**App.vue**

```vue
<template>
  <div class="app">
    <h1>Vue 动态组件示例</h1>

    <div class="controls">
      <button
        v-for="view in views"
        :key="view.id"
        @click="selectView(view.id)"
        :class="{ active: currentViewId === view.id }"
      >
        {{ view.name }}
      </button>
    </div>

    <div class="component-container">
      <keep-alive>
        <component
          :is="currentView.component"
          v-bind="currentView.props"
          @view-change="handleViewChange"
        />
      </keep-alive>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import WelcomePage from './components/WelcomePage.vue'
import UserProfile from './components/UserProfile.vue'
import SettingsPanel from './components/SettingsPanel.vue'

// 视图配置
const views = [
  {
    id: 'welcome',
    name: '欢迎页',
    component: WelcomePage,
    props: { title: '欢迎使用动态组件' },
  },
  {
    id: 'profile',
    name: '用户资料',
    component: UserProfile,
    props: { userId: 123, editable: true },
  },
  {
    id: 'settings',
    name: '设置',
    component: SettingsPanel,
    props: { theme: 'light' },
  },
]

const currentViewId = ref('welcome')

// 计算当前视图
const currentView = computed(() => {
  return views.find((view) => view.id === currentViewId.value) || views[0]
})

const selectView = (viewId) => {
  currentViewId.value = viewId
}

const handleViewChange = (newViewId) => {
  if (views.some((view) => view.id === newViewId)) {
    currentViewId.value = newViewId
  }
}
</script>

<style scoped>
.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.controls {
  margin: 20px 0;
}

.controls button {
  padding: 10px 15px;
  margin-right: 10px;
  border: 1px solid #ddd;
  background: #f5f5f5;
  cursor: pointer;
  border-radius: 4px;
}

.controls button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.component-container {
  border: 1px solid #eee;
  padding: 20px;
  border-radius: 8px;
  min-height: 300px;
}
</style>
```

**WelcomePage.vue**

```vue
<template>
  <div class="welcome-page">
    <h2>{{ title }}</h2>
    <p>这是一个欢迎页面，演示动态组件的使用。</p>
    <button @click="goToProfile">前往用户资料</button>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '欢迎',
  },
})

const emit = defineEmits(['view-change'])

const goToProfile = () => {
  emit('view-change', 'profile')
}
</script>

<style scoped>
.welcome-page {
  text-align: center;
  padding: 20px;
}
</style>
```

## 注意事项

1. **组件注册** - 确保动态使用的组件已经被正确导入和注册
2. **性能考虑** - 对于频繁切换的组件，使用 `shallowRef` 和 `keep-alive` 优化性能
3. **Props 传递** - 使用 `v-bind` 传递 props 到动态组件
4. **事件处理** - 动态组件可以正常触发和监听事件
