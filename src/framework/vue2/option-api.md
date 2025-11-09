# Vue2 Option API

Vue2 使用选项式 API，通过定义一系列选项对象来创建组件，每个选项负责组件的一个特定功能。

## Option API 基础结构

Vue2 组件的基本选项结构：

```
new Vue({
  el:          // 挂载点
  data:        // 响应式数据
  props:       // 接收的属性
  computed:    // 计算属性
  methods:     // 方法
  watch:       // 侦听器
  lifecycle:   // 生命周期钩子
  components:  // 子组件
  directives:  // 自定义指令
  ...
})
```

## data

定义组件的响应式数据。

```javascript
export default {
  data() {
    return {
      message: 'Hello Vue!',
      count: 0,
      user: {
        name: '张三',
        age: 25
      },
      items: ['项目1', '项目2']
    }
  }
}
```

响应式原理示意图：
```
data() { return { count: 0 } }
        ↓
Vue 将其转为响应式
        ↓
count 变化 → 视图自动更新
```

## props

声明组件接收的属性。

```javascript
export default {
  props: {
    // 基础类型检查
    title: String,
    
    // 多个可能的类型
    content: [String, Number],
    
    // 必填且为数字
    likes: {
      type: Number,
      required: true
    },
    
    // 带默认值的对象
    config: {
      type: Object,
      default: () => ({
        color: 'blue',
        size: 'medium'
      })
    },
    
    // 自定义验证函数
    status: {
      validator: function(value) {
        return ['success', 'warning', 'error'].includes(value)
      }
    }
  }
}
```

## computed

基于依赖缓存的计算属性。

```javascript
export default {
  data() {
    return {
      firstName: '张',
      lastName: '三',
      items: [
        { name: '苹果', price: 5 },
        { name: '香蕉', price: 3 }
      ]
    }
  },
  computed: {
    // 仅 getter
    fullName() {
      return this.firstName + this.lastName
    },
    
    // 带 getter 和 setter
    reversedMessage: {
      get() {
        return this.message.split('').reverse().join('')
      },
      set(newValue) {
        this.message = newValue.split('').reverse().join('')
      }
    },
    
    // 依赖数组的计算
    totalPrice() {
      return this.items.reduce((sum, item) => sum + item.price, 0)
    }
  }
}
```

计算属性缓存机制：
```
计算属性A ← 依赖数据X, Y
        ↓
X或Y变化 → 重新计算A
        ↓
其他数据变化 → 不重新计算A (使用缓存)
```

## methods

定义组件的方法。

```javascript
export default {
  data() {
    return {
      count: 0
    }
  },
  methods: {
    // 普通方法
    increment() {
      this.count++
    },
    
    // 带参数的方法
    greet(name) {
      alert(`Hello, ${name}!`)
    },
    
    // 事件处理方法
    handleSubmit(event) {
      event.preventDefault()
      this.submitForm()
    },
    
    // 异步方法
    async fetchData() {
      try {
        this.loading = true
        const response = await api.getData()
        this.data = response.data
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    }
  }
}
```

## watch

观察和响应数据变化。

```javascript
export default {
  data() {
    return {
      question: '',
      answer: '',
      user: {
        name: '',
        profile: {
          age: 0
        }
      }
    }
  },
  watch: {
    // 基本用法
    question(newVal, oldVal) {
      this.getAnswer()
    },
    
    // 深度观察对象
    user: {
      handler(newVal, oldVal) {
        console.log('user 对象变化')
      },
      deep: true,        // 深度观察
      immediate: true    // 立即执行
    },
    
    // 观察嵌套属性
    'user.profile.age': function(newVal) {
      console.log('年龄变化:', newVal)
    },
    
    // 观察计算属性
    'fullName': function(newVal) {
      console.log('全名变化:', newVal)
    }
  },
  methods: {
    async getAnswer() {
      if (!this.question.includes('?')) return
      
      this.answer = '思考中...'
      const response = await fetch('https://yesno.wtf/api')
      const data = await response.json()
      this.answer = data.answer
    }
  }
}
```

## 生命周期钩子

组件生命周期各阶段的回调函数。

```javascript
export default {
  data() {
    return {
      timer: null
    }
  },
  
  // 创建阶段
  beforeCreate() {
    console.log('实例初始化完成')
  },
  created() {
    console.log('实例创建完成，可访问数据')
    this.fetchData()
  },
  
  // 挂载阶段
  beforeMount() {
    console.log('模板编译完成，即将挂载')
  },
  mounted() {
    console.log('实例已挂载到DOM')
    this.initThirdPartyLibrary()
  },
  
  // 更新阶段
  beforeUpdate() {
    console.log('数据更新，DOM即将重新渲染')
  },
  updated() {
    console.log('数据更新，DOM已重新渲染')
  },
  
  // 销毁阶段
  beforeDestroy() {
    console.log('实例即将销毁')
    clearInterval(this.timer)
  },
  destroyed() {
    console.log('实例已销毁')
  },
  
  methods: {
    fetchData() {
      // 获取初始数据
    },
    initThirdPartyLibrary() {
      // 初始化第三方库
    }
  }
}
```

