# 可视化工具

## 工具概述

JavaScript 算法可视化工具通过图形化展示算法执行过程，将抽象的计算逻辑转化为直观的视觉表现。这类工具帮助开发者理解算法内在机制、调试复杂逻辑，并为教学和演示提供生动素材。

核心可视化流程：
```
算法输入 → 执行步骤分解 → 图形元素映射 → 动画渲染
                    ↓
           交互控制 ← 状态显示
```

## 核心架构设计

### 可视化引擎基础

```javascript
// 可视化引擎基类
export class AlgorithmVisualizer {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            speed: 1.0,
            autoPlay: false,
            highlightColor: '#ff6b6b',
            compareColor: '#4ecdc4',
            sortedColor: '#45b7d1',
            ...options
        };
        
        this.states = [];
        this.currentStep = 0;
        this.isPlaying = false;
        this.animationFrameId = null;
        
        this.initCanvas();
        this.initControls();
    }

    // 初始化画布
    initCanvas() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 响应式画布
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.container.appendChild(this.canvas);
    }

    // 调整画布尺寸
    resizeCanvas() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.render();
    }

    // 初始化控制界面
    initControls() {
        this.controls = document.createElement('div');
        this.controls.className = 'visualizer-controls';
        this.controls.innerHTML = `
            <button id="play-pause">▶</button>
            <button id="step-back">⏮</button>
            <button id="step-forward">⏭</button>
            <input type="range" id="speed" min="0.1" max="5" step="0.1" value="${this.options.speed}">
            <span id="step-counter">步骤: 0/0</span>
        `;
        
        this.container.appendChild(this.controls);
        this.bindControlEvents();
    }

    // 绑定控制事件
    bindControlEvents() {
        document.getElementById('play-pause').addEventListener('click', () => this.togglePlay());
        document.getElementById('step-back').addEventListener('click', () => this.stepBack());
        document.getElementById('step-forward').addEventListener('click', () => this.stepForward());
        document.getElementById('speed').addEventListener('input', (e) => {
            this.options.speed = parseFloat(e.target.value);
        });
    }

    // 记录算法状态
    recordState(data, highlights = [], metadata = {}) {
        this.states.push({
            data: [...data],
            highlights: [...highlights],
            metadata: { ...metadata, step: this.states.length }
        });
    }

    // 播放控制
    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const button = document.getElementById('play-pause');
        button.textContent = this.isPlaying ? '⏸' : '▶';
        
        if (this.isPlaying) {
            this.play();
        } else {
            this.pause();
        }
    }

    play() {
        const playStep = () => {
            if (this.isPlaying && this.currentStep < this.states.length - 1) {
                this.currentStep++;
                this.render();
                this.updateStepCounter();
                
                const delay = 1000 / this.options.speed;
                this.animationFrameId = setTimeout(playStep, delay);
            } else {
                this.isPlaying = false;
                document.getElementById('play-pause').textContent = '▶';
            }
        };
        
        playStep();
    }

    pause() {
        if (this.animationFrameId) {
            clearTimeout(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    stepForward() {
        if (this.currentStep < this.states.length - 1) {
            this.currentStep++;
            this.render();
            this.updateStepCounter();
        }
    }

    stepBack() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.render();
            this.updateStepCounter();
        }
    }

    updateStepCounter() {
        const counter = document.getElementById('step-counter');
        counter.textContent = `步骤: ${this.currentStep}/${this.states.length - 1}`;
    }

    // 抽象渲染方法 - 由子类实现
    render() {
        throw new Error('render method must be implemented by subclass');
    }
}
```

### 排序算法可视化器

