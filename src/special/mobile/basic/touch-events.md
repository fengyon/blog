# 触摸事件

触摸事件是移动端交互的核心基础，与传统鼠标事件有本质区别。它支持多点触控、复杂手势和精细的触摸轨迹追踪，为移动设备提供了自然直观的交互方式。

## 触摸事件基础

触摸事件系统基于触摸点 (Touch) 的完整生命周期进行管理，每个触摸点都有独立的标识和状态追踪。

- **触摸点生命周期**：从触摸开始到结束的完整过程。
  
  示意图：
  手指接触屏幕 → touchstart → 手指移动 → touchmove → 手指离开 → touchend
        ↓
  触摸点创建 → 触摸点更新 → 触摸点销毁

- **触摸事件对象结构**：包含触摸点列表和事件信息。
  
  代码结构示意：
  TouchEvent {
    touches：[// 屏幕上所有激活的触摸点
      Touch {
        identifier：0， // 唯一标识符
        target：element，
        clientX：100，
        clientY：200，
        radiusX：5，
        radiusY：5，
        force：0.5
      }
    ]，
    targetTouches：[]， // 当前目标元素上的触摸点
    changedTouches：[] // 本次事件改变的触摸点
  }

## 基本触摸事件类型

移动端提供了三种核心触摸事件类型，覆盖了触摸交互的完整生命周期。

- **touchstart**：手指触摸屏幕时触发，标记触摸开始。
  
  触发时机：
  屏幕状态：无触摸 → 手指接触 → touchstart 事件
  应用场景：开始拖动、按钮按下状态

- **touchmove**：手指在屏幕上移动时连续触发。
  
  触发模式：
  手指移动轨迹：A 点 → B 点 → C 点
  事件触发：touchmove(A) → touchmove(B) → touchmove(C)
  
  性能特点：高频率触发，需优化处理逻辑

- **touchend**：手指离开屏幕时触发，标记触摸结束。
  
  结束场景：
  正常结束：手指抬起 → touchend
  异常结束：触摸点超出浏览器 → touchcancel

## 触摸点管理与追踪

由于支持多点触控，需要精确管理每个触摸点的状态和标识。

- **identifier 追踪**：通过唯一标识符区分不同触摸点。
  
  示意图：
  双指操作：
  手指 1：identifier=0 → touchstart → touchmove → touchend
  手指 2：identifier=1 → touchstart → touchmove → touchend
  
  代码示例：
  let touchMap = new Map()；
  
  element.addEventListener('touchstart', (e) => {
    for (let touch of e.changedTouches) {
      touchMap.set(touch.identifier, {
        startX: touch.clientX,
        startY: touch.clientY
      });
    }
  });

- **触摸点坐标系统**：提供多种坐标参考系。
  
  坐标类型：
  clientX/clientY：相对于视口的坐标
  pageX/pageY：相对于文档的坐标
  screenX/screenY：相对于屏幕的坐标
  
  示意图：
  文档滚动时：
  ┌─────────────┐
  │ 视口区域 │ ← clientX/clientY
  ├─────────────┤
  │ 文档内容 │ ← pageX/pageY
  │ │
  └─────────────┘

## 触摸与鼠标事件关系

为兼容传统网页，触摸设备会模拟鼠标事件，但存在重要差异。

- **事件触发序列**：触摸操作会触发完整的事件序列。
  
  触发顺序：
  1. touchstart
  2. (可选多个 touchmove)
  3. touchend
  4. mouseover
  5. mousemove
  6. mousedown
  7. mouseup
  8. click

- **点透问题**：上层元素触摸消失后，下层元素接收点击事件。
  
  问题场景：
  上层：遮罩层 (触摸后隐藏)
  下层：按钮 (接收到模拟的 click 事件)
  
  解决方案：
  1. 使用 touchend 阻止默认行为
  2. 设置下层元素 pointer-events：none
  3. 延迟隐藏上层元素

## 复杂手势实现

基于基本触摸事件，可以组合实现丰富的交互手势。

- **轻击 (Tap)**：快速触摸并释放。
  
  实现逻辑：
  开始：touchstart 记录时间戳和位置
  结束：touchend 检查时间差<300ms 且移动距离<10px

- **长按 (Long Press)**：持续触摸超过阈值时间。
  
  实现示意：
  touchstart：启动计时器 (500ms)
  touchend：清除计时器
  计时器触发：执行长按回调

- **滑动 (Swipe)**：快速直线移动手势。
  
  方向判断：
  开始点 A → 结束点 B
  ΔX = Bx - Ax，ΔY = By - Ay
  |ΔX| > |ΔY|且|ΔX| > 阈值 → 水平滑动
  |ΔY| > |ΔX|且|ΔY| > 阈值 → 垂直滑动

- **缩放 (Pinch)**：双指距离变化手势。
  
  计算原理：
  初始距离：d1 = √ ((x2-x1)² + (y2-y1)²)
  当前距离：d2 = √ ((x2 ‘-x1’) ² + (y2 ‘-y1’) ²)
  缩放比例：scale = d2 / d1

- **旋转 (Rotate)**：双指绕中心点旋转。
  
  角度计算：
  初始向量：v1 = (x2-x1，y2-y1)
  当前向量：v2 = (x2 ‘-x1’，y2 ‘-y1’)
  旋转角度：θ = atan2(v2) - atan2(v1)

## 触摸事件优化

触摸事件的高频率触发特性需要特别的性能优化措施。

- **事件节流**：限制 touchmove 事件处理频率。
  
  优化前：每次 touchmove 都执行重操作
  优化后：每 16ms 执行一次 (约 60fps)

- **被动事件监听器**：改善滚动性能。
  
  传统方式：
  element.addEventListener (‘touchstart’，handler)
  
  优化方式：
  element.addEventListener (‘touchstart’，handler，{ 
    passive：true  // 不会调用 preventDefault()
  })

- **触摸点数据复用**：避免频繁的对象创建。
  
  不佳实践：每次事件都解析完整触摸列表
  最佳实践：缓存需要的数据，增量更新

## 触摸反馈与用户体验

良好的触摸反馈能够显著提升用户体验和操作准确性。

- **视觉反馈**：立即响应用户触摸。
  
  触摸状态示意：
  默认状态：[按钮]
  触摸开始：[▓ 按钮 ▓] ← 背景色变化
  触摸结束：[按钮]

- **触摸目标尺寸**：确保足够的可触摸区域。
  
  推荐尺寸：最小 44×44 像素
  错误示例：[小按钮] ← 难以准确触摸
  正确示例：[足够大的按钮]

- **防止意外触摸**：在关键操作中添加确认机制。
  
  危险操作流程：
  删除按钮触摸 → 显示确认对话框 → 二次确认触摸 → 执行删除

## 跨平台兼容性

不同设备和浏览器在触摸事件实现上存在差异，需要兼容处理。

- **特征检测**：判断设备触摸支持。
  
  检测方法：
  if (‘ontouchstart’ in window) {
    // 支持触摸事件
  }
  
  或：
  if (window.TouchEvent) {
    // 支持 TouchEvent API
  }

- **指针事件 (Pointer Events)**：现代统一输入事件模型。
  
  事件映射：
  触摸设备：pointerdown → pointermove → pointerup
  鼠标设备：pointerdown → pointermove → pointerup
  
  优势：统一处理触摸、鼠标、触控笔输入