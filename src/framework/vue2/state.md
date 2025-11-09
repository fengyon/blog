# Vue2 状态管理

Vue2 应用的状态管理主要解决组件间数据共享和状态维护的问题，确保应用状态的可预测性和可维护性。

## 状态管理概念

在 Vue2 应用中，状态管理处理组件间共享数据的流程：

```
组件A → 状态变更 → 状态容器 ← 状态变更 → 组件B
        ↓                    ↓
    统一管理状态          响应式更新
```

## 组件内状态管理

### data 与 props

组件内部状态使用 data，父子组件通信使用 props。

```javascript
// 父组件
export default {
  data() {
    return {
      sharedData: '共享数据'
    }
  },
  template: `
    <div>
      <child-component :message="sharedData" />
      <child-component :message="sharedData" />
    </div>
  `
}

// 子组件
export default {
  props: ['message'],
  template: '<div>{{ message }}</div>'
}
```

局限性：
```
深层嵌套组件通信困难
兄弟组件通信复杂
跨组件状态同步繁琐
```

### 事件总线

通过 Vue 实例作为事件中心实现组件间通信。

```javascript
// event-bus.js
import Vue from 'vue'
export const EventBus = new Vue()

// 组件A - 发送事件
export default {
  methods: {
    sendMessage() {
      EventBus.$emit('message-sent', 'Hello World')
    }
  }
}

// 组件B - 接收事件
export default {
  created() {
    EventBus.$on('message-sent', this.handleMessage)
  },
  beforeDestroy() {
    EventBus.$off('message-sent', this.handleMessage)
  },
  methods: {
    handleMessage(message) {
      console.log('收到消息:', message)
    }
  }
}
```

事件总线示意图：
```
组件A --$emit--> 事件总线 --$on--> 组件B
组件C --$emit-->        --$on--> 组件D
```

## Vuex 核心概念

Vuex 是 Vue2 官方的状态管理库，采用集中式存储管理应用的所有组件的状态。

### Vuex 架构图

```
组件 → Actions → Mutations → State ← Getters ← 组件
   ↓        ↓         ↓        ↓        ↓
  Dispatch  Commit   Mutate   Render   Access
```

### Store 基本结构

```javascript
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    count: 0,
    user: null
  },
  getters: {
    doubleCount: state => state.count * 2
  },
  mutations: {
    increment(state) {
      state.count++
    },
    setUser(state, user) {
      state.user = user
    }
  },
  actions: {
    incrementAsync({ commit }) {
      setTimeout(() => {
        commit('increment')
      }, 1000)
    },
    async fetchUser({ commit }, userId) {
      const user = await api.getUser(userId)
      commit('setUser', user)
    }
  }
})
```

### State

单一状态树，包含所有应用层级状态。

```javascript
const store = new Vuex.Store({
  state: {
    count: 0,
    todos: [
      { id: 1, text: '学习Vue', done: true },
      { id: 2, text: '学习Vuex', done: false }
    ]
  }
})

// 组件中访问
export default {
  computed: {
    count() {
      return this.$store.state.count
    },
    todos() {
      return this.$store.state.todos
    }
  }
}
```

### Getters

基于 state 的派生状态，类似计算属性。

```javascript
const store = new Vuex.Store({
  state: {
    todos: [
      { id: 1, text: '学习Vue', done: true },
      { id: 2, text: '学习Vuex', done: false }
    ]
  },
  getters: {
    // 基本getter
    doneTodos: state => {
      return state.todos.filter(todo => todo.done)
    },
    
    // 带参数的getter
    getTodoById: state => id => {
      return state.todos.find(todo => todo.id === id)
    },
    
    // 使用其他getter
    doneTodosCount: (state, getters) => {
      return getters.doneTodos.length
    }
  }
})

// 组件中使用
export default {
  computed: {
    doneTodos() {
      return this.$store.getters.doneTodos
    },
    todo() {
      return this.$store.getters.getTodoById(1)
    }
  }
}
```

### Mutations

