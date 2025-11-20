# 回溯算法

## 什么是回溯算法

回溯算法是一种通过试错来寻找问题解决方案的算法。它通过深度优先搜索的方式系统地探索所有可能的候选解，当发现当前路径不可能得到正确解时，立即回溯并尝试其他路径。

特点：
- 系统性搜索：遍历所有可能的解空间
- 剪枝优化：在搜索过程中提前排除无效路径
- 递归实现：自然地使用递归进行状态探索和回退
- 通用性强：适用于组合、排列、子集等各类搜索问题

示意图 (回溯搜索树)：
```
开始
  ├── 选择A → 深入 → 失败 → 回溯
  ├── 选择B → 深入 → 成功 → 记录解
  └── 选择C → 深入 → 剪枝 → 回溯
```

## 回溯算法核心概念

### 状态空间树

回溯算法将问题解空间组织成树形结构，每个节点代表一个部分解，叶子节点代表完整解。

特点：
- 深度优先：沿着分支深入到底再回溯
- 路径表示：从根到叶子的路径代表一个候选解
- 节点扩展：每个节点可能产生多个子节点

```javascript
// 状态空间树的通用表示
export class StateSpaceNode {
  constructor(state, parent = null, choice = null) {
    this.state = state;        // 当前状态
    this.parent = parent;      // 父节点
    this.choice = choice;      // 导致当前状态的决策
    this.children = [];        // 子节点
    this.level = parent ? parent.level + 1 : 0; // 深度
  }
  
  // 判断是否为解节点
  isSolution() {
    throw new Error('isSolution must be implemented');
  }
  
  // 生成可能的下一步选择
  getPossibleChoices() {
    throw new Error('getPossibleChoices must be implemented');
  }
  
  // 应用选择生成新状态
  applyChoice(choice) {
    throw new Error('applyChoice must be implemented');
  }
}
```

示意图 (状态空间树结构)：
```
根节点(初始状态)
  ├── 选择1 → 状态A
  │   ├── 选择1.1 → 状态A1
  │   └── 选择1.2 → 状态A2
  ├── 选择2 → 状态B
  │   ├── 选择2.1 → 状态B1
  │   └── 选择2.2 → 状态B2
  └── 选择3 → 状态C
```

### 剪枝函数

剪枝函数在搜索过程中提前识别并排除不可能产生有效解的路径，大幅提升算法效率。

特点：
- 可行性剪枝：排除违反约束条件的分支
- 最优性剪枝：在优化问题中排除非最优分支
- 重复性剪枝：避免搜索相同状态多次

```javascript
// 剪枝策略管理器
export class PruningStrategy {
  static feasibilityPrune(state, constraints) {
    // 检查当前状态是否满足所有约束
    for (const constraint of constraints) {
      if (!constraint(state)) {
        return true; // 需要剪枝
      }
    }
    return false; // 不需要剪枝
  }
  
  static optimalityPrune(state, bestSoFar, isMaximization = true) {
    // 检查当前状态是否可能优于已知最优解
    if (bestSoFar === null) return false;
    
    const currentValue = state.getValue();
    if (isMaximization) {
      return currentValue + state.getPotential() <= bestSoFar;
    } else {
      return currentValue - state.getPotential() >= bestSoFar;
    }
  }
  
  static symmetryPrune(state, visitedStates) {
    // 检查是否已经访问过等价状态
    const stateKey = state.getCanonicalForm();
    if (visitedStates.has(stateKey)) {
      return true;
    }
    visitedStates.add(stateKey);
    return false;
  }
}

// N皇后问题的剪枝函数示例
export function nQueensPrune(board, row, col) {
  // 检查列冲突
  for (let i = 0; i < row; i++) {
    if (board[i][col] === 'Q') return true;
  }
  
  // 检查左上对角线
  for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
    if (board[i][j] === 'Q') return true;
  }
  
  // 检查右上对角线
  for (let i = row - 1, j = col + 1; i >= 0 && j < board.length; i--, j++) {
    if (board[i][j] === 'Q') return true;
  }
  
  return false; // 不需要剪枝
}
```

