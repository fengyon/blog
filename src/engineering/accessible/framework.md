# 无障碍框架

## 什么是无障碍框架

无障碍框架是系统化的工具集合和设计模式，用于在整个产品开发周期中系统性地实现和保障无障碍性。不同于零散的修复，框架从架构层面将无障碍集成到组件库、设计系统和开发流程中。

示意图：
```
传统方式: 开发 → 测试 → 发现无障碍问题 → 修复
框架方式: 设计系统 + 组件库 + 开发工具 → 无障碍内建 → 持续验证
```

核心原理：通过标准化、自动化和系统集成，将无障碍从后期修复转变为前期预防，确保一致性并降低实施成本。

## 设计系统集成

### 无障碍设计令牌

在设计系统中定义无障碍相关的设计决策。

代码示例：
```scss
// 无障碍设计令牌
:root {
  // 色彩对比度保证
  --color-text-primary: #333333;
  --color-text-secondary: #666666;
  --color-background: #ffffff;
  --color-primary: #0056b3;
  
  // 间距和尺寸标准
  --spacing-focus-ring: 2px;
  --size-touch-target: 44px;
  --border-focus: 2px solid var(--color-primary);
  
  // 动画和过渡
  --duration-motion: 0.3s;
  --timing-function: ease-in-out;
  
  // 高对比度模式支持
  @media (prefers-contrast: high) {
    --color-primary: #000000;
    --border-focus: 3px solid #000000;
  }
  
  // 减少动画偏好
  @media (prefers-reduced-motion: reduce) {
    --duration-motion: 0.01s;
  }
}
```

### 组件级无障碍规范

在设计系统中定义组件的无障碍要求。

代码示例（设计系统文档）：
```markdown
## 按钮组件无障碍规范

### 必需属性
- `role="button"` (自定义按钮时)
- `tabindex="0"` (自定义按钮时)
- 可见的焦点指示器
- 最小44×44px触摸目标

### 键盘交互
- Enter/Space激活
- 支持程序化焦点管理

### 屏幕阅读器
- 有意义的可访问名称
- 状态变化通知 (aria-pressed等)

### 视觉设计
- 文本对比度 ≥ 4.5:1
- 非文本对比度 ≥ 3:1
```

## 组件库实现

### 基础无障碍组件

创建具有内置无障碍支持的React组件。

代码示例（React按钮组件）：
```jsx
import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const AccessibleButton = React.forwardRef(({
  children,
  onClick,
  disabled = false,
  pressed = false,
  ariaLabel,
  className,
  ...props
}, ref) => {
  const internalRef = useRef();
  const buttonRef = ref || internalRef;

  // 处理键盘交互
  const handleKeyDown = (event) => {
    if (disabled) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (event.key === ' ') {
        // 防止空格键滚动页面
        event.preventDefault();
      }
      onClick?.(event);
    }
  };

  // 程序化焦点管理
  useEffect(() => {
    if (props.autoFocus && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [props.autoFocus, buttonRef]);

  return (
    <button
      ref={buttonRef}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-pressed={pressed}
      aria-label={ariaLabel}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      className={`
        accessible-button 
        ${disabled ? 'accessible-button--disabled' : ''}
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </button>
  );
});

AccessibleButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  pressed: PropTypes.bool,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  autoFocus: PropTypes.bool
};

export default AccessibleButton;
```

### 复杂组件框架

实现完整的无障碍复合组件。

代码示例（React标签页组件）：
```jsx
import React, { useState, useEffect, useCallback } from 'react';

const TabContext = React.createContext();

export const TabList = ({ children, label, orientation = 'horizontal' }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const contextValue = {
    selectedIndex,
    setSelectedIndex,
    orientation
  };

  return (
    <div className="tab-list-container">
      <TabContext.Provider value={contextValue}>
        <div
          role="tablist"
          aria-label={label}
          aria-orientation={orientation}
          className="tab-list"
        >
          {children}
        </div>
      </TabContext.Provider>
    </div>
  );
};

