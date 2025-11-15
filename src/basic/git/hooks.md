# git hooks

git hooks 是 Git 版本控制系统中的脚本机制，允许在特定的 Git 生命周期事件发生时自动执行自定义脚本。这些钩子可以拦截和影响 Git 的工作流程，为代码质量保障和开发流程自动化提供强大支持。

## 什么是 git hooks？

git hooks 是存储在 Git 仓库 `.git/hooks` 目录中的可执行脚本，在特定的 Git 操作 (如提交、推送、合并等) 前后自动触发执行。

```
git hooks 位置:
[仓库]/
  └── .git/
      └── hooks/
          ├── pre-commit.sample
          ├── pre-push.sample
          ├── post-checkout.sample
          └── ...其他钩子
```

## hooks 工作原理

### 触发时机

git hooks 在 Git 工作流的各个关键节点被调用。

```
Git 工作流与 hooks:
[工作区修改] -> [git add] -> [git commit] -> [git push]
       |            |            |            |
     修改文件     暂存变更    触发pre-commit  触发pre-push
                              触发commit-msg  触发post-push
```

### 执行流程

钩子脚本按照特定顺序执行，可以中断或继续 Git 操作。

```
典型提交流程:
[git commit] -> [pre-commit] -> [prepare-commit-msg] -> [commit-msg] -> [post-commit]
       |            |                 |                  |              |
   开始提交     代码检查钩子       编辑提交信息钩子     提交信息检查     提交后操作
                失败则中止         可修改信息         失败则中止       不影响结果
```

## 核心 hooks 分类

### 客户端 hooks

在开发者本地机器上执行的钩子。

```
提交工作流钩子:
pre-commit:       提交前运行，用于代码检查、测试
prepare-commit-msg: 提交信息编辑前，可修改默认信息
commit-msg:       提交信息检查，验证格式规范
post-commit:      提交完成后，可用于通知等

其他客户端钩子:
pre-push:         推送前运行，验证代码质量
post-checkout:    切换分支后，依赖安装等
pre-rebase:       变基前验证
```

### 服务端 hooks

在 Git 服务器上执行的钩子。

```
服务端钩子:
pre-receive:      接收推送前，验证所有引用更新
update:           每个分支更新前，细粒度控制
post-receive:     推送完成后，触发部署、通知
```

## 常用 hooks 详解

### pre-commit

在提交操作完成前执行，常用于代码质量检查。

```
pre-commit 工作流程:
[git commit] -> [pre-commit脚本] -> [通过?] -> [完成提交]
       |              |               |          |
   触发执行       运行lint、测试      是/否      继续/中止
```

### commit-msg

检查提交信息格式，确保符合团队规范。

```
commit-msg 检查:
提交信息: "feat: 添加用户登录功能"
          |         |
        类型       描述
         
验证规则:
- 类型: feat|fix|docs|style|refactor|test|chore
- 格式: <类型>: <描述>
- 长度: 描述部分不超过50字符
```

### pre-push

在推送代码到远程仓库前执行，进行更全面的验证。

```
pre-push 验证:
[git push] -> [pre-push脚本] -> [运行测试] -> [通过?] -> [执行推送]
       |             |             |           |          |
   触发推送       获取差异文件    关键测试     是/否      继续/中止
```

## 实际应用场景

### 代码质量保障

通过 hooks 自动化代码检查和测试。

```
质量保障流程:
[开发者提交] -> [pre-commit] -> [ESLint检查] -> [单元测试] -> [通过?] -> [允许提交]
        |            |             |            |           |          |
     代码变更      自动触发       语法检查     功能验证     是/否      继续/中止
```

### 提交信息规范

统一团队的提交信息格式。

```
提交规范执行:
[git commit -m "消息"] -> [commit-msg验证] -> [格式正确?] -> [接受提交]
           |                  |                 |            |
       原始消息           正则表达式检查        是/否        成功/失败
```

### 工作流自动化

自动化开发流程中的重复任务。

```
自动化任务:
post-checkout: 切换分支后自动安装依赖
post-merge:    合并后自动更新数据库
pre-push:      推送前构建项目验证
```

## 配置与管理

### 原生 hooks 配置

直接使用 Git 原生的 hooks 机制。

```
原生 hooks 设置:
# 创建可执行钩子脚本
chmod +x .git/hooks/pre-commit

# 脚本内容示例
#!/bin/sh
npm run lint
npm test
```

### Husky 工具

使用 Husky 简化 hooks 管理，支持现代前端工作流。

```
Husky 配置:
安装:    npm install husky --save-dev
初始化:  npx husky init
添加钩子: npx husky add .husky/pre-commit "npm test"

目录结构:
.husky/
  ├── _
  ├── pre-commit    # 预提交钩子
  └── commit-msg    # 提交信息钩子
```

### lint-staged 集成

只对暂存区的文件进行检查，提高效率。

```
lint-staged 工作流:
[git add] -> [git commit] -> [pre-commit] -> [lint-staged] -> [只检查暂存文件]
      |           |             |              |                 |
   选择文件     触发提交       调用钩子       过滤文件          高效检查
```

## 配置示例

### 基础 pre-commit 配置

```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "运行代码检查..."

# 运行 ESLint
npm run lint
if [ $? -ne 0 ]; then
    echo "ESLint 检查失败，请修复错误后重新提交"
    exit 1
fi

# 运行测试
npm test
if [ $? -ne 0 ]; then
    echo "测试失败，请修复测试后重新提交"
    exit 1
fi

echo "检查通过，允许提交"
```

### Husky + lint-staged 配置

```json
// package.json
{
  "scripts": {
    "lint:staged": "lint-staged"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint:staged
```

## 最佳实践

###  hooks 设计原则

```
有效 hooks 特征:
[快速执行] -> [明确反馈] -> [可跳过机制] -> [团队一致]
     |           |           |           |
  不阻塞开发    错误信息清晰   紧急情况跳过   统一配置
```

### 错误处理

提供清晰的错误信息和解决指导。

```
错误处理模式:
[钩子执行] -> [检查失败] -> [显示错误] -> [提供解决方案]
     |           |           |           |
  运行脚本     验证未通过   具体错误信息   修复命令提示
```

## 团队协作策略

###  hooks 共享

确保团队成员使用相同的 hooks 配置。

```
hooks 共享方案:
[版本控制hooks] -> [安装脚本] -> [自动配置] -> [团队统一]
       |             |            |           |
   hooks目录       setup脚本     初始化      一致体验
```

### 渐进式采用

在团队中逐步引入 git hooks。

```
采用策略:
[基础检查] -> [代码格式化] -> [测试验证] -> [完整流程]
     |           |           |           |
 语法检查     自动格式化    单元测试     全流程验证
```

## 注意事项

### 性能考虑

hooks 应该高效执行，避免影响开发体验。

```
性能优化:
[只检查必要项] -> [增量检查] -> [并行执行] -> [缓存结果]
      |             |           |           |
  针对性验证     变化文件     同时运行     避免重复
```

### 灵活性保障

提供绕过机制应对特殊情况。

```
绕过机制:
# 跳过hooks提交
git commit --no-verify

# 紧急情况使用
[紧急修复] -> [--no-verify] -> [快速提交] -> [事后补检查]
     |           |               |           |
  生产问题     跳过验证         立即修复     后续补测试
```