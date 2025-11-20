# 机器学习算法

## 什么是机器学习算法

机器学习算法是让计算机从数据中学习模式并做出预测或决策的计算方法。它通过分析训练数据自动改进性能，而无需显式编程。机器学习是现代人工智能的核心技术，广泛应用于推荐系统、图像识别、自然语言处理等领域。

特点：
- 数据驱动：从数据中自动学习规律
- 泛化能力：在未见过的数据上做出准确预测
- 自适应：随着新数据的加入不断改进模型
- 模式发现：自动发现数据中的复杂模式

示意图 (机器学习流程)：
```
训练数据 → [机器学习算法] → 训练模型 → 新数据 → 预测结果
              ↑
          参数优化
```

## 机器学习算法分类

### 监督学习

从带有标签的训练数据中学习映射关系，用于预测新数据的标签。

特点：
- 标签数据：训练数据包含输入和对应的输出标签
- 预测任务：分类 (离散输出) 或回归 (连续输出)
- 性能评估：通过测试集准确率、均方误差等指标评估

```javascript
// 监督学习基类
export class SupervisedLearning {
  constructor() {
    this.isTrained = false;
    this.trainingHistory = [];
  }

  // 训练模型 - 子类必须实现
  train(features, labels) {
    throw new Error('train method must be implemented');
  }

  // 预测 - 子类必须实现
  predict(features) {
    throw new Error('predict method must be implemented');
  }

  // 评估模型性能
  evaluate(testFeatures, testLabels, metric = 'accuracy') {
    const predictions = this.predict(testFeatures);
    
    switch (metric) {
      case 'accuracy':
        return this.calculateAccuracy(predictions, testLabels);
      case 'mse':
        return this.calculateMSE(predictions, testLabels);
      case 'mae':
        return this.calculateMAE(predictions, testLabels);
      default:
        throw new Error(`Unsupported metric: ${metric}`);
    }
  }

  calculateAccuracy(predictions, labels) {
    let correct = 0;
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] === labels[i]) correct++;
    }
    return correct / predictions.length;
  }

  calculateMSE(predictions, labels) {
    let sum = 0;
    for (let i = 0; i < predictions.length; i++) {
      sum += Math.pow(predictions[i] - labels[i], 2);
    }
    return sum / predictions.length;
  }

  calculateMAE(predictions, labels) {
    let sum = 0;
    for (let i = 0; i < predictions.length; i++) {
      sum += Math.abs(predictions[i] - labels[i]);
    }
    return sum / predictions.length;
  }
}
```

### 无监督学习

从无标签数据中发现内在结构和模式，用于聚类、降维等任务。

特点：
- 无标签数据：训练数据只有输入没有输出标签
- 结构发现：自动发现数据中的分组或降维表示
- 探索性分析：用于数据探索和预处理

```javascript
// 无监督学习基类
export class UnsupervisedLearning {
  constructor() {
    this.isTrained = false;
  }

  // 拟合数据 - 子类必须实现
  fit(data) {
    throw new Error('fit method must be implemented');
  }

  // 转换数据 - 子类必须实现
  transform(data) {
    throw new Error('transform method must be implemented');
  }

  // 拟合并转换
  fitTransform(data) {
    this.fit(data);
    return this.transform(data);
  }
}
```

示意图 (机器学习分类)：
```
机器学习算法
├── 监督学习
│   ├── 分类
│   │   ├── 逻辑回归
│   │   ├── 决策树
│   │   ├── 支持向量机
│   │   └── 随机森林
│   └── 回归
│       ├── 线性回归
│       ├── 多项式回归
│       └── 回归树
├── 无监督学习
│   ├── 聚类
│   │   ├── K均值
│   │   ├── 层次聚类
│   │   └── DBSCAN
│   └── 降维
│       ├── PCA
│       ├── t-SNE
│       └── 自编码器
└── 强化学习
    ├── Q学习
    ├── 策略梯度
    └── 深度强化学习
```

## 监督学习算法

### 线性回归

通过线性方程拟合数据，预测连续数值输出。

特点：
- 线性关系：假设特征和目标变量呈线性关系
- 最小二乘：通过最小化残差平方和求解参数
- 解释性强：模型参数有明确的统计意义