示意图 (剪枝效果)：
```
完整搜索树:
根
├── A → A1 → A2 → 解1
├── B → B1 → ✗ (剪枝)
├── C → ✗ (剪枝) 
└── D → D1 → D2 → 解2

剪枝后实际搜索:
根
├── A → A1 → A2 → 解1
└── D → D1 → D2 → 解2
跳过B、C分支，节省大量计算
```

## 回溯算法模板

### 通用回溯框架

回溯算法遵循固定的模式：选择、递归、撤销选择。

特点：
- 三步骤：做出选择 → 递归探索 → 撤销选择
- 路径维护：在递归过程中维护当前选择路径
- 结果收集：在叶子节点或满足条件时记录解

```javascript
// 通用回溯模板
export function backtrackTemplate(problem) {
  const results = [];
  const currentSolution = [];
  
  function backtrack(decisionPoint) {
    // 1. 检查是否找到解
    if (isSolution(currentSolution, problem)) {
      results.push([...currentSolution]);
      return;
    }
    
    // 2. 遍历所有可能选择
    const choices = generateChoices(decisionPoint, currentSolution, problem);
    
    for (const choice of choices) {
      // 3. 剪枝：检查选择是否可行
      if (!isValidChoice(choice, currentSolution, problem)) {
        continue;
      }
      
      // 4. 做出选择
      makeChoice(choice, currentSolution, problem);
      
      // 5. 递归探索
      backtrack(nextDecisionPoint(decisionPoint, choice));
      
      // 6. 撤销选择
      undoChoice(choice, currentSolution, problem);
    }
  }
  
  backtrack(initialDecisionPoint(problem));
  return results;
}

// 具体实现的示例 - 排列问题
export function permutations(nums) {
  const results = [];
  const used = new Array(nums.length).fill(false);
  const current = [];
  
  function backtrack() {
    // 找到完整排列
    if (current.length === nums.length) {
      results.push([...current]);
      return;
    }
    
    for (let i = 0; i < nums.length; i++) {
      // 剪枝：跳过已使用的元素
      if (used[i]) continue;
      
      // 做出选择
      used[i] = true;
      current.push(nums[i]);
      
      // 递归探索
      backtrack();
      
      // 撤销选择
      current.pop();
      used[i] = false;
    }
  }
  
  backtrack();
  return results;
}
```

示意图 (回溯过程)：
```
排列[1,2,3]的回溯：
开始: []
选择1: [1]
  选择2: [1,2] 
    选择3: [1,2,3] → 记录解
    撤销3: [1,2]
  撤销2: [1]
  选择3: [1,3]
    选择2: [1,3,2] → 记录解
    撤销2: [1,3]
  撤销3: [1]
撤销1: []
选择2: [2] ... (继续)
```

### 迭代回溯实现

使用显式栈模拟递归过程，避免递归深度限制并提供更多控制。

特点：
- 显式栈：手动管理搜索状态
- 避免递归：解决深度过大时的栈溢出问题
- 灵活控制：可以更精细地控制搜索过程

