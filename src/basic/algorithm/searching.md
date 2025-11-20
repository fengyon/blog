# 搜索算法

## 什么是搜索算法

搜索算法是在数据集合中查找特定元素或满足特定条件元素的计算过程。搜索是计算机科学中最基础且重要的操作之一，广泛应用于数据处理、人工智能、数据库系统等领域。

特点：
- 目标导向：明确查找目标或搜索条件
- 效率关键：搜索性能直接影响系统响应速度
- 适用性广：从简单数组到复杂图结构都能应用
- 策略多样：根据数据结构特点选择不同搜索策略

示意图 (搜索过程)：
```
数据集: [●, ●, ●, ●, ●, ●, ●, ●, ●, ●]
搜索目标: ★
搜索过程: 检查每个位置 → 找到目标位置
结果: [●, ●, ●, ★, ●, ●, ●, ●, ●, ●]
```

## 搜索算法分类

### 无序搜索

在未排序的数据集中进行搜索，需要检查每个元素直到找到目标。

特点：
- 通用性强：不要求数据有序
- 简单直观：算法逻辑容易理解
- 线性复杂度：最坏情况需要检查所有元素

```javascript
// 无序搜索的通用接口
export class SearchAlgorithm {
  static search(array, target, options = {}) {
    throw new Error('必须由具体搜索算法实现');
  }
  
  // 通用比较函数
  static defaultCompare(a, b) {
    if (a === b) return 0;
    return a < b ? -1 : 1;
  }
  
  // 通用相等判断
  static defaultEquals(a, b) {
    return a === b;
  }
}
```

### 有序搜索

在已排序的数据集中利用有序性进行高效搜索。

特点：
- 效率高：利用有序性大幅减少比较次数
- 要求前提：数据必须预先排序
- 对数复杂度：二分搜索等算法达到 O(log n)

示意图 (搜索算法分类)：
```
搜索算法
├── 无序搜索
│   ├── 线性搜索
│   ├── 跳跃搜索
│   └── 散列搜索
└── 有序搜索
    ├── 二分搜索
    ├── 插值搜索
    ├── 指数搜索
    └── 斐波那契搜索
```

## 基本搜索算法

### 线性搜索

逐个检查数据集中的每个元素，直到找到目标或遍历完所有元素。

特点：
- 简单直接：最容易理解和实现的搜索算法
- 无预处理：不需要数据预先排序或特殊结构
- 通用性强：适用于任何可遍历的数据结构

```javascript
// 线性搜索实现
export function linearSearch(array, target, equalsFn = SearchAlgorithm.defaultEquals) {
  for (let i = 0; i < array.length; i++) {
    if (equalsFn(array[i], target)) {
      return {
        index: i,
        value: array[i],
        comparisons: i + 1 // 比较次数
      };
    }
  }
  
  return {
    index: -1,
    value: null,
    comparisons: array.length
  };
}

// 线性搜索的变体 - 查找所有匹配项
export function linearSearchAll(array, target, equalsFn = SearchAlgorithm.defaultEquals) {
  const results = [];
  let comparisons = 0;
  
  for (let i = 0; i < array.length; i++) {
    comparisons++;
    if (equalsFn(array[i], target)) {
      results.push({
        index: i,
        value: array[i]
      });
    }
  }
  
  return {
    results,
    comparisons,
    count: results.length
  };
}

// 哨兵线性搜索 - 减少比较次数
export function sentinelLinearSearch(array, target, equalsFn = SearchAlgorithm.defaultEquals) {
  const n = array.length;
  if (n === 0) return { index: -1, value: null, comparisons: 0 };
  
  // 保存最后一个元素
  const last = array[n - 1];
  // 将目标设置为最后一个元素（哨兵）
  array[n - 1] = target;
  
  let i = 0;
  let comparisons = 0;
  
  while (!equalsFn(array[i], target)) {
    i++;
    comparisons++;
  }
  
  // 恢复最后一个元素
  array[n - 1] = last;
  
  if (i < n - 1 || equalsFn(last, target)) {
    return {
      index: i,
      value: array[i],
      comparisons: comparisons + 1
    };
  }
  
  return {
    index: -1,
    value: null,
    comparisons: comparisons + 1
  };
}
```

