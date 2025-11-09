# Angular Signal

## 信号概念

Angular Signal 是 Angular 框架中引入的一种新的响应式状态管理机制，它提供了一种精细跟踪状态变化的方式，让框架能够优化渲染更新。信号本质上是一个值的包装器，当值发生变化时可以通知感兴趣的消费者。

示意图：

```
传统状态管理 vs 信号管理
传统: 状态改变 → Zone.js检测整个组件树 → 重新渲染可能未变化的部分
信号: 状态改变 → 只通知依赖该信号的组件 → 精准更新受影响部分
```

## 信号基础

### 创建信号

使用 `signal()` 函数创建可写信号，初始值可以是任何数据类型。

```typescript
count = signal(0) // 简单创建
count: WritableSignal<number> = signal<number>(0) // 带类型注解
```

### 读取与更新

信号的值通过 getter 函数读取，使用 set() 和 update() 方法更新值。

示意图：

```
信号操作：
创建: count = signal(0)
读取: count() → 0
设置: count.set(1) → 值变为1
更新: count.update(val => val + 1) → 基于前值计算
```

示例代码：

```typescript
// 模板中
<p>当前计数：{{ count() }}</p>
<button (click)="increment()">增加</button>

// 组件中
increment(): void {
  this.count.update(current => current + 1);
}
```

## 计算信号

### 派生状态

`computed()` 创建从其他信号派生值的只读信号，具有延迟计算和记忆特性。

示意图：

```
计算信号依赖链：
firstName → fullName → 显示界面
lastName  ↗

当 firstName 或 lastName 变化时 → fullName 自动重新计算 → 界面更新
```

示例代码：

```typescript
firstName = signal('张');
lastName = signal('三');
fullName = computed(() => `${this.firstName()} ${this.lastName()}`);

// 使用
<p>欢迎，{{ fullName() }}</p>
```

### 计算特性

计算信号仅在第一次读取时计算值，然后缓存结果，直到依赖项变化才重新计算。Angular 只跟踪推导过程中实际读取的信号，动态管理依赖关系。

## 副作用效应

### Effect 使用

`effect()` 用于执行副作用操作，如日志记录、数据持久化等。

示意图：

```
信号变化 → effect 自动执行 → 执行副作用操作
    ↑
    ↓
依赖信号变化时重新运行
```

示例代码：

```typescript
constructor() {
  effect(() => {
    console.log('计数发生变化：', this.count());
    // 可在此处添加 localStorage 存储等操作
  });
}
```

### Effect 管理

Effect 在创建时运行一次，并在其依赖的信号变化时重新运行。Effect 会自动在其封闭上下文销毁时清理，也可手动通过返回的 `EffectRef` 销毁。

## 高级用法

### 对象和数组处理

处理复杂数据结构时，需使用信号 API 更新值，避免直接修改。

```typescript
// 正确方式
users = signal([{name: '张三', age: 30}]);

addUser(user: User): void {
  this.users.update(users => [...users, user]);
}

// 错误方式：直接修改
this.users().push(newUser); // 绕过信号系统
```

### 相等性控制

创建信号时可提供自定义相等函数，控制何时触发更新。

```typescript
import _ from 'lodash'

const data = signal(['test'], { equal: _.isEqual })
data.set(['test']) // 深度相等，不触发更新
```

## 与 RxJS 互操作

### 相互转换

Angular 提供 `toObservable` 和 `toSignal` 函数实现信号与 Observable 之间的转换。

示意图：

```
信号世界 ←→ RxJS 世界
toSignal() →
           ← toObservable()
```

示例代码：

```typescript
// 信号转 Observable
count = signal(0)
count$ = toObservable(this.count)

// Observable 转信号
data$ = this.dataService.getData()
data = toSignal(this.data$, { initialValue: [] })
```

### 使用场景

Signals 用于本地 UI 状态管理，Observables 适合异步数据流如 HTTP 请求、WebSocket 等。

## 性能优势

### 精细跟踪

信号通过减少变更检测过程中的计算次数来提高运行时性能，只更新依赖于变化信号的组件。

示意图：

```
传统变更检测: 检查整个组件树 → 计算量大
信号机制: 知道精确依赖路径 → 只更新必要部分
```

### Zone.js 集成

在 `OnPush` 组件中使用信号时，信号更新会自动标记组件需要检查，无需手动触发变更检测。信号为未来使 Zone.js 成为可选功能奠定基础。

## 最佳实践

### 模式选择

- **信号**：适合局部 UI 状态、简单派生状态
- **RxJS**：适合复杂异步流、事件处理
- **混合使用**：利用互操作功能充分发挥两者优势

### 开发建议

1. 始终使用信号 API 更新值
2. 合理使用 computed() 缓存昂贵计算
3. 注意 effect() 执行时机和清理
4. 利用 TypeScript 类型系统保证类型安全

Angular Signals 代表 Angular 响应式演进的未来方向，提供更简单、更高效的状态管理方案，同时保持与现有系统的完全兼容性。
