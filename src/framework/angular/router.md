# Angular Router

## 路由概念

Angular Router 是一个强大的客户端路由库，用于在单页应用中实现导航和视图管理，让应用具有多页应用的体验而无需重新加载页面。

示意图：
```
路由功能：
URL变化 → 路由匹配 → 组件加载 → 视图更新

传统多页应用：        Angular单页应用：
页面A → 重新加载       视图A → 路由切换 → 视图B
    ↘ 页面B                   ↘ 无重新加载
```

## 路由基础

### 路由配置
通过 Routes 数组定义应用的路由结构。

示意图：
```
路由配置结构：
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'products', component: ProductsComponent }
];
```

### 路由出口
RouterOutlet 指令作为组件加载的占位符。

示意图：
```
模板结构：
<app-header></app-header>
<router-outlet></router-outlet>
<app-footer></app-footer>

路由匹配：
URL: /about → AboutComponent 显示在 router-outlet 位置
```

## 路由配置详解

### 基本路由
定义路径与组件的映射关系。

示意图：
```
路径映射：
路径 '' → HomeComponent
路径 'about' → AboutComponent  
路径 'contact' → ContactComponent
```

### 重定向路由
将某个路径自动重定向到另一个路径。

示意图：
```
重定向配置：
{ path: '', redirectTo: '/home', pathMatch: 'full' }

访问流程：
用户访问 '' → 重定向到 '/home' → 显示 HomeComponent
```

### 通配符路由
处理未匹配路径的 404 页面。

示意图：
```
通配符路由：
{ path: '**', component: PageNotFoundComponent }

匹配规则：
/user/profile → 用户路由
/about → 关于路由  
/unknown → 无匹配 → ** 通配 → 404页面
```

## 路由导航

### 声明式导航
使用 routerLink 指令在模板中创建导航链接。

示意图：
```
模板导航：
<nav>
  <a routerLink="/home">首页</a>
  <a routerLink="/about">关于</a>
  <a [routerLink]="['/products', productId]">产品详情</a>
</nav>
```

### 命令式导航
在组件类中使用 Router 服务进行编程式导航。

示意图：
```
编程导航：
组件中注入Router → 调用导航方法

示例：
constructor(private router: Router) {}

navigateToAbout() {
  this.router.navigate(['/about']);
}

navigateWithParams() {
  this.router.navigate(['/products', id]);
}
```

## 路由参数

### 路径参数
在路径中传递参数，用于详情页面等场景。

示意图：
```
路径参数：
路径: 'products/:id'
URL: /products/123 → 参数: { id: '123' }

配置:
{ path: 'products/:id', component: ProductDetailComponent }

获取参数:
this.route.params.subscribe(params => {
  const id = params['id'];
});
```

### 查询参数
在 URL 问号后传递可选参数。

示意图：
```
查询参数：
URL: /products?category=electronics&page=2
参数: { category: 'electronics', page: '2' }

导航方式：
this.router.navigate(['/products'], { 
  queryParams: { category: 'electronics', page: 2 }
});

获取参数：
this.route.queryParams.subscribe(params => {
  const category = params['category'];
});
```

## 嵌套路由

### 子路由配置
在父路由中定义子路由，创建复杂的页面布局。

示意图：
```
嵌套路由结构：
父路由: /admin
├── 子路由: '' → AdminDashboardComponent
├── 子路由: 'users' → UserListComponent  
└── 子路由: 'settings' → SettingsComponent

配置：
{
  path: 'admin',
  component: AdminComponent,
  children: [
    { path: '', component: AdminDashboardComponent },
    { path: 'users', component: UserListComponent },
    { path: 'settings', component: SettingsComponent }
  ]
}
```

### 嵌套路由出口
在父组件模板中定义子路由出口。

示意图：
```
父组件模板：
<h2>管理后台</h2>
<nav>
  <a routerLink="/admin">仪表板</a>
  <a routerLink="/admin/users">用户管理</a>
</nav>
<router-outlet></router-outlet> ← 子组件在这里显示
```