示意图 (线性搜索过程)：
```
数组: [5, 2, 8, 1, 9, 3, 7, 4]
搜索目标: 9

搜索过程:
索引0: 5 ≠ 9 → 继续
索引1: 2 ≠ 9 → 继续
索引2: 8 ≠ 9 → 继续
索引3: 1 ≠ 9 → 继续
索引4: 9 = 9 → 找到目标

比较次数: 5
结果: 索引4, 值9
```

### 二分搜索

在有序数组中通过反复将搜索区间减半来快速定位目标元素。

特点：
- 高效搜索：时间复杂度 O(log n)
- 要求有序：数据必须预先排序
- 分治策略：每次排除一半的搜索空间

```javascript
// 二分搜索实现 - 迭代版本
export function binarySearchIterative(array, target, compareFn = SearchAlgorithm.defaultCompare) {
  let left = 0;
  let right = array.length - 1;
  let comparisons = 0;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    comparisons++;
    
    const comparison = compareFn(array[mid], target);
    
    if (comparison === 0) {
      return {
        index: mid,
        value: array[mid],
        comparisons
      };
    } else if (comparison < 0) {
      // 目标在右半部分
      left = mid + 1;
    } else {
      // 目标在左半部分
      right = mid - 1;
    }
  }
  
  return {
    index: -1,
    value: null,
    comparisons
  };
}

// 二分搜索实现 - 递归版本
export function binarySearchRecursive(array, target, compareFn = SearchAlgorithm.defaultCompare) {
  function search(left, right, comparisons = 0) {
    if (left > right) {
      return {
        index: -1,
        value: null,
        comparisons
      };
    }
    
    const mid = Math.floor((left + right) / 2);
    const newComparisons = comparisons + 1;
    
    const comparison = compareFn(array[mid], target);
    
    if (comparison === 0) {
      return {
        index: mid,
        value: array[mid],
        comparisons: newComparisons
      };
    } else if (comparison < 0) {
      return search(mid + 1, right, newComparisons);
    } else {
      return search(left, mid - 1, newComparisons);
    }
  }
  
  return search(0, array.length - 1);
}

// 二分搜索变体 - 查找第一个出现的位置
export function binarySearchFirst(array, target, compareFn = SearchAlgorithm.defaultCompare) {
  let left = 0;
  let right = array.length - 1;
  let result = -1;
  let comparisons = 0;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    comparisons++;
    
    const comparison = compareFn(array[mid], target);
    
    if (comparison === 0) {
      result = mid;
      // 继续在左半部分查找更早的出现
      right = mid - 1;
    } else if (comparison < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return {
    index: result,
    value: result !== -1 ? array[result] : null,
    comparisons
  };
}

// 二分搜索变体 - 查找最后一个出现的位置
export function binarySearchLast(array, target, compareFn = SearchAlgorithm.defaultCompare) {
  let left = 0;
  let right = array.length - 1;
  let result = -1;
  let comparisons = 0;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    comparisons++;
    
    const comparison = compareFn(array[mid], target);
    
    if (comparison === 0) {
      result = mid;
      // 继续在右半部分查找更晚的出现
      left = mid + 1;
    } else if (comparison < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return {
    index: result,
    value: result !== -1 ? array[result] : null,
    comparisons
  };
}
```

示意图 (二分搜索过程)：
```
有序数组: [1, 2, 5, 8, 9, 13, 17, 21, 25]
搜索目标: 13

搜索过程:
初始区间: [0, 8]
mid = 4 → 值9 < 13 → 搜索右半部分 [5, 8]
mid = 6 → 值17 > 13 → 搜索左半部分 [5, 5]  
mid = 5 → 值13 = 13 → 找到目标

比较次数: 3
搜索路径: 9 → 17 → 13

可视化:
[1,2,5,8,9,13,17,21,25]
         ↑ 第一次比较: 9 < 13 → 向右
[1,2,5,8,9,13,17,21,25]
               ↑ 第二次比较: 17 > 13 → 向左  
[1,2,5,8,9,13,17,21,25]
            ↑ 第三次比较: 13 = 13 → 找到
```

## 高级搜索算法

### 插值搜索

在有序数组中根据目标值的分布估计其位置，适用于均匀分布的数据。

