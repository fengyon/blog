# 字符串算法

## 什么是字符串算法

字符串算法是专门处理文本数据的一系列计算方法，解决字符串匹配、搜索、比较和转换等问题。字符串作为最常见的数据类型之一，其高效处理直接影响搜索引擎、文本编辑器和数据分析系统的性能。

特点：
- 文本处理：专注于字符序列的操作和分析
- 模式匹配：在文本中快速定位特定模式
- 效率关键：处理大规模文本时性能差异显著
- 应用广泛：从简单搜索到复杂生物信息学分析

示意图 (字符串基本操作)：
```
文本: "hello world"
模式: "world"
        ↓ 字符串匹配
位置: 6
```

## 字符串匹配算法

### 朴素字符串匹配

逐个比较文本和模式的每个字符，是最简单直接的匹配方法。

特点：
- 简单直观：算法逻辑易于理解和实现
- 无预处理：不需要对模式或文本进行预处理
- 效率低下：最坏情况时间复杂度 O(mn)

```javascript
// 朴素字符串匹配算法
export function naiveStringSearch(text, pattern) {
  const n = text.length;
  const m = pattern.length;
  const positions = [];
  let comparisons = 0;

  // 遍历所有可能的起始位置
  for (let i = 0; i <= n - m; i++) {
    let j;
    for (j = 0; j < m; j++) {
      comparisons++;
      if (text[i + j] !== pattern[j]) {
        break;
      }
    }
    
    // 如果整个模式匹配成功
    if (j === m) {
      positions.push(i);
    }
  }

  return {
    positions,
    comparisons,
    patternLength: m,
    textLength: n
  };
}

// 优化版朴素匹配 - 在发现不匹配时立即停止
export function optimizedNaiveSearch(text, pattern) {
  const n = text.length;
  const m = pattern.length;
  const positions = [];
  let comparisons = 0;

  for (let i = 0; i <= n - m; i++) {
    let matched = true;
    
    for (let j = 0; j < m; j++) {
      comparisons++;
      if (text[i + j] !== pattern[j]) {
        matched = false;
        break; // 提前终止内层循环
      }
    }
    
    if (matched) {
      positions.push(i);
    }
  }

  return {
    positions,
    comparisons,
    efficiency: comparisons / (n * m) // 比较效率
  };
}
```

示意图 (朴素匹配过程)：
```
文本:    "ABABDABACDABABCABAB"
模式:    "ABABC"
        ↓
i=0: ABABD ≠ ABABC → 不匹配
i=1: BABDA ≠ ABABC → 不匹配  
i=2: ABDAB ≠ ABABC → 不匹配
i=3: DABAC ≠ ABABC → 不匹配
i=4: ABACD ≠ ABABC → 不匹配
i=5: BACDA ≠ ABABC → 不匹配
i=6: ACDAB ≠ ABABC → 不匹配
i=7: CDABA ≠ ABABC → 不匹配
i=8: DABAB ≠ ABABC → 不匹配
i=9: ABABC = ABABC → 匹配位置9
i=10: BABCA ≠ ABABC → 不匹配
...
```

### KMP 算法

利用部分匹配表避免重复比较，实现高效的字符串匹配。

特点：
- 部分匹配：构建前缀函数避免回溯
- 线性时间：预处理 O(m)，匹配 O(n)
- 无回溯：文本指针只前进不后退

