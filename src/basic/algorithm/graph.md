# 图算法

## 什么是图算法

图算法是专门用于处理图结构数据的计算方法。图由顶点和边组成，能够表示各种复杂关系网络，如社交网络、交通系统、知识图谱等。图算法解决路径查找、连通性分析、网络流优化等核心问题。

特点：
- 关系建模：表达实体间的复杂关联
- 网络分析：揭示系统结构和动态特性
- 算法多样：从简单遍历到复杂优化问题
- 应用广泛：社交网络、推荐系统、路由规划

示意图 (基本图结构)：
```
A —— B
|    |
C —— D
```

## 图的基本表示

### 邻接矩阵

使用二维数组表示图的连接关系，矩阵元素表示顶点间的边。

特点：
- 直接访问：快速判断任意两顶点是否相邻
- 空间开销：需要 O(V²) 空间，适合稠密图
- 权值表示：可直接存储边的权重信息

```javascript
// 邻接矩阵实现
export class AdjacencyMatrix {
  constructor(vertexCount, directed = false) {
    this.vertexCount = vertexCount;
    this.directed = directed;
    this.matrix = Array.from({ length: vertexCount }, () => 
      new Array(vertexCount).fill(0)
    );
  }

  addEdge(source, target, weight = 1) {
    this.matrix[source][target] = weight;
    if (!this.directed) {
      this.matrix[target][source] = weight;
    }
  }

  removeEdge(source, target) {
    this.matrix[source][target] = 0;
    if (!this.directed) {
      this.matrix[target][source] = 0;
    }
  }

  hasEdge(source, target) {
    return this.matrix[source][target] !== 0;
  }

  getNeighbors(vertex) {
    const neighbors = [];
    for (let i = 0; i < this.vertexCount; i++) {
      if (this.matrix[vertex][i] !== 0) {
        neighbors.push({ vertex: i, weight: this.matrix[vertex][i] });
      }
    }
    return neighbors;
  }

  getWeight(source, target) {
    return this.matrix[source][target];
  }
}
```

示意图 (邻接矩阵)：
```
图结构：
0 -- 1
|    |
2 -- 3

邻接矩阵：
  0 1 2 3
0 0 1 1 0
1 1 0 0 1
2 1 0 0 1
3 0 1 1 0
```

### 邻接表

为每个顶点维护一个邻居列表，存储相连的顶点及边信息。

特点：
- 空间高效：仅存储实际存在的边，适合稀疏图
- 遍历优化：直接获取顶点的所有邻居
- 灵活扩展：易于动态添加删除顶点和边

```javascript
// 邻接表实现
export class AdjacencyList {
  constructor(directed = false) {
    this.directed = directed;
    this.adjacencyList = new Map();
  }

  addVertex(vertex) {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, new Map());
    }
  }

  addEdge(source, target, weight = 1) {
    this.addVertex(source);
    this.addVertex(target);
    this.adjacencyList.get(source).set(target, weight);
    if (!this.directed) {
      this.adjacencyList.get(target).set(source, weight);
    }
  }

  removeEdge(source, target) {
    if (this.adjacencyList.has(source)) {
      this.adjacencyList.get(source).delete(target);
    }
    if (!this.directed && this.adjacencyList.has(target)) {
      this.adjacencyList.get(target).delete(source);
    }
  }

  hasEdge(source, target) {
    return this.adjacencyList.has(source) && 
           this.adjacencyList.get(source).has(target);
  }

  getNeighbors(vertex) {
    if (this.adjacencyList.has(vertex)) {
      return Array.from(this.adjacencyList.get(vertex).entries())
        .map(([neighbor, weight]) => ({ vertex: neighbor, weight }));
    }
    return [];
  }

  getWeight(source, target) {
    if (this.adjacencyList.has(source) && 
        this.adjacencyList.get(source).has(target)) {
      return this.adjacencyList.get(source).get(target);
    }
    return 0;
  }

  getVertices() {
    return Array.from(this.adjacencyList.keys());
  }
}
```

示意图 (邻接表)：
```
图结构：
0 -- 1
|    |
2 -- 3

邻接表：
0: {1: 1, 2: 1}
1: {0: 1, 3: 1}
2: {0: 1, 3: 1}
3: {1: 1, 2: 1}
```