特点：
- 自适应估计：根据值域分布预测目标位置
- 超线性性能：对于均匀分布数据性能优于二分搜索
- 分布敏感：性能依赖于数据的实际分布

```javascript
// 插值搜索实现
export function interpolationSearch(array, target, compareFn = SearchAlgorithm.defaultCompare) {
  let left = 0;
  let right = array.length - 1;
  let comparisons = 0;
  
  while (left <= right && target >= array[left] && target <= array[right]) {
    // 特殊情况：左右边界相等
    if (array[left] === array[right]) {
      comparisons++;
      if (array[left] === target) {
        return {
          index: left,
          value: array[left],
          comparisons
        };
      }
      break;
    }
    
    // 计算插值位置
    const position = left + Math.floor(
      ((target - array[left]) * (right - left)) / (array[right] - array[left])
    );
    
    comparisons++;
    const comparison = compareFn(array[position], target);
    
    if (comparison === 0) {
      return {
        index: position,
        value: array[position],
        comparisons
      };
    } else if (comparison < 0) {
      left = position + 1;
    } else {
      right = position - 1;
    }
  }
  
  return {
    index: -1,
    value: null,
    comparisons
  };
}

// 安全的插值搜索 - 防止数值计算问题
export function safeInterpolationSearch(array, target, compareFn = SearchAlgorithm.defaultCompare) {
  let low = 0;
  let high = array.length - 1;
  let comparisons = 0;
  
  while (low <= high) {
    // 防止除零和数值溢出
    if (array[high] === array[low]) {
      comparisons++;
      if (array[low] === target) {
        return { index: low, value: array[low], comparisons };
      }
      break;
    }
    
    // 计算插值位置，添加边界保护
    const mid = low + Math.min(
      Math.floor(((target - array[low]) * (high - low)) / (array[high] - array[low])),
      high - low
    );
    
    // 确保mid在有效范围内
    const safeMid = Math.max(low, Math.min(mid, high));
    
    comparisons++;
    const comparison = compareFn(array[safeMid], target);
    
    if (comparison === 0) {
      return {
        index: safeMid,
        value: array[safeMid],
        comparisons
      };
    } else if (comparison < 0) {
      low = safeMid + 1;
    } else {
      high = safeMid - 1;
    }
  }
  
  return {
    index: -1,
    value: null,
    comparisons
  };
}
```

示意图 (插值搜索 vs 二分搜索)：
```
均匀分布数组: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
搜索目标: 65

二分搜索:
mid = 4 → 50 < 65 → 搜索[5,9]
mid = 7 → 80 > 65 → 搜索[5,6]  
mid = 5 → 60 < 65 → 搜索[6,6]
mid = 6 → 70 > 65 → 未找到
比较次数: 4

插值搜索:
估计位置 = 0 + ((65-10)*(9-0))/(100-10) = 0 + (55*9)/90 = 5.5 → 位置5
值60 < 65 → 搜索[6,9]
估计位置 = 6 + ((65-70)*(9-6))/(100-70) = 6 + (-5*3)/30 = 5.5 → 位置5(调整到6)
值70 > 65 → 未找到
比较次数: 2

注意: 此例中插值搜索更快找到目标区域
```

### 指数搜索

先确定目标值可能存在的范围，然后在该范围内进行二分搜索。

特点：
- 范围定位：快速确定搜索边界
- 无界搜索：适用于流数据或未知大小的数据集
- 高效结合：结合了线性扩展和二分搜索的优点