更改 state 的唯一方法，必须是同步函数。

```javascript
const store = new Vuex.Store({
  state: {
    count: 1
  },
  mutations: {
    // 不带载荷
    increment(state) {
      state.count++
    },
    
    // 带载荷
    incrementBy(state, payload) {
      state.count += payload.amount
    },
    
    // 使用常量类型
    [SOME_MUTATION](state, payload) {
      // 更新state
    }
  }
})

// 组件中提交mutation
export default {
  methods: {
    increment() {
      this.$store.commit('increment')
    },
    incrementBy(amount) {
      this.$store.commit('incrementBy', { amount })
      // 或对象风格
      this.$store.commit({
        type: 'incrementBy',
        amount
      })
    }
  }
}
```

Mutation 规则：
```
必须是同步函数
通过 commit 调用
直接修改 state
```

### Actions

处理异步操作，提交 mutations 来改变状态。

```javascript
const store = new Vuex.Store({
  state: {
    count: 0,
    user: null
  },
  mutations: {
    increment(state) {
      state.count++
    },
    setUser(state, user) {
      state.user = user
    }
  },
  actions: {
    // 基本action
    incrementAsync({ commit }) {
      setTimeout(() => {
        commit('increment')
      }, 1000)
    },
    
    // 带参数的action
    incrementByAsync({ commit }, amount) {
      setTimeout(() => {
        commit('increment', amount)
      }, 1000)
    },
    
    // 异步action
    async fetchUser({ commit }, userId) {
      try {
        const response = await api.getUser(userId)
        commit('setUser', response.data)
      } catch (error) {
        console.error('获取用户失败:', error)
      }
    },
    
    // 组合action
    async actionA({ commit, dispatch }) {
      commit('gotData', await getData())
    },
    async actionB({ dispatch, commit }) {
      await dispatch('actionA') // 等待actionA完成
      commit('gotOtherData', await getOtherData())
    }
  }
})

// 组件中分发action
export default {
  methods: {
    incrementAsync() {
      this.$store.dispatch('incrementAsync')
    },
    fetchUser() {
      this.$store.dispatch('fetchUser', 123)
    }
  }
}
```

Action 与 Mutation 区别：
```
Action:   异步操作 → commit → Mutation
Mutation: 同步修改 → State
```

## Modules

将 store 分割成模块，每个模块拥有自己的 state、getters、mutations、actions。

```javascript
const moduleA = {
  state: () => ({
    count: 0
  }),
  getters: {
    doubleCount(state) {
      return state.count * 2
    },
    // 访问根状态
    sumWithRootCount(state, getters, rootState) {
      return state.count + rootState.count
    }
  },
  mutations: {
    increment(state) {
      state.count++
    }
  },
  actions: {
    // 上下文对象包含局部状态
    incrementIfOdd({ state, commit }) {
      if (state.count % 2 === 1) {
        commit('increment')
      }
    }
  }
}

const moduleB = {
  state: () => ({
    message: 'Hello'
  }),
  mutations: {
    updateMessage(state, message) {
      state.message = message
    }
  }
}

const store = new Vuex.Store({
  modules: {
    a: moduleA,
    b: moduleB
  }
})
```

### 命名空间

默认情况下，模块内部的 action、mutation 和 getter 是注册在全局命名空间的。

```javascript
const moduleA = {
  namespaced: true, // 启用命名空间
  state: () => ({ ... }),
  getters: {
    isAdmin() { ... } // -> getters['moduleA/isAdmin']
  },
  actions: {
    login() { ... } // -> dispatch('moduleA/login')
  },
  mutations: {
    login() { ... } // -> commit('moduleA/login')
  }
}

// 组件中使用命名空间
export default {
  computed: {
    ...mapState('moduleA', {
      a: state => state.a
    }),
    ...mapGetters('moduleA', ['isAdmin'])
  },
  methods: {
    ...mapActions('moduleA', ['login']),
    ...mapMutations('moduleA', ['login'])
  }
}
```

## 辅助函数

