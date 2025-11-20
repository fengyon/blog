# 性能测试工具

## 工具概述

JavaScript 算法性能测试工具是用于量化评估代码执行效率的系统化解决方案。通过精确测量时间复杂度和空间复杂度，帮助开发者识别性能瓶颈、优化关键路径，确保算法在各种规模数据下保持高效运行。

核心测试流程：
```
输入算法 → 执行测试套件 → 收集指标数据 → 生成分析报告
            ↓
      性能基准对比 ← 可视化展示
```

## 核心测试框架

### 基础性能测量

```javascript
// 性能测试器基类
export class PerformanceTester {
    constructor() {
        this.tests = new Map();
        this.results = new Map();
        this.warmupRounds = 10;
        this.defaultIterations = 1000;
    }

    // 添加测试用例
    addTest(name, testFunction, setupFunction = null) {
        this.tests.set(name, {
            test: testFunction,
            setup: setupFunction,
            data: null
        });
        return this;
    }

    // 执行单次性能测试
    measureSingle(name, ...args) {
        const testCase = this.tests.get(name);
        if (!testCase) throw new Error(`Test ${name} not found`);

        // 准备工作
        if (testCase.setup) {
            testCase.data = testCase.setup();
        }

        // 预热
        for (let i = 0; i < this.warmupRounds; i++) {
            testCase.test(testCase.data, ...args);
        }

        // 正式测量
        const startTime = performance.now();
        const result = testCase.test(testCase.data, ...args);
        const endTime = performance.now();

        return {
            time: endTime - startTime,
            result: result,
            memory: this.getMemoryUsage()
        };
    }

    // 批量性能测试
    measureBulk(name, iterations = this.defaultIterations, ...args) {
        const testCase = this.tests.get(name);
        if (!testCase) throw new Error(`Test ${name} not found`);

        const times = [];
        let results = [];

        // 设置测试数据
        if (testCase.setup) {
            testCase.data = testCase.setup();
        }

        // 预热
        for (let i = 0; i < this.warmupRounds; i++) {
            testCase.test(testCase.data, ...args);
        }

        // 执行多次测试
        for (let i = 0; i < iterations; i++) {
            const startTime = performance.now();
            const result = testCase.test(testCase.data, ...args);
            const endTime = performance.now();
            
            times.push(endTime - startTime);
            results.push(result);
        }

        return this.analyzeResults(times, results);
    }

    // 分析测试结果
    analyzeResults(times, results) {
        const sortedTimes = [...times].sort((a, b) => a - b);
        const sum = sortedTimes.reduce((a, b) => a + b, 0);
        
        return {
            iterations: times.length,
            mean: sum / times.length,
            median: sortedTimes[Math.floor(times.length / 2)],
            min: Math.min(...times),
            max: Math.max(...times),
            standardDeviation: this.calculateStdDev(times),
            totalTime: sum,
            results: results
        };
    }

    // 计算标准差
    calculateStdDev(times) {
        const mean = times.reduce((a, b) => a + b, 0) / times.length;
        const squareDiffs = times.map(time => Math.pow(time - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / times.length;
        return Math.sqrt(avgSquareDiff);
    }

    // 获取内存使用情况（Node.js环境）
    getMemoryUsage() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            return process.memoryUsage();
        }
        return { used: null, total: null };
    }
}
```

### 渐进复杂度分析

```javascript
// 复杂度分析工具
export class ComplexityAnalyzer {
    constructor() {
        this.sizeRange = [10, 100, 1000, 10000];
        this.complexityPatterns = {
            'O(1)': { threshold: 1.2, pattern: 'constant' },
            'O(log n)': { threshold: 2.5, pattern: 'logarithmic' },
            'O(n)': { threshold: 10, pattern: 'linear' },
            'O(n log n)': { threshold: 15, pattern: 'linearithmic' },
            'O(n²)': { threshold: 100, pattern: 'quadratic' },
            'O(2ⁿ)': { threshold: 1000, pattern: 'exponential' }
        };
    }

    // 分析算法复杂度
    async analyzeComplexity(algorithm, dataGenerator) {
        const results = [];
        
        for (const size of this.sizeRange) {
            const testData = dataGenerator(size);
            
            // 测量执行时间
            const startTime = performance.now();
            await algorithm(testData);
            const endTime = performance.now();
            
            results.push({
                size,
                time: endTime - startTime
            });
        }

        return {
            rawData: results,
            complexity: this.detectComplexity(results),
            growthFactor: this.calculateGrowthFactor(results)
        };
    }

    // 检测复杂度类型
    detectComplexity(results) {
        const ratios = [];
        
        for (let i = 1; i < results.length; i++) {
            const timeRatio = results[i].time / results[i-1].time;
            const sizeRatio = results[i].size / results[i-1].size;
            ratios.push(timeRatio / sizeRatio);
        }

        const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
        
        for (const [complexity, { threshold }] of Object.entries(this.complexityPatterns)) {
            if (avgRatio <= threshold) {
                return complexity;
            }
        }
        
        return 'O(n^k)'; // 高次多项式
    }

    // 计算增长因子
    calculateGrowthFactor(results) {
        const factors = [];
        
        for (let i = 1; i < results.length; i++) {
            const timeGrowth = results[i].time / results[0].time;
            const sizeGrowth = results[i].size / results[0].size;
            factors.push(timeGrowth / sizeGrowth);
        }
        
        return factors.reduce((a, b) => a + b, 0) / factors.length;
    }
}
```