```javascript
// KMP算法实现
export function kmpSearch(text, pattern) {
  const n = text.length;
  const m = pattern.length;
  
  if (m === 0) return { positions: [0], comparisons: 0 };
  
  // 构建部分匹配表
  const lps = computeLPSArray(pattern);
  const positions = [];
  let comparisons = 0;
  
  let i = 0; // 文本索引
  let j = 0; // 模式索引
  
  while (i < n) {
    comparisons++;
    if (pattern[j] === text[i]) {
      i++;
      j++;
    }
    
    if (j === m) {
      // 找到匹配
      positions.push(i - j);
      j = lps[j - 1];
    } else if (i < n && pattern[j] !== text[i]) {
      // 不匹配时利用LPS表跳过
      if (j !== 0) {
        j = lps[j - 1];
      } else {
        i++;
      }
    }
  }
  
  return {
    positions,
    comparisons,
    lpsTable: lps
  };
}

// 计算最长前缀后缀表
function computeLPSArray(pattern) {
  const m = pattern.length;
  const lps = new Array(m).fill(0);
  let length = 0; // 当前最长前缀后缀长度
  let i = 1;
  
  while (i < m) {
    if (pattern[i] === pattern[length]) {
      length++;
      lps[i] = length;
      i++;
    } else {
      if (length !== 0) {
        length = lps[length - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
  }
  
  return lps;
}

// 可视化LPS表构建过程
export function visualizeLPS(pattern) {
  const lps = computeLPSArray(pattern);
  const steps = [];
  
  console.log(`构建模式 "${pattern}" 的LPS表:`);
  for (let i = 0; i < pattern.length; i++) {
    let prefix = pattern.slice(0, lps[i]);
    let suffix = pattern.slice(i - lps[i] + 1, i + 1);
    steps.push({
      index: i,
      character: pattern[i],
      lpsValue: lps[i],
      prefix,
      suffix,
      match: prefix === suffix
    });
  }
  
  return steps;
}
```

示意图 (KMP 算法 LPS 表)：
```
模式: "ABABC"
LPS表构建:
i=0: "A" → LPS[0]=0
i=1: "AB" → 前缀"A"≠后缀"B" → LPS[1]=0  
i=2: "ABA" → 前缀"A"=后缀"A" → LPS[2]=1
i=3: "ABAB" → 前缀"AB"≠后缀"AB"? 检查: 
     前缀"A"=后缀"B"? 不匹配 → LPS[3]=0? 
     但前缀"AB"=后缀"AB"? 实际: LPS[3]=2
i=4: "ABABC" → 前缀"ABC"≠后缀"ABC"? 检查:
     前缀"A"=后缀"C"? 不匹配 → LPS[4]=0

最终LPS: [0,0,1,2,0]

匹配过程:
文本: "ABABDABACDABABCABAB"
模式: "ABABC"
i=0,j=0: A=A → i=1,j=1
i=1,j=1: B=B → i=2,j=2  
i=2,j=2: A=A → i=3,j=3
i=3,j=3: B=B → i=4,j=4
i=4,j=4: D≠C → 不匹配，j=LPS[3]=2
继续比较 i=4,j=2: D≠A → j=LPS[1]=0
继续比较 i=4,j=0: D≠A → i=5
...
直到找到匹配
```

### Boyer-Moore 算法

从模式末尾开始比较，利用坏字符和好后缀规则实现大幅跳跃。

特点：
- 反向比较：从模式末尾开始匹配
- 启发跳跃：利用坏字符和好后缀规则跳过多个位置
- 实践高效：在实际应用中通常比 KMP 更快

