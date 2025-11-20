# 贪心算法

## 什么是贪心算法

贪心算法是一种在每一步选择中都采取当前状态下最优决策的算法策略。它期望通过局部最优选择的累积来达到全局最优解，通常简单高效但不保证得到绝对最优解。

特点：
- 局部最优：每步只考虑当前最佳选择
- 不可回溯：一旦做出选择就不再 reconsider
- 高效简单：通常时间复杂度较低，实现简单
- 适用范围：需要问题具有贪心选择性质

示意图 (找零钱问题)：
```
目标: 找零41分，硬币有25分、10分、5分、1分
贪心选择:
41 → 选25分 (剩余16)
16 → 选10分 (剩余6)  
6 → 选5分 (剩余1)
1 → 选1分 (完成)
硬币数: 4 (25+10+5+1)
```

## 贪心算法核心特性

### 贪心选择性质

每个局部最优选择能够导向全局最优解，这是贪心算法可行的理论基础。

特点：
- 当前最优：每一步的选择都是当前状态下的最佳选择
- 无后效性：选择后不会影响后续步骤的可行性
- 自包含：选择只依赖于当前状态，不依赖未来选择

```javascript
// 活动选择问题 - 展示贪心选择性质
export function activitySelection(activities) {
  // 按结束时间排序
  activities.sort((a, b) => a.end - b.end);
  
  const selected = [];
  let lastEnd = -Infinity;
  
  for (const activity of activities) {
    // 贪心选择：总是选择结束最早且不冲突的活动
    if (activity.start >= lastEnd) {
      selected.push(activity);
      lastEnd = activity.end;
    }
  }
  
  return selected;
}

// 示例数据
export const sampleActivities = [
  { name: 'A', start: 1, end: 4 },
  { name: 'B', start: 3, end: 5 },
  { name: 'C', start: 0, end: 6 },
  { name: 'D', start: 5, end: 7 },
  { name: 'E', start: 3, end: 9 },
  { name: 'F', start: 5, end: 9 },
  { name: 'G', start: 6, end: 10 },
  { name: 'H', start: 8, end: 11 },
  { name: 'I', start: 8, end: 12 },
  { name: 'J', start: 2, end: 14 }
];
```

示意图 (活动选择贪心过程)：
```
活动按结束时间排序: C(0-6), A(1-4), B(3-5), E(3-9), F(5-9), D(5-7), G(6-10), H(8-11), I(8-12), J(2-14)

贪心选择:
初始: lastEnd = -∞
选A(1-4): 不冲突, lastEnd=4
选D(5-7): 不冲突, lastEnd=7  
选H(8-11): 不冲突, lastEnd=11
最终选择: A, D, H (3个活动)
```

### 最优子结构

问题的最优解包含其子问题的最优解，这是动态规划和贪心算法共有的性质。

特点：
- 问题分解：大问题可以分解为相似小问题
- 解的组合：子问题最优解能组合成原问题最优解
- 递归适用：适合用递归或迭代方式求解

```javascript
// 霍夫曼编码 - 展示最优子结构
export class HuffmanNode {
  constructor(char, freq, left = null, right = null) {
    this.char = char;
    this.freq = freq;
    this.left = left;
    this.right = right;
  }
}

export function buildHuffmanTree(frequencies) {
  const nodes = Object.entries(frequencies)
    .map(([char, freq]) => new HuffmanNode(char, freq));
  
  // 贪心选择：总是合并频率最小的两个节点
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    
    const left = nodes.shift();
    const right = nodes.shift();
    const merged = new HuffmanNode(
      null, 
      left.freq + right.freq, 
      left, 
      right
    );
    
    nodes.push(merged);
  }
  
  return nodes[0];
}

export function generateHuffmanCodes(root) {
  const codes = new Map();
  
  function traverse(node, code) {
    if (!node) return;
    
    if (node.char !== null) {
      codes.set(node.char, code);
      return;
    }
    
    traverse(node.left, code + '0');
    traverse(node.right, code + '1');
  }
  
  traverse(root, '');
  return codes;
}
```

示意图 (霍夫曼编码构建)：
```
字符频率: A:5, B:9, C:12, D:13, E:16, F:45

构建过程:
1. 合并A(5)和B(9) → 节点14
2. 合并C(12)和D(13) → 节点25  
3. 合并14和25 → 节点39
4. 合并E(16)和F(45) → 节点61
5. 合并39和61 → 根节点100

编码结果:
A:1100, B:1101, C:100, D:101, E:111, F:0
```