## 高级测试功能

### 内存泄漏检测

```javascript
// 内存分析工具
export class MemoryProfiler {
    constructor() {
        this.snapshots = new Map();
        this.leakThreshold = 1.1; // 10%增长视为潜在泄漏
    }

    // 创建内存快照
    takeSnapshot(label) {
        if (typeof global !== 'undefined' && global.gc) {
            global.gc(); // 强制垃圾回收（Node.js --expose-gc）
        }

        const snapshot = {
            timestamp: Date.now(),
            memory: this.getMemoryInfo(),
            stack: new Error().stack.split('\n').slice(2) // 移除前两行框架代码
        };

        this.snapshots.set(label, snapshot);
        return snapshot;
    }

    // 获取内存信息
    getMemoryInfo() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const usage = process.memoryUsage();
            return {
                heapUsed: usage.heapUsed,
                heapTotal: usage.heapTotal,
                external: usage.external,
                rss: usage.rss
            };
        } else if (typeof performance !== 'undefined' && performance.memory) {
            // 浏览器环境
            const memory = performance.memory;
            return {
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit
            };
        }
        return {};
    }

    // 检测内存泄漏
    detectLeaks() {
        const leaks = [];
        const snapshotsArray = Array.from(this.snapshots.entries());
        
        for (let i = 1; i < snapshotsArray.length; i++) {
            const [currentLabel, currentSnapshot] = snapshotsArray[i];
            const [previousLabel, previousSnapshot] = snapshotsArray[i - 1];
            
            const memoryGrowth = this.calculateMemoryGrowth(
                previousSnapshot.memory, 
                currentSnapshot.memory
            );
            
            if (memoryGrowth > this.leakThreshold) {
                leaks.push({
                    from: previousLabel,
                    to: currentLabel,
                    growth: memoryGrowth,
                    timeDiff: currentSnapshot.timestamp - previousSnapshot.timestamp
                });
            }
        }
        
        return leaks;
    }

    // 计算内存增长
    calculateMemoryGrowth(previous, current) {
        const prevHeap = previous.heapUsed || previous.usedJSHeapSize;
        const currHeap = current.heapUsed || current.usedJSHeapSize;
        
        if (!prevHeap || !currHeap) return 0;
        return currHeap / prevHeap;
    }

    // 长期内存监控
    startLongTermMonitoring(intervalMs = 5000) {
        let monitorCount = 0;
        
        return setInterval(() => {
            this.takeSnapshot(`monitor_${monitorCount++}`);
            
            const leaks = this.detectLeaks();
            if (leaks.length > 0) {
                console.warn('Potential memory leaks detected:', leaks);
            }
        }, intervalMs);
    }
}
```

### 异步性能测试

```javascript
// 异步操作性能测试
export class AsyncPerformanceTester extends PerformanceTester {
    async measureAsync(name, iterations = this.defaultIterations, ...args) {
        const testCase = this.tests.get(name);
        if (!testCase) throw new Error(`Test ${name} not found`);

        const times = [];
        let results = [];

        // 设置测试数据
        if (testCase.setup) {
            testCase.data = await testCase.setup();
        }

        // 预热
        for (let i = 0; i < this.warmupRounds; i++) {
            await testCase.test(testCase.data, ...args);
        }

        // 执行多次测试
        for (let i = 0; i < iterations; i++) {
            const startTime = performance.now();
            const result = await testCase.test(testCase.data, ...args);
            const endTime = performance.now();
            
            times.push(endTime - startTime);
            results.push(result);
        }

        return this.analyzeResults(times, results);
    }

    // 并发性能测试
    async measureConcurrent(name, concurrency = 5, requestsPerWorker = 100, ...args) {
        const testCase = this.tests.get(name);
        if (!testCase) throw new Error(`Test ${name} not found`);

        if (testCase.setup) {
            testCase.data = await testCase.setup();
        }

        const workers = [];
        const allTimes = [];

        // 创建并发工作器
        for (let i = 0; i < concurrency; i++) {
            workers.push(this.createWorker(testCase, requestsPerWorker, ...args));
        }

        // 等待所有工作器完成
        const results = await Promise.all(workers);
        
        // 合并结果
        for (const workerResult of results) {
            allTimes.push(...workerResult.times);
        }

        return {
            ...this.analyzeResults(allTimes, results.flatMap(r => r.results)),
            concurrency,
            totalRequests: concurrency * requestsPerWorker,
            requestsPerSecond: (concurrency * requestsPerWorker) / 
                (Math.max(...allTimes) / 1000)
        };
    }

    async createWorker(testCase, requests, ...args) {
        const times = [];
        const results = [];

        for (let i = 0; i < requests; i++) {
            const startTime = performance.now();
            const result = await testCase.test(testCase.data, ...args);
            const endTime = performance.now();
            
            times.push(endTime - startTime);
            results.push(result);
        }

        return { times, results };
    }
}
```

