# Vue2 响应式原理

Vue2 的响应式系统是其核心特性，通过数据劫持和依赖收集实现数据变化时的自动更新。

## 响应式系统概览

Vue2 响应式系统的基本工作流程：

```
数据劫持 → 依赖收集 → 派发更新
    ↓
模板编译 → 虚拟DOM → 视图更新
```

## 数据劫持

Vue2 使用 Object.defineProperty 实现数据劫持，将数据属性转为 getter/setter。

### 对象属性劫持

```javascript
function defineReactive(obj, key, val) {
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      console.log(`读取属性 ${key}: ${val}`)
      return val
    },
    set: function reactiveSetter(newVal) {
      console.log(`设置属性 ${key}: ${newVal}`)
      if (newVal === val) return
      val = newVal
      // 触发更新
    }
  })
}
```

示意图：
```
原始对象: { name: '张三' }
        ↓
数据劫持后:
get name() → 收集依赖
set name() → 通知更新
```

### 深度观测

Vue2 递归遍历对象所有属性，实现深度响应式。

```javascript
function observe(data) {
  if (typeof data !== 'object' || data === null) {
    return
  }
  
  // 遍历对象属性
  Object.keys(data).forEach(key => {
    defineReactive(data, key, data[key])
    // 递归处理嵌套对象
    observe(data[key])
  })
}
```

## 依赖收集

每个响应式属性都有一个对应的 Dep 实例，用于管理所有依赖 (Watcher)。

### Dep 类

```javascript
class Dep {
  constructor() {
    this.subs = [] // 订阅者列表
  }
  
  addSub(sub) {
    this.subs.push(sub)
  }
  
  removeSub(sub) {
    const index = this.subs.indexOf(sub)
    if (index > -1) {
      this.subs.splice(index, 1)
    }
  }
  
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }
  
  notify() {
    this.subs.forEach(sub => sub.update())
  }
}

Dep.target = null // 当前正在计算的 Watcher
```

### Watcher 类

```javascript
class Watcher {
  constructor(vm, expOrFn, cb) {
    this.vm = vm
    this.getter = expOrFn
    this.cb = cb
    this.deps = []
    this.value = this.get()
  }
  
  get() {
    Dep.target = this
    const value = this.getter.call(this.vm)
    Dep.target = null
    return value
  }
  
  addDep(dep) {
    this.deps.push(dep)
    dep.addSub(this)
  }
  
  update() {
    const oldValue = this.value
    this.value = this.get()
    this.cb.call(this.vm, this.value, oldValue)
  }
}
```

### 依赖收集流程

```
模板编译 → 创建 Watcher
        ↓
读取数据 → 触发 getter
        ↓
dep.depend() → 将 Watcher 添加到 Dep
        ↓
建立: 数据 ←dep→ Watcher 关系
```

## 完整的响应式实现

### Observer 类

```javascript
class Observer {
  constructor(value) {
    this.value = value
    this.dep = new Dep()
    
    if (Array.isArray(value)) {
      // 数组响应式处理
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }
  
  walk(obj) {
    Object.keys(obj).forEach(key => {
      defineReactive(obj, key, obj[key])
    })
  }
  
  observeArray(items) {
    items.forEach(item => {
      observe(item)
    })
  }
}
```

### 完整的 defineReactive

```javascript
function defineReactive(obj, key, val) {
  const dep = new Dep()
  
  // 递归处理嵌套对象
  let childOb = observe(val)
  
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      // 依赖收集
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
        }
      }
      return val
    },
    set: function reactiveSetter(newVal) {
      if (newVal === val) return
      
      val = newVal
      // 新值也需要转为响应式
      childOb = observe(newVal)
      // 通知更新
      dep.notify()
    }
  })
}
```

## 数组的响应式处理

由于 Object.defineProperty 对数组索引变化监听有限，Vue2 通过重写数组方法实现响应式。

### 数组方法重写

