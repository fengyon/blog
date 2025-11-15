# umijs 路由

UmiJS 是一个可扩展的企业级前端应用框架，它以路由为基础，支持配置式路由和约定式路由，并以此进行功能扩展。UmiJS 的路由系统非常强大，提供了多种路由方式和进阶功能，让开发者能够灵活地处理各种路由需求。

## 什么是 UmiJS 路由

UmiJS 路由是 UmiJS 框架的核心功能之一，它以路由为基础，支持多种路由方式，并提供了丰富的路由功能。UmiJS 路由基于 React Router 6 实现，提供了完备的路由功能。

**主要特性：**
- 同时支持配置式路由和约定式路由
- 支持动态路由、嵌套路由等进阶功能
- 支持路由级的按需加载
- 内置路由权限控制机制
- 完整的 TypeScript 支持

## 路由的两种方式

UmiJS 提供了两种路由方式：约定式路由和配置式路由。

### 约定式路由

约定式路由是指 UmiJS 会根据 `src/pages` 目录的结构自动生成路由配置。这种方式无需手动配置路由，UmiJS 会自动扫描 `pages` 目录下的文件结构并生成对应的路由。

**基础路由示例：**
```
pages/
  index.tsx        => 路由: /
  users/
    index.tsx      => 路由: /users
    list.tsx       => 路由: /users/list
```

UmiJS 会自动生成以下路由配置：
```javascript
[
  { path: "/", component: "./pages/index.tsx" },
  { path: "/users/", component: "./pages/users/index.tsx" },
  { path: "/users/list", component: "./pages/users/list.tsx" },
]
```

### 配置式路由

配置式路由需要在 `.umirc.ts` 或 `config/config.ts` 文件中通过 `routes` 配置项手动定义路由规则。

```javascript
// .umirc.ts
export default {
  routes: [
    { exact: true, path: '/', component: '@/pages/home' },
    { exact: true, path: '/home', component: '@/pages/about' },
    { exact: true, path: '/about', component: '@/pages/index' },
  ],
};
```

**注意：**一旦手动配置了 `routes`，约定式路由将自动失效。

## 约定式路由详解

约定式路由是 UmiJS 的特色功能，它通过文件系统的结构来自动生成路由配置。

### 动态路由

UmiJS 约定，带 `$` 前缀的目录或文件为动态路由。

```
pages/
  users/
    $id.tsx        => 路由: /users/:id
  $post/
    index.tsx      => 路由: /:post
    comments.tsx   => 路由: /:post/comments
```

对应的路由配置为：
```javascript
[
  { path: "/users/:id", component: "./pages/users/$id.tsx" },
  { path: "/:post/", component: "./pages/$post/index.tsx" },
  { path: "/:post/comments", component: "./pages/$post/comments.tsx" },
]
```

### 可选动态路由

UmiJS 约定带 `$` 后缀的动态路由为可选动态路由。

```
pages/
  users/
    $id$.tsx       => 路由: /users/:id?
  index.tsx        => 路由: /
```

对应的路由配置为：
```javascript
[
  { path: "/", component: "./pages/index.tsx" },
  { path: "/users/:id?", component: "./pages/users/$id$.tsx" },
]
```

### 嵌套路由

UmiJS 约定目录下有 `_layout.tsx` 时会生成嵌套路由，以 `_layout.tsx` 为该目录的布局组件。

```
pages/
  users/
    _layout.tsx
    index.tsx
    $id.tsx
```

对应的路由配置为：
```javascript
[
  { 
    path: "/users", 
    component: "./pages/users/_layout.tsx",
    routes: [
      { path: "/users/", component: "./pages/users/index.tsx" },
      { path: "/users/:id", component: "./pages/users/$id.tsx" },
    ],
  },
]
```

## 配置式路由详解

配置式路由提供了更灵活的路由控制能力，适合复杂的路由需求。

### 基本配置

在 `.umirc.ts` 或 `config/config.ts` 文件中配置路由：