```javascript
// 线性回归实现
export class LinearRegression extends SupervisedLearning {
  constructor(learningRate = 0.01, iterations = 1000) {
    super();
    this.learningRate = learningRate;
    this.iterations = iterations;
    this.weights = null;
    this.bias = 0;
    this.lossHistory = [];
  }

  // 添加偏置项
  addBiasTerm(features) {
    return features.map(row => [1, ...row]); // 第一列为1，对应偏置
  }

  // 训练模型 - 梯度下降
  train(features, labels) {
    const n = features.length;
    const m = features[0].length;
    
    // 初始化参数
    this.weights = new Array(m).fill(0);
    this.bias = 0;
    this.lossHistory = [];

    // 梯度下降
    for (let iter = 0; iter < this.iterations; iter++) {
      let totalLoss = 0;
      const weightGradients = new Array(m).fill(0);
      let biasGradient = 0;

      // 计算梯度和损失
      for (let i = 0; i < n; i++) {
        const prediction = this.predictSingle(features[i]);
        const error = prediction - labels[i];
        
        totalLoss += error * error;

        // 计算梯度
        for (let j = 0; j < m; j++) {
          weightGradients[j] += error * features[i][j];
        }
        biasGradient += error;
      }

      // 更新参数
      for (let j = 0; j < m; j++) {
        this.weights[j] -= this.learningRate * weightGradients[j] / n;
      }
      this.bias -= this.learningRate * biasGradient / n;

      // 记录损失
      const avgLoss = totalLoss / n;
      this.lossHistory.push(avgLoss);

      // 早期停止检查
      if (iter > 0 && Math.abs(this.lossHistory[iter] - this.lossHistory[iter - 1]) < 1e-6) {
        break;
      }
    }

    this.isTrained = true;
    return this;
  }

  // 单个预测
  predictSingle(feature) {
    if (!this.isTrained) throw new Error('Model not trained');
    
    let prediction = this.bias;
    for (let j = 0; j < feature.length; j++) {
      prediction += this.weights[j] * feature[j];
    }
    return prediction;
  }

  // 批量预测
  predict(features) {
    return features.map(feature => this.predictSingle(feature));
  }

  // 计算R²分数
  score(features, labels) {
    const predictions = this.predict(features);
    const meanLabel = labels.reduce((sum, label) => sum + label, 0) / labels.length;
    
    let totalSumSquares = 0;
    let residualSumSquares = 0;
    
    for (let i = 0; i < labels.length; i++) {
      totalSumSquares += Math.pow(labels[i] - meanLabel, 2);
      residualSumSquares += Math.pow(labels[i] - predictions[i], 2);
    }
    
    return 1 - (residualSumSquares / totalSumSquares);
  }
}

// 多项式回归
export class PolynomialRegression extends LinearRegression {
  constructor(degree = 2, learningRate = 0.01, iterations = 1000) {
    super(learningRate, iterations);
    this.degree = degree;
  }

  // 生成多项式特征
  generatePolynomialFeatures(features) {
    return features.map(featureRow => {
      const polyFeatures = [];
      
      for (let d = 1; d <= this.degree; d++) {
        for (let i = 0; i < featureRow.length; i++) {
          polyFeatures.push(Math.pow(featureRow[i], d));
        }
      }
      
      return polyFeatures;
    });
  }

  train(features, labels) {
    const polyFeatures = this.generatePolynomialFeatures(features);
    return super.train(polyFeatures, labels);
  }

  predict(features) {
    const polyFeatures = this.generatePolynomialFeatures(features);
    return super.predict(polyFeatures);
  }
}
```

示意图 (线性回归拟合)：
```
数据点分布:
(1, 2), (2, 4), (3, 5), (4, 4), (5, 6)

线性回归拟合:
y = w*x + b

梯度下降过程:
迭代1: w=0, b=0 → 损失=15.4
迭代2: w=0.8, b=0.16 → 损失=8.2
迭代3: w=1.2, b=0.48 → 损失=3.1
...
迭代100: w=0.95, b=1.2 → 损失=0.85

最终模型: y = 0.95*x + 1.2
R²分数: 0.89
```

### 逻辑回归

用于二分类问题的线性模型，通过 sigmoid 函数输出概率。

特点：
- 概率输出：输出属于正类的概率
- 线性决策边界：在特征空间中创建线性分隔
- 最大似然估计：通过最大化似然函数求解参数

