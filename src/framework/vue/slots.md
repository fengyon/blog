# Vue Slot 详解

## 什么是插槽（Slot）？

Vue 中的插槽是一种内容分发机制，允许父组件向子组件传递模板内容。它提供了更灵活的组件组合方式，让组件能够接收并渲染外部传入的任意内容。

## 1. 默认插槽（Default Slot）

### 概念

默认插槽是最基本的插槽类型，当父组件没有指定具体插槽名称时，内容会渲染到默认插槽中。

### 代码示例

**子组件 ChildComponent.vue**

```vue
<template>
  <div class="card">
    <div class="card-header">
      <h3>卡片标题</h3>
    </div>
    <div class="card-body">
      <!-- 默认插槽 -->
      <slot>
        <!-- 默认内容，当父组件没有提供内容时显示 -->
        <p>这是默认内容</p>
      </slot>
    </div>
  </div>
</template>

<script setup>
// 不需要额外的逻辑
</script>
```

**父组件 ParentComponent.vue**

```vue
<template>
  <div>
    <ChildComponent>
      <!-- 插入到默认插槽的内容 -->
      <p>这是父组件传入的自定义内容</p>
      <button>点击我</button>
    </ChildComponent>
  </div>
</template>

<script setup>
import ChildComponent from './ChildComponent.vue'
</script>
```

## 2. 具名插槽（Named Slots）

### 概念

具名插槽允许组件拥有多个插槽，通过名称进行区分，父组件可以精确地将内容插入到特定的插槽位置。

### 代码示例

**子组件 LayoutComponent.vue**

```vue
<template>
  <div class="layout">
    <header class="header">
      <!-- 具名插槽：header -->
      <slot name="header"></slot>
    </header>

    <main class="main">
      <!-- 默认插槽 -->
      <slot></slot>
    </main>

    <footer class="footer">
      <!-- 具名插槽：footer -->
      <slot name="footer"></slot>
    </footer>

    <aside class="sidebar">
      <!-- 具名插槽：sidebar -->
      <slot name="sidebar"></slot>
    </aside>
  </div>
</template>

<script setup>
// 组件逻辑
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-areas:
    'header header'
    'sidebar main'
    'footer footer';
  gap: 10px;
}
.header {
  grid-area: header;
}
.main {
  grid-area: main;
}
.sidebar {
  grid-area: sidebar;
}
.footer {
  grid-area: footer;
}
</style>
```

**父组件 App.vue**

```vue
<template>
  <LayoutComponent>
    <!-- 使用 v-slot:name 或 #name 语法 -->
    <template v-slot:header>
      <h1>网站标题</h1>
      <nav>
        <a href="#home">首页</a>
        <a href="#about">关于</a>
      </nav>
    </template>

    <!-- 默认插槽内容 -->
    <div>
      <h2>主要内容区域</h2>
      <p>这是页面的主要内容...</p>
    </div>

    <!-- 使用缩写语法 #name -->
    <template #sidebar>
      <div class="sidebar-content">
        <h3>侧边栏</h3>
        <ul>
          <li>菜单项1</li>
          <li>菜单项2</li>
        </ul>
      </div>
    </template>

    <template #footer>
      <p>&copy; 2024 我的网站. 版权所有.</p>
    </template>
  </LayoutComponent>
</template>

<script setup>
import LayoutComponent from './LayoutComponent.vue'
</script>
```

## 3. 作用域插槽（Scoped Slots）

### 概念

作用域插槽允许子组件将数据传递给插槽内容，父组件可以在插槽内容中访问子组件的数据。

### 代码示例

**子组件 DataList.vue**