```javascript
// 排序算法可视化器
export class SortingVisualizer extends AlgorithmVisualizer {
    constructor(container, options = {}) {
        super(container, options);
        this.data = [];
        this.maxValue = 1;
    }

    // 初始化数据
    initData(size = 20, dataType = 'random') {
        this.data = [];
        this.states = [];
        this.currentStep = 0;
        
        switch (dataType) {
            case 'random':
                this.data = Array.from({ length: size }, () => 
                    Math.floor(Math.random() * 100) + 1
                );
                break;
            case 'sorted':
                this.data = Array.from({ length: size }, (_, i) => i + 1);
                break;
            case 'reversed':
                this.data = Array.from({ length: size }, (_, i) => size - i);
                break;
            case 'nearly-sorted':
                this.data = Array.from({ length: size }, (_, i) => i + 1);
                // 随机交换几对元素
                for (let i = 0; i < size / 10; i++) {
                    const a = Math.floor(Math.random() * size);
                    const b = Math.floor(Math.random() * size);
                    [this.data[a], this.data[b]] = [this.data[b], this.data[a]];
                }
                break;
        }
        
        this.maxValue = Math.max(...this.data);
        this.recordState(this.data, [], { type: 'initial' });
    }

    // 可视化冒泡排序
    *bubbleSort() {
        const arr = [...this.data];
        const n = arr.length;
        
        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                // 高亮比较的元素
                this.recordState(arr, [j, j + 1], { 
                    type: 'compare', 
                    indices: [j, j + 1] 
                });
                yield;
                
                if (arr[j] > arr[j + 1]) {
                    // 交换元素
                    [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                    this.recordState(arr, [j, j + 1], { 
                        type: 'swap', 
                        indices: [j, j + 1] 
                    });
                    yield;
                }
            }
            // 标记已排序的元素
            this.recordState(arr, [], { 
                type: 'sorted', 
                indices: [n - i - 1, n - 1] 
            });
        }
        
        this.recordState(arr, [], { type: 'complete' });
    }

    // 可视化快速排序
    *quickSort(low = 0, high = this.data.length - 1, arr = [...this.data]) {
        if (low < high) {
            const pivotIndex = yield* this.partition(low, high, arr);
            yield* this.quickSort(low, pivotIndex - 1, arr);
            yield* this.quickSort(pivotIndex + 1, high, arr);
        }
        
        if (low === 0 && high === this.data.length - 1) {
            this.recordState(arr, [], { type: 'complete' });
        }
    }

    *partition(low, high, arr) {
        const pivot = arr[high];
        let i = low - 1;
        
        this.recordState(arr, [high], { type: 'pivot', index: high });
        yield;
        
        for (let j = low; j < high; j++) {
            this.recordState(arr, [j, high], { type: 'compare', indices: [j, high] });
            yield;
            
            if (arr[j] <= pivot) {
                i++;
                [arr[i], arr[j]] = [arr[j], arr[i]];
                this.recordState(arr, [i, j], { type: 'swap', indices: [i, j] });
                yield;
            }
        }
        
        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
        this.recordState(arr, [i + 1, high], { type: 'swap', indices: [i + 1, high] });
        yield;
        
        return i + 1;
    }

    // 渲染排序可视化
    render() {
        const state = this.states[this.currentStep];
        if (!state) return;
        
        const { data, highlights, metadata } = state;
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const barWidth = width / data.length;
        const scale = height / this.maxValue;
        
        // 绘制数据条
        data.forEach((value, index) => {
            const barHeight = value * scale;
            const x = index * barWidth;
            const y = height - barHeight;
            
            // 确定颜色
            let color = '#3498db'; // 默认蓝色
            if (metadata.type === 'complete') {
                color = this.options.sortedColor;
            } else if (highlights.includes(index)) {
                if (metadata.type === 'compare') {
                    color = this.options.compareColor;
                } else if (metadata.type === 'swap') {
                    color = this.options.highlightColor;
                } else if (metadata.type === 'pivot' && metadata.index === index) {
                    color = '#9b59b6'; // 紫色表示枢轴
                }
            }
            
            // 绘制条形
            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth - 1, barHeight);
            
            // 绘制数值标签（如果空间足够）
            if (barWidth > 20) {
                ctx.fillStyle = '#2c3e50';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(value, x + barWidth / 2, y - 5);
            }
        });
        
        // 绘制状态信息
        ctx.fillStyle = '#2c3e50';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`操作: ${this.getOperationText(metadata)}`, 10, 20);
        ctx.fillText(`比较次数: ${this.getComparisonCount()}`, 10, 40);
        ctx.fillText(`交换次数: ${this.getSwapCount()}`, 10, 60);
    }

    getOperationText(metadata) {
        const operations = {
            'initial': '初始化',
            'compare': '比较元素',
            'swap': '交换元素',
            'pivot': '选择枢轴',
            'sorted': '部分排序完成',
            'complete': '排序完成'
        };
        return operations[metadata.type] || metadata.type;
    }

    getComparisonCount() {
        return this.states.slice(0, this.currentStep + 1)
            .filter(state => state.metadata.type === 'compare').length;
    }

    getSwapCount() {
        return this.states.slice(0, this.currentStep + 1)
            .filter(state => state.metadata.type === 'swap').length;
    }
}
```

