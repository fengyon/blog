# 排序算法

## 什么是排序算法

排序算法是将一组数据按照特定顺序进行排列的算法。排序是计算机科学中最基本、最常用的操作之一，直接影响数据处理的效率和用户体验。

特点：
- 顺序重排：将无序序列转换为有序序列
- 稳定性：相等元素的相对顺序在排序后保持不变
- 原地排序：是否需要在额外空间中进行排序
- 适应性：对已部分有序的数据排序效率更高

示意图 (排序过程)：
```
输入: [5, 2, 8, 1, 9]
        ↓ 排序算法处理
输出: [1, 2, 5, 8, 9]
```

## 排序算法分类

### 基于比较的排序

通过比较元素间的大小关系来决定排序顺序，具有通用性强但效率有理论下限的特点。

特点：
- 通用性：适用于任何可比较的数据类型
- 理论下限：比较排序的最优时间复杂度为 O(n log n)
- 灵活性：可以通过自定义比较函数适应不同排序需求

```javascript
// 比较排序的通用接口
export class Comparator {
  static defaultCompare(a, b) {
    if (a === b) return 0;
    return a < b ? -1 : 1;
  }
  
  static reverseCompare(compareFn) {
    return (a, b) => -compareFn(a, b);
  }
}

// 通用排序函数模板
export function sort(array, compareFn = Comparator.defaultCompare) {
  // 具体排序算法实现
  throw new Error('必须由具体排序算法实现');
}
```

### 非比较排序

不通过比较元素大小，而是利用数据的特定属性进行排序，在线性时间内完成。

特点：
- 线性时间：时间复杂度可达 O(n)
- 特定条件：依赖于数据的特定分布或属性
- 空间换时间：通常需要额外的存储空间

示意图 (排序算法分类)：
```
排序算法
├── 比较排序
│   ├── O(n²): 冒泡、选择、插入
│   ├── O(n log n): 归并、快速、堆排序
│   └── 自适应: 希尔排序
└── 非比较排序
    ├── 计数排序
    ├── 桶排序
    └── 基数排序
```

## 简单排序算法

### 冒泡排序

通过反复交换相邻的逆序元素，将最大元素“冒泡”到正确位置。

特点：
- 稳定排序：相等元素不会交换位置
- 原地排序：只需要常数级别的额外空间
- 适应性：对已排序数组效率较高

```javascript
// 冒泡排序实现
export function bubbleSort(array, compareFn = Comparator.defaultCompare) {
  const n = array.length;
  let swapped;
  
  for (let i = 0; i < n - 1; i++) {
    swapped = false;
    
    // 每次遍历将最大元素冒泡到末尾
    for (let j = 0; j < n - 1 - i; j++) {
      if (compareFn(array[j], array[j + 1]) > 0) {
        // 交换相邻元素
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        swapped = true;
      }
    }
    
    // 如果本轮没有交换，说明数组已排序
    if (!swapped) break;
  }
  
  return array;
}

// 优化的冒泡排序 - 记录最后交换位置
export function optimizedBubbleSort(array, compareFn = Comparator.defaultCompare) {
  let n = array.length;
  
  while (n > 1) {
    let newN = 0;
    
    for (let i = 1; i < n; i++) {
      if (compareFn(array[i - 1], array[i]) > 0) {
        [array[i - 1], array[i]] = [array[i], array[i - 1]];
        newN = i; // 记录最后交换的位置
      }
    }
    
    n = newN; // 下一轮只需比较到上次最后交换的位置
  }
  
  return array;
}
```

示意图 (冒泡排序过程)：
```
初始: [5, 2, 8, 1, 9]
第1轮:
  比较5-2 → 交换 → [2, 5, 8, 1, 9]
  比较5-8 → 保持 → [2, 5, 8, 1, 9] 
  比较8-1 → 交换 → [2, 5, 1, 8, 9]
  比较8-9 → 保持 → [2, 5, 1, 8, 9]
第2轮:
  比较2-5 → 保持 → [2, 5, 1, 8, 9]
  比较5-1 → 交换 → [2, 1, 5, 8, 9]
  比较5-8 → 保持 → [2, 1, 5, 8, 9]
第3轮:
  比较2-1 → 交换 → [1, 2, 5, 8, 9]
完成排序
```

### 选择排序

