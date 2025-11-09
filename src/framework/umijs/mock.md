# umijs Mock与代理

## Mock数据

Mock数据是前端开发过程中必不可少的一环，它通过预先与服务器端约定好的接口来模拟请求数据甚至逻辑，让前端开发能够独立自主进行，不会被服务端的开发进度所阻塞。

### 约定式Mock文件

UmiJS采用约定式的Mock文件管理方式。它约定`src/mock`文件夹下的所有文件都是Mock文件。

目录结构示例：
```
.
└── src
    ├── mock
    │   ├── api.ts
    │   └── users.ts
    └── pages
        └── index.tsx
```
在上述结构中，`src/mock`下的`api.ts`和`users.ts`都会被UmiJS解析为Mock文件。

### 编写Mock文件

Mock文件支持多种写法，既可以简单返回静态数据，也可以使用函数处理复杂逻辑。

基本写法示例：
```javascript
export default {
  // 支持值为 Object 和 Array
  'GET /api/users': { users: [1, 2] },
  
  // GET 方法可忽略不写
  '/api/users/1': { id: 1 },
  
  // 支持自定义函数，API 参考 express@4
  'POST /api/users/create': (req, res) => {
    // 添加跨域请求头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end('ok');
  },
};
```
访问`/api/users`就能得到`{ users: [1,2] }`的响应，其他接口同理。

### 使用Mock.js生成模拟数据

Mock.js是常用的辅助生成模拟数据的三方库，可以提升Mock数据的能力：

```javascript
import mockjs from 'mockjs';

export default {
  // 使用 mockjs 等三方库
  'GET /api/tags': mockjs.mock({
    'list|100': [{ name: '@city', 'value|1-100': 50, 'type|0-2': 1 }],
  }),
};
```

### 模拟延迟

为了更真实地模拟网络请求，可以手动添加setTimeout模拟延迟：

```javascript
'GET /api/tags': (req, res) => {
  setTimeout(() => {
    res.json({
      list: [...],
    });
  }, 1000);
},
```

### 合理拆分Mock文件

对于复杂的系统，请求接口通常很多。为了处理大量模拟请求的场景，建议将每一个数据模型抽象成一个文件，统一放在mock文件夹中，它们会自动被UmiJS引入。

### 关闭Mock功能

可以通过配置完全关闭Mock功能：
```javascript
export default {
  mock: false,
};
```
也可以通过环境变量临时关闭：
```bash
$ MOCK=none umi dev
```

## 代理配置

在UmiJS中，可以通过配置代理来实现跨域请求。Umi提供了内置的代理支持，可以轻松地将所有请求转发到另一个服务器。

### 配置代理

在项目的配置文件（`.umirc.ts`或`config/config.ts`）中配置代理：

```javascript
export default {
  proxy: {
    '/api': {
      target: 'https://blogs.zdldove.top',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    },
  },
};
```

在Ant Design Pro中，代理配置通常在`/config/proxy.ts`文件中：

```javascript
dev: {
  '/api/': {
    target: 'http://localhost',
    changeOrigin: true,
    pathRewrite: { '^': '' },
  },
},
```

### 在组件中使用代理

配置代理后，在组件中发起请求时，只需要将请求的地址设置为相对于代理地址的路径即可：

```javascript
import { request } from 'umi';

request('/api/users').then((response) => {
  console.log(response);
});
```
上述请求中的`/api/users`会被转发到`http://example.com/api/users`。

### 跨域问题处理

跨域请求可能会受到浏览器的限制。除了使用代理配置来解决跨域问题外，还可以通过配置CORS头部来允许跨域请求。

如果权限允许修改后端服务器的配置，可以添加以下CORS头部信息：
- 在服务器响应头中添加`Access-Control-Allow-Origin`字段，指定允许的域名
- 添加`Access-Control-Allow-Methods`字段，指定允许的请求方法
- 根据需要添加其他CORS相关头部字段

## Mock与代理的协作

在实际开发中，Mock数据和代理可以协同工作。当后端API尚未完成时，前端可以使用Mock数据进行开发和测试；当后端API完成后，只需配置代理指向真实的后端服务器即可。

UmiJS的Mock功能在开发环境下自动启用，当请求的地址在Mock中不存在时，会尝试访问代理提供的地址。这种机制使得从前端Mock数据切换到真实后端服务变得非常顺畅。