```javascript
// 指数搜索实现
export function exponentialSearch(array, target, compareFn = SearchAlgorithm.defaultCompare) {
  const n = array.length;
  
  // 如果数组为空
  if (n === 0) {
    return {
      index: -1,
      value: null,
      comparisons: 0
    };
  }
  
  // 如果第一个元素就是目标
  let comparisons = 1;
  if (compareFn(array[0], target) === 0) {
    return {
      index: 0,
      value: array[0],
      comparisons
    };
  }
  
  // 指数扩展确定范围
  let bound = 1;
  while (bound < n && compareFn(array[bound], target) <= 0) {
    comparisons++;
    bound *= 2;
  }
  
  // 在确定的范围内进行二分搜索
  const left = Math.floor(bound / 2);
  const right = Math.min(bound, n - 1);
  
  const binaryResult = binarySearchInRange(
    array, target, left, right, compareFn, comparisons
  );
  
  return binaryResult;
}

// 在指定范围内进行二分搜索
function binarySearchInRange(array, target, left, right, compareFn, initialComparisons = 0) {
  let currentLeft = left;
  let currentRight = right;
  let comparisons = initialComparisons;
  
  while (currentLeft <= currentRight) {
    const mid = Math.floor((currentLeft + currentRight) / 2);
    comparisons++;
    
    const comparison = compareFn(array[mid], target);
    
    if (comparison === 0) {
      return {
        index: mid,
        value: array[mid],
        comparisons
      };
    } else if (comparison < 0) {
      currentLeft = mid + 1;
    } else {
      currentRight = mid - 1;
    }
  }
  
  return {
    index: -1,
    value: null,
    comparisons
  };
}

// 适用于无限数据流的指数搜索
export function exponentialSearchInfinite(stream, target, compareFn = SearchAlgorithm.defaultCompare) {
  let bound = 1;
  let comparisons = 0;
  
  // 指数扩展直到找到可能包含目标的边界
  while (true) {
    try {
      const value = stream.read(bound);
      comparisons++;
      
      const comparison = compareFn(value, target);
      if (comparison === 0) {
        return {
          index: bound,
          value,
          comparisons,
          found: true
        };
      } else if (comparison > 0) {
        // 找到上界，进行二分搜索
        break;
      }
      
      bound *= 2;
    } catch (error) {
      // 达到流末尾
      break;
    }
  }
  
  // 在[bound/2, bound]范围内搜索
  const left = Math.floor(bound / 2);
  const right = bound;
  
  for (let i = left; i <= right; i++) {
    try {
      const value = stream.read(i);
      comparisons++;
      
      if (compareFn(value, target) === 0) {
        return {
          index: i,
          value,
          comparisons,
          found: true
        };
      }
    } catch (error) {
      // 达到流末尾
      break;
    }
  }
  
  return {
    index: -1,
    value: null,
    comparisons,
    found: false
  };
}
```

示意图 (指数搜索过程)：
```
有序数组: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25]
搜索目标: 17

指数扩展阶段:
检查索引1: 3 < 17 → 继续
检查索引2: 5 < 17 → 继续  
检查索引4: 9 < 17 → 继续
检查索引8: 17 = 17? 不，先检查边界
现在bound=8, 前一个bound=4

确定搜索范围: [bound/2=4, bound=8] → [4,8]

二分搜索阶段:
在[4,8]内二分搜索:
mid=6 → 13 < 17 → 搜索[7,8]
mid=7 → 15 < 17 → 搜索[8,8]
mid=8 → 17 = 17 → 找到目标

总比较次数: 6 (扩展4次 + 二分2次)
```

## 图搜索算法

### 深度优先搜索 (DFS)

沿着图的深度方向遍历，尽可能深地搜索图的分支。

特点：
- 深度优先：先深入到最远的节点再回溯
- 栈结构：使用栈 (显式或隐式) 管理待访问节点
- 路径探索：适合寻找路径或连通分量

```javascript
// 深度优先搜索实现
export function depthFirstSearch(graph, startNode, targetNode = null) {
  const visited = new Set();
  const stack = [startNode];
  const parent = new Map(); // 记录路径
  let steps = 0;
  
  visited.add(startNode);
  parent.set(startNode, null);
  
  while (stack.length > 0) {
    const currentNode = stack.pop();
    steps++;
    
    // 如果指定了目标节点且找到目标
    if (targetNode && currentNode === targetNode) {
      return {
        found: true,
        target: currentNode,
        steps,
        path: reconstructPath(parent, startNode, targetNode)
      };
    }
    
    // 遍历邻居节点
    const neighbors = graph.getNeighbors(currentNode);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, currentNode);
        stack.push(neighbor);
      }
    }
  }
  
  return {
    found: targetNode ? false : true,
    visited: Array.from(visited),
    steps,
    path: targetNode ? null : null
  };
}

// DFS递归实现
export function depthFirstSearchRecursive(graph, startNode, targetNode = null) {
  const visited = new Set();
  const parent = new Map();
  let steps = 0;
  
  function dfs(currentNode) {
    steps++;
    visited.add(currentNode);
    
    // 检查是否找到目标
    if (targetNode && currentNode === targetNode) {
      return currentNode;
    }
    
    // 递归访问邻居
    const neighbors = graph.getNeighbors(currentNode);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        parent.set(neighbor, currentNode);
        const result = dfs(neighbor);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  parent.set(startNode, null);
  const result = dfs(startNode);
  
  return {
    found: !!result,
    target: result,
    steps,
    path: result ? reconstructPath(parent, startNode, result) : null,
    visited: Array.from(visited)
  };
}

// 路径重建辅助函数
function reconstructPath(parent, start, target) {
  const path = [];
  let current = target;
  
  while (current !== null) {
    path.unshift(current);
    current = parent.get(current);
  }
  
  return path;
}
```

