# 自动测试无障碍

## 自动测试的价值与局限

自动测试通过程序化手段批量检测无障碍问题，能够快速发现约 30-50%的 WCAG 合规问题。其核心原理是将无障碍规则转化为可执行的代码检查，在开发流程的各个阶段捕获问题。

示意图：
```
自动化检测范围:
✅ 可检测: 颜色对比度、图片alt属性、ARIA属性语法、标签关联
❌ 难检测: 上下文语义、逻辑焦点顺序、交互体验质量、认知负荷
```

互补关系：
```
手动测试 + 自动测试 = 完整无障碍质量保障
深度体验验证   +   广度技术合规 = 全面覆盖
```

## 测试工具生态体系

### 核心测试引擎

axe-core 作为行业标准测试引擎的原理：

代码示例 (axe-core 基础使用)：
```javascript
const axe = require('axe-core');

// 基础测试配置
const axeConfig = {
  rules: {
    'color-contrast': { enabled: true },
    'image-alt': { enabled: true },
    'label': { enabled: true },
    'link-name': { enabled: true }
  },
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa']
  }
};

// 执行测试
axe.run(document, axeConfig, (err, results) => {
  if (err) throw err;
  
  console.log(`发现 ${results.violations.length} 个违规问题`);
  
  results.violations.forEach(violation => {
    console.log(`规则: ${violation.id}`);
    console.log(`描述: ${violation.description}`);
    console.log(`影响: ${violation.impact}`);
    
    violation.nodes.forEach(node => {
      console.log(`元素: ${node.html}`);
      console.log(`修复: ${node.failureSummary}`);
    });
  });
});
```

### 工具分类矩阵

```
静态分析工具: ESLint插件、HTML验证器
    ↓
单元测试工具: Jest-axe、Testing Library
    ↓  
集成测试工具: Storybook插件、浏览器扩展
    ↓
端到端测试工具: Cypress-axe、Selenium
    ↓
持续集成: GitHub Actions、GitLab CI
```

## 静态代码分析

### ESLint 无障碍规则

在开发阶段捕获常见的无障碍编码错误。

代码示例 (ESLint 配置)：
```javascript
// .eslintrc.js
module.exports = {
  plugins: ['jsx-a11y'],
  extends: [
    'plugin:jsx-a11y/recommended'
  ],
  rules: {
    // 图片必须有alt文本
    'jsx-a11y/alt-text': ['error', {
      elements: ['img', 'object', 'area', 'input[type="image"]'],
      img: ['Image'],
      object: ['Object'],
      area: ['Area'],
      'input[type="image"]': ['InputImage']
    }],
    
    // 锚点必须有有效href
    'jsx-a11y/anchor-is-valid': ['error', {
      components: ['Link'],
      specialLink: ['hrefLeft', 'hrefRight'],
      aspects: ['invalidHref', 'preferButton']
    }],
    
    // 表单标签必须关联
    'jsx-a11y/label-has-associated-control': ['error', {
      labelComponents: ['CustomLabel'],
      controlComponents: ['CustomInput'],
      assert: 'both',
      depth: 3
    }],
    
    // 交互元素必须有角色
    'jsx-a11y/no-static-element-interactions': ['error', {
      handlers: [
        'onClick',
        'onMouseDown',
        'onMouseUp',
        'onKeyPress',
        'onKeyDown',
        'onKeyUp'
      ]
    }],
    
    // 非交互元素不能有交互处理
    'jsx-a11y/no-noninteractive-element-interactions': ['warn', {
      handlers: [
        'onClick',
        'onMouseDown',
        'onMouseUp',
        'onKeyPress',
        'onKeyDown',
        'onKeyUp'
      ]
    }]
  }
};
```

### HTML 验证器集成

在构建过程中验证 HTML 语义结构。

