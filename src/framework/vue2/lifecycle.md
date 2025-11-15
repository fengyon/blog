# Vue2 生命周期

Vue2 实例从创建到销毁的完整过程称为生命周期，期间会运行一些叫做生命周期钩子的函数，让开发者有机会在特定阶段添加自己的代码。

## 生命周期概览

Vue2 实例完整的生命周期流程：

```
创建阶段:
new Vue() 
    ↓
beforeCreate  → 实例初始化，数据观测之前
    ↓
created       → 实例创建完成，数据观测已配置
    ↓
beforeMount   → 挂载开始之前，模板编译完成
    ↓
mounted       → 实例挂载到DOM，可访问$el

更新阶段:
数据变化
    ↓
beforeUpdate  → 数据更新，虚拟DOM重新渲染之前
    ↓
updated       → 数据更新，虚拟DOM重新渲染完成

销毁阶段:
beforeDestroy → 实例销毁之前，实例仍完全可用
    ↓
destroyed     → 实例销毁，所有绑定和监听器被移除
```

## 创建阶段钩子

### beforeCreate

在实例初始化之后，数据观测和事件配置之前被调用。

```javascript
new Vue({
  data: {
    message: 'Hello Vue!'
  },
  beforeCreate() {
    console.log('beforeCreate 钩子被调用')
    console.log('this.message:', this.message) // undefined
    console.log('this.$el:', this.$el)         // undefined
  }
})
```

特点：
- 数据观测未初始化
- 方法未绑定
- $el 属性不可用

### created

实例创建完成后调用，已完成数据观测、属性和方法的运算。

```javascript
new Vue({
  data: {
    message: 'Hello Vue!'
  },
  created() {
    console.log('created 钩子被调用')
    console.log('this.message:', this.message) // 'Hello Vue!'
    console.log('this.$el:', this.$el)         // undefined
  }
})
```

特点：
- 数据观测已配置
- 可访问 data、computed、methods
- $el 属性仍不可用 (未挂载)
- 适合调用 API 获取初始数据

## 挂载阶段钩子

### beforeMount

在挂载开始之前被调用，相关的 render 函数首次被调用。

```javascript
new Vue({
  beforeMount() {
    console.log('beforeMount 钩子被调用')
    console.log('this.$el:', this.$el)         // 未挂载，显示原始HTML
  }
})
```

特点：
- 模板编译完成
- 虚拟 DOM 已创建
- 尚未替换挂载目标元素

### mounted

实例被挂载后调用，el 被新创建的 vm.$el 替换。

```javascript
new Vue({
  mounted() {
    console.log('mounted 钩子被调用')
    console.log('this.$el:', this.$el)         // 已挂载的DOM元素
  }
})
```

特点：
- 实例已挂载到 DOM
- 可访问 $el 和 DOM 元素
- 适合执行 DOM 操作、初始化第三方库

## 更新阶段钩子

### beforeUpdate

数据更新时调用，发生在虚拟 DOM 重新渲染和打补丁之前。

```javascript
new Vue({
  data: {
    count: 0
  },
  beforeUpdate() {
    console.log('beforeUpdate 钩子被调用')
    console.log('数据已更新，DOM尚未更新')
    console.log('this.count:', this.count)
  },
  methods: {
    increment() {
      this.count++ // 触发 beforeUpdate 和 updated
    }
  }
})
```

特点：
- 响应式数据已更新
- 当前 DOM 尚未更新
- 适合在更新前访问现有 DOM 状态

### updated

由于数据更改导致的虚拟 DOM 重新渲染和打补丁完成后调用。

```javascript
new Vue({
  data: {
    count: 0
  },
  updated() {
    console.log('updated 钩子被调用')
    console.log('DOM已更新完成')
    console.log('this.count:', this.count)
  }
})
```

特点：
- DOM 已更新完成
- 可执行依赖 DOM 的操作
- 避免在此钩子中更改状态，可能导致无限更新循环

## 销毁阶段钩子

### beforeDestroy

实例销毁之前调用，在这一步实例仍然完全可用。

```javascript
new Vue({
  beforeDestroy() {
    console.log('beforeDestroy 钩子被调用')
    console.log('实例即将销毁，但仍可访问数据和方法')
    
    // 清理工作
    clearInterval(this.timer)
    this.removeEventListeners()
  },
  methods: {
    removeEventListeners() {
      // 移除事件监听器
    }
  }
})
```

特点：
- 实例仍完全可用
- 适合清理定时器、取消请求、移除事件监听器

### destroyed

实例销毁后调用，所有绑定和监听器都会被移除。

```javascript
new Vue({
  destroyed() {
    console.log('destroyed 钩子被调用')
    console.log('实例已完全销毁')
    console.log('this.$el:', this.$el)         // null
    console.log('this.message:', this.message) // 仍可访问，但已无响应式
  }
})
```

特点：
- 所有指令已解绑
- 所有事件监听器已移除
- 所有子实例也被销毁

## 生命周期使用场景

### 数据初始化

```javascript
new Vue({
  data() {
    return {
      users: [],
      loading: true
    }
  },
  created() {
    this.fetchUsers() // 适合API调用
  },
  methods: {
    async fetchUsers() {
      try {
        this.users = await api.getUsers()
      } catch (error) {
        console.error('获取用户失败:', error)
      } finally {
        this.loading = false
      }
    }
  }
})
```

### DOM 操作

```javascript
new Vue({
  data() {
    return {
      chart: null
    }
  },
  mounted() {
    // 适合初始化需要DOM的第三方库
    this.chart = new Chart(this.$el, {
      // 图表配置
    })
  },
  beforeDestroy() {
    // 清理图表实例
    if (this.chart) {
      this.chart.destroy()
    }
  }
})
```

### 事件监听

```javascript
new Vue({
  mounted() {
    // 添加事件监听
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    // 移除事件监听
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleResize() {
      // 处理窗口大小变化
    }
  }
})
```

## 组件生命周期

组件拥有与 Vue 实例相同的生命周期，但还有一些额外的钩子：

### activated 和 deactivated

keep-alive 组件特有，用于缓存组件状态。

```javascript
export default {
  activated() {
    console.log('组件被激活，从缓存中恢复')
    this.startPolling()
  },
  deactivated() {
    console.log('组件被停用，进入缓存')
    this.stopPolling()
  },
  methods: {
    startPolling() {
      // 开始轮询
    },
    stopPolling() {
      // 停止轮询
    }
  }
}
```

## 错误处理钩子

### errorCaptured

捕获来自子孙组件的错误。

```javascript
export default {
  errorCaptured(err, vm, info) {
    console.error('捕获到错误:', err)
    console.log('发生错误的组件:', vm)
    console.log('错误信息:', info)
    
    // 可以返回 false 阻止错误继续向上传播
    return false
  }
}
```

## 生命周期执行顺序

父子组件生命周期执行顺序：

```
父 beforeCreate
父 created
父 beforeMount
   ↓
子 beforeCreate
子 created
子 beforeMount
子 mounted
   ↓
父 mounted
```

更新时的执行顺序：

```
父 beforeUpdate
   ↓
子 beforeUpdate
子 updated
   ↓
父 updated
```