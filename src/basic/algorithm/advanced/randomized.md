# 随机化算法

## 算法概述

随机化算法在计算过程中引入随机性，通过概率保证获得正确结果或优化性能。这类算法将随机数生成器作为基本操作，在平均情况下提供优异性能，特别适用于复杂优化和分布式计算场景。

核心特征图示：
```
确定性算法: 输入 → 确定计算 → 固定输出
随机化算法: 输入 → 随机计算 → 概率输出
                  ↳ 随机源
```

## 算法分类

### 拉斯维加斯算法

总是返回正确结果，但运行时间随机变化。

```
执行路径: 
  路径1: ○→○→○→✓ (快速成功)
  路径2: ○→○→○→○→○→✓ (较慢成功)
  保证: 所有路径最终都得到正确结果
```

### 蒙特卡洛算法

运行时间固定，但结果可能出错。

```
执行路径: 
  路径1: ○→○→○→✓ (正确结果)
  路径2: ○→○→○→✗ (错误结果)
  特点: 固定时间，概率正确
```

## 经典随机化算法

### 快速排序随机化版本

通过随机选择枢轴元素避免最坏情况。

```javascript
// 随机化快速排序
export function randomizedQuickSort(arr, left = 0, right = arr.length - 1) {
    if (left >= right) return arr;
    
    // 随机选择枢轴并交换到末尾
    const pivotIndex = left + Math.floor(Math.random() * (right - left + 1));
    [arr[pivotIndex], arr[right]] = [arr[right], arr[pivotIndex]];
    
    const pivot = arr[right];
    let i = left - 1;
    
    // 分区操作
    for (let j = left; j < right; j++) {
        if (arr[j] <= pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    
    // 放置枢轴到正确位置
    [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
    const finalPivotIndex = i + 1;
    
    // 递归排序
    randomizedQuickSort(arr, left, finalPivotIndex - 1);
    randomizedQuickSort(arr, finalPivotIndex + 1, right);
    
    return arr;
}

// 使用示例
export function testQuickSort() {
    const array = [9, 3, 7, 1, 8, 2, 5, 6, 4];
    console.log('Original:', array);
    console.log('Sorted:', randomizedQuickSort([...array]));
}
```

### 随机最小割算法

Karger 算法通过随机收缩边寻找图的最小割。

```javascript
// 图的最小割随机化算法
export function kargerMinCut(graph) {
    // 深拷贝图结构
    const contracted = {
        vertices: [...graph.vertices],
        edges: graph.edges.map(edge => [...edge])
    };
    
    while (contracted.vertices.length > 2) {
        // 随机选择一条边
        const randomIndex = Math.floor(Math.random() * contracted.edges.length);
        const [u, v] = contracted.edges[randomIndex];
        
        // 收缩边 (u, v)
        contractVertices(contracted, u, v);
    }
    
    return contracted.edges.length;
}

function contractVertices(graph, u, v) {
    // 合并顶点u和v为新顶点
    const merged = `${u}-${v}`;
    
    // 更新顶点列表
    graph.vertices = graph.vertices.filter(vertex => vertex !== u && vertex !== v);
    graph.vertices.push(merged);
    
    // 更新边列表
    const newEdges = [];
    for (const [x, y] of graph.edges) {
        let newX = x, newY = y;
        
        // 重命名端点
        if (x === u || x === v) newX = merged;
        if (y === u || y === v) newY = merged;
        
        // 忽略自环
        if (newX !== newY) {
            newEdges.push([newX, newY]);
        }
    }
    
    graph.edges = newEdges;
}

// 多次运行提高成功率
export function repeatedKarger(graph, iterations = 100) {
    let minCut = Infinity;
    
    for (let i = 0; i < iterations; i++) {
        const cutSize = kargerMinCut(graph);
        if (cutSize < minCut) {
            minCut = cutSize;
        }
    }
    
    return minCut;
}

// 图结构示例
export const exampleGraph = {
    vertices: ['A', 'B', 'C', 'D'],
    edges: [
        ['A', 'B'], ['A', 'C'], ['A', 'D'],
        ['B', 'C'], ['B', 'D'],
        ['C', 'D']
    ]
};
```

### 随机游走算法

在状态空间中进行概率转移，用于图遍历和采样。

```javascript
// 随机游走算法
export function randomWalk(graph, startNode, steps = 100) {
    let currentNode = startNode;
    const visited = new Map();
    const path = [currentNode];
    
    visited.set(currentNode, 1);
    
    for (let i = 0; i < steps; i++) {
        const neighbors = graph[currentNode] || [];
        if (neighbors.length === 0) break;
        
        // 随机选择邻居
        const randomIndex = Math.floor(Math.random() * neighbors.length);
        currentNode = neighbors[randomIndex];
        
        path.push(currentNode);
        visited.set(currentNode, (visited.get(currentNode) || 0) + 1);
    }
    
    return {
        path,
        visited: Array.from(visited.entries()),
        uniqueNodes: visited.size
    };
}

// 带重启的随机游走
export function randomWalkWithRestart(graph, startNode, restartProb = 0.1, steps = 100) {
    let currentNode = startNode;
    const visitCounts = new Map();
    const path = [currentNode];
    
    for (let i = 0; i < steps; i++) {
        // 以一定概率重启
        if (Math.random() < restartProb) {
            currentNode = startNode;
        } else {
            const neighbors = graph[currentNode] || [];
            if (neighbors.length > 0) {
                const randomIndex = Math.floor(Math.random() * neighbors.length);
                currentNode = neighbors[randomIndex];
            }
        }
        
        path.push(currentNode);
        visitCounts.set(currentNode, (visitCounts.get(currentNode) || 0) + 1);
    }
    
    return {
        path,
        visitCounts: Array.from(visitCounts.entries())
            .sort((a, b) => b[1] - a[1])
    };
}

// 图结构示例
export const walkableGraph = {
    'A': ['B', 'C'],
    'B': ['A', 'C', 'D'],
    'C': ['A', 'B', 'D'],
    'D': ['B', 'C', 'E'],
    'E': ['D']
};
```