示意图 (DFS 遍历过程)：
```
图结构:
    A
   / \
  B   C
 / \   \
D   E   F

从A开始的DFS:
栈状态: [A]
弹出A → 访问A
推入C, B → 栈: [C, B]

弹出B → 访问B
推入E, D → 栈: [C, E, D]

弹出D → 访问D → 栈: [C, E]
弹出E → 访问E → 栈: [C]
弹出C → 访问C
推入F → 栈: [F]

弹出F → 访问F → 栈空

访问顺序: A → B → D → E → C → F
```

### 广度优先搜索 (BFS)

按层次遍历图，先访问所有相邻节点再深入下一层。

特点：
- 层次遍历：按距离起始节点的层次顺序访问
- 队列结构：使用队列管理待访问节点
- 最短路径：在无权图中能找到最短路径

```javascript
// 广度优先搜索实现
export function breadthFirstSearch(graph, startNode, targetNode = null) {
  const visited = new Set();
  const queue = [startNode];
  const parent = new Map();
  const distance = new Map(); // 记录距离
  let steps = 0;
  
  visited.add(startNode);
  parent.set(startNode, null);
  distance.set(startNode, 0);
  
  while (queue.length > 0) {
    const currentNode = queue.shift();
    steps++;
    
    // 如果指定了目标节点且找到目标
    if (targetNode && currentNode === targetNode) {
      return {
        found: true,
        target: currentNode,
        steps,
        path: reconstructPath(parent, startNode, targetNode),
        distance: distance.get(currentNode)
      };
    }
    
    // 遍历邻居节点
    const neighbors = graph.getNeighbors(currentNode);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, currentNode);
        distance.set(neighbor, distance.get(currentNode) + 1);
        queue.push(neighbor);
      }
    }
  }
  
  return {
    found: targetNode ? false : true,
    visited: Array.from(visited),
    steps,
    distances: distance,
    path: targetNode ? null : null
  };
}

// 带层级的BFS - 记录每层的节点
export function breadthFirstSearchWithLevels(graph, startNode) {
  const visited = new Set();
  const queue = [{ node: startNode, level: 0 }];
  const levels = new Map(); // 每层的节点
  const parent = new Map();
  let steps = 0;
  
  visited.add(startNode);
  parent.set(startNode, null);
  
  while (queue.length > 0) {
    const { node: currentNode, level: currentLevel } = queue.shift();
    steps++;
    
    // 初始化当前层级
    if (!levels.has(currentLevel)) {
      levels.set(currentLevel, []);
    }
    levels.get(currentLevel).push(currentNode);
    
    // 遍历邻居
    const neighbors = graph.getNeighbors(currentNode);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, currentNode);
        queue.push({ node: neighbor, level: currentLevel + 1 });
      }
    }
  }
  
  return {
    visited: Array.from(visited),
    steps,
    levels: Array.from(levels.entries()).sort((a, b) => a[0] - b[0]),
    parent
  };
}
```

示意图 (BFS 遍历过程)：
```
图结构:
    A
   / \
  B   C
 / \   \
D   E   F

从A开始的BFS:
队列状态: [A]
处理A → 访问A
加入B, C → 队列: [B, C]

处理B → 访问B  
加入D, E → 队列: [C, D, E]

处理C → 访问C
加入F → 队列: [D, E, F]

处理D → 访问D → 队列: [E, F]
处理E → 访问E → 队列: [F]  
处理F → 访问F → 队列空

访问顺序: A → B → C → D → E → F
层次: 
0: [A]
1: [B, C]
2: [D, E, F]
```