```javascript
// Boyer-Moore算法实现
export function boyerMooreSearch(text, pattern) {
  const n = text.length;
  const m = pattern.length;
  
  if (m === 0) return { positions: [0], comparisons: 0 };
  
  // 预处理：坏字符表
  const badCharTable = buildBadCharTable(pattern);
  // 预处理：好后缀表
  const goodSuffixTable = buildGoodSuffixTable(pattern);
  
  const positions = [];
  let comparisons = 0;
  let shift = 0;
  
  while (shift <= n - m) {
    let j = m - 1;
    
    // 从右向左比较
    while (j >= 0 && pattern[j] === text[shift + j]) {
      comparisons++;
      j--;
    }
    
    if (j < 0) {
      // 找到匹配
      positions.push(shift);
      
      // 使用好后缀规则决定下一个移位
      shift += (shift + m < n) ? m - badCharTable[text.charCodeAt(shift + m)] : 1;
    } else {
      // 不匹配，计算两个规则建议的移位，取较大值
      comparisons++;
      const badCharShift = j - badCharTable[text.charCodeAt(shift + j)];
      const goodSuffixShift = goodSuffixTable[j];
      
      shift += Math.max(1, Math.max(badCharShift, goodSuffixShift));
    }
  }
  
  return {
    positions,
    comparisons,
    badCharTable,
    goodSuffixTable
  };
}

// 构建坏字符表
function buildBadCharTable(pattern) {
  const table = new Array(256).fill(-1); // ASCII字符表
  const m = pattern.length;
  
  for (let i = 0; i < m; i++) {
    table[pattern.charCodeAt(i)] = i;
  }
  
  return table;
}

// 构建好后缀表
function buildGoodSuffixTable(pattern) {
  const m = pattern.length;
  const table = new Array(m).fill(0);
  const suffixes = new Array(m).fill(0);
  
  // 计算后缀数组
  suffixes[m - 1] = m;
  let g = m - 1;
  let f = 0;
  
  for (let i = m - 2; i >= 0; i--) {
    if (i > g && suffixes[i + m - 1 - f] < i - g) {
      suffixes[i] = suffixes[i + m - 1 - f];
    } else {
      if (i < g) g = i;
      f = i;
      
      while (g >= 0 && pattern[g] === pattern[g + m - 1 - f]) {
        g--;
      }
      suffixes[i] = f - g;
    }
  }
  
  // 构建好后缀表
  for (let i = 0; i < m; i++) {
    table[i] = m;
  }
  
  for (let i = m - 1; i >= 0; i--) {
    if (suffixes[i] === i + 1) {
      for (let j = 0; j < m - 1 - i; j++) {
        if (table[j] === m) {
          table[j] = m - 1 - i;
        }
      }
    }
  }
  
  for (let i = 0; i <= m - 2; i++) {
    table[m - 1 - suffixes[i]] = m - 1 - i;
  }
  
  return table;
}
```

示意图 (Boyer-Moore 算法)：
```
文本:    "ABAAABCDBBABCDEF"
模式:    "ABCD"
坏字符表: A:0, B:1, C:2, D:3, 其他:-1

第一次比较(shift=0):
文本: ABAAABCD...
模式: ABCD
      ↑ 从右比较: D≠A → 坏字符'A'在模式位置0
     移位 = 坏字符位置3 - 表中位置0 = 3 → shift=3

第二次比较(shift=3):
文本: ABAAABCD...
模式:    ABCD
            ↑ 从右比较: D=D, C=C, B=B, A=A → 完全匹配
找到匹配位置3

第三次比较(shift=7):
文本: ABAAABCDBBABCDEF
模式:        ABCD
                 ↑ 从右比较: D≠B → 坏字符'B'在模式位置1
     移位 = 坏字符位置3 - 表中位置1 = 2 → shift=9

继续比较直到结束...
```

## 字符串搜索数据结构

### Trie 树

前缀树，用于高效存储和检索字符串集合。

特点：
- 前缀共享：相同前缀的字符串共享节点
- 快速检索：搜索时间复杂度 O(m)，m 为模式长度
- 空间优化：压缩版本可减少内存使用

```javascript
// Trie节点类
export class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.frequency = 0; // 词频统计
  }
}

// Trie树实现
export class Trie {
  constructor() {
    this.root = new TrieNode();
    this.size = 0; // 存储的单词数量
  }

  // 插入单词
  insert(word) {
    let currentNode = this.root;
    
    for (const char of word) {
      if (!currentNode.children.has(char)) {
        currentNode.children.set(char, new TrieNode());
      }
      currentNode = currentNode.children.get(char);
    }
    
    if (!currentNode.isEndOfWord) {
      this.size++;
    }
    currentNode.isEndOfWord = true;
    currentNode.frequency++;
  }

  // 搜索单词
  search(word) {
    let currentNode = this.root;
    
    for (const char of word) {
      if (!currentNode.children.has(char)) {
        return { found: false, frequency: 0 };
      }
      currentNode = currentNode.children.get(char);
    }
    
    return {
      found: currentNode.isEndOfWord,
      frequency: currentNode.frequency
    };
  }

  // 前缀搜索
  startsWith(prefix) {
    let currentNode = this.root;
    
    for (const char of prefix) {
      if (!currentNode.children.has(char)) {
        return false;
      }
      currentNode = currentNode.children.get(char);
    }
    
    return true;
  }

  // 获取所有以给定前缀开头的单词
  getWordsWithPrefix(prefix) {
    const results = [];
    let currentNode = this.root;
    
    // 导航到前缀的最后一个节点
    for (const char of prefix) {
      if (!currentNode.children.has(char)) {
        return results; // 前缀不存在
      }
      currentNode = currentNode.children.get(char);
    }
    
    // 收集所有单词
    this.collectWords(currentNode, prefix, results);
    return results;
  }

  // 递归收集单词
  collectWords(node, currentWord, results) {
    if (node.isEndOfWord) {
      results.push({
        word: currentWord,
        frequency: node.frequency
      });
    }
    
    for (const [char, childNode] of node.children) {
      this.collectWords(childNode, currentWord + char, results);
    }
  }

  // 删除单词
  delete(word) {
    this.deleteRecursive(this.root, word, 0);
  }

  deleteRecursive(node, word, depth) {
    if (!node) return false;

    if (depth === word.length) {
      if (node.isEndOfWord) {
        node.isEndOfWord = false;
        this.size--;
        return node.children.size === 0;
      }
      return false;
    }

    const char = word[depth];
    const childNode = node.children.get(char);
    
    if (!childNode) return false;

    const shouldDeleteChild = this.deleteRecursive(childNode, word, depth + 1);

    if (shouldDeleteChild) {
      node.children.delete(char);
      return node.children.size === 0 && !node.isEndOfWord;
    }

    return false;
  }
}
```

