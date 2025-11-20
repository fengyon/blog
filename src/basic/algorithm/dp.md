# 动态规划 DP

## 什么是动态规划

动态规划是通过将复杂问题分解为相互重叠的子问题，并存储子问题的解来避免重复计算的高效算法范式。其核心思想是“记住过去的结果”来优化未来计算。

特点：
- 重叠子问题：子问题被多次重复计算
- 最优子结构：问题的最优解包含子问题的最优解
- 状态存储：使用表格或数组存储中间结果
- 递推关系：通过状态转移方程描述问题演进

示意图 (斐波那契数列计算对比)：
```
递归方法（大量重复）：
fib(5)
├── fib(4)
│   ├── fib(3)
│   │   ├── fib(2)
│   │   └── fib(1)
│   └── fib(2)
└── fib(3)
    ├── fib(2)
    └── fib(1)

动态规划（无重复）：
fib[0]=0, fib[1]=1
fib[2]=fib[1]+fib[0]=1
fib[3]=fib[2]+fib[1]=2
fib[4]=fib[3]+fib[2]=3
fib[5]=fib[4]+fib[3]=5
```

## 动态规划核心要素

### 状态定义

状态是描述问题子集的变量，需要完整刻画子问题的特征。

特点：
- 完备性：状态应包含解决问题的足够信息
- 无后效性：未来状态只与当前状态有关，与如何到达当前状态无关
- 维度选择：根据问题复杂度选择一维、二维或多维状态

```javascript
// 不同问题的状态定义示例
export const stateExamples = {
  // 斐波那契：一维状态，dp[i]表示第i个斐波那契数
  fibonacci: (n) => {
    const dp = new Array(n + 1);
    dp[0] = 0; dp[1] = 1;
    return dp;
  },
  
  // 背包问题：二维状态，dp[i][w]表示前i个物品在容量w下的最大价值
  knapsack: (items, capacity) => {
    const n = items.length;
    const dp = Array.from({ length: n + 1 }, () => 
      new Array(capacity + 1).fill(0)
    );
    return dp;
  },
  
  // 最长公共子序列：二维状态，dp[i][j]表示X前i字符和Y前j字符的LCS长度
  lcs: (text1, text2) => {
    const m = text1.length, n = text2.length;
    const dp = Array.from({ length: m + 1 }, () => 
      new Array(n + 1).fill(0)
    );
    return dp;
  }
};
```

### 状态转移方程

状态转移方程描述状态之间的递推关系，是动态规划的灵魂。

特点：
- 数学表达：用公式描述状态演进规律
- 边界条件：定义初始状态和终止条件
- 递推方向：确定状态计算的顺序依赖

```javascript
// 经典问题的状态转移方程实现
export class StateTransition {
  // 斐波那契：F(n) = F(n-1) + F(n-2)
  static fibonacci(n) {
    if (n <= 1) return n;
    let prev2 = 0, prev1 = 1;
    
    for (let i = 2; i <= n; i++) {
      const current = prev1 + prev2;
      prev2 = prev1;
      prev1 = current;
    }
    
    return prev1;
  }
  
  // 爬楼梯：dp[i] = dp[i-1] + dp[i-2]
  static climbStairs(n) {
    if (n <= 2) return n;
    const dp = new Array(n + 1);
    dp[1] = 1; dp[2] = 2;
    
    for (let i = 3; i <= n; i++) {
      dp[i] = dp[i - 1] + dp[i - 2];
    }
    
    return dp[n];
  }
}
```

示意图 (状态转移可视化)：
```
斐波那契状态转移：
状态: dp[0] dp[1] dp[2] dp[3] dp[4] dp[5]
初始:  0     1     -     -     -     -
步骤1:          →   1     -     -     -    (dp[2]=dp[1]+dp[0])
步骤2:               →   2     -     -    (dp[3]=dp[2]+dp[1])
步骤3:                    →   3     -    (dp[4]=dp[3]+dp[2])
步骤4:                         →   5    (dp[5]=dp[4]+dp[3])
```

## 动态规划实现方法

### 自顶向下 - 记忆化搜索

从原问题出发，递归分解为子问题，使用备忘录存储已计算结果。

