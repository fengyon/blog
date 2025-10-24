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
      { text: 'html', link: '/basic/html/intro' },
      { text: 'css', link: '/basic/css/basic' },
      { text: 'javascript', link: '/basic/javascript/basic/introduction' },
      { text: 'es6', link: '/basic/es6/intro' },
      { text: 'DOM', link: '/basic/dom/intro' },
      { text: 'BOM', link: '/basic/bom/engine' },
      { text: 'webapi', link: '/basic/webapi/canvas' },
      { text: 'typescript', link: '/basic/typescript/intro' },
    ],
  },
  {
    text: '框架',
    activeMatch: `^/framework/`,
    items: [{ text: 'react', link: '/framework/react/intro' }],
  },
]

export const sidebar: ThemeConfig['sidebar'] = {
  '/basic/': [
    {
      text: 'html',
      items: [
        {
          text: 'HTML 语言简介',
          link: 'basic/html/intro',
        },
        {
          text: 'URL 简介',
          link: 'basic/html/url',
        },
        {
          text: '网页元素的属性',
          link: 'basic/html/attribute',
        },
        {
          text: 'HTML 字符编码',
          link: 'basic/html/encode',
        },
        {
          text: '网页的语义结构',
          link: 'basic/html/semantic',
        },
        {
          text: '文本标签',
          link: 'basic/html/text',
        },
        {
          text: '列表标签',
          link: 'basic/html/list',
        },
        {
          text: '图像标签',
          link: 'basic/html/image',
        },
        {
          text: '<a>',
          link: 'basic/html/a',
        },
        {
          text: '<link>',
          link: 'basic/html/link',
        },
        {
          text: '<script>，<noscript>',
          link: 'basic/html/script',
        },
        {
          text: '多媒体标签',
          link: 'basic/html/multimedia',
        },
        {
          text: 'iframe',
          link: 'basic/html/iframe',
        },
        {
          text: '表格标签',
          link: 'basic/html/table',
        },
        {
          text: '表单标签',
          link: 'basic/html/form',
        },
        {
          text: '移动设备网页设计',
          link: 'basic/html/mobile',
        },
        {
          text: '其他标签',
          link: 'basic/html/elements',
        },
      ],
    },
    {
      text: 'css',
      items: [
        { text: 'css 基础', link: 'basic/css/basic' },
        {
          text: 'css 选择器',
          link: 'basic/css/selector',
        },
        {
          text: 'css 盒模型',
          link: 'basic/css/box-model',
        },
        {
          text: '布局与响应式',
          link: 'basic/css/layout',
        },
        {
          text: 'css 动画',
          link: 'basic/css/animation',
        },
        {
          text: 'Transform 3D',
          link: 'basic/css/transform-3d',
        },
      ],
    },
    {
      text: 'javascript',
      items: [
        { text: '导论', link: 'basic/javascript/basic/introduction' },
        {
          text: 'JavaScript 语言的历史',
          link: 'basic/javascript/basic/history',
        },
        {
          text: 'JavaScript 的基本语法',
          link: 'basic/javascript/basic/grammar',
        },
        { text: '数据类型概述', link: 'basic/javascript/types/general' },
        {
          text: 'null, undefined 和布尔值',
          link: 'basic/javascript/types/null-undefined-boolean',
        },
        { text: '数值', link: 'basic/javascript/types/number' },
        { text: '字符串', link: 'basic/javascript/types/string' },
        { text: '对象', link: 'basic/javascript/types/object' },
        { text: '函数', link: 'basic/javascript/types/function' },
        { text: '数组', link: 'basic/javascript/types/array' },
        {
          text: '算术运算符',
          link: 'basic/javascript/operators/arithmetic',
        },
        {
          text: '比较运算符',
          link: 'basic/javascript/operators/comparison',
        },
        { text: '布尔运算符', link: 'basic/javascript/operators/boolean' },
        { text: '二进制位运算符', link: 'basic/javascript/operators/bit' },
        {
          text: '其他运算符，运算顺序',
          link: 'basic/javascript/operators/priority',
        },
        {
          text: '数据类型的转换',
          link: 'basic/javascript/features/conversion',
        },
        { text: '错误处理机制', link: 'basic/javascript/features/error' },
        { text: '编程风格', link: 'basic/javascript/features/style' },
        {
          text: 'console 对象与控制台',
          link: 'basic/javascript/features/console',
        },
        { text: 'Object 对象', link: 'basic/javascript/stdlib/object' },
        {
          text: '属性描述对象',
          link: 'basic/javascript/stdlib/attributes',
        },
        { text: 'Array 对象', link: 'basic/javascript/stdlib/array' },
        { text: '包装对象', link: 'basic/javascript/stdlib/wrapper' },
        { text: 'Boolean 对象', link: 'basic/javascript/stdlib/boolean' },
        { text: 'Number 对象', link: 'basic/javascript/stdlib/number' },
        { text: 'String 对象', link: 'basic/javascript/stdlib/string' },
        { text: 'Math 对象', link: 'basic/javascript/stdlib/math' },
        { text: 'Date 对象', link: 'basic/javascript/stdlib/date' },
        { text: 'RegExp 对象', link: 'basic/javascript/stdlib/regexp' },
        { text: 'JSON 对象', link: 'basic/javascript/stdlib/json' },
        { text: '实例对象与 new 命令', link: 'basic/javascript/oop/new' },
        { text: 'this 关键字', link: 'basic/javascript/oop/this' },
        { text: '对象的继承', link: 'basic/javascript/oop/prototype' },
        {
          text: 'Object 对象的相关方法',
          link: 'basic/javascript/oop/object',
        },
        { text: '严格模式', link: 'basic/javascript/oop/strict' },
        { text: '异步操作概述', link: 'basic/javascript/async/general' },
        { text: '定时器', link: 'basic/javascript/async/timer' },
        { text: 'Promise 对象', link: 'basic/javascript/async/promise' },
      ],
    },
    {
      text: 'es6',
      items: [
        { text: 'ECMAScript 6 简介', link: 'basic/es6/intro' },
        { text: 'let 和 const 命令', link: 'basic/es6/let' },
        { text: '变量的解构赋值', link: 'basic/es6/destructuring' },
        { text: '字符串的扩展', link: 'basic/es6/string' },
        { text: '字符串的新增方法', link: 'basic/es6/string-methods' },
        { text: '正则的扩展', link: 'basic/es6/regex' },
        { text: '数值的扩展', link: 'basic/es6/number' },
        { text: '函数的扩展', link: 'basic/es6/function' },
        { text: '数组的扩展', link: 'basic/es6/array' },
        { text: '对象的扩展', link: 'basic/es6/object' },
        { text: '对象的新增方法', link: 'basic/es6/object-methods' },
        { text: '运算符的扩展', link: 'basic/es6/operator' },
        { text: 'Symbol', link: 'basic/es6/symbol' },
        { text: 'Set 和 Map 数据结构', link: 'basic/es6/set-map' },
        { text: 'Proxy', link: 'basic/es6/proxy' },
        { text: 'Reflect', link: 'basic/es6/reflect' },
        { text: 'Promise 对象', link: 'basic/es6/promise' },
        { text: 'Iterator 和 for...of 循环', link: 'basic/es6/iterator' },
        { text: 'Generator 函数的语法', link: 'basic/es6/generator' },
        {
          text: 'Generator 函数的异步应用',
          link: 'basic/es6/generator-async',
        },
        { text: 'async 函数', link: 'basic/es6/async' },
        { text: '函数式编程', link: 'basic/es6/fp' },
        { text: 'Class 的基本语法', link: 'basic/es6/class' },
        { text: 'Class 的继承', link: 'basic/es6/class-extends' },
        { text: 'Mixin', link: 'basic/es6/mixin' },
        { text: 'Module 的语法', link: 'basic/es6/module' },
        { text: 'Module 的加载实现', link: 'basic/es6/module-loader' },
        { text: '编程风格', link: 'basic/es6/style' },
        { text: '读懂 ECMAScript 规格', link: 'basic/es6/spec' },
        { text: '异步遍历器', link: 'basic/es6/async-iterator' },
        { text: 'ArrayBuffer', link: 'basic/es6/arraybuffer' },
        { text: '最新提案', link: 'basic/es6/proposals' },
        { text: 'SIMD', link: 'basic/es6/simd' },
        { text: '参考链接', link: 'basic/es6/reference' },
        { text: '装饰器', link: 'basic/es6/decorator' },
      ],
    },
    {
      text: 'DOM',
      items: [
        { text: 'DOM 介绍', link: 'basic/dom/intro' },
        { text: 'Node 接口', link: 'basic/dom/node' },
        {
          text: 'NodeList 接口，HTMLCollection 接口',
          link: 'basic/dom/nodelist',
        },
        // { text: 'DOM 操作', link: 'basic/dom/operation' },
        {
          text: 'ParentNode 接口，ChildNode 接口',
          link: 'basic/dom/parentnode',
        },
        { text: 'Document 节点', link: 'basic/dom/document' },
        { text: 'Element 节点', link: 'basic/dom/element' },
        { text: '属性的操作', link: 'basic/dom/attributes' },
        {
          text: 'Text 节点和 DocumentFragment 节点',
          link: 'basic/dom/text',
        },
        { text: 'CSS 操作', link: 'basic/dom/css' },
        {
          text: 'Mutation Observer API',
          link: 'basic/dom/mutationobserver',
        },
        {
          text: 'EventTarget 接口',
          link: 'basic/dom/events/eventtarget',
        },
        { text: '事件模型', link: 'basic/dom/events/model' },
        { text: 'Event 对象', link: 'basic/dom/events/event' },
        { text: '鼠标事件', link: 'basic/dom/events/mouse' },
        { text: '键盘事件', link: 'basic/dom/events/keyboard' },
        { text: '进度事件', link: 'basic/dom/events/progress' },
        { text: '表单事件', link: 'basic/dom/events/form' },
        { text: '触摸事件', link: 'basic/dom/events/touch' },
        { text: '拖拉事件', link: 'basic/dom/events/drag' },
        { text: '其他常见事件', link: 'basic/dom/events/common' },
        {
          text: 'GlobalEventHandlers 接口',
          link: 'basic/dom/events/globaleventhandlers',
        },
        { text: '<a> 元素', link: 'basic/dom/elements/a' },
        { text: '<img> 元素', link: 'basic/dom/elements/image' },
        { text: '<form> 元素', link: 'basic/dom/elements/form' },
        { text: '<input> 元素', link: 'basic/dom/elements/input' },
        {
          text: '<button> 元素',
          link: 'basic/dom/elements/button',
        },
        {
          text: '<option> 元素',
          link: 'basic/dom/elements/option',
        },
        {
          text: '<video>，<audio>',
          link: 'basic/dom/elements/video',
        },
      ],
    },
    {
      text: 'BOM',
      items: [
        { text: '浏览器环境概述', link: 'basic/bom/engine' },
        { text: 'window 对象', link: 'basic/bom/window' },
        {
          text: 'Navigator 对象，Screen 对象。',
          link: 'basic/bom/navigator',
        },
        { text: 'Cookie', link: 'basic/bom/cookie' },
        {
          text: 'XMLHttpRequest 对象',
          link: 'basic/bom/xmlhttprequest',
        },
        { text: '同源限制', link: 'basic/bom/same-origin' },
        { text: 'CORS 通信', link: 'basic/bom/cors' },
        { text: 'Storage 接口', link: 'basic/bom/storage' },
        { text: 'History 对象', link: 'basic/bom/history' },
        {
          text: 'Location 对象，URL 对象，URLSearchParams 对象',
          link: 'basic/bom/location',
        },
        {
          text: 'ArrayBuffer 对象，Blob 对象',
          link: 'basic/bom/arraybuffer',
        },
        {
          text: 'File 对象，FileList 对象，FileReader 对象',
          link: 'basic/bom/file',
        },
        { text: '表单，FormData 对象', link: 'basic/bom/form' },
        { text: 'IndexedDB API', link: 'basic/bom/indexeddb' },
        { text: 'Web Worker', link: 'basic/bom/webworker' },
      ],
    },
    {
      text: 'webapi',
      items: [
        { text: 'Canvas API', link: 'basic/webapi/canvas' },
        {
          text: '剪贴板操作 Clipboard API 教程',
          link: 'basic/webapi/clipboard',
        },
        { text: 'Fetch API 教程', link: 'basic/webapi/fetch' },
        { text: 'FontFace API', link: 'basic/webapi/fontface' },
        { text: 'FormData 对象', link: 'basic/webapi/formdata' },
        { text: 'Geolocation API', link: 'basic/webapi/geolocation' },
        { text: 'Headers 对象', link: 'basic/webapi/headers' },
        {
          text: 'IntersectionObserver',
          link: 'basic/webapi/intersectionObserver',
        },
        {
          text: 'Intl.RelativeTimeFormat',
          link: 'basic/webapi/intl-relativetimeformat',
        },
        {
          text: 'Intl segmenter API',
          link: 'basic/webapi/intl-segmenter',
        },
        {
          text: 'Page Lifecycle API',
          link: 'basic/webapi/page-lifecycle',
        },
        {
          text: 'Page Visibility API',
          link: 'basic/webapi/page-visibility',
        },
        { text: 'Request API', link: 'basic/webapi/request' },
        { text: 'Response API', link: 'basic/webapi/response' },
        {
          text: 'Server-Sent Events',
          link: 'basic/webapi/server-sent-events',
        },
        { text: 'SVG 图像', link: 'basic/webapi/svg' },
        { text: 'URL 对象', link: 'basic/webapi/url' },
        { text: 'URL Pattern API', link: 'basic/webapi/urlpattern' },
        {
          text: 'URLSearchParams 对象',
          link: 'basic/webapi/urlsearchparams',
        },
        { text: 'WebSocket', link: 'basic/webapi/websocket' },
        { text: 'Web Share API', link: 'basic/webapi/web-share-api' },
        {
          text: 'window.postMessage() 方法',
          link: 'basic/webapi/postmessage',
        },
        { text: 'Web Audio API', link: 'basic/webapi/webaudio' },
        { text: 'Web Components', link: 'basic/webapi/webcomponents' },
        { text: 'Service Worker', link: 'basic/webapi/service-worker' },
        { text: 'Offline 应用', link: 'basic/webapi/offline' },
        { text: 'Point lock API', link: 'basic/webapi/pointer-lock' },
      ],
    },
    {
      text: 'typescript',
      items: [
        { link: 'basic/typescript/intro', text: 'TypeScript 语言简介' },
        { text: 'TypeScript 基本用法', link: 'basic/typescript/basic' },
        {
          text: 'any 类型，unknown 类型，never 类型',
          link: 'basic/typescript/any',
        },
        { text: 'TypeScript 的类型系统', link: 'basic/typescript/types' },
        { link: 'basic/typescript/array', text: 'TypeScript 的数组类型' },
        { text: 'TypeScript 的元组类型', link: 'basic/typescript/tuple' },
        {
          text: 'TypeScript 的 symbol 类型',
          link: 'basic/typescript/symbol',
        },
        {
          link: 'basic/typescript/function',
          text: 'TypeScript 的函数类型',
        },
        { link: 'basic/typescript/object', text: 'TypeScript 的对象类型' },
        {
          text: 'TypeScript 的 interface 接口',
          link: 'basic/typescript/interface',
        },
        {
          link: 'basic/typescript/class',
          text: 'TypeScript 的 class 类型',
        },
        { link: 'basic/typescript/generics', text: 'TypeScript 泛型' },
        { link: 'basic/typescript/enum', text: 'TypeScript 的 Enum 类型' },
        { text: 'TypeScript 的类型断言', link: 'basic/typescript/assert' },
        {
          text: 'TypeScript 项目使用 npm 模块',
          link: 'basic/typescript/npm',
        },
        {
          link: 'basic/typescript/namespace',
          text: 'TypeScript namespace',
        },
        { text: 'TypeScript 装饰器', link: 'basic/typescript/decorator' },
        {
          text: '装饰器（旧语法）',
          link: 'basic/typescript/decorator-legacy',
        },
        { text: 'declare 关键字', link: 'basic/typescript/declare' },
        { link: 'basic/typescript/d-ts', text: 'd.ts 类型声明文件' },
        { text: '类型运算', link: 'basic/typescript/type-operations' },
        {
          link: 'basic/typescript/mapping',
          text: 'TypeScript 的类型映射',
        },
        { link: 'basic/typescript/utility', text: 'TypeScript 类型工具' },
        {
          text: 'TypeScript 的 React 支持',
          link: 'basic/typescript/react',
        },
        {
          text: 'TypeScript 的注释指令',
          link: 'basic/typescript/comment',
        },
        { link: 'basic/typescript/tsconfig-json', text: 'tsconfig.json' },
        { link: 'basic/typescript/tsc', text: 'tsc 命令行编译器' },
        {
          link: 'basic/typescript/operator',
          text: 'TypeScript 类型运算符',
        },
        {
          text: 'TypeScript 类型缩小',
          link: 'basic/typescript/narrowing',
        },
        { link: 'basic/typescript/module', text: 'TypeScript 模块' },
        { text: 'TypeScript 的 ES6 类型', link: 'basic/typescript/es6' },
      ],
    },
  ],
  '/framework': [
    {
      text: 'React',
      items: [
        {
          text: 'React 简介',
          link: 'framework/react/intro',
        },
        {
          text: 'React 快速开始',
          link: 'framework/react/start',
        },
        {
          text: 'React 组件',
          link: 'framework/react/component',
        },
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

function inlineScript(file: string): HeadConfig {
  return [
    'script',
    {},
    fs.readFileSync(
      path.resolve(__dirname, `./inlined-scripts/${file}`),
      'utf-8',
    ),
  ]
}

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
    [
      'script',
      {
        defer: '',
        src: 'https://static.cloudflareinsights.com/beacon.min.js',
        'data-cf-beacon': '{"token": "e8fc654435194636b86a9910ac4e1335"}',
      },
    ],
    inlineScript('clarity-analytics.js'),
  ],

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
      copyright: '本文档采用 知识共享 4.0 许可证。',
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