```javascript
// 逻辑回归实现
export class LogisticRegression extends SupervisedLearning {
  constructor(learningRate = 0.01, iterations = 1000, regularization = 0) {
    super();
    this.learningRate = learningRate;
    this.iterations = iterations;
    this.regularization = regularization;
    this.weights = null;
    this.bias = 0;
    this.lossHistory = [];
  }

  // Sigmoid函数
  sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
  }

  // 计算损失函数（对数损失）
  computeLoss(predictions, labels) {
    let loss = 0;
    const n = labels.length;
    
    for (let i = 0; i < n; i++) {
      const y = labels[i];
      const p = predictions[i];
      loss += y * Math.log(p) + (1 - y) * Math.log(1 - p);
    }
    
    // 添加正则化项
    if (this.regularization > 0) {
      const regTerm = this.weights.reduce((sum, w) => sum + w * w, 0);
      loss -= this.regularization * regTerm;
    }
    
    return -loss / n;
  }

  // 训练模型
  train(features, labels) {
    const n = features.length;
    const m = features[0].length;
    
    // 初始化参数
    this.weights = new Array(m).fill(0);
    this.bias = 0;
    this.lossHistory = [];

    // 梯度下降
    for (let iter = 0; iter < this.iterations; iter++) {
      const weightGradients = new Array(m).fill(0);
      let biasGradient = 0;
      const predictions = [];

      // 前向传播和梯度计算
      for (let i = 0; i < n; i++) {
        const z = this.bias + this.weights.reduce((sum, w, j) => sum + w * features[i][j], 0);
        const prediction = this.sigmoid(z);
        predictions.push(prediction);
        
        const error = prediction - labels[i];
        
        // 计算梯度
        for (let j = 0; j < m; j++) {
          weightGradients[j] += error * features[i][j];
        }
        biasGradient += error;
      }

      // 更新参数（带正则化）
      for (let j = 0; j < m; j++) {
        const regTerm = this.regularization * this.weights[j];
        this.weights[j] -= this.learningRate * (weightGradients[j] / n + regTerm);
      }
      this.bias -= this.learningRate * biasGradient / n;

      // 记录损失
      const loss = this.computeLoss(predictions, labels);
      this.lossHistory.push(loss);

      // 早期停止检查
      if (iter > 0 && Math.abs(this.lossHistory[iter] - this.lossHistory[iter - 1]) < 1e-6) {
        break;
      }
    }

    this.isTrained = true;
    return this;
  }

  // 预测概率
  predictProbability(features) {
    if (!this.isTrained) throw new Error('Model not trained');
    
    return features.map(feature => {
      const z = this.bias + this.weights.reduce((sum, w, j) => sum + w * feature[j], 0);
      return this.sigmoid(z);
    });
  }

  // 预测类别
  predict(features, threshold = 0.5) {
    const probabilities = this.predictProbability(features);
    return probabilities.map(p => p >= threshold ? 1 : 0);
  }

  // 计算准确率、精确率、召回率等指标
  evaluateDetailed(testFeatures, testLabels, threshold = 0.5) {
    const predictions = this.predict(testFeatures, threshold);
    let truePositives = 0, falsePositives = 0, trueNegatives = 0, falseNegatives = 0;
    
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] === 1 && testLabels[i] === 1) truePositives++;
      else if (predictions[i] === 1 && testLabels[i] === 0) falsePositives++;
      else if (predictions[i] === 0 && testLabels[i] === 0) trueNegatives++;
      else if (predictions[i] === 0 && testLabels[i] === 1) falseNegatives++;
    }
    
    const accuracy = (truePositives + trueNegatives) / predictions.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1 = 2 * (precision * recall) / (precision + recall) || 0;
    
    return {
      accuracy,
      precision,
      recall,
      f1,
      confusionMatrix: {
        truePositives,
        falsePositives,
        trueNegatives,
        falseNegatives
      }
    };
  }
}
```

示意图 (逻辑回归决策边界)：
```
二分类数据:
特征X1: [1,2,3,4,5,6,7,8]
特征X2: [1,1,2,2,3,3,4,4]
标签Y:  [0,0,0,0,1,1,1,1]

逻辑回归训练:
初始化: w1=0, w2=0, b=0
迭代过程:
计算概率: P(y=1) = σ(w1*x1 + w2*x2 + b)
更新参数使P(y=1)接近真实标签

最终模型:
w1=1.2, w2=-0.8, b=-3.5
决策边界: 1.2*x1 - 0.8*x2 - 3.5 = 0

分类结果:
x1=1,x2=1 → z=-3.1 → P=0.04 → 预测0 ✓
x1=8,x2=4 → z=4.1 → P=0.98 → 预测1 ✓
```

### 决策树

通过树形结构进行决策，易于理解和解释。

特点：
- 可解释性强：决策过程清晰可见
- 非参数方法：不对数据分布做假设
- 特征重要性：自动评估特征重要性

