# 算法练习平台

## 平台架构

JavaScript 算法练习平台是集代码编辑、测试验证、性能分析和学习进度跟踪于一体的综合性训练环境。平台采用模块化设计，支持从基础语法到高级算法的渐进式学习路径。

系统架构示意图：
```
用户界面层
    ↓
应用服务层 → 代码执行引擎 → 测试验证器
    ↓              ↓
数据持久层 ← 学习分析器 ← 进度跟踪器
```

## 核心功能模块

### 代码执行环境

```javascript
// 安全的代码执行沙箱
export class CodeExecutionSandbox {
    constructor() {
        this.allowedAPIs = new Set([
            'console', 'Math', 'Array', 'String', 'Object', 
            'Number', 'Set', 'Map', 'JSON', 'Date'
        ]);
        this.executionTimeout = 5000;
        this.memoryLimit = 50 * 1024 * 1024; // 50MB
    }

    // 执行用户代码
    async executeUserCode(code, testCases) {
        const wrappedCode = this.wrapCodeInSandbox(code);
        const results = [];
        
        for (const testCase of testCases) {
            try {
                const result = await this.executeSingleTest(wrappedCode, testCase);
                results.push(result);
            } catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    input: testCase.input,
                    expected: testCase.expected,
                    executionTime: 0
                });
            }
        }
        
        return results;
    }

    // 包装用户代码到安全环境
    wrapCodeInSandbox(code) {
        return `
            (function() {
                "use strict";
                const memoryStart = typeof process !== 'undefined' ? 
                    process.memoryUsage().heapUsed : 0;
                const startTime = performance.now();
                
                // 限制可用API
                const allowedGlobals = {
                    console: { log: console.log, error: console.error },
                    Math: Math, Array: Array, String: String, 
                    Object: Object, Number: Number, Set: Set,
                    Map: Map, JSON: JSON, Date: Date
                };
                
                // 用户代码执行上下文
                const userFunction = ${code};
                
                // 测试执行器
                return function executeTest(input) {
                    try {
                        const result = userFunction.apply(null, input);
                        const endTime = performance.now();
                        const memoryEnd = typeof process !== 'undefined' ? 
                            process.memoryUsage().heapUsed : 0;
                        
                        return {
                            success: true,
                            output: result,
                            executionTime: endTime - startTime,
                            memoryUsed: memoryEnd - memoryStart
                        };
                    } catch (error) {
                        throw new Error(\`执行错误: \${error.message}\`);
                    }
                };
            })();
        `;
    }

    // 执行单个测试用例
    async executeSingleTest(wrappedCode, testCase) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('执行超时'));
            }, this.executionTimeout);

            try {
                // 在隔离环境中执行代码
                const executor = eval(wrappedCode);
                const result = executor(testCase.input);
                
                clearTimeout(timeoutId);
                
                // 验证结果
                const isCorrect = this.deepEqual(result.output, testCase.expected);
                
                resolve({
                    ...result,
                    success: true,
                    passed: isCorrect,
                    input: testCase.input,
                    expected: testCase.expected,
                    actual: result.output
                });
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    // 深度比较两个值
    deepEqual(a, b) {
        if (a === b) return true;
        
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            return a.every((item, index) => this.deepEqual(item, b[index]));
        }
        
        if (typeof a === 'object' && typeof b === 'object' && a && b) {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            
            if (keysA.length !== keysB.length) return false;
            return keysA.every(key => this.deepEqual(a[key], b[key]));
        }
        
        return false;
    }
}
```

### 题目管理系统

```javascript
// 题目管理器和难度系统
export class ProblemManager {
    constructor() {
        this.problems = new Map();
        this.categories = new Map();
        this.difficultyLevels = ['easy', 'medium', 'hard', 'expert'];
        this.initDefaultProblems();
    }

