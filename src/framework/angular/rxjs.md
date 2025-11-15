# Angualr Rxjs

## RxJS 概述

RxJS (Reactive Extensions for JavaScript) 是 Angular 中用于响应式编程的库，它使用 Observable 序列来处理异步事件和数据流。

示意图：
```
RxJS 核心：
数据流 → Observable → 操作符变换 → Observer 订阅

在 Angular 中的应用：
HTTP请求、表单事件、路由事件、状态管理
```

## 基本概念

### Observable
表示一个可观察的数据流，可以发出多个值 over time。

示意图：
```
Observable 生命周期：
创建 → 订阅 → 执行 → 发出值 → 完成/错误

数据流：
---值1---值2---值3---|完成->
```

### Observer
观察者，用于接收 Observable 发出的值。

示意图：
```
Observer 接口：
{
  next: (value) => { ... },    // 接收值
  error: (error) => { ... },   // 处理错误  
  complete: () => { ... }      // 完成通知
}
```

### Subscription
表示 Observable 的执行，用于取消订阅。

示意图：
```
订阅管理：
const subscription = observable.subscribe(...)

取消订阅：
subscription.unsubscribe() ← 清理资源，防止内存泄漏
```

## 创建 Observable

### 创建方法
多种方式创建 Observable 数据流。

示意图：
```
创建方式：
of(1,2,3)        → 固定值序列
from([1,2,3])    → 数组转换
fromEvent(click)  → 事件监听
interval(1000)    → 定时器
ajax(url)         → HTTP请求
```

### 创建示例
实际创建 Observable 的代码示例。

示意图：
```
// 创建简单序列
const numbers$ = of(1, 2, 3, 4, 5);

// 从事件创建
const clicks$ = fromEvent(button, 'click');

// 从 Promise 创建  
const data$ = from(fetch('/api/data'));

// 自定义 Observable
const custom$ = new Observable(observer => {
  observer.next('Hello');
  observer.next('World');
  observer.complete();
});
```

## 常用操作符

### 转换操作符
对数据流中的值进行转换。

示意图：
```
转换操作符：
map      → 值转换：x → f(x)
pluck    → 提取属性：obj → obj.property
scan     → 累加计算：类似 reduce 但发出每个中间值
```

示例：
```typescript
numbers$.pipe(
  map(x => x * 2),        // 1,2,3 → 2,4,6
  pluck('name'),          // {name:'A'} → 'A'
  scan((acc, val) => acc + val, 0) // 1,2,3 → 1,3,6
)
```

### 过滤操作符
根据条件过滤数据流中的值。

示意图：
```
过滤操作符：
filter     → 条件过滤：x → 符合条件才发出
take       → 取前N个值
skip       → 跳过前N个值  
distinct   → 去重
debounceTime → 防抖
```

示例：
```typescript
clicks$.pipe(
  debounceTime(300),      // 防抖 300ms
  filter(event => event.target.checked), // 过滤选中事件
  take(5)                 // 只取前5次点击
)
```

### 组合操作符
组合多个 Observable。

示意图：
```
组合操作符：
merge      → 合并多个流
concat     → 顺序连接流
combineLatest → 组合最新值
withLatestFrom → 与另一个流的最新值组合
```

示例：
```typescript
// 合并用户输入和定时刷新
const userInput$ = fromEvent(input, 'input');
const autoRefresh$ = interval(5000);

const data$ = combineLatest([
  userInput$.pipe(debounceTime(300)),
  autoRefresh$
]).pipe(
  switchMap(([query]) => fetchData(query))
);
```

## 错误处理

### 错误处理操作符
处理 Observable 执行过程中出现的错误。

示意图：
```
错误处理：
catchError → 捕获错误并返回新Observable
retry      → 重试指定次数
retryWhen  → 自定义重试逻辑
finalize   → 无论成功失败都会执行
```

示例：
```typescript
http.get('/api/data').pipe(
  retry(3), // 失败时重试3次
  catchError(error => {
    console.error('请求失败:', error);
    return of([]); // 返回空数组作为降级
  }),
  finalize(() => {
    this.loading = false; // 无论成功失败都隐藏loading
  })
)
```

## Subject 类型

### Subject
既是 Observable 又是 Observer，支持多播。

示意图：
```
Subject 特性：
多播 - 多个观察者共享同一个执行
热 Observable - 无论何时订阅都接收后续值

使用模式：
subject.next(value) → 所有订阅者收到值
```