## 图遍历算法

### 深度优先搜索 (DFS)

沿着图的深度方向遍历，尽可能深地探索每个分支。

特点：
- 递归深度：使用栈结构 (显式或隐式) 管理遍历顺序
- 路径探索：适合寻找路径和连通分量
- 回溯机制：自然支持回溯搜索

```javascript
// DFS递归实现
export function depthFirstSearch(graph, startVertex) {
  const visited = new Set();
  const discoveryOrder = [];
  const finishOrder = [];
  const parent = new Map();
  let time = 0;

  function dfs(vertex) {
    time++;
    visited.add(vertex);
    discoveryOrder.push(vertex);

    const neighbors = graph.getNeighbors(vertex);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.vertex)) {
        parent.set(neighbor.vertex, vertex);
        dfs(neighbor.vertex);
      }
    }

    time++;
    finishOrder.push(vertex);
  }

  parent.set(startVertex, null);
  dfs(startVertex);

  return {
    discoveryOrder,
    finishOrder,
    parent,
    visited: Array.from(visited)
  };
}

// DFS迭代实现
export function depthFirstSearchIterative(graph, startVertex) {
  const visited = new Set();
  const stack = [startVertex];
  const discoveryOrder = [];
  const parent = new Map();

  visited.add(startVertex);
  parent.set(startVertex, null);

  while (stack.length > 0) {
    const currentVertex = stack.pop();
    discoveryOrder.push(currentVertex);

    const neighbors = graph.getNeighbors(currentVertex);
    // 逆序入栈以保证与递归版本顺序一致
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const neighbor = neighbors[i];
      if (!visited.has(neighbor.vertex)) {
        visited.add(neighbor.vertex);
        parent.set(neighbor.vertex, currentVertex);
        stack.push(neighbor.vertex);
      }
    }
  }

  return {
    discoveryOrder,
    parent,
    visited: Array.from(visited)
  };
}

// DFS应用：检测环
export function hasCycle(graph) {
  const visited = new Set();
  const recursionStack = new Set();

  function dfs(vertex) {
    if (recursionStack.has(vertex)) {
      return true; // 发现环
    }
    if (visited.has(vertex)) {
      return false;
    }

    visited.add(vertex);
    recursionStack.add(vertex);

    const neighbors = graph.getNeighbors(vertex);
    for (const neighbor of neighbors) {
      if (dfs(neighbor.vertex)) {
        return true;
      }
    }

    recursionStack.delete(vertex);
    return false;
  }

  for (const vertex of graph.getVertices()) {
    if (!visited.has(vertex) && dfs(vertex)) {
      return true;
    }
  }
  return false;
}
```

示意图 (DFS 遍历过程)：
```
图结构：
A — B — C
|   |   |
D — E — F

DFS遍历顺序（从A开始）：
A → B → C → F → E → D

栈状态变化：
初始: [A]
弹出A → 访问A → 推入D, B → [D, B]
弹出B → 访问B → 推入E, C → [D, E, C]
弹出C → 访问C → 推入F → [D, E, F]
弹出F → 访问F → 推入E(已访问) → [D, E]
弹出E → 访问E → 推入D(已访问) → [D]
弹出D → 访问D → 栈空
```

### 广度优先搜索 (BFS)

按层次遍历图，先访问所有相邻顶点再深入下一层。

特点：
- 层次遍历：使用队列管理遍历顺序
- 最短路径：在无权图中能找到最短路径
- 系统扩展：均匀探索所有方向

