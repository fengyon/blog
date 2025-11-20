# 近似算法

## 算法概述

近似算法是针对 NP 难问题设计的高效解决方案，通过在合理时间内找到接近最优解的答案来平衡精度与效率。当精确解需要指数时间时，这类算法能在多项式时间内提供有质量保证的近似解。

核心思想可用以下关系表示：
```
最优解值 ≤ 近似解值 ≤ ρ × 最优解值
```
其中 ρ 为近似比，衡量算法最坏情况下的性能表现。

## 设计技术

### 贪心策略

贪心算法在每一步选择当前最优决策，逐步构建完整解。虽然不能保证全局最优，但在许多问题中能提供良好的近似比。

```
问题: 集合覆盖
输入: 集合族F = {S₁, S₂, ..., Sₙ}, 全集U
过程: 
   1. 初始化覆盖集合C = ∅, 未覆盖元素R = U
   2. while R ≠ ∅:
       选择覆盖最多未覆盖元素的集合Sᵢ
       C = C ∪ {Sᵢ}
       R = R - Sᵢ
输出: 覆盖集合C
```

### 线性规划舍入

将离散优化问题松弛为线性规划，求解后对连续解进行舍入得到整数解。

```
连续解空间: ○○○○●●●● (分数解)
舍入操作: │
离散解空间: ○○○○●●●● (整数解)
```

### 局部搜索

从初始解出发，在邻域内寻找更优解，通过局部改进逼近全局最优。

```
初始解: ★······
搜索邻域: ·★····· → ··★···· → ···★··· 
改进方向: 逐步向最优解移动
```

## 经典问题分析

### 顶点覆盖问题

给定无向图 G=(V,E)，寻找最小顶点子集覆盖所有边。

```javascript
// 2-近似算法实现
export function vertexCoverApproximation(graph) {
    const cover = new Set();
    const edges = new Set([...graph.edges]);
    
    while (edges.size > 0) {
        // 随机选择一条边 (u, v)
        const [edge] = edges;
        const [u, v] = edge;
        
        // 将u和v都加入覆盖集
        cover.add(u);
        cover.add(v);
        
        // 移除所有与u或v相邻的边
        for (const edge of [...edges]) {
            const [x, y] = edge;
            if (x === u || x === v || y === u || y === v) {
                edges.delete(edge);
            }
        }
    }
    
    return Array.from(cover);
}

// 图结构示例
const exampleGraph = {
    vertices: ['A', 'B', 'C', 'D', 'E'],
    edges: [
        ['A', 'B'], ['A', 'C'], ['B', 'D'],
        ['C', 'D'], ['C', 'E'], ['D', 'E']
    ]
};
```

### 旅行商问题

在完全图中寻找访问所有顶点一次并返回起点的最短回路。

```javascript
// 最近邻启发式算法
export function tspNearestNeighbor(distances, startCity = 0) {
    const n = distances.length;
    const visited = new Array(n).fill(false);
    const tour = [startCity];
    visited[startCity] = true;
    let totalDistance = 0;
    let currentCity = startCity;
    
    for (let i = 0; i < n - 1; i++) {
        let nearestCity = -1;
        let minDist = Infinity;
        
        // 寻找最近的未访问城市
        for (let city = 0; city < n; city++) {
            if (!visited[city] && distances[currentCity][city] < minDist) {
                minDist = distances[currentCity][city];
                nearestCity = city;
            }
        }
        
        tour.push(nearestCity);
        visited[nearestCity] = true;
        totalDistance += minDist;
        currentCity = nearestCity;
    }
    
    // 返回起点
    totalDistance += distances[currentCity][startCity];
    tour.push(startCity);
    
    return { tour, totalDistance };
}

// 距离矩阵示例
export const exampleDistances = [
    [0, 2, 9, 10],
    [1, 0, 6, 4],
    [15, 7, 0, 8],
    [6, 3, 12, 0]
];
```

### 集合覆盖问题

从集合族中选择最小数量的子集，使得这些子集的并集包含所有元素。

