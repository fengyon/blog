# 代码规范

代码规范是一套约定俗成的编码规则和标准，用于统一团队成员的代码风格和提高代码质量。它涵盖了命名约定、文件组织、格式要求、注释规范等多个方面，是团队协作和项目可维护性的重要保障。

## 什么是代码规范？

代码规范是开发团队共同遵守的编程约定，确保代码风格一致、结构清晰、易于理解和维护。

```
无规范代码:
function calc(a,b){return a+b}  // 难以阅读
const x=10; const y=20;         // 风格不一致

有规范代码:
function calculateSum(numberA, numberB) {  // 清晰明确
    return numberA + numberB;
}
const firstNumber = 10;
const secondNumber = 20;                   // 统一风格
```

## 为什么需要代码规范？

### 团队协作效率

统一规范减少沟通成本，提高协作效率。

```
团队协作对比:
无规范: [开发者A] -> [风格A] + [开发者B] -> [风格B] = [冲突混乱]
有规范: [开发者A] -> [统一规范] + [开发者B] -> [统一规范] = [和谐高效]
```

### 代码可维护性

规范的代码更易于理解、修改和扩展。

```
维护成本对比:
规范代码: [阅读代码] -> [快速理解] -> [安全修改] -> [低风险]
          |            |            |           |
       结构清晰     意图明确     影响可控     维护高效

混乱代码: [阅读代码] -> [困惑不解] -> [修改困难] -> [高风险]
          |            |            |           |
       结构混乱     意图模糊     影响未知     维护困难
```

## 核心规范内容

### 命名规范

命名是代码可读性的基础。

```
命名规则:
变量: camelCase    userName, itemCount
常量: UPPER_CASE   API_BASE_URL, MAX_ITEMS
函数: camelCase    getUserInfo, calculateTotal
类:   PascalCase   UserService, RequestHandler
文件: kebab-case   user-profile.js, api-service.ts
```

### 文件组织规范

合理的文件结构提升项目可维护性。

```
项目结构:
src/
├── components/     # 组件目录
│   ├── common/    # 通用组件
│   └── business/  # 业务组件
├── hooks/          # 自定义hooks
├── utils/          # 工具函数
├── constants/      # 常量定义
└── styles/         # 样式文件
```

### 代码格式规范

统一的格式使代码整洁美观。

```
格式要求:
缩进:    2个空格或4个空格（团队统一）
分号:    始终使用或始终省略
引号:    单引号或双引号（团队统一）
行宽:    80-120字符
换行:    适当换行，避免过长代码行
```

### 注释规范

恰当的注释提升代码可理解性。

```
注释类型:
文件头注释:   描述文件用途、作者、创建时间
函数注释:     描述功能、参数、返回值
复杂逻辑注释: 解释算法或业务逻辑
TODO注释:     标记待办事项
```

## 规范实施工具

### 代码检查工具

自动化工具确保规范执行。

```
检查工具链:
[ESLint] -> [Prettier] -> [Stylelint] -> [Commitlint]
     |          |            |             |
 JavaScript   代码格式化     CSS检查      提交信息
  检查                      检查          检查
```

### 编辑器配置

统一编辑器设置保证开发环境一致。

```
编辑器统一:
[配置文件] -> [团队共享] -> [自动应用]
     |           |           |
 .editorconfig  版本控制    开发环境一致
```

## 具体规范示例

### JavaScript/TypeScript 规范

现代前端项目的代码规范示例。

```
变量声明:
// 好的实践
const userList = [];
let isLoading = true;

// 避免的做法
var user_list = [];
let is_loading = true;

函数定义:
// 好的实践
function fetchUserData(userId: string): Promise<User> {
    // 函数体
}

// 箭头函数
const formatDate = (date: Date): string => {
    // 函数体
};
```

### CSS 规范

样式代码的组织和命名规范。

```
CSS命名规范:
BEM命名法: block__element--modifier
示例: 
.search-form {}
.search-form__input {}
.search-form__button--disabled {}

组织顺序:
布局属性 -> 盒模型 -> 文本属性 -> 视觉属性
position       width     font-size   background
display        padding   color       border
```

### 组件规范

前端组件的编写规范。

```
组件结构:
[组件定义] -> [Props接口] -> [状态定义] -> [生命周期] -> [事件处理]
     |            |            |            |            |
 函数/类组件    类型声明      useState     useEffect    处理函数
```

## 团队协作规范

### Git 工作流

版本控制的规范流程。

```
Git规范:
分支命名: feature/user-auth, fix/login-error
提交信息: feat: 添加用户登录功能
合并流程: [开发分支] -> [代码审查] -> [测试] -> [主干分支]
```

### 代码审查规范

通过代码审查保证质量。

```
审查流程:
[提交PR] -> [自动化检查] -> [人工审查] -> [修改完善] -> [合并]
     |           |            |           |           |
 功能完成    规范检查       逻辑审查     修复问题     质量保证
```

## 规范配置文件示例

### ESLint 配置

代码检查工具配置。

```javascript
// .eslintrc.js
module.exports = {
    extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended'
    ],
    rules: {
        'no-console': 'warn',
        'prefer-const': 'error',
        'no-unused-vars': 'error'
    }
};
```

### Prettier 配置

代码格式化配置。

```json
// .prettierrc
{
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5"
}
```

## 规范实施策略

### 渐进式采用

在现有项目中逐步引入规范。

```
实施步骤:
[基础规范] -> [工具配置] -> [团队培训] -> [严格执行] -> [持续优化]
     |           |           |           |           |
 选择核心规则  自动化检查  统一认识    代码审查    根据反馈调整
```

### 规范文档化

将规范编写成可查阅的文档。

```
文档结构:
[编码规范] -> [工具配置] -> [最佳实践] -> [常见问题]
     |           |           |           |
 规则说明     环境设置     经验总结     解决方案
```

## 规范的价值体现

### 质量提升

规范代码在多个维度上表现更优。

```
质量对比:
可读性:    [规范代码] >>> [随意代码]
可维护性:  [规范代码] >>> [随意代码]  
可测试性:  [规范代码] >>> [随意代码]
一致性:    [规范代码] >>> [随意代码]
```

### 成本节约

规范在项目生命周期中节约大量成本。

```
成本分析:
短期成本: [学习规范] + [配置工具] = 时间投入
长期收益: [减少Bug] + [提高效率] + [降低维护] = 持续收益
        ↓
   投资回报率显著
```