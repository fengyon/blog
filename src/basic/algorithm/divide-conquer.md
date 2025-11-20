# 递归与分治

## 什么是递归

递归是函数直接或间接调用自身的编程技巧。它将复杂问题分解为相似的子问题，通过不断缩小问题规模直至达到基本情况。

特点：
- 自我调用：函数在执行过程中调用自身
- 基本情况：必须有终止条件防止无限递归
- 栈机制：每次调用创建新的栈帧，后进先出
- 问题分解：将大问题转化为相似的小问题

示意图 (函数调用栈)：
```
factorial(3)
  → factorial(2)
    → factorial(1)
      → factorial(0) 返回1
    返回1*1=1
  返回2*1=2
返回3*2=6
```

### 递归三要素

成功的递归实现需要三个关键要素：基本情况、递归情况和进步情况。

特点：
- 基本情况：最简单情形的直接解答
- 递归情况：将问题分解为更小的子问题
- 进步情况：确保每次递归向基本情况前进

```javascript
// 阶乘函数示例
export function factorial(n) {
  // 基本情况
  if (n === 0) return 1;
  // 递归情况 & 进步情况 (n-1)
  return n * factorial(n - 1);
}
```

## 递归类型

### 直接递归

函数直接调用自身，是最常见的递归形式。

特点：
- 明显调用：代码中直接可见自我调用
- 易于理解：递归关系直观明确
- 栈深度：与问题规模线性相关

```javascript
// 斐波那契数列 - 直接递归
export function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

示意图 (斐波那契递归树)：
```
fib(4)
├── fib(3)
│   ├── fib(2)
│   │   ├── fib(1)=1
│   │   └── fib(0)=0
│   └── fib(1)=1
└── fib(2)
    ├── fib(1)=1
    └── fib(0)=0
```

### 间接递归

多个函数相互调用形成递归链，也称为相互递归。

特点：
- 循环依赖：函数 A 调用 B，B 又调用 A
- 复杂逻辑：适合状态机或交替处理场景
- 调试挑战：调用路径不如直接递归清晰

```javascript
// 奇偶判断 - 间接递归
export function isEven(n) {
  if (n === 0) return true;
  return isOdd(n - 1);
}

export function isOdd(n) {
  if (n === 0) return false;
  return isEven(n - 1);
}
```

示意图 (间接递归调用)：
```
isEven(3)
  → isOdd(2)
    → isEven(1)
      → isOdd(0) 返回false
    返回false
  返回false
返回false
```

## 递归应用场景

### 树形结构遍历

递归天然适合处理树形数据，如 DOM 树、文件系统、组织架构等。

特点：
- 自相似性：子树与整树结构相同
- 深度优先：自然实现深度优先遍历
- 简洁代码：相比迭代方法代码更简洁

```javascript
// 深度优先遍历DOM树
export function traverseDOM(node, callback) {
  if (!node) return;
  
  callback(node);
  
  // 递归处理所有子节点
  for (const child of node.children) {
    traverseDOM(child, callback);
  }
}
```

示意图 (DOM 树遍历)：
```
div
├── h1
├── p
│   ├── span
│   └── strong
└── ul
    ├── li
    └── li
遍历顺序: div → h1 → p → span → strong → ul → li → li
```

### 组合问题求解

递归适合解决需要尝试所有可能组合的问题，如排列、子集生成等。

特点：
- 穷举搜索：系统性地探索所有可能性
- 回溯机制：通过递归栈自然实现回溯
- 解空间树：将问题建模为树形搜索空间

```javascript
// 生成所有子集
export function subsets(nums) {
  const result = [];
  
  function backtrack(start, current) {
    result.push([...current]);
    
    for (let i = start; i < nums.length; i++) {
      current.push(nums[i]);
      backtrack(i + 1, current);
      current.pop(); // 回溯
    }
  }
  
  backtrack(0, []);
  return result;
}
```

示意图 (子集生成)：
```
nums = [1,2,3]
[]
[1]
[1,2]
[1,2,3]
[1,3]
[2]
[2,3]
[3]
```

## 递归复杂度分析

### 时间复杂度

递归算法的时间复杂度通常通过递推关系式分析。

特点：
- 递推方程：T(n) = aT(n/b) + f(n)
- 递归树：可视化递归调用和每层工作量
- 主定理：快速求解常见递推式的时间复杂度

示意图 (递归树分析)：
```
T(n) = 2T(n/2) + n
层次:
0: n
1: n/2 + n/2 = n
2: n/4 × 4 = n
...
每层工作量: n
层数: log n
总工作量: O(n log n)
```

### 空间复杂度

递归的空间复杂度主要由调用栈深度决定。

特点：
- 栈深度：最坏情况下与递归深度成正比
- 尾递归：某些语言可优化为常数空间
- 辅助空间：除栈外算法使用的额外空间

```javascript
// 不同递归的空间复杂度示例
export function linearRecursion(n) {
  if (n === 0) return;
  console.log(n);
  linearRecursion(n - 1); // O(n) 空间
}

