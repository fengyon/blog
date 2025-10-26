# React 状态管理方案大全

## 1. 内置状态管理

### useState

**常用 API：**

- `useState(initialValue)`
- `setState(newValue)`
- `setState(prev => prev + 1)`

```jsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  const [user, setUser] = useState({ name: '', age: 0 })

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount((prev) => prev - 1)}>
        Decrement
      </button>

      <input
        value={user.name}
        onChange={(e) => setUser({ ...user, name: e.target.value })}
      />
    </div>
  )
}
```

### useReducer

**常用 API：**

- `useReducer(reducer, initialState)`
- `dispatch(action)`

```jsx
import { useReducer } from 'react'

const initialState = { count: 0 }

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 }
    case 'decrement':
      return { count: state.count - 1 }
    case 'reset':
      return initialState
    default:
      return state
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+1</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-1</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </div>
  )
}
```

## 2. 上下文 API

### React Context

**常用 API：**

- `createContext(defaultValue)`
- `Context.Provider`
- `useContext(Context)`

```jsx
import { createContext, useContext, useState } from 'react'

const UserContext = createContext()

function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState('light')

  const value = {
    user,
    setUser,
    theme,
    setTheme,
    login: (userData) => setUser(userData),
    logout: () => setUser(null),
  }

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  )
}

function UserProfile() {
  const { user, theme, logout } = useContext(UserContext)

  return (
    <div className={theme}>
      <h3>User: {user?.name}</h3>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

function App() {
  return (
    <UserProvider>
      <UserProfile />
    </UserProvider>
  )
}
```

## 3. 第三方状态管理库

### Redux Toolkit

**常用 API：**

- `configureStore()`
- `createSlice()`
- `useSelector()`
- `useDispatch()`

```jsx
import { configureStore, createSlice } from '@reduxjs/toolkit'
import { useSelector, useDispatch, Provider } from 'react-redux'

// Slice
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1
    },
    decrement: (state) => {
      state.value -= 1
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload
    },
  },
})

// Store
const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
})

// Components
function Counter() {
  const count = useSelector((state) => state.counter.value)
  const dispatch = useDispatch()

  return (
    <div>
      <span>{count}</span>
      <button onClick={() => dispatch(counterSlice.actions.increment())}>
        +1
      </button>
      <button onClick={() => dispatch(counterSlice.actions.decrement())}>
        -1
      </button>
    </div>
  )
}

function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  )
}

export const { increment, decrement } = counterSlice.actions
```

### Zustand

**常用 API：**

- `create((set, get) => ({ ... }))`
- `useStore(state => state.value)`
- `useStore.getState()`

```jsx
import { create } from 'zustand'

const useStore = create((set, get) => ({
  count: 0,
  user: null,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
  // 访问当前状态
  doubleCount: () => {
    const currentCount = get().count
    set({ count: currentCount * 2 })
  },
  setUser: (user) => set({ user }),
}))

function Counter() {
  const { count, increment, decrement, doubleCount } = useStore()

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+1</button>
      <button onClick={decrement}>-1</button>
      <button onClick={doubleCount}>Double</button>
    </div>
  )
}

function UserInfo() {
  const user = useStore((state) => state.user)
  const setUser = useStore((state) => state.setUser)

  return (
    <div>
      <button onClick={() => setUser({ name: 'John' })}>Set User</button>
      <p>User: {user?.name}</p>
    </div>
  )
}
```

### Jotai

**常用 API：**

- `atom(initialValue)`
- `useAtom(atom)`
- `useAtomValue(atom)`
- `useSetAtom(atom)`