## 路由守卫

### 守卫类型
控制路由的访问权限和生命周期。

示意图：
```
守卫分类：
┌─────────────────┐
│   CanActivate   │ ← 是否可以进入路由
├─────────────────┤
│   CanDeactivate │ ← 是否可以离开路由
├─────────────────┤
│   CanLoad       │ ← 是否可以加载模块
├─────────────────┤
│   Resolve       │ ← 预先获取数据
└─────────────────┘
```

### 守卫实现
创建自定义守卫控制路由行为。

示意图：
```
守卫流程：
导航请求 → 守卫检查 → 允许/拒绝

示例 - 认证守卫：
canActivate(): boolean {
  if (this.auth.isLoggedIn()) {
    return true; // 允许导航
  } else {
    this.router.navigate(['/login']); // 重定向到登录
    return false; // 拒绝导航
  }
}
```

## 懒加载模块

### 懒加载配置
按需加载功能模块，优化应用性能。

示意图：
```
懒加载优势：
初始包体积小 → 快速加载 → 按需加载功能模块

配置：
{ 
  path: 'admin',
  loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
}
```

### 懒加载流程
模块在需要时才被加载。

示意图：
```
懒加载过程：
用户访问 /admin → 加载 AdminModule → 显示管理功能

网络请求：
首次访问: 不加载admin代码
访问/admin: 发起HTTP请求获取admin模块代码
```

## 路由事件

### 事件监听
监听路由生命周期事件，实现高级功能。

示意图：
```
路由事件流：
NavigationStart → RouteConfigLoadStart → RouteConfigLoadEnd 
→ RoutesRecognized → NavigationEnd

事件监听：
this.router.events.subscribe(event => {
  if (event instanceof NavigationStart) {
    this.showLoader = true;
  }
  if (event instanceof NavigationEnd) {
    this.showLoader = false;
  }
});
```

## 路由策略

### 路径位置策略
控制 URL 的显示格式。

示意图：
```
策略对比：
PathLocationStrategy (默认)
URL: http://example.com/products/123

HashLocationStrategy  
URL: http://example.com/#/products/123

配置：
RouterModule.forRoot(routes, { useHash: true })
```

## 路由数据传递

### 静态数据
在路由配置中定义静态数据。

示意图：
```
静态数据配置：
{
  path: 'help',
  component: HelpComponent,
  data: { 
    title: '帮助页面',
    requiresAuth: false 
  }
}

获取数据：
this.route.data.subscribe(data => {
  const title = data['title'];
});
```

### 动态数据解析
在路由激活前预先获取数据。

示意图：
```
Resolve守卫：
导航开始 → Resolver获取数据 → 数据就绪 → 激活路由

使用：
{ 
  path: 'product/:id',
  component: ProductComponent,
  resolve: {
    product: ProductResolver
  }
}
```

## 路由最佳实践

### 模块组织
合理组织路由模块结构。

示意图：
```
路由模块结构：
AppModule
├── AppRoutingModule (根路由)
└── FeatureModules
    ├── AdminModule (懒加载)
    ├── UserModule (懒加载)  
    └── SharedModule (共享)
```

### 性能优化
优化路由配置提升用户体验。

示意图：
```
优化策略：
├── 懒加载功能模块
├── 预加载策略
├── 路由守卫缓存
├── 合理的路由分割
└── 错误处理机制
```

## 路由高级特性

### 多路由出口
使用命名路由出口实现复杂布局。

示意图：
```
多出口布局：
<router-outlet></router-outlet>           ← 主内容
<router-outlet name="sidebar"></router-outlet> ← 侧边栏

路由配置：
{
  path: 'dashboard',
  component: MainComponent,
  outlets: {
    sidebar: ['sidebar-content']
  }
}
```

### 相对导航
相对于当前路由进行导航。

示意图：
```
相对导航：
当前URL: /products/category/electronics

绝对导航: this.router.navigate(['/products'])
相对导航: this.router.navigate(['../'], { relativeTo: this.route })

结果: 导航到 /products/category
```