## 启发式搜索算法

### A*搜索

结合 Dijkstra 算法和贪心最佳优先搜索，使用启发式函数指导搜索方向。

特点：
- 代价敏感：综合考虑实际代价和预估代价
- 最优性保证：在可采纳启发式下能找到最优解
- 效率平衡：比 Dijkstra 更快，比贪心搜索更可靠

```javascript
// A*搜索算法实现
export function aStarSearch(graph, startNode, targetNode, heuristicFn) {
  // 开放集 - 待探索的节点
  const openSet = new PriorityQueue((a, b) => a.fScore - b.fScore);
  // 关闭集 - 已探索的节点
  const closedSet = new Set();
  // 从起点到当前节点的实际代价
  const gScore = new Map();
  // 父节点映射
  const parent = new Map();
  let steps = 0;
  
  // 初始化
  gScore.set(startNode, 0);
  openSet.enqueue({
    node: startNode,
    fScore: heuristicFn(startNode, targetNode)
  });
  
  while (!openSet.isEmpty()) {
    steps++;
    const current = openSet.dequeue().node;
    
    // 找到目标
    if (current === targetNode) {
      return {
        found: true,
        target: current,
        steps,
        path: reconstructPath(parent, startNode, targetNode),
        cost: gScore.get(current)
      };
    }
    
    closedSet.add(current);
    
    // 探索邻居
    const neighbors = graph.getNeighbors(current);
    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor)) {
        continue;
      }
      
      // 计算从起点经current到neighbor的代价
      const tentativeGScore = gScore.get(current) + graph.getCost(current, neighbor);
      
      if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)) {
        // 找到更优路径
        parent.set(neighbor, current);
        gScore.set(neighbor, tentativeGScore);
        
        const fScore = tentativeGScore + heuristicFn(neighbor, targetNode);
        
        // 如果邻居不在开放集中，加入
        if (!openSet.contains(neighbor)) {
          openSet.enqueue({
            node: neighbor,
            fScore
          });
        }
      }
    }
  }
  
  // 未找到路径
  return {
    found: false,
    steps,
    path: null
  };
}

// 优先队列实现（最小堆）
class PriorityQueue {
  constructor(compareFn = (a, b) => a - b) {
    this.heap = [];
    this.compare = compareFn;
    this.nodeMap = new Map(); // 快速查找节点
  }
  
  enqueue(item) {
    this.heap.push(item);
    this.nodeMap.set(item.node, item);
    this.bubbleUp(this.heap.length - 1);
  }
  
  dequeue() {
    const min = this.heap[0];
    const end = this.heap.pop();
    this.nodeMap.delete(min.node);
    
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    
    return min;
  }
  
  isEmpty() {
    return this.heap.length === 0;
  }
  
  contains(node) {
    return this.nodeMap.has(node);
  }
  
  bubbleUp(idx) {
    const element = this.heap[idx];
    
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.heap[parentIdx];
      
      if (this.compare(element, parent) >= 0) break;
      
      this.heap[parentIdx] = element;
      this.heap[idx] = parent;
      idx = parentIdx;
    }
  }
  
  sinkDown(idx) {
    const length = this.heap.length;
    const element = this.heap[idx];
    
    while (true) {
      let leftChildIdx = 2 * idx + 1;
      let rightChildIdx = 2 * idx + 2;
      let swap = null;
      let leftChild, rightChild;
      
      if (leftChildIdx < length) {
        leftChild = this.heap[leftChildIdx];
        if (this.compare(leftChild, element) < 0) {
          swap = leftChildIdx;
        }
      }
      
      if (rightChildIdx < length) {
        rightChild = this.heap[rightChildIdx];
        if (
          (swap === null && this.compare(rightChild, element) < 0) ||
          (swap !== null && this.compare(rightChild, leftChild) < 0)
        ) {
          swap = rightChildIdx;
        }
      }
      
      if (swap === null) break;
      
      this.heap[idx] = this.heap[swap];
      this.heap[swap] = element;
      idx = swap;
    }
  }
}
```