```javascript
// BFS实现
export function breadthFirstSearch(graph, startVertex) {
  const visited = new Set();
  const queue = [startVertex];
  const discoveryOrder = [];
  const parent = new Map();
  const distance = new Map();

  visited.add(startVertex);
  parent.set(startVertex, null);
  distance.set(startVertex, 0);

  while (queue.length > 0) {
    const currentVertex = queue.shift();
    discoveryOrder.push(currentVertex);

    const neighbors = graph.getNeighbors(currentVertex);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.vertex)) {
        visited.add(neighbor.vertex);
        parent.set(neighbor.vertex, currentVertex);
        distance.set(neighbor.vertex, distance.get(currentVertex) + 1);
        queue.push(neighbor.vertex);
      }
    }
  }

  return {
    discoveryOrder,
    parent,
    distance,
    visited: Array.from(visited)
  };
}

// BFS应用：最短路径（无权图）
export function shortestPathBFS(graph, startVertex, targetVertex) {
  const visited = new Set();
  const queue = [startVertex];
  const parent = new Map();
  const distance = new Map();

  visited.add(startVertex);
  parent.set(startVertex, null);
  distance.set(startVertex, 0);

  while (queue.length > 0) {
    const currentVertex = queue.shift();

    if (currentVertex === targetVertex) {
      // 重建路径
      const path = [];
      let node = targetVertex;
      while (node !== null) {
        path.unshift(node);
        node = parent.get(node);
      }
      return {
        path,
        distance: distance.get(targetVertex)
      };
    }

    const neighbors = graph.getNeighbors(currentVertex);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.vertex)) {
        visited.add(neighbor.vertex);
        parent.set(neighbor.vertex, currentVertex);
        distance.set(neighbor.vertex, distance.get(currentVertex) + 1);
        queue.push(neighbor.vertex);
      }
    }
  }

  return null; // 没有路径
}
```

示意图 (BFS 遍历过程)：
```
图结构：
A — B — C
|   |   |
D — E — F

BFS遍历顺序（从A开始）：
A → B → D → C → E → F

队列状态变化：
初始: [A]
处理A → 加入B, D → [B, D]
处理B → 加入C, E → [D, C, E]
处理D → 加入E(已加入) → [C, E]
处理C → 加入F → [E, F]
处理E → 加入F(已加入) → [F]
处理F → 队列空

层次结构：
层级0: A
层级1: B, D
层级2: C, E
层级3: F
```

## 最短路径算法

### Dijkstra 算法

解决带权图的单源最短路径问题，要求权重非负。

特点：
- 贪心策略：每次选择当前距离最小的顶点
- 非负权重：不能处理负权边
- 最优子结构：最短路径的子路径也是最短的

```javascript
// Dijkstra算法实现
export function dijkstra(graph, startVertex) {
  const distances = new Map();
  const visited = new Set();
  const previous = new Map();
  const priorityQueue = new MinPriorityQueue();

  // 初始化距离
  for (const vertex of graph.getVertices()) {
    distances.set(vertex, Infinity);
  }
  distances.set(startVertex, 0);
  priorityQueue.enqueue(startVertex, 0);

  while (!priorityQueue.isEmpty()) {
    const { element: currentVertex, priority: currentDistance } = priorityQueue.dequeue();

    if (visited.has(currentVertex)) {
      continue;
    }
    visited.add(currentVertex);

    const neighbors = graph.getNeighbors(currentVertex);
    for (const neighbor of neighbors) {
      if (visited.has(neighbor.vertex)) {
        continue;
      }

      const newDistance = currentDistance + neighbor.weight;

      if (newDistance < distances.get(neighbor.vertex)) {
        distances.set(neighbor.vertex, newDistance);
        previous.set(neighbor.vertex, currentVertex);
        priorityQueue.enqueue(neighbor.vertex, newDistance);
      }
    }
  }

  return { distances, previous };
}

// 从Dijkstra结果重建路径
export function reconstructPath(previous, startVertex, targetVertex) {
  const path = [];
  let current = targetVertex;

  while (current !== undefined) {
    path.unshift(current);
    current = previous.get(current);
  }

  // 检查路径是否有效
  if (path[0] === startVertex) {
    return path;
  }
  return null; // 没有路径
}

// 最小优先队列实现
class MinPriorityQueue {
  constructor() {
    this.heap = [];
    this.elementToIndex = new Map();
  }

  enqueue(element, priority) {
    this.heap.push({ element, priority });
    this.elementToIndex.set(element, this.heap.length - 1);
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue() {
    if (this.heap.length === 0) return null;
    
    const min = this.heap[0];
    const end = this.heap.pop();
    this.elementToIndex.delete(min.element);

    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.elementToIndex.set(end.element, 0);
      this.sinkDown(0);
    }

    return min;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  bubbleUp(idx) {
    const element = this.heap[idx];
    
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.heap[parentIdx];
      
      if (element.priority >= parent.priority) break;
      
      this.heap[parentIdx] = element;
      this.heap[idx] = parent;
      this.elementToIndex.set(element.element, parentIdx);
      this.elementToIndex.set(parent.element, idx);
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
        if (leftChild.priority < element.priority) {
          swap = leftChildIdx;
        }
      }
      
      if (rightChildIdx < length) {
        rightChild = this.heap[rightChildIdx];
        if (
          (swap === null && rightChild.priority < element.priority) ||
          (swap !== null && rightChild.priority < leftChild.priority)
        ) {
          swap = rightChildIdx;
        }
      }
      
      if (swap === null) break;
      
      this.heap[idx] = this.heap[swap];
      this.heap[swap] = element;
      this.elementToIndex.set(element.element, swap);
      this.elementToIndex.set(this.heap[idx].element, idx);
      idx = swap;
    }
  }
}
```