代码示例 (HTML 验证工具)：
```javascript
// html-validator.js
const { JSDOM } = require('jsdom');
const axe = require('axe-core');

class HTMLAccessibilityValidator {
  constructor(html) {
    this.dom = new JSDOM(html);
    this.document = this.dom.window.document;
  }
  
  async validate() {
    const results = await axe.run(this.document);
    
    return {
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      timestamp: new Date().toISOString()
    };
  }
  
  // 自定义语义验证
  validateSemanticStructure() {
    const issues = [];
    
    // 检查标题层级
    const headings = this.document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    headings.forEach(heading => {
      const currentLevel = parseInt(heading.tagName.substring(1));
      
      if (currentLevel > previousLevel + 1) {
        issues.push({
          type: 'HEADING_SKIP',
          element: heading.outerHTML,
          message: `标题从h${previousLevel}跳到了h${currentLevel}`
        });
      }
      
      previousLevel = currentLevel;
    });
    
    // 检查地标角色
    const landmarks = this.document.querySelectorAll([
      'header', 'footer', 'main', 'nav', 'aside', 'section'
    ].join(','));
    
    landmarks.forEach(landmark => {
      if (!landmark.getAttribute('role') && !['header', 'footer'].includes(landmark.tagName.toLowerCase())) {
        const suggestedRole = this.suggestLandmarkRole(landmark);
        if (suggestedRole) {
          issues.push({
            type: 'MISSING_LANDMARK_ROLE',
            element: landmark.outerHTML,
            message: `建议添加role="${suggestedRole}"`
          });
        }
      }
    });
    
    return issues;
  }
  
  suggestLandmarkRole(element) {
    const tag = element.tagName.toLowerCase();
    const attributes = element.attributes;
    
    if (tag === 'nav') return 'navigation';
    if (tag === 'main') return 'main';
    if (tag === 'aside') return 'complementary';
    if (tag === 'section' && attributes.getNamedItem('aria-label')) return 'region';
    
    return null;
  }
}

// 使用示例
const validator = new HTMLAccessibilityValidator(`
  <!DOCTYPE html>
  <html>
  <body>
    <h1>页面标题</h1>
    <h3>跳过h2的副标题</h3>
    <div>内容区域</div>
  </body>
  </html>
`);

const results = await validator.validate();
console.log('Axe违规:', results.violations.length);
console.log('语义问题:', validator.validateSemanticStructure());
```

## 单元测试与组件测试

### Jest 无障碍测试

为 React/Vue 组件编写无障碍单元测试。

代码示例 (React 组件测试)：
```javascript
// Button.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import Button from './Button';

// 扩展expect以支持无障碍断言
expect.extend(toHaveNoViolations);

describe('Button组件无障碍测试', () => {
  test('通过axe-core合规测试', async () => {
    const { container } = render(
      <Button onClick={() => {}}>
        点击我
      </Button>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('支持键盘交互', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>测试按钮</Button>);

    const button = screen.getByRole('button', { name: '测试按钮' });
    
    // 测试Enter键
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);

    // 测试空格键
    await userEvent.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  test('禁用状态正确设置ARIA属性', () => {
    render(<Button disabled>禁用按钮</Button>);

    const button = screen.getByRole('button', { name: '禁用按钮' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('tabindex', '-1');
  });

  test('加载状态正确宣布', () => {
    render(<Button loading>加载中</Button>);

    const button = screen.getByRole('button', { name: '加载中' });
    expect(button).toHaveAttribute('aria-live', 'polite');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
```

### Vue 组件测试

代码示例 (Vue 3 组件测试)：
```javascript
// Modal.test.js
import { mount } from '@vue/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import Modal from './Modal.vue';

expect.extend(toHaveNoViolations);

describe('Modal组件无障碍测试', () => {
  test('模态框角色和属性正确', async () => {
    const wrapper = mount(Modal, {
      props: {
        isOpen: true,
        title: '测试模态框'
      },
      slots: {
        default: '<p>模态框内容</p>'
      }
    });

    // 检查ARIA属性
    const modal = wrapper.find('[role="dialog"]');
    expect(modal.exists()).toBe(true);
    expect(modal.attributes('aria-labelledby')).toBe('modal-title');
    expect(modal.attributes('aria-modal')).toBe('true');

    // 无障碍合规测试
    const results = await axe(wrapper.element);
    expect(results).toHaveNoViolations();
  });

  test('焦点管理正确', async () => {
    const wrapper = mount(Modal, {
      props: {
        isOpen: true
      },
      attachTo: document.body
    });

    // 检查焦点是否在模态框内
    const focusedElement = document.activeElement;
    expect(wrapper.element.contains(focusedElement)).toBe(true);

    // 检查焦点陷阱
    await wrapper.find('button').trigger('keydown.tab');
    // 应该保持焦点在模态框内
  });
});
```