```javascript
// 迭代回溯框架
export function iterativeBacktrack(problem) {
  const results = [];
  const stack = [{
    state: problem.initialState,
    path: [],
    nextChoiceIndex: 0
  }];
  
  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    
    // 检查是否还有未尝试的选择
    const choices = problem.getChoices(current.state);
    if (current.nextChoiceIndex >= choices.length) {
      // 当前节点的所有选择都已尝试，回溯
      stack.pop();
      continue;
    }
    
    // 获取下一个选择
    const choice = choices[current.nextChoiceIndex];
    current.nextChoiceIndex++;
    
    // 检查选择是否有效
    if (!problem.isValidChoice(choice, current.state, current.path)) {
      continue;
    }
    
    // 应用选择
    const newState = problem.applyChoice(choice, current.state);
    const newPath = [...current.path, choice];
    
    // 检查是否找到解
    if (problem.isSolution(newState, newPath)) {
      results.push({
        state: newState,
        path: newPath
      });
      
      // 如果只需要一个解，可以在这里返回
      if (problem.findOne) {
        return results;
      }
    }
    
    // 继续探索
    stack.push({
      state: newState,
      path: newPath,
      nextChoiceIndex: 0
    });
  }
  
  return results;
}

// 使用迭代回溯解决子集问题
export function subsetsIterative(nums) {
  const results = [[]];
  const stack = [{
    index: 0,
    path: []
  }];
  
  while (stack.length > 0) {
    const current = stack.pop();
    
    for (let i = current.index; i < nums.length; i++) {
      const newPath = [...current.path, nums[i]];
      results.push(newPath);
      
      // 只添加索引更大的元素，避免重复
      if (i + 1 < nums.length) {
        stack.push({
          index: i + 1,
          path: newPath
        });
      }
    }
  }
  
  return results;
}
```

示意图 (迭代回溯栈状态)：
```
初始栈: [{index:0, path:[]}]

弹出: {index:0, path:[]}
生成: [1], [1,2], [1,2,3], [1,3]
入栈: {index:2, path:[1]}, {index:3, path:[1,2]}, {index:3, path:[1]}

弹出: {index:3, path:[1]} → 生成[1,3]
弹出: {index:3, path:[1,2]} → 生成[1,2,3]  
弹出: {index:2, path:[1]} → 生成[1,2]
继续处理其他分支...
```

## 经典回溯问题

### N 皇后问题

在 N×N 棋盘上放置 N 个皇后，使得它们互不攻击，展示约束满足问题的回溯解法。

特点：
- 约束满足：每个皇后不能在同一行、列、对角线
- 逐行放置：天然适合按行回溯
- 对称性剪枝：利用对称性减少搜索空间

```javascript
// N皇后问题回溯解法
export function solveNQueens(n) {
  const results = [];
  const board = Array.from({ length: n }, () => 
    new Array(n).fill('.')
  );
  
  function backtrack(row) {
    // 所有行都放置完成，找到解
    if (row === n) {
      results.push(board.map(row => row.join('')));
      return;
    }
    
    for (let col = 0; col < n; col++) {
      // 剪枝：检查当前位置是否安全
      if (!isSafe(board, row, col)) {
        continue;
      }
      
      // 放置皇后
      board[row][col] = 'Q';
      
      // 递归放置下一行
      backtrack(row + 1);
      
      // 撤销选择
      board[row][col] = '.';
    }
  }
  
  function isSafe(board, row, col) {
    const n = board.length;
    
    // 检查列
    for (let i = 0; i < row; i++) {
      if (board[i][col] === 'Q') return false;
    }
    
    // 检查左上对角线
    for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
      if (board[i][j] === 'Q') return false;
    }
    
    // 检查右上对角线
    for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
      if (board[i][j] === 'Q') return false;
    }
    
    return true;
  }
  
  backtrack(0);
  return results;
}

// 优化的N皇后解法 - 使用位运算
export function solveNQueensBitwise(n) {
  const results = [];
  
  function backtrack(row, columns, diagonals1, diagonals2, solution) {
    if (row === n) {
      results.push([...solution]);
      return;
    }
    
    // 计算可用的位置
    let availablePositions = ((1 << n) - 1) & 
                           ~(columns | diagonals1 | diagonals2);
    
    while (availablePositions !== 0) {
      // 获取最低位的1（最右边的可用位置）
      const position = availablePositions & -availablePositions;
      // 移除这个位置
      availablePositions &= availablePositions - 1;
      
      // 计算列索引
      const col = Math.log2(position);
      
      // 记录当前选择
      solution.push(col);
      
      // 递归，更新约束
      backtrack(
        row + 1,
        columns | position,
        (diagonals1 | position) << 1,
        (diagonals2 | position) >> 1,
        solution
      );
      
      // 回溯
      solution.pop();
    }
  }
  
  backtrack(0, 0, 0, 0, []);
  
  // 将数字解转换为棋盘表示
  return results.map(solution => 
    solution.map(col => 
      '.'.repeat(col) + 'Q' + '.'.repeat(n - col - 1)
    )
  );
}
```