## 图形渲染技术

### Canvas 高级渲染

```javascript
// 高级 Canvas 渲染器
export class AdvancedRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.animations = new Map();
        this.animationId = 0;
    }

    // 绘制数组条形图
    drawBarChart(data, options = {}) {
        const {
            x = 0,
            y = 0,
            width = this.canvas.width,
            height = this.canvas.height,
            colors = ['#3498db'],
            spacing = 1,
            showValues = true
        } = options;

        const barWidth = (width - (data.length - 1) * spacing) / data.length;
        const maxValue = Math.max(...data);
        const scale = height / maxValue;

        data.forEach((value, index) => {
            const barHeight = value * scale;
            const barX = x + index * (barWidth + spacing);
            const barY = y + height - barHeight;

            // 选择颜色
            const color = Array.isArray(colors) ? 
                colors[index % colors.length] : colors;

            // 绘制条形
            this.ctx.fillStyle = color;
            this.ctx.fillRect(barX, barY, barWidth, barHeight);

            // 绘制边框
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(barX, barY, barWidth, barHeight);

            // 绘制数值
            if (showValues && barWidth > 25) {
                this.ctx.fillStyle = '#2c3e50';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    value.toString(), 
                    barX + barWidth / 2, 
                    barY - 5
                );
            }
        });
    }

    // 绘制树形结构
    drawTree(root, options = {}) {
        const {
            x = this.canvas.width / 2,
            y = 50,
            nodeRadius = 20,
            levelHeight = 80,
            highlightNodes = new Set()
        } = options;

        const drawNode = (node, x, y, level) => {
            // 绘制连接线（先绘制线，再绘制节点）
            if (node.left) {
                const childX = x - (this.canvas.width / Math.pow(2, level + 2));
                const childY = y + levelHeight;
                this.drawLine(x, y + nodeRadius, childX, childY - nodeRadius);
                drawNode(node.left, childX, childY, level + 1);
            }
            if (node.right) {
                const childX = x + (this.canvas.width / Math.pow(2, level + 2));
                const childY = y + levelHeight;
                this.drawLine(x, y + nodeRadius, childX, childY - nodeRadius);
                drawNode(node.right, childX, childY, level + 1);
            }

            // 绘制节点
            const isHighlighted = highlightNodes.has(node.value);
            this.ctx.fillStyle = isHighlighted ? '#e74c3c' : '#3498db';
            this.ctx.beginPath();
            this.ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
            this.ctx.fill();

            // 绘制节点边框
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // 绘制节点值
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.value.toString(), x, y);
        };

        drawNode(root, x, y, 0);
    }

    // 绘制连接线
    drawLine(x1, y1, x2, y2, options = {}) {
        const {
            color = '#95a5a6',
            width = 2,
            dash = []
        } = options;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.setLineDash(dash);
        
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]); // 重置虚线
    }

    // 平滑动画
    animateValue(start, end, duration, updateCallback, easing = 'easeInOut') {
        const startTime = performance.now();
        const animationId = this.animationId++;
        
        const easingFunctions = {
            linear: t => t,
            easeIn: t => t * t,
            easeOut: t => t * (2 - t),
            easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        };
        
        const ease = easingFunctions[easing] || easingFunctions.easeInOut;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = ease(progress);
            
            const currentValue = start + (end - start) * easedProgress;
            updateCallback(currentValue);
            
            if (progress < 1) {
                this.animations.set(animationId, requestAnimationFrame(animate));
            } else {
                this.animations.delete(animationId);
            }
        };
        
        this.animations.set(animationId, requestAnimationFrame(animate));
        return animationId;
    }

    // 停止所有动画
    stopAllAnimations() {
        this.animations.forEach(animationId => {
            cancelAnimationFrame(animationId);
        });
        this.animations.clear();
    }
}
```