### Testing Library 最佳实践

使用 Testing Library 进行用户中心的无障碍测试。

代码示例：
```javascript
// form.test.js
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from './ContactForm';

describe('联系表单无障碍测试', () => {
  test('表单标签正确关联', () => {
    render(<ContactForm />);

    // 使用getByLabelText测试标签关联
    const nameInput = screen.getByLabelText(/姓名/i);
    expect(nameInput).toHaveAttribute('type', 'text');

    const emailInput = screen.getByLabelText(/邮箱/i);
    expect(emailInput).toHaveAttribute('type', 'email');

    // 使用getByRole测试按钮
    const submitButton = screen.getByRole('button', { name: /提交/i });
    expect(submitButton).toBeEnabled();
  });

  test('错误验证正确宣布', async () => {
    render(<ContactForm />);
    const user = userEvent.setup();

    // 提交空表单
    const submitButton = screen.getByRole('button', { name: /提交/i });
    await user.click(submitButton);

    // 检查错误消息
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent(/请输入姓名/i);

    // 检查ARIA无效状态
    const nameInput = screen.getByLabelText(/姓名/i);
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('成功提交后焦点管理', async () => {
    render(<ContactForm />);
    const user = userEvent.setup();

    // 填写表单
    await user.type(screen.getByLabelText(/姓名/i), '张三');
    await user.type(screen.getByLabelText(/邮箱/i), 'test@example.com');
    
    // 提交表单
    await user.click(screen.getByRole('button', { name: /提交/i }));

    // 检查成功消息和焦点
    const successMessage = await screen.findByRole('status');
    expect(successMessage).toHaveTextContent(/提交成功/i);
    
    // 焦点应该移动到成功消息
    expect(successMessage).toHaveFocus();
  });
});
```

## 端到端测试

### Cypress 无障碍测试

集成 axe-core 到 Cypress 端到端测试流程。

代码示例 (Cypress 配置和测试)：
```javascript
// cypress/plugins/index.js
const { injectAxe, checkA11y } = require('axe-cypress');

module.exports = (on, config) => {
  on('task', {
    log(message) {
      console.log(message);
      return null;
    }
  });
};

// cypress/support/commands.js
import 'axe-cypress/support';

Cypress.Commands.add('checkAccessibility', (context, options) => {
  cy.injectAxe();
  cy.checkA11y(context, options);
});

Cypress.Commands.add('checkAccessibilityWithThreshold', (impactLevel = 'serious') => {
  cy.injectAxe();
  cy.checkA11y(null, {
    includedImpacts: [impactLevel]
  });
});

// cypress/e2e/accessibility.cy.js
describe('全站无障碍测试', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });

  it('首页应通过无障碍测试', () => {
    cy.checkAccessibility();
  });

  it('关键用户流程无障碍', () => {
    // 测试导航
    cy.get('nav').within(() => {
      cy.checkAccessibility();
    });

    // 测试搜索功能
    cy.get('input[type="search"]').type('测试产品');
    cy.get('button[type="submit"]').click();
    
    cy.checkAccessibility();

    // 测试产品页面
    cy.get('.product-card').first().click();
    cy.checkAccessibility();
  });

  it('表单页面应正确处理验证', () => {
    cy.visit('/contact');
    
    // 测试空表单提交
    cy.get('form').within(() => {
      cy.get('button[type="submit"]').click();
      
      // 检查错误状态
      cy.get('[aria-invalid="true"]').should('exist');
      cy.get('[role="alert"]').should('be.visible');
      
      cy.checkAccessibility();
    });
  });

  it('动态内容应正确宣布', () => {
    cy.visit('/dashboard');
    
    // 触发动态内容更新
    cy.get('[data-testid="load-more"]').click();
    
    // 检查实时区域
    cy.get('[aria-live]').should('contain', '新内容已加载');
    
    cy.checkAccessibility();
  });
});
```