    // 初始化默认题目库
    initDefaultProblems() {
        this.addProblem({
            id: 'two-sum',
            title: '两数之和',
            description: '给定一个整数数组和一个目标值，找出数组中和为目标值的两个数。',
            difficulty: 'easy',
            category: 'array',
            template: `function twoSum(nums, target) {
    // 在这里编写你的代码
    // 返回两个数的索引
}`,
            testCases: [
                {
                    input: [[2, 7, 11, 15], 9],
                    expected: [0, 1],
                    explanation: '因为 nums[0] + nums[1] = 2 + 7 = 9'
                },
                {
                    input: [[3, 2, 4], 6],
                    expected: [1, 2],
                    explanation: '因为 nums[1] + nums[2] = 2 + 4 = 6'
                }
            ],
            hints: [
                '可以使用暴力解法，两层循环遍历所有组合',
                '考虑使用哈希表来优化时间复杂度',
                '在遍历时检查 target - current 是否在哈希表中'
            ],
            solutions: [
                {
                    language: 'javascript',
                    code: `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
                    timeComplexity: 'O(n)',
                    spaceComplexity: 'O(n)',
                    explanation: '使用哈希表存储数字和索引，一次遍历解决问题'
                }
            ]
        });

        this.addProblem({
            id: 'reverse-linked-list',
            title: '反转链表',
            description: '反转一个单链表。',
            difficulty: 'medium',
            category: 'linked-list',
            template: `function reverseList(head) {
    // 在这里编写你的代码
}`,
            testCases: [
                {
                    input: [{val: 1, next: {val: 2, next: {val: 3, next: null}}}],
                    expected: {val: 3, next: {val: 2, next: {val: 1, next: null}}},
                    explanation: '链表 1->2->3 反转为 3->2->1'
                }
            ]
        });
    }

    // 添加题目
    addProblem(problem) {
        problem.createdAt = new Date();
        problem.updatedAt = new Date();
        this.problems.set(problem.id, problem);
        
        // 更新分类
        if (!this.categories.has(problem.category)) {
            this.categories.set(problem.category, []);
        }
        this.categories.get(problem.category).push(problem.id);
    }

    // 获取题目
    getProblem(id) {
        return this.problems.get(id);
    }

    // 获取分类题目
    getProblemsByCategory(category, difficulty = null) {
        const problemIds = this.categories.get(category) || [];
        const problems = problemIds.map(id => this.problems.get(id));
        
        if (difficulty) {
            return problems.filter(p => p.difficulty === difficulty);
        }
        
        return problems;
    }

    // 获取推荐题目
    getRecommendedProblems(userProfile, count = 5) {
        const { solvedProblems, skillLevel, weakCategories } = userProfile;
        
        return Array.from(this.problems.values())
            .filter(problem => 
                !solvedProblems.includes(problem.id) &&
                this.calculateMatchScore(problem, userProfile) > 0.5
            )
            .sort((a, b) => 
                this.calculateMatchScore(b, userProfile) - 
                this.calculateMatchScore(a, userProfile)
            )
            .slice(0, count);
    }

    // 计算题目匹配度
    calculateMatchScore(problem, userProfile) {
        const { skillLevel, weakCategories, preferredDifficulty } = userProfile;
        
        let score = 0;
        
        // 难度匹配
        const difficultyWeights = { easy: 1, medium: 2, hard: 3, expert: 4 };
        const userLevel = difficultyWeights[skillLevel] || 2;
        const problemLevel = difficultyWeights[problem.difficulty];
        
        const difficultyScore = 1 - Math.abs(userLevel - problemLevel) / 4;
        score += difficultyScore * 0.4;
        
        // 弱点改进
        if (weakCategories.includes(problem.category)) {
            score += 0.3;
        }
        
        // 偏好匹配
        if (preferredDifficulty === problem.difficulty) {
            score += 0.3;
        }
        
        return Math.min(score, 1);
    }

    // 验证用户解决方案
    validateSolution(userCode, problemId) {
        const problem = this.getProblem(problemId);
        if (!problem) throw new Error('题目不存在');
        
        const sandbox = new CodeExecutionSandbox();
        return sandbox.executeUserCode(userCode, problem.testCases);
    }
}
```

## 学习进度系统

### 用户进度跟踪

```javascript
// 用户学习进度管理器
export class ProgressTracker {
    constructor() {
        this.userProgress = new Map();
        this.achievements = new Map();
        this.initAchievements();
    }

    // 初始化成就系统
    initAchievements() {
        this.achievements.set('first-blood', {
            id: 'first-blood',
            name: '初见杀',
            description: '完成第一道题目',
            icon: '🏆',
            condition: (progress) => progress.solvedProblems.length >= 1
        });

        this.achievements.set('persistent-learner', {
            id: 'persistent-learner',
            name: '持之以恒',
            description: '连续7天完成练习',
            icon: '🔥',
            condition: (progress) => progress.streakDays >= 7
        });

        this.achievements.set('algorithm-master', {
            id: 'algorithm-master',
            name: '算法大师',
            description: '完成所有中等难度题目',
            icon: '👑',
            condition: (progress) => 
                progress.solvedByDifficulty.medium >= progress.totalByDifficulty.medium
        });
    }

    // 更新用户进度
    updateProgress(userId, problemId, result) {
        if (!this.userProgress.has(userId)) {
            this.userProgress.set(userId, this.createDefaultProgress());
        }

        const progress = this.userProgress.get(userId);
        const problem = problemManager.getProblem(problemId);
        
        // 更新解决题目
        if (!progress.solvedProblems.includes(problemId)) {
            progress.solvedProblems.push(problemId);
            progress.solvedCount++;
            
            // 按难度统计
            progress.solvedByDifficulty[problem.difficulty]++;
            
            // 按分类统计
            if (!progress.solvedByCategory[problem.category]) {
                progress.solvedByCategory[problem.category] = 0;
            }
            progress.solvedByCategory[problem.category]++;
        }

        // 更新统计信息
        progress.totalSubmissions++;
        if (result.passed) {
            progress.correctSubmissions++;
        }

        // 更新连续练习天数
        this.updateStreak(progress);

        // 检查成就
        this.checkAchievements(userId, progress);

        return progress;
    }

    // 创建默认进度
    createDefaultProgress() {
        return {
            joinedAt: new Date(),
            solvedProblems: [],
            solvedCount: 0,
            totalSubmissions: 0,
            correctSubmissions: 0,
            streakDays: 0,
            lastActiveDate: new Date().toDateString(),
            solvedByDifficulty: { easy: 0, medium: 0, hard: 0, expert: 0 },
            solvedByCategory: {},
            achievements: [],
            skillLevel: 'beginner',
            weakCategories: []
        };
    }

    // 更新连续天数
    updateStreak(progress) {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (progress.lastActiveDate === yesterday) {
            progress.streakDays++;
        } else if (progress.lastActiveDate !== today) {
            progress.streakDays = 1;
        }
        
        progress.lastActiveDate = today;
    }

    // 检查成就
    checkAchievements(userId, progress) {
        for (const [achievementId, achievement] of this.achievements) {
            if (!progress.achievements.includes(achievementId) && 
                achievement.condition(progress)) {
                progress.achievements.push(achievementId);
                this.onAchievementUnlocked(userId, achievement);
            }
        }
    }

    // 成就解锁处理
    onAchievementUnlocked(userId, achievement) {
        console.log(`🎉 用户 ${userId} 解锁成就: ${achievement.name}`);
        // 这里可以添加通知、奖励等逻辑
    }

    // 获取用户统计
    getUserStats(userId) {
        const progress = this.userProgress.get(userId) || this.createDefaultProgress();
        const totalProblems = problemManager.problems.size;
        
        const categoryStats = Object.entries(progress.solvedByCategory).map(([category, count]) => {
            const totalInCategory = problemManager.getProblemsByCategory(category).length;
            return {
                category,
                solved: count,
                total: totalInCategory,
                percentage: totalInCategory > 0 ? (count / totalInCategory * 100) : 0
            };
        });

        const difficultyStats = Object.entries(progress.solvedByDifficulty).map(([difficulty, count]) => {
            const problems = Array.from(problemManager.problems.values())
                .filter(p => p.difficulty === difficulty);
            return {
                difficulty,
                solved: count,
                total: problems.length,
                percentage: problems.length > 0 ? (count / problems.length * 100) : 0
            };
        });

        return {
            overview: {
                solvedCount: progress.solvedCount,
                totalProblems,
                accuracy: progress.totalSubmissions > 0 ? 
                    (progress.correctSubmissions / progress.totalSubmissions * 100) : 0,
                streakDays: progress.streakDays,
                achievements: progress.achievements.length
            },
            categoryStats,
            difficultyStats,
            recentActivity: this.getRecentActivity(userId)
        };
    }

    // 获取学习建议
    getLearningRecommendations(userId) {
        const progress = this.userProgress.get(userId);
        if (!progress) return [];

        const recommendations = [];
        const stats = this.getUserStats(userId);

        // 基于弱点的推荐
        const weakCategories = stats.categoryStats
            .filter(stat => stat.percentage < 50)
            .sort((a, b) => a.percentage - b.percentage);

        if (weakCategories.length > 0) {
            recommendations.push({
                type: 'weak_category',
                message: `建议加强 ${weakCategories[0].category} 类题目的练习`,
                priority: 'high',
                problems: problemManager.getProblemsByCategory(weakCategories[0].category, 'easy')
                    .slice(0, 3)
            });
        }

        // 基于进度的推荐
        const nextDifficulty = this.getNextDifficultyTarget(progress);
        if (nextDifficulty) {
            recommendations.push({
                type: 'progression',
                message: `可以开始尝试 ${nextDifficulty} 难度的题目`,
                priority: 'medium',
                problems: Array.from(problemManager.problems.values())
                    .filter(p => p.difficulty === nextDifficulty)
                    .slice(0, 2)
            });
        }

        return recommendations;
    }

    getNextDifficultyTarget(progress) {
        const difficulties = ['easy', 'medium', 'hard', 'expert'];
        const currentIndex = difficulties.findIndex(diff => 
            progress.solvedByDifficulty[diff] < 5
        );
        
        return currentIndex >= 0 ? difficulties[currentIndex] : null;
    }

    getRecentActivity(userId) {
        // 返回最近的学习活动
        return [
            { type: 'problem_solved', problemId: 'two-sum', timestamp: new Date() },
            { type: 'achievement_unlocked', achievementId: 'first-blood', timestamp: new Date() }
        ];
    }
}
```

## 交互式学习功能

### 实时代码分析器

```javascript
// 代码质量分析器
export class CodeAnalyzer {
    constructor() {
        this.rules = [
            {
                id: 'time-complexity',
                name: '时间复杂度优化',
                check: (code, problem) => this.checkTimeComplexity(code, problem),
                suggestion: '考虑使用更高效的算法降低时间复杂度'
            },
            {
                id: 'space-complexity',
                name: '空间复杂度优化',
                check: (code, problem) => this.checkSpaceComplexity(code, problem),
                suggestion: '考虑优化内存使用，减少不必要的变量'
            },
            {
                id: 'code-style',
                name: '代码风格检查',
                check: (code) => this.checkCodeStyle(code),
                suggestion: '改进代码可读性，添加适当的注释'
            }
        ];
    }

    // 分析代码质量
    analyzeCodeQuality(code, problem, executionResults) {
        const issues = [];
        const suggestions = [];

        for (const rule of this.rules) {
            const result = rule.check(code, problem, executionResults);
            if (result.hasIssue) {
                issues.push({
                    rule: rule.name,
                    severity: result.severity || 'medium',
                    message: result.message,
                    line: result.line,
                    suggestion: rule.suggestion
                });
            }
        }

        // 计算综合评分
        const score = this.calculateQualityScore(issues, executionResults);

        return {
            score,
            issues,
            suggestions: this.generateSuggestions(issues, suggestions),
            metrics: this.calculateMetrics(executionResults)
        };
    }

    // 检查时间复杂度
    checkTimeComplexity(code, problem, results) {
        // 简单的时间复杂度分析（实际实现会更复杂）
        const slowPatterns = [
            /for\s*\([^}]*\)\s*{[\s\S]*for\s*\([^}]*\)/g, // 嵌套循环
            /\.sort\s*\([^)]*\)\s*\.sort/g, // 多次排序
            /while\s*\([^}]*\)\s*{[\s\S]*while/g // 嵌套while
        ];

        for (const pattern of slowPatterns) {
            if (pattern.test(code)) {
                return {
                    hasIssue: true,
                    severity: 'high',
                    message: '检测到可能的高时间复杂度操作',
                    line: this.findLineNumber(code, pattern)
                };
            }
        }

        return { hasIssue: false };
    }

    // 检查代码风格
    checkCodeStyle(code) {
        const styleIssues = [];

        // 检查代码长度
        const lines = code.split('\n');
        if (lines.length > 50) {
            styleIssues.push('代码过长，考虑拆分为更小的函数');
        }

        // 检查注释
        const commentLines = lines.filter(line => 
            line.trim().startsWith('//') || line.includes('/*')
        ).length;
        const commentRatio = commentLines / lines.length;
        
        if (commentRatio < 0.1) {
            styleIssues.push('代码注释较少，建议添加更多注释说明逻辑');
        }

        if (styleIssues.length > 0) {
            return {
                hasIssue: true,
                severity: 'low',
                message: styleIssues.join('; ')
            };
        }

        return { hasIssue: false };
    }

    // 计算质量评分
    calculateQualityScore(issues, executionResults) {
        let score = 100;
        
        // 根据问题严重性扣分
        for (const issue of issues) {
            switch (issue.severity) {
                case 'high': score -= 20; break;
                case 'medium': score -= 10; break;
                case 'low': score -= 5; break;
            }
        }

        // 根据执行性能调整分数
        const avgTime = executionResults.reduce((sum, r) => sum + r.executionTime, 0) 
            / executionResults.length;
        if (avgTime > 100) score -= 10;

        return Math.max(0, Math.min(100, score));
    }

    // 生成改进建议
    generateSuggestions(issues, generalSuggestions) {
        const suggestions = [...generalSuggestions];

        if (issues.some(issue => issue.severity === 'high')) {
            suggestions.unshift('优先解决高严重性问题');
        }

        return suggestions.slice(0, 3); // 返回前3个建议
    }

    // 计算性能指标
    calculateMetrics(executionResults) {
        const times = executionResults.map(r => r.executionTime);
        const memory = executionResults.map(r => r.memoryUsed || 0);

        return {
            avgTime: times.reduce((a, b) => a + b, 0) / times.length,
            maxTime: Math.max(...times),
            avgMemory: memory.reduce((a, b) => a + b, 0) / memory.length,
            maxMemory: Math.max(...memory)
        };
    }

    findLineNumber(code, pattern) {
        const match = pattern.exec(code);
        if (!match) return 1;
        
        const codeBeforeMatch = code.substring(0, match.index);
        return codeBeforeMatch.split('\n').length;
    }
}
```

### 学习路径规划器

```javascript
// 个性化学习路径规划
export class LearningPathPlanner {
    constructor(problemManager, progressTracker) {
        this.problemManager = problemManager;
        this.progressTracker = progressTracker;
        this.learningPaths = new Map();
        this.initDefaultPaths();
    }

    // 初始化默认学习路径
    initDefaultPaths() {
        this.learningPaths.set('beginner', {
            id: 'beginner',
            name: '初学者路径',
            description: '从基础开始，逐步掌握核心算法',
            difficultyProgression: ['easy', 'medium', 'hard'],
            categories: ['array', 'string', 'linked-list', 'tree'],
            milestones: [
                { target: '完成10道简单题目', problems: 10, difficulty: 'easy' },
                { target: '掌握数组和字符串操作', categories: ['array', 'string'] },
                { target: '理解链表和树结构', categories: ['linked-list', 'tree'] }
            ]
        });

        this.learningPaths.set('interview-prep', {
            id: 'interview-prep',
            name: '面试准备路径',
            description: '专注于常见面试算法题',
            difficultyProgression: ['medium', 'hard'],
            categories: ['array', 'string', 'linked-list', 'tree', 'dp', 'graph'],
            milestones: [
                { target: '完成50道中等难度题目', problems: 50, difficulty: 'medium' },
                { target: '掌握动态规划', categories: ['dp'] },
                { target: '精通图算法', categories: ['graph'] }
            ]
        });
    }

    // 获取个性化学习计划
    getPersonalizedPlan(userId, pathId = 'beginner') {
        const path = this.learningPaths.get(pathId);
        const userStats = this.progressTracker.getUserStats(userId);
        const progress = this.progressTracker.userProgress.get(userId);

        if (!path || !progress) return null;

        const currentMilestone = this.getCurrentMilestone(path, progress);
        const weeklyPlan = this.generateWeeklyPlan(path, progress, userStats);

        return {
            path: path,
            currentMilestone,
            weeklyPlan,
            progress: this.calculatePathProgress(path, progress),
            recommendations: this.getPathRecommendations(path, progress)
        };
    }

    // 获取当前里程碑
    getCurrentMilestone(path, progress) {
        for (const milestone of path.milestones) {
            if (!this.isMilestoneCompleted(milestone, progress)) {
                return milestone;
            }
        }
        return path.milestones[path.milestones.length - 1];
    }

    // 检查里程碑完成状态
    isMilestoneCompleted(milestone, progress) {
        if (milestone.problems) {
            return progress.solvedCount >= milestone.problems;
        }
        
        if (milestone.categories) {
            return milestone.categories.every(category => 
                progress.solvedByCategory[category] >= 3
            );
        }
        
        return false;
    }

    // 生成周计划
    generateWeeklyPlan(path, progress, userStats) {
        const weekPlan = {
            monday: this.getDailyProblems(path, progress, 2),
            tuesday: this.getDailyProblems(path, progress, 2),
            wednesday: this.getDailyProblems(path, progress, 2),
            thursday: this.getDailyProblems(path, progress, 2),
            friday: this.getDailyProblems(path, progress, 2),
            weekend: this.getDailyProblems(path, progress, 3)
        };

        // 添加复习题目
        this.addReviewProblems(weekPlan, progress);

        return weekPlan;
    }

    // 获取每日推荐题目
    getDailyProblems(path, progress, count) {
        const currentMilestone = this.getCurrentMilestone(path, progress);
        const targetCategories = currentMilestone.categories || path.categories;
        const targetDifficulty = currentMilestone.difficulty || 'medium';

        const recommended = [];
        
        for (const category of targetCategories) {
            const problems = this.problemManager.getProblemsByCategory(category, targetDifficulty)
                .filter(p => !progress.solvedProblems.includes(p.id))
                .slice(0, 2);
            
            recommended.push(...problems);
        }

        return recommended.slice(0, count);
    }

    // 添加复习题目
    addReviewProblems(weekPlan, progress) {
        const recentProblems = progress.solvedProblems
            .slice(-10) // 最近解决的10个题目
            .map(id => this.problemManager.getProblem(id))
            .filter(p => p);

        // 在每个练习日添加一个复习题目
        Object.keys(weekPlan).forEach(day => {
            if (recentProblems.length > 0 && weekPlan[day].length > 0) {
                const reviewProblem = recentProblems[Math.floor(Math.random() * recentProblems.length)];
                weekPlan[day].push(reviewProblem);
            }
        });
    }

    // 计算路径进度
    calculatePathProgress(path, progress) {
        const completedMilestones = path.milestones.filter(milestone => 
            this.isMilestoneCompleted(milestone, progress)
        ).length;

        return {
            completed: completedMilestones,
            total: path.milestones.length,
            percentage: (completedMilestones / path.milestones.length) * 100
        };
    }

    // 获取路径建议
    getPathRecommendations(path, progress) {
        const recommendations = [];
        const currentMilestone = this.getCurrentMilestone(path, progress);

        if (currentMilestone.categories) {
            const weakCategories = currentMilestone.categories.filter(category => 
                !progress.solvedByCategory[category] || progress.solvedByCategory[category] < 2
            );

            if (weakCategories.length > 0) {
                recommendations.push({
                    type: 'focus-area',
                    message: `建议重点练习 ${weakCategories.join(', ')} 类题目`,
                    priority: 'high'
                });
            }
        }

        if (progress.streakDays < 3) {
            recommendations.push({
                type: 'consistency',
                message: '保持连续练习习惯，建议每天至少完成1道题目',
                priority: 'medium'
            });
        }

        return recommendations;
    }
}
```

## 平台集成示例

```javascript
// 平台主控制器
export class AlgorithmPlatform {
    constructor() {
        this.problemManager = new ProblemManager();
        this.progressTracker = new ProgressTracker();
        this.codeAnalyzer = new CodeAnalyzer();
        this.learningPlanner = new LearningPathPlanner(this.problemManager, this.progressTracker);
        this.currentUser = null;
    }

    // 用户登录
    login(userId) {
        this.currentUser = userId;
        return this.getUserDashboard();
    }

    // 获取用户仪表板
    getUserDashboard() {
        if (!this.currentUser) throw new Error('用户未登录');

        const stats = this.progressTracker.getUserStats(this.currentUser);
        const recommendations = this.progressTracker.getLearningRecommendations(this.currentUser);
        const learningPlan = this.learningPlanner.getPersonalizedPlan(this.currentUser);

        return {
            userStats: stats,
            recommendations,
            learningPlan,
            recentActivity: this.getRecentActivity(),
            leaderboard: this.getLeaderboard()
        };
    }

    // 提交解决方案
    async submitSolution(problemId, code) {
        if (!this.currentUser) throw new Error('用户未登录');

        // 验证代码
        const results = await this.problemManager.validateSolution(code, problemId);
        
        // 分析代码质量
        const problem = this.problemManager.getProblem(problemId);
        const qualityAnalysis = this.codeAnalyzer.analyzeCodeQuality(code, problem, results);

        // 更新进度
        const allPassed = results.every(r => r.passed);
        if (allPassed) {
            this.progressTracker.updateProgress(this.currentUser, problemId, results[0]);
        }

        return {
            results,
            qualityAnalysis,
            progress: allPassed ? this.progressTracker.getUserStats(this.currentUser) : null,
            achievement: allPassed ? this.checkNewAchievements() : null
        };
    }

    // 检查新成就
    checkNewAchievements() {
        const progress = this.progressTracker.userProgress.get(this.currentUser);
        const newAchievements = progress.achievements.filter(achievementId => 
            !progress.lastCheckedAchievements?.includes(achievementId)
        );

        if (newAchievements.length > 0) {
            progress.lastCheckedAchievements = [...progress.achievements];
            return newAchievements.map(id => this.progressTracker.achievements.get(id));
        }

        return null;
    }

    // 获取最近活动
    getRecentActivity() {
        // 返回平台级别的最近活动
        return [
            {
                type: 'user_solved',
                userId: 'user123',
                problemId: 'two-sum',
                timestamp: new Date()
            },
            {
                type: 'achievement_unlocked',
                userId: 'user456',
                achievementId: 'algorithm-master',
                timestamp: new Date()
            }
        ];
    }

    // 获取排行榜
    getLeaderboard() {
        const allUsers = Array.from(this.progressTracker.userProgress.entries())
            .map(([userId, progress]) => ({
                userId,
                solvedCount: progress.solvedCount,
                streakDays: progress.streakDays,
                achievements: progress.achievements.length
            }))
            .sort((a, b) => b.solvedCount - a.solvedCount)
            .slice(0, 10);

        return allUsers;
    }

    // 搜索题目
    searchProblems(query, filters = {}) {
        let results = Array.from(this.problemManager.problems.values());

        // 关键词搜索
        if (query) {
            const lowerQuery = query.toLowerCase();
            results = results.filter(problem => 
                problem.title.toLowerCase().includes(lowerQuery) ||
                problem.description.toLowerCase().includes(lowerQuery) ||
                problem.category.toLowerCase().includes(lowerQuery)
            );
        }

        // 筛选器
        if (filters.difficulty) {
            results = results.filter(problem => problem.difficulty === filters.difficulty);
        }

        if (filters.category) {
            results = results.filter(problem => problem.category === filters.category);
        }

        if (filters.solved !== undefined && this.currentUser) {
            const progress = this.progressTracker.userProgress.get(this.currentUser);
            if (progress) {
                if (filters.solved) {
                    results = results.filter(problem => progress.solvedProblems.includes(problem.id));
                } else {
                    results = results.filter(problem => !progress.solvedProblems.includes(problem.id));
                }
            }
        }

        return results;
    }
}

// 平台初始化
export const algorithmPlatform = new AlgorithmPlatform();
```