export const Tab = ({ index, children, disabled = false }) => {
  const { selectedIndex, setSelectedIndex, orientation } = React.useContext(TabContext);
  const isSelected = index === selectedIndex;
  const tabRef = React.useRef();

  const handleClick = () => {
    if (!disabled) {
      setSelectedIndex(index);
    }
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    const keyActions = {
      ArrowRight: () => orientation === 'horizontal' && setSelectedIndex(prev => (prev + 1) % React.Children.count(children)),
      ArrowLeft: () => orientation === 'horizontal' && setSelectedIndex(prev => (prev - 1 + React.Children.count(children)) % React.Children.count(children)),
      ArrowDown: () => orientation === 'vertical' && setSelectedIndex(prev => (prev + 1) % React.Children.count(children)),
      ArrowUp: () => orientation === 'vertical' && setSelectedIndex(prev => (prev - 1 + React.Children.count(children)) % React.Children.count(children)),
      Home: () => setSelectedIndex(0),
      End: () => setSelectedIndex(React.Children.count(children) - 1)
    };

    if (keyActions[event.key]) {
      event.preventDefault();
      keyActions[event.key]();
    }
  };

  useEffect(() => {
    if (isSelected && tabRef.current) {
      tabRef.current.focus();
    }
  }, [isSelected]);

  return (
    <button
      ref={tabRef}
      role="tab"
      aria-selected={isSelected}
      aria-disabled={disabled}
      tabIndex={isSelected ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`tab ${isSelected ? 'tab--selected' : ''} ${disabled ? 'tab--disabled' : ''}`}
    >
      {children}
    </button>
  );
};

export const TabPanel = ({ index, children }) => {
  const { selectedIndex } = React.useContext(TabContext);
  const isSelected = index === selectedIndex;

  return (
    <div
      role="tabpanel"
      aria-hidden={!isSelected}
      tabIndex={0}
      className={`tab-panel ${isSelected ? 'tab-panel--active' : ''}`}
    >
      {isSelected && children}
    </div>
  );
};
```

使用示例：
```jsx
<TabList label="用户设置">
  <Tab index={0}>个人信息</Tab>
  <Tab index={1}>隐私设置</Tab>
  <Tab index={2}>通知偏好</Tab>
</TabList>

<TabPanel index={0}>个人信息内容...</TabPanel>
<TabPanel index={1}>隐私设置内容...</TabPanel>
<TabPanel index={2}>通知偏好内容...</TabPanel>
```

## 开发工具和SDK

### 无障碍开发SDK

提供开发时使用的工具函数和Hooks。

代码示例（React Hooks）：
```jsx
import { useEffect, useRef } from 'react';

// 焦点管理Hook
export const useFocusManagement = (autoFocus = false) => {
  const ref = useRef();

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus();
    }
  }, [autoFocus]);

  return ref;
};

// 实时区域Hook
export const useLiveRegion = (politeness = 'polite') => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const announce = useCallback((newMessage) => {
    setMessage(newMessage);
  }, []);

  const LiveRegion = () => (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className="visually-hidden"
    >
      {message}
    </div>
  );

  return { announce, LiveRegion };
};

// 键盘导航Hook
export const useKeyboardNavigation = (navigationMap) => {
  const handleKeyDown = useCallback((event) => {
    const handler = navigationMap[event.key];
    if (handler) {
      event.preventDefault();
      handler(event);
    }
  }, [navigationMap]);

  return { handleKeyDown };
};
```

### 开发环境工具

集成到开发流程中的无障碍工具。

代码示例（ESLint插件配置）：
```javascript
// .eslintrc.js
module.exports = {
  plugins: ['jsx-a11y'],
  extends: [
    'plugin:jsx-a11y/recommended'
  ],
  rules: {
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/no-noninteractive-tabindex': 'warn'
  }
};
```

代码示例（VS Code代码片段）：
```json
{
  "Accessible Button": {
    "prefix": "a11y-button",
    "body": [
      "<button",
      "  type=\"button\"",
      "  aria-label=\"${1:button description}\"",
      "  onClick={${2:handleClick}}",
      "  onKeyDown={(e) => {",
      "    if (e.key === 'Enter' || e.key === ' ') {",
      "      e.preventDefault();",
      "      ${2:handleClick}(e);",
      "    }",
      "  }}",
      ">",
      "  ${3:button text}",
      "</button>"
    ],
    "description": "创建无障碍按钮"
  }
}
```

## 测试框架集成

### 单元测试工具

组件级的无障碍测试工具。

代码示例（Jest + Testing Library）：
```javascript
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import AccessibleButton from './AccessibleButton';