### Subject 变体
不同类型的 Subject 满足不同场景需求。

示意图：
```
Subject 类型：
Subject        → 无初始值，只发送订阅后的值
BehaviorSubject → 有初始值，发送最新值和后续值
ReplaySubject  → 重放指定数量的历史值
AsyncSubject   → 只发送完成前的最后一个值
```

示例：
```typescript
// BehaviorSubject - 状态管理
const state$ = new BehaviorSubject({ loading: false, data: null });

// 订阅者立即收到当前状态
state$.subscribe(state => console.log(state));

// 更新状态，所有订阅者收到新状态
state$.next({ loading: true, data: null });
```

## Angular 集成

### HTTP 请求
HttpClient 返回 Observable，便于响应式处理。

示意图：
```
HTTP 响应流：
请求发出 → Observable → 操作符处理 → 组件订阅

示例：
this.data$ = http.get('/api/data').pipe(
  map(response => response.data),
  catchError(() => of([]))
);
```

### 表单处理
响应式表单的值变化作为 Observable 流。

示意图：
```
表单值流：
表单值变化 → valueChanges → 操作符处理 → 执行操作

示例：
this.searchForm.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(query => this.searchService.search(query))
).subscribe(results => {
  this.results = results;
});
```

### 路由事件
监听路由变化作为 Observable 流。

示意图：
```
路由事件流：
导航事件 → router.events → 过滤特定事件 → 处理逻辑

示例：
this.router.events.pipe(
  filter(event => event instanceof NavigationEnd),
  map(() => this.router.url)
).subscribe(url => {
  this.trackPageView(url);
});
```

## 高级模式

### 高阶 Observable
处理嵌套的 Observable 流。

示意图：
```
高阶 Observable 操作符：
switchMap → 切换到新Observable，取消前一个
mergeMap  → 合并多个Observable
concatMap → 顺序执行Observable
exhaustMap → 忽略新值直到当前完成
```

示例：
```typescript
// 搜索建议 - 使用 switchMap 取消之前的请求
searchInput$.pipe(
  debounceTime(300),
  switchMap(query => {
    if (!query) return of([]);
    return this.searchService.getSuggestions(query);
  })
)
```

### 自定义操作符
创建可重用的操作符逻辑。

示意图：
```
自定义操作符：
函数接收配置 → 返回操作符函数 → 在 pipe 中使用

示例：
function logOperator<T>(message: string) {
  return (source: Observable<T>) => source.pipe(
    tap(value => console.log(message, value))
  );
}

// 使用
data$.pipe(
  logOperator('收到数据:')
)
```

## 内存管理

### 订阅管理
避免内存泄漏，正确管理订阅。

示意图：
```
订阅管理策略：
手动取消订阅 → subscription.unsubscribe()
AsyncPipe → 模板中自动管理
takeUntil → 使用 Subject 控制生命周期
```

示例：
```typescript
// takeUntil 模式
private destroy$ = new Subject<void>();

ngOnInit() {
  this.data$ = this.service.getData().pipe(
    takeUntil(this.destroy$)
  );
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

## 调试技巧

### 调试操作符
使用 tap 操作符进行调试。

示意图：
```
调试流：
数据流 → tap(日志) → 后续操作

示例：
data$.pipe(
  tap(value => console.log('原始值:', value)),
  map(value => transform(value)),
  tap(value => console.log('转换后:', value))
)
```

### 错误调试
定位 Observable 链中的错误位置。

示意图：
```
错误定位：
操作符链 → 某个操作符出错 → 错误冒泡

调试方法：
在每个可能出错的操作符前添加 tap 记录状态
使用 catchError 在特定位置处理错误
```

## 性能优化

### 操作符选择
根据场景选择合适的操作符提升性能。

示意图：
```
性能考虑：
switchMap vs mergeMap → 是否需要取消前一个请求
debounceTime vs throttleTime → 防抖还是节流
share vs shareReplay → 共享执行还是重放值
```

### 避免常见陷阱
防止性能问题和内存泄漏。

示意图：
```
常见陷阱：
├── 忘记取消订阅
├── 过度使用内存密集型操作符
├── 不必要的重复订阅
├── 在 pipe 中创建新对象导致频繁变更检测
└── 使用不合适的操作符组合
```