## 贪心算法证明技术

### 交换论证

通过证明任何最优解都可以通过交换操作转换为贪心解，来证明贪心选择的正确性。

特点：
- 解转换：展示如何将任意解改进为贪心解
- 不劣化：证明交换操作不会使解变差
- 通用性强：适用于多种贪心算法证明

```javascript
// 区间调度问题 - 交换论证示例
export function intervalScheduling(intervals) {
  // 贪心策略：选择结束最早的区间
  intervals.sort((a, b) => a.end - b.end);
  
  const schedule = [];
  let lastEnd = -Infinity;
  
  for (const interval of intervals) {
    if (interval.start >= lastEnd) {
      schedule.push(interval);
      lastEnd = interval.end;
    }
  }
  
  return schedule;
}

// 交换论证的模拟验证
export function validateGreedyChoice(intervals, greedySolution) {
  // 假设存在一个最优解O，比贪心解G多包含一个区间
  // 我们可以用贪心选择的第一个区间替换O中的第一个区间
  // 由于贪心选择结束最早，替换后不会产生冲突且数量不变
  // 重复此过程，最终O会被转换为G，证明G也是最优解
  
  const greedyCount = greedySolution.length;
  let maxPossible = 0;
  let currentEnd = -Infinity;
  
  // 模拟可能的最大区间数
  for (const interval of intervals.sort((a, b) => a.end - b.end)) {
    if (interval.start >= currentEnd) {
      maxPossible++;
      currentEnd = interval.end;
    }
  }
  
  return greedyCount === maxPossible;
}
```

示意图 (交换论证过程)：
```
假设最优解O: [A,C,E], 贪心解G: [B,D,F]
其中B结束时间早于A

交换论证:
1. 用B替换O中的A → O'=[B,C,E] (仍然可行，因为B结束更早)
2. 重复替换过程...
最终O转换为G，证明G也是最优解
```

### 归纳证明

使用数学归纳法证明贪心算法在每个步骤都保持最优性。

特点：
- 基础情况：证明初始选择是最优的
- 归纳步骤：假设前 k 步最优，证明第 k+步也最优
- 严谨数学：提供严格的数学证明框架

```javascript
// 最小生成树Prim算法 - 归纳证明示例
export function primMST(graph) {
  const { nodes, edges } = graph;
  const mst = [];
  const inMST = new Set();
  const minHeap = new MinHeap();
  
  // 基础情况：从任意节点开始
  const startNode = nodes[0];
  inMST.add(startNode);
  addEdgesToHeap(startNode, edges, minHeap, inMST);
  
  // 归纳步骤：每次添加最小权重的安全边
  while (inMST.size < nodes.length && !minHeap.isEmpty()) {
    const { from, to, weight } = minHeap.extractMin();
    
    if (!inMST.has(to)) {
      mst.push({ from, to, weight });
      inMST.add(to);
      addEdgesToHeap(to, edges, minHeap, inMST);
    }
  }
  
  return mst;
}

// 辅助函数
function addEdgesToHeap(node, edges, minHeap, inMST) {
  for (const edge of edges) {
    if ((edge.from === node && !inMST.has(edge.to)) ||
        (edge.to === node && !inMST.has(edge.from))) {
      minHeap.insert(edge);
    }
  }
}
```

示意图 (Prim 算法归纳证明)：
```
基础步骤: 单个节点构成的树是最小生成树
归纳假设: 前k个节点已构成最小生成子树
归纳步骤: 添加最小权重的割边，保持最小生成树性质

图:
  A---1---B
  |       |
  4       2
  |       |
  C---3---D

MST构建:
开始{A} → 添加边AB(1) → {A,B} 
→ 添加边BD(2) → {A,B,D}
→ 添加边DC(3) → {A,B,D,C}
总权重: 1+2+3=6
```

## 经典贪心算法问题

### 分数背包问题

在背包容量有限的情况下，选择价值密度最高的物品，允许分割物品。

特点：
- 物品可分：可以取物品的一部分
- 价值密度：按价值/重量比率排序
- 绝对最优：贪心策略能得到全局最优解

