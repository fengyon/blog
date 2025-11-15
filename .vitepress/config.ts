import fs from 'fs'
import path from 'path'
import {
  defineConfigWithTheme,
  type HeadConfig,
  type Plugin,
} from 'vitepress'
import type { Config as ThemeConfig } from '@vue/theme'
import llmstxt from 'vitepress-plugin-llms'
import baseConfig from '@vue/theme/config'
import { headerPlugin } from './headerMdPlugin'
// import { textAdPlugin } from './textAdMdPlugin'
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from 'vitepress-plugin-group-icons'

const nav: ThemeConfig['nav'] = [
  {
    text: '基础',
    activeMatch: `^/basic/`,
    items: [
      { text: '必备', link: '/basic/necessary/internet' },
      { text: 'html', link: '/basic/html/intro' },
      { text: 'css', link: '/basic/css/basic' },
      { text: 'javascript', link: '/basic/javascript/basic/introduction' },
      { text: 'es6', link: '/basic/es6/intro' },
      { text: 'typescript', link: '/basic/typescript/intro' },
      { text: 'git', link: '/basic/git/intro' },
      { text: 'DOM', link: '/basic/dom/intro' },
      { text: 'BOM', link: '/basic/bom/engine' },
      { text: 'node', link: '/basic/node/intro' },
    ],
  },
  {
    text: '框架',
    activeMatch: `^/framework/`,
    items: [
      { text: 'React', link: '/framework/react/intro' },
      { text: 'Vue', link: '/framework/vue/intro' },
      { text: 'nextjs', link: '/framework/nextjs/intro' },
      { text: 'umijs', link: '/framework/umijs/intro' },
      { text: 'nuxtjs', link: '/framework/nuxtjs/intro' },
      { text: 'Vue 2 (EOL)', link: '/framework/vue2/intro' },
      { text: 'Angular', link: '/framework/angular/intro' },
    ],
  },
  {
    text: '工程化',
    activeMatch: '^/engineering/',
    items: [
      {
        text: '概述',
        link: '/engineering/intro',
      },
      {
        text: '包管理',
        link: '/engineering/package-manager/npm',
      },
      {
        text: '架构',
        link: '/engineering/architecture/module',
      },
      {
        text: '构建工具',
        link: '/engineering/build/vite',
      },
      {
        text: '代码质量',
        link: '/engineering/coding-rule',
      },
      { text: '性能与安全', link: '/engineering/performance' },
      {
        text: 'SEO',
        link: '/engineering/seo/basic',
      },
      {
        text: '无障碍',
        link: '/engineering/accessible/into',
      },
    ],
  },
  {
    text: 'Web 3D',
    activeMatch: '^/web-3d/',
    items: [
      {
        text: '基础',
        link: '/web-3d/basic/basic',
      },
      {
        text: '核心原理',
        link: '/web-3d/theory/principle',
      },
      {
        text: 'WebGL',
        link: '/web-3d/webgl/basic',
      },
      {
        text: 'three.js',
        link: '/web-3d/threejs/basic',
      },
      {
        text: 'WebXR',
        link: '/web-3d/webxr/basic',
      },
      {
        text: '性能优化',
        link: '/web-3d/performance/rendering',
      },
    ],
  },
  {
    text: '全栈',
    activeMatch: '^/full-stack/',
    items: [
      {
        text: '网络基础',
        link: '/full-stack/network/http',
      },
      {
        text: '后端框架',
        link: '/full-stack/framework/node',
      },
      {
        text: 'Serverless',
        link: '/full-stack/serverless/intro',
      },
      {
        text: '数据库',
        link: '/full-stack/database/mysql',
      },
      {
        text: '运维',
        link: '/full-stack/linux',
      },
    ],
  },
  {
    text: '专项',
    activeMatch: '^/special/',
    items: [
      {
        text: '移动端',
        activeMatch: '^/mobile/',
        items: [
          {
            text: '移动端基础',
            link: '/mobile/basic',
          },
          {
            text: '移动端框架',
            link: '/mobile/framework',
          },
          {
            text: '移动端Web开发',
            link: '/mobile/web',
          },
          {
            text: '小程序',
            link: '/mobile/applet',
          },
          {
            text: '移动端调试',
            link: '/mobile/debug',
          },
          {
            text: '构建与发布',
            link: '/mobile/publish',
          },
        ],
      },
    ],
  },
  {
    text: '前沿',
    activeMatch: '^/leading/',
    items: [
      {
        text: 'WebAssembly',
        link: '/leading/webassembly',
      },
      {
        text: 'AI & Web',
        link: '/leading/ai-web',
      },
      {
        text: 'Web3',
        link: '/leading/web3',
      },
    ],
  },
]