每次选择未排序部分的最小元素，放到已排序部分的末尾。

特点：
- 不稳定排序：可能改变相等元素的相对顺序
- 原地排序：只需要常数级别的额外空间
- 简单直观：算法逻辑清晰易懂

```javascript
// 选择排序实现
export function selectionSort(array, compareFn = Comparator.defaultCompare) {
  const n = array.length;
  
  for (let i = 0; i < n - 1; i++) {
    // 在未排序部分寻找最小元素的索引
    let minIndex = i;
    
    for (let j = i + 1; j < n; j++) {
      if (compareFn(array[j], array[minIndex]) < 0) {
        minIndex = j;
      }
    }
    
    // 将最小元素交换到当前位置
    if (minIndex !== i) {
      [array[i], array[minIndex]] = [array[minIndex], array[i]];
    }
  }
  
  return array;
}

// 双向选择排序 - 同时找到最小和最大元素
export function bidirectionalSelectionSort(array, compareFn = Comparator.defaultCompare) {
  let left = 0;
  let right = array.length - 1;
  
  while (left < right) {
    let minIndex = left;
    let maxIndex = right;
    
    // 在当前范围内找到最小和最大元素的索引
    for (let i = left; i <= right; i++) {
      if (compareFn(array[i], array[minIndex]) < 0) {
        minIndex = i;
      }
      if (compareFn(array[i], array[maxIndex]) > 0) {
        maxIndex = i;
      }
    }
    
    // 将最小元素放到左边
    if (minIndex !== left) {
      [array[left], array[minIndex]] = [array[minIndex], array[left]];
      
      // 如果最大元素在left位置，更新maxIndex
      if (maxIndex === left) {
        maxIndex = minIndex;
      }
    }
    
    // 将最大元素放到右边
    if (maxIndex !== right) {
      [array[right], array[maxIndex]] = [array[maxIndex], array[right]];
    }
    
    left++;
    right--;
  }
  
  return array;
}
```

示意图 (选择排序过程)：
```
初始: [5, 2, 8, 1, 9]
第1轮: 找到最小1 → 与5交换 → [1, 2, 8, 5, 9]
第2轮: 找到最小2 → 已在位置 → [1, 2, 8, 5, 9]  
第3轮: 找到最小5 → 与8交换 → [1, 2, 5, 8, 9]
第4轮: 找到最小8 → 已在位置 → [1, 2, 5, 8, 9]
完成排序
```

### 插入排序

将每个元素插入到已排序部分的正确位置，类似于整理扑克牌。

特点：
- 稳定排序：相等元素保持原有顺序
- 原地排序：只需要常数级别的额外空间
- 适应性：对几乎有序的数组效率很高

```javascript
// 插入排序实现
export function insertionSort(array, compareFn = Comparator.defaultCompare) {
  const n = array.length;
  
  for (let i = 1; i < n; i++) {
    const current = array[i];
    let j = i - 1;
    
    // 将比current大的元素向右移动
    while (j >= 0 && compareFn(array[j], current) > 0) {
      array[j + 1] = array[j];
      j--;
    }
    
    // 插入current到正确位置
    array[j + 1] = current;
  }
  
  return array;
}

// 二分插入排序 - 使用二分查找找到插入位置
export function binaryInsertionSort(array, compareFn = Comparator.defaultCompare) {
  const n = array.length;
  
  for (let i = 1; i < n; i++) {
    const current = array[i];
    
    // 使用二分查找找到插入位置
    let left = 0;
    let right = i - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (compareFn(array[mid], current) > 0) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    
    // 将元素向右移动，为插入腾出空间
    for (let j = i - 1; j >= left; j--) {
      array[j + 1] = array[j];
    }
    
    // 插入元素
    array[left] = current;
  }
  
  return array;
}
```

示意图 (插入排序过程)：
```
初始: [5, 2, 8, 1, 9]
第1轮: 插入2 → [2, 5, 8, 1, 9]
第2轮: 插入8 → [2, 5, 8, 1, 9] 
第3轮: 插入1 → [1, 2, 5, 8, 9]
第4轮: 插入9 → [1, 2, 5, 8, 9]
完成排序

插入过程细节(第3轮):
当前: [2,5,8], 要插入1
比较1-8 → 8右移 → [2,5,8,8]  
比较1-5 → 5右移 → [2,5,5,8]
比较1-2 → 2右移 → [2,2,5,8]
插入1到位置0 → [1,2,5,8]
```