```javascript
// 分数背包问题
export function fractionalKnapsack(items, capacity) {
  // 计算价值密度并排序
  const itemsWithDensity = items.map(item => ({
    ...item,
    density: item.value / item.weight
  }));
  
  itemsWithDensity.sort((a, b) => b.density - a.density);
  
  let remainingCapacity = capacity;
  let totalValue = 0;
  const selected = [];
  
  // 贪心选择：优先选择价值密度高的物品
  for (const item of itemsWithDensity) {
    if (remainingCapacity <= 0) break;
    
    if (item.weight <= remainingCapacity) {
      // 取完整物品
      selected.push({
        ...item,
        fraction: 1,
        selectedValue: item.value
      });
      totalValue += item.value;
      remainingCapacity -= item.weight;
    } else {
      // 取部分物品
      const fraction = remainingCapacity / item.weight;
      const selectedValue = item.value * fraction;
      
      selected.push({
        ...item,
        fraction,
        selectedValue
      });
      totalValue += selectedValue;
      remainingCapacity = 0;
    }
  }
  
  return {
    totalValue,
    selectedItems: selected,
    remainingCapacity
  };
}
```

示意图 (分数背包贪心选择)：
```
物品: 
A: 重量10, 价值60, 密度6.0
B: 重量20, 价值100, 密度5.0  
C: 重量30, 价值120, 密度4.0
背包容量: 50

贪心选择:
1. 取全部A: 价值60, 剩余容量40
2. 取全部B: 价值100, 剩余容量20  
3. 取2/3的C: 价值80, 剩余容量0
总价值: 60+100+80=240 (最优解)
```

### 硬币找零问题

用最少数量的硬币凑出指定金额，适用于特定面额系统。

特点：
- 面额依赖：结果正确性取决于硬币面额
- 贪心适用条件：面额满足贪心性质时才最优
- 现实应用：现金交易系统中的找零

```javascript
// 硬币找零问题
export function coinChangeGreedy(amount, coins) {
  // 按面额降序排序
  coins.sort((a, b) => b - a);
  
  const result = new Map();
  let remaining = amount;
  
  // 贪心选择：总是选择当前可用的最大面额
  for (const coin of coins) {
    if (remaining <= 0) break;
    
    const count = Math.floor(remaining / coin);
    if (count > 0) {
      result.set(coin, count);
      remaining -= count * coin;
    }
  }
  
  return {
    coinsUsed: result,
    totalCoins: Array.from(result.values()).reduce((sum, count) => sum + count, 0),
    remainingAmount: remaining
  };
}

// 验证硬币系统是否具有贪心性质
export function isGreedyCoinSystem(coins) {
  const sortedCoins = [...coins].sort((a, b) => a - b);
  
  for (let i = 1; i < sortedCoins.length; i++) {
    // 检查每个硬币是否小于前面所有硬币的最小公倍数
    const prevCoins = sortedCoins.slice(0, i);
    const maxAmount = prevCoins.reduce((a, b) => a + b, 0) - 1;
    
    // 对每个金额测试贪心解是否最优
    for (let amount = sortedCoins[i]; amount <= maxAmount + sortedCoins[i]; amount++) {
      const greedyResult = coinChangeGreedy(amount, sortedCoins.slice(0, i + 1));
      const dpResult = coinChangeDP(amount, sortedCoins.slice(0, i + 1));
      
      if (greedyResult.totalCoins > dpResult.totalCoins) {
        return false;
      }
    }
  }
  
  return true;
}
```

示意图 (硬币找零对比)：
```
标准系统[25,10,5,1]: 贪心最优
金额41: 25+10+5+1=4个硬币 ✓

非标准系统[25,10,1]: 贪心最优  
金额30: 25+1+1+1+1+1=6个硬币，但10+10+10=3个硬币更优 ✗

非标准系统[1,3,4]: 贪心非最优
金额6: 贪心4+1+1=3个硬币，但3+3=2个硬币更优 ✗
```

## 贪心算法应用模式

### 区间类问题

处理时间区间、空间区间等的选择与调度问题。

特点：
- 区间排序：通常需要按开始或结束时间排序
- 冲突检测：检查区间是否重叠
- 资源分配：将区间分配给有限的资源