export const sidebar: ThemeConfig['sidebar'] = {
  '/basic/': [
    {
      text: '必备',
      items: [
        { text: '科学上网', link: '/basic/necessary/internet' },
        {
          text: '搜索',
          link: '/basic/necessary/searching',
        },
        {
          text: 'AI',
          link: '/basic/necessary/ai',
        },
      ],
    },
    {
      text: 'html',
      items: [
        {
          text: 'HTML 语言简介',
          link: '/basic/html/intro',
        },
        {
          text: 'URL 简介',
          link: '/basic/html/url',
        },
        {
          text: '网页元素的属性',
          link: '/basic/html/attribute',
        },
        {
          text: 'HTML 字符编码',
          link: '/basic/html/encode',
        },
        {
          text: '网页的语义结构',
          link: '/basic/html/semantic',
        },
        {
          text: '文本标签',
          link: '/basic/html/text',
        },
        {
          text: '列表标签',
          link: '/basic/html/list',
        },
        {
          text: '图像标签',
          link: '/basic/html/image',
        },
        {
          text: '<a>',
          link: '/basic/html/a',
        },
        {
          text: '<link>',
          link: '/basic/html/link',
        },
        {
          text: '<script>，<noscript>',
          link: '/basic/html/script',
        },
        {
          text: '多媒体标签',
          link: '/basic/html/multimedia',
        },
        {
          text: 'iframe',
          link: '/basic/html/iframe',
        },
        {
          text: '表格标签',
          link: '/basic/html/table',
        },
        {
          text: '表单标签',
          link: '/basic/html/form',
        },
        {
          text: '移动设备网页设计',
          link: '/basic/html/mobile',
        },
        {
          text: '其他标签',
          link: '/basic/html/elements',
        },
      ],
    },
    {
      text: 'css',
      items: [
        { text: 'css 基础', link: '/basic/css/basic' },
        {
          text: 'css 选择器',
          link: '/basic/css/selector',
        },
        {
          text: 'css 盒模型',
          link: '/basic/css/box-model',
        },
        {
          text: '布局与响应式',
          link: '/basic/css/layout',
        },
        {
          text: 'css 动画',
          link: '/basic/css/animation',
        },
        {
          text: 'Transform 3D',
          link: '/basic/css/transform-3d',
        },
      ],
    },
    {
      text: 'javascript',
      items: [
        { text: '导论', link: '/basic/javascript/basic/introduction' },
        {
          text: 'JavaScript 语言的历史',
          link: '/basic/javascript/basic/history',
        },
        {
          text: 'JavaScript 的基本语法',
          link: '/basic/javascript/basic/grammar',
        },
        { text: '数据类型概述', link: '/basic/javascript/types/general' },
        {
          text: 'null, undefined 和布尔值',
          link: '/basic/javascript/types/null-undefined-boolean',
        },
        { text: '数值', link: '/basic/javascript/types/number' },
        { text: '字符串', link: '/basic/javascript/types/string' },
        { text: '对象', link: '/basic/javascript/types/object' },
        { text: '函数', link: '/basic/javascript/types/function' },
        { text: '数组', link: '/basic/javascript/types/array' },
        {
          text: '算术运算符',
          link: '/basic/javascript/operators/arithmetic',
        },
        {
          text: '比较运算符',
          link: '/basic/javascript/operators/comparison',
        },
        {
          text: '布尔运算符',
          link: '/basic/javascript/operators/boolean',
        },
        {
          text: '二进制位运算符',
          link: '/basic/javascript/operators/bit',
        },
        {
          text: '其他运算符，运算顺序',
          link: '/basic/javascript/operators/priority',
        },
        {
          text: '数据类型的转换',
          link: '/basic/javascript/features/conversion',
        },
        { text: '错误处理机制', link: '/basic/javascript/features/error' },
        { text: '编程风格', link: '/basic/javascript/features/style' },
        {
          text: 'console 对象与控制台',
          link: '/basic/javascript/features/console',
        },
        { text: 'Object 对象', link: '/basic/javascript/stdlib/object' },
        {
          text: '属性描述对象',
          link: '/basic/javascript/stdlib/attributes',
        },
        { text: 'Array 对象', link: '/basic/javascript/stdlib/array' },
        { text: '包装对象', link: '/basic/javascript/stdlib/wrapper' },
        { text: 'Boolean 对象', link: '/basic/javascript/stdlib/boolean' },
        { text: 'Number 对象', link: '/basic/javascript/stdlib/number' },
        { text: 'String 对象', link: '/basic/javascript/stdlib/string' },
        { text: 'Math 对象', link: '/basic/javascript/stdlib/math' },
        { text: 'Date 对象', link: '/basic/javascript/stdlib/date' },
        { text: 'RegExp 对象', link: '/basic/javascript/stdlib/regexp' },
        { text: 'JSON 对象', link: '/basic/javascript/stdlib/json' },
        { text: '实例对象与 new 命令', link: '/basic/javascript/oop/new' },
        { text: 'this 关键字', link: '/basic/javascript/oop/this' },
        { text: '对象的继承', link: '/basic/javascript/oop/prototype' },
        {
          text: 'Object 对象的相关方法',
          link: '/basic/javascript/oop/object',
        },
        { text: '严格模式', link: '/basic/javascript/oop/strict' },
        { text: '异步操作概述', link: '/basic/javascript/async/general' },
        { text: '定时器', link: '/basic/javascript/async/timer' },
        { text: 'Promise 对象', link: '/basic/javascript/async/promise' },
      ],
    },
    {
      text: 'es6',
      items: [
        { text: 'ECMAScript 6 简介', link: '/basic/es6/intro' },
        { text: 'let 和 const 命令', link: '/basic/es6/let' },
        { text: '变量的解构赋值', link: '/basic/es6/destructuring' },
        { text: '字符串的扩展', link: '/basic/es6/string' },
        { text: '字符串的新增方法', link: '/basic/es6/string-methods' },
        { text: '正则的扩展', link: '/basic/es6/regex' },
        { text: '数值的扩展', link: '/basic/es6/number' },
        { text: '函数的扩展', link: '/basic/es6/function' },
        { text: '数组的扩展', link: '/basic/es6/array' },
        { text: '对象的扩展', link: '/basic/es6/object' },
        { text: '对象的新增方法', link: '/basic/es6/object-methods' },
        { text: '运算符的扩展', link: '/basic/es6/operator' },
        { text: 'Symbol', link: '/basic/es6/symbol' },
        { text: 'Set 和 Map 数据结构', link: '/basic/es6/set-map' },
        { text: 'Proxy', link: '/basic/es6/proxy' },
        { text: 'Reflect', link: '/basic/es6/reflect' },
        { text: 'Promise 对象', link: '/basic/es6/promise' },
        { text: 'Iterator 和 for...of 循环', link: '/basic/es6/iterator' },
        { text: 'Generator 函数的语法', link: '/basic/es6/generator' },
        {
          text: 'Generator 函数的异步应用',
          link: '/basic/es6/generator-async',
        },
        { text: 'async 函数', link: '/basic/es6/async' },
        { text: '函数式编程', link: '/basic/es6/fp' },
        { text: 'Class 的基本语法', link: '/basic/es6/class' },
        { text: 'Class 的继承', link: '/basic/es6/class-extends' },
        { text: 'Mixin', link: '/basic/es6/mixin' },
        { text: 'Module 的语法', link: '/basic/es6/module' },
        { text: 'Module 的加载实现', link: '/basic/es6/module-loader' },
        { text: '编程风格', link: '/basic/es6/style' },
        { text: '读懂 ECMAScript 规格', link: '/basic/es6/spec' },
        { text: '异步遍历器', link: '/basic/es6/async-iterator' },
        { text: 'ArrayBuffer', link: '/basic/es6/arraybuffer' },
        { text: '最新提案', link: '/basic/es6/proposals' },
        { text: 'SIMD', link: '/basic/es6/simd' },
        { text: '参考链接', link: '/basic/es6/reference' },
        { text: '装饰器', link: '/basic/es6/decorator' },
      ],
    },
    {
      text: 'typescript',
      items: [
        { link: '/basic/typescript/intro', text: 'TypeScript 语言简介' },
        { text: 'TypeScript 基本用法', link: '/basic/typescript/basic' },
        {
          text: 'any 类型，unknown 类型，never 类型',
          link: '/basic/typescript/any',
        },
        { text: 'TypeScript 的类型系统', link: '/basic/typescript/types' },
        { link: '/basic/typescript/array', text: 'TypeScript 的数组类型' },
        { text: 'TypeScript 的元组类型', link: '/basic/typescript/tuple' },
        {
          text: 'TypeScript 的 symbol 类型',
          link: '/basic/typescript/symbol',
        },
        {
          link: '/basic/typescript/function',
          text: 'TypeScript 的函数类型',
        },
        {
          link: '/basic/typescript/object',
          text: 'TypeScript 的对象类型',
        },
        {
          text: 'TypeScript 的 interface 接口',
          link: '/basic/typescript/interface',
        },
        {
          link: '/basic/typescript/class',
          text: 'TypeScript 的 class 类型',
        },
        { link: '/basic/typescript/generics', text: 'TypeScript 泛型' },
        {
          link: '/basic/typescript/enum',
          text: 'TypeScript 的 Enum 类型',
        },
        {
          text: 'TypeScript 的类型断言',
          link: '/basic/typescript/assert',
        },
        {
          text: 'TypeScript 项目使用 npm 模块',
          link: '/basic/typescript/npm',
        },
        {
          link: '/basic/typescript/namespace',
          text: 'TypeScript namespace',
        },
        { text: 'TypeScript 装饰器', link: '/basic/typescript/decorator' },
        {
          text: '装饰器（旧语法）',
          link: '/basic/typescript/decorator-legacy',
        },
        { text: 'declare 关键字', link: '/basic/typescript/declare' },
        { link: '/basic/typescript/d-ts', text: 'd.ts 类型声明文件' },
        { text: '类型运算', link: '/basic/typescript/type-operations' },
        {
          link: '/basic/typescript/mapping',
          text: 'TypeScript 的类型映射',
        },
        { link: '/basic/typescript/utility', text: 'TypeScript 类型工具' },
        {
          text: 'TypeScript 的 React 支持',
          link: '/basic/typescript/react',
        },
        {
          text: 'TypeScript 的注释指令',
          link: '/basic/typescript/comment',
        },
        { link: '/basic/typescript/tsconfig-json', text: 'tsconfig.json' },
        { link: '/basic/typescript/tsc', text: 'tsc 命令行编译器' },
        {
          link: '/basic/typescript/operator',
          text: 'TypeScript 类型运算符',
        },
        {
          text: 'TypeScript 类型缩小',
          link: '/basic/typescript/narrowing',
        },
        { link: '/basic/typescript/module', text: 'TypeScript 模块' },
        { text: 'TypeScript 的 ES6 类型', link: '/basic/typescript/es6' },
      ],
    },
    {
      text: 'git',
      items: [
        { text: 'Git 简介', link: '/basic/git/intro' },
        { text: 'Git 安装与配置', link: '/basic/git/install' },
        { text: 'Git 仓库管理', link: '/basic/git/repository' },
        { text: 'Git 分支管理', link: '/basic/git/branch' },
        { text: 'Git 标签管理', link: '/basic/git/tag' },
        { text: 'Git 工作流', link: '/basic/git/workflow' },
        { text: 'Git Hooks', link: '/basic/git/hooks' },
        { text: 'Git 高级技巧', link: '/basic/git/advanced' },
      ],
    },
    {
      text: 'DOM',
      items: [
        { text: 'DOM 介绍', link: '/basic/dom/intro' },
        { text: 'Node 接口', link: '/basic/dom/node' },
        {
          text: 'NodeList 接口，HTMLCollection 接口',
          link: '/basic/dom/nodelist',
        },
        // { text: 'DOM 操作', link: 'basic/dom/operation' },
        {
          text: 'ParentNode 接口，ChildNode 接口',
          link: '/basic/dom/parentnode',
        },
        { text: 'Document 节点', link: '/basic/dom/document' },
        { text: 'Element 节点', link: '/basic/dom/element' },
        { text: '属性的操作', link: '/basic/dom/attributes' },
        {
          text: 'Text 节点和 DocumentFragment 节点',
          link: '/basic/dom/text',
        },
        { text: 'CSS 操作', link: '/basic/dom/css' },
        {
          text: 'Mutation Observer API',
          link: '/basic/dom/mutationobserver',
        },
        {
          text: 'EventTarget 接口',
          link: '/basic/dom/events/eventtarget',
        },
        { text: '事件模型', link: '/basic/dom/events/model' },
        { text: 'Event 对象', link: '/basic/dom/events/event' },
        { text: '鼠标事件', link: '/basic/dom/events/mouse' },
        { text: '键盘事件', link: '/basic/dom/events/keyboard' },
        { text: '进度事件', link: '/basic/dom/events/progress' },
        { text: '表单事件', link: '/basic/dom/events/form' },
        { text: '触摸事件', link: '/basic/dom/events/touch' },
        { text: '拖拉事件', link: '/basic/dom/events/drag' },
        { text: '其他常见事件', link: '/basic/dom/events/common' },
        {
          text: 'GlobalEventHandlers 接口',
          link: '/basic/dom/events/globaleventhandlers',
        },
        { text: '<a> 元素', link: '/basic/dom/elements/a' },
        { text: '<img> 元素', link: '/basic/dom/elements/image' },
        { text: '<form> 元素', link: '/basic/dom/elements/form' },
        { text: '<input> 元素', link: '/basic/dom/elements/input' },
        {
          text: '<button> 元素',
          link: '/basic/dom/elements/button',
        },
        {
          text: '<option> 元素',
          link: '/basic/dom/elements/option',
        },
        {
          text: '<video>，<audio>',
          link: '/basic/dom/elements/video',
        },
      ],
    },
    {
      text: 'BOM',
      items: [
        { text: '浏览器环境概述', link: '/basic/bom/engine' },
        { text: 'window 对象', link: '/basic/bom/window' },
        {
          text: 'Navigator 对象，Screen 对象。',
          link: '/basic/bom/navigator',
        },
        { text: 'Cookie', link: '/basic/bom/cookie' },
        {
          text: 'XMLHttpRequest 对象',
          link: '/basic/bom/xmlhttprequest',
        },
        { text: '同源限制', link: '/basic/bom/same-origin' },
        { text: 'CORS 通信', link: '/basic/bom/cors' },
        { text: 'Storage 接口', link: '/basic/bom/storage' },
        { text: 'History 对象', link: '/basic/bom/history' },
        {
          text: 'Location 对象，URL 对象，URLSearchParams 对象',
          link: '/basic/bom/location',
        },
        {
          text: 'ArrayBuffer 对象，Blob 对象',
          link: '/basic/bom/arraybuffer',
        },
        {
          text: 'File 对象，FileList 对象，FileReader 对象',
          link: '/basic/bom/file',
        },
        { text: '表单，FormData 对象', link: '/basic/bom/form' },
        { text: 'IndexedDB API', link: '/basic/bom/indexeddb' },
        { text: 'Web Worker', link: '/basic/bom/webworker' },
        { text: 'Canvas API', link: '/basic/bom/canvas' },
        {
          text: '剪贴板操作 Clipboard API 教程',
          link: '/basic/bom/clipboard',
        },
        { text: 'Fetch API 教程', link: '/basic/bom/fetch' },
        { text: 'FontFace API', link: '/basic/bom/fontface' },
        { text: 'FormData 对象', link: '/basic/bom/formdata' },
        { text: 'Geolocation API', link: '/basic/bom/geolocation' },
        { text: 'Headers 对象', link: '/basic/bom/headers' },
        {
          text: 'IntersectionObserver',
          link: '/basic/bom/intersectionObserver',
        },
        {
          text: 'Intl.RelativeTimeFormat',
          link: '/basic/bom/intl-relativetimeformat',
        },
        {
          text: 'Intl segmenter API',
          link: '/basic/bom/intl-segmenter',
        },
        {
          text: 'Page Lifecycle API',
          link: '/basic/bom/page-lifecycle',
        },
        {
          text: 'Page Visibility API',
          link: '/basic/bom/page-visibility',
        },
        { text: 'Request API', link: '/basic/bom/request' },
        { text: 'Response API', link: '/basic/bom/response' },
        {
          text: 'Server-Sent Events',
          link: '/basic/bom/server-sent-events',
        },
        { text: 'SVG 图像', link: '/basic/bom/svg' },
        { text: 'URL 对象', link: '/basic/bom/url' },
        { text: 'URL Pattern API', link: '/basic/bom/urlpattern' },
        {
          text: 'URLSearchParams 对象',
          link: '/basic/bom/urlsearchparams',
        },
        { text: 'WebSocket', link: '/basic/bom/websocket' },
        { text: 'Web Share API', link: '/basic/bom/web-share-api' },
        {
          text: 'window.postMessage() 方法',
          link: '/basic/bom/postmessage',
        },
        { text: 'Web Audio API', link: '/basic/bom/webaudio' },
        { text: 'Web Components', link: '/basic/bom/webcomponents' },
        { text: 'Service Worker', link: '/basic/bom/service-worker' },
        { text: 'Offline 应用', link: '/basic/bom/offline' },
        { text: 'Point lock API', link: '/basic/bom/pointer-lock' },
      ],
    },
    {
      text: 'node',
      items: [
        { text: 'node 简介', link: '/basic/node/intro' },
        { text: 'node 安装与配置', link: '/basic/node/installation' },
        { text: 'node 事件循环', link: '/basic/node/event-loop' },
        { text: 'node 常用模块', link: '/basic/node/modules' },
        { text: 'npm 包管理器', link: '/basic/node/npm' },
      ],
    },
  ],
  '/framework/': [
    {
      text: 'React',
      items: [
        {
          text: 'React 简介',
          link: '/framework/react/intro',
        },
        {
          text: 'React JSX',
          link: '/framework/react/jsx',
        },
        {
          text: 'React 组件',
          link: '/framework/react/component',
        },
        {
          text: 'React Hooks',
          link: '/framework/react/hooks',
        },
        {
          text: 'React TSX',
          link: '/framework/react/tsx',
        },
        {
          text: 'React Fiber',
          link: '/framework/react/fiber',
        },
        {
          text: 'React Concurrent',
          link: '/framework/react/concurrent',
        },
        {
          text: 'React Compiler',
          link: '/framework/react/compiler',
        },
        {
          text: 'React Router',
          link: '/framework/react/router',
        },
        {
          text: 'React Managing State',
          link: '/framework/react/managing-state',
        },
        {
          text: 'React UI',
          link: '/framework/react/ui',
        },
        {
          text: 'React CSS',
          link: '/framework/react/css',
        },
      ],
    },
    {
      text: 'Vue',
      items: [
        {
          text: 'Vue 简介',
          link: '/framework/vue/intro',
        },
        {
          text: 'Vue 基础',
          link: '/framework/vue/basic',
        },
        {
          text: 'Vue Component',
          link: '/framework/vue/component',
        },
        {
          text: 'Vue Directive',
          link: '/framework/vue/directives',
        },
        {
          text: 'Vue Slot',
          link: '/framework/vue/slots',
        },
        {
          text: '生命周期',
          link: '/framework/vue/lifecycle',
        },
        {
          text: 'Composition API',
          link: '/framework/vue/composition-api',
        },
        {
          text: 'Vue TS',
          link: '/framework/vue/ts',
        },
        {
          text: '响应式原理',
          link: '/framework/vue/reactive',
        },
        {
          text: '状态管理',
          link: '/framework/vue/state',
        },
        {
          text: '动态组件',
          link: '/framework/vue/dynamic-component',
        },
        {
          text: '异步组件',
          link: '/framework/vue/async',
        },
        {
          text: '内置组件',
          link: '/framework/vue/internal-component',
        },
      ],
    },
    {
      text: 'nextjs',
      items: [
        {
          text: 'nextjs 入门',
          link: '/framework/nextjs/start',
        },
        {
          text: 'nextjs 路由系统',
          link: '/framework/nextjs/router',
        },
        {
          text: 'nextjs 渲染模式',
          link: '/framework/nextjs/rendering',
        },
        {
          text: 'nextjs 状态管理',
          link: '/framework/nextjs/status',
        },
        {
          text: 'nextjs 数据获取',
          link: '/framework/nextjs/data-fetching',
        },
        {
          text: 'nextjs 中间件',
          link: '/framework/nextjs/middleware',
        },
        {
          text: 'nextjs 生态',
          link: '/framework/nextjs/ecosystem',
        },
        {
          text: 'nextjs 服务端API',
          link: '/framework/nextjs/api',
        },
      ],
    },
    {
      text: 'umijs',
      items: [
        {
          text: 'umijs 入门',
          link: '/framework/umijs/start',
        },
        {
          text: 'umijs 路由',
          link: '/framework/umijs/router',
        },
        {
          text: 'umijs 状态管理',
          link: '/framework/umijs/status',
        },
        {
          text: 'umijs Mock与代理',
          link: '/framework/umijs/mock',
        },
        {
          text: 'umijs 构建与部署',
          link: '/framework/umijs/build',
        },
        {
          text: 'umijs 插件系统',
          link: '/framework/umijs/plugins',
        },
      ],
    },
    {
      text: 'nuxtjs',
      items: [
        {
          text: 'nuxtjs 入门',
          link: '/framework/nuxtjs/start',
        },
        {
          text: 'nuxtjs 路由系统',
          link: '/framework/nuxtjs/router',
        },
        {
          text: 'nuxtjs 渲染模式',
          link: '/framework/nuxtjs/rendering',
        },
        {
          text: 'nuxtjs 状态管理',
          link: '/framework/nuxtjs/status',
        },
        {
          text: 'nuxtjs 数据获取',
          link: '/framework/nuxtjs/data-fetching',
        },
        {
          text: 'nuxtjs 中间件',
          link: '/framework/nuxtjs/middleware',
        },
        {
          text: 'nuxtjs 服务端API',
          link: '/framework/nuxtjs/api',
        },
        {
          text: 'nuxtjs 插件',
          link: '/framework/nuxtjs/plugins',
        },
      ],
    },
    {
      text: 'Vue 2 (EOL)',
      items: [
        {
          text: 'Vue2 简介',
          link: '/framework/vue2/intro',
        },
        {
          text: 'Vue2 基础',
          link: '/framework/vue2/basic',
        },
        {
          text: 'Vue2 Component',
          link: '/framework/vue2/component',
        },
        {
          text: 'Vue2 Directive',
          link: '/framework/vue2/directives',
        },
        {
          text: 'Vue2 Slot',
          link: '/framework/vue2/slots',
        },
        {
          text: 'Vue2 Option API',
          link: '/framework/vue2/option-api',
        },
        {
          text: 'Vue2 生命周期',
          link: '/framework/vue2/lifecycle',
        },
        {
          text: 'Vue2 响应式原理',
          link: '/framework/vue2/reactive',
        },
        {
          text: 'Vue2 状态管理',
          link: '/framework/vue2/state',
        },
        {
          text: 'Vue2 内置组件',
          link: '/framework/vue2/internal-component',
        },
      ],
    },
    {
      text: 'Angular',
      items: [
        {
          text: 'Angular 入门',
          link: '/framework/angular/start',
        },
        {
          text: 'Angular 架构',
          link: '/framework/angular/framework',
        },
        {
          text: 'Angular 模板',
          link: '/framework/angular/tempalte',
        },
        {
          text: 'Angular 服务与依赖注入',
          link: '/framework/angular/services',
        },
        {
          text: 'Angular 管道',
          link: '/framework/angular/pipe',
        },
        {
          text: 'Angular 状态管理',
          link: '/framework/angular/status',
        },
        {
          text: 'Angular Router',
          link: '/framework/angular/router',
        },
        {
          text: 'Angular HTTP',
          link: '/framework/angular/http',
        },
        {
          text: 'Angular 表单',
          link: '/framework/angular/form',
        },
        {
          text: 'Angualr Rxjs',
          link: '/framework/angular/rxjs',
        },
        {
          text: 'Angualr signal',
          link: '/framework/angular/signal',
        },
      ],
    },
  ],
  '/engineering/': [
    {
      text: '工程化概述',
      items: [
        {
          text: '简介',
          link: '/engineering/intro',
        },
      ],
    },
    {
      text: '包管理',
      items: [
        { text: 'npm', link: '/engineering/package-manager/npm' },
        { text: 'yarn', link: '/engineering/package-manager/yarn' },
        { text: 'pnpm', link: '/engineering/package-manager/pnpm' },
      ],
    },
    {
      text: '架构设计',
      items: [
        { text: '模块化', link: '/engineering/architecture/module' },
        {
          text: '常用目录结构',
          link: '/engineering/architecture/diretory',
        },
        {
          text: '微前端',
          link: '/engineering/architecture/micro-frontend',
        },
        { text: 'monorepo', link: '/engineering/architecture/monorep' },
      ],
    },
    {
      text: '构建工具',
      items: [
        { text: 'Vite', link: '/engineering/build/vite' },
        { text: 'Webpack', link: '/engineering/build/webpack' },
        { text: 'Rollup', link: '/engineering/build/rollup' },
        { text: 'esbuild', link: '/engineering/build/esbuild' },
      ],
    },
    {
      text: '代码质量',
      items: [
        { text: '代码编译检查', link: '/engineering/coding/rule' },
        { text: '代码规范', link: '/engineering/coding/style' },
        { text: '代码测试', link: '/engineering/coding/test' },
        { text: '代码提交检查', link: '/engineering/coding/push' },
      ],
    },
    {
      text: '性能与安全',
      items: [
        { text: '性能优化', link: '/engineering/performance' },
        { text: 'Web安全', link: '/engineering/security' },
        { text: '前端监控', link: '/engineering/monitor' },
      ],
    },
    {
      text: 'SEO',
      items: [
        { text: 'SEO基础', link: '/engineering/seo/basic' },
        { text: '服务端渲染', link: '/engineering/seo/ssr' },
        { text: '预渲染', link: '/engineering/seo/prerender' },
      ],
    },
    {
      text: '无障碍',
      items: [
        {
          text: '无障碍简介',
          link: '/engineering/accessible/intro',
        },
        {
          text: 'html无障碍',
          link: '/engineering/accessible/html',
        },
        {
          text: '键盘无障碍',
          link: '/engineering/accessible/keyboard',
        },
        {
          text: '色彩与对比度',
          link: '/engineering/accessible/keyboard',
        },
        {
          text: 'aria',
          link: '/engineering/accessible/aria',
        },
        {
          text: '无障碍框架',
          link: '/engineering/accessible/framework',
        },
        {
          text: '手动测试无障碍',
          link: '/engineering/accessible/test',
        },
        {
          text: '自动测试无障碍',
          link: '/engineering/accessible/test',
        },
      ],
    },
  ],
  '/web-3d/': [
    {
      text: 'Web 3D 基础',
      items: [
        { text: '3D 图形学基础', link: '/web-3d/basic/basic' },
        { text: '坐标系系统', link: '/web-3d/basic/coordinate-system' },
        { text: '变换与矩阵', link: '/web-3d/basic/transform' },
      ],
    },
    {
      text: '核心原理',
      items: [
        { text: '渲染管线', link: '/web-3d/theory/principle' },
        { text: '着色器基础', link: '/web-3d/theory/shaders' },
        { text: '光照模型', link: '/web-3d/theory/lighting' },
      ],
    },
    {
      text: 'WebGL',
      items: [
        { text: 'WebGL 基础', link: '/web-3d/webgl/basic' },
        { text: '缓冲区与顶点', link: '/web-3d/webgl/buffers' },
        { text: '纹理与材质', link: '/web-3d/webgl/textures' },
      ],
    },
    {
      text: 'Three.js',
      items: [
        { text: 'Three.js 入门', link: '/web-3d/threejs/basic' },
        { text: '场景与相机', link: '/web-3d/threejs/scene-camera' },
        {
          text: '几何体与材质',
          link: '/web-3d/threejs/geometry-material',
        },
        { text: '动画系统', link: '/web-3d/threejs/animation' },
      ],
    },
    {
      text: 'WebXR',
      items: [
        { text: 'WebXR 基础', link: '/web-3d/webxr/basic' },
        { text: 'VR 开发', link: '/web-3d/webxr/vr' },
        { text: 'AR 开发', link: '/web-3d/webxr/ar' },
      ],
    },
    {
      text: '性能优化',
      items: [
        { text: '渲染优化', link: '/web-3d/performance/rendering' },
        { text: '内存管理', link: '/web-3d/performance/memory' },
        { text: '加载优化', link: '/web-3d/performance/loading' },
      ],
    },
  ],
  '/full-stack/': [
    {
      text: '网络基础',
      items: [
        { text: 'HTTP', link: '/full-stack/network/http' },
        { text: 'TCP/IP', link: '/full-stack/network/tcp-ip' },
        { text: 'UPD', link: '/full-stack/network/tcp-ip' },
        { text: 'HTTPS', link: '/full-stack/network/https' },
        { text: 'WebSocket', link: '/full-stack/network/websocket' },
        { text: 'wireshark', link: '/full-stack/network/wireshark' },
      ],
    },
    {
      text: '后端框架',
      items: [
        { text: 'node 后端基础', link: '/full-stack/framework/node' },
        { text: 'express.js', link: '/full-stack/framework/express' },
        { text: 'nest.js', link: '/full-stack/framework/nestjs' },
        { text: 'koa.js', link: '/full-stack/framework/koa' },
      ],
    },
    {
      text: 'Serverless',
      items: [
        { text: 'Serverless 简介', link: '/full-stack/serverless/intro' },
        {
          text: 'Serverless 架构',
          link: '/full-stack/serverless/architecture',
        },
        { text: '云函数', link: '/full-stack/serverless/functions' },
      ],
    },
    {
      text: '数据库',
      items: [
        { text: 'MySQL', link: '/full-stack/database/mysql' },
        { text: 'MongoDB', link: '/full-stack/database/mongodb' },
        { text: 'Redis', link: '/full-stack/database/redis' },
      ],
    },
    {
      text: '运维',
      items: [
        {
          text: 'Linux',
          link: '/full-stack/linux',
        },
        {
          text: 'Docker',
          link: '/full-stack/docker',
        },
        {
          text: 'Kubernetes',
          link: '/full-stack/kubernetes',
        },
        { text: 'CI/CD', link: '/full-stack/ci-cd' },

        {
          text: '监控',
          link: '/full-stack/monitor',
        },
        {
          text: '安全',
          link: '/full-stack/security',
        },
        { text: '日志', link: '/full-stack/logging' },
      ],
    },
  ],
  '/special/': [
    {
      text: '移动端',
      items: [
        {
          text: '移动端基础',
          items: [
            { text: '移动端开发概述', link: '/mobile/basic' },
            { text: '视口与分辨率', link: '/mobile/basic/viewport' },
            { text: '触摸事件', link: '/mobile/basic/touch-events' },
          ],
        },
        {
          text: '移动端框架',
          items: [
            {
              text: 'React Native',
              link: '/mobile/framework/react-native',
            },
            { text: 'Flutter', link: '/mobile/framework/flutter' },
            { text: 'Weex', link: '/mobile/framework/weex' },
          ],
        },
        {
          text: '移动端Web',
          items: [
            { text: '响应式设计', link: '/mobile/web/responsive' },
            { text: 'PWA', link: '/mobile/web/pwa' },
            { text: '混合开发', link: '/mobile/web/hybrid' },
          ],
        },
        {
          text: '小程序',
          items: [
            { text: '微信小程序', link: '/mobile/applet/wechat' },
            { text: '支付宝小程序', link: '/mobile/applet/alipay' },
            { text: '跨端开发', link: '/mobile/applet/cross-platform' },
          ],
        },
        {
          text: '调试与发布',
          items: [
            { text: '移动端调试', link: '/mobile/debug' },
            { text: '应用商店发布', link: '/mobile/publish' },
            { text: '热更新', link: '/mobile/publish/hot-update' },
          ],
        },
      ],
    },
  ],
  '/leading/': [
    {
      text: 'WebAssembly',
      items: [
        { text: 'WASM 基础', link: '/leading/webassembly' },
        { text: 'Rust 与 WASM', link: '/leading/webassembly/rust' },
        { text: '性能优化', link: '/leading/webassembly/performance' },
      ],
    },
    {
      text: 'AI & Web',
      items: [
        { text: 'TensorFlow.js', link: '/leading/ai-web/tensorflow' },
        { text: '机器学习前端', link: '/leading/ai-web/machine-learning' },
        { text: 'AI 应用案例', link: '/leading/ai-web/cases' },
      ],
    },
    {
      text: 'Web3',
      items: [
        { text: '区块链基础', link: '/leading/web3' },
        { text: '智能合约', link: '/leading/web3/smart-contract' },
        { text: 'DApp 开发', link: '/leading/web3/dapp' },
      ],
    },
  ],
}