示意图 (Trie 树结构)：
```
插入单词: "cat", "car", "card", "dog"

Trie结构:
    root
    /  \
   c    d
  /      \
 a        o
/ \        \
t* r*       g*
   |
   d*

* 表示单词结束节点

搜索过程:
搜索 "car": root → c → a → r* → 找到
搜索 "cat": root → c → a → t* → 找到  
搜索 "ca": root → c → a → 前缀存在
搜索 "cab": root → c → a → 无b子节点 → 未找到
```

### Aho-Corasick 算法

多模式匹配算法，在 Trie 基础上添加失败指针实现高效多模式搜索。

特点：
- 多模式匹配：同时搜索多个模式串
- 自动机转换：将 Trie 扩展为有限状态自动机
- 线性时间：预处理后可在 O(n + m + z) 时间内完成搜索

```javascript
// Aho-Corasick算法实现
export class AhoCorasick {
  constructor() {
    this.root = new TrieNode();
    this.isBuilt = false;
  }

  // 添加模式
  addPattern(pattern) {
    let currentNode = this.root;
    
    for (const char of pattern) {
      if (!currentNode.children.has(char)) {
        currentNode.children.set(char, new TrieNode());
      }
      currentNode = currentNode.children.get(char);
    }
    
    currentNode.isEndOfWord = true;
    currentNode.output = pattern; // 存储完整模式
    this.isBuilt = false;
  }

  // 构建失败指针
  buildFailureLinks() {
    const queue = [];
    
    // 第一层节点的失败指针指向root
    for (const [char, child] of this.root.children) {
      child.fail = this.root;
      queue.push(child);
    }
    
    // 广度优先构建失败指针
    while (queue.length > 0) {
      const currentNode = queue.shift();
      
      for (const [char, child] of currentNode.children) {
        let failNode = currentNode.fail;
        
        // 沿着失败指针链找到有char子节点的节点
        while (failNode !== this.root && !failNode.children.has(char)) {
          failNode = failNode.fail;
        }
        
        if (failNode.children.has(char)) {
          child.fail = failNode.children.get(char);
        } else {
          child.fail = this.root;
        }
        
        // 如果失败指针指向的节点是输出节点，继承输出
        if (child.fail.isEndOfWord && !child.output) {
          child.output = child.fail.output;
        }
        
        queue.push(child);
      }
    }
    
    this.isBuilt = true;
  }

  // 搜索文本中的所有模式
  search(text) {
    if (!this.isBuilt) {
      this.buildFailureLinks();
    }
    
    const results = [];
    let currentNode = this.root;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // 沿着失败指针链找到有当前字符子节点的节点
      while (currentNode !== this.root && !currentNode.children.has(char)) {
        currentNode = currentNode.fail;
      }
      
      if (currentNode.children.has(char)) {
        currentNode = currentNode.children.get(char);
      }
      
      // 检查当前节点及其失败指针链上的输出
      let outputNode = currentNode;
      while (outputNode !== this.root) {
        if (outputNode.isEndOfWord) {
          results.push({
            pattern: outputNode.output,
            position: i - outputNode.output.length + 1,
            index: i
          });
        }
        outputNode = outputNode.fail;
      }
    }
    
    return results;
  }
}
```