```javascript
// 无重叠区间问题 - 移除最少数量的区间使剩余区间不重叠
export function eraseOverlapIntervals(intervals) {
  if (intervals.length === 0) return 0;
  
  // 按结束时间排序
  intervals.sort((a, b) => a.end - b.end);
  
  let count = 0;
  let lastEnd = intervals[0].end;
  
  // 贪心选择：保留结束最早的区间，移除冲突的区间
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i].start < lastEnd) {
      // 冲突，需要移除
      count++;
    } else {
      // 不冲突，更新最后结束时间
      lastEnd = intervals[i].end;
    }
  }
  
  return count;
}

// 会议室分配问题
export function minMeetingRooms(intervals) {
  const starts = intervals.map(i => i.start).sort((a, b) => a - b);
  const ends = intervals.map(i => i.end).sort((a, b) => a - b);
  
  let rooms = 0;
  let endPointer = 0;
  
  // 贪心策略：按时间线扫描，遇到开始时间需要房间，遇到结束时间释放房间
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] < ends[endPointer]) {
      // 需要新房间
      rooms++;
    } else {
      // 可以复用房间，移动结束指针
      endPointer++;
    }
  }
  
  return rooms;
}
```

示意图 (无重叠区间选择)：
```
区间: [1,2], [2,3], [3,4], [1,3]
按结束时间排序: [1,2], [2,3], [1,3], [3,4]

贪心选择:
保留[1,2], lastEnd=2
跳过[2,3]? 开始2>=lastEnd=2 → 保留, lastEnd=3
跳过[1,3]? 开始1<lastEnd=3 → 移除
跳过[3,4]? 开始3>=lastEnd=3 → 保留

最终保留: [1,2], [2,3], [3,4] 移除1个区间
```

### 调度类问题

处理任务调度、作业安排等优化问题。

特点：
- 截止时间：考虑任务的截止时间约束
- 惩罚避免：尽量减少超时或延迟
- 资源优化：最大化资源利用率

```javascript
// 任务调度问题 - 单机最大收益调度
export function jobScheduling(jobs) {
  // 按截止时间排序
  jobs.sort((a, b) => a.deadline - b.deadline);
  
  const selected = [];
  const minHeap = new MinHeap();
  let currentTime = 0;
  
  for (const job of jobs) {
    if (currentTime + job.duration <= job.deadline) {
      // 可以安排此任务
      minHeap.insert(job);
      selected.push(job);
      currentTime += job.duration;
    } else if (minHeap.size() > 0) {
      // 检查是否可以用当前任务替换堆中耗时最长的任务
      const longestJob = minHeap.peek();
      if (longestJob.duration > job.duration) {
        minHeap.extractMin();
        minHeap.insert(job);
        selected.splice(selected.indexOf(longestJob), 1, job);
        currentTime = currentTime - longestJob.duration + job.duration;
      }
    }
  }
  
  return {
    scheduledJobs: selected,
    totalJobs: selected.length,
    totalDuration: currentTime
  };
}

// 延迟调度问题 - 最小化最大延迟
export function minimizeMaxLateness(jobs) {
  // 按截止时间排序（最早截止时间优先）
  jobs.sort((a, b) => a.deadline - b.deadline);
  
  let currentTime = 0;
  let maxLateness = 0;
  const schedule = [];
  
  for (const job of jobs) {
    const completionTime = currentTime + job.duration;
    const lateness = Math.max(0, completionTime - job.deadline);
    maxLateness = Math.max(maxLateness, lateness);
    
    schedule.push({
      job: job.id,
      start: currentTime,
      completion: completionTime,
      lateness
    });
    
    currentTime = completionTime;
  }
  
  return {
    schedule,
    maxLateness
  };
}
```

示意图 (最早截止时间优先调度)：
```
任务: 
A: 时长3, 截止6
B: 时长2, 截止7  
C: 时长1, 截止5
D: 时长4, 截止9

EDD调度: C→A→B→D
时间线:
0-1: C (延迟0, 截止5)
1-4: A (延迟0, 截止6) 
4-6: B (延迟0, 截止7)
6-10: D (延迟1, 截止9)
最大延迟: 1
```

## 贪心算法局限性

### 贪心陷阱

贪心算法在某些问题中会陷入局部最优，无法得到全局最优解。

特点：
- 短视决策：当前最优可能阻塞更好的未来选择
- 路径依赖：早期选择限制后续选择空间
- 问题结构：不满足贪心选择性质的问题