```javascript
// 决策树节点
class TreeNode {
  constructor() {
    this.featureIndex = null;
    this.threshold = null;
    this.left = null;
    this.right = null;
    this.value = null; // 叶节点的预测值
    this.isLeaf = false;
  }
}

// 决策树实现
export class DecisionTree extends SupervisedLearning {
  constructor(maxDepth = 10, minSamplesSplit = 2, minSamplesLeaf = 1) {
    super();
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
    this.minSamplesLeaf = minSamplesLeaf;
    this.root = null;
    this.featureImportance = null;
  }

  // 计算基尼不纯度（用于分类）
  giniImpurity(labels) {
    const counts = {};
    labels.forEach(label => {
      counts[label] = (counts[label] || 0) + 1;
    });
    
    let impurity = 1;
    Object.values(counts).forEach(count => {
      const probability = count / labels.length;
      impurity -= probability * probability;
    });
    
    return impurity;
  }

  // 计算方差（用于回归）
  variance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  // 寻找最佳分割点
  findBestSplit(features, labels, isRegression = false) {
    const m = features[0].length;
    const n = features.length;
    let bestGain = -Infinity;
    let bestFeature = null;
    let bestThreshold = null;
    
    // 当前节点的基尼不纯度或方差
    const currentImpurity = isRegression ? 
      this.variance(labels) : this.giniImpurity(labels);
    
    // 遍历所有特征
    for (let featureIdx = 0; featureIdx < m; featureIdx++) {
      // 获取该特征的所有唯一值作为候选阈值
      const featureValues = features.map(row => row[featureIdx]);
      const uniqueValues = [...new Set(featureValues)].sort((a, b) => a - b);
      
      // 遍历所有候选阈值
      for (const threshold of uniqueValues) {
        const leftIndices = [];
        const rightIndices = [];
        
        // 根据阈值分割数据
        for (let i = 0; i < n; i++) {
          if (features[i][featureIdx] <= threshold) {
            leftIndices.push(i);
          } else {
            rightIndices.push(i);
          }
        }
        
        // 检查分割是否有效
        if (leftIndices.length < this.minSamplesLeaf || rightIndices.length < this.minSamplesLeaf) {
          continue;
        }
        
        // 计算左右子集的不纯度
        const leftLabels = leftIndices.map(i => labels[i]);
        const rightLabels = rightIndices.map(i => labels[i]);
        
        const leftImpurity = isRegression ? 
          this.variance(leftLabels) : this.giniImpurity(leftLabels);
        const rightImpurity = isRegression ? 
          this.variance(rightLabels) : this.giniImpurity(rightLabels);
        
        // 计算信息增益
        const leftWeight = leftIndices.length / n;
        const rightWeight = rightIndices.length / n;
        const gain = currentImpurity - (leftWeight * leftImpurity + rightWeight * rightImpurity);
        
        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = featureIdx;
          bestThreshold = threshold;
        }
      }
    }
    
    return { bestFeature, bestThreshold, bestGain };
  }

  // 构建决策树
  buildTree(features, labels, depth = 0, isRegression = false) {
    const node = new TreeNode();
    
    // 终止条件
    if (depth >= this.maxDepth || 
        features.length < this.minSamplesSplit ||
        (isRegression ? this.variance(labels) === 0 : this.giniImpurity(labels) === 0)) {
      node.isLeaf = true;
      node.value = isRegression ? 
        labels.reduce((sum, val) => sum + val, 0) / labels.length : // 均值
        this.mostCommonLabel(labels); // 众数
      return node;
    }
    
    // 寻找最佳分割
    const { bestFeature, bestThreshold, bestGain } = this.findBestSplit(features, labels, isRegression);
    
    if (bestGain <= 0) {
      node.isLeaf = true;
      node.value = isRegression ? 
        labels.reduce((sum, val) => sum + val, 0) / labels.length :
        this.mostCommonLabel(labels);
      return node;
    }
    
    // 分割数据
    const leftFeatures = [];
    const leftLabels = [];
    const rightFeatures = [];
    const rightLabels = [];
    
    for (let i = 0; i < features.length; i++) {
      if (features[i][bestFeature] <= bestThreshold) {
        leftFeatures.push(features[i]);
        leftLabels.push(labels[i]);
      } else {
        rightFeatures.push(features[i]);
        rightLabels.push(labels[i]);
      }
    }
    
    // 递归构建子树
    node.featureIndex = bestFeature;
    node.threshold = bestThreshold;
    node.left = this.buildTree(leftFeatures, leftLabels, depth + 1, isRegression);
    node.right = this.buildTree(rightFeatures, rightLabels, depth + 1, isRegression);
    
    return node;
  }

  // 找到最常见的标签
  mostCommonLabel(labels) {
    const counts = {};
    labels.forEach(label => {
      counts[label] = (counts[label] || 0) + 1;
    });
    
    return Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

  // 训练分类树
  train(features, labels) {
    this.root = this.buildTree(features, labels, 0, false);
    this.isTrained = true;
    return this;
  }

  // 预测单个样本
  predictSingle(feature, node = this.root) {
    if (node.isLeaf) {
      return node.value;
    }
    
    if (feature[node.featureIndex] <= node.threshold) {
      return this.predictSingle(feature, node.left);
    } else {
      return this.predictSingle(feature, node.right);
    }
  }

  // 批量预测
  predict(features) {
    if (!this.isTrained) throw new Error('Model not trained');
    return features.map(feature => this.predictSingle(feature));
  }
}

// 回归树
export class RegressionTree extends DecisionTree {
  constructor(maxDepth = 10, minSamplesSplit = 2, minSamplesLeaf = 1) {
    super(maxDepth, minSamplesSplit, minSamplesLeaf);
  }

  train(features, labels) {
    this.root = this.buildTree(features, labels, 0, true);
    this.isTrained = true;
    return this;
  }
}
```