示意图 (Aho-Corasick 自动机)：
```
模式: "he", "she", "his", "hers"

构建的自动机:
状态0 (root) --h--> 状态1 --e--> 状态2 (输出: "he")
          --s--> 状态3 --h--> 状态4 --e--> 状态5 (输出: "she")
状态1 --i--> 状态6 --s--> 状态7 (输出: "his")  
状态1 --e--> 状态2
状态4 --r--> 状态8 --s--> 状态9 (输出: "hers")

失败指针:
状态2.fail → 状态8 (因为"e"在root无子节点，但状态8有"e"? 实际构建更复杂)
状态5.fail → 状态2 (最长后缀匹配)

搜索文本 "shers":
s: 状态0→3
h: 状态3→4
e: 状态4→5 → 输出"she"位置2
r: 状态5→状态2.fail=状态8 → 状态8
s: 状态8→9 → 输出"hers"位置3
找到 "she"和"hers"
```

## 字符串相似度算法

### 编辑距离

衡量两个字符串的相似度，通过计算从一个字符串转换到另一个字符串所需的最少操作次数。

特点：
- 操作计数：插入、删除、替换操作的最小次数
- 动态规划：使用表格存储子问题解
- 应用广泛：拼写检查、生物信息学、自然语言处理

```javascript
// 编辑距离算法
export function editDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  // 创建DP表格
  const dp = Array.from({ length: m + 1 }, () => 
    new Array(n + 1).fill(0)
  );
  
  // 初始化边界条件
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i; // 从str1[0..i]到空字符串需要i次删除
  }
  
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j; // 从空字符串到str2[0..j]需要j次插入
  }
  
  // 填充DP表格
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        // 字符相同，不需要操作
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        // 取插入、删除、替换操作的最小值
        dp[i][j] = 1 + Math.min(
          dp[i][j - 1],    // 插入
          dp[i - 1][j],    // 删除  
          dp[i - 1][j - 1] // 替换
        );
      }
    }
  }
  
  return {
    distance: dp[m][n],
    dpTable: dp,
    operations: reconstructOperations(dp, str1, str2)
  };
}

// 重建操作序列
function reconstructOperations(dp, str1, str2) {
  const operations = [];
  let i = dp.length - 1;
  let j = dp[0].length - 1;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && str1[i - 1] === str2[j - 1]) {
      // 字符相同，无操作
      operations.unshift({ type: 'match', char: str1[i - 1] });
      i--;
      j--;
    } else {
      const current = dp[i][j];
      
      if (i > 0 && j > 0 && dp[i - 1][j - 1] + 1 === current) {
        // 替换操作
        operations.unshift({ 
          type: 'replace', 
          from: str1[i - 1], 
          to: str2[j - 1] 
        });
        i--;
        j--;
      } else if (j > 0 && dp[i][j - 1] + 1 === current) {
        // 插入操作
        operations.unshift({ 
          type: 'insert', 
          char: str2[j - 1] 
        });
        j--;
      } else if (i > 0 && dp[i - 1][j] + 1 === current) {
        // 删除操作
        operations.unshift({ 
          type: 'delete', 
          char: str1[i - 1] 
        });
        i--;
      }
    }
  }
  
  return operations;
}

// 带权编辑距离（不同的操作有不同的代价）
export function weightedEditDistance(str1, str2, costs = {}) {
  const { insert = 1, delete: del = 1, replace = 1 } = costs;
  const m = str1.length;
  const n = str2.length;
  
  const dp = Array.from({ length: m + 1 }, () => 
    new Array(n + 1).fill(0)
  );
  
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i * del;
  }
  
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j * insert;
  }
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i][j - 1] + insert,
          dp[i - 1][j] + del,
          dp[i - 1][j - 1] + replace
        );
      }
    }
  }
  
  return dp[m][n];
}
```