export function binaryRecursion(n) {
  if (n <= 1) return n;
  return binaryRecursion(n - 1) + binaryRecursion(n - 2); // O(n) 空间（调用栈深度）
}
```

## 递归优化技术

### 记忆化

存储已计算的结果避免重复计算，显著提升性能。

特点：
- 空间换时间：用缓存存储中间结果
- 重复子问题：适合存在重叠子问题的递归
- 透明优化：不改变递归逻辑，只添加缓存

```javascript
// 记忆化斐波那契
export function memoizedFibonacci() {
  const cache = new Map();
  
  function fib(n) {
    if (n <= 1) return n;
    if (cache.has(n)) return cache.get(n);
    
    const result = fib(n - 1) + fib(n - 2);
    cache.set(n, result);
    return result;
  }
  
  return fib;
}
```

示意图 (记忆化效果)：
```
无记忆化: fib(5)计算fib(4),fib(3),fib(2),fib(1),fib(0)多次
有记忆化: fib(2),fib(3),fib(4)只计算一次，后续直接从缓存读取
```

### 尾递归

递归调用是函数的最后操作，可被编译器优化为迭代。

特点：
- 栈帧复用：当前栈帧可被下一次调用重用
- 常数空间：优化后空间复杂度为 O(1)
- 语言支持：依赖语言运行时的尾调用优化

```javascript
// 尾递归阶乘
export function tailRecursiveFactorial(n, accumulator = 1) {
  if (n === 0) return accumulator;
  return tailRecursiveFactorial(n - 1, n * accumulator);
}
```

示意图 (尾调用优化)：
```
普通递归: factorial(3) → 3*factorial(2) → 等待结果
尾递归: factorial(3,1) → factorial(2,3) → factorial(1,6) → factorial(0,6)
栈帧可复用，不需要保存中间状态
```

## 什么是分治

分治策略将问题分解为多个子问题，递归解决子问题后合并结果。包含三个步骤：分解、解决、合并。

特点：
- 问题分解：将原问题划分为多个相似子问题
- 独立求解：子问题相互独立，可并行解决
- 结果合并：将子问题解合并为原问题解
- 递归基础：通常用递归实现分解过程

示意图 (分治流程)：
```
原问题
    ↓ 分解
[子问题1][子问题2][子问题3]...
    ↓ 解决
[解1][解2][解3]...
    ↓ 合并
最终解
```

## 分治算法模式

### 二分分解

将问题划分为两个规模相近的子问题，是最常见的分治模式。

特点：
- 平衡划分：尽量保持子问题规模相等
- 对数深度：递归树深度为 O(log n)
- 高效合并：合并操作时间复杂度通常为 O(n)

```javascript
// 归并排序 - 典型的分治算法
export function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  
  // 分解
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  
  // 合并
  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  
  while (i < left.length && j < right.length) {
    if (left[i] < right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }
  
  return result.concat(left.slice(i)).concat(right.slice(j));
}
```

示意图 (归并排序分治)：
```
[8,3,5,1,9,2,7,4]
        ↓ 分解
[8,3,5,1]   [9,2,7,4]
    ↓           ↓
[8,3] [5,1] [9,2] [7,4]
 ↓     ↓     ↓     ↓
[8][3][5][1][9][2][7][4]  // 基本情况
    ↓ 合并  ↓     ↓ 合并  ↓
[3,8] [1,5] [2,9] [4,7]
    ↓           ↓
[1,3,5,8]   [2,4,7,9]
        ↓ 合并
[1,2,3,4,5,7,8,9]
```

### 多路分解

将问题划分为多个子问题，适合可自然分割为多个部分的问题。

特点：
- 并行潜力：多个子问题可并行求解
- 复杂合并：合并多个子问题结果可能更复杂
- 适用场景：矩阵运算、快速傅里叶变换等

```javascript
// 矩阵乘法分治 - Strassen算法简化版
export function matrixMultiply(A, B) {
  const n = A.length;
  
  // 基本情况：1x1矩阵
  if (n === 1) {
    return [[A[0][0] * B[0][0]]];
  }
  
  // 分解为4个子矩阵
  const mid = n / 2;
  const A11 = partitionMatrix(A, 0, mid, 0, mid);
  const A12 = partitionMatrix(A, 0, mid, mid, n);
  const A21 = partitionMatrix(A, mid, n, 0, mid);
  const A22 = partitionMatrix(A, mid, n, mid, n);
  
  const B11 = partitionMatrix(B, 0, mid, 0, mid);
  const B12 = partitionMatrix(B, 0, mid, mid, n);
  const B21 = partitionMatrix(B, mid, n, 0, mid);
  const B22 = partitionMatrix(B, mid, n, mid, n);
  
  // 递归计算子问题
  const C11 = addMatrices(
    matrixMultiply(A11, B11),
    matrixMultiply(A12, B21)
  );
  const C12 = addMatrices(
    matrixMultiply(A11, B12),
    matrixMultiply(A12, B22)
  );
  const C21 = addMatrices(
    matrixMultiply(A21, B11),
    matrixMultiply(A22, B21)
  );
  const C22 = addMatrices(
    matrixMultiply(A21, B12),
    matrixMultiply(A22, B22)
  );
  
  // 合并结果
  return combineMatrices(C11, C12, C21, C22);
}
```

## 分治应用实例

### 快速排序

快速排序通过选择基准元素划分数组，递归排序子数组。

特点：
- 原地排序：不需要额外存储空间
- 平均效率：平均情况下 O(n log n) 时间复杂度
- 基准选择：性能受基准选择策略影响

```javascript
// 快速排序实现
export function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    // 分解：分区操作
    const pivotIndex = partition(arr, low, high);
    
    // 解决：递归排序子数组
    quickSort(arr, low, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  
  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}
