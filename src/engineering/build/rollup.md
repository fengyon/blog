# Rollup

Rollup 是一个 JavaScript 模块打包工具，可以将多个小的代码片段编译为完整的库和应用。与 Webpack 等传统打包工具不同，Rollup 充分利用 ES6 模块特性，专注于 JavaScript 库的打包，以输出更简洁、更高效的代码。

## 核心概念

### 模块打包器

Rollup 将项目中分散的模块根据依赖关系打包成单个或多个整合文件。

```
源文件结构:
[入口文件] -> [依赖模块A] -> [依赖模块B]
       |              |
      JS文件         CSS文件
       |              |
    [依赖模块C]    [图片资源]

打包过程:
[入口分析] -> [依赖解析] -> [Tree Shaking] -> [代码合并] -> [输出文件]
      |            |             |               |           |
  确定起点      收集所有依赖   消除未引用代码    整合模块    生成bundle
```

### ES6 模块优先

Rollup 使用 JavaScript 的 ES6 模块标准，而不是以前的 CommonJS 和 AMD 等特殊解决方案。

```
模块系统对比:
CommonJS:  const utils = require('utils');  // 导入整个对象
ES6:      import { ajax } from 'utils';    // 只导入所需函数
                |
              更精确的依赖控制
```

## 主要特性

### Tree Shaking

Rollup 静态分析代码中的 import，排除任何未实际使用的代码。

```
Tree Shaking 效果:
源代码:
  export function square(x) { return x*x; }
  export function cube(x) { return x*x*x; }   // 未使用

打包后:
  function square(x) { return x*x; }          // 只保留使用的函数
```

### 输出格式灵活

Rollup 支持多种输出格式，适应不同环境需求。

```
格式选择:
- esm:   ES 模块，现代浏览器中可用
- cjs:   CommonJS，适用于 Node.js
- iife:  自执行函数，适合 <script> 标签
- umd:   通用模块定义，兼容 AMD、CJS 和浏览器
- amd:   异步模块定义，用于 RequireJS
- system: SystemJS 加载器格式
```

## 基本使用

### 安装与命令行使用

```bash
# 安装 Rollup
npm install --global rollup

# 命令行打包
rollup src/index.js --format iife --file dist/bundle.js
```

### 配置文件

创建 `rollup.config.js` 定义打包选项。

```javascript
// rollup.config.js
export default {
  input: 'src/index.js', // 入口文件
  output: {
    file: 'dist/bundle.js', // 输出文件
    format: 'iife', // 输出格式
  },
}
```

使用配置文件打包：

```bash
rollup -c  # 使用配置文件
```

## 进阶功能

### 插件系统

Rollup 通过插件扩展功能，处理不同类型资源和转换代码。

常用插件：

- `rollup-plugin-node-resolve`：加载 npm 模块
- `rollup-plugin-commonjs`：将 CommonJS 模块转换为 ES6
- `rollup-plugin-json`：允许从 JSON 文件读取数据
- `rollup-plugin-terser`：代码压缩

```javascript
// 配置插件
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  input: 'src/index.js',
  output: { file: 'dist/bundle.js', format: 'iife' },
  plugins: [resolve(), commonjs()],
}
```

### 代码分割

Rollup 支持动态导入，实现代码分割。

```javascript
// 动态导入
import('./logger').then(({ log }) => {
  log('code splitting~')
})

// 配置支持代码分割
export default {
  input: 'src/index.js',
  output: {
    dir: 'dist', // 必须指定目录
    format: 'amd', // iife 不支持代码分割
  },
}
```

### 多入口打包

处理多个入口文件，自动提取公共模块。

```javascript
// 多入口配置
export default {
  // 数组形式
  input: ['src/index.js', 'src/album.js'],
  // 或对象形式
  input: {
    index: 'src/index.js',
    album: 'src/album.js',
  },
  output: {
    dir: 'dist',
    format: 'amd',
  },
}
```

## 输出优化

### 多产物输出

同一份代码打包成不同格式，提高兼容性。

```javascript
// 多产物配置
const buildOptions = {
  input: ['src/index.js'],
  output: [
    { dir: 'dist/es', format: 'esm' }, // ES 模块
    { dir: 'dist/cjs', format: 'cjs' }, // CommonJS
  ],
}
```

### 输出定制化

精细控制输出文件的命名和组织。

```javascript
output: {
  dir: 'dist',
  // 使用占位符
  entryFileNames: '[name].js',           // 入口文件名
  chunkFileNames: 'chunk-[hash].js',     // 代码分割块名
  assetFileNames: 'assets/[name]-[hash][extname]' // 资源文件名
}
```

## 与 Webpack 对比

### 优势与局限

```
Rollup 优势:
[输出简洁] -> [Tree Shaking] -> [配置简单] -> [性能优越]
     |            |               |            |
  代码可读     自动消除死代码    学习成本低    打包速度快

Rollup 局限:
[生态较小] -> [HMR 支持弱] -> [复杂场景支持] -> [加载非ESM]
     |            |               |            |
 插件较少     无内置热更新     应用开发受限   需要额外插件
```

### 适用场景

```
工具选择策略:

开发应用程序 -> Webpack
    |
  功能全面、生态丰富、支持各种资源

开发框架/库 -> Rollup
    |
  输出简洁、Tree Shaking、性能优异
```

## 实际应用

### 现代前端工具链中的角色

Rollup 在现代前端生态中扮演重要角色，特别是作为 Vite 的构建基石。

```
构建工具定位:
[源代码] -> [Rollup 打包] -> [优化输出] -> [生产环境]
     |            |              |           |
   ES6 模块     依赖分析      Tree Shaking   各类格式
```

### 开发工作流

完整的 Rollup 开发环境配置：

```javascript
// 完整配置示例
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import { terser } from 'rollup-plugin-terser'

export default {
  input: 'src/index.js',
  output: [
    { file: 'dist/bundle.esm.js', format: 'esm' },
    { file: 'dist/bundle.cjs.js', format: 'cjs' },
    { file: 'dist/bundle.umd.js', format: 'umd', name: 'MyLibrary' },
  ],
  plugins: [resolve(), commonjs(), terser()],
  watch: { include: 'src/**' }, // 监听文件变化
}
```
