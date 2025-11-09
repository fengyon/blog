# pnpm

pnpm 是一个快速、节省磁盘空间且高效的 JavaScript 包管理器，它通过创新的链接技术和独特的 `node_modules` 结构来解决传统包管理器在性能和磁盘空间使用上的问题。

## 核心特性

### 高效磁盘使用

pnpm 使用内容可寻址存储和硬链接技术，所有文件都存储在硬盘上的单一位置。当安装包时，包里的文件会硬链接到这一位置，不会占用额外磁盘空间。

```
传统包管理器 (npm/yarn):
[项目A] -> [独立node_modules] -> 完整依赖副本
[项目B] -> [独立node_modules] -> 完整依赖副本
                    ↓
            大量重复磁盘占用

pnpm 方式:
[项目A] -> [硬链接] -> [全局存储]
[项目B] -> [硬链接] -> [同一全局存储]
                    ↓
            显著节省磁盘空间
```

### 安装速度快

pnpm 采用三阶段安装过程，比传统安装方式更加高效。

```
安装流程对比:
npm/yarn: [依赖解析] -> [下载所有依赖] -> [写入node_modules]
                ↓
           速度相对较慢

pnpm: [依赖解析] -> [目录结构计算] -> [链接依赖项]
            ↓
       利用缓存和链接，速度更快
```

### 严格的依赖管理

pnpm 创建非扁平的 `node_modules` 目录，避免幽灵依赖问题。

```
npm/yarn 的扁平结构:
node_modules/
  ├── package-A     # 直接依赖
  ├── package-B     # 直接依赖
  └── package-C     # 间接依赖 (可被直接访问 - 幽灵依赖)

pnpm 的非扁平结构:
node_modules/
  ├── package-A -> .pnpm/package-A@1.0.0/node_modules/package-A
  ├── package-B -> .pnpm/package-B@1.0.0/node_modules/package-B
  └── .pnpm/
        ├── package-A@1.0.0/
        │   └── node_modules/
        │       ├── package-A
        │       └── package-C -> ../../package-C@1.0.0
        └── package-C@1.0.0/
            └── node_modules/
                └── package-C
```

## 工作原理

### 硬链接与符号链接

pnpm 结合使用硬链接和符号链接来优化依赖管理。

```
硬链接工作原理:
[项目A] -> [硬链接] -> [全局存储区文件]
[项目B] -> [硬链接] -> [同一全局存储区文件]
                    ↓
           修改任一链接，所有链接同步更新

符号链接工作原理:
[项目node_modules/package-A] -> [符号链接] -> [.pnpm/package-A@1.0.0/node_modules/package-A]
```

### 依赖解析算法

pnpm 的依赖解析确保每个包都能访问到其正确的依赖版本。

```
依赖解析示例:
项目依赖:
  - package-A@1.0.0 → 依赖 package-C@^1.0.0
  - package-B@2.0.0 → 依赖 package-C@^2.0.0

pnpm 结构:
node_modules/
  ├── .pnpm/
  │   ├── package-A@1.0.0/node_modules/
  │   │   ├── package-A
  │   │   └── package-C -> ../../package-C@1.0.0
  │   ├── package-B@2.0.0/node_modules/
  │   │   ├── package-B
  │   │   └── package-C -> ../../package-C@2.0.0
  │   ├── package-C@1.0.0/
  │   └── package-C@2.0.0/
  ├── package-A -> .pnpm/package-A@1.0.0/node_modules/package-A
  └── package-B -> .pnpm/package-B@2.0.0/node_modules/package-B
```

## 基本使用

### 安装与初始化

```bash
# 通过 npm 安装 pnpm
npm install -g pnpm

# 初始化新项目
pnpm init

# 从 create-* 套件创建项目
pnpm create react-app my-app
```

### 依赖管理

```bash
# 安装依赖
pnpm install <package>
pnpm add <package>

# 安装开发依赖
pnpm add -D <package>

# 全局安装
pnpm add -g <package>

# 更新依赖
pnpm update
pnpm update <package>

# 移除依赖
pnpm remove <package>
```

### 脚本执行

```bash
# 运行 package.json 中定义的脚本
pnpm run <script-name>
pnpm <script-name>    # 当不与内置命令冲突时

# 在项目范围内执行 shell 命令
pnpm exec <command>
pnpm jest             # 等同于: pnpm exec jest
```

## 高级功能

### 工作空间支持

pnpm 内置对单体仓库的支持，可以高效管理多个相关包。

```
工作空间结构:
project-root/
  ├── package.json
  │   "workspaces": ["packages/*"]
  ├── packages/
  │   ├── package-A/
  │   │   └── package.json
  │   └── package-B/
  │       └── package.json
  └── pnpm-workspace.yaml
```

### 工作空间命令

```bash
# 在所有包中运行命令
pnpm -r <command>           # -r 是 --recursive 的简写

# 在特定包中运行命令
pnpm --filter <package-name> <command>

# 并行运行命令
pnpm -r --parallel <command>
```

### 存储管理

```bash
# 查看存储路径
pnpm store path

# 清理存储
pnpm store prune
```

## 与 npm、yarn 的差异

### 性能对比

```
安装速度比较:
操作        npm      yarn     pnpm
首次安装    45s      25s      20s
后续安装    30s      8s       5s
无网安装    失败     成功     成功 (离线缓存)
```

### 磁盘空间使用

```
磁盘空间效率:
npm/yarn: 每个项目都有完整的依赖副本
   [项目A]: 200MB
   [项目B]: 200MB (相同依赖)
   总占用: 400MB

pnpm: 共享相同依赖的存储
   [项目A]: [硬链接] -> [全局存储 200MB]
   [项目B]: [硬链接] -> [同一全局存储]
   总占用: 200MB + 少量链接开销
```

### node_modules 结构差异

```
npm/yarn (扁平化):
node_modules/
  ├── package-A
  ├── package-B
  └── package-C    # 间接依赖，但可被直接访问

pnpm (非扁平化):
node_modules/
  ├── package-A    -> .pnpm/.../package-A
  ├── package-B    -> .pnpm/.../package-B
  └── .pnpm/       # 所有实际依赖内容
```

## 适用场景

### 推荐使用 pnpm 的情况

- **大型项目**：依赖数量多，需要优化安装速度和磁盘空间
- **多项目开发**：在同一机器上维护多个使用相似依赖的项目
- **CI/CD 环境**：快速安装和缓存依赖可以显著缩短构建时间
- **磁盘空间有限**：需要最大化利用可用存储空间的环境

### 潜在考虑

- **工具兼容性**：某些工具可能对符号链接支持不完善
- **学习曲线**：与传统包管理器不同的概念和工作原理
- **生态系统**：虽然增长迅速，但社区资源相比 npm 仍较少
