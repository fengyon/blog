# Vue 简介

## Vue 的概念

**Vue（读音 /vjuː/，类似于 “view”）** 是一款用于构建用户界面的前端框架。
它的核心思想是——**数据驱动视图、组件化开发**。
通过将数据（state）与界面（view）解耦，开发者可以以声明式的方式构建交互式 Web 应用。

Vue 由 **尤雨溪（Evan You）** 于 2014 年发布，灵感来源于 AngularJS 的模板语法与 React 的组件思想，旨在提供一个：

> “轻量、渐进、灵活且高性能的前端框架。”

Vue 的设计哲学是 **渐进式框架**（Progressive Framework）：

- 只想引入简单交互？用 Vue 的核心库即可。
- 想要构建大型单页应用（SPA）？再引入 Vue Router、Pinia（或 Vuex）、Vue CLI / Vite 等工具即可。

## Vue 的历史与发展历程

| 时间              | 版本/事件                                | 关键内容与意义                                                     |
| ----------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| **2014 年 2 月**  | Vue.js 0.6 发布                          | Evan You 独立开发，项目在 GitHub 开源                              |
| **2015 年 10 月** | Vue 1.0 “Evangelion”                     | 第一个稳定版本，正式进入生产环境                                   |
| **2016 年 10 月** | Vue 2.0 “Ghost in the Shell”             | 重写虚拟 DOM 核心，性能大幅提升；引入组件化与单文件组件（SFC）体系 |
| **2018 年**       | Vue 成为 GitHub 上最受欢迎的前端框架之一 | 社区生态快速扩张                                                   |
| **2019 年 10 月** | Vue 3 正式立项                           | 采用 TypeScript 重构，预告 Composition API                         |
| **2020 年 9 月**  | Vue 3.0 “One Piece” 正式发布             | 全新架构、性能飞跃、Composition API 登场                           |
| **2022 年 2 月**  | Vue 3 成为官方默认版本                   | CLI 与文档全面切换到 Vue 3                                         |
| **2023 年以后**   | Vue 3 生态成熟                           | Nuxt 3、Vite、Pinia 等生态稳定发展                                 |

## Vue2 的优缺点与现状

### ✅ 优点

1. **易上手、学习曲线平滑**
   模板语法直观，开发者可快速构建交互界面。

2. **响应式系统直观**
   基于 `Object.defineProperty` 的响应式，让视图能自动更新。

3. **组件化与生态完善**
   支持单文件组件（SFC）、Vue Router、Vuex，形成完整开发体系。

4. **性能良好**
   虚拟 DOM 与 diff 算法保证了渲染效率。

---

### ❌ 缺点

1. **响应式的局限性**
   无法监听数组索引变化、对象属性新增/删除。

   ```js
   // Vue2 无法检测
   this.obj.newProp = 123
   ```

2. **逻辑复用困难**
   通过 mixin 复用逻辑容易命名冲突、逻辑不透明。

3. **TypeScript 支持不足**
   Vue2 的核心由 JavaScript 编写，对 TS 类型推导支持不完善。

4. **性能瓶颈**
   响应式系统基于 `defineProperty`，依赖收集粒度较粗。

---

### 📉 现状

虽然 Vue2 仍在维护（尤其是长期项目中），但其核心生态（如 Vue Router、Vuex）已转向 Vue3。
新项目官方建议 **全面使用 Vue3**，Vue2 被视为 **维护期框架**，主要提供兼容支持。

---

## Vue3 解决了什么问题

Vue3 是 Vue 的一次彻底重构，它主要解决了以下几个长期存在的问题：

| 问题                | Vue2 表现                                          | Vue3 改进                                 |
| ------------------- | -------------------------------------------------- | ----------------------------------------- |
| **响应式系统**      | 基于 `Object.defineProperty`，无法深度监听新增属性 | 基于 `Proxy` 实现，真正实现深层次响应式   |
| **逻辑复用**        | 通过 mixins，存在冲突与可读性问题                  | Composition API 实现逻辑复用、组织更灵活  |
| **TypeScript 支持** | 较弱，类型推导困难                                 | 完全用 TypeScript 重写，原生类型安全      |
| **性能优化**        | 渲染性能一般，打包体积较大                         | 编译优化、Tree-shaking、模块更小、更快    |
| **框架灵活性**      | 核心结构较封闭                                     | 新架构允许自定义渲染器（Custom Renderer） |