### 图算法可视化

```javascript
// 图算法可视化器
export class GraphVisualizer extends AlgorithmVisualizer {
    constructor(container, options = {}) {
        super(container, {
            nodeRadius: 20,
            nodeColor: '#3498db',
            edgeColor: '#bdc3c7',
            visitedColor: '#e74c3c',
            pathColor: '#2ecc71',
            ...options
        });
        
        this.graph = {
            nodes: new Map(),
            edges: new Map()
        };
        this.layout = new ForceDirectedLayout();
    }

    // 添加节点
    addNode(id, data = {}) {
        this.graph.nodes.set(id, {
            id,
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            ...data
        });
    }

    // 添加边
    addEdge(from, to, weight = 1) {
        const edgeId = `${from}-${to}`;
        this.graph.edges.set(edgeId, { from, to, weight });
    }

    // 可视化 BFS
    *bfs(startNode) {
        const visited = new Set();
        const queue = [startNode];
        visited.add(startNode);
        
        this.recordState({ current: startNode, visited: new Set(visited) });
        yield;
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            // 获取邻居节点
            const neighbors = this.getNeighbors(current);
            
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                    
                    this.recordState({ 
                        current: neighbor, 
                        visited: new Set(visited),
                        processing: current 
                    });
                    yield;
                }
            }
        }
        
        this.recordState({ visited: new Set(visited), complete: true });
    }

    // 可视化 Dijkstra 算法
    *dijkstra(startNode) {
        const distances = new Map();
        const visited = new Set();
        const previous = new Map();
        
        // 初始化距离
        for (const nodeId of this.graph.nodes.keys()) {
            distances.set(nodeId, nodeId === startNode ? 0 : Infinity);
        }
        
        while (visited.size < this.graph.nodes.size) {
            // 找到未访问的最小距离节点
            let current = null;
            let minDistance = Infinity;
            
            for (const [nodeId, distance] of distances) {
                if (!visited.has(nodeId) && distance < minDistance) {
                    minDistance = distance;
                    current = nodeId;
                }
            }
            
            if (current === null) break;
            
            visited.add(current);
            
            this.recordState({
                current,
                visited: new Set(visited),
                distances: new Map(distances),
                previous: new Map(previous)
            });
            yield;
            
            // 更新邻居距离
            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    const edge = this.graph.edges.get(`${current}-${neighbor}`) || 
                                this.graph.edges.get(`${neighbor}-${current}`);
                    const newDistance = distances.get(current) + edge.weight;
                    
                    if (newDistance < distances.get(neighbor)) {
                        distances.set(neighbor, newDistance);
                        previous.set(neighbor, current);
                        
                        this.recordState({
                            current: neighbor,
                            visited: new Set(visited),
                            distances: new Map(distances),
                            previous: new Map(previous),
                            updated: true
                        });
                        yield;
                    }
                }
            }
        }
        
        this.recordState({ complete: true, distances, previous });
    }

    getNeighbors(nodeId) {
        const neighbors = new Set();
        
        for (const [edgeId, edge] of this.graph.edges) {
            if (edge.from === nodeId) neighbors.add(edge.to);
            if (edge.to === nodeId) neighbors.add(edge.from);
        }
        
        return Array.from(neighbors);
    }

    // 渲染图
    render() {
        const state = this.states[this.currentStep] || {};
        const ctx = this.ctx;
        
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制边
        for (const [edgeId, edge] of this.graph.edges) {
            const fromNode = this.graph.nodes.get(edge.from);
            const toNode = this.graph.nodes.get(edge.to);
            
            if (fromNode && toNode) {
                this.drawEdge(fromNode, toNode, edge, state);
            }
        }
        
        // 绘制节点
        for (const [nodeId, node] of this.graph.nodes) {
            this.drawNode(node, state);
        }
    }

    drawEdge(fromNode, toNode, edge, state) {
        const ctx = this.ctx;
        
        // 确定边颜色
        let color = this.options.edgeColor;
        if (state.complete) {
            color = this.options.pathColor;
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
        
        // 绘制权重
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        
        ctx.fillStyle = 'white';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(midX, midY, 12, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#2c3e50';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(edge.weight.toString(), midX, midY);
    }

    drawNode(node, state) {
        const ctx = this.ctx;
        
        // 确定节点颜色
        let color = this.options.nodeColor;
        if (state.visited && state.visited.has(node.id)) {
            color = this.options.visitedColor;
        }
        if (state.current === node.id) {
            color = '#f39c12'; // 当前节点用橙色
        }
        if (state.complete) {
            color = this.options.pathColor;
        }
        
        // 绘制节点
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, this.options.nodeRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制节点边框
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制节点标签
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.id, node.x, node.y);
        
        // 显示距离（如果存在）
        if (state.distances && state.distances.has(node.id)) {
            const distance = state.distances.get(node.id);
            if (distance !== Infinity) {
                ctx.fillStyle = '#2c3e50';
                ctx.font = '10px Arial';
                ctx.fillText(
                    distance.toString(), 
                    node.x, 
                    node.y + this.options.nodeRadius + 15
                );
            }
        }
    }
}

// 力导向布局
class ForceDirectedLayout {
    constructor() {
        this.springLength = 100;
        this.springStrength = 0.1;
        this.repulsionStrength = 1000;
    }
    
    updatePositions(nodes, edges, width, height) {
        // 简化的力导向布局实现
        // 实际实现会更复杂，包含斥力和引力的计算
        for (const [_, node] of nodes) {
            // 添加随机扰动避免重叠
            node.x += (Math.random() - 0.5) * 2;
            node.y += (Math.random() - 0.5) * 2;
            
            // 边界检查
            node.x = Math.max(50, Math.min(width - 50, node.x));
            node.y = Math.max(50, Math.min(height - 50, node.y));
        }
    }
}
```