## 高效排序算法

### 归并排序

采用分治策略，将数组递归分成两半分别排序，然后合并两个有序数组。

特点：
- 稳定排序：合并过程中保持相等元素的顺序
- 非原地排序：需要 O(n) 的额外空间
- 性能稳定：始终保证 O(n log n) 的时间复杂度

```javascript
// 归并排序实现
export function mergeSort(array, compareFn = Comparator.defaultCompare) {
  if (array.length <= 1) {
    return array;
  }
  
  // 分割数组
  const mid = Math.floor(array.length / 2);
  const left = array.slice(0, mid);
  const right = array.slice(mid);
  
  // 递归排序并合并
  return merge(
    mergeSort(left, compareFn),
    mergeSort(right, compareFn),
    compareFn
  );
}

// 合并两个有序数组
function merge(left, right, compareFn) {
  const result = [];
  let i = 0, j = 0;
  
  // 比较两个数组的元素，按顺序合并
  while (i < left.length && j < right.length) {
    if (compareFn(left[i], right[j]) <= 0) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }
  
  // 添加剩余元素
  return result.concat(left.slice(i)).concat(right.slice(j));
}

// 原地归并排序 - 减少空间使用
export function inPlaceMergeSort(array, compareFn = Comparator.defaultCompare) {
  function sort(low, high) {
    if (high - low < 1) return;
    
    const mid = Math.floor((low + high) / 2);
    sort(low, mid);
    sort(mid + 1, high);
    mergeInPlace(low, mid, high);
  }
  
  function mergeInPlace(low, mid, high) {
    let i = low;
    let j = mid + 1;
    
    while (i <= mid && j <= high) {
      if (compareFn(array[i], array[j]) <= 0) {
        i++;
      } else {
        // 将array[j]插入到array[i]的位置
        const value = array[j];
        let index = j;
        
        // 向右移动元素
        while (index > i) {
          array[index] = array[index - 1];
          index--;
        }
        
        array[i] = value;
        i++;
        mid++;
        j++;
      }
    }
  }
  
  sort(0, array.length - 1);
  return array;
}
```

示意图 (归并排序分治过程)：
```
原始数组: [5, 2, 8, 1, 9, 3, 7, 4]
分割:
[5,2,8,1] [9,3,7,4]
  ↓           ↓
[5,2] [8,1] [9,3] [7,4]
 ↓     ↓     ↓     ↓
[5][2] [8][1] [9][3] [7][4]

合并:
[2,5] [1,8] [3,9] [4,7]
  ↓           ↓
[1,2,5,8]   [3,4,7,9]
        ↓
    [1,2,3,4,5,7,8,9]

合并过程细节:
左:[2,5] 右:[1,8]
比较2-1 → 取1 → [1]
比较2-8 → 取2 → [1,2]  
比较5-8 → 取5 → [1,2,5]
取剩余8 → [1,2,5,8]
```

### 快速排序

选择基准元素，将数组划分为小于和大于基准的两部分，递归排序子数组。

特点：
- 不稳定排序：可能改变相等元素的顺序
- 原地排序：平均情况下空间复杂度为 O(log n)
- 平均高效：平均情况下 O(n log n)，最坏 O(n²)

