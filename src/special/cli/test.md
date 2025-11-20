# 测试

## Node.js 命令行测试概述

在 Node.js 命令行工具开发中，测试是确保代码质量、功能正确性和用户体验的关键环节。命令行工具的测试相比普通应用有其特殊性，需要处理进程执行、用户交互、输出验证等复杂场景。

```
测试金字塔结构：
    ↗ 端到端测试 (E2E)
  ↗       集成测试
↗             单元测试

测试覆盖范围：
用户界面 → 业务逻辑 → 外部依赖
  ↓          ↓          ↓
E2E测试  集成测试   单元测试
```

## 测试基础概念

### 测试类型分类

Node.js 命令行测试通常分为三个层次，每个层次关注不同的测试目标：

```javascript
// 测试层次示例
// 单元测试 - 测试独立函数
export function add(a, b) {
  return a + b;
}

// 集成测试 - 测试模块协作
export async function processFile(filePath) {
  const content = await readFile(filePath);
  return transformContent(content);
}

// E2E测试 - 测试完整命令行行为
// 执行: node cli.js process --input file.txt
```

### 测试驱动开发流程

TDD (测试驱动开发) 遵循“红-绿-重构”循环：

```
编写失败测试 → 实现通过代码 → 重构优化
    (红)           (绿)          (优化)
```

## 常用测试框架与库

### Jest - 全功能测试框架

Jest 是 Facebook 开发的测试框架，提供完整的测试解决方案，包括断言库、模拟功能和覆盖率报告。

#### 基础测试配置

```javascript
// jest.config.mjs
export default {
  preset: 'jest-preset-esm',
  extensionsToTreatAsEsm: ['.mjs'],
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.mjs',
    '!src/**/*.test.mjs'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};

// math.test.mjs
import { sum, multiply } from '../src/math.mjs';

describe('数学工具函数', () => {
  test('sum 函数应该正确相加数字', () => {
    expect(sum(1, 2)).toBe(3);
    expect(sum(-1, 1)).toBe(0);
    expect(sum(0, 0)).toBe(0);
  });

  test('multiply 函数应该正确相乘数字', () => {
    expect(multiply(2, 3)).toBe(6);
    expect(multiply(0, 5)).toBe(0);
    expect(multiply(-2, 3)).toBe(-6);
  });

  test('应该处理浮点数运算', () => {
    expect(sum(0.1, 0.2)).toBeCloseTo(0.3);
    expect(multiply(1.5, 2)).toBe(3);
  });
});
```

#### 异步代码测试

```javascript
// async.test.mjs
import { fetchData, processWithRetry } from '../src/async-operations.mjs';

describe('异步操作测试', () => {
  test('fetchData 应该返回解析的数据', async () => {
    const data = await fetchData('https://api.example.com/data');
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('测试数据');
  });

  test('processWithRetry 应该在失败后重试', async () => {
    const mockService = jest.fn()
      .mockRejectedValueOnce(new Error('第一次失败'))
      .mockResolvedValueOnce('成功结果');

    const result = await processWithRetry(mockService, 3);
    
    expect(result).toBe('成功结果');
    expect(mockService).toHaveBeenCalledTimes(2);
  });

  test('应该正确处理拒绝的 Promise', async () => {
    await expect(fetchData('invalid-url'))
      .rejects
      .toThrow('请求失败');
  });
});
```

### Mocha + Chai + Sinon 组合

Mocha 是灵活的测试框架，Chai 提供丰富的断言语法，Sinon 用于测试替身 (spies，stubs，mocks)。

#### 测试套件配置

```javascript
// mocha-setup.mjs
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(sinonChai);
chai.use(chaiAsPromised);

export const { expect } = chai;
export { sinon };

// file-processor.test.mjs
import { expect, sinon } from './mocha-setup.mjs';
import { FileProcessor } from '../src/file-processor.mjs';
import fs from 'fs/promises';

describe('FileProcessor', () => {
  let fileProcessor;
  let fsStub;

  beforeEach(() => {
    fileProcessor = new FileProcessor();
    fsStub = sinon.stub(fs, 'readFile');
  });

  afterEach(() => {
    fsStub.restore();
  });

  describe('#processFile', () => {
    it('应该成功读取并处理文件', async () => {
      // 准备
      const mockContent = '文件内容';
      fsStub.resolves(mockContent);

      // 执行
      const result = await fileProcessor.processFile('test.txt');

      // 断言
      expect(fsStub).to.have.been.calledOnceWith('test.txt', 'utf8');
      expect(result).to.equal('处理后的: 文件内容');
    });

    it('应该在文件不存在时抛出错误', async () => {
      // 准备
      fsStub.rejects(new Error('文件不存在'));

      // 执行和断言
      await expect(fileProcessor.processFile('nonexistent.txt'))
        .to.be.rejectedWith('文件不存在');
    });
  });
});
```

