# umijs 状态管理

UmiJS 提供了多层次的状态管理方案，从简单的组件状态到复杂的全局数据流，满足不同场景的需求。掌握这些状态管理工具能够帮助开发者构建更健壮、可维护的 React 应用。

## 状态管理全景图

在 UmiJS 生态中，状态管理可以分为四个层次：

```
┌────────────────────────────────────────────┐
│ 🌐 应用启动层（Umi 专用）                  │
│────────────────────────────────────────────│
│ 【initialState / setInitialState】         │
│ - 用于存放全局初始化数据（用户信息、配置） │
│ - 来源：Umi runtime 插件（getInitialState）│
│ - 生命周期：应用启动 → 全局共享           │
│ - 更新方式：setInitialState()             │
│ - 特征：一次加载、全局可读、适合初始化数据 │
└────────────────────────────────────────────┘
│
▼
┌────────────────────────────────────────────┐
│ ⚙️ 业务逻辑层（响应式全局状态）            │
│────────────────────────────────────────────│
│ 【valtio】                                 │
│ - Proxy 实现响应式，组件自动更新           │
│ - 无需 dispatch，直接修改对象即可          │
│ - 生命周期：全局可持久，组件卸载不丢状态   │
│ - 特征：轻量、自然、响应式、高性能         │
│ - 用途：共享 UI 状态、缓存、表格筛选等     │
└────────────────────────────────────────────┘
│
▼
┌────────────────────────────────────────────┐
│ 🧩 组件局部状态层（React 原生）            │
│────────────────────────────────────────────│
│ 【useState / useReducer】                  │
│ - React 内置 hooks                         │
│ - 生命周期：组件内存活，组件卸载即销毁     │
│ - 特征：轻量、简洁、局部性强               │
│ - 用途：按钮状态、输入框值、弹窗开关等     │
└────────────────────────────────────────────┘
▲
│
│
┌────────────────────────────────────────────┐
│ 🏗️ 传统集中式状态层（Redux / Dva）        │
│────────────────────────────────────────────│
│ 【redux / dva】                            │
│ - 需要 dispatch + reducer 机制             │
│ - 状态集中存储，全局单一 Store             │
│ - 生命周期：全局，手动管理更新逻辑         │
│ - 特征：结构化、可追踪、适合复杂业务流     │
│ - 用途：大型项目、复杂异步逻辑、数据流管理 │
└────────────────────────────────────────────┘
```

## 应用初始化状态

### 初始化状态设置

UmiJS 通过 `@umijs/plugin-initial-state` 插件提供应用初始化数据管理。在 `src/app.ts` 中导出 `getInitialState` 方法：

```typescript
// src/app.ts
export async function getInitialState() {
  const data = await fetchXXX();
  return data;
}
```

该配置是一个 async 的 function，会在整个应用最开始执行，返回值会作为全局共享的数据。

### 使用初始化状态

通过 `useModel` 钩子获取初始状态：

```jsx
import { useModel } from 'umi';

export default () => {
  const { initialState, loading, error, refresh, setInitialState } = 
    useModel('@@initialState');
  
  if (loading) return <div>加载中...</div>;
  if (error) return <div>加载失败</div>;
  
  return <div>初始数据：{initialState}</div>;
};
```

**可用属性：**
- `initialState`：getInitialState 的返回值
- `loading`：获取状态是否正在进行中
- `error`：获取过程中出现的错误
- `refresh`：重新执行 getInitialState
- `setInitialState`：手动设置 initialState 的值

## 简易数据管理方案

### Plugin-model 基础

`@umijs/plugin-model` 是一种基于 hooks 范式的简易数据管理方案，通常用于中台项目的全局共享数据。

在 `src/models` 目录下创建 model 文件：

```javascript
// src/models/useAuthModel.js
import { useState, useCallback } from 'react';

export default function useAuthModel() {
  const [user, setUser] = useState(null);
  
  const signin = useCallback((account, password) => {
    // signin implementation
    // setUser(user from signin API)
  }, []);
  
  const signout = useCallback(() => {
    // signout implementation
    // setUser(null)
  }, []);
  
  return {
    user,
    signin,
    signout
  };
}
```

### 在组件中使用 Model

```jsx
import { useModel } from 'umi';

export default () => {
  const { user, signin } = useModel('useAuthModel');
  
  return (
    <div>
      当前用户：{user?.name}
      <button onClick={() => signin('account', 'password')}>
        登录
      </button>
    </div>
  );
};
```

## 基于 Dva 的复杂状态管理

### Dva Model 结构

对于复杂的数据流场景，UmiJS 内置了 Dva 状态管理框架。在 `src/models` 目录下创建符合 Dva 规范的文件：

```javascript
// src/models/users.js
import { apiUserList } from '@/services/user';

export default {
  namespace: 'users',
  
  state: {
    list: [],
    currentUser: null,
  },
  
  effects: {
    *fetchUserList({ payload }, { call, put }) {
      const response = yield call(apiUserList, payload);
      yield put({ 
        type: 'setUserList', 
        payload: response 
      });
    },
  },
  
  reducers: {
    setUserList(state, { payload }) {
      return {
        ...state,
        list: payload,
      };
    },
  },
};
```

