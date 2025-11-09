# Angular HTTP

## HTTP 客户端概述

Angular 提供了 HttpClient 服务用于与后端 API 进行 HTTP 通信，支持请求发送、响应处理、错误管理和拦截器等功能。

示意图：
```
HTTP 通信流程：
Angular应用 → HttpClient → HTTP请求 → 后端API
Angular应用 ← HttpClient ← HTTP响应 ← 后端API
```

## HttpClient 基础

### 模块配置
在使用 HttpClient 前需要导入 HttpClientModule。

示意图：
```
模块配置：
AppModule
├── imports: [HttpClientModule]
└── 组件/服务中注入 HttpClient

使用流程：
导入模块 → 注入服务 → 发送请求
```

### 基本请求
HttpClient 支持多种 HTTP 方法。

示意图：
```
请求方法：
GET    - 获取数据
POST   - 创建数据  
PUT    - 更新数据
DELETE - 删除数据
PATCH  - 部分更新

示例：
http.get(url)     → 获取资源
http.post(url, data) → 创建资源
http.put(url, data)  → 更新资源
http.delete(url)   → 删除资源
```

## 请求发送

### GET 请求
从服务器获取数据。

示意图：
```
GET 请求流程：
组件/服务 → http.get() → 服务器 → 返回数据

示例：
this.http.get<User[]>('/api/users')
  .subscribe(users => {
    this.users = users;
  });
```

### POST 请求
向服务器发送数据创建新资源。

示意图：
```
POST 请求流程：
准备数据 → http.post() → 服务器 → 返回创建结果

示例：
const user = { name: 'John', email: 'john@example.com' };
this.http.post<User>('/api/users', user)
  .subscribe(newUser => {
    this.users.push(newUser);
  });
```

### 请求配置
通过配置对象定制请求行为。

示意图：
```
请求配置选项：
{
  headers: HttpHeaders,    // 请求头
  params: HttpParams,      // 查询参数
  observe: 'response',     // 观察完整响应
  responseType: 'json'     // 响应类型
}
```

## 响应处理

### RxJS 观察者模式
HttpClient 返回 Observable，使用订阅模式处理响应。

示意图：
```
Observable 流：
http请求 → Observable → 订阅处理

订阅方法：
.subscribe(
  data => { /* 成功处理 */ },
  error => { /* 错误处理 */ },
  () => { /* 完成处理 */ }
)
```

### 响应类型
指定期望的响应数据类型，获得 TypeScript 类型检查。

示意图：
```
类型安全响应：
this.http.get<User[]>('/api/users')
           ↑ 类型参数
响应自动转换为 User[] 类型

好处：
- 编译时类型检查
- 智能提示支持
- 减少运行时错误
```

## 错误处理

### 错误捕获
使用 catchError 操作符捕获和处理 HTTP 错误。

示意图：
```
错误处理流程：
请求 → 可能失败 → 错误捕获 → 优雅处理

示例：
this.http.get('/api/data').pipe(
  catchError(error => {
    console.error('请求失败:', error);
    return of([]); // 返回默认值
  })
)
```

### HTTP 错误状态
根据不同的 HTTP 状态码进行针对性处理。

示意图：
```
常见HTTP状态码：
200 - 成功
400 - 客户端错误
401 - 未授权  
404 - 未找到
500 - 服务器错误

处理策略：
4xx错误 → 用户操作问题 → 提示用户
5xx错误 → 服务器问题 → 重试或报错
```

## 高级特性

### 请求拦截器
在请求发送前或响应接收后插入处理逻辑。

示意图：
```
拦截器链：
请求 → 拦截器A → 拦截器B → 服务器
响应 ← 拦截器B ← 拦截器A ← 服务器

拦截器用途：
- 添加认证头
- 记录日志
- 错误统一处理
- 请求/响应转换
```

### 响应拦截器
处理服务器返回的响应数据。

示意图：
```
响应处理：
原始响应 → 拦截器转换 → 组件使用

示例：
拦截器统一提取 data 字段：
原始响应: { data: [...], status: 200 }
转换后: [...]
```

## 实战示例

### 服务封装
将 HTTP 操作封装在服务中，实现关注点分离。

示意图：
```
服务封装结构：
┌─────────────────┐    HTTP调用    ┌─────────────────┐
│   组件          │ ────────────> │  数据服务        │ ───> API
│  - 展示逻辑     │               │  - 数据获取      │
│  - 用户交互     │ <──────────── │  - 数据处理      │
└─────────────────┘   数据返回     └─────────────────┘
```

示例服务：
```typescript
@Injectable()
export class UserService {
  constructor(private http: HttpClient) {}
  
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }
  
  createUser(user: User): Observable<User> {
    return this.http.post<User>('/api/users', user);
  }
}
```

### 数据转换
使用 RxJS 操作符转换响应数据。

示意图：
```
数据转换流：
原始数据 → map转换 → filter过滤 → 最终数据

示例：
this.http.get<User[]>('/api/users').pipe(
  map(users => users.filter(user => user.active)),
  map(users => users.map(user => ({ ...user, name: user.name.toUpperCase() })))
)
```

## 性能优化

### 请求取消
通过取消订阅来取消未完成的 HTTP 请求。

示意图：
```
请求生命周期：
订阅开始 → 请求发送 → 取消订阅 → 请求中止

示例：
private subscription: Subscription;

this.subscription = this.http.get('/api/data').subscribe();

// 组件销毁时取消请求
ngOnDestroy() {
  this.subscription.unsubscribe();
}
```

### 请求重试
对失败的请求进行自动重试。

示意图：
```
重试机制：
请求失败 → 等待延迟 → 重新尝试 → 最多N次

示例：
this.http.get('/api/data').pipe(
  retry(3) // 最多重试3次
)
```

## 最佳实践

### 错误处理策略
统一的错误处理方案。

示意图：
```
错误处理层次：
┌─────────────────┐
│   全局错误处理   │ ← 应用级错误监控
├─────────────────┤
│   服务级错误处理 │ ← 业务逻辑错误处理
├─────────────────┤
│   组件级错误处理 │ ← 用户界面错误提示
└─────────────────┘
```

### 类型安全
充分利用 TypeScript 的类型系统。

示意图：
```
类型安全实践：
定义接口 → 指定类型 → 编译检查

示例：
export interface User {
  id: number;
  name: string;
  email: string;
}

this.http.get<User[]>('/api/users') // 返回 User[] 类型
```

## 测试策略

### HTTP 测试
使用 HttpClientTestingModule 测试 HTTP 请求。

示意图：
```
测试设置：
TestBed配置 → 模拟后端 → 验证请求

示例：
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [HttpClientTestingModule]
  });
});

it('应该获取用户', () => {
  const req = httpMock.expectOne('/api/users');
  expect(req.request.method).toBe('GET');
  req.flush(mockUsers);
});
```

## 安全考虑

### 安全实践
保护应用免受常见 Web 安全威胁。

示意图：
```
安全措施：
├── 输入验证
├── CSRF 防护
├── XSS 预防
├── 认证头管理
└── HTTPS 强制
```