```javascript
// 快速排序实现
export function quickSort(array, compareFn = Comparator.defaultCompare) {
  function sort(low, high) {
    if (low < high) {
      // 分区操作，返回基准位置
      const pivotIndex = partition(low, high);
      
      // 递归排序基准左右两部分
      sort(low, pivotIndex - 1);
      sort(pivotIndex + 1, high);
    }
  }
  
  function partition(low, high) {
    // 选择最后一个元素作为基准
    const pivot = array[high];
    let i = low - 1; // 小于基准的区域的边界
    
    for (let j = low; j < high; j++) {
      if (compareFn(array[j], pivot) <= 0) {
        i++;
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
    
    // 将基准放到正确位置
    [array[i + 1], array[high]] = [array[high], array[i + 1]];
    return i + 1;
  }
  
  sort(0, array.length - 1);
  return array;
}

// 三路快速排序 - 处理大量重复元素
export function quickSort3Way(array, compareFn = Comparator.defaultCompare) {
  function sort(low, high) {
    if (high <= low) return;
    
    let lt = low;      // 小于基准的边界
    let gt = high;     // 大于基准的边界
    let i = low + 1;   // 当前检查的元素
    const pivot = array[low];
    
    while (i <= gt) {
      const cmp = compareFn(array[i], pivot);
      
      if (cmp < 0) {
        // 当前元素小于基准，交换到lt区域
        [array[lt], array[i]] = [array[i], array[lt]];
        lt++;
        i++;
      } else if (cmp > 0) {
        // 当前元素大于基准，交换到gt区域
        [array[i], array[gt]] = [array[gt], array[i]];
        gt--;
      } else {
        // 当前元素等于基准，留在中间
        i++;
      }
    }
    
    // 递归排序小于和大于基准的区域
    sort(low, lt - 1);
    sort(gt + 1, high);
  }
  
  sort(0, array.length - 1);
  return array;
}

// 优化快速排序 - 三数取中法选择基准
export function optimizedQuickSort(array, compareFn = Comparator.defaultCompare) {
  function sort(low, high) {
    if (high - low <= 10) {
      // 小数组使用插入排序
      insertionSortRange(array, low, high, compareFn);
      return;
    }
    
    // 三数取中法选择基准
    const mid = Math.floor((low + high) / 2);
    if (compareFn(array[mid], array[low]) < 0) {
      [array[low], array[mid]] = [array[mid], array[low]];
    }
    if (compareFn(array[high], array[low]) < 0) {
      [array[low], array[high]] = [array[high], array[low]];
    }
    if (compareFn(array[high], array[mid]) < 0) {
      [array[mid], array[high]] = [array[high], array[mid]];
    }
    
    // 将中位数放到high-1位置
    [array[mid], array[high - 1]] = [array[high - 1], array[mid]];
    
    const pivotIndex = partition(low + 1, high - 1, array[high - 1]);
    sort(low, pivotIndex - 1);
    sort(pivotIndex + 1, high);
  }
  
  function partition(low, high, pivot) {
    let i = low;
    let j = high - 1;
    
    while (true) {
      while (compareFn(array[++i], pivot) < 0) {}
      while (compareFn(array[--j], pivot) > 0) {}
      
      if (i < j) {
        [array[i], array[j]] = [array[j], array[i]];
      } else {
        break;
      }
    }
    
    // 恢复基准位置
    [array[i], array[high]] = [array[high], array[i]];
    return i;
  }
  
  sort(0, array.length - 1);
  return array;
}

// 插入排序的区间版本
function insertionSortRange(array, low, high, compareFn) {
  for (let i = low + 1; i <= high; i++) {
    const current = array[i];
    let j = i - 1;
    
    while (j >= low && compareFn(array[j], current) > 0) {
      array[j + 1] = array[j];
      j--;
    }
    
    array[j + 1] = current;
  }
}
```

示意图 (快速排序分区过程)：
```
数组: [5, 2, 8, 1, 9, 3, 7, 4] 基准=4
分区过程:
i=-1, j=0: 5>4 → 无操作
j=1: 2<=4 → i=0, 交换arr[0]和arr[1] → [2,5,8,1,9,3,7,4]
j=2: 8>4 → 无操作
j=3: 1<=4 → i=1, 交换arr[1]和arr[3] → [2,1,8,5,9,3,7,4]
j=4: 9>4 → 无操作  
j=5: 3<=4 → i=2, 交换arr[2]和arr[5] → [2,1,3,5,9,8,7,4]
j=6: 7>4 → 无操作
最后交换arr[3]和arr[7]: [2,1,3,4,9,8,7,5]
基准4位于正确位置，索引=3

继续递归排序[2,1,3]和[9,8,7,5]
```

### 堆排序

利用堆数据结构进行排序，将数组构建为最大堆，然后反复提取最大元素。

特点：
- 不稳定排序：堆操作可能改变相等元素的顺序
- 原地排序：只需要常数级别的额外空间
- 性能稳定：始终保证 O(n log n) 的时间复杂度