```jsx
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'

// 基础atom
const countAtom = atom(0)
const userAtom = atom(null)

// 派生atom
const doubledCountAtom = atom((get) => get(countAtom) * 2)
const countPlusAtom = atom((get) => get(countAtom) + 1)

// 可写派生atom
const incrementCountAtom = atom(
  (get) => get(countAtom),
  (get, set, _arg) => set(countAtom, get(countAtom) + 1),
)

function Counter() {
  const [count, setCount] = useAtom(countAtom)
  const doubledCount = useAtomValue(doubledCountAtom)
  const increment = useSetAtom(incrementCountAtom)

  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubledCount}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={increment}>Increment</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}

function UserInfo() {
  const [user, setUser] = useAtom(userAtom)

  return (
    <div>
      <button onClick={() => setUser({ name: 'Alice' })}>Set User</button>
      <p>User: {user?.name}</p>
    </div>
  )
}
```

### Recoil

**常用 API：**

- `atom()`
- `selector()`
- `useRecoilState()`
- `useRecoilValue()`
- `useSetRecoilState()`

```jsx
import {
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
  RecoilRoot,
} from 'recoil'

const countState = atom({
  key: 'countState',
  default: 0,
})

const doubledCountState = selector({
  key: 'doubledCountState',
  get: ({ get }) => get(countState) * 2,
})

const userState = atom({
  key: 'userState',
  default: null,
})

function Counter() {
  const [count, setCount] = useRecoilState(countState)
  const doubledCount = useRecoilValue(doubledCountState)

  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubledCount}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(count - 1)}>-1</button>
    </div>
  )
}

function App() {
  return (
    <RecoilRoot>
      <Counter />
    </RecoilRoot>
  )
}
```

### MobX

**常用 API：**

- `makeAutoObservable()`
- `makeObservable()`
- `observer()`
- `useObserver()`

```jsx
import { makeAutoObservable } from 'mobx'
import { observer } from 'mobx-react-lite'
import { createContext, useContext } from 'react'

class CounterStore {
  count = 0
  user = null

  constructor() {
    makeAutoObservable(this)
  }

  increment() {
    this.count += 1
  }

  decrement() {
    this.count -= 1
  }

  reset() {
    this.count = 0
  }

  setUser(user) {
    this.user = user
  }

  get doubled() {
    return this.count * 2
  }
}

const CounterContext = createContext()

function Counter() {
  const counterStore = useContext(CounterContext)

  return (
    <div>
      <p>Count: {counterStore.count}</p>
      <p>Doubled: {counterStore.doubled}</p>
      <button onClick={() => counterStore.increment()}>+1</button>
      <button onClick={() => counterStore.decrement()}>-1</button>
      <button onClick={() => counterStore.reset()}>Reset</button>
    </div>
  )
}

// 使用 observer 包装组件
const ObservableCounter = observer(Counter)

function App() {
  const store = new CounterStore()

  return (
    <CounterContext.Provider value={store}>
      <ObservableCounter />
    </CounterContext.Provider>
  )
}
```

### Valtio

**常用 API：**

- `proxy()`
- `useSnapshot()`
- `subscribe()`

```jsx
import { proxy, useSnapshot, subscribe } from 'valtio'

const state = proxy({
  count: 0,
  user: null,
  get doubled() {
    return this.count * 2
  },
})

// 在组件外修改状态
state.increment = () => {
  state.count += 1
}

state.decrement = () => {
  state.count -= 1
}

state.setUser = (user) => {
  state.user = user
}

function Counter() {
  const snap = useSnapshot(state)

  return (
    <div>
      <p>Count: {snap.count}</p>
      <p>Doubled: {snap.doubled}</p>
      <button onClick={state.increment}>+1</button>
      <button onClick={state.decrement}>-1</button>
      <button onClick={() => (state.count = 0)}>Reset</button>
    </div>
  )
}

// 订阅状态变化
subscribe(state, () => {
  console.log('State changed:', state.count)
})
```

## 4. 服务端状态管理

### React Query / TanStack Query

**常用 API：**

- `useQuery()`
- `useMutation()`
- `useQueryClient()`
- `QueryClientProvider`