Vuex 提供了 mapState、mapGetters、mapActions、mapMutations 辅助函数。

```javascript
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'

export default {
  computed: {
    // 对象展开运算符混入
    ...mapState({
      count: state => state.count,
      // 传字符串参数等同于 state => state.count
      countAlias: 'count',
      // 使用函数访问局部状态
      countPlusLocalState(state) {
        return state.count + this.localCount
      }
    }),
    
    ...mapGetters([
      'doneTodosCount',
      'anotherGetter'
    ]),
    
    ...mapGetters({
      doneCount: 'doneTodosCount'
    })
  },
  
  methods: {
    ...mapActions([
      'increment', // 将 this.increment() 映射为 this.$store.dispatch('increment')
      'incrementBy'
    ]),
    
    ...mapActions({
      add: 'increment' // 将 this.add() 映射为 this.$store.dispatch('increment')
    }),
    
    ...mapMutations([
      'increment', // 将 this.increment() 映射为 this.$store.commit('increment')
      'incrementBy'
    ])
  }
}
```

## 插件开发

Vuex store 接受 plugins 选项，在每个 mutation 后调用。

```javascript
// 日志插件
const loggerPlugin = store => {
  store.subscribe((mutation, state) => {
    console.log('mutation:', mutation.type)
    console.log('payload:', mutation.payload)
    console.log('state:', state)
  })
}

// 持久化插件
const persistencePlugin = store => {
  // 从本地存储恢复状态
  const savedState = localStorage.getItem('vuex-state')
  if (savedState) {
    store.replaceState(JSON.parse(savedState))
  }
  
  // 订阅mutation，保存状态到本地存储
  store.subscribe((mutation, state) => {
    localStorage.setItem('vuex-state', JSON.stringify(state))
  })
}

const store = new Vuex.Store({
  plugins: [loggerPlugin, persistencePlugin]
})
```

## 严格模式

开启严格模式，在状态变更不是由 mutation 函数引起时抛出错误。

```javascript
const store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production'
})
```

严格模式限制：
```
不要在发布环境下启用严格模式
严格模式会深度监测状态树来检测不合规的状态变更
```

## 项目结构建议

```
src/
├── store/
│   ├── index.js          # 组装模块并导出store
│   ├── actions.js        # 根级别的action
│   ├── mutations.js      # 根级别的mutation
│   └── modules/
│       ├── user.js       # 用户模块
│       └── products.js   # 产品模块
└── components/
```

```javascript
// store/modules/user.js
export default {
  namespaced: true,
  state: () => ({
    profile: null,
    token: null
  }),
  mutations: {
    SET_PROFILE(state, profile) {
      state.profile = profile
    },
    SET_TOKEN(state, token) {
      state.token = token
    }
  },
  actions: {
    async login({ commit }, credentials) {
      const response = await api.login(credentials)
      commit('SET_TOKEN', response.token)
      commit('SET_PROFILE', response.user)
    },
    logout({ commit }) {
      commit('SET_TOKEN', null)
      commit('SET_PROFILE', null)
    }
  },
  getters: {
    isLoggedIn: state => !!state.token,
    userName: state => state.profile?.name
  }
}
```

## 测试策略

Vuex store 的单元测试：

```javascript
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import { cloneDeep } from 'lodash'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('user store module', () => {
  let store
  
  beforeEach(() => {
    const userModule = cloneDeep(require('@/store/modules/user').default)
    store = new Vuex.Store({
      modules: {
        user: userModule
      }
    })
  })
  
  it('should set token when login', async () => {
    await store.dispatch('user/login', {
      username: 'test',
      password: 'test'
    })
    
    expect(store.state.user.token).toBeTruthy()
  })
  
  it('should clear state when logout', () => {
    store.commit('user/SET_TOKEN', 'token')
    store.commit('user/SET_PROFILE', { name: 'Test User' })
    
    store.dispatch('user/logout')
    
    expect(store.state.user.token).toBeNull()
    expect(store.state.user.profile).toBeNull()
  })
})
```