示意图 (A*搜索过程)：
```
网格地图 (数字表示启发式代价):
S:起点, G:目标, #:障碍物

  0  1  2  3  4
0 S  2  3  4  5
1 1  2  #  4  5  
2 2  3  4  5  G
3 3  4  5  6  7

A*搜索过程:
f(n) = g(n) + h(n)
g(n): 从起点到n的实际代价
h(n): 从n到目标的预估代价(曼哈顿距离)

开放集演变:
初始: [S(f=0+4=4)]
处理S: 加入邻居(0,1)(f=1+3=4), (1,0)(f=1+5=6)
       开放集: [(0,1):4, (1,0):6]
处理(0,1): 加入(0,2)(f=2+4=6), (1,1)(f=2+4=6)
       开放集: [(1,0):6, (0,2):6, (1,1):6]
处理(1,0): 加入(2,0)(f=2+6=8) → 开放集: [(0,2):6, (1,1):6, (2,0):8]
... 继续直到找到目标

最终路径: S → (0,1) → (1,1) → (2,2) → G
```

## 搜索算法性能分析

### 时间复杂度比较

不同搜索算法在各种数据结构下的时间效率分析。

```javascript
// 搜索算法性能测试工具
export class SearchBenchmark {
  static benchmarkSearch(searchFn, testData, iterations = 100) {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const result = searchFn(...testData);
      const endTime = performance.now();
      
      results.push({
        time: endTime - startTime,
        comparisons: result.comparisons || 0,
        found: result.found !== undefined ? result.found : result.index !== -1
      });
    }
    
    const avgTime = results.reduce((sum, r) => sum + r.time, 0) / iterations;
    const avgComparisons = results.reduce((sum, r) => sum + r.comparisons, 0) / iterations;
    const successRate = results.filter(r => r.found).length / iterations;
    
    return {
      avgTime,
      avgComparisons,
      successRate,
      rawResults: results
    };
  }
  
  static compareAlgorithms(algorithms, testDataSets) {
    const comparisonResults = {};
    
    for (const [dataSetName, testData] of Object.entries(testDataSets)) {
      comparisonResults[dataSetName] = {};
      
      for (const [algoName, searchFn] of Object.entries(algorithms)) {
        comparisonResults[dataSetName][algoName] = this.benchmarkSearch(
          searchFn, 
          testData
        );
      }
    }
    
    return comparisonResults;
  }
  
  // 生成测试数据
  static generateTestData(type, size, options = {}) {
    switch (type) {
      case 'sorted-array':
        const sortedArray = Array.from({ length: size }, (_, i) => i);
        const target = options.target !== undefined ? 
          options.target : Math.floor(Math.random() * size);
        return [sortedArray, target];
      
      case 'unsorted-array':
        const unsortedArray = Array.from({ length: size }, () => 
          Math.floor(Math.random() * size)
        );
        const unsortedTarget = options.target !== undefined ? 
          options.target : unsortedArray[Math.floor(Math.random() * size)];
        return [unsortedArray, unsortedTarget];
      
      case 'graph':
        // 生成测试图
        const graph = this.generateTestGraph(size, options);
        const startNode = options.startNode || 0;
        const targetNode = options.targetNode || size - 1;
        return [graph, startNode, targetNode];
      
      default:
        throw new Error(`Unknown test data type: ${type}`);
    }
  }
  
  static generateTestGraph(nodeCount, options = {}) {
    // 简单的网格图生成器
    const graph = {
      nodes: Array.from({ length: nodeCount }, (_, i) => i),
      edges: new Map(),
      getNeighbors: function(node) {
        return this.edges.get(node) || [];
      },
      getCost: function(from, to) {
        // 简单实现：所有边代价为1
        return 1;
      }
    };
    
    // 创建网格连接
    const gridSize = Math.ceil(Math.sqrt(nodeCount));
    for (let i = 0; i < nodeCount; i++) {
      const neighbors = [];
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      // 添加相邻节点
      if (row > 0) neighbors.push(i - gridSize); // 上
      if (row < gridSize - 1 && i + gridSize < nodeCount) neighbors.push(i + gridSize); // 下
      if (col > 0) neighbors.push(i - 1); // 左
      if (col < gridSize - 1 && i + 1 < nodeCount) neighbors.push(i + 1); // 右
      
      graph.edges.set(i, neighbors);
    }
    
    return graph;
  }
}
```