示意图 (4 皇后问题搜索)：
```
第0行: 尝试列0,1,2,3
选择列0:
  第1行: 列0,1冲突 → 尝试列2,3
  选择列2:
    第2行: 列0,1,2,3都冲突 → 回溯
  选择列3:
    第2行: 列1安全 → 放置
      第3行: 列0,1,2,3都冲突 → 回溯
选择列1:
  第1行: 列3安全 → 放置
    第2行: 列0安全 → 放置
      第3行: 列2安全 → 找到解
继续搜索其他解...
```

### 数独求解

使用回溯算法解决数独难题，展示约束传播与回溯的结合。

特点：
- 多约束：行、列、九宫格都需要满足数字唯一
- 启发式：可以选择最少可能值的格子优先填充
- 高效剪枝：尽早发现冲突并回溯

```javascript
// 数独求解器
export class SudokuSolver {
  static solve(board) {
    return this.backtrack(board);
  }
  
  static backtrack(board) {
    const emptyCell = this.findEmptyCell(board);
    
    // 没有空格子，数独已解决
    if (!emptyCell) {
      return true;
    }
    
    const [row, col] = emptyCell;
    
    // 尝试所有可能的数字
    for (let num = 1; num <= 9; num++) {
      if (this.isValid(board, row, col, num)) {
        // 放置数字
        board[row][col] = num;
        
        // 递归求解
        if (this.backtrack(board)) {
          return true;
        }
        
        // 回溯
        board[row][col] = 0;
      }
    }
    
    return false; // 无解
  }
  
  static findEmptyCell(board) {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === 0) {
          return [i, j];
        }
      }
    }
    return null;
  }
  
  static isValid(board, row, col, num) {
    // 检查行
    for (let j = 0; j < 9; j++) {
      if (board[row][j] === num) return false;
    }
    
    // 检查列
    for (let i = 0; i < 9; i++) {
      if (board[i][col] === num) return false;
    }
    
    // 检查3x3宫格
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[boxRow + i][boxCol + j] === num) return false;
      }
    }
    
    return true;
  }
  
  // 使用MRV（最小剩余值）启发式的优化版本
  static solveWithMRV(board) {
    const emptyCells = this.findAllEmptyCells(board);
    
    if (emptyCells.length === 0) {
      return true; // 数独已解决
    }
    
    // 选择约束最多的格子（MRV启发式）
    const [row, col, possibleValues] = this.selectMostConstrainedCell(board, emptyCells);
    
    for (const num of possibleValues) {
      board[row][col] = num;
      
      if (this.solveWithMRV(board)) {
        return true;
      }
      
      board[row][col] = 0;
    }
    
    return false;
  }
  
  static findAllEmptyCells(board) {
    const emptyCells = [];
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === 0) {
          emptyCells.push([i, j]);
        }
      }
    }
    return emptyCells;
  }
  
  static selectMostConstrainedCell(board, emptyCells) {
    let bestCell = null;
    let minPossibleValues = 10; // 大于9
    
    for (const [row, col] of emptyCells) {
      const possibleValues = this.getPossibleValues(board, row, col);
      if (possibleValues.length < minPossibleValues) {
        minPossibleValues = possibleValues.length;
        bestCell = [row, col, possibleValues];
      }
    }
    
    return bestCell;
  }
  
  static getPossibleValues(board, row, col) {
    const possible = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    
    // 移除行中已存在的数字
    for (let j = 0; j < 9; j++) {
      possible.delete(board[row][j]);
    }
    
    // 移除列中已存在的数字
    for (let i = 0; i < 9; i++) {
      possible.delete(board[i][col]);
    }
    
    // 移除宫格中已存在的数字
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        possible.delete(board[boxRow + i][boxCol + j]);
      }
    }
    
    return Array.from(possible);
  }
}
```