## components

注册子组件。

```javascript
// 导入子组件
import ChildComponent from './ChildComponent.vue'
import ButtonCounter from './ButtonCounter.vue'

export default {
  components: {
    // 局部注册组件
    ChildComponent,
    ButtonCounter,
    
    // 异步组件
    AsyncComponent: () => import('./AsyncComponent.vue'),
    
    // 内联定义组件
    InlineComponent: {
      template: '<div>内联组件</div>',
      data() {
        return { message: 'Hello' }
      }
    }
  }
}
```

## directives

注册自定义指令。

```javascript
export default {
  directives: {
    // 局部注册指令
    focus: {
      inserted(el) {
        el.focus()
      }
    },
    
    // 颜色指令
    color: {
      bind(el, binding) {
        el.style.color = binding.value
      },
      update(el, binding) {
        el.style.color = binding.value
      }
    },
    
    // 点击外部指令
    clickOutside: {
      bind(el, binding, vnode) {
        el.clickOutsideEvent = function(event) {
          if (!(el === event.target || el.contains(event.target))) {
            vnode.context[binding.expression](event)
          }
        }
        document.addEventListener('click', el.clickOutsideEvent)
      },
      unbind(el) {
        document.removeEventListener('click', el.clickOutsideEvent)
      }
    }
  }
}
```

## filters

定义文本格式化过滤器。

```javascript
export default {
  filters: {
    // 首字母大写
    capitalize(value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
    },
    
    // 日期格式化
    formatDate(value) {
      if (!value) return ''
      return new Date(value).toLocaleDateString()
    },
    
    // 货币格式化
    currency(value, symbol = '¥') {
      if (!value) return symbol + '0'
      return symbol + Number(value).toFixed(2)
    }
  },
  data() {
    return {
      price: 1234.56,
      createdAt: '2023-01-01'
    }
  }
}
```

模板中使用过滤器：
```html
<p>{{ price | currency }}</p>
<p>{{ createdAt | formatDate }}</p>
<p>{{ 'hello' | capitalize }}</p>
```

## mixins

混入对象，用于组件选项复用。

```javascript
// 定义混入对象
const myMixin = {
  data() {
    return {
      mixinData: '来自混入的数据'
    }
  },
  created() {
    console.log('混入的 created 钩子')
  },
  methods: {
    mixinMethod() {
      console.log('混入的方法')
    }
  }
}

export default {
  mixins: [myMixin],
  data() {
    return {
      localData: '本地数据'
    }
  },
  created() {
    console.log('组件的 created 钩子')
    console.log(this.mixinData) // 可访问混入数据
    this.mixinMethod()         // 可调用混入方法
  }
}
```

选项合并策略：
```
数据对象 → 递归合并，组件数据优先
钩子函数 → 合并为数组，混入钩子先执行
方法、计算属性等 → 组件选项覆盖混入选项
```

## 完整组件示例

```javascript
export default {
  name: 'UserProfile',
  
  // 接收属性
  props: {
    userId: {
      type: Number,
      required: true
    },
    editable: {
      type: Boolean,
      default: false
    }
  },
  
  // 响应式数据
  data() {
    return {
      user: null,
      loading: false,
      error: null
    }
  },
  
  // 计算属性
  computed: {
    isAdult() {
      return this.user && this.user.age >= 18
    },
    displayName() {
      return this.user ? `${this.user.firstName} ${this.user.lastName}` : '未知用户'
    }
  },
  
  // 侦听器
  watch: {
    userId: {
      handler(newVal) {
        this.fetchUser(newVal)
      },
      immediate: true
    }
  },
  
  // 生命周期
  created() {
    console.log('用户档案组件已创建')
  },
  
  mounted() {
    this.initComponent()
  },
  
  beforeDestroy() {
    this.cleanup()
  },
  
  // 方法
  methods: {
    async fetchUser(id) {
      this.loading = true
      this.error = null
      
      try {
        const response = await api.getUser(id)
        this.user = response.data
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    
    async saveUser() {
      try {
        await api.updateUser(this.userId, this.user)
        this.$emit('user-updated', this.user)
      } catch (error) {
        this.error = error.message
      }
    },
    
    initComponent() {
      // 初始化组件
    },
    
    cleanup() {
      // 清理工作
    }
  }
}
```