---

## Vue3 的核心优势

### 1. Composition API —— 更灵活的逻辑组织

Vue3 引入了 **Composition API**，允许开发者以函数方式组织组件逻辑。
优点包括：

- 更易于代码复用与抽离（`useXxx` 风格的逻辑函数）。
- 逻辑聚合清晰：相关逻辑可集中在一个函数中。

示例：

```js
// Vue2
export default {
  data() { return { count: 0 } },
  methods: { increment() { this.count++ } }
}

// Vue3 Composition API
import { ref } from 'vue'
export default {
  setup() {
    const count = ref(0)
    const increment = () => count.value++
    return { count, increment }
  }
}
```

### 2. 更快的响应式系统

Vue3 使用 **Proxy** 实现响应式追踪，不再依赖 `Object.defineProperty`。
优势包括：

- 可监听深层嵌套属性与新增属性；
- 响应式数据追踪粒度更细，性能更高；
- 实现 `reactive()` 与 `ref()` 等统一响应式 API。

---

### 3. 更小、更快、更现代化

- **打包体积减少约 40%**；
- **渲染性能提升约 50%**；
- 支持 **Tree-shaking**，按需引入功能模块；
- 与现代构建工具（如 Vite）深度集成，支持 ESM。

---

### 4. 更好的 TypeScript 支持

Vue3 核心使用 TypeScript 编写，带来了：

- 自动类型推导；
- IDE 代码提示完善；
- 更安全的组件参数校验。

---

### 5. 生态全面升级

- 状态管理：Vuex → **Pinia**（轻量、类型友好）
- 构建工具：Vue CLI → **Vite**（极速冷启动）
- 服务端渲染：Nuxt2 → **Nuxt3**（基于 Vue3 + Vite）
- 官方工具链全面现代化。

## Vue 快速开始

Vue.js 是一款轻量、渐进式的前端框架，非常适合构建交互丰富的 Web 界面。无论你是前端新手还是想快速搭建项目的开发者，Vue 都能帮你快速上手。

### 引入 vue.js

如果你只是想快速体验 Vue 或在一个静态网页中使用它，可以直接在 HTML 文件中引入 Vue 的脚本文件。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>Vue 快速开始</title>
    <!-- 引入 Vue 3 CDN -->
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  </head>
  <body>
    <div id="app">
      <h2>{{ message }}</h2>
    </div>

    <script>
      const { createApp } = Vue
      createApp({
        data() {
          return {
            message: 'Hello Vue!',
          }
        },
      }).mount('#app')
    </script>
  </body>
</html>
```

直接保存为 `index.html` 文件并用浏览器打开，即可看到 Vue 的响应式效果。

### 使用脚手架

如果你希望创建一个结构清晰、可扩展的 Vue 应用，那么使用脚手架（如 **Vite** 或 **Vue CLI**）会更合适。

#### 使用 Vite

[Vite](https://vitejs.dev/) 是官方推荐的现代前端构建工具，启动速度极快。

```bash
# 使用 npm
npm create vite@latest my-vue-app

# 或使用 pnpm / yarn
pnpm create vite@latest my-vue-app
# 或
yarn create vite my-vue-app
```

在提示中选择：

```
✔ Select a framework: › Vue
✔ Select a variant: › JavaScript
```

然后进入项目目录并启动：

```bash
cd my-vue-app
npm install
npm run dev
```

#### 使用 `@vue/cli`

Vue CLI 适合需要较完整配置（如 webpack、自定义构建）的项目。

安装 Vue CLI：

```bash
npm install -g @vue/cli
```

创建项目：

```bash
vue create my-vue-app
```

在交互中选择你需要的配置（推荐选择默认配置）。
项目创建完成后，运行：

```bash
cd my-vue-app
npm run serve
```