示意图 (Dijkstra 算法过程)：
```
带权图：
    A
  1/ \4
  B — C
  2\ /3
    D

从A到各顶点的最短路径：
A: 0
B: 1 (A→B)
C: 4 (A→C) 或 3 (A→B→D→C)
D: 3 (A→B→D)

Dijkstra步骤：
初始: 距离{A:0, B:∞, C:∞, D:∞}
处理A → 更新B:1, C:4 → 距离{B:1, C:4, D:∞}
处理B → 更新D:1+2=3 → 距离{C:4, D:3}
处理D → 更新C:3+3=6(但4<6，不更新) → 距离{C:4}
处理C → 完成
```

### Bellman-Ford 算法

处理带负权边的单源最短路径，并能检测负权环。

特点：
- 负权处理：能够处理负权边
- 负环检测：检测图中是否存在负权环
- 动态规划：通过松弛操作逐步逼近最优解

```javascript
// Bellman-Ford算法实现
export function bellmanFord(graph, startVertex) {
  const distances = new Map();
  const previous = new Map();

  // 初始化
  for (const vertex of graph.getVertices()) {
    distances.set(vertex, Infinity);
  }
  distances.set(startVertex, 0);

  // 获取所有边
  const edges = [];
  for (const vertex of graph.getVertices()) {
    const neighbors = graph.getNeighbors(vertex);
    for (const neighbor of neighbors) {
      edges.push({
        source: vertex,
        target: neighbor.vertex,
        weight: neighbor.weight
      });
    }
  }

  // 松弛操作 |V| - 1 次
  for (let i = 0; i < graph.getVertices().length - 1; i++) {
    let updated = false;
    
    for (const edge of edges) {
      const newDistance = distances.get(edge.source) + edge.weight;
      
      if (newDistance < distances.get(edge.target)) {
        distances.set(edge.target, newDistance);
        previous.set(edge.target, edge.source);
        updated = true;
      }
    }
    
    // 如果没有更新，提前终止
    if (!updated) break;
  }

  // 检查负权环
  for (const edge of edges) {
    if (distances.get(edge.source) + edge.weight < distances.get(edge.target)) {
      throw new Error('图中存在负权环');
    }
  }

  return { distances, previous };
}
```

示意图 (Bellman-Ford 松弛过程)：
```
带负权图：
A --2--> B --1--> C
 \       |       /
  \ -3   4    -2
   \     |     /
    ---- D ----

从A开始：
初始: dist[A]=0, 其他∞
第1轮松弛:
  A→B: 0+2=2 < ∞ → dist[B]=2
  A→D: 0+(-3)=-3 < ∞ → dist[D]=-3
  B→C: 2+1=3 < ∞ → dist[C]=3
  B→D: 2+4=6 > -3 → 不更新
  D→C: -3+(-2)=-5 < 3 → dist[C]=-5
第2轮松弛:
  B→C: 2+1=3 > -5 → 不更新
  D→C: -3+(-2)=-5 = -5 → 不更新
完成
```

## 最小生成树算法

### Prim 算法

通过逐步添加最小权重边来构建最小生成树。

特点：
- 贪心策略：每次选择连接树和非树节点的最小边
- 稠密图适用：在稠密图中效率较高
- 类似 Dijkstra：使用优先队列管理候选边