## 交互功能增强

### 用户交互处理器

```javascript
// 交互处理器
export class InteractionHandler {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.isDragging = false;
        this.draggedNode = null;
        this.dragOffset = { x: 0, y: 0 };
        
        this.bindEvents();
    }

    bindEvents() {
        const canvas = this.visualizer.canvas;
        
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', () => this.onMouseUp());
        canvas.addEventListener('wheel', (e) => this.onWheel(e));
        
        // 触摸事件支持
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        canvas.addEventListener('touchend', () => this.onTouchEnd());
    }

    onMouseDown(e) {
        const rect = this.visualizer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 检查是否点击了节点
        if (this.visualizer.graph) {
            this.draggedNode = this.findNodeAt(x, y);
            if (this.draggedNode) {
                this.isDragging = true;
                this.dragOffset.x = x - this.draggedNode.x;
                this.dragOffset.y = y - this.draggedNode.y;
                e.preventDefault();
            }
        }
    }

    onMouseMove(e) {
        if (this.isDragging && this.draggedNode) {
            const rect = this.visualizer.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.draggedNode.x = x - this.dragOffset.x;
            this.draggedNode.y = y - this.dragOffset.y;
            
            this.visualizer.render();
        }
    }

    onMouseUp() {
        this.isDragging = false;
        this.draggedNode = null;
    }

    onWheel(e) {
        e.preventDefault();
        
        // 缩放功能
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);
        
        // 更新可视化器的缩放级别
        if (this.visualizer.scale) {
            this.visualizer.scale *= zoom;
            this.visualizer.render();
        }
    }

    onTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.visualizer.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            this.draggedNode = this.findNodeAt(x, y);
            if (this.draggedNode) {
                this.isDragging = true;
                this.dragOffset.x = x - this.draggedNode.x;
                this.dragOffset.y = y - this.draggedNode.y;
            }
        }
    }

    onTouchMove(e) {
        if (this.isDragging && this.draggedNode && e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.visualizer.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            this.draggedNode.x = x - this.dragOffset.x;
            this.draggedNode.y = y - this.dragOffset.y;
            
            this.visualizer.render();
        }
    }

    onTouchEnd() {
        this.isDragging = false;
        this.draggedNode = null;
    }

    findNodeAt(x, y) {
        if (!this.visualizer.graph) return null;
        
        for (const [_, node] of this.visualizer.graph.nodes) {
            const distance = Math.sqrt(
                Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2)
            );
            
            if (distance <= this.visualizer.options.nodeRadius) {
                return node;
            }
        }
        
        return null;
    }
}
```