示意图 (数独求解过程)：
```
初始数独:
5 3 0 | 0 7 0 | 0 0 0
6 0 0 | 1 9 5 | 0 0 0
0 9 8 | 0 0 0 | 0 6 0
------+------+------
8 0 0 | 0 6 0 | 0 0 3
4 0 0 | 8 0 3 | 0 0 1
7 0 0 | 0 2 0 | 0 0 6
------+------+------
0 6 0 | 0 0 0 | 2 8 0
0 0 0 | 4 1 9 | 0 0 5
0 0 0 | 0 8 0 | 0 7 9

求解步骤:
1. 找到(0,2)可能值: 1,2,4 → 尝试1
2. 继续填充直到冲突 → 回溯到(0,2)尝试2
3. 最终找到有效填充...
```

## 回溯优化技巧

### 约束传播

在做出选择后立即传播约束，减少后续搜索空间。

特点：
- 前向检查：提前发现并排除未来冲突
- 维护域：跟踪每个变量的可能取值
- 深度剪枝：在搜索早期排除大量无效分支

```javascript
// 使用约束传播的回溯 - 以数独为例
export class ConstraintPropagation {
  static solveWithPropagation(board) {
    // 初始化每个格子的可能值域
    const domains = this.initializeDomains(board);
    return this.backtrackWithDomains(board, domains);
  }
  
  static initializeDomains(board) {
    const domains = {};
    
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const key = `${i},${j}`;
        if (board[i][j] === 0) {
          domains[key] = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        } else {
          domains[key] = new Set([board[i][j]]);
        }
      }
    }
    
    // 初始约束传播
    this.propagateConstraints(board, domains);
    return domains;
  }
  
  static backtrackWithDomains(board, domains) {
    const emptyCell = this.findEmptyCellWithMRV(domains);
    
    if (!emptyCell) {
      return true; // 解决完成
    }
    
    const [row, col] = emptyCell;
    const key = `${row},${col}`;
    const possibleValues = Array.from(domains[key]);
    
    for (const value of possibleValues) {
      // 保存当前域状态以便回溯
      const domainsBackup = this.cloneDomains(domains);
      
      // 赋值并传播约束
      board[row][col] = value;
      domains[key] = new Set([value]);
      
      if (this.propagateFromCell(board, domains, row, col) && 
          this.backtrackWithDomains(board, domains)) {
        return true;
      }
      
      // 回溯：恢复域状态
      this.restoreDomains(domains, domainsBackup);
      board[row][col] = 0;
    }
    
    return false;
  }
  
  static propagateFromCell(board, domains, row, col) {
    const value = board[row][col];
    
    // 传播到同一行
    for (let j = 0; j < 9; j++) {
      if (j !== col && !this.removeFromDomain(domains, row, j, value)) {
        return false; // 域为空，冲突
      }
    }
    
    // 传播到同一列
    for (let i = 0; i < 9; i++) {
      if (i !== row && !this.removeFromDomain(domains, i, col, value)) {
        return false;
      }
    }
    
    // 传播到同一宫格
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const r = boxRow + i, c = boxCol + j;
        if (r !== row && c !== col && !this.removeFromDomain(domains, r, c, value)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  static removeFromDomain(domains, row, col, value) {
    const key = `${row},${col}`;
    if (domains[key].has(value)) {
      domains[key].delete(value);
      return domains[key].size > 0; // 返回域是否非空
    }
    return true;
  }
}
```