## 可视化报告系统

### 控制台报告生成器

```javascript
// 文本可视化报告
export class ConsoleReporter {
    static generateReport(testResults, options = {}) {
        const {
            showPercentiles = true,
            showHistogram = true,
            width = 50
        } = options;

        let report = '\n' + '='.repeat(60) + '\n';
        report += 'PERFORMANCE TEST REPORT\n';
        report += '='.repeat(60) + '\n\n';

        for (const [testName, result] of testResults) {
            report += this.formatTestResult(testName, result, width);
            
            if (showPercentiles) {
                report += this.formatPercentiles(result);
            }
            
            if (showHistogram) {
                report += this.formatHistogram(result, width);
            }
            
            report += '\n' + '-'.repeat(60) + '\n\n';
        }

        return report;
    }

    static formatTestResult(name, result, width) {
        const header = `TEST: ${name}`.padEnd(width);
        const iterations = `Iterations: ${result.iterations}`.padEnd(width);
        const mean = `Mean Time: ${result.mean.toFixed(4)}ms`.padEnd(width);
        const median = `Median Time: ${result.median.toFixed(4)}ms`.padEnd(width);
        const minMax = `Range: ${result.min.toFixed(4)}ms - ${result.max.toFixed(4)}ms`.padEnd(width);
        
        return `${header}\n${iterations}\n${mean}\n${median}\n${minMax}\n`;
    }

    static formatPercentiles(result) {
        if (!result.percentiles) return '';
        
        let percentiles = 'Percentiles:\n';
        for (const [percentile, value] of Object.entries(result.percentiles)) {
            percentiles += `  ${percentile}%: ${value.toFixed(4)}ms\n`;
        }
        return percentiles;
    }

    static formatHistogram(result, width) {
        if (!result.histogram) return '';
        
        const maxCount = Math.max(...result.histogram.map(bin => bin.count));
        const scale = (width - 20) / maxCount;
        
        let histogram = 'Response Time Distribution:\n';
        
        for (const bin of result.histogram) {
            const bar = '█'.repeat(Math.max(1, Math.round(bin.count * scale)));
            histogram += `  ${bin.range}: ${bar} (${bin.count})\n`;
        }
        
        return histogram;
    }

    // 复杂度比较报告
    static generateComplexityReport(analysisResults) {
        let report = '\nCOMPLEXITY ANALYSIS REPORT\n';
        report += '='.repeat(50) + '\n';
        
        for (const [algorithm, analysis] of analysisResults) {
            report += `Algorithm: ${algorithm}\n`;
            report += `Detected Complexity: ${analysis.complexity}\n`;
            report += `Growth Factor: ${analysis.growthFactor.toFixed(2)}\n\n`;
            
            report += 'Size vs Time:\n';
            for (const point of analysis.rawData) {
                const size = point.size.toString().padStart(6);
                const time = point.time.toFixed(2).padStart(8);
                report += `  Size: ${size} | Time: ${time}ms\n`;
            }
            report += '\n';
        }
        
        return report;
    }
}
```

### 基准对比系统

