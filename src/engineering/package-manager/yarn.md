# yarn

yarn 是 Facebook 于 2016 年推出的 JavaScript 包管理工具，旨在解决当时 npm 在性能、安全性和一致性方面存在的痛点。yarn 的诞生引发了包管理工具的革新竞争，推动了整个 JavaScript 生态系统在依赖管理方面的进步。

yarn 以其卓越的性能、可靠的依赖锁定和优雅的开发者体验迅速获得广泛认可，成为现代前端开发中不可或缺的工具之一。

## 核心特性

### 性能优化

yarn 通过并行安装、离线缓存等机制大幅提升依赖安装速度。

```
npm 安装流程:
[解析依赖] -> [下载包] -> [安装包] -> [完成]
     |           |          |         |
   顺序执行    顺序下载   顺序安装   较慢

yarn 安装流程:
[解析依赖] -> [并行下载多包] -> [并行安装] -> [完成]
     |             |              |         |
   快速解析      同时下载       同时安装    更快
```

### 依赖确定性

yarn 通过 lock 文件确保不同环境下的依赖一致性。

```
yarn.lock 文件作用:
开发者A机器       开发者B机器       生产环境
   |                 |              |
   v                 v              v
同一份yarn.lock -> 相同依赖树 -> 相同行为
```

### 安全可靠

yarn 在安装前会验证每个包的完整性，防止恶意代码注入。

```
安装安全检查:
[下载包] -> [校验哈希] -> [验证通过] -> [安装]
     |          |            |          |
  从仓库     计算校验和     匹配记录     安全安装
```

## 架构设计

### 工作流程

yarn 的核心工作流程围绕依赖解析和安装展开。

```
yarn 工作流程图:
[解析package.json] 
        |
        v
[收集依赖信息]
        |
        v
[检查缓存] --- 命中 ---> [从缓存安装]
        |                    ^
       未命中                |
        |                    |
        v                    |
[下载包到缓存] ---------------+
        |
        v
[创建node_modules结构]
        |
        v
[生成/更新yarn.lock]
```

### 缓存机制

yarn 的智能缓存系统避免重复下载，支持离线安装。

```
缓存目录结构:
~/.yarn/cache/
    |
    +-- package-A-1.0.0.tgz
    |
    +-- package-B-2.1.3.tgz
    |
    +-- package-C-1.5.2.tgz
```

## 基本使用

### 安装与初始化

yarn 的安装简单直接，支持多种方式。

```
安装yarn:
# 通过npm安装
npm install -g yarn

# 或使用系统包管理器
brew install yarn    # macOS
choco install yarn   # Windows

初始化项目:
yarn init            # 交互式创建
yarn init -y         # 快速创建
```

### 依赖管理

yarn 提供直观的依赖管理命令。

```
依赖管理命令:
# 添加依赖
yarn add <package>           # 生产依赖
yarn add -D <package>        # 开发依赖

# 移除依赖
yarn remove <package>

# 更新依赖
yarn upgrade <package>
yarn upgrade --latest        # 更新到最新版本

# 安装所有依赖
yarn install
```

### 脚本执行

yarn 的脚本执行语法简洁明了。

```
脚本执行:
package.json:
{
  "scripts": {
    "dev": "webpack serve",
    "build": "webpack",
    "test": "jest"
  }
}

命令行:
yarn dev     # 运行开发服务器
yarn build   # 执行构建
yarn test    # 运行测试
```

## 高级功能

### Workspaces

yarn Workspaces 支持在单一代码库中管理多个包。

```
monorepo 结构:
project-root/
    |
    +-- package.json         # 根package.json
    |       "workspaces": ["packages/*"]
    |
    +-- packages/
          |
          +-- package-A/     # 子包A
          |       package.json
          |
          +-- package-B/     # 子包B
                  package.json
```

### 插件系统

yarn 2+ 引入了强大的插件系统。

```
插件使用:
yarn plugin import <plugin-url>

常用插件:
- @yarnpkg/plugin-typescript
- @yarnpkg/plugin-workspace-tools
- @yarnpkg/plugin-interactive-tools
```

### 零安装模式

yarn PnP (Plug'n'Play) 消除 node_modules，提升性能。

```
传统模式 vs PnP模式:
传统: [项目] -> [node_modules] -> [大量文件操作]
PnP:  [项目] -> [.pnp.js] -> [直接链接缓存]
              |                    |
           更小的项目           更快的安装
           体积               和启动
```

## 版本演进

### yarn 1.x

经典的 yarn，专注于性能和可靠性。

```
yarn 1.x 特点:
- 并行安装
- 离线缓存
- yarn.lock 文件
- 简洁的CLI
```

### yarn 2.x (Berry)

现代化重构，引入创新特性。

```
yarn 2.x 新特性:
- Plug'n'Play (PnP)
- 插件架构
- 改进的Workspaces
- 更好的Monorepo支持
```

## 与 npm 对比

### 性能比较

在依赖安装速度方面，yarn 通常表现更优。

```
安装速度对比 (示例项目):
操作        npm      yarn
首次安装    45s      25s
后续安装    30s      8s
无网安装    失败     成功 (离线缓存)
```

### 功能差异

yarn 和 npm 在功能设计上各有侧重。

```
功能对比表:
特性          npm           yarn
锁定文件    package-lock   yarn.lock
Workspaces   支持           更强支持
离线模式     有限支持       完善支持
安全检查     基础          更严格
插件系统     有限          强大
```

## 在现代前端中的角色

yarn 在现代前端工具链中扮演关键角色。

```
现代前端工具链:
[代码编辑] -> [包管理(yarn)] -> [构建工具] -> [测试框架] -> [部署]
      |             |              |            |           |
   开发者        依赖管理        webpack      jest      生产环境
```