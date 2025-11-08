# Git 标签管理

在软件开发中，**版本标记（Tag）** 是一种重要的版本控制方式。Git 的标签（tag）通常用于记录重要的版本节点，例如 `v1.0.0`、`v2.3.5` 等。它能帮助开发者快速定位、打包或发布指定版本的代码。

本文将详细介绍 Git 标签的概念及其 **创建、查看、修改、删除** 等常见操作。

## Git 标签的概念

Git 中的标签（Tag）类似于某个提交（commit）的“快照别名”。

- 每个标签都指向一个特定的提交对象。
- 标签不会随着后续提交自动更新（与分支不同）。
- 标签通常用于 **发布版本** 或 **标记关键里程碑**。

Git 支持两种类型的标签：

1. **轻量标签（Lightweight Tag）**：只是一个提交的引用，没有附加信息。
2. **附注标签（Annotated Tag）**：包含标签创建者、日期、备注信息，甚至可以使用 GPG 签名，更适合正式版本发布。

## 创建标签

### 创建轻量标签

```bash
git tag v1.0.0
```

该命令会在当前提交上创建一个轻量标签。

如果要为指定的提交打标签：

```bash
git tag v1.0.0 <commit-hash>
```

### 创建附注标签

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
```

参数说明：

- `-a` 表示创建附注标签（annotated tag）
- `-m` 添加标签说明信息

同样可指定提交：

```bash
git tag -a v1.0.0 <commit-hash> -m "Version 1.0.0 release"
```

## 查看标签

### 查看所有标签

```bash
git tag
```

按字母顺序列出所有标签。

### 按模式筛选标签

```bash
git tag -l "v1.*"
```

列出所有以 `v1.` 开头的标签。

### 查看标签详细信息

```bash
git show v1.0.0
```

可查看该标签所指向的提交、创建者、日期及备注信息。

## 修改标签

Git 不支持直接“修改”标签内容，但可以通过 **删除旧标签 + 创建新标签** 实现替换。

```bash
# 删除本地旧标签
git tag -d v1.0.0

# 重新创建新标签
git tag -a v1.0.0 -m "Updated release info"
```

如果标签已推送到远程，还需同步删除并重新推送（见下文）。

## 删除标签

### 删除本地标签

```bash
git tag -d v1.0.0
```

### 删除远程标签

```bash
git push origin :refs/tags/v1.0.0
```

或：

```bash
git push origin --delete tag v1.0.0
```

## 推送与拉取标签

默认情况下，执行 `git push` 不会推送标签，需要手动操作。

### 推送单个标签

```bash
git push origin v1.0.0
```

### 推送全部标签

```bash
git push origin --tags
```

### 拉取远程标签

```bash
git fetch --tags
```

## 重命名标签（间接实现）

Git 没有直接的重命名命令，可以通过以下方式实现：

```bash
git tag new-tag old-tag
git tag -d old-tag
git push origin :refs/tags/old-tag
git push origin new-tag
```

## 实用技巧

- **查看最新标签指向的提交：**

  ```bash
  git describe --tags
  ```

- **为当前提交创建基于日期的标签：**

  ```bash
  git tag -a v$(date +%Y%m%d) -m "Daily build"
  ```

- **用标签进行检出（回滚到指定版本）：**

  ```bash
  git checkout v1.0.0
  ```

> ⚠️ 注意：检出标签会进入“分离的 HEAD 状态”，不在任何分支上。