```javascript
export default {
  routes: [
    { exact: true, path: '/', component: '@/pages/index' },
    { exact: true, path: '/user', component: '@/pages/user' },
    {
      path: '/admin',
      component: '@/layouts/admin',
      routes: [
        { path: '/admin/user', component: '@/pages/admin/user' },
        { path: '/admin/settings', component: '@/pages/admin/settings' },
      ],
    },
  ],
};
```

### 路由属性

配置式路由支持多种路由属性：

- `path`：路由路径
- `component`：路由组件
- `exact`：是否精确匹配
- `routes`：子路由配置
- `redirect`：重定向路径
- `wrappers`：路由包装组件，可用于路由权限控制

## 路由跳转

UmiJS 提供了两种方式进行路由跳转：声明式和命令式。

### 声明式跳转

使用 `Link` 组件进行声明式路由跳转：

```jsx
import { Link } from 'umi';

export default () => (
  <div>
    <Link to="/users">Go to Users Page</Link>
  </div>
);
```

### 命令式跳转

使用 `history` 或 `router` 对象进行命令式路由跳转：

```jsx
import { history } from 'umi';

export default () => {
  const goToListPage = () => {
    history.push('/list');
  };
  
  return (
    <div>
      <button onClick={goToListPage}>Go to List Page</button>
    </div>
  );
};
```

## 布局系统

UmiJS 提供了强大的布局系统，包括全局布局和局部布局。

### 全局布局

在 `src/layouts/index.tsx` 中定义全局布局，该布局会自动应用于所有页面。

```jsx
// src/layouts/index.tsx
import styles from './index.css';

export default (props) => {
  return (
    <>
      <div className={styles.header}>头部</div>
      <div className={styles.main}>{props.children}</div>
      <div className={styles.footer}>底部</div>
    </>
  );
};
```

**布局示意图：**
```
+-----------------------+
|        头部           |
+-----------------------+
|                       |
|       props.children  |
|      (页面内容)       |
|                       |
+-----------------------+
|        底部           |
+-----------------------+
```

### 局部布局

在页面目录中使用 `_layout.tsx` 文件定义局部布局，该布局会应用于当前目录及其子目录下的所有页面。

## 路由进阶功能

### 按需加载

UmiJS 支持路由级别的按需加载，可以通过配置开启：

```javascript
// .umirc.ts
export default {
  dynamicImport: {
    loading: '@/components/Loading',
  },
};
```

开启后，UmiJS 会自动将路由组件按需加载，提升应用性能。

### 路由权限控制

UmiJS 支持通过路由包装器实现路由权限控制：

```javascript
// .umirc.ts
export default {
  routes: [
    {
      path: '/admin',
      component: '@/pages/admin',
      wrappers: ['@/wrappers/auth'],
    },
  ],
};
```

在 `@/wrappers/auth` 组件中可以实现权限校验逻辑：

```jsx
// src/wrappers/auth.tsx
import { Redirect } from 'umi';

export default (props) => {
  const { isLogin } = useAuth();
  
  if (isLogin) {
    return <div>{ props.children }</div>;
  } else {
    return <Redirect to="/login" />;
  }
};
```

### 通过注释扩展路由

在约定式路由中，可以通过 YAML 注释扩展路由功能：

```jsx
/**
 * title: 用户页面
 * Routes:
 *   - ./src/routes/private.tsx
 */
 
export default () => {
  return <div>User Page</div>;
};
```

这种方式可以在约定式路由的基础上，实现更灵活的路由配置。

## 最佳实践

### 选择路由方式

- **约定式路由**：适合新项目、标准页面结构、快速开发
- **配置式路由**：适合复杂路由需求、需要精细控制路由的场景

### 路由组织

- 合理使用嵌套路由组织相关页面
- 使用动态路由处理相似结构的页面
- 通过布局系统保持页面一致性
- 使用按需加载优化性能

### 开发技巧

- 充分利用 UmiJS 的路由约定减少配置
- 使用路由权限控制保护敏感页面
- 通过路由注释扩展约定式路由功能
- 合理拆分路由组件，保持代码可维护性

UmiJS 的路由系统既强大又灵活，无论是简单的静态站点还是复杂的企业级应用，都能找到合适的路由方案。掌握 UmiJS 路由的使用，能够大大提高 React 应用的开发效率和质量。