示意图 (约束传播效果)：
```
赋值前:
格子(0,2)域: {1,2,3,4,5,6,7,8,9}
同行(0,x)域受影响
同列(x,2)域受影响  
同宫格域受影响

赋值(0,2)=1后:
格子(0,2)域: {1}
同行(0,3)域移除1 → {2,3,4,5,6,7,8,9}
同列(1,2)域移除1 → {2,3,4,5,6,7,8,9}
...
提前发现冲突，减少后续搜索
```

### 记忆化回溯

存储已计算的状态结果，避免重复计算相同子问题。

特点：
- 状态缓存：存储子问题的解
- 重复检测：识别相同的搜索状态
- 性能提升：显著减少计算量

```javascript
// 带记忆化的回溯 - 以正则表达式匹配为例
export class MemoizedBacktrack {
  static isMatch(s, p) {
    const memo = new Map();
    return this.dfs(0, 0, s, p, memo);
  }
  
  static dfs(i, j, s, p, memo) {
    const key = `${i},${j}`;
    
    // 检查记忆化结果
    if (memo.has(key)) {
      return memo.get(key);
    }
    
    // 模式串已用完
    if (j === p.length) {
      const result = i === s.length;
      memo.set(key, result);
      return result;
    }
    
    // 检查当前字符是否匹配
    const firstMatch = i < s.length && (p[j] === s[i] || p[j] === '.');
    let result = false;
    
    // 处理'*'通配符
    if (j + 1 < p.length && p[j + 1] === '*') {
      // 两种情况：匹配0次或匹配1次
      result = this.dfs(i, j + 2, s, p, memo) || 
               (firstMatch && this.dfs(i + 1, j, s, p, memo));
    } else {
      // 普通字符匹配
      result = firstMatch && this.dfs(i + 1, j + 1, s, p, memo);
    }
    
    memo.set(key, result);
    return result;
  }
}

// 括号生成问题的记忆化回溯
export function generateParenthesisMemoized(n) {
  const memo = new Map();
  
  function generate(open, close) {
    const key = `${open},${close}`;
    if (memo.has(key)) {
      return memo.get(key);
    }
    
    if (open === 0 && close === 0) {
      return [''];
    }
    
    const results = [];
    
    // 可以添加左括号的条件
    if (open > 0) {
      const leftResults = generate(open - 1, close);
      for (const result of leftResults) {
        results.push('(' + result);
      }
    }
    
    // 可以添加右括号的条件：右括号数量不能超过左括号
    if (close > open) {
      const rightResults = generate(open, close - 1);
      for (const result of rightResults) {
        results.push(')' + result);
      }
    }
    
    memo.set(key, results);
    return results;
  }
  
  return generate(n, n);
}
```

示意图 (记忆化避免重复计算)：
```
生成2对括号:
状态(2,2)
  ├── 加'(' → 状态(1,2)
  │   ├── 加'(' → 状态(0,2)
  │   │   ├── 加')' → 状态(0,1)
  │   │   │   └── 加')' → 状态(0,0) → ["()()"]
  │   │   └── 记忆化状态(0,2)
  │   └── 加')' → 状态(1,1)
  │       ├── 加'(' → 状态(0,1) ← 从记忆化获取
  │       └── 加')' → 状态(1,0) → 无效
  └── 记忆化状态(2,2)

避免重复计算状态(0,1), (0,2)等
```

## 回溯与其它算法对比

### 回溯 vs 动态规划

回溯和动态规划都用于解决组合优化问题，但适用场景和策略不同。

对比特点：
- 问题类型：回溯适合求所有解，DP 适合求最优解
- 时间复杂度：回溯通常指数级，DP 通常多项式级
- 空间使用：回溯使用调用栈，DP 使用表格
- 适用条件：回溯通用性强，DP 需要最优子结构