特点：
- 递归思维：符合问题自然的分解方式
- 惰性计算：只计算需要的子问题
- 代码直观：易于理解和实现

```javascript
// 记忆化搜索实现斐波那契
export function memoizedFibonacci(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  
  const result = memoizedFibonacci(n - 1, memo) + memoizedFibonacci(n - 2, memo);
  memo.set(n, result);
  return result;
}

// 记忆化搜索实现背包问题
export function memoizedKnapsack(weights, values, capacity) {
  const memo = new Map();
  
  function dfs(i, remainingCapacity) {
    if (i === weights.length || remainingCapacity === 0) {
      return 0;
    }
    
    const key = `${i},${remainingCapacity}`;
    if (memo.has(key)) return memo.get(key);
    
    // 不选当前物品
    let maxValue = dfs(i + 1, remainingCapacity);
    
    // 选当前物品（如果容量允许）
    if (weights[i] <= remainingCapacity) {
      maxValue = Math.max(
        maxValue,
        values[i] + dfs(i + 1, remainingCapacity - weights[i])
      );
    }
    
    memo.set(key, maxValue);
    return maxValue;
  }
  
  return dfs(0, capacity);
}
```

示意图 (记忆化搜索调用过程)：
```
knapsack(0,5)
├── 不选物品0: knapsack(1,5) → 查表/计算
└── 选物品0: 价值10 + knapsack(1,3) → 查表/计算

计算结果存入: memo["0,5"] = max(不选价值, 选择价值)
```

### 自底向上 - 表格填充

从最小子问题开始，逐步构建更大问题的解，填充 DP 表格。

特点：
- 迭代计算：避免递归开销
- 完整计算：计算所有子问题
- 空间优化：通常可以优化状态存储

```javascript
// 自底向上实现0-1背包问题
export function bottomUpKnapsack(weights, values, capacity) {
  const n = weights.length;
  const dp = Array.from({ length: n + 1 }, () => 
    new Array(capacity + 1).fill(0)
  );
  
  // 填充DP表格
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      // 不选第i个物品
      dp[i][w] = dp[i - 1][w];
      
      // 选第i个物品（如果容量允许）
      if (w >= weights[i - 1]) {
        dp[i][w] = Math.max(
          dp[i][w],
          values[i - 1] + dp[i - 1][w - weights[i - 1]]
        );
      }
    }
  }
  
  return {
    maxValue: dp[n][capacity],
    dpTable: dp
  };
}
```

示意图 (背包问题 DP 表格)：
```
容量:   0   1   2   3   4   5
物品0: [0,  0,  0,  0,  0,  0]  // 初始化
物品1: [0,  0,  0,  0,  10, 10] // 物品1(重量4,价值10)
物品2: [0,  0,  0,  5,  10, 10] // 物品2(重量3,价值5)
物品3: [0,  0,  0,  5,  10, 15] // 物品3(重量1,价值5)

dp[3][5] = max(dp[2][5], 价值5 + dp[2][4]) = max(10, 5+10)=15
```

## 经典动态规划问题

### 最长公共子序列 (LCS)

找到两个序列的最长公共子序列，展示二维 DP 的典型应用。

特点：
- 序列比对：比较两个序列的相似度
- 字符匹配：根据字符是否相等决定状态转移
- 路径回溯：通过 DP 表格回溯构造最优解

```javascript
// 最长公共子序列
export function longestCommonSubsequence(text1, text2) {
  const m = text1.length, n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => 
    new Array(n + 1).fill(0)
  );
  
  // 填充DP表格
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // 回溯构造LCS
  let lcs = '';
  let i = m, j = n;
  
  while (i > 0 && j > 0) {
    if (text1[i - 1] === text2[j - 1]) {
      lcs = text1[i - 1] + lcs;
      i--; j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return {
    length: dp[m][n],
    sequence: lcs,
    dpTable: dp
  };
}
```

示意图 (LCS 状态转移)：
```
文本1: "ABCD", 文本2: "ACBD"
DP表格:
    "" A C B D
""   0 0 0 0 0
A    0 1 1 1 1  
B    0 1 1 2 2
C    0 1 2 2 2
D    0 1 2 2 3

状态转移：
- 字符相等: dp[i][j] = dp[i-1][j-1] + 1
- 字符不等: dp[i][j] = max(dp[i-1][j], dp[i][j-1])

LCS: "ABD" 或 "ACD"，长度3
```