## 概率分析与优化

### 期望时间分析

随机化算法的性能通常用期望值分析。

```javascript
// 随机选择算法 - 寻找第k小元素
export function randomizedSelect(arr, k, left = 0, right = arr.length - 1) {
    if (left === right) return arr[left];
    
    // 随机分区
    const pivotIndex = randomizedPartition(arr, left, right);
    const rank = pivotIndex - left + 1;
    
    if (k === rank) {
        return arr[pivotIndex];
    } else if (k < rank) {
        return randomizedSelect(arr, k, left, pivotIndex - 1);
    } else {
        return randomizedSelect(arr, k - rank, pivotIndex + 1, right);
    }
}

function randomizedPartition(arr, left, right) {
    const randomIndex = left + Math.floor(Math.random() * (right - left + 1));
    [arr[randomIndex], arr[right]] = [arr[right], arr[randomIndex]];
    
    const pivot = arr[right];
    let i = left - 1;
    
    for (let j = left; j < right; j++) {
        if (arr[j] <= pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    
    [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
    return i + 1;
}
```

### 概率放大技术

通过重复运行降低错误概率。

```javascript
// 蒙特卡洛算法的概率放大
export function probabilityAmplification(monteCarloAlgorithm, input, repetitions = 100) {
    let successCount = 0;
    const results = new Map();
    
    for (let i = 0; i < repetitions; i++) {
        const result = monteCarloAlgorithm(input);
        results.set(result, (results.get(result) || 0) + 1);
        
        if (isCorrectResult(result, input)) {
            successCount++;
        }
    }
    
    const successProbability = successCount / repetitions;
    const mostFrequent = Array.from(results.entries())
        .reduce((a, b) => a[1] > b[1] ? a : b)[0];
    
    return {
        mostLikelyResult: mostFrequent,
        successProbability,
        confidence: 1 - Math.pow(1 - successProbability, repetitions)
    };
}

// 示例蒙特卡洛算法 - 素数测试
export function monteCarloPrimeTest(n, k = 10) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0) return false;
    
    // 进行k次测试
    for (let i = 0; i < k; i++) {
        const a = 2 + Math.floor(Math.random() * (n - 4));
        if (modularExponentiation(a, n - 1, n) !== 1) {
            return false; // 肯定是合数
        }
    }
    
    return true; // 很可能是素数
}

function modularExponentiation(base, exponent, modulus) {
    if (modulus === 1) return 0;
    
    let result = 1;
    base = base % modulus;
    
    while (exponent > 0) {
        if (exponent % 2 === 1) {
            result = (result * base) % modulus;
        }
        exponent = Math.floor(exponent / 2);
        base = (base * base) % modulus;
    }
    
    return result;
}

function isCorrectResult(result, input) {
    // 根据具体问题实现正确性验证
    return result !== null && result !== undefined;
}
```

## 实际应用场景

### 负载均衡

```javascript
// 随机化负载均衡器
export class RandomizedLoadBalancer {
    constructor(servers) {
        this.servers = [...servers];
        this.weights = new Array(servers.length).fill(1);
    }
    
    // 简单随机选择
    selectServer() {
        const index = Math.floor(Math.random() * this.servers.length);
        return this.servers[index];
    }
    
    // 加权随机选择
    selectWeightedServer() {
        const totalWeight = this.weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < this.servers.length; i++) {
            random -= this.weights[i];
            if (random <= 0) {
                return this.servers[i];
            }
        }
        
        return this.servers[this.servers.length - 1];
    }
    
    // 根据性能调整权重
    updateWeights(performanceMetrics) {
        this.weights = performanceMetrics.map(metric => 
            Math.max(0.1, 1 / (metric.responseTime || 1))
        );
    }
}
```

### 随机采样与估算

```javascript
// 流式随机采样 - 蓄水池抽样
export function reservoirSampling(stream, sampleSize) {
    const reservoir = [];
    let count = 0;
    
    for (const item of stream) {
        count++;
        
        if (reservoir.length < sampleSize) {
            reservoir.push(item);
        } else {
            const randomIndex = Math.floor(Math.random() * count);
            if (randomIndex < sampleSize) {
                reservoir[randomIndex] = item;
            }
        }
    }
    
    return reservoir;
}

// 概率计数器 - 估算大规模集合大小
export class ProbabilisticCounter {
    constructor() {
        this.bitmap = 0;
    }
    
    add(element) {
        const hash = this.hash(element);
        const position = this.trailingZeros(hash);
        this.bitmap |= (1 << position);
    }
    
    estimate() {
        const R = this.lowestUnsetBit();
        return Math.pow(2, R) / 0.77351; // 修正因子
    }
    
    hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }
    
    trailingZeros(n) {
        if (n === 0) return 32;
        let count = 0;
        while ((n & 1) === 0) {
            count++;
            n >>= 1;
        }
        return count;
    }
    
    lowestUnsetBit() {
        let pos = 0;
        while ((this.bitmap & (1 << pos)) !== 0) {
            pos++;
        }
        return pos;
    }
}
```