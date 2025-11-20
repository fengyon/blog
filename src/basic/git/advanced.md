# Git 高级技巧

Git 不只是版本控制工具，更是开发效率的倍增器。本文总结了一系列 **Git 高级技巧**，帮助你在复杂项目中保持优雅与高效。

---

## 一、提交管理与精确回溯

### 交互式提交 (Interactive Commit)

有时一个文件修改了多个逻辑，可以用交互式模式分块提交：

```bash
git add -p
```

此命令会逐块显示差异，询问是否添加到暂存区。
常用选项：

* `y` 添加
* `n` 跳过
* `e` 编辑补丁
* `q` 退出

效果示意：

```
[diff block 1] ---> y
[diff block 2] ---> n
```

最终仅第一块进入提交。

---

### 修改最近一次提交

```bash
git commit --amend
```

> 用于修正文案或补充漏提的文件。
> ⚠️ 仅限未推送的提交，否则会导致历史变更。

---

### 按条件回滚提交

```bash
git revert <commit-id>
```

会生成一个“反向提交”，安全回滚。
而：

```bash
git reset --hard <commit-id>
```

会直接回退 HEAD，删除历史，不可逆。

对比示意：

```
主线历史：
A -- B -- C -- D (HEAD)

revert C:
A -- B -- C -- D -- (revert C)

reset --hard C:
A -- B -- C (HEAD)
```

---

## 二、分支策略与多线协作

### 分支模型

推荐常用的 **Git Flow** 模型：

```
main  → 稳定上线版本
│
└─ develop → 日常开发
    ├─ feature/* → 新功能
    ├─ hotfix/*  → 紧急修复
    └─ release/* → 预发布
```

示意图：

```
main ──────●──────────────●─────────→
             \            /
develop ──●───●───●───●───●───●────→
            \         \
            feature/x  hotfix/y
```

---

### 变基 (Rebase) 与合并 (Merge)

**merge：**保留分支记录，历史分叉明显。
**rebase：**整理线性历史，使提交更清晰。

```
merge：
A---B---C (main)
     \ 
      D---E (feature)
→ merge →
A---B---C------F
      \       /
       D-----E

rebase：
A---B---C (main)
     \
      D---E (feature)
→ rebase →
A---B---C---D'---E'
```

使用：

```bash
git rebase main
git merge feature
```

---

## 三、挑拣与拆分提交

### 挑拣特定提交 (Cherry-pick)

从任意分支取出一个提交并应用到当前分支：

```bash
git cherry-pick <commit-id>
```

效果：

```
main:    A -- B -- C
feature: A -- B -- D
cherry-pick C → feature: A -- B -- D -- C'
```

---

### 拆分历史提交

有时一次提交过大，可以重写历史拆分：

```bash
git rebase -i HEAD~3
```

编辑窗口示例：

```
pick a1b2c3 first commit
pick d4e5f6 second commit
pick g7h8i9 third commit
```

改为：

```
edit a1b2c3 first commit
```

进入编辑后执行：

```bash
git reset HEAD^
git add -p
git commit -m "part 1"
git commit -m "part 2"
git rebase --continue
```

---

## 四、暂存与恢复现场

### 临时保存修改

```bash
git stash
```

存储当前未提交修改并清理工作区。

查看与恢复：

```bash
git stash list
git stash apply stash@{0}
```

效果示意：

```
工作区 → stash 堆栈
stash@{0}: WIP on feature/login
```

---

## 五、日志与历史分析

### 图形化查看历史

```bash
git log --oneline --graph --all --decorate
```

输出示意：

```
* d4e5f6 (HEAD -> main) add navbar
| * a1b2c3 (feature/login) add login form
|/
* 9z8y7x init project
```

---

### 追踪文件历史

```bash
git log -p -- <file>
```

查看指定文件的修改记录与差异。

---

## 六、效率提升技巧

### 为命令取别名

```bash
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all --decorate"
```

常用别名表：

| 命令       | 作用             |
| -------- | -------------- |
| `git st` | 查看状态           |
| `git lg` | 图形化历史          |
| `git co` | 切换分支（checkout） |
| `git br` | 分支列表           |

---

### 清理无效分支

```bash
git fetch -p
git branch -vv
git branch -d branch_name
```

---

## 七、强大的 `.gitignore` 与 `.gitattributes`

### 忽略文件规则

`.gitignore` 示例：

```
node_modules/
dist/
*.log
.env
```

### 控制文件属性

`.gitattributes` 示例：

```
*.sh text eol=lf
*.jpg binary
```

---

## 八、常见高级命令速查表

| 命令                  | 说明                   |
| ------------------- | -------------------- |
| `git reflog`        | 查看所有 HEAD 变化（找回误删分支） |
| `git bisect`        | 二分查找出错提交             |
| `git blame`         | 查看每行最后修改者            |
| `git clean -fd`     | 清理未跟踪文件              |
| `git diff --cached` | 查看暂存区与上次提交差异         |
