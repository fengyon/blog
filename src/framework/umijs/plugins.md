# umijs 插件系统

## 插件系统概述

UmiJS 的插件系统是框架的核心扩展机制，通过插件可以实现编译时扩展、运行时扩展和生态集成。Umi 本身也是由插件构成，这种插件化架构使得框架具备了极高的灵活性和可扩展性。

插件系统的核心价值：
- 编译时扩展：修改构建配置、添加文件、注册命令
- 运行时扩展：增强应用功能、添加全局逻辑
- 生态集成：无缝集成第三方库和工具

## 插件核心架构

### 插件的基本结构

每个插件都是一个函数，接收 api 和 opts 两个参数：

```javascript
export default (api, opts) => {
  // 插件逻辑
};
```

### 钩子系统的全局性

所有通过 `api.register()` 注册的钩子都存储在全局钩子池中，与注册它的插件没有绑定关系。这种设计使得跨插件调用变得简单直接：

```javascript
// 插件A注册钩子
api.register({
  key: 'onDataReady',
  fn: (data) => { console.log('PluginA处理数据', data); }
});

// 插件B注册同名的钩子
api.register({
  key: 'onDataReady', 
  fn: (data) => { console.log('PluginB处理数据', data); }
});

// 触发时两个函数都会执行
api.applyPlugins({ key: 'onDataReady', args: { value: 42 } });
```

## 核心 API 详解

### 插件注册 API

#### api.register - 注册全局钩子

```javascript
api.register({
  key: 'modifyTitle',           // 全局钩子名称
  fn: (memo) => `${memo} - Umi Site`,  // 处理函数
  stage: 10,                    // 执行顺序（数值小优先）
  before: 'specificHook'        // 指定在特定钩子前执行
});
```

#### api.applyPlugins - 触发钩子

```javascript
const result = api.applyPlugins({
  key: 'modifyTitle',
  type: api.ApplyPluginsType.modify, // 执行类型
  initialValue: '首页',               // 初始值
  args: { /* 额外参数 */ } 
});
```

### 运行时扩展 API

#### api.addRuntimePluginKey - 声明运行时配置键

```javascript
// 允许在 app.ts 中实现同名方法
api.addRuntimePluginKey('onThemeChange');

// src/app.ts
export function onThemeChange(theme) {
  console.log(`主题已切换: ${theme}`);
}
```

#### api.addRuntimePlugin - 添加运行时文件

```javascript
// 添加运行时逻辑文件
api.addRuntimePlugin(() => './runtime.js');

// ./runtime.js  
export function render(oldRender) {
  console.log('自定义渲染逻辑');
  oldRender();
}
```

### 元信息声明 API

#### api.describe - 声明插件元信息

```javascript
api.describe({
  key: 'themePlugin',
  config: {
    schema(Joi) { // 配置校验
      return Joi.object({
        defaultTheme: Joi.string().default('light')
      });
    }
  },
  enableBy: api.EnableBy.config // 启用方式
});
```

## 钩子执行机制

### 钩子类型与执行方式

UmiJS 支持多种钩子类型，每种类型有不同的执行逻辑：

| 类型 | 执行方式 | 特点 | 适用场景 |
|------|----------|------|----------|
| event | 并行执行 | 无返回值传递 | 通知类事件（如日志记录） |
| modify | 瀑布流 | 传递修改结果 | 配置修改链 |
| compose | 串行组合 | 组合结果 | 路由收集、中间件组合 |

### 执行顺序控制

钩子的执行顺序可以通过 stage 和 before/after 参数精确控制：

```javascript
api.register({ key: 'hook', fn: fn1, stage: -10 }); // 先执行
api.register({ key: 'hook', fn: fn2, stage: 0 });   // 后执行
```

## 注册内置钩子

UmiJS 允许插件注册到内置钩子，在框架特定生命周期执行自定义逻辑：

```javascript
// plugins/custom-render-plugin.js
export default (api) => {
  // 注册到 render 钩子
  api.register({
    key: 'render',
    fn: (oldRender) => {
      console.log('🔄 自定义插件开始处理渲染流程');
      const startTime = Date.now();
      
      // 执行原始渲染方法
      oldRender();
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ 渲染完成，耗时 ${duration}ms`);
    },
    stage: 100, // 确保在其他 render 钩子之后执行
    before: 'finalRender' // 可指定在特定钩子前执行
  });
};
```

## 运行时配置集成

### 内置方法执行时机

UmiJS 内置的运行时配置方法在特定生命周期阶段被调用：

| 方法名 | 执行时机 | 执行次数 | 是否异步 | 典型用途 |
|--------|----------|----------|-----------|----------|
| getInitialState | 应用初始化时最早执行 | 仅1次 | 支持 | 获取初始数据 |
| layout | 在 getInitialState 之后 | 仅1次 | 同步 | 修改布局配置 |
| patchRoutes | 路由生成后、渲染前 | 每次路由变化 | 同步 | 动态修改路由 |
| render | 在路由匹配后、组件渲染前 | 仅1次 | 支持 | 自定义渲染流程 |
| onRouteChange | 每次路由变化时 | 每次路由变化 | 同步 | 路由切换处理 |

## 插件开发实践

### 简单插件示例

以下是一个在打包时添加额外脚本的插件示例：

```javascript
// plugins/plugin01.ts
import { IApi } from 'umi';

export default function (api: IApi) {
  // 使用 api.addHTMLHeadScripts 方法
  api.addHTMLHeadScripts(() => `console.log('新添加的代码')`)
}
```

### 插件配置使用

在 Umi 配置文件中使用自定义插件：

```javascript
// config.ts
export default defineConfig({
  plugins: [
    require.resolve('../plugins/plugin02.ts'), // 后执行
    require.resolve('../plugins/plugin01.ts')  // 先执行
  ],
});
```

## 插件生态优势

UmiJS 的插件机制深入到构建的整个过程中，hook 重要的时间节点，让插件能影响后续的构建流程。这种设计带来了显著的架构优势：

- **扩展性**：插件可以影响构建的每个环节
- **模块化**：功能解耦，便于维护和更新
- **生态繁荣**：内部和外部插件已有 50+
- **企业级支持**：经 3000+ 应用验证

## 插件应用场景

UmiJS 插件广泛应用于：

- **路由管理**：动态路由、权限路由、嵌套路由
- **状态管理**：如 @umijs/plugin-model 提供的简易数据管理方案
- **构建优化**：代码分割、DLL 提速、资源处理
- **开发体验**：热更新、调试工具、代码生成
- **部署适配**：SSR、SSG、不同环境配置

插件系统的完善使得 UmiJS 能够覆盖从源码到构建产物的每个生命周期，支持各种功能扩展和业务需求。