expect.extend(toHaveNoViolations);

describe('AccessibleButton', () => {
  test('通过无障碍测试', async () => {
    const { container } = render(
      <AccessibleButton onClick={jest.fn()}>
        测试按钮
      </AccessibleButton>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('支持键盘交互', async () => {
    const handleClick = jest.fn();
    render(
      <AccessibleButton onClick={handleClick}>
        测试按钮
      </AccessibleButton>
    );

    const button = screen.getByRole('button', { name: '测试按钮' });
    button.focus();
    
    // 测试Enter键
    await userEvent.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);

    // 测试空格键
    await userEvent.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  test('禁用状态正确', () => {
    render(
      <AccessibleButton disabled onClick={jest.fn()}>
        禁用按钮
      </AccessibleButton>
    );

    const button = screen.getByRole('button', { name: '禁用按钮' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('tabindex', '-1');
  });
});
```

### 端到端测试框架

集成到E2E测试中的无障碍检查。

代码示例（Cypress测试）：
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

// cypress/integration/accessibility.spec.js
describe('页面无障碍测试', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });

  it('首页应通过无障碍测试', () => {
    cy.checkA11y();
  });

  it('表单页面应通过无障碍测试', () => {
    cy.visit('/form');
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: false } // 临时禁用颜色对比度规则
      }
    });
  });

  it('模态框应正确处理焦点', () => {
    cy.get('[data-testid="open-modal"]').click();
    cy.get('[role="dialog"]').should('be.visible');
    cy.focused().should('have.attr', 'role', 'dialog');
    
    // 测试焦点陷阱
    cy.tab().tab().tab();
    cy.focused().should('have.attr', 'data-testid', 'close-modal');
  });
});
```

## 构建时优化

### 静态分析集成

在构建过程中进行无障碍检查。

代码示例（Webpack插件）：
```javascript
// a11y-webpack-plugin.js
const { axe } = require('axe-core');
const { JSDOM } = require('jsdom');

class A11yWebpackPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapPromise('A11yWebpackPlugin', async (compilation) => {
      const a11yIssues = [];
      
      for (const [filename, source] of Object.entries(compilation.assets)) {
        if (filename.endsWith('.html')) {
          const dom = new JSDOM(source.source());
          const results = await axe.run(dom.window.document);
          
          if (results.violations.length > 0) {
            a11yIssues.push({
              file: filename,
              violations: results.violations
            });
          }
        }
      }
      
      if (a11yIssues.length > 0) {
        console.log('无障碍问题发现:');
        a11yIssues.forEach(({ file, violations }) => {
          console.log(`\n${file}:`);
          violations.forEach(violation => {
            console.log(`- ${violation.help}: ${violation.description}`);
          });
        });
        
        // 在开发模式下警告，生产模式下报错
        if (process.env.NODE_ENV === 'production') {
          throw new Error('构建失败：存在无障碍问题');
        }
      }
    });
  }
}

module.exports = A11yWebpackPlugin;
```

### 自动化修复工具

代码示例（自动ARIA属性添加）：
```javascript
// a11y-auto-fix.js
const cheerio = require('cheerio');

function enhanceAccessibility(html) {
  const $ = cheerio.load(html);
  
  // 自动为自定义按钮添加角色
  $('[onclick]:not(button):not(a):not(input)').each((i, elem) => {
    const $elem = $(elem);
    if (!$elem.attr('role')) {
      $elem.attr('role', 'button');
      $elem.attr('tabindex', '0');
    }
  });
  
  // 为图片添加alt属性
  $('img:not([alt])').each((i, elem) => {
    const $elem = $(elem);
    const isDecorative = $elem.css('display') === 'none' || 
                        $elem.attr('width') === '1' || 
                        $elem.attr('height') === '1';
    
    $elem.attr('alt', isDecorative ? '' : '描述性文本需要手动添加');
  });
  
  return $.html();
}
```

## 监控和分析

### 运行时监控

在生产环境中监控无障碍问题。

代码示例（无障碍监控SDK）：
```javascript
class A11yMonitor {
  constructor() {
    this.issues = [];
    this.setupMonitoring();
  }
  
  setupMonitoring() {
    // 监控焦点管理
    document.addEventListener('focusin', this.handleFocusChange.bind(this));
    
    // 监控键盘交互
    document.addEventListener('keydown', this.handleKeyboardInteraction.bind(this));
    
    // 监控动态内容变化
    this.setupMutationObserver();
  }
  
  handleFocusChange(event) {
    const target = event.target;
    
    // 检查焦点指示器
    const style = window.getComputedStyle(target);
    if (style.outline === 'none' && style.boxShadow === 'none') {
      this.reportIssue('MISSING_FOCUS_INDICATOR', {
        element: target.tagName,
        selector: this.getSelector(target)
      });
    }
  }
  
  handleKeyboardInteraction(event) {
    // 检测可能的键盘陷阱
    if (event.key === 'Tab') {
      const focusableElements = this.getFocusableElements();
      const focusedIndex = focusableElements.indexOf(document.activeElement);
      
      if (focusedIndex === 0 && event.shiftKey) {
        this.reportIssue('POSSIBLE_KEYBOARD_TRAP', {
          selector: this.getSelector(document.activeElement)
        });
      }
    }
  }
  
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'aria-live') {
          this.validateLiveRegion(mutation.target);
        }
      });
    });
    
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['aria-live', 'aria-atomic']
    });
  }
  
  validateLiveRegion(element) {
    const liveValue = element.getAttribute('aria-live');
    if (liveValue && !['polite', 'assertive'].includes(liveValue)) {
      this.reportIssue('INVALID_ARIA_LIVE', {
        value: liveValue,
        selector: this.getSelector(element)
      });
    }
  }
  
  getFocusableElements() {
    return Array.from(document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ));
  }
  
  getSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }
  
  reportIssue(type, data) {
    const issue = {
      type,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    this.issues.push(issue);
    
    // 发送到监控服务
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/a11y-monitor', JSON.stringify(issue));
    }
  }
}

// 初始化监控
if (typeof window !== 'undefined') {
  window.a11yMonitor = new A11yMonitor();
}
```

### 数据分析仪表板

收集和分析无障碍指标。

代码示例（无障碍指标API）：
```javascript
// a11y-metrics-api.js
const express = require('express');
const router = express.Router();

// 存储无障碍指标
const a11yMetrics = {
  totalPages: 0,
  compliantPages: 0,
  commonIssues: {},
  complianceTrend: []
};

router.post('/report', (req, res) => {
  const { pageUrl, violations, timestamp } = req.body;
  
  // 更新指标
  a11yMetrics.totalPages++;
  
  if (violations.length === 0) {
    a11yMetrics.compliantPages++;
  }
  
  // 统计常见问题
  violations.forEach(violation => {
    const issueId = violation.id;
    a11yMetrics.commonIssues[issueId] = 
      (a11yMetrics.commonIssues[issueId] || 0) + 1;
  });
  
  // 计算合规率
  const complianceRate = (a11yMetrics.compliantPages / a11yMetrics.totalPages) * 100;
  a11yMetrics.complianceTrend.push({
    timestamp,
    rate: complianceRate
  });
  
  res.status(200).json({ success: true });
});

router.get('/metrics', (req, res) => {
  res.json({
    complianceRate: (a11yMetrics.compliantPages / a11yMetrics.totalPages) * 100,
    totalScannedPages: a11yMetrics.totalPages,
    commonIssues: Object.entries(a11yMetrics.commonIssues)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count })),
    trend: a11yMetrics.complianceTrend.slice(-30) // 最近30个数据点
  });
});

module.exports = router;
```

## 框架集成模式

### 多框架适配器

为不同前端框架提供统一的无障碍接口。

代码示例（框架适配器）：
```javascript
// a11y-adapter.js
class A11yAdapter {
  static forReact(component) {
    return {
      ...component,
      a11yProps: this.generateA11yProps(component.props)
    };
  }
  
  static forVue(component) {
    return {
      ...component,
      computed: {
        ...component.computed,
        a11yAttributes() {
          return this.generateA11yProps(this.$attrs);
        }
      }
    };
  }
  
  static forAngular(directive) {
    return {
      ...directive,
      host: {
        ...directive.host,
        '[attr.role]': 'role',
        '[attr.aria-label]': 'ariaLabel',
        '[attr.tabindex]': 'tabindex'
      }
    };
  }
  
  static generateA11yProps(props) {
    const a11yProps = {};
    
    if (props.role) {
      a11yProps.role = props.role;
    }
    
    if (props.ariaLabel) {
      a11yProps['aria-label'] = props.ariaLabel;
    }
    
    if (props.disabled) {
      a11yProps['aria-disabled'] = true;
      a11yProps.tabIndex = -1;
    } else {
      a11yProps.tabIndex = 0;
    }
    
    return a11yProps;
  }
}
```

### 微前端无障碍协调

在微前端架构中协调无障碍状态。

代码示例（微前端无障碍管理器）：
```javascript
class MicroFrontendA11yManager {
  constructor() {
    this.applications = new Map();
    this.globalLiveRegions = new Set();
  }
  
  registerApplication(appId, a11yConfig) {
    this.applications.set(appId, {
      config: a11yConfig,
      status: 'active',
      focusTraps: new Set()
    });
  }
  
  setApplicationStatus(appId, status) {
    const app = this.applications.get(appId);
    if (app) {
      app.status = status;
      
      // 更新aria-hidden状态
      this.updateAriaHiddenStates();
    }
  }
  
  updateAriaHiddenStates() {
    const activeApps = Array.from(this.applications.entries())
      .filter(([_, app]) => app.status === 'active');
    
    this.applications.forEach((app, appId) => {
      const isActive = app.status === 'active';
      const appRoot = document.querySelector(`[data-app="${appId}"]`);
      
      if (appRoot) {
        appRoot.setAttribute('aria-hidden', !isActive);
        
        if (!isActive) {
          // 清理非活跃应用的焦点陷阱
          app.focusTraps.clear();
        }
      }
    });
  }
  
  registerFocusTrap(appId, element) {
    const app = this.applications.get(appId);
    if (app && app.status === 'active') {
      app.focusTraps.add(element);
    }
  }
  
  // 协调多个应用间的实时区域
  announce(message, priority = 'polite', appId = 'global') {
    const liveRegion = this.getOrCreateLiveRegion(priority);
    const announcement = document.createElement('div');
    announcement.textContent = `[${appId}] ${message}`;
    
    liveRegion.appendChild(announcement);
    
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 5000);
  }
  
  getOrCreateLiveRegion(priority) {
    const id = `global-live-region-${priority}`;
    let liveRegion = document.getElementById(id);
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = id;
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'false');
      liveRegion.className = 'visually-hidden';
      document.body.appendChild(liveRegion);
      this.globalLiveRegions.add(liveRegion);
    }
    
    return liveRegion;
  }
}

// 全局管理器实例
window.microFrontendA11yManager = new MicroFrontendA11yManager();
```