### 最长递增子序列 (LIS)

找到序列中最长的严格递增子序列，展示一维 DP 的优化技巧。

特点：
- 单序列分析：在单个序列中寻找模式
- 二分优化：使用耐心排序优化到 O(n log n)
- 多种解法：DP、贪心+二分等不同方法

```javascript
// 最长递增子序列 - O(n²) DP解法
export function longestIncreasingSubsequence(nums) {
  if (nums.length === 0) return 0;
  
  const dp = new Array(nums.length).fill(1);
  let maxLength = 1;
  
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[i] > nums[j]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    maxLength = Math.max(maxLength, dp[i]);
  }
  
  return maxLength;
}

// 最长递增子序列 - O(n log n) 优化解法
export function optimizedLIS(nums) {
  const tails = [];  // tails[i]表示长度为i+1的LIS的最小结尾值
  
  for (const num of nums) {
    // 二分查找插入位置
    let left = 0, right = tails.length;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (tails[mid] < num) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    if (left === tails.length) {
      tails.push(num);  // 扩展LIS
    } else {
      tails[left] = num;  // 替换为更小的结尾值
    }
  }
  
  return tails.length;
}
```

示意图 (耐心排序过程)：
```
序列: [10, 9, 2, 5, 3, 7, 101, 18]

堆栈演进:
数字10: [10]
数字9:  [9]        (替换10)
数字2:  [2]        (替换9) 
数字5:  [2, 5]     (新建堆栈)
数字3:  [2, 3]     (替换5)
数字7:  [2, 3, 7]  (新建堆栈)
数字101:[2, 3, 7, 101] (新建堆栈)
数字18: [2, 3, 7, 18]  (替换101)

LIS长度: 4 (如 [2,3,7,18] 或 [2,3,7,101])
```

## 动态规划优化技巧

### 状态压缩

通过观察状态依赖关系，减少 DP 数组的维度，节省空间。

特点：
- 空间优化：将 O(n²) 空间降为 O(n) 或 O(1)
- 滚动数组：只保留必要的状态层
- 位压缩：使用位运算表示状态

```javascript
// 背包问题空间优化 - 滚动数组
export function optimizedKnapsack(weights, values, capacity) {
  const n = weights.length;
  const dp = new Array(capacity + 1).fill(0);
  
  for (let i = 0; i < n; i++) {
    // 逆序更新，避免覆盖前一状态
    for (let w = capacity; w >= weights[i]; w--) {
      dp[w] = Math.max(dp[w], values[i] + dp[w - weights[i]]);
    }
  }
  
  return dp[capacity];
}

// 爬楼梯空间优化 - 只用三个变量
export function optimizedClimbStairs(n) {
  if (n <= 2) return n;
  
  let prev2 = 1;  // dp[i-2]
  let prev1 = 2;  // dp[i-1]
  let current;    // dp[i]
  
  for (let i = 3; i <= n; i++) {
    current = prev1 + prev2;
    prev2 = prev1;
    prev1 = current;
  }
  
  return current;
}
```

示意图 (背包问题状态压缩)：
```
未优化：二维数组
i=0: [0,0,0,0,10,10] 
i=1: [0,0,0,5,10,10]  ← 需要保存前一行
i=2: [0,0,0,5,10,15]

优化后：一维数组，逆序更新
初始: [0,0,0,0,0,0]
处理物品0后: [0,0,0,0,10,10]  
处理物品1后: [0,0,0,5,10,10]   ← 逆序更新避免覆盖
处理物品2后: [0,0,0,5,10,15]
```

### 状态重新定义

有时重新定义状态可以简化状态转移方程或降低复杂度。

特点：
- 视角转换：从不同角度理解问题
- 简化转移：使状态转移更直接
- 降维打击：将高维问题转化为低维