```javascript
// 堆排序实现
export function heapSort(array, compareFn = Comparator.defaultCompare) {
  const n = array.length;
  
  // 构建最大堆
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(array, n, i, compareFn);
  }
  
  // 逐个提取最大元素
  for (let i = n - 1; i > 0; i--) {
    // 将当前最大元素（堆顶）移到数组末尾
    [array[0], array[i]] = [array[i], array[0]];
    
    // 对剩余元素重新堆化
    heapify(array, i, 0, compareFn);
  }
  
  return array;
}

// 堆化函数
function heapify(array, n, i, compareFn) {
  let largest = i;        // 假设当前节点最大
  const left = 2 * i + 1; // 左子节点
  const right = 2 * i + 2; // 右子节点
  
  // 如果左子节点存在且大于当前最大节点
  if (left < n && compareFn(array[left], array[largest]) > 0) {
    largest = left;
  }
  
  // 如果右子节点存在且大于当前最大节点
  if (right < n && compareFn(array[right], array[largest]) > 0) {
    largest = right;
  }
  
  // 如果最大节点不是当前节点，交换并继续堆化
  if (largest !== i) {
    [array[i], array[largest]] = [array[largest], array[i]];
    heapify(array, n, largest, compareFn);
  }
}

// 最小堆排序（降序）
export function heapSortDescending(array, compareFn = Comparator.defaultCompare) {
  const reverseCompare = Comparator.reverseCompare(compareFn);
  return heapSort(array, reverseCompare);
}
```

示意图 (堆排序过程)：
```
初始数组: [5, 2, 8, 1, 9, 3]
构建最大堆:
      5
     / \
    2   8
   / \   \
  1   9   3

堆化过程:
从最后一个非叶子节点开始(索引1: 2)
2有子9 → 交换 → [5,9,8,1,2,3]
      5
     / \
    9   8
   / \   \
  1   2   3

堆化索引0: 5
5有子9和8, 9最大 → 交换5和9 → [9,5,8,1,2,3]
      9
     / \
    5   8
   / \   \
  1   2   3

5有子2和1, 无需交换 → 堆构建完成

排序过程:
交换9和3 → [3,5,8,1,2,9], 堆化前5个 → [8,5,3,1,2,9]
交换8和2 → [2,5,3,1,8,9], 堆化前4个 → [5,2,3,1,8,9]
交换5和1 → [1,2,3,5,8,9], 堆化前3个 → [3,2,1,5,8,9]
交换3和1 → [1,2,3,5,8,9], 堆化前2个 → [2,1,3,5,8,9]
交换2和1 → [1,2,3,5,8,9], 完成排序
```

## 特殊排序算法

### 希尔排序

是插入排序的改进版，通过比较相距一定间隔的元素来工作，逐步减小间隔直到 1。

特点：
- 不稳定排序：可能改变相等元素的顺序
- 原地排序：只需要常数级别的额外空间
- 增量序列：性能依赖于间隔序列的选择

```javascript
// 希尔排序实现
export function shellSort(array, compareFn = Comparator.defaultCompare) {
  const n = array.length;
  
  // 使用希尔增量序列: n/2, n/4, ..., 1
  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    // 对每个间隔进行插入排序
    for (let i = gap; i < n; i++) {
      const temp = array[i];
      let j = i;
      
      // 对间隔为gap的元素进行插入排序
      while (j >= gap && compareFn(array[j - gap], temp) > 0) {
        array[j] = array[j - gap];
        j -= gap;
      }
      
      array[j] = temp;
    }
  }
  
  return array;
}

// 使用Knuth序列的希尔排序
export function shellSortKnuth(array, compareFn = Comparator.defaultCompare) {
  const n = array.length;
  
  // 计算Knuth序列: 1, 4, 13, 40, 121, ...
  let gap = 1;
  while (gap < n / 3) {
    gap = 3 * gap + 1;
  }
  
  while (gap >= 1) {
    for (let i = gap; i < n; i++) {
      for (let j = i; j >= gap && compareFn(array[j], array[j - gap]) < 0; j -= gap) {
        [array[j], array[j - gap]] = [array[j - gap], array[j]];
      }
    }
    
    gap = Math.floor(gap / 3);
  }
  
  return array;
}
```