### Node.js 内置测试模块

Node.js 18+ 提供了稳定的 `node:test` 模块，包含现代测试功能。

```javascript
// node-test.mjs
import { test, describe, mock } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

describe('事件发射器', () => {
  test('应该发射事件并传递数据', () => {
    const emitter = new EventEmitter();
    const mockListener = mock.fn();
    
    emitter.on('data', mockListener);
    emitter.emit('data', { value: 42 });
    
    assert.strictEqual(mockListener.mock.callCount(), 1);
    assert.deepStrictEqual(mockListener.mock.calls[0].arguments[0], { value: 42 });
  });
});

// 异步测试
test('异步操作测试', async (t) => {
  await t.test('应该解析 Promise', async () => {
    const result = await Promise.resolve('成功');
    assert.strictEqual(result, '成功');
  });

  await t.test('应该拒绝 Promise', async () => {
    await assert.rejects(
      Promise.reject(new Error('失败')),
      { message: '失败' }
    );
  });
});
```

## 命令行工具专用测试技术

### 子进程执行测试

测试命令行工具需要执行实际的子进程并验证其行为。

```javascript
// cli-execution.test.mjs
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(__dirname, '../src/cli.mjs');

class CLITestRunner {
  static async execute(args = [], options = {}) {
    const child = spawn('node', [CLI_PATH, ...args], {
      ...options,
      env: { ...process.env, ...options.env },
      encoding: 'utf8'
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const [exitCode] = await once(child, 'exit');
    
    return {
      exitCode,
      stdout: stdout.trim(),
      stderr: stderr.trim()
    };
  }
}

describe('命令行界面测试', () => {
  test('应该显示帮助信息', async () => {
    const result = await CLITestRunner.execute(['--help']);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('用法:');
    expect(result.stdout).toContain('选项:');
  });

  test('应该处理文件转换', async () => {
    const result = await CLITestRunner.execute([
      'convert',
      '--input', 'test.txt',
      '--output', 'output.json'
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('转换完成');
  });

  test('应该在参数缺失时显示错误', async () => {
    const result = await CLITestRunner.execute(['convert']);
    
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('缺少必要参数');
  });
});
```

### 用户交互模拟

测试需要模拟用户输入和验证输出。

```javascript
// interactive-cli.test.mjs
import { spawn } from 'node:child_process';
import { Writable } from 'node:stream';

class InteractiveCLITester {
  constructor(cliPath) {
    this.cliPath = cliPath;
  }

  async runWithInput(inputs, args = []) {
    const child = spawn('node', [this.cliPath, ...args], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // 收集输出
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    // 模拟用户输入
    for (const input of inputs) {
      child.stdin.write(input + '\n');
      // 等待输出刷新
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    child.stdin.end();

    const [exitCode] = await new Promise((resolve) => {
      child.on('exit', (code) => resolve([code]));
    });

    return {
      exitCode,
      output: output.trim()
    };
  }
}

describe('交互式命令行测试', () => {
  let tester;

  beforeAll(() => {
    tester = new InteractiveCLITester('./src/interactive-cli.mjs');
  });

  test('应该处理问答流程', async () => {
    const inputs = [
      'John Doe',  // 姓名
      '30',        // 年龄
      'y'          // 确认
    ];

    const result = await tester.runWithInput(inputs);

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain('姓名: John Doe');
    expect(result.output).toContain('年龄: 30');
    expect(result.output).toContain('确认: 是');
  });

  test('应该验证输入并重新提示', async () => {
    const inputs = [
      '',           // 空姓名
      'John Doe',   // 有效姓名
      'invalid',    // 无效年龄
      '30'          // 有效年龄
    ];

    const result = await tester.runWithInput(inputs);

    expect(result.output).toContain('姓名不能为空');
    expect(result.output).toContain('请输入有效数字');
  });
});
```

## 模拟与测试替身

### 文件系统模拟

使用内存文件系统避免真实文件操作。