```javascript
// Prim算法实现
export function prim(graph) {
  if (graph.getVertices().length === 0) return [];

  const mst = [];
  const visited = new Set();
  const minHeap = new MinPriorityQueue();

  // 从任意顶点开始
  const startVertex = graph.getVertices()[0];
  visited.add(startVertex);

  // 将起始顶点的边加入堆
  const startNeighbors = graph.getNeighbors(startVertex);
  for (const neighbor of startNeighbors) {
    minHeap.enqueue(
      { from: startVertex, to: neighbor.vertex, weight: neighbor.weight },
      neighbor.weight
    );
  }

  while (!minHeap.isEmpty() && visited.size < graph.getVertices().length) {
    const { element: edge } = minHeap.dequeue();
    
    if (visited.has(edge.to)) {
      continue;
    }

    // 添加边到MST
    mst.push(edge);
    visited.add(edge.to);

    // 将新顶点的边加入堆
    const newNeighbors = graph.getNeighbors(edge.to);
    for (const neighbor of newNeighbors) {
      if (!visited.has(neighbor.vertex)) {
        minHeap.enqueue(
          { from: edge.to, to: neighbor.vertex, weight: neighbor.weight },
          neighbor.weight
        );
      }
    }
  }

  return mst;
}

// 计算MST总权重
export function calculateMSTWeight(mst) {
  return mst.reduce((total, edge) => total + edge.weight, 0);
}
```

示意图 (Prim 算法过程)：
```
带权图：
    A
  1/ \4
  B — C
  2\ /3
    D

Prim构建过程：
从A开始：
选择最小边AB(1) → MST: [AB]
从{A,B}出发：
候选边: AC(4), BD(2) → 选择BD(2) → MST: [AB, BD]
从{A,B,D}出发：
候选边: AC(4), DC(3) → 选择DC(3) → MST: [AB, BD, DC]
完成，总权重: 1+2+3=6
```

### Kruskal 算法

通过排序所有边并逐步添加不形成环的边来构建最小生成树。

特点：
- 边排序：先对所有边按权重排序
- 并查集：使用并查集高效检测环
- 稀疏图适用：在稀疏图中效率较高

```javascript
// Kruskal算法实现
export function kruskal(graph) {
  const mst = [];
  const edges = [];
  
  // 收集所有边
  for (const vertex of graph.getVertices()) {
    const neighbors = graph.getNeighbors(vertex);
    for (const neighbor of neighbors) {
      // 避免重复添加无向图的边
      if (graph.directed || vertex <= neighbor.vertex) {
        edges.push({
          source: vertex,
          target: neighbor.vertex,
          weight: neighbor.weight
        });
      }
    }
  }
  
  // 按权重排序边
  edges.sort((a, b) => a.weight - b.weight);
  
  const unionFind = new UnionFind(graph.getVertices());
  
  for (const edge of edges) {
    if (!unionFind.connected(edge.source, edge.target)) {
      mst.push(edge);
      unionFind.union(edge.source, edge.target);
      
      // 如果已经找到V-1条边，提前终止
      if (mst.length === graph.getVertices().length - 1) {
        break;
      }
    }
  }
  
  return mst;
}

// 并查集实现
class UnionFind {
  constructor(vertices) {
    this.parent = new Map();
    this.rank = new Map();
    
    for (const vertex of vertices) {
      this.parent.set(vertex, vertex);
      this.rank.set(vertex, 0);
    }
  }
  
  find(x) {
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x))); // 路径压缩
    }
    return this.parent.get(x);
  }
  
  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);
    
    if (rootX === rootY) return;
    
    // 按秩合并
    if (this.rank.get(rootX) < this.rank.get(rootY)) {
      this.parent.set(rootX, rootY);
    } else if (this.rank.get(rootX) > this.rank.get(rootY)) {
      this.parent.set(rootY, rootX);
    } else {
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, this.rank.get(rootX) + 1);
    }
  }
  
  connected(x, y) {
    return this.find(x) === this.find(y);
  }
}
```

示意图 (Kruskal 算法过程)：
```
边按权重排序：AB(1), BD(2), CD(3), AC(4), BC(5)

Kruskal步骤：
选择AB(1) → 不形成环 → MST: [AB]
选择BD(2) → 不形成环 → MST: [AB, BD]  
选择CD(3) → 不形成环 → MST: [AB, BD, CD]
选择AC(4) → 形成环(A-B-D-C-A) → 跳过
选择BC(5) → 形成环 → 跳过
完成，总权重: 1+2+3=6
```