```javascript
// 基准测试对比工具
export class BenchmarkComparator {
    constructor(baselineResults = new Map()) {
        this.baselines = baselineResults;
        this.tolerance = 0.1; // 10%性能差异容忍度
    }

    // 设置性能基准
    setBaseline(name, results) {
        this.baselines.set(name, {
            ...results,
            timestamp: Date.now()
        });
    }

    // 对比性能结果
    compare(currentResults) {
        const comparisons = new Map();

        for (const [testName, currentResult] of currentResults) {
            const baseline = this.baselines.get(testName);
            
            if (!baseline) {
                comparisons.set(testName, {
                    status: 'NO_BASELINE',
                    current: currentResult.mean,
                    change: null
                });
                continue;
            }

            const change = (currentResult.mean - baseline.mean) / baseline.mean;
            const absoluteChange = Math.abs(change);
            
            let status;
            if (absoluteChange <= this.tolerance) {
                status = 'WITHIN_TOLERANCE';
            } else if (change > 0) {
                status = 'REGRESSION';
            } else {
                status = 'IMPROVEMENT';
            }

            comparisons.set(testName, {
                status,
                current: currentResult.mean,
                baseline: baseline.mean,
                change,
                absoluteChange
            });
        }

        return comparisons;
    }

    // 生成性能回归报告
    generateRegressionReport(comparisons) {
        const regressions = Array.from(comparisons.entries())
            .filter(([_, comp]) => comp.status === 'REGRESSION');
        
        const improvements = Array.from(comparisons.entries())
            .filter(([_, comp]) => comp.status === 'IMPROVEMENT');

        let report = '\nPERFORMANCE REGRESSION REPORT\n';
        report += '='.repeat(50) + '\n';

        if (regressions.length > 0) {
            report += '🚨 PERFORMANCE REGRESSIONS:\n';
            for (const [testName, comp] of regressions) {
                report += `  ${testName}: +${(comp.change * 100).toFixed(1)}% ` +
                         `(${comp.baseline.toFixed(2)}ms → ${comp.current.toFixed(2)}ms)\n`;
            }
            report += '\n';
        }

        if (improvements.length > 0) {
            report += '✅ PERFORMANCE IMPROVEMENTS:\n';
            for (const [testName, comp] of improvements) {
                report += `  ${testName}: ${(comp.change * 100).toFixed(1)}% ` +
                         `(${comp.baseline.toFixed(2)}ms → ${comp.current.toFixed(2)}ms)\n`;
            }
            report += '\n';
        }

        if (regressions.length === 0 && improvements.length === 0) {
            report += '📊 All tests within performance tolerance\n';
        }

        return report;
    }
}
```

## 实战应用示例

```javascript
// 完整的性能测试套件示例
export class AlgorithmBenchmarkSuite {
    constructor() {
        this.tester = new AsyncPerformanceTester();
        this.complexityAnalyzer = new ComplexityAnalyzer();
        this.comparator = new BenchmarkComparator();
    }

    // 注册排序算法测试
    registerSortingAlgorithms() {
        // 测试数据生成器
        const generateRandomArray = (size) => {
            return Array.from({ length: size }, () => 
                Math.floor(Math.random() * size * 10)
            );
        };

        // 快速排序测试
        this.tester.addTest(
            'quickSort',
            (data) => this.quickSort([...data]),
            () => generateRandomArray(1000)
        );

        // 归并排序测试
        this.tester.addTest(
            'mergeSort', 
            (data) => this.mergeSort([...data]),
            () => generateRandomArray(1000)
        );

        // 内置排序测试
        this.tester.addTest(
            'nativeSort',
            (data) => [...data].sort((a, b) => a - b),
            () => generateRandomArray(1000)
        );
    }

    // 算法实现
    quickSort(arr) {
        if (arr.length <= 1) return arr;
        
        const pivot = arr[Math.floor(arr.length / 2)];
        const left = arr.filter(x => x < pivot);
        const middle = arr.filter(x => x === pivot);
        const right = arr.filter(x => x > pivot);
        
        return [...this.quickSort(left), ...middle, ...this.quickSort(right)];
    }

    mergeSort(arr) {
        if (arr.length <= 1) return arr;
        
        const mid = Math.floor(arr.length / 2);
        const left = this.mergeSort(arr.slice(0, mid));
        const right = this.mergeSort(arr.slice(mid));
        
        return this.merge(left, right);
    }

    merge(left, right) {
        const result = [];
        let i = 0, j = 0;
        
        while (i < left.length && j < right.length) {
            if (left[i] < right[j]) {
                result.push(left[i++]);
            } else {
                result.push(right[j++]);
            }
        }
        
        return result.concat(left.slice(i), right.slice(j));
    }

    // 运行完整测试套件
    async runFullSuite() {
        console.log('Starting algorithm benchmark suite...\n');
        
        // 性能测试
        const results = new Map();
        for (const testName of ['quickSort', 'mergeSort', 'nativeSort']) {
            const result = await this.tester.measureAsync(testName, 100);
            results.set(testName, result);
        }

        // 复杂度分析
        const complexityResults = new Map();
        const sizeGenerator = (size) => Array.from({ length: size }, () => 
            Math.floor(Math.random() * size * 10)
        );

        for (const algoName of ['quickSort', 'mergeSort']) {
            const analysis = await this.complexityAnalyzer.analyzeComplexity(
                this[algoName].bind(this),
                sizeGenerator
            );
            complexityResults.set(algoName, analysis);
        }

        // 生成报告
        console.log(ConsoleReporter.generateReport(results));
        console.log(ConsoleReporter.generateComplexityReport(complexityResults));

        return { performance: results, complexity: complexityResults };
    }
}
```