```javascript
const arrayProto = Array.prototype
const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
  'push', 'pop', 'shift', 'unshift',
  'splice', 'sort', 'reverse'
]

methodsToPatch.forEach(method => {
  const original = arrayProto[method]
  
  def(arrayMethods, method, function mutator(...args) {
    const result = original.apply(this, args)
    const ob = this.__ob__
    
    // 对新增元素进行响应式处理
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted)
    
    // 通知更新
    ob.dep.notify()
    return result
  })
})
```

### 数组响应式示意图

```
原始数组: arr = [1, 2, 3]
        ↓
重写方法: arr.push = function() { ...通知更新... }
        ↓
arr.push(4) → 触发重写方法 → 通知依赖更新
```

## 响应式系统的局限性

### 对象属性添加/删除

```javascript
var vm = new Vue({
  data: {
    obj: {
      a: 1
    }
  }
})

// obj.a 是响应式的
vm.obj.a = 2 // 触发更新

// obj.b 不是响应式的
vm.obj.b = 2 // 不会触发更新
```

解决方案：
```javascript
// Vue.set 或 this.$set
Vue.set(vm.obj, 'b', 2)

// 或使用 Object.assign
vm.obj = Object.assign({}, vm.obj, { b: 2 })
```

### 数组索引和长度

```javascript
var vm = new Vue({
  data: {
    items: ['a', 'b', 'c']
  }
})

// 以下操作不会触发视图更新
vm.items[0] = 'x'       // 直接设置索引
vm.items.length = 2     // 直接修改长度
```

解决方案：
```javascript
// Vue.set 或 splice
Vue.set(vm.items, 0, 'x')
vm.items.splice(0, 1, 'x')
vm.items.splice(2) // 修改长度
```

## 异步更新队列

Vue2 使用异步更新策略优化性能，将多个数据变化合并为一次更新。

### nextTick 机制

```javascript
Vue.nextTick(() => {
  // DOM 更新后执行
})

// 组件内使用
this.$nextTick(() => {
  // DOM 更新后执行
})
```

更新流程：
```
数据变化 → 将 Watcher 加入队列
        ↓
nextTick → 执行队列中所有 Watcher
        ↓
批量更新 → 虚拟DOM对比 → 视图更新
```

### 更新队列实现

```javascript
const queue = []
let waiting = false

function queueWatcher(watcher) {
  // 去重，避免重复更新
  const id = watcher.id
  if (!queue.some(w => w.id === id)) {
    queue.push(watcher)
  }
  
  if (!waiting) {
    waiting = true
    nextTick(flushSchedulerQueue)
  }
}

function flushSchedulerQueue() {
  queue.forEach(watcher => {
    watcher.run()
  })
  queue.length = 0
  waiting = false
}
```

## 虚拟 DOM 与 Diff 算法

响应式数据变化后，通过虚拟 DOM 对比最小化 DOM 操作。

### 虚拟 DOM 结构

```javascript
// 简化的 VNode
{
  tag: 'div',
  data: { attrs: {}, on: {} },
  children: [
    { tag: 'span', text: 'Hello' }
  ]
}
```

### Diff 算法流程

```
旧虚拟DOM ←→ 新虚拟DOM
    ↓
对比节点类型
    ↓
对比属性
    ↓
对比子节点（key优化）
    ↓
最小DOM操作
```

## 响应式原理总结图

```
组件初始化
    ↓
数据观测 (Observer)
    ↓          ↑
属性劫持 (defineReactive) → Dep
    ↓          ↑
模板编译 → 创建 Watcher → 依赖收集
    ↓                    ↑
数据变化 → 触发 setter → 派发更新
    ↓
异步队列 → 虚拟DOM对比 → 视图更新
```

## 性能优化提示

- 避免大型响应式对象层级过深
- 合理使用 Object.freeze() 避免不必要的响应式
- 对于纯展示的大数据列表，可使用非响应式数据
- 合理使用 key 属性优化列表渲染
- 避免在模板中使用复杂表达式