```javascript
// 股票买卖问题 - 状态机DP
export function maxProfit(prices) {
  const n = prices.length;
  if (n < 2) return 0;
  
  // 状态定义：dp[i][0]表示第i天不持有股票的最大利润
  //          dp[i][1]表示第i天持有股票的最大利润
  let dp0 = 0;           // 初始不持有，利润为0
  let dp1 = -prices[0];  // 初始持有，需要购买，利润为负
  
  for (let i = 1; i < n; i++) {
    const newDp0 = Math.max(dp0, dp1 + prices[i]);  // 卖出或保持
    const newDp1 = Math.max(dp1, dp0 - prices[i]);  // 买入或保持
    dp0 = newDp0;
    dp1 = newDp1;
  }
  
  return dp0;  // 最后不持有股票才能获得最大利润
}
```

示意图 (股票买卖状态转移)：
```
价格: [7,1,5,3,6,4]
状态转移:
天数 价格 不持有dp0      持有dp1
0    7    0             -7
1    1    max(0,-7+1)=0 max(-7,0-1)=-1
2    5    max(0,-1+5)=4 max(-1,0-5)=-1
3    3    max(4,-1+3)=4 max(-1,4-3)=1
4    6    max(4,1+6)=7  max(1,4-6)=1
5    4    max(7,1+4)=7  max(1,7-4)=3

最大利润: 7 (第2天买入1，第3天卖出5，第4天买入3，第5天卖出6)
```

## 动态规划解题框架

### 问题分析步骤

系统化的 DP 问题分析方法，确保正确识别和解决问题。

分析流程：
1. 判断是否具有最优子结构
2. 定义合适的状态变量
3. 推导状态转移方程
4. 确定初始条件和边界
5. 选择实现方法 (自顶向下/自底向上)
6. 考虑空间优化可能性

```javascript
// 通用DP解题模板
export class DPTemplate {
  static solve(problem) {
    // 1. 状态定义
    const state = this.defineState(problem);
    
    // 2. 初始条件
    this.initializeState(state, problem);
    
    // 3. 状态转移
    for (const condition of this.getTransitionOrder(problem)) {
      this.updateState(state, condition, problem);
    }
    
    // 4. 提取结果
    return this.extractResult(state, problem);
  }
  
  static defineState(problem) {
    // 根据问题特性定义状态结构
    throw new Error('defineState must be implemented');
  }
  
  static initializeState(state, problem) {
    // 设置初始状态和边界条件
    throw new Error('initializeState must be implemented');
  }
  
  static getTransitionOrder(problem) {
    // 确定状态转移的顺序
    throw new Error('getTransitionOrder must be implemented');
  }
  
  static updateState(state, condition, problem) {
    // 根据状态转移方程更新状态
    throw new Error('updateState must be implemented');
  }
  
  static extractResult(state, problem) {
    // 从最终状态提取问题答案
    throw new Error('extractResult must be implemented');
  }
}
```

### 调试与验证

DP 算法的调试技巧和验证方法，确保正确性。

调试策略：
- 打印 DP 表格：可视化状态演进过程
- 小规模测试：先用简单例子验证
- 边界检查：特别注意边界条件处理
- 对比验证：与暴力解法或已知结果对比

```javascript
// DP调试工具函数
export class DPDebugger {
  // 打印DP表格（适用于二维DP）
  static printDPTable(dp, rowLabels = [], colLabels = []) {
    console.log('DP Table:');
    
    // 打印列标签
    if (colLabels.length > 0) {
      console.log('    ' + colLabels.map(label => 
        label.toString().padStart(4)
      ).join(' '));
    }
    
    // 打印表格内容
    for (let i = 0; i < dp.length; i++) {
      let row = '';
      if (rowLabels.length > i) {
        row += rowLabels[i].toString().padStart(3) + ' ';
      } else {
        row += i.toString().padStart(3) + ' ';
      }
      
      row += dp[i].map(val => val.toString().padStart(4)).join(' ');
      console.log(row);
    }
  }
  
  // 验证DP结果与暴力解的一致性
  static async verifyWithBruteForce(dpSolver, bruteForceSolver, testCases) {
    for (const testCase of testCases) {
      const dpResult = await dpSolver(testCase);
      const bruteResult = await bruteForceSolver(testCase);
      
      if (dpResult !== bruteResult) {
        console.error(`Test case failed:`, testCase);
        console.error(`DP result: ${dpResult}, Brute force: ${bruteResult}`);
        return false;
      }
    }
    
    console.log('All test cases passed!');
    return true;
  }
}
```