## 拓扑排序

对有向无环图进行线性排序，使得对于每条边 (u→v)，u 在 v 之前。

特点：
- DAG 专用：只能应用于有向无环图
- 依赖解析：表示任务间的前置关系
- 多解可能：一个 DAG 可能有多个有效排序

```javascript
// Kahn算法（基于入度）
export function topologicalSortKahn(graph) {
  if (!graph.directed) {
    throw new Error('拓扑排序只适用于有向图');
  }
  
  const inDegree = new Map();
  const queue = [];
  const result = [];
  
  // 计算入度
  for (const vertex of graph.getVertices()) {
    inDegree.set(vertex, 0);
  }
  
  for (const vertex of graph.getVertices()) {
    const neighbors = graph.getNeighbors(vertex);
    for (const neighbor of neighbors) {
      inDegree.set(neighbor.vertex, inDegree.get(neighbor.vertex) + 1);
    }
  }
  
  // 入度为0的顶点入队
  for (const [vertex, degree] of inDegree) {
    if (degree === 0) {
      queue.push(vertex);
    }
  }
  
  while (queue.length > 0) {
    const current = queue.shift();
    result.push(current);
    
    const neighbors = graph.getNeighbors(current);
    for (const neighbor of neighbors) {
      inDegree.set(neighbor.vertex, inDegree.get(neighbor.vertex) - 1);
      if (inDegree.get(neighbor.vertex) === 0) {
        queue.push(neighbor.vertex);
      }
    }
  }
  
  // 检查是否有环
  if (result.length !== graph.getVertices().length) {
    throw new Error('图中存在环，无法进行拓扑排序');
  }
  
  return result;
}

// DFS方法拓扑排序
export function topologicalSortDFS(graph) {
  if (!graph.directed) {
    throw new Error('拓扑排序只适用于有向图');
  }
  
  const visited = new Set();
  const temp = new Set(); // 临时标记，用于检测环
  const result = [];
  
  function dfs(vertex) {
    if (temp.has(vertex)) {
      throw new Error('图中存在环');
    }
    
    if (visited.has(vertex)) {
      return;
    }
    
    temp.add(vertex);
    
    const neighbors = graph.getNeighbors(vertex);
    for (const neighbor of neighbors) {
      dfs(neighbor.vertex);
    }
    
    temp.delete(vertex);
    visited.add(vertex);
    result.unshift(vertex); // 在开头添加，实现逆后序
  }
  
  for (const vertex of graph.getVertices()) {
    if (!visited.has(vertex)) {
      dfs(vertex);
    }
  }
  
  return result;
}
```

示意图 (拓扑排序)：
```
有向无环图：
A → B → C
↓       ↓
D → E → F

拓扑排序结果：
有效排序1: A, B, D, C, E, F
有效排序2: A, D, B, E, C, F
无效排序: C, A, ... (违反C必须在A之后)

Kahn算法过程：
初始入度: A:0, B:1, C:1, D:1, E:2, F:2
队列: [A]
处理A → 更新B:0, D:0 → 队列: [B, D]
处理B → 更新C:0, E:1 → 队列: [D, C]
处理D → 更新E:0 → 队列: [C, E]
处理C → 更新F:1 → 队列: [E, F]
处理E → 更新F:0 → 队列: [F]
处理F → 完成
```

## 连通分量算法

### 无向图连通分量

查找无向图中的连通分量，识别相互连接的顶点集合。

特点：
- 连通性分析：识别图中的独立组件
- DFS/BFS 应用：使用遍历算法标记连通分量
- 网络分析：用于社交网络、图像分割等