示意图 (编辑距离 DP 表格)：
```
字符串1: "kitten"
字符串2: "sitting"

DP表格:
    "" s i t t i n g
""   0 1 2 3 4 5 6 7
k    1 1 2 3 4 5 6 7  
i    2 2 1 2 3 4 5 6
t    3 3 2 1 2 3 4 5
t    4 4 3 2 1 2 3 4
e    5 5 4 3 2 2 3 4
n    6 6 5 4 3 3 2 3

编辑距离 = 3
操作序列:
k → s (替换)
- → i (插入)
e → i (替换)
```

### 最长公共子序列

找到两个序列的最长公共子序列，不要求连续但保持相对顺序。

特点：
- 相对顺序：子序列元素保持原有顺序
- 动态规划：经典的二维动态规划问题
- 应用广泛：版本控制、生物序列比对

```javascript
// 最长公共子序列
export function longestCommonSubsequence(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  // DP表格，dp[i][j]表示str1[0..i-1]和str2[0..j-1]的LCS长度
  const dp = Array.from({ length: m + 1 }, () => 
    new Array(n + 1).fill(0)
  );
  
  // 填充DP表格
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // 重建LCS
  const lcs = reconstructLCS(dp, str1, str2);
  
  return {
    length: dp[m][n],
    sequence: lcs,
    dpTable: dp
  };
}

// 重建LCS序列
function reconstructLCS(dp, str1, str2) {
  let i = dp.length - 1;
  let j = dp[0].length - 1;
  const lcs = [];
  
  while (i > 0 && j > 0) {
    if (str1[i - 1] === str2[j - 1]) {
      lcs.unshift(str1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return lcs.join('');
}

// 多序列LCS
export function multipleLCS(sequences) {
  if (sequences.length === 0) return '';
  if (sequences.length === 1) return sequences[0];
  
  let lcs = sequences[0];
  
  for (let i = 1; i < sequences.length; i++) {
    const result = longestCommonSubsequence(lcs, sequences[i]);
    lcs = result.sequence;
    
    if (lcs.length === 0) break; // 没有公共子序列
  }
  
  return lcs;
}
```

示意图 (LCS DP 表格)：
```
字符串1: "ABCDGH"
字符串2: "AEDFHR"

DP表格:
    "" A E D F H R
""   0 0 0 0 0 0 0
A    0 1 1 1 1 1 1  
B    0 1 1 1 1 1 1
C    0 1 1 1 1 1 1
D    0 1 1 2 2 2 2
G    0 1 1 2 2 2 2
H    0 1 1 2 2 3 3

LCS长度 = 3
LCS序列: "ADH"

重建过程:
从(6,6)=3开始
H=H → 加入H → 移动到(5,5)
D≠F → 比较(4,5)=2和(5,4)=2 → 选择(4,5)
D=D → 加入D → 移动到(3,3)  
A=A → 加入A → 移动到(2,2)
完成，LCS="ADH"
```

## 高级字符串算法

### Rabin-Karp 算法

使用哈希函数进行字符串匹配，通过滚动哈希实现高效搜索。

特点：
- 哈希匹配：使用哈希值快速比较
- 滚动哈希：常数时间更新哈希值
- 多模式支持：天然支持多模式搜索