```javascript
// fs-mocking.test.mjs
import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { createFsFromVolume, Volume } from 'memfs';
import { ufs } from 'unionfs';
import { patchFs } from 'fs-monkey';
import { FileManager } from '../src/file-manager.mjs';

describe('文件管理器测试', () => {
  let fileManager;
  let memFs;

  beforeEach(() => {
    // 创建内存文件系统
    memFs = createFsFromVolume(new Volume());
    
    // 使用联合文件系统（真实FS + 内存FS）
    ufs
      .use(await import('node:fs'))
      .use(memFs);
    
    patchFs(ufs);
    
    // 初始化测试数据
    memFs.mkdirSync('/project', { recursive: true });
    memFs.writeFileSync('/project/config.json', '{"name": "test"}');
    
    fileManager = new FileManager();
  });

  afterEach(() => {
    // 恢复原始文件系统
    patchFs(await import('node:fs'));
  });

  it('应该读取配置文件', async () => {
    const config = await fileManager.readConfig('/project/config.json');
    
    expect(config).to.deep.equal({ name: 'test' });
  });

  it('应该创建新文件', async () => {
    await fileManager.createFile('/project/new-file.txt', '内容');
    
    const content = memFs.readFileSync('/project/new-file.txt', 'utf8');
    expect(content).to.equal('内容');
  });

  it('应该在文件不存在时抛出错误', async () => {
    await expect(fileManager.readConfig('/nonexistent.json'))
      .to.be.rejectedWith('文件不存在');
  });
});
```

### 网络请求模拟

模拟外部 API 调用以确保测试的独立性和速度。

```javascript
// api-client.test.mjs
import nock from 'nock';
import { APIClient } from '../src/api-client.mjs';

describe('API 客户端测试', () => {
  let apiClient;
  let apiScope;

  beforeEach(() => {
    apiClient = new APIClient('https://api.example.com');
    apiScope = nock('https://api.example.com');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('应该成功获取用户数据', async () => {
    // 模拟成功的 API 响应
    apiScope
      .get('/users/123')
      .reply(200, {
        id: 123,
        name: 'John Doe',
        email: 'john@example.com'
      });

    const user = await apiClient.getUser(123);
    
    expect(user).to.deep.equal({
      id: 123,
      name: 'John Doe',
      email: 'john@example.com'
    });
  });

  it('应该处理 API 错误', async () => {
    // 模拟失败的 API 响应
    apiScope
      .get('/users/999')
      .reply(404, { error: '用户不存在' });

    await expect(apiClient.getUser(999))
      .to.be.rejectedWith('API 错误: 用户不存在');
  });

  it('应该重试失败的请求', async () => {
    // 模拟第一次失败，第二次成功
    apiScope
      .get('/data')
      .reply(500)
      .get('/data')
      .reply(200, { data: '成功' });

    const data = await apiClient.fetchWithRetry('/data', 2);
    
    expect(data).to.deep.equal({ data: '成功' });
  });
});
```

## 测试工具与实用库

### Supertest - HTTP 测试

测试命令行工具中的 HTTP 服务器组件。

```javascript
// http-server.test.mjs
import request from 'supertest';
import { createServer } from '../src/http-server.mjs';

describe('HTTP 服务器测试', () => {
  let server;
  let app;

  beforeAll(async () => {
    app = await createServer();
    server = app.listen(3000);
  });

  afterAll(async () => {
    await server.close();
  });

  it('应该响应健康检查', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
  });

  it('应该处理数据提交', async () => {
    const testData = { name: '测试', value: 42 };

    const response = await request(app)
      .post('/data')
      .send(testData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('测试');
  });

  it('应该验证请求数据', async () => {
    await request(app)
      .post('/data')
      .send({}) // 空数据
      .expect(400)
      .expect(/缺少必要字段/);
  });
});
```

### TestDouble - 现代测试替身

提供清晰的测试替身 API，改善测试可读性。

```javascript
// service-test.test.mjs
import td from 'testdouble';
import { UserService } from '../src/user-service.mjs';
import { EmailService } from '../src/email-service.mjs';

describe('用户服务测试', () => {
  let userService;
  let mockEmailService;
  let mockDatabase;

  beforeEach(() => {
    mockEmailService = td.object(EmailService.prototype);
    mockDatabase = td.object(['findUser', 'saveUser']);
    
    userService = new UserService(mockDatabase);
    userService.emailService = mockEmailService;
  });

  afterEach(() => {
    td.reset();
  });

  it('应该注册用户并发送欢迎邮件', async () => {
    // 设置测试替身行为
    td.when(mockDatabase.findUser('test@example.com'))
      .thenResolve(null);
    
    td.when(mockDatabase.saveUser(td.matchers.anything()))
      .thenResolve({ id: 1, email: 'test@example.com' });

    td.when(mockEmailService.sendWelcomeEmail('test@example.com'))
      .thenResolve(true);

    // 执行测试
    const result = await userService.registerUser({
      email: 'test@example.com',
      password: 'secure123'
    });

    // 验证行为
    expect(result).toHaveProperty('id', 1);
    td.verify(mockEmailService.sendWelcomeEmail('test@example.com'));
  });

  it('应该在邮箱已存在时抛出错误', async () => {
    td.when(mockDatabase.findUser('existing@example.com'))
      .thenResolve({ id: 1, email: 'existing@example.com' });

    await expect(
      userService.registerUser({
        email: 'existing@example.com',
        password: 'password'
      })
    ).rejects.toThrow('用户已存在');
  });
});
```