示意图 (决策树构建过程)：
```
数据:
[年龄, 收入, 购买]
[25, 30000, 否]
[35, 60000, 是]  
[45, 80000, 是]
[20, 20000, 否]
[55, 100000, 是]

构建决策树:
根节点: 检查所有特征和阈值
- 按年龄<=30分割: 基尼=0.48
- 按收入<=50000分割: 基尼=0.32 ← 最佳

根节点: 收入<=50000
├── 左子节点(收入<=50000): [25,30000,否], [20,20000,否] → 纯节点(否)
└── 右子节点(收入>50000): [35,60000,是], [45,80000,是], [55,100000,是] → 纯节点(是)

最终树:
收入<=50000? 
├── 是 → 预测"否"
└── 否 → 预测"是"
```

## 无监督学习算法

### K 均值聚类

将数据划分为 K 个簇，使簇内数据点尽可能相似。

特点：
- 簇中心：每个簇用质心表示
- 距离度量：通常使用欧氏距离
- 迭代优化：通过交替分配和更新步骤收敛

```javascript
// K均值聚类实现
export class KMeans extends UnsupervisedLearning {
  constructor(k = 3, maxIterations = 100, tolerance = 1e-4) {
    super();
    this.k = k;
    this.maxIterations = maxIterations;
    this.tolerance = tolerance;
    this.centroids = null;
    this.labels = null;
    this.inertia = null; // 簇内平方和
  }

  // 初始化质心
  initializeCentroids(data) {
    const n = data.length;
    const centroids = [];
    
    // 随机选择K个数据点作为初始质心
    const indices = new Set();
    while (indices.size < this.k) {
      indices.add(Math.floor(Math.random() * n));
    }
    
    Array.from(indices).forEach(index => {
      centroids.push([...data[index]]);
    });
    
    return centroids;
  }

  // 计算欧氏距离
  euclideanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
  }

  // 分配数据点到最近的质心
  assignClusters(data, centroids) {
    const labels = [];
    let totalDistance = 0;
    
    for (let i = 0; i < data.length; i++) {
      let minDistance = Infinity;
      let bestCluster = -1;
      
      for (let j = 0; j < centroids.length; j++) {
        const distance = this.euclideanDistance(data[i], centroids[j]);
        if (distance < minDistance) {
          minDistance = distance;
          bestCluster = j;
        }
      }
      
      labels.push(bestCluster);
      totalDistance += minDistance;
    }
    
    return { labels, totalDistance };
  }

  // 更新质心位置
  updateCentroids(data, labels) {
    const newCentroids = Array(this.k).fill().map(() => new Array(data[0].length).fill(0));
    const clusterSizes = new Array(this.k).fill(0);
    
    // 累加每个簇的数据点
    for (let i = 0; i < data.length; i++) {
      const cluster = labels[i];
      clusterSizes[cluster]++;
      
      for (let j = 0; j < data[i].length; j++) {
        newCentroids[cluster][j] += data[i][j];
      }
    }
    
    // 计算平均值
    for (let i = 0; i < this.k; i++) {
      if (clusterSizes[i] > 0) {
        for (let j = 0; j < newCentroids[i].length; j++) {
          newCentroids[i][j] /= clusterSizes[i];
        }
      }
    }
    
    return newCentroids;
  }

  // 拟合数据
  fit(data) {
    const n = data.length;
    if (n < this.k) {
      throw new Error('Number of data points must be >= k');
    }
    
    // 初始化
    this.centroids = this.initializeCentroids(data);
    let previousDistance = Infinity;
    
    // 迭代优化
    for (let iter = 0; iter < this.maxIterations; iter++) {
      // 分配簇
      const { labels, totalDistance } = this.assignClusters(data, this.centroids);
      this.labels = labels;
      this.inertia = totalDistance;
      
      // 检查收敛
      if (Math.abs(previousDistance - totalDistance) < this.tolerance) {
        break;
      }
      
      previousDistance = totalDistance;
      
      // 更新质心
      this.centroids = this.updateCentroids(data, labels);
    }
    
    this.isTrained = true;
    return this;
  }

  // 预测新数据点的簇
  predict(data) {
    if (!this.isTrained) throw new Error('Model not trained');
    
    const { labels } = this.assignClusters(data, this.centroids);
    return labels;
  }

  // 计算轮廓系数
  silhouetteScore(data) {
    if (!this.isTrained) throw new Error('Model not trained');
    
    let totalScore = 0;
    
    for (let i = 0; i < data.length; i++) {
      const currentCluster = this.labels[i];
      
      // 计算a(i)：与同簇其他点的平均距离
      let a = 0;
      let sameClusterCount = 0;
      
      for (let j = 0; j < data.length; j++) {
        if (i !== j && this.labels[j] === currentCluster) {
          a += this.euclideanDistance(data[i], data[j]);
          sameClusterCount++;
        }
      }
      a = sameClusterCount > 0 ? a / sameClusterCount : 0;
      
      // 计算b(i)：与最近其他簇的平均距离
      let b = Infinity;
      
      for (let cluster = 0; cluster < this.k; cluster++) {
        if (cluster === currentCluster) continue;
        
        let clusterDistance = 0;
        let clusterCount = 0;
        
        for (let j = 0; j < data.length; j++) {
          if (this.labels[j] === cluster) {
            clusterDistance += this.euclideanDistance(data[i], data[j]);
            clusterCount++;
          }
        }
        
        const avgClusterDistance = clusterCount > 0 ? clusterDistance / clusterCount : Infinity;
        if (avgClusterDistance < b) {
          b = avgClusterDistance;
        }
      }
      
      // 计算轮廓系数
      const s = (b - a) / Math.max(a, b);
      totalScore += s;
    }
    
    return totalScore / data.length;
  }
}
```