```javascript
// Rabin-Karp算法
export function rabinKarpSearch(text, pattern, prime = 101) {
  const n = text.length;
  const m = pattern.length;
  const positions = [];
  let comparisons = 0;
  
  if (m === 0 || n < m) return { positions, comparisons };
  
  // 计算pattern哈希和第一个窗口哈希
  let patternHash = 0;
  let textHash = 0;
  let h = 1;
  
  // h = (d^(m-1)) % prime
  for (let i = 0; i < m - 1; i++) {
    h = (h * 256) % prime;
  }
  
  // 计算初始哈希值
  for (let i = 0; i < m; i++) {
    patternHash = (256 * patternHash + pattern.charCodeAt(i)) % prime;
    textHash = (256 * textHash + text.charCodeAt(i)) % prime;
  }
  
  // 滑动窗口
  for (let i = 0; i <= n - m; i++) {
    comparisons++;
    
    // 哈希值匹配时进行精确比较
    if (patternHash === textHash) {
      let match = true;
      
      for (let j = 0; j < m; j++) {
        comparisons++;
        if (text[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      
      if (match) {
        positions.push(i);
      }
    }
    
    // 计算下一个窗口的哈希值
    if (i < n - m) {
      textHash = (256 * (textHash - text.charCodeAt(i) * h) + 
                 text.charCodeAt(i + m)) % prime;
      
      // 处理负哈希值
      if (textHash < 0) {
        textHash += prime;
      }
    }
  }
  
  return {
    positions,
    comparisons,
    hashCollisions: comparisons - positions.length * m
  };
}

// 多模式Rabin-Karp
export function rabinKarpMultiple(text, patterns, prime = 101) {
  const results = [];
  const patternHashes = new Map();
  
  // 预计算所有模式的哈希值
  for (const pattern of patterns) {
    let hash = 0;
    for (let i = 0; i < pattern.length; i++) {
      hash = (256 * hash + pattern.charCodeAt(i)) % prime;
    }
    patternHashes.set(pattern, hash);
  }
  
  const m = Math.min(...patterns.map(p => p.length));
  const n = text.length;
  
  if (n < m) return results;
  
  let textHash = 0;
  let h = 1;
  
  for (let i = 0; i < m - 1; i++) {
    h = (h * 256) % prime;
  }
  
  for (let i = 0; i < m; i++) {
    textHash = (256 * textHash + text.charCodeAt(i)) % prime;
  }
  
  // 检查第一个窗口
  checkWindow(text, 0, textHash, patternHashes, results);
  
  // 滑动窗口
  for (let i = 1; i <= n - m; i++) {
    textHash = (256 * (textHash - text.charCodeAt(i - 1) * h) + 
               text.charCodeAt(i + m - 1)) % prime;
    
    if (textHash < 0) {
      textHash += prime;
    }
    
    checkWindow(text, i, textHash, patternHashes, results);
  }
  
  return results;
}

function checkWindow(text, position, textHash, patternHashes, results) {
  for (const [pattern, patternHash] of patternHashes) {
    if (textHash === patternHash) {
      // 哈希匹配，进行精确比较
      let match = true;
      for (let j = 0; j < pattern.length; j++) {
        if (text[position + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      
      if (match) {
        results.push({
          pattern,
          position
        });
      }
    }
  }
}
```

示意图 (Rabin-Karp 滚动哈希)：
```
文本: "ABCDEFG"
模式: "CDE"
素数: 101

计算模式哈希:
C:67, D:68, E:69
hash = (256*(256*67 + 68) + 69) % 101
     = (256*(17152 + 68) + 69) % 101
     = (256*17220 + 69) % 101
     = (4408320 + 69) % 101 = 4408389 % 101 = 35

文本窗口哈希:
窗口"ABC": (256*(256*65 + 66) + 67) % 101 = 33
窗口"BCD": 
  新哈希 = (256*(33 - 65*h) + 68) % 101
  h = (256^(2)) % 101 = 65536 % 101 = 88
  新哈希 = (256*(33 - 65*88) + 68) % 101
        = (256*(33 - 5720) + 68) % 101
        = (256*(-5687) + 68) % 101
        = (-1455360 + 68) % 101 = -1455292 % 101
        = -1455292 + 14405*101 = 35 (调整后)

哈希匹配35=35，进行精确比较"CDE"="CDE" → 匹配位置2
```

### 后缀数组

存储字符串所有后缀的排序数组，支持高效字符串搜索和分析。

特点：
- 后缀排序：所有后缀按字典序排列
- 高效搜索：支持 O(m log n) 时间复杂度的模式搜索
- 空间优化：相比后缀树更节省空间

