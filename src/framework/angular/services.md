# Angular 服务与依赖注入

## 服务概念

服务是 Angular 应用中用于封装业务逻辑、数据访问和共享功能的可注入类。服务通过依赖注入系统提供给需要它们的组件。

示意图：
```
服务角色：
┌─────────────┐          ┌─────────────┐
│   组件       │ ────────> │    服务      │
│ (消费者)     │          │ (提供者)     │
└─────────────┘          └─────────────┘
     使用                      包含
                         ├─ 数据获取
                         ├─ 业务逻辑
                         └─ 工具函数
```

## 创建服务

### 服务定义
服务是普通的 TypeScript 类，通过 `@Injectable` 装饰器标记为可注入。

示意图：
```
服务结构：
┌─────────────────────┐
│   @Injectable()     │
│   export class      │
│     DataService {   │
│                     │
│   getData() { ... } │
│   updateData() { ...}│
│   }                 │
└─────────────────────┘
```

示例代码：
```typescript
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private users: User[] = [];

  getUsers(): User[] {
    return this.users;
  }

  addUser(user: User): void {
    this.users.push(user);
  }
}
```

## 依赖注入基础

### 注入机制
依赖注入是一种设计模式，Angular 的注入器负责创建和管理服务实例。

示意图：
```
依赖注入流程：
组件声明依赖 → 注入器查找服务 → 提供实例 → 组件使用

示例：
组件构造函数: constructor(private userService: UserService)
注入器: 找到 UserService → 创建/返回实例 → 注入组件
```

### 注入方式
服务可以通过构造函数注入到组件、指令或其他服务中。

示意图：
```
构造函数注入：
┌─────────────────┐   依赖声明    ┌─────────────────┐
│   组件类         │ ───────────> │    服务类        │
│                 │              │                 │
│ constructor(    │              │                 │
│   private service: Service     │
│ ) {}            │              │                 │
└─────────────────┘              └─────────────────┘
```

## 服务提供

### 提供者配置
服务需要在 Angular 的依赖注入系统中注册，指定如何创建服务实例。

示意图：
```
提供者位置：
├── 根注入器 (providedIn: 'root')
├── 模块级别 (@NgModule providers)
└── 组件级别 (@Component providers)
```

配置示例：
```typescript
// 根级别提供
@Injectable({
  providedIn: 'root'
})

// 模块级别提供
@NgModule({
  providers: [UserService]
})

// 组件级别提供
@Component({
  providers: [UserService]
})
```

### 作用域控制
通过不同的提供方式控制服务的生命周期和实例范围。

示意图：
```
服务作用域：
根注入器服务 → 全局单例
        ┌──────────────┐
        │  根注入器     │
        │  服务实例     │
        └──────────────┘
             ↑ 共享
┌─────────────┐  ┌─────────────┐
│  组件A       │  │  组件B       │
└─────────────┘  └─────────────┘

组件级服务 → 每个组件实例独立
┌─────────────┐  ┌─────────────┐
│  组件A       │  │  组件B       │
│  服务实例1    │  │  服务实例2    │
└─────────────┘  └─────────────┘
```

## 注入器层次

### 注入器树
Angular 应用形成注入器的层次结构，支持逐级查找依赖。

示意图：
```
注入器层次：
        根注入器 (Root Injector)
           /        \
          /          \
  模块注入器      组件注入器
 (Module)        (Component)
                   /    \
                  /      \
            子组件注入器  子组件注入器
```

### 查找规则
当组件请求服务时，注入器按照特定顺序查找。

示意图：
```
服务查找路径：
组件注入器 → 父组件注入器 → ... → 根注入器

示例：
组件请求 UserService
1. 检查组件自身的providers
2. 检查父组件的providers
3. 检查模块的providers
4. 检查根注入器
```

## 服务使用场景

### 数据服务
封装数据获取和操作逻辑，供多个组件共享。

示意图：
```
数据服务模式：
┌─────────────┐    HTTP请求    ┌─────────────┐
│   组件       │ ────────────> │  数据服务    │ ────> 后端API
│             │               │             │
│ 显示数据     │ <──────────── │  缓存数据    │
└─────────────┘   返回数据     └─────────────┘
```

### 共享状态服务
在组件之间共享状态和数据。

示意图：
```
状态共享：
        ┌─────────────┐
        │  状态服务    │
        │  (数据总线)  │
        └─────────────┘
           /    |    \
          /     |     \
         /      |      \
┌─────────┐ ┌─────────┐ ┌─────────┐
│ 组件A    │ │ 组件B    │ │ 组件C    │
│         │ │         │ │         │
│ 读取状态 │ │ 修改状态 │ │ 监听变化 │
└─────────┘ └─────────┘ └─────────┘
```

### 工具服务
提供通用的工具函数和功能。

示意图：
```
工具服务：
┌─────────────────┐
│   工具服务       │
├─────────────────┤
│ 日志记录         │
│ 本地存储         │
│ 格式转换         │
│ 验证工具         │
└─────────────────┘
     ↑       ↑
   组件A    组件B
```

## 高级注入特性

### 可选依赖
使用 `@Optional` 装饰器声明可选的依赖。

示意图：
```
可选依赖：
组件请求服务 → 如果服务不存在 → 不报错，注入null

示例：
constructor(@Optional() private logger: LoggerService) {
  if (this.logger) {
    this.logger.log('组件创建');
  }
}
```

### 注入令牌
使用 InjectionToken 提供非类依赖的注入。

示意图：
```
非类依赖：
创建令牌 → 提供值 → 注入使用

示例：
export const API_URL = new InjectionToken<string>('api.url');

providers: [{ provide: API_URL, useValue: 'https://api.example.com' }]

constructor(@Inject(API_URL) private apiUrl: string) {}
```

### 工厂提供者
使用工厂函数动态创建服务实例。

示意图：
```
工厂提供者：
依赖配置 → 工厂函数 → 返回服务实例

示例：
providers: [
  {
    provide: UserService,
    useFactory: (config: ConfigService) => {
      return config.isProd ? new ProductionUserService() : new MockUserService();
    },
    deps: [ConfigService]
  }
]
```

## 服务测试

### 测试依赖注入
在测试中模拟服务依赖，隔离测试组件。

示意图：
```
测试配置：
TestBed配置 → 模拟服务 → 注入测试

示例：
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      ComponentUnderTest,
      { provide: UserService, useClass: MockUserService }
    ]
  });
});
```