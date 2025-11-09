# 代码测试

代码测试是软件开发过程中的关键实践，通过自动化验证代码的正确性、可靠性和性能。在前端开发中，测试帮助确保用户界面交互的正确性、组件的可靠性和应用的稳定性，是现代前端工程化不可或缺的组成部分。

## 什么是代码测试？

代码测试是通过编写额外的代码来验证目标代码是否按预期工作的过程。

```
测试基本原理:
[编写代码] -> [编写测试] -> [运行测试] -> [验证结果]
      |           |           |           |
 实现功能     描述预期     自动执行     检查是否符合
           行为             预期
```

## 测试金字塔

测试金字塔描述了不同粒度测试的合理分布。

```
测试金字塔:
        /\
       /  \      [端到端测试] - 少量，覆盖关键用户流程
      /----\
     /      \     [集成测试] - 中等数量，验证模块协作
    /--------\
   /          \   [单元测试] - 大量，保证基础单元正确性
  /____________\
```

## 测试类型

### 单元测试

测试独立的代码单元，通常是函数或组件。

```
单元测试范围:
[输入] -> [被测单元] -> [输出]
   |          |          |
测试数据    函数/组件   验证结果
```

### 集成测试

测试多个单元如何协作。

```
集成测试范围:
[单元A] -> [单元B] -> [单元C]
   |         |         |
验证模块    数据传递   整体行为
间交互
```

### 端到端测试

模拟真实用户操作，测试完整应用流程。

```
端到端测试流程:
[启动应用] -> [用户操作] -> [验证结果]
     |           |           |
 打开浏览器    点击输入     页面状态
```

## 测试工具生态

### 测试框架

```
主流测试框架:
Jest:      [全能型] -> [零配置] -> [快照测试] -> [广泛使用]
Vitest:    [基于Vite] -> [快速] -> [ESM优先] -> [现代选择]
Mocha:     [灵活] -> [丰富插件] -> [浏览器支持] -> [传统项目]
```

### 断言库

```
断言库对比:
Jest内置:    expect(value).toBe(expected)
Chai:        expect(value).to.equal(expected)
Node内置:    assert.strictEqual(value, expected)
```

### 测试工具集

```
测试工具链:
[测试框架] -> [断言库] -> [模拟库] -> [覆盖率工具]
     |           |           |           |
 Jest/Vitest   Jest/Chai   Jest/Sinon   Istanbul
```

## 单元测试实践

### 函数测试

测试纯函数的输入输出关系。

```javascript
// 被测函数
function add(a, b) {
    return a + b;
}

// 测试用例
test('应该正确计算两个数字的和', () => {
    expect(add(2, 3)).toBe(5);
    expect(add(-1, 1)).toBe(0);
});
```

### 组件测试

测试 UI 组件的渲染和行为。

```javascript
// React组件测试
test('按钮组件应该渲染正确的文本', () => {
    render(<Button>点击我</Button>);
    expect(screen.getByText('点击我')).toBeInTheDocument();
});

test('按钮点击应该触发回调', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>点击</Button>);
    
    fireEvent.click(screen.getByText('点击'));
    expect(handleClick).toHaveBeenCalledTimes(1);
});
```

## 集成测试实践

### API 集成测试

测试前端与后端 API 的交互。

```javascript
test('应该成功获取用户数据', async () => {
    // 模拟API响应
    fetchMock.mockResponseOnce(JSON.stringify({ user: 'Alice' }));
    
    const user = await fetchUser(123);
    expect(user).toEqual({ user: 'Alice' });
    expect(fetchMock).toHaveBeenCalledWith('/api/users/123');
});
```

### 组件集成测试

测试多个组件如何协同工作。

```javascript
test('搜索组件应该过滤列表', () => {
    render(
        <div>
            <SearchBox onSearch={setFilter} />
            <UserList filter={filter} />
        </div>
    );
    
    // 输入搜索词
    fireEvent.change(screen.getByPlaceholderText('搜索'), {
        target: { value: 'Alice' }
    });
    
    // 验证列表过滤
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
});
```

## 端到端测试实践

### 用户流程测试

测试完整的用户操作流程。

```javascript
test('用户应该能够完成登录流程', async () => {
    // 启动浏览器访问应用
    await page.goto('https://example.com/login');
    
    // 填写登录表单
    await page.type('#username', 'testuser');
    await page.type('#password', 'password123');
    await page.click('#login-button');
    
    // 验证登录成功
    await page.waitForNavigation();
    expect(await page.url()).toContain('/dashboard');
    expect(await page.$('.welcome-message')).not.toBeNull();
});
```

## 测试配置与组织

### 测试文件结构

```
测试文件组织:
src/
├── components/
│   ├── Button/
│   │   ├── Button.jsx
│   │   └── Button.test.jsx
├── utils/
│   ├── format.js
│   └── format.test.js
└── __tests__/          # 或统一放在tests目录
    ├── integration/
    └── e2e/
```

### 测试配置

```javascript
// jest.config.js
module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
    collectCoverageFrom: [
        'src/**/*.{js,jsx}',
        '!src/index.js'
    ]
};
```

## 测试最佳实践

### 测试编写原则

```
好的测试特征:
[独立性] -> [可重复性] -> [及时性] -> [简洁性]
     |           |           |           |
 不依赖外部    每次结果一致  与开发同步   易于理解
  状态
```

### 测试命名规范

```
测试命名模式:
描述性: "应该正确计算商品总价"
行为驱动: "当用户点击按钮时，应该显示模态框"
给定-当-那么: "给定用户已登录，当访问个人中心，那么显示用户信息"
```

## 测试覆盖率

### 覆盖率指标

```
覆盖率类型:
行覆盖率:    执行了多少行代码
分支覆盖率:   覆盖了多少条件分支
函数覆盖率:   调用了多少函数
语句覆盖率:   执行了多少语句
```

### 覆盖率报告

```
覆盖率目标:
[运行测试] -> [收集数据] -> [生成报告] -> [分析改进]
     |           |           |           |
 执行用例     跟踪执行     可视化展示   提升覆盖率
```

## 测试工作流集成

### 开发阶段

```
开发时测试:
[编写代码] -> [运行测试] -> [快速反馈] -> [修复问题]
     |           |           |           |
 TDD/BDD     即时验证     立即发现     立即解决
```

### 持续集成

```
CI集成:
[代码提交] -> [自动测试] -> [生成报告] -> [部署决策]
     |           |           |           |
 触发流水线    全量测试     质量评估     通过才部署
```

## 测试策略选择

### 项目阶段适配

```
测试策略演进:
初创项目:    [重点单元测试] -> [核心集成测试] -> [关键E2E测试]
        |               |               |
     快速迭代       保证基础质量     验证核心流程

成熟项目:    [全面单元测试] -> [完整集成测试] -> [完整E2E测试]
        |               |               |
     质量稳定       模块协作可靠     用户体验保障
```

### 技术栈适配

```
框架特定测试:
React:      [React Testing Library] -> [Jest] -> [Cypress]
Vue:        [Vue Test Utils] -> [Vitest] -> [Playwright]
Angular:    [Jasmine/Karma] -> [Protractor] -> [Cypress]
```