## 高级测试模式

### 快照测试

确保输出格式和内容的一致性。

```javascript
// snapshot.test.mjs
import { Formatter } from '../src/formatter.mjs';

describe('格式化器快照测试', () => {
  let formatter;

  beforeEach(() => {
    formatter = new Formatter();
  });

  it('应该生成一致的用户报告', () => {
    const userData = {
      id: 123,
      name: '张三',
      email: 'zhangsan@example.com',
      roles: ['admin', 'user'],
      createdAt: '2023-01-01T00:00:00Z'
    };

    const report = formatter.formatUserReport(userData);
    
    expect(report).toMatchSnapshot();
  });

  it('应该生成一致的系统状态报告', () => {
    const systemStatus = {
      cpu: { usage: 45.5, cores: 8 },
      memory: { used: 16384, total: 32768 },
      disk: { used: 256000, total: 500000 }
    };

    const report = formatter.formatSystemStatus(systemStatus);
    
    expect(report).toMatchInlineSnapshot(`
      "系统状态报告:
      CPU: 45.5% (8 核心)
      内存: 16.0 GB / 32.0 GB (50.0%)
      磁盘: 250.0 GB / 488.3 GB (51.2%)"
    `);
  });
});
```

### 性能测试

确保命令行工具的性能符合要求。

```javascript
// performance.test.mjs
import { performance } from 'node:perf_hooks';
import { DataProcessor } from '../src/data-processor.mjs';

describe('性能测试', () => {
  let dataProcessor;

  beforeEach(() => {
    dataProcessor = new DataProcessor();
  });

  it('应该在合理时间内处理大量数据', async () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      value: Math.random()
    }));

    const startTime = performance.now();
    const result = await dataProcessor.processLargeDataset(largeDataset);
    const endTime = performance.now();

    const processingTime = endTime - startTime;
    
    expect(processingTime).toBeLessThan(1000); // 应该在1秒内完成
    expect(result).toHaveLength(10000);
  });

  it('应该具有线性时间复杂度', async () => {
    const sizes = [100, 1000, 10000];
    const times = [];

    for (const size of sizes) {
      const dataset = Array.from({ length: size }, (_, i) => ({ id: i }));
      
      const start = performance.now();
      await dataProcessor.processLargeDataset(dataset);
      const end = performance.now();
      
      times.push(end - start);
    }

    // 验证时间增长大致是线性的
    const ratio1 = times[1] / times[0]; // 10倍数据量
    const ratio2 = times[2] / times[1]; // 10倍数据量
    
    expect(ratio1).toBeLessThan(15); // 允许一些波动
    expect(ratio2).toBeLessThan(15);
  });
});
```

## 持续集成与测试优化

### GitHub Actions 集成

在 CI 环境中运行测试套件。

```yaml
# .github/workflows/test.yml
name: Node.js 测试

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: 使用 Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: 安装依赖
      run: npm ci
    
    - name: 运行测试
      run: |
        npm test
        npm run test:coverage
    
    - name: 上传覆盖率报告
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
    
    - name: 运行 E2E 测试
      run: npm run test:e2e
```

### 测试覆盖率配置

```javascript
// nyc.config.mjs
export default {
  extends: '@istanbuljs/nyc-config-esm',
  all: true,
  include: [
    'src/**/*.mjs'
  ],
  exclude: [
    'src/**/*.test.mjs',
    'src/**/*.spec.mjs',
    'src/test-utils/**/*.mjs'
  ],
  reporter: [
    'text',
    'lcov',
    'html'
  ],
  'check-coverage': true,
  branches: 80,
  lines: 80,
  functions: 80,
  statements: 80
};

// package.json 脚本配置
/*
{
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
    "test:coverage": "npm test -- --coverage",
    "test:watch": "npm test -- --watch",
    "test:e2e": "node test/e2e/runner.mjs"
  }
}
*/
```

通过实施全面的测试策略，Node.js 命令行工具可以确保代码质量、功能正确性和优秀的用户体验。从单元测试到端到端测试，每个层次都扮演着重要的角色，共同构建可靠、可维护的命令行应用程序。