const i18n: ThemeConfig['i18n'] = {
  search: '搜索',
  menu: '菜单',
  toc: '本页目录',
  returnToTop: '返回顶部',
  appearance: '外观',
  previous: '前一篇',
  next: '下一篇',
  pageNotFound: '页面未找到',
  deadLink: {
    before: '你打开了一个不存在的链接：',
    after: '。',
  },
  deadLinkReport: {
    before: '不介意的话请提交到',
    link: '这里',
    after: '，我们会跟进修复。',
  },
  footerLicense: {
    before: '',
    after: '',
  },
  ariaAnnouncer: {
    before: '',
    after: '已经加载完毕',
  },
  ariaDarkMode: '切换深色模式',
  ariaSkipToContent: '直接跳到内容',
  ariaToC: '当前页面的目录',
  ariaMainNav: '主导航',
  ariaMobileNav: '移动版导航',
  ariaSidebarNav: '侧边栏导航',
}

const inlineScript = (file: string): HeadConfig => [
  'script',
  {},
  fs.readFileSync(
    path.resolve(__dirname, `./inlined-scripts/${file}`),
    'utf-8',
  ),
]

const isProd = process.env.NODE_ENV === 'production'

export default defineConfigWithTheme<ThemeConfig>({
  extends: baseConfig,

  sitemap: {
    hostname: 'https://hookall.pages.dev/',
  },

  lang: 'zh-CN',
  title: 'HookAll',
  description: 'HookAll - 互联网开发文档',
  srcDir: 'src',
  srcExclude: ['tutorial/**/description'],

  head: [
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    [
      'meta',
      { property: 'og:url', content: 'https://hookall.pages.dev/' },
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'HookAll' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'HookAll - 互联网开发文档',
      },
    ],
    [
      'meta',
      {
        property: 'og:image',
        content: 'https://hookall.pages.dev/logo.svg',
      },
    ],
    isProd && [
      'script',
      {
        defer: '',
        src: 'https://static.cloudflareinsights.com/beacon.min.js',
        'data-cf-beacon': '{"token": "e8fc654435194636b86a9910ac4e1335"}',
      },
    ],
    isProd && inlineScript('clarity-analytics.js'),
  ].filter(Boolean) as HeadConfig[],

  themeConfig: {
    nav,
    sidebar,
    i18n,

    // localeLinks: [
    //   {
    //     link: 'https://vuejs.org',
    //     text: 'English',
    //     repo: 'https://github.com/vuejs/docs'
    //   },
    // ],

    // algolia: {
    //   indexName: 'vuejs_cn2',
    //   appId: 'UURH1MHAF7',
    //   apiKey: 'c23eb8e7895f42daeaf2bf6f63eb4bf6',
    //   searchParameters: {
    //     facetFilters: ['version:v3']
    //   },
    //   placeholder: '搜索文档',
    //   translations: {
    //     button: {
    //       buttonText: '搜索'
    //     },
    //     modal: {
    //       searchBox: {
    //         resetButtonTitle: '清除查询条件',
    //         resetButtonAriaLabel: '清除查询条件',
    //         cancelButtonText: '取消',
    //         cancelButtonAriaLabel: '取消'
    //       },
    //       startScreen: {
    //         recentSearchesTitle: '搜索历史',
    //         noRecentSearchesText: '没有搜索历史',
    //         saveRecentSearchButtonTitle: '保存到搜索历史',
    //         removeRecentSearchButtonTitle: '从搜索历史中移除',
    //         favoriteSearchesTitle: '收藏',
    //         removeFavoriteSearchButtonTitle: '从收藏中移除'
    //       },
    //       errorScreen: {
    //         titleText: '无法获取结果',
    //         helpText: '你可能需要检查你的网络连接'
    //       },
    //       footer: {
    //         selectText: '选择',
    //         navigateText: '切换',
    //         closeText: '关闭',
    //         searchByText: '搜索供应商'
    //       },
    //       noResultsScreen: {
    //         noResultsText: '无法找到相关结果',
    //         suggestedQueryText: '你可以尝试查询',
    //         reportMissingResultsText: '你认为这个查询应该有结果？',
    //         reportMissingResultsLinkText: '向我们反馈'
    //       }
    //     }
    //   }
    // },

    // carbonAds: {
    //   code: 'CEBDT27Y',
    //   placement: 'vuejsorg'
    // },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/fengyon/blog' },
    ],

    editLink: {
      repo: 'fengyon/blog#master',
      text: '在 GitHub 上编辑此页',
    },

    footer: {
      license: {
        text: '版权声明',
        link: 'https://github.com/fengyon/blog/LICENSE',
      },
      copyright:
        '本网站的文档采用 CC BY-SA 4.0 (署名—相同方式共享 4.0 协议国际版) 进行许可，图片版权属于图片的作者。',
    },
  },

  markdown: {
    theme: 'github-dark',
    config(md) {
      md.use(headerPlugin).use(groupIconMdPlugin)
      // .use(textAdPlugin)
    },
  },

  vite: {
    define: {
      __VUE_OPTIONS_API__: false,
    },
    optimizeDeps: {
      include: ['gsap', 'dynamics.js'],
      exclude: ['@vue/repl'],
    },
    // @ts-ignore
    ssr: {
      external: ['@vue/repl'],
    },
    server: {
      host: true,
      fs: {
        // for when developing with locally linked theme
        allow: ['../..'],
      },
    },
    build: {
      chunkSizeWarningLimit: Infinity,
    },
    json: {
      stringify: true,
    },
    plugins: [
      llmstxt({
        customLLMsTxtTemplate: `\
# HookAll

HookAll - 互联网开发文档

## Table of Contents

{toc}`,
      }) as Plugin,
      groupIconVitePlugin({
        customIcon: {
          cypress: 'vscode-icons:file-type-cypress',
          'testing library': 'logos:testing-library',
        },
      }) as Plugin,
    ],
  },
})