```vue
<template>
  <div class="data-list">
    <h3>数据列表</h3>
    <ul>
      <!-- 作用域插槽，向父组件传递 item 和 index 数据 -->
      <li v-for="(item, index) in items" :key="item.id">
        <slot name="item" :item="item" :index="index">
          <!-- 默认显示 -->
          {{ item.name }}
        </slot>
      </li>
    </ul>

    <!-- 另一个作用域插槽示例 -->
    <div class="stats">
      <slot name="stats" :total="items.length" :completed="completedCount">
        <p>总计: {{ items.length }} 项</p>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const items = ref([
  { id: 1, name: '项目一', completed: true },
  { id: 2, name: '项目二', completed: false },
  { id: 3, name: '项目三', completed: true },
])

const completedCount = computed(
  () => items.value.filter((item) => item.completed).length,
)
</script>
```

**父组件 ParentComponent.vue**

```vue
<template>
  <div>
    <DataList>
      <!-- 接收子组件传递的数据 -->
      <template #item="{ item, index }">
        <div class="custom-item" :class="{ completed: item.completed }">
          <span>{{ index + 1 }}. {{ item.name }}</span>
          <span v-if="item.completed">✅</span>
          <span v-else>⏳</span>
        </div>
      </template>

      <template #stats="{ total, completed }">
        <div class="custom-stats">
          <p>总项目: {{ total }}</p>
          <p>已完成: {{ completed }}</p>
          <p>完成率: {{ Math.round((completed / total) * 100) }}%</p>
        </div>
      </template>
    </DataList>
  </div>
</template>

<script setup>
import DataList from './DataList.vue'
</script>

<style scoped>
.custom-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  margin: 4px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.custom-item.completed {
  background-color: #f0f9ff;
  border-color: #bae6fd;
}

.custom-stats {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}
</style>
```

## 4. 高级用法和技巧

### 动态插槽名

```vue
<template>
  <div>
    <ChildComponent>
      <template v-slot:[dynamicSlotName]>
        <p>动态插槽内容</p>
      </template>
    </ChildComponent>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const dynamicSlotName = ref('header')
</script>
```

### 插槽作用域访问

```vue
<template>
  <ListComponent v-slot="{ items }">
    <div v-for="item in items" :key="item.id">
      {{ item.name }}
    </div>
  </ListComponent>
</template>
```

### 组合使用示例

**子组件 AdvancedComponent.vue**

```vue
<template>
  <div class="advanced-component">
    <!-- 默认插槽带作用域 -->
    <slot :user="currentUser" :settings="settings">
      <p>默认用户界面</p>
    </slot>

    <!-- 具名作用域插槽 -->
    <div class="actions">
      <slot name="actions" :user="currentUser" :onSave="handleSave">
        <button @click="handleSave">保存</button>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const currentUser = ref({
  name: '张三',
  role: 'admin',
})

const settings = ref({
  theme: 'dark',
  language: 'zh-CN',
})

const handleSave = () => {
  console.log('保存操作')
}
</script>
```

**父组件 UsageExample.vue**

```vue
<template>
  <AdvancedComponent v-slot="{ user, settings }">
    <div class="user-profile">
      <h2>用户信息</h2>
      <p>姓名: {{ user.name }}</p>
      <p>角色: {{ user.role }}</p>
      <p>主题: {{ settings.theme }}</p>
      <p>语言: {{ settings.language }}</p>
    </div>

    <template #actions="{ onSave, user }">
      <div class="custom-actions">
        <button @click="onSave" class="btn-primary">保存设置</button>
        <button @click="editUser(user)" class="btn-secondary">
          编辑用户
        </button>
        <button @click="logout" class="btn-danger">退出登录</button>
      </div>
    </template>
  </AdvancedComponent>
</template>

<script setup>
import AdvancedComponent from './AdvancedComponent.vue'

const editUser = (user) => {
  console.log('编辑用户:', user)
}

const logout = () => {
  console.log('退出登录')
}
</script>
```

## 总结

| 插槽类型   | 语法                  | 用途           | 特点                   |
| ---------- | --------------------- | -------------- | ---------------------- |
| 默认插槽   | `<slot>`              | 基础内容分发   | 不指定名称的插槽       |
| 具名插槽   | `<slot name="xxx">`   | 多位置内容分发 | 通过名称精确投放       |
| 作用域插槽 | `<slot :data="data">` | 子向父传递数据 | 父组件可访问子组件数据 |