```javascript
// 0-1背包问题 - 贪心算法失败案例
export function greedy01Knapsack(items, capacity) {
  // 尝试三种贪心策略
  
  // 策略1: 按价值排序
  const byValue = [...items].sort((a, b) => b.value - a.value);
  const result1 = applyGreedyStrategy(byValue, capacity);
  
  // 策略2: 按重量排序（轻的优先）
  const byWeight = [...items].sort((a, b) => a.weight - b.weight);
  const result2 = applyGreedyStrategy(byWeight, capacity);
  
  // 策略3: 按价值密度排序
  const byDensity = [...items].sort((a, b) => 
    (b.value / b.weight) - (a.value / a.weight)
  );
  const result3 = applyGreedyStrategy(byDensity, capacity);
  
  // 返回最佳结果
  const results = [result1, result2, result3];
  return results.reduce((best, current) => 
    current.totalValue > best.totalValue ? current : best
  );
}

function applyGreedyStrategy(items, capacity) {
  let remaining = capacity;
  let totalValue = 0;
  const selected = [];
  
  for (const item of items) {
    if (item.weight <= remaining) {
      selected.push(item);
      totalValue += item.value;
      remaining -= item.weight;
    }
  }
  
  return { selected, totalValue, remaining };
}

// 对比动态规划解
export function dp01Knapsack(items, capacity) {
  const n = items.length;
  const dp = Array(capacity + 1).fill(0);
  
  for (let i = 0; i < n; i++) {
    for (let w = capacity; w >= items[i].weight; w--) {
      dp[w] = Math.max(dp[w], items[i].value + dp[w - items[i].weight]);
    }
  }
  
  return dp[capacity];
}
```

示意图 (0-1 背包贪心失败)：
```
物品: 
A: 重量3, 价值5, 密度1.67
B: 重量2, 价值3, 密度1.50
C: 重量1, 价值2, 密度2.00
背包容量: 4

贪心按密度: C(密度2.0) → A(密度1.67) → 总价值7
但最优解: B + C → 重量3, 价值5 ✗
或: A + C → 重量4, 价值7 ✓

动态规划得到真正最优解
```

### 识别适用条件

判断问题是否适合使用贪心算法的准则和方法。

适用条件：
1. 贪心选择性质：局部最优能导向全局最优
2. 最优子结构：问题可分解为子问题
3. 无后效性：选择不影响后续决策空间

```javascript
// 贪心算法适用性检查
export class GreedySuitability {
  static canUseGreedy(problemType, constraints) {
    const checks = {
      'coin-change': this.checkCoinSystem,
      'interval-scheduling': this.checkIntervalProperties,
      'fractional-knapsack': () => true, // 总是适用
      '01-knapsack': () => false, // 总是不适用
      'minimum-spanning-tree': () => true
    };
    
    const checker = checks[problemType];
    return checker ? checker(constraints) : this.generalCheck(constraints);
  }
  
  static checkCoinSystem(coins) {
    // 检查硬币系统是否规范（如美国硬币系统）
    const standardSystems = [
      [1, 5, 10, 25, 50, 100], // 美分
      [1, 2, 5, 10, 20, 50, 100] // 欧元等
    ];
    
    return standardSystems.some(system => 
      arraysEqual(system.slice(0, coins.length), coins)
    );
  }
  
  static checkIntervalProperties(intervals) {
    // 检查区间问题是否具有贪心性质
    // 对于区间调度，按结束时间排序总是最优
    return true;
  }
  
  static generalCheck(constraints) {
    // 通用检查：问题是否具有最优子结构和贪心选择性质
    const { hasOptimalSubstructure, hasGreedyChoice } = constraints;
    return hasOptimalSubstructure && hasGreedyChoice;
  }
}

// 贪心与动态规划选择指南
export function selectAlgorithm(problem) {
  const { type, constraints, requirements } = problem;
  
  if (GreedySuitability.canUseGreedy(type, constraints)) {
    return {
      algorithm: 'greedy',
      reason: '问题满足贪心选择性质和最优子结构',
      complexity: '通常O(n log n)或更好'
    };
  } else {
    return {
      algorithm: 'dynamic-programming',
      reason: '问题需要全局最优解，贪心可能陷入局部最优',
      complexity: '通常O(n²)或O(nW)'
    };
  }
}
```

示意图 (算法选择决策树)：
```
问题类型?
├── 组合优化 → 有贪心选择性质? → 是 → 使用贪心
│               ↓否
│               使用动态规划
├── 调度问题 → 可排序解决? → 是 → 使用贪心  
│               ↓否
│               使用其他方法
└── 图论问题 → 最小生成树/最短路? → 是 → 使用贪心
                  ↓否
                  使用其他算法
```