示意图 (希尔排序过程)：
```
数组: [5, 2, 8, 1, 9, 3, 7, 4]
初始间隔=4:
分组: [5,9] [2,3] [8,7] [1,4]
组内排序: [5,9] [2,3] [7,8] [1,4] → [5,2,7,1,9,3,8,4]

间隔=2:
分组: [5,7,9,8] [2,1,3,4]  
组内排序: [5,7,8,9] [1,2,3,4] → [5,1,7,2,8,3,9,4]

间隔=1:
直接插入排序 → [1,2,3,4,5,7,8,9]

分组排序过程(间隔=2时):
组1: 5,7,9,8 → 插入8: 9>8 → 交换 → 5,7,8,9
组2: 2,1,3,4 → 插入1: 2>1 → 交换 → 1,2,3,4
```

### 计数排序

非比较排序算法，通过计数每个元素的出现次数来确定排序位置。

特点：
- 稳定排序：可以设计为保持相等元素的顺序
- 非原地排序：需要额外的计数数组和输出数组
- 有限范围：只适用于整数且范围不大的情况

```javascript
// 计数排序实现
export function countingSort(array) {
  if (array.length === 0) return array;
  
  // 找到数组中的最小值和最大值
  let min = array[0];
  let max = array[0];
  
  for (let i = 1; i < array.length; i++) {
    if (array[i] < min) min = array[i];
    if (array[i] > max) max = array[i];
  }
  
  const range = max - min + 1;
  const count = new Array(range).fill(0);
  const output = new Array(array.length);
  
  // 统计每个元素的出现次数
  for (let i = 0; i < array.length; i++) {
    count[array[i] - min]++;
  }
  
  // 计算累积次数（为了稳定性）
  for (let i = 1; i < range; i++) {
    count[i] += count[i - 1];
  }
  
  // 从后向前遍历，保持稳定性
  for (let i = array.length - 1; i >= 0; i--) {
    output[count[array[i] - min] - 1] = array[i];
    count[array[i] - min]--;
  }
  
  // 将结果复制回原数组
  for (let i = 0; i < array.length; i++) {
    array[i] = output[i];
  }
  
  return array;
}

// 对象数组的计数排序（按特定键排序）
export function countingSortByKey(array, keyFn) {
  if (array.length === 0) return array;
  
  // 提取键值并找到范围
  const keys = array.map(keyFn);
  let min = keys[0];
  let max = keys[0];
  
  for (let i = 1; i < keys.length; i++) {
    if (keys[i] < min) min = keys[i];
    if (keys[i] > max) max = keys[i];
  }
  
  const range = max - min + 1;
  const count = new Array(range).fill(0);
  const output = new Array(array.length);
  
  // 统计每个键值的出现次数
  for (let i = 0; i < keys.length; i++) {
    count[keys[i] - min]++;
  }
  
  // 计算累积次数
  for (let i = 1; i < range; i++) {
    count[i] += count[i - 1];
  }
  
  // 从后向前遍历，保持稳定性
  for (let i = array.length - 1; i >= 0; i--) {
    const key = keys[i];
    output[count[key - min] - 1] = array[i];
    count[key - min]--;
  }
  
  // 将结果复制回原数组
  for (let i = 0; i < array.length; i++) {
    array[i] = output[i];
  }
  
  return array;
}
```

示意图 (计数排序过程)：
```
输入: [2, 5, 3, 0, 2, 3, 0, 3]
范围: 0-5

统计计数:
值: 0 1 2 3 4 5
计数: 2 0 2 3 0 1

计算累积计数:
值: 0 1 2 3 4 5  
累积: 2 2 4 7 7 8

从后向前放置:
最后一个3 → 位置7-1=6 → output[6]=3, 计数3变为6
倒数第二个0 → 位置2-1=1 → output[1]=0, 计数0变为1
...
最终output: [0,0,2,2,3,3,3,5]
```

## 排序算法性能分析

### 时间复杂度比较

不同排序算法在各种情况下的时间效率分析。