### Playwright 无障碍测试

使用 Playwright 进行跨浏览器无障碍测试。

代码示例：
```javascript
// accessibility.spec.js
const { test, expect } = require('@playwright/test');
const axe = require('axe-core');

// 将axe-core注入页面并运行测试
async function runAxeTest(page, context = null) {
  await page.addScriptTag({ path: require.resolve('axe-core') });
  
  const results = await page.evaluate((evalContext) => {
    return new Promise(resolve => {
      axe.run(evalContext || document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa']
        }
      }, (err, results) => {
        if (err) throw err;
        resolve(results);
      });
    });
  }, context);

  return results;
}

test.describe('无障碍端到端测试', () => {
  test('整个应用应通过WCAG AA标准', async ({ page }) => {
    await page.goto('/');
    
    const results = await runAxeTest(page);
    
    expect(results.violations.length).toBe(0);
    
    // 详细报告
    if (results.violations.length > 0) {
      console.log('无障碍违规:');
      results.violations.forEach(violation => {
        console.log(`- ${violation.id}: ${violation.help}`);
      });
    }
  });

  test('模态框焦点管理', async ({ page }) => {
    await page.goto('/');
    
    // 打开模态框
    await page.click('[data-testid="open-modal"]');
    
    // 检查焦点在模态框内
    const modal = await page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    const focused = await page.evaluate(() => document.activeElement);
    const isFocusInModal = await modal.evaluate((modalEl, focusedEl) => 
      modalEl.contains(focusedEl), focused);
    
    expect(isFocusInModal).toBe(true);
    
    // 测试焦点陷阱
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const stillFocused = await page.evaluate(() => document.activeElement);
    const isStillInModal = await modal.evaluate((modalEl, focusedEl) => 
      modalEl.contains(focusedEl), stillFocused);
    
    expect(isStillInModal).toBe(true);
  });

  test('键盘导航完整性', async ({ page }) => {
    await page.goto('/');
    
    // 获取所有可聚焦元素
    const focusableElements = await page.$$(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    // 测试Tab顺序
    await page.keyboard.press('Tab');
    
    for (let i = 0; i < focusableElements.length; i++) {
      const currentFocus = await page.evaluate(() => 
        document.activeElement.getAttribute('data-testid') || 
        document.activeElement.tagName
      );
      
      console.log(`焦点位置 ${i + 1}: ${currentFocus}`);
      await page.keyboard.press('Tab');
    }
  });
});
```

## 持续集成流水线

### GitHub Actions 集成

在 CI/CD 流水线中自动运行无障碍测试。

代码示例 (GitHub Actions 配置)：
```yaml
# .github/workflows/accessibility.yml
name: Accessibility Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  a11y-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests with a11y
      run: npm test -- --coverage --watchAll=false
    
    - name: Run a11y tests
      run: npm run test:a11y
    
    - name: Build and test production bundle
      run: |
        npm run build
        npx serve -s build -p 3000 &
        sleep 10
        npx wait-on http://localhost:3000
        npm run test:e2e:a11y
    
    - name: Upload a11y report
      uses: actions/upload-artifact@v3
      with:
        name: accessibility-report
        path: |
          a11y-results/
          coverage/
        retention-days: 30

  lighthouse-ci:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install Lighthouse CI
      run: |
        npm install -g @lhci/cli@0.12.x
        npm install -g lighthouse
    
    - name: Run Lighthouse CI
      run: |
        lhci autorun --upload.target=temporary-public-storage
      env:
        LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

### 自定义测试运行器

创建专门的无障碍测试运行器。

代码示例：
```javascript
// a11y-test-runner.js
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { JSDOM } = require('jsdom');
const axe = require('axe-core');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

