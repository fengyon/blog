# umijs 入门

UmiJS 是一个插件化的企业级前端应用框架，以路由为基础，同时支持配置式路由和约定式路由，并配以完善的插件体系，帮助开发者快速开发 React 应用。

## 什么是 UmiJS

Umi，中文发音为“乌米”，是一个可扩展的企业级前端应用框架。它内置了路由、构建、部署、测试等功能，仅需一个依赖即可上手开发。Umi 实现了完整的生命周期，并使其插件化，内部功能全由插件完成。

**主要特性：**
- 开箱即用，内置 React、React Router 等
- 完备的路由系统，同时支持配置式路由和约定式路由
- 丰富的插件生态系统，覆盖从源码到构建产物的每个生命周期
- 高性能，支持以路由为单元的代码分割
- 与 dva 数据流深入融合

## 环境准备

在开始使用 UmiJS 前，需要准备以下环境：

- **Node.js**：版本需 10.13 或以上
- **包管理器**：推荐使用 yarn 或 npm

检查 Node.js 版本：
```bash
node -v
```

## 创建项目

使用以下命令创建新的 Umi 项目：

```bash
# 创建项目目录
mkdir umi-app
cd umi-app

# 创建 Umi 项目
yarn create @umijs/umi-app

# 安装依赖
yarn

# 启动开发服务器
yarn start
```

执行完上述命令后，在浏览器中访问 `http://localhost:8000` 即可查看应用。

## 项目结构

一个典型的 Umi 项目目录结构如下：

```
.
├── package.json
├── .umirc.ts          # 配置文件
├── .env               # 环境变量
├── dist               # 构建产物
├── mock               # mock 数据
├── public             # 静态资源
└── src
    ├── .umi           # 临时文件
    ├── layouts        # 全局布局
    │   └── index.tsx
    ├── pages          # 页面组件
    │   ├── index.less
    │   └── index.tsx
    └── app.ts         # 运行时配置
```

**关键文件说明：**
- `.umirc.ts`：Umi 配置文件，包含内置功能和插件的配置
- `src/pages`：所有路由组件存放目录
- `src/layouts`：约定式路由时的全局布局文件
- `src/app.ts`：运行时配置文件

## 配置说明

Umi 采用配置化的方式，常见的配置项如下：

```javascript
// .umirc.ts
import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    { path: '/', component: '@/pages/index' },
  ],
  history: {
    type: 'hash', // 路由类型
  },
  dva: { // dva 配置
    immer: true,
    hmr: false,
  },
  proxy: { // 代理配置
    '/api': {
      'target': 'http://localhost:8000',
      'changeOrigin': true,
    },
  },
  dynamicImport: { // 动态导入
    loading: '@/components/Loading',
  },
});
```

## 路由系统

Umi 提供了两种路由方式：**约定式路由**和**配置式路由**。

### 约定式路由

Umi 会根据 `src/pages` 目录的结构自动生成路由配置。例如：

```
src/pages
  ├── index.tsx    # 对应路由 /
  └── users
      ├── index.tsx # 对应路由 /users
      └── list.tsx  # 对应路由 /users/list
```

### 配置式路由

在 `.umirc.ts` 中直接配置路由：

```javascript
routes: [
  { exact: true, path: '/', component: '@/pages/index' },
  { exact: true, path: '/users', component: '@/pages/users' },
  {
    path: '/admin',
    component: '@/layouts/admin',
    routes: [
      { path: '/admin/user', component: '@/pages/admin/user' },
    ],
  },
],
```

## 样式和静态资源

### 样式处理

Umi 内置支持 CSS 和 Less，可以自动启用 CSS Modules：

```css
/* index.less */
.container {
  font-size: 16px;
}
```

```javascript
// 在组件中使用
import styles from './index.less';

export default () => {
  return <div className={styles.container}>Hello Umi</div>;
};
```

### 静态资源

Umi 提供了多种方式处理静态资源：

```javascript
// 方式一：导入方式
import logo from '@/assets/logo.png';

export default () => {
  return <img src={logo} />;
}

// 方式二：public 目录
// 将资源放在 public 目录下，可直接通过绝对路径访问
```

Umi 默认将 `@` 映射到 `src` 目录，方便模块引入。

## 数据流方案

Umi 内置了 dva，提供完整的数据流解决方案。一个典型的 model 结构如下：

```javascript
// src/models/user.js
export default {
  namespace: 'user',
  state: {
    list: [],
  },
  reducers: {
    save(state, { payload }) {
      return { ...state, ...payload };
    },
  },
  effects: {
    *fetch({ payload }, { call, put }) {
      const response = yield call(queryUsers, payload);
      yield put({ type: 'save', payload: { list: response } });
    },
  },
};
```

**dva 数据流示意图：**

页面 -> 触发 action -> dispatch -> model(effects) -> service (异步请求) -> effects(put) -> reducers -> 更新 state -> 连接页面

## 构建和部署

使用以下命令构建和部署项目：

```bash
# 构建项目
yarn build

# 本地验证构建结果
yarn global add serve
serve ./dist
```

构建完成后，所有静态资源会生成在 `dist` 目录中，可以将其部署到任何静态文件服务器。

通过以上介绍，你应该已经对 UmiJS 有了基本了解，可以开始使用 UmiJS 开发 React 应用了。