```jsx
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

const queryClient = new QueryClient()

function fetchUsers() {
  return fetch('/api/users').then((res) => res.json())
}

function addUser(user) {
  return fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(user),
  }).then((res) => res.json())
}

function Users() {
  const queryClient = useQueryClient()

  // 查询
  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  // 突变
  const mutation = useMutation({
    mutationFn: addUser,
    onSuccess: () => {
      // 使查询失效并重新获取
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <ul>
        {users?.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
      <button
        onClick={() => mutation.mutate({ name: 'New User' })}
        disabled={mutation.isLoading}
      >
        Add User
      </button>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Users />
    </QueryClientProvider>
  )
}
```

### SWR

**常用 API：**

- `useSWR()`
- `mutate()`
- `useSWRConfig()`

```jsx
import useSWR, { useSWRConfig } from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

function Profile() {
  const { mutate } = useSWRConfig()

  const { data, error, isLoading } = useSWR('/api/user', fetcher, {
    refreshInterval: 3000, // 每3秒刷新
    revalidateOnFocus: true, // 窗口聚焦时重新验证
  })

  const handleUpdate = async () => {
    // 乐观更新
    mutate('/api/user', { ...data, name: 'New Name' }, false)

    // 实际更新
    await fetch('/api/user', {
      method: 'PUT',
      body: JSON.stringify({ name: 'New Name' }),
    })

    // 重新验证
    mutate('/api/user')
  }

  if (error) return <div>Failed to load</div>
  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1>Hello {data.name}!</h1>
      <button onClick={handleUpdate}>Update Name</button>
    </div>
  )
}
```

## 5. 表单状态管理

### React Hook Form

**常用 API：**

- `useForm()`
- `register()`
- `handleSubmit()`
- `watch()`
- `formState`

```jsx
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18),
})

function UserForm() {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      age: 18,
    },
  })

  const onSubmit = async (data) => {
    console.log(data)
    // 提交逻辑
  }

  // 监听字段变化
  const name = watch('name')

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register('name')} placeholder="Name" />
        {errors.name && <span>{errors.name.message}</span>}
      </div>

      <div>
        <input {...register('email')} placeholder="Email" />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div>
        <Controller
          name="age"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="number"
              onChange={(e) => field.onChange(parseInt(e.target.value))}
            />
          )}
        />
        {errors.age && <span>{errors.age.message}</span>}
      </div>

      <p>Watched name: {name}</p>

      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
    </form>
  )
}
```

### Formik

**常用 API：**

- `useFormik()`
- `Formik`组件
- `Field`组件
- `ErrorMessage`组件

```jsx
import { useFormik } from 'formik'

function UserForm() {
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      age: '',
    },
    onSubmit: (values) => {
      console.log(values)
    },
    validate: (values) => {
      const errors = {}
      if (!values.name) errors.name = 'Required'
      if (!values.email) errors.email = 'Required'
      return errors
    },
  })

  return (
    <form onSubmit={formik.handleSubmit}>
      <div>
        <input
          name="name"
          type="text"
          onChange={formik.handleChange}
          value={formik.values.name}
          placeholder="Name"
        />
        {formik.errors.name && formik.touched.name && (
          <div>{formik.errors.name}</div>
        )}
      </div>

      <div>
        <input
          name="email"
          type="email"
          onChange={formik.handleChange}
          value={formik.values.email}
          placeholder="Email"
        />
        {formik.errors.email && formik.touched.email && (
          <div>{formik.errors.email}</div>
        )}
      </div>

      <button type="submit">Submit</button>
    </form>
  )
}
```

## 选择指南

| 场景         | 推荐方案               | 理由                    |
| ------------ | ---------------------- | ----------------------- |
| 简单组件状态 | `useState`             | 内置，简单直接          |
| 复杂状态逻辑 | `useReducer`           | 类似 Redux 模式，可预测 |
| 跨组件共享   | `Context + useReducer` | 内置解决方案            |
| 大型企业应用 | `Redux Toolkit`        | 完善的工具链和中间件    |
| 轻量级需求   | `Zustand`              | API 简单，无样板代码    |
| 原子化状态   | `Jotai`                | React 风格，自动优化    |
| 服务端状态   | `React Query`          | 专业的数据获取和缓存    |
| 表单处理     | `React Hook Form`      | 高性能，优秀的验证支持  |
