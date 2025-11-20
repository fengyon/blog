# electron-vite

electron-vite 是一个基于 Vite 的下一代 Electron 开发构建工具，它整合了 Vite 的优异特性和 Electron 的跨平台能力，为开发者提供高效、便捷的开发体验。该工具通过预配置和优化，解决了传统 Electron 开发中复杂的配置问题，让开发者能专注于业务逻辑的实现。

## 核心特性

electron-vite 继承了 Vite 的所有优势，并针对 Electron 的特殊架构进行了专门优化。其主要特性包括：

- **极速构建**：基于 Vite 的 ES Module 导入，实现秒级启动和快速热更新
- **统一配置**：将主进程、渲染进程和预加载脚本的配置集中到单个配置文件
- **热模块替换**：为渲染进程提供真正的 HMR 支持，提升开发效率
- **热重载**：主进程和预加载脚本修改后自动重启应用
- **多框架支持**：开箱即用支持 Vue、React、Svelte 等现代前端框架
- **源码保护**：支持将代码编译为 V8 字节码，保护商业代码

## 安装与项目结构

### 安装

通过 npm 或 yarn 即可安装 electron-vite：

```bash
npm install electron-vite --save-dev
```

### 推荐项目结构

一个典型的 electron-vite 项目结构如下：

```
project-root/
├──src/
│  ├──main/                 # 主进程代码
│  │  ├──index.js          # 主进程入口文件
│  │  └──...
│  ├──preload/             # 预加载脚本
│  │  ├──index.js
│  │  └──...
│  └──renderer/            # 渲染进程代码
│     ├──src/
│     ├──index.html        # 渲染进程HTML模板
│     └──...
├──electron.vite.config.js # 统一配置文件
└──package.json
```

这种结构清晰分离了 Electron 应用的不同部分，符合最佳实践。

## 配置详解

### 基本配置

electron-vite 使用统一的配置文件 `electron.vite.config.js`，将主进程、预加载脚本和渲染进程的配置集中管理：

```javascript
// electron.vite.config.js
export default {
  main: {
    // 主进程特定配置
    build: {
      outDir: 'out/main',
      rollupOptions: {
        external: ['electron'] // 外部化依赖
      }
    }
  },
  preload: {
    // 预加载脚本配置
    build: {
      outDir: 'out/preload'
    }
  },
  renderer: {
    // 渲染进程配置
    root: 'src/renderer', // 渲染进程根目录
    build: {
      outDir: 'out/renderer'
    }
  }
}
```

### 配置智能提示

通过 TypeScript 类型支持，可以获得完善的配置智能提示：

```javascript
import { defineConfig } from 'electron-vite'

export default defineConfig({
  main: {
    // 输入内容时会有类型提示
  },
  preload: {
    // ...
  },
  renderer: {
    // ...
  }
})
```

使用 `defineConfig` 工具函数无需额外 JSDoc 注解即可获得类型提示。

### 预设配置

electron-vite 为不同的进程提供了合理的预设配置：

**主进程预设**：
- `outDir`：`out/main` (相对于根目录)
- `target`：自动匹配 Electron 的 Node 构建目标
- `lib.formats`: `cjs` (CommonJS)
- 自动 external 化 `electron` 和所有内置 Node 模块

**预加载脚本预设**：
- `outDir`: `out/preload`
- 目标环境和模块格式与主进程保持一致

**渲染进程预设**：
- `root`: `src/renderer`
- `outDir`: `out/renderer`
- `target`：自动匹配 Electron 的 Chrome 构建目标

## 开发流程

### 脚本配置

在 `package.json` 中配置开发脚本：

```json
{
  "scripts": {
    "dev": "electron-vite dev",      // 启动开发服务器和Electron应用
    "build": "electron-vite build",  // 构建生产版本
    "start": "electron-vite preview" // 预览生产构建
  }
}
```

执行 `npm run dev` 即可启动开发环境。

### 热更新实现

为了在开发环境中启用渲染进程的 HMR，需要在窗口创建时根据环境变量加载相应资源：

```javascript
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js')
    }
  })

  // 开发环境加载远程URL，生产环境加载本地文件
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}
```

这种设计确保了开发时的热更新和生产时的稳定运行。

**热更新流程示意图**：
```
渲染进程代码修改 → Vite HMR 服务器 → 浏览器自动更新
        ↑
Electron 窗口 (通过 ELECTRON_RENDERER_URL 连接)
```

### 热重载功能

electron-vite 还为主进程和预加载脚本提供了热重载功能，当这些文件发生变化时，Electron 应用会自动重启。启用方式有两种：

1. 使用 CLI 参数：`electron-vite dev --watch`
2. 在配置中设置：`build.watch: {}`

## 进阶特性

### 源码保护

electron-vite 提供了字节码插件，可以将主进程和预加载脚本编译为 V8 字节码，有效保护源代码：

```javascript
import { defineConfig, bytecodePlugin } from 'electron-vite'

export default defineConfig({
  main: {
    plugins: [bytecodePlugin()]
  },
  preload: {
    plugins: [bytecodePlugin()]
  }
})
```

该插件仅在生产构建中生效，为商业应用提供了额外的安全保障。

### 调试配置

在 VSCode 中调试主进程，可创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceRoot}",
      "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/electron-vite",
      "windows": {
        "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/electron-vite.cmd"
      },
      "runtimeArgs": ["--sourcemap"]
    }
  ]
}
```

这样可以在 IDE 中直接设置断点调试主进程代码。

### 多窗口应用配置

对于多窗口 Electron 应用，electron-vite 提供了灵活的配置方式。可以为每个窗口单独配置预加载脚本和渲染进程，确保各部分的构建配置互不干扰。

## 构建与优化

### 生产构建

执行 `npm run build` 或 `electron-vite build` 进行生产构建。electron-vite 会为每个进程分别优化和构建：

- **主进程和预加载脚本**：编译为 CommonJS 格式，目标为 Node.js 环境
- **渲染进程**：编译为优化的静态资源，目标为 Chromium 环境

### 资产处理

electron-vite 优化了对各种资产的处理，包括：
- Node.js 原生插件 (。node 文件)
- WebAssembly 模块
- Worker 线程脚本
- 其他静态资源

这些资产会被正确打包和处理，确保在生产环境中正常工作。

## 与传统方案对比

与传统 Electron 开发工具相比，electron-vite 的优势明显：

**传统方案**：
```
多个配置文件 (webpack.main.config.js, webpack.renderer.config.js, ...)
↓
需要辅助脚本协调构建过程
↓
开发体验碎片化，调试复杂
```

**electron-vite 方案**：
```
单一配置文件 (electron.vite.config.js)
↓
内置进程协调和构建优化
↓
一致的开发体验，简化调试
```

这种一体化设计大大降低了 Electron 应用的开发和维护成本。