class A11yTestRunner {
  constructor(options = {}) {
    this.options = {
      outputDir: './a11y-results',
      rules: ['wcag2a', 'wcag2aa'],
      ...options
    };
    
    this.results = [];
  }
  
  async testHTMLFile(filePath) {
    const html = await readFile(filePath, 'utf8');
    const dom = new JSDOM(html);
    
    const results = await axe.run(dom.window.document, {
      runOnly: {
        type: 'tag',
        values: this.options.rules
      }
    });
    
    const result = {
      file: filePath,
      timestamp: new Date().toISOString(),
      ...results
    };
    
    this.results.push(result);
    return result;
  }
  
  async testURL(url) {
    // 使用puppeteer或playwright测试真实URL
    const axios = require('axios');
    const response = await axios.get(url);
    return this.testHTMLString(response.data, url);
  }
  
  async testHTMLString(html, source = 'unknown') {
    const dom = new JSDOM(html);
    const results = await axe.run(dom.window.document, {
      runOnly: {
        type: 'tag',
        values: this.options.rules
      }
    });
    
    const result = {
      source,
      timestamp: new Date().toISOString(),
      ...results
    };
    
    this.results.push(result);
    return result;
  }
  
  generateReport() {
    const report = {
      summary: this.getSummary(),
      details: this.results,
      timestamp: new Date().toISOString()
    };
    
    return report;
  }
  
  getSummary() {
    let totalViolations = 0;
    let totalPasses = 0;
    const violationsByRule = {};
    
    this.results.forEach(result => {
      totalViolations += result.violations.length;
      totalPasses += result.passes.length;
      
      result.violations.forEach(violation => {
        violationsByRule[violation.id] = 
          (violationsByRule[violation.id] || 0) + 1;
      });
    });
    
    return {
      totalTests: this.results.length,
      totalViolations,
      totalPasses,
      violationsByRule,
      complianceRate: ((totalPasses - totalViolations) / totalPasses * 100).toFixed(2)
    };
  }
  
  async saveReport() {
    const report = this.generateReport();
    const filename = `a11y-report-${Date.now()}.json`;
    const filepath = path.join(this.options.outputDir, filename);
    
    await writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`报告已保存: ${filepath}`);
    
    return filepath;
  }
}

