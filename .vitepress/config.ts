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
      {
        text: '算法',
        link: '/basic/algorithm/intro',
      },
    ],
  },
  {
    text: '框架',
    activeMatch: `^/framework/`,
    items: [
      { text: 'React', link: '/framework/react/intro' },
      { text: 'Vue', link: '/framework/vue/intro' },
      { text: 'nextjs', link: '/framework/nextjs/start' },
      { text: 'umijs', link: '/framework/umijs/start' },
      { text: 'nuxtjs', link: '/framework/nuxtjs/start' },
      { text: 'Vue 2 (EOL)', link: '/framework/vue2/intro' },
      { text: 'Angular', link: '/framework/angular/start' },
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
        link: '/engineering/coding/rule',
      },
      { text: '性能优化', link: '/engineering/performance/why' },
      {
        text: 'SEO',
        link: '/engineering/seo/basic',
      },
      {
        text: '无障碍',
        link: '/engineering/accessible/intro',
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
        text: 'node 后端',
        link: '/full-stack/framework/node',
      },
      {
        text: 'Serverless',
        link: '/full-stack/serverless/intro',
      },
      {
        text: '数据库',
        link: '/full-stack/database/intro',
      },
      {
        text: '运维',
        link: '/full-stack/operation/linux',
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
        text: 'WebGPU',
        link: '/web-3d/webgpu/start',
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
    text: '专项',
    activeMatch: '^/special/',
    items: [
      {
        text: '移动端',
        link: '/special/mobile/basic/intro',
      },
      {
        text: 'Electron',
        link: '/special/electron/intro',
      },
      {
        text: '命令行开发',
        link: '/special/cli/intro',
      },
      { text: 'Web 安全', link: '/special/security/intro' },
    ],
  },
  {
    text: '前沿',
    activeMatch: '^/leading/',
    items: [
      {
        text: 'WebAssembly',
        link: '/leading/webassembly/basic',
      },
      {
        text: 'AI & Web',
        link: '/leading/ai-web/intro',
      },
      {
        text: 'Web3',
        link: '/leading/web3/intro',
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
        { text: 'node 全局变量', link: '/basic/node/vars' },
        { text: 'node 事件循环', link: '/basic/node/event-loop' },
        { text: 'node 常用模块', link: '/basic/node/modules' },
        { text: 'npm 包管理器', link: '/basic/node/npm' },
      ],
    },
    {
      text: '算法',
      items: [
        {
          text: '算法入门',
          link: '/basic/algorithm/intro',
        },
        {
          text: '复杂度分析',
          link: '/basic/algorithm/complexity',
        },
        {
          text: '数据结构',
          link: '/basic/algorithm/data-struct',
        },
        { text: '递归与分治', link: '/basic/algorithm/divide-conquer' },
        { text: '动态规划 DP', link: '/basic/algorithm/dp' },
        { text: '贪心算法', link: '/basic/algorithm/greedy' },
        { text: '回溯算法', link: '/basic/algorithm/backtracking' },
        {
          text: '排序算法',
          link: '/basic/algorithm/sorting',
        },
        {
          text: '搜索算法',
          link: '/basic/algorithm/searching',
        },
        {
          text: '图算法',
          link: '/basic/algorithm/graph',
        },
        {
          text: '字符串算法',
          link: '/basic/algorithm/string',
        },
        {
          text: '机器学习算法',
          link: '/basic/algorithm/advanced/machine-learning',
        },
        {
          text: '密码学算法',
          link: '/basic/algorithm/advanced/cryptography',
        },
        {
          text: '近似算法',
          link: '/basic/algorithm/advanced/approximation',
        },
        {
          text: '随机化算法',
          link: '/basic/algorithm/advanced/randomized',
        },
        {
          text: '性能测试工具',
          link: '/basic/algorithm/performance-tools',
        },
        {
          text: '可视化工具',
          link: '/basic/algorithm/visualization',
        },
        {
          text: '算法练习平台',
          link: '/basic/algorithm/practice-platforms',
        },
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
      text: '性能优化',
      items: [
        {
          text: '为什么需要性能优化',
          link: '/engineering/performance/why',
        },
        {
          text: '核心性能指标',
          link: '/engineering/performance/core-metrics',
        },
        {
          text: '网络层优化',
          link: '/engineering/performance/network',
        },
        {
          text: '资源加载优化',
          link: '/engineering/performance/resources',
        },
        {
          text: '构建优化',
          link: '/engineering/performance/bundling',
        },
        {
          text: '渲染性能优化',
          link: '/engineering/performance/rendering',
        },
        {
          text: 'JavaScript 性能优化',
          link: '/engineering/performance/javascript',
        },
        {
          text: '框架性能优化',
          link: '/engineering/performance/framework',
        },
        {
          text: '性能监控',
          link: '/engineering/performance/monitoring',
        },
        {
          text: '性能工具链',
          link: '/engineering/performance/tooling',
        },
      ],
    },
    {
      text: 'SEO',
      items: [
        { text: 'SEO 基础', link: '/engineering/seo/basic' },
        { text: '关键词研究', link: '/engineering/seo/keyword-research' },
        {
          text: 'SEO 内容策略',
          link: '/engineering/seo/content-strategy',
        },
        { text: '网站结构化', link: '/engineering/seo/web-struct' },
        {
          text: '索引管理与爬虫控制',
          link: '/engineering/seo/index-crawl',
        },
        {
          text: '网站渲染优化',
          link: '/engineering/seo/renderer',
        },
        {
          text: '站外优化',
          link: '/engineering/seo/off-page',
        },
        {
          text: 'SEO For Google',
          link: '/engineering/seo/for-google',
        },
        {
          text: 'SEO For Baidu',
          link: '/engineering/seo/for-baidu',
        },
        {
          text: 'SEO For AI',
          link: '/engineering/seo/for-ai',
        },
        { text: 'SEO 分析与监控', link: '/engineering/seo/analytics' },
        { text: 'SEO 工具与资源库', link: '/engineering/seo/resources' },
        { text: 'SEO 未来趋势', link: '/engineering/seo/future' },
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
          link: '/engineering/accessible/color-contrast',
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
          link: '/engineering/accessible/autotest',
        },
      ],
    },
  ],
  '/full-stack/': [
    {
      text: '网络基础',
      items: [
        { text: 'HTTP', link: '/full-stack/network/http' },
        { text: 'TCP/IP', link: '/full-stack/network/tcp-ip' },
        { text: 'UPD', link: '/full-stack/network/udp' },
        { text: 'HTTPS', link: '/full-stack/network/https' },
        { text: 'WebSocket', link: '/full-stack/network/websocket' },
        { text: 'wireshark', link: '/full-stack/network/wireshark' },
      ],
    },
    {
      text: 'node 后端',
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
        { text: '数据库简介', link: '/full-stack/database/intro' },
        { text: 'MySQL', link: '/full-stack/database/mysql' },
        { text: 'MongoDB', link: '/full-stack/database/mongodb' },
        { text: 'PostgreSQL', link: '/full-stack/database/postgresql' },
        { text: 'Redis', link: '/full-stack/database/redis' },
      ],
    },
    {
      text: '运维',
      items: [
        {
          text: 'Linux',
          link: '/full-stack/operation/linux',
        },
        {
          text: 'Docker',
          link: '/full-stack/operation/docker',
        },
        {
          text: 'Kubernetes',
          link: '/full-stack/operation/kubernetes',
        },
        { text: 'CI/CD', link: '/full-stack/operation/ci-cd' },

        {
          text: '监控',
          link: '/full-stack/operation/monitor',
        },
        {
          text: '安全',
          link: '/full-stack/operation/security',
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
      text: 'WebGPU',
      items: [
        { text: 'WebGPU 入门', link: '/web-3d/webgpu/start' },
        { text: 'WebGPU 运行机制', link: '/web-3d/webgpu/mechanism' },
        { text: 'WebGPU 渲染管线', link: '/web-3d/webgpu/pipeline' },
        { text: 'WebGPU 计算', link: '/web-3d/webgpu/compute' },
        { text: 'WebGPU API', link: '/web-3d/webgpu/api' },
        { text: 'WebGPU 工具链', link: '/web-3d/webgpu/toolchain' },
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
  '/special/': [
    {
      text: '移动端',
      items: [
        { text: '移动端开发概述', link: '/special/mobile/basic/intro' },
        { text: '视窗与分辨率', link: '/special/mobile/basic/viewport' },
        { text: '触摸事件', link: '/special/mobile/basic/touch-events' },

        {
          text: 'React Native',
          link: '/special/mobile/framework/react-native',
        },
        { text: 'Flutter', link: '/special/mobile/framework/flutter' },
        { text: 'Weex', link: '/special/mobile/framework/weex' },

        { text: '响应式设计', link: '/special/mobile/web/responsive' },
        { text: 'PWA', link: '/special/mobile/web/pwa' },
        { text: '混合开发', link: '/special/mobile/web/hybrid' },

        { text: '微信小程序', link: '/special/mobile/applet/wechat' },
        { text: '支付宝小程序', link: '/special/mobile/applet/alipay' },
        {
          text: '跨端开发',
          link: '/special/mobile/applet/cross-platform',
        },

        { text: '移动端调试', link: '/special/mobile/publish/debug' },
        { text: '应用商店发布', link: '/special/mobile/publish/publish' },
        { text: '热更新', link: '/special/mobile/publish/hot-update' },
      ],
    },
    {
      text: 'Electron',
      items: [
        {
          text: 'Electron 简介',
          link: '/special/electron/intro',
        },
        {
          text: 'Electron 快速开始',
          link: '/special/electron/start',
        },
        {
          text: 'electron-vite',
          link: '/special/electron/electron-vite',
        },
        {
          text: 'Electron 进程模型',
          link: '/special/electron/process-model',
        },
        {
          text: 'Electron 主进程',
          link: '/special/electron/main-process',
        },
        {
          text: 'Electron 渲染进程',
          link: '/special/electron/renderer-process',
        },
        {
          text: 'Electron 进程通信',
          link: '/special/electron/ipc',
        },
        {
          text: 'Electron BrowserWindow',
          link: '/special/electron/browser-window',
        },
        {
          text: 'Electron Node',
          link: '/special/electron/node-integration',
        },
        {
          text: 'Electron 安全',
          link: '/special/electron/security',
        },
        {
          text: 'Electron 系统功能开发',
          link: '/special/electron/system',
        },
        {
          text: 'Electron 硬件功能开发',
          link: '/special/electron/hardware',
        },
        {
          text: 'Electron 集成前端框架',
          link: '/special/electron/ui-framework',
        },
        {
          text: 'Electron 调试',
          link: '/special/electron/debug',
        },
        {
          text: 'Electron 日志系统',
          link: '/special/electron/log',
        },
        {
          text: 'Electron 性能优化',
          link: '/special/electron/performance',
        },
        {
          text: 'Electron 打包',
          link: '/special/electron/build',
        },
        {
          text: 'Electron 发布与更新',
          link: '/special/electron/publish',
        },
        {
          text: 'Electron 集成 C++/Rust/NAPI',
          link: '/special/electron/native',
        },
        {
          text: 'Electron 集成 WebAssembly',
          link: '/special/electron/wasm',
        },
        {
          text: 'Electron 运行 Python/Go/Java',
          link: '/special/electron/scripts',
        },
      ],
    },
    {
      text: '命令行开发',
      items: [
        {
          text: '简介',
          link: '/special/cli/intro',
        },
        {
          text: '脚本与命令',
          link: '/special/cli/run',
        },
        {
          text: '参数处理',
          link: '/special/cli/args',
        },
        {
          text: '配置管理',
          link: '/special/cli/config',
        },
        {
          text: '输入',
          link: '/special/cli/input',
        },
        { text: '输出与美化', link: '/special/cli/output' },
        {
          text: '进程控制',
          link: '/special/cli/progress',
        },
        {
          text: '日志系统',
          link: '/special/cli/log',
        },
        { text: '跨平台兼容', link: '/special/cli/cross-platform' },
        {
          text: '测试',
          link: '/special/cli/test',
        },
        {
          text: '构建',
          link: '/special/cli/build',
        },
        {
          text: '发布',
          link: '/special/cli/publish',
        },
      ],
    },
    {
      text: 'Web 安全',
      items: [
        {
          text: 'Web 安全简介',
          link: '/special/security/intro',
        },
        {
          text: 'OWASP Top 10 概述',
          link: '/special/security/owasp-top10',
        },
        {
          text: '常见 Web 攻击与防护',
          link: '/special/security/attacks',
        },
        {
          text: '浏览器安全模型',
          link: '/special/security/browser-model',
        },
        {
          text: '前端代码混淆',
          link: '/special/security/sourcemap',
        },
        {
          text: '认证与授权',
          link: '/special/security/authority',
        },
        {
          text: '后端安全实践',
          link: '/special/security/backend',
        },
        {
          text: '防火墙',
          link: '/special/security/waf',
        },
        {
          text: 'API 安全',
          link: '/special/security/api-security',
        },
        {
          text: 'DDoS 防护',
          link: '/special/security/ddos',
        },
        {
          text: '云安全与权限管理（IAM）',
          link: '/special/security/cloud-iam',
        },
        {
          text: '渗透测试基础',
          link: '/special/security/pentest',
        },
        {
          text: '安全测试工具',
          link: '/special/security/tools',
        },
        {
          text: '漏洞扫描与依赖审计',
          link: '/special/security/scanning',
        },
        {
          text: '安全日志分析',
          link: '/special/security/log-analysis',
        },
      ],
    },
  ],
  '/leading/': [
    {
      text: 'WebAssembly',
      items: [
        { text: 'WASM 基础', link: '/leading/webassembly/basic' },
        {
          text: 'WASM 设计哲学',
          link: '/leading/webassembly/design-philosophy',
        },
        {
          text: 'WASM 快速开始',
          link: '/leading/webassembly/start',
        },
        {
          text: 'WASM 与 JS 交互',
          link: '/leading/webassembly/js-interaction',
        },
        { text: 'WASM 工具链', link: '/leading/webassembly/toolchain' },
        {
          text: 'WASM 与 Rust',
          link: '/leading/webassembly/wasm-rust',
        },
        {
          text: 'WASM 与 其他语言',
          link: '/leading/webassembly/other-languages',
        },
        {
          text: 'WASM 内部模块',
          link: '/leading/webassembly/module-structure',
        },
        {
          text: 'WASM 栈式虚拟机与指令集',
          link: '/leading/webassembly/stack-vm-and-instructions',
        },
        {
          text: 'WASM 线性内存模型',
          link: '/leading/webassembly/linear-memory',
        },
        {
          text: 'WASM 系统接口（WASI）',
          link: '/leading/webassembly/wasi',
        },
        {
          text: 'WASM 服务端',
          link: '/leading/webassembly/server-side',
        },
        {
          text: 'WASM 线程、SIMD与异常处理',
          link: '/leading/webassembly/threads-simd-exceptions',
        },
        {
          text: 'WASM 组件模型',
          link: '/leading/webassembly/component-model',
        },
        {
          text: 'WASM 垃圾回收提案',
          link: '/leading/webassembly/gc-proposal',
        },
        {
          text: 'WASM 未来展望',
          link: '/leading/webassembly/future',
        },
      ],
    },
    {
      text: 'AI & Web',
      items: [
        { text: 'AI 基础概念', link: '/leading/ai-web/intro' },
        { text: 'AI 核心原理', link: '/leading/ai-web/principle' },
        { text: 'AI 生态', link: '/leading/ai-web/ecosystem' },
        { text: 'AI Prompt调优', link: '/leading/ai-web/prompt' },
        { text: 'AI 大模型API', link: '/leading/ai-web/api' },
        { text: 'AI Web对话开发', link: '/leading/ai-web/chat' },
        {
          text: 'AI 在浏览器中运行',
          link: '/leading/ai-web/run-in-browser',
        },
        {
          text: 'TensorFlow.js',
          link: '/leading/ai-web/tensorflow',
        },
        {
          text: 'ONNX',
          link: '/leading/ai-web/onnx',
        },
        {
          text: 'Transformers.js',
          link: '/leading/ai-web/transformers',
        },
        {
          text: '基于AI的Web新交互',
          link: '/leading/ai-web/interaction',
        },
      ],
    },
    {
      text: 'Web3',
      items: [
        { text: 'Web3 简介', link: '/leading/web3/intro' },
        { text: '区块链基础', link: '/leading/web3/blockchain' },
        {
          text: '去中心化存储',
          link: '/leading/web3/decentralized-storage',
        },
        { text: '密码学', link: '/leading/web3/crypto-basics' },
        {
          text: '零知识证明',
          link: '/leading/web3/zero-knowledge-proofs',
        },
        {
          text: '共识机制',
          link: '/leading/web3/consensus',
        },
        { text: '区块链网络', link: '/leading/web3/chain-net' },
        { text: 'Web3 安全', link: '/leading/web3/security' },
        { text: 'Web3 前端基础', link: '/leading/web3/frontend-basic' },
        { text: 'ethers.js', link: '/leading/web3/ethers' },
        {
          text: 'wagmi & viem',
          link: '/leading/web3/wagmi-viem',
        },
        { text: 'DApp 开发', link: '/leading/web3/dapp-development' },
        { text: '智能合约开发', link: '/leading/web3/smart-contracts' },
        { text: '加密货币钱包', link: '/leading/web3/crypto-wallets' },
        { text: 'DeFi 去中心化金融', link: '/leading/web3/defi' },
        { text: 'NFT 技术与应用', link: '/leading/web3/nft' },
        { text: 'DAO 治理模式', link: '/leading/web3/dao' },
        { text: '跨链互操作性', link: '/leading/web3/cross-chain' },
        { text: 'ZK & Layer2', link: '/leading/web3/zk-layer2' },
        { text: '模块化区块链', link: '/leading/web3/modular-blockchain' },
        { text: 'Web3 安全审计', link: '/leading/web3/security-audit' },
        { text: 'Web3 未来展望', link: '/leading/web3/future-outlook' },
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
