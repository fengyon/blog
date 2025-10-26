# React Fiber

## 什么是 Fiber？

Fiber 是 React 16 引入的新的协调引擎（reconciliation engine），它的核心目标是支持增量渲染，将渲染工作拆分成多个小任务，并赋予不同优先级，从而实现更流畅的用户体验。

## Fiber 的基本原理

### 传统 Stack Reconciler 的问题

React 15 及之前版本使用 Stack Reconciler：

```
[组件A]
    ↓ 递归
[组件B] → [组件C]
    ↓      ↓
[组件D] [组件E] → [组件F]
```

问题：一旦开始渲染，就无法中断，可能导致界面卡顿。

### Fiber 架构的解决方案

Fiber 将组件表示为链表结构，支持中断和恢复：

```
组件A → 组件B → 组件D → 组件C → 组件E → 组件F
  ↓       ↓       ↓       ↓       ↓       ↓
 next   next   next   next   next   next
```

每个 Fiber 节点包含：

```javascript
{
  type: 'div' | ComponentType,
  key: null | string,
  child: Fiber | null,      // 第一个子节点
  sibling: Fiber | null,    // 下一个兄弟节点
  return: Fiber | null,     // 父节点
  alternate: Fiber | null,  // 用于双缓存
  effectTag: Placement | Update | Deletion,
  stateNode: DOM节点 | 组件实例,
  memoizedProps: props,
  memoizedState: state,
  // ... 其他属性
}
```

## React 不同版本的 Fiber 演进

### React 16: Fiber 架构引入

**更新方式**：

```
当前树 (Current) ↔ 工作进度树 (WorkInProgress)
      ↓
  双缓存切换
```

**渲染流程**：

```
1. 开始渲染
   ↓
2. 创建 WorkInProgress 树
   ↓
3. 协调阶段 (可中断)
   |-- 处理组件更新
   |-- 标记副作用
   ↓
4. 提交阶段 (不可中断)
   |-- 执行 DOM 操作
   |-- 调用生命周期
```

**效果**：支持时间分片，避免主线程阻塞。

### React 17: 渐进式升级

**更新改进**：

```
事件委托变更：
document → React 树的根容器
```

**Fiber 结构优化**：

```
组件树
    ↓
Fiber 树 (更稳定的内部实例)
    ↓
DOM 树
```

**效果**：更好的多版本 React 共存支持。

### React 18: 并发特性

**并发渲染**：

```
高优先级更新: █████████ 立即执行
低优先级更新: ░░░░░░░░░ 可中断
```

**自动批处理**：

```
// React 17: 只在事件处理中批处理
setState1() → 渲染
setState2() → 渲染

// React 18: 更多场景批处理
setState1() → 一次渲染
setState2() ┘
```

**新的 API**：

- `startTransition`: 标记非紧急更新
- `useTransition`: 并发状态管理
- `useDeferredValue`: 延迟值更新

### React 19: 编译时优化

**预期改进**：

```
编译前: <Component prop={value} />
编译后: 优化的 Fiber 结构 + 记忆化策略
```

**资源管理**：

```
组件卸载 → 自动清理资源
    ↓
useEffect 返回值的标准化处理
```

## Fiber 工作流程详解

### 协调阶段 (Reconciliation Phase)

```
当前 Fiber 树: A → B → D → C → E
    ↓ 开始更新
工作进度树: A' → B' → D' → C' → E'
    ↓ 可中断位置
协调完成，准备提交
```

### 提交阶段 (Commit Phase)

```
提交前: 当前树 A-B-D-C-E
    ↓ 不可中断
副作用列表: [放置B', 更新D', 删除C]
    ↓
提交后: 新树 A'-B'-D'-E'
```

### 优先级调度

```
优先级: Immediate → UserBlocking → Normal → Low → Idle
          ↓           ↓           ↓       ↓      ↓
       立即执行   用户交互后   普通更新   低优先级  空闲时
```

## 效果对比

### 同步渲染 vs 并发渲染

**同步模式**：

```
渲染任务: ████████████████████████
主线程:   被完全阻塞 50ms
```

**并发模式**：

```
渲染任务: ████░░████░░████░░████░░
主线程:   可响应交互，总时间 60ms 但无卡顿
```

### 实际应用示例

```jsx
// React 18 并发特性使用
function SearchComponent() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  // 使用 startTransition 标记非紧急更新
  const handleSearch = (value) => {
    setQuery(value) // 紧急更新：立即显示输入内容

    startTransition(() => {
      setResults(filterResults(value)) // 非紧急更新：可中断的搜索结果更新
    })
  }

  return (
    <input value={query} onChange={(e) => handleSearch(e.target.value)} />
  )
}
```