示意图 (K 均值聚类过程)：
```
数据点:
A(1,1), B(1,2), C(2,1), D(8,8), E(8,9), F(9,8)

K=2聚类:
初始化: 随机选择A、D作为质心

迭代1:
分配簇:
  距离质心A: A:0, B:1, C:1, D:9.9, E:10.6, F:10.6
  距离质心D: A:9.9, B:10.6, C:10.6, D:0, E:1, F:1
簇分配: [A,B,C] → 簇0, [D,E,F] → 簇1

更新质心:
簇0质心: ((1+1+2)/3, (1+2+1)/3) = (1.33, 1.33)
簇1质心: ((8+8+9)/3, (8+9+8)/3) = (8.33, 8.33)

迭代2:
重新分配 → 分配不变 → 收敛

最终聚类:
簇0: A,B,C (质心1.33,1.33)
簇1: D,E,F (质心8.33,8.33)
轮廓系数: 0.85
```

### 主成分分析

通过线性变换将数据投影到低维空间，保留最大方差。

特点：
- 方差最大化：找到保留最多信息的方向
- 去相关：主成分之间相互正交
- 降维可视化：将高维数据降到 2D 或 3D 进行可视化

```javascript
// 主成分分析实现
export class PCA extends UnsupervisedLearning {
  constructor(nComponents = 2) {
    super();
    this.nComponents = nComponents;
    this.components = null;
    this.explainedVariance = null;
    this.mean = null;
  }

  // 标准化数据
  standardize(data) {
    const n = data.length;
    const m = data[0].length;
    
    // 计算均值和标准差
    const mean = new Array(m).fill(0);
    const std = new Array(m).fill(0);
    
    // 计算均值
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        mean[j] += data[i][j];
      }
    }
    for (let j = 0; j < m; j++) {
      mean[j] /= n;
    }
    
    // 计算标准差
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        std[j] += Math.pow(data[i][j] - mean[j], 2);
      }
    }
    for (let j = 0; j < m; j++) {
      std[j] = Math.sqrt(std[j] / n);
    }
    
    // 标准化数据
    const standardized = data.map(row => 
      row.map((val, j) => (val - mean[j]) / std[j])
    );
    
    return { standardized, mean, std };
  }

  // 计算协方差矩阵
  computeCovarianceMatrix(data) {
    const n = data.length;
    const m = data[0].length;
    const cov = Array.from({ length: m }, () => new Array(m).fill(0));
    
    for (let i = 0; i < m; i++) {
      for (let j = i; j < m; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += data[k][i] * data[k][j];
        }
        cov[i][j] = sum / (n - 1);
        cov[j][i] = cov[i][j]; // 对称矩阵
      }
    }
    
    return cov;
  }

  // 计算特征值和特征向量
  eigenDecomposition(matrix) {
    const n = matrix.length;
    
    // 简化的幂迭代法（实际应用应使用更稳定的算法）
    let eigenvectors = Array.from({ length: this.nComponents }, () => 
      Array.from({ length: n }, () => Math.random())
    );
    const eigenvalues = new Array(this.nComponents).fill(0);
    
    for (let comp = 0; comp < this.nComponents; comp++) {
      let vector = eigenvectors[comp];
      
      // 幂迭代
      for (let iter = 0; iter < 100; iter++) {
        // 矩阵乘法: newVector = matrix × vector
        let newVector = new Array(n).fill(0);
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            newVector[i] += matrix[i][j] * vector[j];
          }
        }
        
        // 归一化
        const norm = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0));
        vector = newVector.map(val => val / norm);
        
        // 与前一个特征向量正交化
        for (let prev = 0; prev < comp; prev++) {
          const dotProduct = vector.reduce((sum, val, i) => sum + val * eigenvectors[prev][i], 0);
          for (let i = 0; i < n; i++) {
            vector[i] -= dotProduct * eigenvectors[prev][i];
          }
        }
        
        // 重新归一化
        const newNorm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        vector = vector.map(val => val / newNorm);
      }
      
      eigenvectors[comp] = vector;
      
      // 计算特征值
      let rayleigh = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          rayleigh += vector[i] * matrix[i][j] * vector[j];
        }
      }
      eigenvalues[comp] = rayleigh;
    }
    
    return { eigenvalues, eigenvectors };
  }

  // 拟合数据
  fit(data) {
    const { standardized, mean } = this.standardize(data);
    this.mean = mean;
    
    // 计算协方差矩阵
    const covMatrix = this.computeCovarianceMatrix(standardized);
    
    // 特征分解
    const { eigenvalues, eigenvectors } = this.eigenDecomposition(covMatrix);
    
    // 按特征值降序排序
    const sortedIndices = eigenvalues.map((val, idx) => [val, idx])
      .sort(([a], [b]) => b - a)
      .map(([, idx]) => idx);
    
    this.components = sortedIndices.slice(0, this.nComponents)
      .map(idx => eigenvectors[idx]);
    this.explainedVariance = sortedIndices.slice(0, this.nComponents)
      .map(idx => eigenvalues[idx]);
    
    this.isTrained = true;
    return this;
  }

  // 转换数据到主成分空间
  transform(data) {
    if (!this.isTrained) throw new Error('Model not trained');
    
    // 中心化数据
    const centered = data.map(row => 
      row.map((val, j) => val - this.mean[j])
    );
    
    // 投影到主成分
    return centered.map(row => 
      this.components.map(component => 
        row.reduce((sum, val, j) => sum + val * component[j], 0)
      )
    );
  }

  // 计算解释方差比例
  explainedVarianceRatio() {
    if (!this.explainedVariance) return null;
    
    const totalVariance = this.explainedVariance.reduce((sum, val) => sum + val, 0);
    return this.explainedVariance.map(variance => variance / totalVariance);
  }

  // 逆变换（从主成分空间回到原始空间）
  inverseTransform(transformedData) {
    if (!this.isTrained) throw new Error('Model not trained');
    
    return transformedData.map(row => {
      const original = new Array(this.mean.length).fill(0);
      
      for (let i = 0; i < this.components.length; i++) {
        for (let j = 0; j < this.mean.length; j++) {
          original[j] += row[i] * this.components[i][j];
        }
      }
      
      // 添加均值
      return original.map((val, j) => val + this.mean[j]);
    });
  }
}
```