**Model 核心概念：**
- `namespace`：模型的命名空间，用于区分不同模型
- `state`：初始状态值
- `effects`：处理异步操作和业务逻辑
- `reducers`：处理同步操作，更新 state

### 在组件中使用 Dva

#### 函数组件用法

```jsx
import React from 'react';
import { connect } from 'dva';

const Users = ({ dispatch, userList, loading }) => {
  const fetchUsers = () => {
    dispatch({
      type: 'users/fetchUserList',
      payload: { page: 1, size: 10 },
    });
  };

  return (
    <div>
      <button onClick={fetchUsers} disabled={loading}>
        {loading ? '加载中...' : '获取用户列表'}
      </button>
      <div>
        {userList.map(user => (
          <div key={user.id}>{user.name}</div>
        ))}
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    userList: state.users.list,
    loading: state.loading.models.users,
  };
};

export default connect(mapStateToProps)(Users);
```

#### Hooks 用法

```jsx
import { useSelector, useDispatch } from 'umi';

export default function UsersPage() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(state => state.users);
  
  const handleAddUser = () => {
    dispatch({
      type: 'users/addUser',
      payload: { name: '新用户' },
    });
  };
  
  return (
    // JSX 内容
  );
}
```

## 异步数据管理

### useAPI Hook

`@umijs/use-api` 是一个生产就绪的 React Hooks 库，用于管理异步数据。

```javascript
import useAPI from '@umijs/use-api';

export default () => {
  const { data, error, loading } = useAPI(getUserInfo);

  if (error) return <div>加载失败</div>;
  if (loading) return <div>加载中...</div>;
  return <div>你好 {data.username}!</div>;
};
```

### 高级异步功能

#### 手动触发请求

```javascript
const { loading, run } = useAPI(changeUsername, {
  manual: true,
});

<button onClick={() => run('new name')}>
  {loading ? '修改中...' : '修改'}
</button>
```

#### 轮询请求

```javascript
const { data, loading } = useAPI(getUserInfo, {
  pollingInterval: 1000,
  pollingWhenHidden: false,
});
```

#### 缓存和 SWR

```javascript
const { data, loading } = useAPI(getInfo, {
  cacheKey: 'getInfoKey',
});
```

## 权限状态管理

### 权限定义

UmiJS 通过 `@umijs/plugin-access` 提供权限管理能力，结合初始化状态实现路由和组件级权限控制。

在 `src/access.ts` 中定义权限：

```typescript
// src/access.ts
export default function (initialState) {
  const { currentUser } = initialState || {};
  
  return {
    canReadAdmin: currentUser && currentUser.isAdmin,
    canUpdateUser: (userId) => {
      return currentUser && currentUser.id === userId;
    },
  };
}
```

### 组件内权限控制

```jsx
import React from 'react';
import { useAccess, Access } from 'umi';

const PageA = () => {
  const access = useAccess();
  
  return (
    <div>
      <Access 
        accessible={access.canReadAdmin} 
        fallback={<div>无管理员权限</div>}
      >
        <AdminPanel />
      </Access>
      
      <Access 
        accessible={access.canUpdateUser(123)} 
        fallback={<div>无法更新该用户</div>}
      >
        <UserEditor />
      </Access>
    </div>
  );
};
```

### 路由权限控制

在路由配置中集成权限控制：

```javascript
// config/config.ts
export default {
  routes: [
    {
      path: '/admin',
      component: '@/pages/Admin',
      access: 'canReadAdmin',
    },
    {
      path: '/user/:id/edit',
      component: '@/pages/UserEdit',
      access: 'canUpdateUser',
    },
  ],
};
```

## 状态管理最佳实践

### 状态分类与选型

| 场景 | 推荐方案 | 理由 |
|------|----------|------|
| 登录后保存用户信息 | initialState | 应用启动时加载，全局共享 |
| 全局主题/布局状态 | valtio | 响应式更新，使用简单 |
| 页面内筛选条件/表格缓存 | valtio | 组件间共享，性能优化 |
| Modal/输入框状态 | useState | 局部状态，简单直接 |
| 多模块异步数据、复杂流转 | redux/dva | 结构化，可追踪 |

### 性能优化

#### 不可变更新

```javascript
// 不推荐 - 直接修改
state.list.push(newItem);

// 推荐 - 不可变更新
return {
  ...state,
  list: [...state.list, newItem],
};

// 使用 immer 优化复杂更新
import produce from 'immer';

const noticeReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'notice/readed':
      return produce(state, (draft) => {
        const index = action.payload;
        draft.list[index].read = true;
      });
    default:
      return state;
  }
};
```

#### 精细化订阅

```jsx
// 不推荐 - 订阅整个 state
const { user, settings, notifications } = useModel('userModel');

// 推荐 - 只订阅需要的状态
const { user } = useModel('userModel', model => ({
  user: model.user,
}));
```

### 数据流架构

在复杂应用中，推荐采用分层的数据流架构：

```
组件层 → Hooks层 → Model层 → 服务层
```

**各层职责：**
- 组件层：负责 UI 渲染和用户交互
- Hooks 层：封装业务逻辑和状态更新
- Model 层：管理全局状态和数据流
- 服务层：处理数据获取和持久化

通过合理运用 UmiJS 提供的各种状态管理方案，可以构建出既灵活又可维护的前端应用架构。