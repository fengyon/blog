# 常用目录结构

前端项目的目录结构是工程化的基础，良好的组织结构能够提高代码可维护性、团队协作效率和项目可扩展性。不同的项目类型和规模需要采用不同的目录结构策略。

## 基础项目结构

### 简单静态网站

适用于小型展示类项目或原型开发。

```
project/
├── index.html          # 入口HTML文件
├── css/
│   ├── style.css       # 主样式文件
│   └── reset.css       # 重置样式
├── js/
│   ├── main.js         # 主逻辑文件
│   └── utils.js        # 工具函数
└── images/             # 图片资源
    ├── logo.png
    └── banner.jpg
```

### 模块化前端项目

中等复杂度的单页面应用常用结构。

```
src/
├── assets/             # 静态资源
│   ├── images/         # 图片文件
│   ├── fonts/          # 字体文件
│   └── styles/         # 全局样式
├── components/         # 通用组件
│   ├── Button/
│   ├── Modal/
│   └── Input/
├── pages/              # 页面组件
│   ├── Home/
│   ├── About/
│   └── Contact/
├── utils/              # 工具函数
├── constants/          # 常量定义
└── index.js            # 应用入口
```

## 框架特定结构

### React 项目结构

现代 React 应用的典型目录组织。

```
src/
├── components/         # 可复用组件
│   ├── common/        # 通用基础组件
│   └── ui/           # 业务UI组件
├── hooks/             # 自定义Hooks
├── pages/             # 页面组件
│   ├── home/
│   │   ├── components/# 页面专用组件
│   │   └── index.jsx
├── services/          # API服务
├── store/             # 状态管理
│   ├── slices/        # Redux slices
│   └── index.js
├── utils/             # 工具函数
├── constants/         # 常量配置
└── App.jsx            # 根组件
```

### Vue 项目结构

Vue 3 项目推荐结构。

```
src/
├── assets/            # 静态资源
├── components/        # 组件目录
│   ├── base/         # 基础组件
│   └── business/     # 业务组件
├── composables/       # 组合式函数
├── views/            # 页面视图
├── router/           # 路由配置
├── stores/           # 状态管理
├── utils/            # 工具函数
└── main.js           # 应用入口
```

## 按功能组织结构

### 功能文件夹模式

将相关文件按功能模块分组，提高内聚性。

```
src/
├── features/          # 功能模块
│   ├── auth/         # 认证模块
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── index.js
│   ├── dashboard/     # 仪表板模块
│   └── settings/      # 设置模块
├── shared/            # 共享资源
│   ├── components/    # 共享组件
│   ├── utils/         # 共享工具
│   └── constants/     # 共享常量
└── App.jsx
```

### 按文件类型组织

传统但清晰的按文件类型分组。

```
src/
├── components/        # 所有组件
├── hooks/            # 所有Hooks
├── services/         # 所有API服务
├── utils/            # 所有工具函数
├── constants/        # 所有常量
└── styles/           # 所有样式文件
```

## 配置和构建文件

### 项目根目录结构

项目配置和构建相关文件。

```
project-root/
├── public/           # 静态公共文件
│   ├── index.html
│   └── favicon.ico
├── src/              # 源代码目录
├── tests/            # 测试文件
├── docs/             # 项目文档
├── build/            # 构建输出
├── node_modules/     # 依赖包
├── package.json      # 项目配置
├── package-lock.json # 依赖锁定
├── .gitignore        # Git忽略配置
├── README.md         # 项目说明
└── 配置文件
    ├── webpack.config.js
    ├── babel.config.js
    └── eslint.config.js
```

## 大型项目结构

### Monorepo 结构

多包管理的单体仓库结构。

```
monorepo/
├── packages/         # 多个包
│   ├── ui-kit/      # UI组件库
│   ├── utils/       # 工具库
│   └── config/      # 配置包
├── apps/            # 应用目录
│   ├── web-app/     # 网页应用
│   ├── mobile-app/  # 移动应用
│   └── admin/       # 管理后台
├── tools/           # 开发工具
├── package.json     # 根包配置
└── pnpm-workspace.yaml # 工作空间配置
```

### 微前端架构

微前端项目的目录组织。

```
micro-frontend/
├── shell/           # 基座应用
├── micro-apps/      # 微应用集合
│   ├── app-header/  # 头部应用
│   ├── app-nav/     # 导航应用
│   ├── app-main/    # 主应用
│   └── app-footer/  # 底部应用
├── shared/          # 共享依赖
└── config/          # 微前端配置
```

## 特殊类型项目

### 组件库结构

UI 组件库的专用结构。

```
component-library/
├── src/
│   ├── components/   # 组件源码
│   │   ├── Button/
│   │   │   ├── Button.jsx
│   │   │   ├── Button.css
│   │   │   └── index.js
│   │   └── index.js  # 统一导出
│   └── styles/       # 样式文件
├── stories/          # 文档示例
├── tests/            # 测试文件
└── dist/             # 构建输出
```

### 工具库结构

JavaScript 工具库的组织方式。

```
utils-library/
├── src/
│   ├── string/       # 字符串工具
│   ├── array/        # 数组工具
│   ├── object/       # 对象工具
│   └── index.js      # 主入口
├── tests/            # 单元测试
├── types/            # TypeScript类型
└── docs/             # API文档
```

## 目录命名规范

### 常用目录命名约定

```
目录命名示例:
- src/               # 源代码 (source)
- lib/               # 库文件 (library) 
- dist/              # 分发文件 (distribution)
- build/             # 构建输出
- public/            # 公共静态资源
- assets/            # 资源文件
- components/        # 组件目录
- utils/             # 工具函数
- hooks/             # React Hooks
- stores/            # 状态存储
- services/          # API服务
- constants/         # 常量定义
- types/             # 类型定义
- tests/             # 测试文件
- docs/              # 文档目录
- scripts/           # 脚本文件
```

## 最佳实践建议

### 结构设计原则

```
良好目录结构特征:
[清晰的层次] -> [快速定位文件]
      |
[合理的分组] -> [相关文件聚集]
      |
[一致的命名] -> [团队协作顺畅]
      |
[适度的拆分] -> [避免过度碎片化]
```

### 规模适配策略

根据项目规模选择合适的结构。

```
项目规模 vs 结构复杂度:
小型项目: [扁平结构] -> 简单直接
    |          |
 快速启动     易于维护

中型项目: [功能分组] -> 清晰组织
    |          |
 模块化      团队协作

大型项目: [领域驱动] -> 高度内聚
    |          |
 可扩展性    独立开发
```