```javascript
// 后缀数组实现
export class SuffixArray {
  constructor(text) {
    this.text = text;
    this.suffixArray = this.buildSuffixArray();
    this.lcpArray = this.buildLCPArray();
  }

  // 构建后缀数组
  buildSuffixArray() {
    const n = this.text.length;
    const suffixes = [];
    
    // 存储所有后缀及其起始索引
    for (let i = 0; i < n; i++) {
      suffixes.push({
        index: i,
        suffix: this.text.substring(i)
      });
    }
    
    // 按后缀字典序排序
    suffixes.sort((a, b) => a.suffix.localeCompare(b.suffix));
    
    // 提取索引数组
    return suffixes.map(s => s.index);
  }

  // 构建LCP（最长公共前缀）数组
  buildLCPArray() {
    const n = this.text.length;
    const lcp = new Array(n).fill(0);
    const inverseSuffix = new Array(n);
    
    // 构建逆后缀数组
    for (let i = 0; i < n; i++) {
      inverseSuffix[this.suffixArray[i]] = i;
    }
    
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (inverseSuffix[i] === n - 1) {
        k = 0;
        continue;
      }
      
      const j = this.suffixArray[inverseSuffix[i] + 1];
      
      // 计算LCP
      while (i + k < n && j + k < n && 
             this.text[i + k] === this.text[j + k]) {
        k++;
      }
      
      lcp[inverseSuffix[i]] = k;
      
      if (k > 0) k--;
    }
    
    return lcp;
  }

  // 在后缀数组中搜索模式
  search(pattern) {
    const n = this.text.length;
    const m = pattern.length;
    const positions = [];
    
    // 二分搜索找到模式的范围
    let left = 0;
    let right = n - 1;
    
    // 找到左边界
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const suffix = this.text.substring(this.suffixArray[mid]);
      const comparison = suffix.substring(0, m).localeCompare(pattern);
      
      if (comparison >= 0) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    
    const start = left;
    right = n - 1;
    
    // 找到右边界
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const suffix = this.text.substring(this.suffixArray[mid]);
      const comparison = suffix.substring(0, m).localeCompare(pattern);
      
      if (comparison <= 0) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    const end = right;
    
    // 收集所有匹配位置
    for (let i = start; i <= end; i++) {
      positions.push(this.suffixArray[i]);
    }
    
    return {
      positions: positions.sort((a, b) => a - b),
      count: positions.length,
      range: [start, end]
    };
  }

  // 获取最长重复子串
  getLongestRepeatedSubstring() {
    let maxLength = 0;
    let maxIndex = -1;
    
    for (let i = 0; i < this.lcpArray.length; i++) {
      if (this.lcpArray[i] > maxLength) {
        maxLength = this.lcpArray[i];
        maxIndex = i;
      }
    }
    
    if (maxLength > 0) {
      const startIndex = this.suffixArray[maxIndex];
      return this.text.substring(startIndex, startIndex + maxLength);
    }
    
    return '';
  }

  // 获取所有重复子串
  getAllRepeatedSubstrings(minLength = 2) {
    const substrings = new Map();
    
    for (let i = 0; i < this.lcpArray.length; i++) {
      if (this.lcpArray[i] >= minLength) {
        const startIndex = this.suffixArray[i];
        const substring = this.text.substring(startIndex, startIndex + this.lcpArray[i]);
        
        if (!substrings.has(substring)) {
          substrings.set(substring, []);
        }
        substrings.get(substring).push(startIndex);
      }
    }
    
    return Array.from(substrings.entries()).map(([substring, positions]) => ({
      substring,
      positions,
      length: substring.length
    }));
  }
}
```

示意图 (后缀数组构建)：
```
文本: "BANANA"

所有后缀:
0: "BANANA"
1: "ANANA" 
2: "NANA"
3: "ANA"
4: "NA"
5: "A"

排序后后缀数组:
索引 后缀
5    "A"
3    "ANA"
1    "ANANA"
0    "BANANA"
4    "NA"
2    "NANA"

后缀数组: [5, 3, 1, 0, 4, 2]

LCP数组: [0, 1, 3, 0, 0, 2]
解释: 
SA[0]和SA[1]: "A"和"ANA" → LCP=1 ("A")
SA[1]和SA[2]: "ANA"和"ANANA" → LCP=3 ("ANA")
SA[2]和SA[3]: "ANANA"和"BANANA" → LCP=0
SA[3]和SA[4]: "BANANA"和"NA" → LCP=0  
SA[4]和SA[5]: "NA"和"NANA" → LCP=2 ("NA")

搜索"ANA":
二分查找找到范围[1,2] → 位置3,1
```