```

示意图 (快速排序分区)：
```
数组: [3,8,2,5,1,4,7,6] 基准=6
分区过程:
i=-1, j=0: 3<=6 → i=0, 交换arr[0]与自身 [3,8,2,5,1,4,7,6]
j=1: 8>6 → 无操作
j=2: 2<=6 → i=1, 交换arr[1]和arr[2] [3,2,8,5,1,4,7,6]
j=3: 5<=6 → i=2, 交换arr[2]和arr[3] [3,2,5,8,1,4,7,6]
j=4: 1<=6 → i=3, 交换arr[3]和arr[4] [3,2,5,1,8,4,7,6]
j=5: 4<=6 → i=4, 交换arr[4]和arr[5] [3,2,5,1,4,8,7,6]
j=6: 7>6 → 无操作
最后交换arr[5]和arr[7]: [3,2,5,1,4,6,7,8]
基准6位于正确位置，索引=5
```

### 最近点对问题

在平面中找到距离最近的两个点，展示分治在几何问题中的应用。

特点：
- 二维分解：按 x 坐标排序后分割平面
- 跨越处理：需要特别处理分布在分界线两侧的点对
- 优化剪枝：利用几何性质减少需要检查的点对

```javascript
// 最近点对问题分治解法
export function closestPair(points) {
  // 按x坐标排序
  const sortedByX = [...points].sort((a, b) => a.x - b.x);
  
  function divideAndConquer(points, left, right) {
    if (right - left <= 3) {
      // 基本情况：暴力求解
      return bruteForceClosest(points, left, right);
    }
    
    const mid = Math.floor((left + right) / 2);
    const midPoint = points[mid];
    
    // 分解：递归求解左右子集
    const leftMin = divideAndConquer(points, left, mid);
    const rightMin = divideAndConquer(points, mid + 1, right);
    
    // 合并：考虑跨越分界线的点对
    const minDist = Math.min(leftMin.distance, rightMin.distance);
    const strip = [];
    
    // 收集距离分界线在minDist范围内的点
    for (let i = left; i <= right; i++) {
      if (Math.abs(points[i].x - midPoint.x) < minDist) {
        strip.push(points[i]);
      }
    }
    
    // 按y坐标排序strip中的点
    strip.sort((a, b) => a.y - b.y);
    
    // 检查strip中的点对
    let stripMin = { distance: Infinity };
    for (let i = 0; i < strip.length; i++) {
      for (let j = i + 1; j < strip.length && (strip[j].y - strip[i].y) < minDist; j++) {
        const dist = distance(strip[i], strip[j]);
        if (dist < stripMin.distance) {
          stripMin = { point1: strip[i], point2: strip[j], distance: dist };
        }
      }
    }
    
    return [leftMin, rightMin, stripMin].reduce((min, curr) => 
      curr.distance < min.distance ? curr : min
    );
  }
  
  return divideAndConquer(sortedByX, 0, sortedByX.length - 1);
}
```

## 分治复杂度分析

分治算法复杂度通常用主定理分析，考虑分解因子、子问题数量和合并成本。

主定理形式：
```
T(n) = aT(n/b) + f(n)
其中：
a ≥ 1, b > 1
f(n)是分解和合并的成本
```

常见情况：
- a > bᵏ：T(n) = O(n^(log_b a))  // 子问题数量主导
- a = bᵏ：T(n) = O(nᵏ log n)     // 平衡情况
- a < bᵏ：T(n) = O(f(n))         // 合并成本主导

示意图 (分治算法复杂度分类)：
```
归并排序: T(n)=2T(n/2)+O(n) → O(n log n)
快速排序: T(n)=T(n/2)+T(n/2)+O(n) → O(n log n) 平均
二分搜索: T(n)=T(n/2)+O(1) → O(log n)
Strassen矩阵乘法: T(n)=7T(n/2)+O(n²) → O(n^(log₂7)) ≈ O(n^2.81)
```