```javascript
// 贪心集合覆盖算法
export function setCover(universe, subsets) {
    const elements = new Set(universe);
    const selectedSubsets = [];
    
    while (elements.size > 0) {
        let bestSubset = null;
        let bestCoverage = 0;
        
        // 选择覆盖最多未覆盖元素的子集
        for (const subset of subsets) {
            const coverage = subset.filter(x => elements.has(x)).length;
            if (coverage > bestCoverage) {
                bestCoverage = coverage;
                bestSubset = subset;
            }
        }
        
        if (!bestSubset) break;
        
        selectedSubsets.push(bestSubset);
        
        // 移除已覆盖元素
        for (const element of bestSubset) {
            elements.delete(element);
        }
        
        // 移除已选子集
        subsets = subsets.filter(subset => subset !== bestSubset);
    }
    
    return selectedSubsets;
}

// 使用示例
const universe = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const subsets = [
    [1, 2, 3, 4],
    [2, 3, 4, 5],
    [6, 7, 8],
    [1, 5, 9],
    [4, 6, 8]
];
```

## 性能保证理论

### 近似比分析

近似算法性能通过近似比量化：

最小化问题：`ρ = 算法解 / 最优解 ≥ 1`
最大化问题：`ρ = 最优解 / 算法解 ≥ 1`

```
性能谱系:
精确算法: ρ = 1
近似算法: 1 < ρ < ∞
无保证启发式: ρ → ∞
```

### 近似模式

多项式时间近似模式 (PTAS) 允许通过调整参数 ε 控制精度：

```javascript
// 背包问题的PTAS框架
export function knapsackPTAS(weights, values, capacity, epsilon = 0.1) {
    const n = weights.length;
    
    if (epsilon === 0) {
        // 精确算法（指数时间）
        return knapsackExact(weights, values, capacity);
    }
    
    // 缩放价值的近似算法
    const maxValue = Math.max(...values);
    const scale = Math.max(1, Math.floor(epsilon * maxValue / n));
    
    const scaledValues = values.map(v => Math.floor(v / scale));
    
    // 使用动态规划求解缩放后的问题
    return knapsackDP(weights, scaledValues, capacity)
        .map(solution => ({
            ...solution,
            value: solution.value * scale // 还原实际价值
        }));
}
```

## 实际应用优化

### 缓存友好的实现

```javascript
// 优化的贪心集合覆盖
export function optimizedSetCover(universe, subsets) {
    const elements = new Set(universe);
    const selectedSubsets = [];
    
    // 预计算覆盖信息
    const coverageInfo = subsets.map(subset => ({
        subset,
        elements: new Set(subset),
        count: subset.length
    }));
    
    while (elements.size > 0) {
        let bestIndex = -1;
        let bestCount = 0;
        
        // 并行计算覆盖数
        for (let i = 0; i < coverageInfo.length; i++) {
            if (!coverageInfo[i]) continue;
            
            let count = 0;
            for (const element of coverageInfo[i].elements) {
                if (elements.has(element)) count++;
            }
            
            if (count > bestCount) {
                bestCount = count;
                bestIndex = i;
            }
        }
        
        if (bestIndex === -1) break;
        
        selectedSubsets.push(coverageInfo[bestIndex].subset);
        
        // 批量移除元素
        for (const element of coverageInfo[bestIndex].elements) {
            elements.delete(element);
        }
        
        coverageInfo[bestIndex] = null;
    }
    
    return selectedSubsets;
}
```

### 流式处理版本

```javascript
// 流式贪心集合覆盖
export function* streamingSetCover(subsetsStream) {
    const uncovered = new Set();
    let bestCurrent = null;
    let bestScore = 0;
    
    for (const subset of subsetsStream) {
        // 计算新子集的覆盖分数
        let score = 0;
        for (const element of subset) {
            if (!uncovered.has(element)) {
                uncovered.add(element);
                score++;
            }
        }
        
        // 更新最佳候选
        if (!bestCurrent || score > bestScore) {
            if (bestCurrent) {
                yield bestCurrent; // 输出之前的最佳子集
            }
            bestCurrent = subset;
            bestScore = score;
        }
        
        // 如果当前子集明显更好，立即输出
        if (score > bestScore * 2) {
            yield subset;
            bestCurrent = null;
            bestScore = 0;
        }
    }
    
    if (bestCurrent) {
        yield bestCurrent;
    }
}
```