```javascript
// 使用DFS查找连通分量
export function connectedComponents(graph) {
  if (graph.directed) {
    throw new Error('连通分量算法适用于无向图');
  }
  
  const visited = new Set();
  const components = [];
  
  for (const vertex of graph.getVertices()) {
    if (!visited.has(vertex)) {
      const component = [];
      dfsComponent(graph, vertex, visited, component);
      components.push(component);
    }
  }
  
  return components;
}

function dfsComponent(graph, vertex, visited, component) {
  visited.add(vertex);
  component.push(vertex);
  
  const neighbors = graph.getNeighbors(vertex);
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor.vertex)) {
      dfsComponent(graph, neighbor.vertex, visited, component);
    }
  }
}

// 使用并查集查找连通分量
export function unionFindComponents(graph) {
  if (graph.directed) {
    throw new Error('连通分量算法适用于无向图');
  }
  
  const unionFind = new UnionFind(graph.getVertices());
  
  // 合并所有边连接的顶点
  for (const vertex of graph.getVertices()) {
    const neighbors = graph.getNeighbors(vertex);
    for (const neighbor of neighbors) {
      unionFind.union(vertex, neighbor.vertex);
    }
  }
  
  // 收集连通分量
  const componentsMap = new Map();
  for (const vertex of graph.getVertices()) {
    const root = unionFind.find(vertex);
    if (!componentsMap.has(root)) {
      componentsMap.set(root, []);
    }
    componentsMap.get(root).push(vertex);
  }
  
  return Array.from(componentsMap.values());
}
```

示意图 (连通分量)：
```
无向图：
A — B   C — D
|   |   |   |
E — F   G — H

连通分量：
组件1: [A, B, E, F] (通过边连接)
组件2: [C, D, G, H] (通过边连接)

DFS过程：
从A开始DFS → 访问A,B,E,F → 组件1完成
从C开始DFS → 访问C,D,G,H → 组件2完成
```

### 强连通分量 (Kosaraju 算法)

查找有向图中的强连通分量，其中任意两顶点相互可达。

特点：
- 有向图分析：识别有向图中的紧密连接组件
- 两次 DFS：使用正向和反向图进行遍历
- 应用广泛：用于编译器优化、电路设计等

```javascript
// Kosaraju算法查找强连通分量
export function kosarajuSCC(graph) {
  if (!graph.directed) {
    throw new Error('强连通分量算法适用于有向图');
  }
  
  const visited = new Set();
  const stack = [];
  
  // 第一次DFS：记录完成时间
  for (const vertex of graph.getVertices()) {
    if (!visited.has(vertex)) {
      dfsFirstPass(graph, vertex, visited, stack);
    }
  }
  
  // 构建反向图
  const reversedGraph = reverseGraph(graph);
  
  // 第二次DFS：按完成时间逆序遍历
  visited.clear();
  const scc = [];
  
  while (stack.length > 0) {
    const vertex = stack.pop();
    if (!visited.has(vertex)) {
      const component = [];
      dfsSecondPass(reversedGraph, vertex, visited, component);
      scc.push(component);
    }
  }
  
  return scc;
}

function dfsFirstPass(graph, vertex, visited, stack) {
  visited.add(vertex);
  
  const neighbors = graph.getNeighbors(vertex);
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor.vertex)) {
      dfsFirstPass(graph, neighbor.vertex, visited, stack);
    }
  }
  
  stack.push(vertex);
}

function dfsSecondPass(graph, vertex, visited, component) {
  visited.add(vertex);
  component.push(vertex);
  
  const neighbors = graph.getNeighbors(vertex);
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor.vertex)) {
      dfsSecondPass(graph, neighbor.vertex, visited, component);
    }
  }
}

function reverseGraph(graph) {
  const reversed = new AdjacencyList(true);
  
  // 添加所有顶点
  for (const vertex of graph.getVertices()) {
    reversed.addVertex(vertex);
  }
  
  // 反转所有边
  for (const vertex of graph.getVertices()) {
    const neighbors = graph.getNeighbors(vertex);
    for (const neighbor of neighbors) {
      reversed.addEdge(neighbor.vertex, vertex, neighbor.weight);
    }
  }
  
  return reversed;
}
```

示意图 (强连通分量)：
```
有向图：
A → B → C → D
↑   ↓   ↑   ↓
E ← F   G → H

强连通分量：
SCC1: [A, E, F, B] (相互可达)
SCC2: [C, G] (相互可达)  
SCC3: [D] (单独顶点)
SCC4: [H] (单独顶点)

Kosaraju过程：
第一次DFS（完成顺序）: D, H, C, G, B, F, E, A
反向图DFS: 
  从A开始 → 找到SCC1: [A, B, E, F]
  从C开始 → 找到SCC2: [C, G] 
  从D开始 → 找到SCC3: [D]
  从H开始 → 找到SCC4: [H]
```