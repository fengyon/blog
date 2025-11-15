# umijs 构建与部署

## 构建配置

### 默认构建行为

UmiJS 默认采用对新手友好的构建方案，执行 `umi build` 后会在项目根目录下生成 `dist` 目录，其中包含三个核心文件：
```
dist/
├── index.html
├── umi.js
└── umi.css
```

### 基础配置选项

**不输出 HTML 文件**
当 HTML 文件由后端输出时，可配置不生成 HTML 文件：
```bash
HTML=none umi build
```

**静态资源路径配置**
当静态资源存放在非根目录或 CDN 时，需要配置 publicPath：
```javascript
export default {
  publicPath: "http://yourcdn/path/to/static/"
};
```

**运行时 publicPath**
如需在 HTML 中动态管理 publicPath，可启用 runtimePublicPath：
```javascript
export default {
  runtimePublicPath: true,
};
```
在 HTML 中输出：
```html
<script>
  window.publicPath = <%= YOUR PUBLIC_PATH %>
</script>
```

## 部署配置

### 基础路径配置

部署到非根目录时，必须配置 base 选项以确保资源正确加载：
```javascript
export default {
  base: '/path/to/your/app/root',
};
```

示意图：
```
本地开发：http://localhost:8000/
部署路径：https://domain.com/path/to/your/app/root/
```

### 路由历史模式

**Hash 历史模式**
使用 hash 类型的历史路由可避免服务端配置问题：
```javascript
export default {
  history: { type: 'hash' },
};
```

**Browser 历史模式**
默认使用 browser history，需服务端配合支持。

### 按需加载

通过配置 dynamicImport 实现路由级按需加载：
```javascript
export default {
  dynamicImport: {},
};
```

## 高级部署方案

### 静态化输出

对于静态托管服务，可配置 exportStatic 为每个路由生成独立的 HTML 文件：
```javascript
export default {
  exportStatic: {},
};
```
构建结果：
```
./dist/
├── index.html
├── list/
│   └── index.html
└── static/
    ├── pages__index.5c0f5f51.async.js
    ├── pages__list.f940b099.async.js
    ├── umi.2eaebd79.js
    └── umi.f4cb51da.css
```

**HTML 后缀支持**
某些容器环境需要 `.html` 后缀时：
```javascript
export default {
  exportStatic: {
    htmlSuffix: true,
  },
};
```
生成结构：
```
dist/
├── index.html
└── list.html  # 替代 list/index.html
```

### 环境特定配置

**多环境配置**
通过环境变量区分不同环境的配置：
```javascript
// package.json
"scripts": {
  "build:dev": "cross-env UMI_ENV=dev umi build",
  "build:prod": "cross-env UMI_ENV=prod umi build"
}
```

**配置文件支持**
可创建环境特定的配置文件：
- `.umirc.js` - 基础配置
- `.umirc.prod.js` - 生产环境配置

## 服务端配置

### Nginx 配置示例

使用 Nginx 作为反向代理服务器的配置示例：
```nginx
server {
    listen 80;
    server_name your_domain.com;
    
    root /path/to/your/project/dist;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 部署流程

**标准部署步骤**：
1. 准备服务器环境 (Node.js、Nginx)
2. 获取项目代码：`git clone <项目仓库地址>`
3. 安装依赖：`npm install`
4. 构建项目：`npm run build`
5. 配置 Nginx 并重启服务
6. 验证部署结果

## 部署最佳实践

### 性能优化

**CDN 加速**
配合 CDN 使用可大幅提升静态资源加载速度：
```javascript
export default {
  publicPath: 'https://cdn.example.com/your-project/',
};
```

**资源压缩**
确保开启构建时的压缩优化，减少资源体积。

### 环境一致性

**容器化部署**
建议使用 Docker 确保环境一致性，通过流程管理工具如 PM2 管理进程。

**持续集成**
集成到 CI/CD 流程，实现自动化测试、构建和部署：
```yaml
# GitLab CI 示例
stages:
  - build
  - deploy

build:
  stage: build
  script:
    - npm install
    - npm run build
  artifacts:
    paths:
      - dist/
```

### 错误排查

**常见部署问题**
- 路由空白：检查 base 配置和服务端重定向规则
- 资源 404：验证 publicPath 配置
- 接口代理失败：检查服务端反向代理配置

通过合理的构建配置和部署策略，可以确保 UmiJS 应用在各种环境下稳定运行。