```javascript
// 排序算法性能测试工具
export class SortBenchmark {
  static timeSort(sortFn, array) {
    const start = performance.now();
    sortFn([...array]); // 使用副本避免修改原数组
    const end = performance.now();
    return end - start;
  }
  
  static compareAlgorithms(array, algorithms) {
    const results = {};
    
    for (const [name, sortFn] of Object.entries(algorithms)) {
      // 运行多次取平均值
      let totalTime = 0;
      const runs = 5;
      
      for (let i = 0; i < runs; i++) {
        totalTime += this.timeSort(sortFn, array);
      }
      
      results[name] = totalTime / runs;
    }
    
    return results;
  }
  
  // 生成测试数据
  static generateTestData(type, size) {
    switch (type) {
      case 'random':
        return Array.from({ length: size }, () => 
          Math.floor(Math.random() * size)
        );
      case 'sorted':
        return Array.from({ length: size }, (_, i) => i);
      case 'reverse':
        return Array.from({ length: size }, (_, i) => size - i - 1);
      case 'nearly-sorted':
        const array = Array.from({ length: size }, (_, i) => i);
        // 随机交换一些元素
        for (let i = 0; i < size * 0.1; i++) {
          const a = Math.floor(Math.random() * size);
          const b = Math.floor(Math.random() * size);
          [array[a], array[b]] = [array[b], array[a]];
        }
        return array;
      default:
        throw new Error(`Unknown data type: ${type}`);
    }
  }
}
```

示意图 (时间复杂度对比表)：
```
算法        最好情况    平均情况    最坏情况    空间复杂度   稳定性
冒泡排序     O(n)       O(n²)      O(n²)      O(1)       稳定
选择排序     O(n²)      O(n²)      O(n²)      O(1)       不稳定
插入排序     O(n)       O(n²)      O(n²)      O(1)       稳定
希尔排序     O(n log n) O(n^1.3)   O(n²)      O(1)       不稳定
归并排序     O(n log n) O(n log n) O(n log n) O(n)       稳定
快速排序     O(n log n) O(n log n) O(n²)      O(log n)   不稳定
堆排序       O(n log n) O(n log n) O(n log n) O(1)       不稳定
计数排序     O(n + k)   O(n + k)   O(n + k)   O(k)       稳定
```

### 算法选择指南

根据具体场景选择最合适的排序算法。

选择策略：
- 小数组 (n < 10)：插入排序
- 基本有序数组：插入排序或冒泡排序
- 随机大数组：快速排序或归并排序
- 需要稳定性：归并排序或插入排序
- 内存受限：堆排序或希尔排序
- 整数且范围小：计数排序

```javascript
// 智能排序选择器
export class SortSelector {
  static selectSortAlgorithm(array, constraints = {}) {
    const {
      requireStable = false,
      memorySensitive = false,
      dataType = 'comparable'
    } = constraints;
    
    const n = array.length;
    
    // 小数组使用插入排序
    if (n <= 10) {
      return insertionSort;
    }
    
    // 检查是否基本有序
    if (this.isNearlySorted(array) && !memorySensitive) {
      return insertionSort;
    }
    
    // 整数且范围小的情况
    if (dataType === 'integer' && this.hasSmallRange(array)) {
      return countingSort;
    }
    
    // 需要稳定排序
    if (requireStable) {
      return mergeSort;
    }
    
    // 内存敏感
    if (memorySensitive) {
      return n < 1000 ? shellSort : heapSort;
    }
    
    // 默认使用快速排序
    return optimizedQuickSort;
  }
  
  static isNearlySorted(array, threshold = 0.1) {
    let inversions = 0;
    const maxInversions = array.length * threshold;
    
    for (let i = 1; i < array.length; i++) {
      if (array[i] < array[i - 1]) {
        inversions++;
        if (inversions > maxInversions) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  static hasSmallRange(array, maxRange = 1000) {
    if (array.length === 0) return false;
    
    let min = array[0];
    let max = array[0];
    
    for (let i = 1; i < array.length; i++) {
      if (array[i] < min) min = array[i];
      if (array[i] > max) max = array[i];
      
      // 如果范围已经超过阈值，提前返回
      if (max - min > maxRange) {
        return false;
      }
    }
    
    return (max - min) <= maxRange;
  }
}
```

示意图 (算法选择决策树)：
```
数组大小?
├── n ≤ 10 → 插入排序
├── n ≤ 50 → 基本有序? → 是 → 插入排序
│           ↓否
│           希尔排序
├── n ≤ 1000 → 需要稳定? → 是 → 归并排序
│             ↓否
│             快速排序
└── n > 1000 → 整数小范围? → 是 → 计数排序
                ↓否
                需要稳定? → 是 → 归并排序
                ↓否  
                内存敏感? → 是 → 堆排序
                ↓否
                快速排序
```