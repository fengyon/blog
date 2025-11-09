# nuxtjs 路由系统

## 理解路由

在现代 Web 开发中，**路由**是根据 URL 路径决定显示哪个页面内容的机制。当用户访问网站的不同路径时，路由系统会匹配对应的页面组件进行渲染。

传统 Vue 项目需要手动配置路由，而 Nuxt.js 提供了**基于文件系统的自动路由生成**机制，大幅简化了路由配置工作。

## 自动路由原理

Nuxt.js 最核心的特性是**文件系统即路由**。框架会根据 `pages` 目录结构自动生成 `vue-router` 配置，无需手动编写路由表。

### 工作机制

- **约定优于配置**：`pages` 目录下的 `.vue` 文件自动映射为路由
- **自动代码分割**：每个页面自动进行代码分割，优化加载性能
- **动态路由支持**：通过特殊命名规则支持动态参数路由

### 基础路由

假设 `pages` 目录结构如下：
```
pages/
--| index.vue
--| about.vue
--| contact.vue
```

Nuxt.js 会自动生成：
```
router: {
  routes: [
    { path: '/', component: 'pages/index.vue' },
    { path: '/about', component: 'pages/about.vue' },
    { path: '/contact', component: 'pages/contact.vue' }
  ]
}
```

## 动态路由

### 基本动态路由

创建带参数的动态路由，需要创建以下划线 `_` 作为前缀的 Vue 文件。

目录结构：
```
pages/
--| users/
-----| _id.vue
--| index.vue
```

生成的路由配置：
```
router: {
  routes: [
    { name: 'index', path: '/', component: 'pages/index.vue' },
    { name: 'users-id', path: '/users/:id?', component: 'pages/users/_id.vue' }
  ]
}
```

### 路由参数校验

Nuxt.js 允许在动态路由组件中定义参数校验方法：

```javascript
export default {
  validate({ params }) {
    // 必须是数字类型
    return /^\d+$/.test(params.id)
  }
}
```

如果校验失败，Nuxt.js 自动加载 404 错误页面。

## 嵌套路由

### 基础嵌套路由

创建内嵌子路由，需要添加一个 Vue 文件，同时添加同名目录存放子视图组件。

文件结构：
```
pages/
--| users/
-----| _id.vue
-----| index.vue
--| users.vue
```

生成的路由配置：
```
router: {
  routes: [
    {
      path: '/users',
      component: 'pages/users.vue',
      children: [
        { path: '', component: 'pages/users/index.vue', name: 'users' },
        { path: ':id', component: 'pages/users/_id.vue', name: 'users-id' }
      ]
    }
  ]
}
```

**注意**：父组件中必须使用 `<nuxt-child/>` 显示子视图内容。

### 复杂嵌套路由

Nuxt.js 支持动态路由下的动态子路由：

文件结构：
```
pages/
--| _category/
-----| _subCategory/
--------| _id.vue
--------| index.vue
-----| _subCategory.vue
-----| index.vue
--| _category.vue
--| index.vue
```

这种结构适合多级分类场景，如电商网站的商品分类。

## 页面导航

### NuxtLink 组件

在页面之间导航，推荐使用 `<nuxt-link>` 而不是普通 `<a>` 标签。

**优势**：
- **预加载**：智能预加载即将访问的页面资源
- **无缝过渡**：支持页面间平滑过渡效果
- **性能优化**：避免整页刷新，提升用户体验

**使用示例**：
```vue
<template>
  <div>
    <nuxt-link to="/about">关于我们</nuxt-link>
    <nuxt-link :to="{name: 'users-id', params: {id: 1}}">用户详情</nuxt-link>
  </div>
</template>
```

### 编程式导航

在组件方法中通过 `$router` 进行导航：

```javascript
// 路径方式
this.$router.push('/users')

// 命名路由方式
this.$router.push({name: 'users-id', params: {id: 1}})
```

## 路由参数传递

### Params 传参

通过动态路由段传递参数：

```vue
<nuxt-link :to="{name: 'users-id', params: {id: 1}}">用户1</nuxt-link>
```

在目标页面通过 `$route.params` 获取：

```javascript
export default {
  asyncData({ params }) {
    const userId = params.id
    // 获取数据
  }
}
```

### Query 传参

通过 URL 查询字符串传递参数：

```javascript
this.$router.push({path: '/users', query: {page: 1, sort: 'name'}})
```

在目标页面通过 `$route.query` 获取。

## 高级路由功能

### 路由配置扩展

虽然 Nuxt.js 的自动路由很强大，但仍支持自定义配置：

```javascript
// nuxt.config.js
export default {
  router: {
    extendRoutes(routes, resolve) {
      routes.push({
        name: 'custom',
        path: '/custom-route',
        component: resolve(__dirname, 'pages/custom.vue')
      })
    },
    // 自定义活动链接类名
    linkActiveClass: 'my-active',
    linkExactActiveClass: 'my-exact-active'
  }
}
```

### 路由中间件

路由中间件在页面渲染前执行特定逻辑：

1. 创建中间件文件 `middleware/auth.js`：

```javascript
export default function({ store, redirect }) {
  if (!store.state.auth) {
    return redirect('/login')
  }
}
```

2. 在页面中使用：

```javascript
export default {
  middleware: 'auth'
}
```

**应用场景**：
- 权限验证
- 数据预取
- 页面访问控制
- 日志记录

### 未知路径处理

创建 `pages/_.vue` 文件作为 404 页面，处理未匹配路由。

### 滚动行为

自定义页面切换时的滚动位置：

```javascript
// app/router.scrollBehavior.js
export default function(to, from, savedPosition) {
  if (savedPosition) {
    return savedPosition
  }
  return { x: 0, y: 0 }
}
```