```javascript
// 同一问题的回溯和DP解法对比 - 硬币找零
export class CoinChangeComparison {
  // 回溯解法 - 找零的所有可能方式
  static coinChangeBacktrack(coins, amount) {
    const results = [];
    const current = [];
    
    function backtrack(start, remaining) {
      if (remaining === 0) {
        results.push([...current]);
        return;
      }
      
      if (remaining < 0) {
        return;
      }
      
      for (let i = start; i < coins.length; i++) {
        current.push(coins[i]);
        backtrack(i, remaining - coins[i]); // 允许重复使用
        current.pop();
      }
    }
    
    backtrack(0, amount);
    return results;
  }
  
  // DP解法 - 找零的最少硬币数
  static coinChangeDP(coins, amount) {
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    
    for (let i = 1; i <= amount; i++) {
      for (const coin of coins) {
        if (i - coin >= 0) {
          dp[i] = Math.min(dp[i], dp[i - coin] + 1);
        }
      }
    }
    
    return dp[amount] === Infinity ? -1 : dp[amount];
  }
}
```

示意图 (算法选择指南)：
```
问题特征                 推荐算法
需要所有解              → 回溯
需要最优解              → 动态规划
约束满足问题            → 回溯 + 剪枝
有重叠子问题            → 动态规划
解空间巨大但解稀少      → 回溯 + 强力剪枝
问题规模较小            → 回溯
问题规模较大            → 动态规划
```

### 回溯应用场景识别

识别适合使用回溯算法的问题特征和模式。

适用场景特征：
- 组合问题：需要生成所有组合、排列、子集
- 约束满足：问题有明确的约束条件
- 决策序列：问题可以建模为一系列决策
- 解验证易：容易验证部分解或完整解的有效性

```javascript
// 回溯适用性分析器
export class BacktrackSuitability {
  static isSuitable(problem) {
    const checks = [
      this.hasDecisionSequence(problem),
      this.hasClearConstraints(problem),
      this.hasFiniteChoices(problem),
      this.canPruneEarly(problem),
      this.needsAllSolutions(problem)
    ];
    
    return checks.every(check => check);
  }
  
  static hasDecisionSequence(problem) {
    // 问题是否能分解为一系列决策
    return problem.decisions && problem.decisions.length > 0;
  }
  
  static hasClearConstraints(problem) {
    // 是否有明确的约束可用于剪枝
    return problem.constraints && problem.constraints.length > 0;
  }
  
  static hasFiniteChoices(problem) {
    // 每个决策点的选择是否有限
    return problem.choiceLimit && problem.choiceLimit < 1000; // 合理上限
  }
  
  static canPruneEarly(problem) {
    // 是否能在搜索早期识别无效路径
    return problem.earlyTermination !== false;
  }
  
  static needsAllSolutions(problem) {
    // 是否需要所有解而非单个解
    return problem.requireAllSolutions === true;
  }
  
  // 问题模式匹配
  static recognizePattern(problem) {
    const patterns = {
      'permutations': /arrange.*order|permut/i,
      'combinations': /combinations?|choose.*from/i,
      'subsets': /subsets?|all.*possibilities/i,
      'constraint-satisfaction': /constraint|satisfy|fit.*requirements/i,
      'path-finding': /paths?|routes?|ways?/i
    };
    
    for (const [pattern, regex] of Object.entries(patterns)) {
      if (regex.test(problem.description)) {
        return pattern;
      }
    }
    
    return 'unknown';
  }
}
```

示意图 (回溯适用问题分类)：
```
回溯适用问题
├── 组合问题
│   ├── 排列生成
│   ├── 组合生成  
│   └── 子集生成
├── 约束满足问题
│   ├── N皇后
│   ├── 数独
│   └── 图着色
├── 路径查找问题
│   ├── 迷宫求解
│   ├── 哈密顿路径
│   └── 骑士巡游
└── 决策序列问题
    ├── 括号生成
    ├── 电话号码字母组合
    └── 单词搜索
```