示意图 (搜索算法复杂度对比)：
```
算法          平均情况    最坏情况    空间复杂度   适用场景
线性搜索      O(n)        O(n)        O(1)       无序小数据集
二分搜索      O(log n)    O(log n)    O(1)       有序数组
插值搜索      O(log log n)O(n)        O(1)       均匀分布有序数据
指数搜索      O(log n)    O(log n)    O(1)       无界或流数据
深度优先搜索  O(V+E)      O(V+E)      O(V)       路径存在性，拓扑排序
广度优先搜索  O(V+E)      O(V+E)      O(V)       最短路径，连通分量
A*搜索       O(b^d)      O(b^d)      O(b^d)     路径规划，游戏AI

其中:
V: 顶点数, E: 边数
b: 分支因子, d: 解深度
```

### 算法选择指南

根据数据特征和搜索需求选择最合适的搜索算法。

选择策略：
- 无序小数组：线性搜索
- 有序数组：二分搜索
- 均匀分布有序数据：插值搜索
- 流数据或未知大小：指数搜索
- 图路径搜索：BFS (最短路径) 或 DFS (路径存在)
- 带代价的路径规划：A*搜索

```javascript
// 智能搜索算法选择器
export class SearchSelector {
  static selectSearchAlgorithm(data, target, constraints = {}) {
    const {
      dataSorted = false,
      dataUniform = false,
      dataSize = null,
      needShortestPath = false,
      graphType = null,
      memoryLimit = null
    } = constraints;
    
    // 数组搜索
    if (Array.isArray(data)) {
      const n = dataSize || data.length;
      
      if (!dataSorted) {
        return n <= 100 ? linearSearch : this.selectUnsortedSearch(n);
      }
      
      // 有序数组
      if (n <= 10) {
        return linearSearch;
      }
      
      if (dataUniform && n > 100) {
        return interpolationSearch;
      }
      
      if (n > 1000) {
        return exponentialSearch;
      }
      
      return binarySearch;
    }
    
    // 图搜索
    if (graphType) {
      if (needShortestPath) {
        return breadthFirstSearch;
      }
      
      if (memoryLimit && memoryLimit < 1000) {
        return depthFirstSearch; // DFS通常空间需求更小
      }
      
      // 默认使用BFS，因为它能找到最短路径
      return breadthFirstSearch;
    }
    
    // 默认回退
    return linearSearch;
  }
  
  static selectUnsortedSearch(dataSize) {
    if (dataSize <= 1000) {
      return linearSearch;
    }
    
    // 对于大无序数据集，考虑其他策略
    // 如建立索引或使用哈希表
    return linearSearch; // 默认回退
  }
  
  // 根据问题特征推荐算法
  static recommendAlgorithm(problemDescription) {
    const patterns = {
      'sorted.*array': '二分搜索',
      'unsorted.*small': '线性搜索',
      'uniform.*distributed': '插值搜索',
      'stream.*data': '指数搜索',
      'shortest.*path': '广度优先搜索',
      'path.*exists': '深度优先搜索',
      'optimal.*path': 'A*搜索',
      'game.*ai': 'A*搜索',
      'social.*network': '广度优先搜索'
    };
    
    for (const [pattern, recommendation] of Object.entries(patterns)) {
      if (new RegExp(pattern, 'i').test(problemDescription)) {
        return recommendation;
      }
    }
    
    return '线性搜索'; // 默认推荐
  }
}
```

示意图 (搜索算法选择决策树)：
```
数据类型?
├── 数组 → 是否有序?
│   ├── 是 → 数据分布均匀? → 是 → 插值搜索
│   │   │                   ↓否
│   │   │                   数据量大? → 是 → 指数搜索
│   │   │                   ↓否
│   │   │                   二分搜索
│   │   ↓否  
│   │       数据量小? → 是 → 线性搜索
│   │       ↓否
│   │       考虑建立索引或使用哈希表
│   ↓
└── 图 → 需要最短路径? → 是 → 广度优先搜索
          ↓否
          内存受限? → 是 → 深度优先搜索
          ↓否
          有启发式信息? → 是 → A*搜索
          ↓否
          深度优先搜索
```