### 数据导入导出

```javascript
// 数据管理器
export class DataManager {
    constructor(visualizer) {
        this.visualizer = visualizer;
    }

    // 导出当前状态为 JSON
    exportState() {
        const state = {
            algorithm: this.visualizer.constructor.name,
            data: this.visualizer.data || [],
            states: this.visualizer.states,
            currentStep: this.visualizer.currentStep,
            options: this.visualizer.options,
            timestamp: new Date().toISOString()
        };

        if (this.visualizer.graph) {
            state.graph = {
                nodes: Array.from(this.visualizer.graph.nodes.entries()),
                edges: Array.from(this.visualizer.graph.edges.entries())
            };
        }

        return JSON.stringify(state, null, 2);
    }

    // 从 JSON 导入状态
    importState(jsonString) {
        try {
            const state = JSON.parse(jsonString);
            
            this.visualizer.data = state.data || [];
            this.visualizer.states = state.states || [];
            this.visualizer.currentStep = state.currentStep || 0;
            this.visualizer.options = { ...this.visualizer.options, ...state.options };
            
            if (state.graph && this.visualizer.graph) {
                this.visualizer.graph.nodes = new Map(state.graph.nodes);
                this.visualizer.graph.edges = new Map(state.graph.edges);
            }
            
            this.visualizer.render();
            return true;
        } catch (error) {
            console.error('导入状态失败:', error);
            return false;
        }
    }

    // 生成测试数据
    generateTestData(type, size) {
        switch (type) {
            case 'sorting':
                return this.generateSortingData(size);
            case 'graph':
                return this.generateGraphData(size);
            case 'tree':
                return this.generateTreeData(size);
            default:
                return [];
        }
    }

    generateSortingData(size) {
        return Array.from({ length: size }, () => 
            Math.floor(Math.random() * 100) + 1
        );
    }

    generateGraphData(nodeCount) {
        const nodes = new Map();
        const edges = new Map();
        
        // 创建节点
        for (let i = 0; i < nodeCount; i++) {
            nodes.set(`Node${i}`, {
                id: `Node${i}`,
                x: Math.random() * 600 + 50,
                y: Math.random() * 400 + 50
            });
        }
        
        // 创建随机边
        const nodeArray = Array.from(nodes.keys());
        for (let i = 0; i < nodeCount * 1.5; i++) {
            const from = nodeArray[Math.floor(Math.random() * nodeArray.length)];
            const to = nodeArray[Math.floor(Math.random() * nodeArray.length)];
            
            if (from !== to) {
                const edgeId = `${from}-${to}`;
                const reverseEdgeId = `${to}-${from}`;
                
                if (!edges.has(edgeId) && !edges.has(reverseEdgeId)) {
                    edges.set(edgeId, {
                        from,
                        to,
                        weight: Math.floor(Math.random() * 10) + 1
                    });
                }
            }
        }
        
        return { nodes, edges };
    }

    generateTreeData(level) {
        // 生成平衡二叉树数据
        const generateSubtree = (value, depth) => {
            if (depth <= 0) return null;
            
            return {
                value,
                left: generateSubtree(value * 2, depth - 1),
                right: generateSubtree(value * 2 + 1, depth - 1)
            };
        };
        
        return generateSubtree(1, level);
    }
}
```