// 使用示例
async function main() {
  const runner = new A11yTestRunner();
  
  // 测试本地HTML文件
  await runner.testHTMLFile('./dist/index.html');
  
  // 测试URL
  await runner.testURL('http://localhost:3000');
  
  // 生成报告
  await runner.saveReport();
  
  const summary = runner.getSummary();
  console.log('测试完成:', summary);
  
  // 如果存在严重违规，退出码为1
  if (summary.totalViolations > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
```

## 可视化与报告

### 交互式报告仪表板

创建可视化的无障碍测试报告。

代码示例 (HTML 报告生成器)：
```javascript
// a11y-reporter.js
class A11yReporter {
  static generateHTMLReport(data) {
    return `
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>无障碍测试报告</title>
    <style>
        .report { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metric { display: inline-block; margin-right: 30px; }
        .metric-value { font-size: 24px; font-weight: bold; }
        .violations { margin-top: 30px; }
        .violation { border: 1px solid #ddd; margin-bottom: 15px; padding: 15px; border-radius: 4px; }
        .violation.critical { border-left: 4px solid #e74c3c; }
        .violation.serious { border-left: 4px solid #e67e22; }
        .violation.moderate { border-left: 4px solid #f1c40f; }
        .violation.minor { border-left: 4px solid #3498db; }
        .violation-header { display: flex; justify-content: between; align-items: center; }
        .impact { padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; }
        .impact-critical { background: #e74c3c; }
        .impact-serious { background: #e67e22; }
        .impact-moderate { background: #f1c40f; color: #333; }
        .impact-minor { background: #3498db; }
        .element { background: #f8f9fa; padding: 8px; border-radius: 4px; font-family: monospace; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="report">
        <h1>无障碍测试报告</h1>
        
        <div class="summary">
            <h2>测试概览</h2>
            <div class="metric">
                <div class="metric-value">${data.summary.totalTests}</div>
                <div>测试页面</div>
            </div>
            <div class="metric">
                <div class="metric-value">${data.summary.totalViolations}</div>
                <div>发现问题</div>
            </div>
            <div class="metric">
                <div class="metric-value">${data.summary.complianceRate}%</div>
                <div>合规率</div>
            </div>
        </div>
        
        <div class="violations">
            <h2>详细问题</h2>
            ${this.generateViolationsHTML(data.details)}
        </div>
    </div>
</body>
</html>
    `;
  }
  
  static generateViolationsHTML(details) {
    let html = '';
    
    details.forEach(detail => {
      detail.violations.forEach(violation => {
        html += `
        <div class="violation ${violation.impact}">
            <div class="violation-header">
                <h3>${violation.help}</h3>
                <span class="impact impact-${violation.impact}">
                    ${violation.impact.toUpperCase()}
                </span>
            </div>
            <p>${violation.description}</p>
            <p><strong>帮助文档:</strong> <a href="${violation.helpUrl}">${violation.helpUrl}</a></p>
            
            <h4>影响元素:</h4>
            ${violation.nodes.map(node => `
                <div class="element">${node.html}</div>
                <p><strong>修复建议:</strong> ${node.failureSummary}</p>
            `).join('')}
        </div>
        `;
      });
    });
    
    return html;
  }
}

// 使用示例
const reportData = require('./a11y-results/a11y-report-1234567890.json');
const htmlReport = A11yReporter.generateHTMLReport(reportData);

require('fs').writeFileSync('./a11y-report.html', htmlReport);
console.log('HTML报告已生成: a11y-report.html');
```

### 趋势分析与监控

跟踪无障碍合规性的长期趋势。

代码示例 (趋势分析)：
```javascript
// a11y-trends.js
class A11yTrendAnalyzer {
  constructor() {
    this.history = [];
  }
  
  addDailyReport(report) {
    this.history.push({
      date: new Date().toISOString().split('T')[0],
      ...report.summary
    });
    
    // 保持最近90天的数据
    if (this.history.length > 90) {
      this.history.shift();
    }
  }
  
  getComplianceTrend() {
    return this.history.map(day => ({
      date: day.date,
      complianceRate: parseFloat(day.complianceRate),
      violations: day.totalViolations
    }));
  }
  
  generateTrendChart() {
    const trendData = this.getComplianceTrend();
    
    // 使用Chart.js或类似库生成图表
    return {
      type: 'line',
      data: {
        labels: trendData.map(d => d.date),
        datasets: [
          {
            label: '合规率 (%)',
            data: trendData.map(d => d.complianceRate),
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            fill: true
          },
          {
            label: '问题数量',
            data: trendData.map(d => d.violations),
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            fill: true,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: '合规率 (%)'
            }
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            title: {
              display: true,
              text: '问题数量'
            }
          }
        }
      }
    };
  }
  
  predictFutureCompliance() {
    if (this.history.length < 7) return null;
    
    const recentData = this.history.slice(-7);
    const rates = recentData.map(d => parseFloat(d.complianceRate));
    
    // 简单线性回归预测
    const n = rates.length;
    const xSum = (n * (n - 1)) / 2;
    const ySum = rates.reduce((sum, rate) => sum + rate, 0);
    const xySum = rates.reduce((sum, rate, i) => sum + rate * i, 0);
    const xSquaredSum = rates.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;
    
    return {
      current: rates[rates.length - 1],
      predicted: intercept + slope * (n + 1),
      trend: slope > 0 ? 'improving' : slope < 0 ? 'declining' : 'stable'
    };
  }
}

// 使用示例
const analyzer = new A11yTrendAnalyzer();

// 添加每日报告
analyzer.addDailyReport({
  summary: {
    totalTests: 15,
    totalViolations: 3,
    totalPasses: 287,
    complianceRate: '98.96'
  }
});

console.log('合规趋势:', analyzer.getComplianceTrend());
console.log('预测:', analyzer.predictFutureCompliance());
```