示意图 (PCA 降维过程)：
```
二维数据点:
(1,1), (2,2), (3,3), (1,2), (2,1), (3,2)

PCA过程:
1. 标准化数据:
   均值: (2,1.83), 标准化后数据...

2. 计算协方差矩阵:
   [[0.8, 0.4],
    [0.4, 0.8]]

3. 特征分解:
   特征值: [1.2, 0.4]
   特征向量: 
     PC1: [0.707, 0.707] (方差1.2, 75%)
     PC2: [-0.707, 0.707] (方差0.4, 25%)

4. 选择主成分:
   选择PC1，将2D数据投影到1D

5. 转换数据:
   (1,1) → 投影到PC1 → 1.41
   (2,2) → 2.83
   (3,3) → 4.24
   ...

解释方差: PC1解释75%的总方差
```

## 集成学习算法

### 随机森林

通过组合多个决策树提高预测性能和稳定性。

特点：
- 装袋算法：通过自助采样构建多个训练集
- 特征随机：每个节点分裂时随机选择特征子集
- 投票机制：通过多数投票或平均进行预测

```javascript
// 随机森林实现
export class RandomForest extends SupervisedLearning {
  constructor(nEstimators = 100, maxDepth = 10, maxFeatures = 'sqrt', isRegression = false) {
    super();
    this.nEstimators = nEstimators;
    this.maxDepth = maxDepth;
    this.maxFeatures = maxFeatures;
    this.isRegression = isRegression;
    this.trees = [];
    this.featureImportance = null;
  }

  // 自助采样
  bootstrapSample(features, labels) {
    const n = features.length;
    const sampledFeatures = [];
    const sampledLabels = [];
    const oobIndices = new Set(Array.from({ length: n }, (_, i) => i)); // 袋外样本
    
    for (let i = 0; i < n; i++) {
      const randomIndex = Math.floor(Math.random() * n);
      sampledFeatures.push(features[randomIndex]);
      sampledLabels.push(labels[randomIndex]);
      oobIndices.delete(randomIndex);
    }
    
    return {
      sampledFeatures,
      sampledLabels,
      oobIndices: Array.from(oobIndices)
    };
  }

  // 获取特征子集
  getFeatureSubset(nFeatures) {
    let nSelected;
    
    if (this.maxFeatures === 'sqrt') {
      nSelected = Math.floor(Math.sqrt(nFeatures));
    } else if (this.maxFeatures === 'log2') {
      nSelected = Math.floor(Math.log2(nFeatures));
    } else {
      nSelected = this.maxFeatures;
    }
    
    nSelected = Math.max(1, Math.min(nSelected, nFeatures));
    
    // 随机选择特征索引
    const allIndices = Array.from({ length: nFeatures }, (_, i) => i);
    const shuffled = [...allIndices].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, nSelected);
  }

  // 训练随机森林
  train(features, labels) {
    const n = features.length;
    const m = features[0].length;
    this.trees = [];
    
    // 构建多棵树
    for (let i = 0; i < this.nEstimators; i++) {
      // 自助采样
      const { sampledFeatures, sampledLabels, oobIndices } = this.bootstrapSample(features, labels);
      
      // 创建决策树
      const tree = this.isRegression ? 
        new RegressionTree(this.maxDepth) : 
        new DecisionTree(this.maxDepth);
      
      // 修改决策树的分割函数，只考虑特征子集
      const originalFindBestSplit = tree.findBestSplit.bind(tree);
      tree.findBestSplit = (features, labels, isRegression) => {
        const featureSubset = this.getFeatureSubset(features[0].length);
        const subsetFeatures = features.map(row => 
          featureSubset.map(idx => row[idx])
        );
        
        const result = originalFindBestSplit(subsetFeatures, labels, isRegression);
        
        if (result.bestFeature !== null) {
          // 映射回原始特征索引
          result.bestFeature = featureSubset[result.bestFeature];
        }
        
        return result;
      };
      
      // 训练树
      tree.train(sampledFeatures, sampledLabels);
      tree.oobIndices = oobIndices;
      
      this.trees.push(tree);
    }
    
    // 计算特征重要性
    this.calculateFeatureImportance(features, labels);
    
    this.isTrained = true;
    return this;
  }

  // 计算特征重要性
  calculateFeatureImportance(features, labels) {
    const m = features[0].length;
    const importance = new Array(m).fill(0);
    
    // 基于袋外误差计算特征重要性
    for (let tree of this.trees) {
      if (tree.oobIndices.length === 0) continue;
      
      // 计算原始袋外误差
      const oobFeatures = tree.oobIndices.map(i => features[i]);
      const oobLabels = tree.oobIndices.map(i => labels[i]);
      const originalPredictions = tree.predict(oobFeatures);
      const originalScore = this.isRegression ? 
        this.calculateMSE(originalPredictions, oobLabels) :
        this.calculateAccuracy(originalPredictions, oobLabels);
      
      // 对每个特征计算重要性
      for (let featureIdx = 0; featureIdx < m; featureIdx++) {
        // 打乱该特征的值
        const permutedFeatures = oobFeatures.map(row => [...row]);
        const shuffledValues = permutedFeatures.map(row => row[featureIdx])
          .sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < permutedFeatures.length; i++) {
          permutedFeatures[i][featureIdx] = shuffledValues[i];
        }
        
        // 计算打乱后的误差
        const permutedPredictions = tree.predict(permutedFeatures);
        const permutedScore = this.isRegression ? 
          this.calculateMSE(permutedPredictions, oobLabels) :
          this.calculateAccuracy(permutedPredictions, oobLabels);
        
        // 特征重要性 = 打乱后误差 - 原始误差
        importance[featureIdx] += permutedScore - originalScore;
      }
    }
    
    // 归一化重要性
    const sumImportance = importance.reduce((sum, val) => sum + Math.abs(val), 0);
    this.featureImportance = importance.map(val => val / sumImportance);
  }

  // 预测
  predict(features) {
    if (!this.isTrained) throw new Error('Model not trained');
    
    // 收集所有树的预测
    const allPredictions = this.trees.map(tree => tree.predict(features));
    
    // 组合预测（投票或平均）
    if (this.isRegression) {
      // 回归：取平均值
      return features.map((_, i) => {
        const treePredictions = allPredictions.map(pred => pred[i]);
        return treePredictions.reduce((sum, pred) => sum + pred, 0) / this.trees.length;
      });
    } else {
      // 分类：多数投票
      return features.map((_, i) => {
        const votes = {};
        allPredictions.forEach(pred => {
          const vote = pred[i];
          votes[vote] = (votes[vote] || 0) + 1;
        });
        
        return Object.entries(votes).reduce((a, b) => a[1] > b[1] ? a : b)[0];
      });
    }
  }

  // 获取特征重要性
  getFeatureImportance() {
    return this.featureImportance;
  }
}
```

示意图 (随机森林构建)：
```
训练数据: 1000个样本, 10个特征
构建100棵决策树

每棵树的构建:
1. 自助采样: 从1000个样本中随机选择1000个（有放回）
   袋外样本约37% (1-1/e)

2. 节点分裂: 从10个特征中随机选择√10≈3个特征
   寻找最佳分裂点

3. 构建完整决策树

预测新样本:
样本 → 每棵树预测 → 
  树1: 类别A
  树2: 类别B  
  树3: 类别A
  ...
  树100: 类别A

投票结果: 类别A (60票) > 类别B (40票)
最终预测: 类别A

特征重要性:
基于袋外误差计算，特征3最重要(重要性0.25)
```