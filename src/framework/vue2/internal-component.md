# Vue2 内置组件

Vue2 提供了一系列内置组件，用于处理常见的 UI 交互和功能需求，无需额外引入即可使用。

## component 组件

动态组件，用于在不同组件间动态切换。

### 基本用法

```html
<component :is="currentComponent"></component>
```

```javascript
export default {
  data() {
    return {
      currentComponent: 'Home'
    }
  },
  components: {
    Home: {
      template: '<div>首页组件</div>'
    },
    About: {
      template: '<div>关于组件</div>'
    },
    Contact: {
      template: '<div>联系组件</div>'
    }
  },
  methods: {
    switchComponent(componentName) {
      this.currentComponent = componentName
    }
  }
}
```

动态组件示意图：
```
currentComponent: 'Home' → 渲染 Home 组件
currentComponent: 'About' → 渲染 About 组件
currentComponent: 'Contact' → 渲染 Contact 组件
```

### 配合 keep-alive

```html
<keep-alive>
  <component :is="currentComponent"></component>
</keep-alive>
```

## transition 组件

为单个元素/组件提供过渡效果。

### 基本过渡

```html
<transition name="fade">
  <div v-if="show">过渡内容</div>
</transition>
```

```css
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
```

过渡类名示意图：
```
进入过渡:
fade-enter → fade-enter-active → fade-enter-to

离开过渡:  
fade-leave → fade-leave-active → fade-leave-to
```

### CSS 过渡类名

```html
<transition
  name="custom-classes-transition"
  enter-active-class="animated tada"
  leave-active-class="animated bounceOut"
>
  <div v-if="show">动画内容</div>
</transition>
```

### JavaScript 钩子

```html
<transition
  @before-enter="beforeEnter"
  @enter="enter"
  @after-enter="afterEnter"
  @enter-cancelled="enterCancelled"
  @before-leave="beforeLeave"
  @leave="leave"
  @after-leave="afterLeave"
  @leave-cancelled="leaveCancelled"
>
  <div v-if="show">钩子动画</div>
</transition>
```

```javascript
export default {
  methods: {
    beforeEnter(el) {
      el.style.opacity = 0
    },
    enter(el, done) {
      // 使用 Velocity.js 或其他动画库
      Velocity(el, { opacity: 1 }, { duration: 500, complete: done })
    },
    afterEnter(el) {
      console.log('进入动画完成')
    }
  }
}
```

### 过渡模式

```html
<!-- 默认模式：进入和离开同时发生 -->
<transition>
  <button :key="isEditing" @click="isEditing = !isEditing">
    {{ isEditing ? '保存' : '编辑' }}
  </button>
</transition>

<!-- 先出后进 -->
<transition mode="out-in">
  <button :key="isEditing" @click="isEditing = !isEditing">
    {{ isEditing ? '保存' : '编辑' }}
  </button>
</transition>

<!-- 先进后出 -->
<transition mode="in-out">
  <button :key="isEditing" @click="isEditing = !isEditing">
    {{ isEditing ? '保存' : '编辑' }}
  </button>
</transition>
```

模式对比：
```
默认: 进入离开同时执行
out-in: 旧元素先离开 → 新元素再进入  
in-out: 新元素先进入 → 旧元素再离开
```

## transition-group 组件

为多个元素/组件提供过渡效果，列表渲染时特别有用。

### 列表过渡

```html
<transition-group name="list" tag="ul">
  <li v-for="item in items" :key="item.id">
    {{ item.text }}
    <button @click="removeItem(item)">×</button>
  </li>
</transition-group>
```

```css
.list-enter-active, .list-leave-active {
  transition: all 0.5s;
}
.list-enter, .list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
.list-leave-active {
  position: absolute;
}
```

### 排序过渡

```html
<transition-group name="flip-list" tag="div" class="item-container">
  <div v-for="item in items" :key="item.id" class="item">
    {{ item.text }}
  </div>
</transition-group>
```

```css
.flip-list-move {
  transition: transform 0.5s;
}
.item-container {
  position: relative;
}
.item {
  margin: 10px;
}
```

## keep-alive 组件

缓存不活动的组件实例，避免重新渲染。

### 基本用法

```html
<keep-alive>
  <component :is="currentComponent"></component>
</keep-alive>
```

### 包含/排除特定组件

```html
<!-- 只缓存指定组件 -->
<keep-alive include="Home,About">
  <component :is="currentComponent"></component>
</keep-alive>

<!-- 排除指定组件 -->
<keep-alive exclude="Contact">
  <component :is="currentComponent"></component>
</keep-alive>

<!-- 使用正则表达式 -->
<keep-alive :include="/Home|About/">
  <component :is="currentComponent"></component>
</keep-alive>
```

### 最大缓存实例数

```html
<keep-alive :max="10">
  <component :is="currentComponent"></component>
</keep-alive>
```

### 生命周期钩子

被 keep-alive 缓存的组件会触发 activated 和 deactivated 钩子。

```javascript
export default {
  name: 'CachedComponent',
  activated() {
    console.log('组件被激活')
    this.startPolling() // 恢复轮询等操作
  },
  deactivated() {
    console.log('组件被停用')  
    this.stopPolling() // 停止轮询等操作
  },
  methods: {
    startPolling() {
      this.timer = setInterval(() => {
        this.fetchData()
      }, 5000)
    },
    stopPolling() {
      clearInterval(this.timer)
    },
    fetchData() {
      // 获取数据
    }
  }
}
```

keep-alive 缓存机制：
```
组件首次渲染 → 创建实例并缓存
组件切换离开 → 停用并保留在缓存
组件再次使用 → 从缓存激活实例
缓存数量超限 → 销毁最久未使用的实例
```

## slot 组件

内容分发插槽，用于组件内容定制。

### 默认插槽

```html
<!-- 子组件 -->
<div class="container">
  <h2>标题</h2>
  <slot>默认内容</slot>
</div>

<!-- 父组件使用 -->
<child-component>
  这是插入的内容
</child-component>
```

### 具名插槽

```html
<!-- 子组件 -->
<div class="layout">
  <header>
    <slot name="header"></slot>
  </header>
  <main>
    <slot></slot>
  </main>
  <footer>
    <slot name="footer"></slot>
  </footer>
</div>

<!-- 父组件使用 -->
<layout-component>
  <template v-slot:header>
    <h1>页面标题</h1>
  </template>
  
  <p>主要内容</p>
  
  <template v-slot:footer>
    <p>版权信息</p>
  </template>
</layout-component>
```

### 作用域插槽

```html
<!-- 子组件 -->
<ul>
  <li v-for="item in items" :key="item.id">
    <slot :item="item" :index="index">
      {{ item.name }}
    </slot>
  </li>
</ul>

<!-- 父组件使用 -->
<item-list :items="items">
  <template v-slot:default="slotProps">
    <span class="item">{{ slotProps.item.name }}</span>
    <span class="index">({{ slotProps.index }})</span>
  </template>
</item-list>
```

## 内置组件组合使用

### 复杂过渡场景

```html
<transition-group name="list" tag="div">
  <keep-alive v-for="item in activeItems" :key="item.id">
    <component :is="item.component" :data="item.data"></component>
  </keep-alive>
</transition-group>
```

### 路由过渡

```html
<transition :name="transitionName">
  <keep-alive>
    <router-view></router-view>
  </keep-alive>
</transition>
```

```javascript
export default {
  data() {
    return {
      transitionName: 'slide-left'
    }
  },
  watch: {
    '$route'(to, from) {
      const toDepth = to.path.split('/').length
      const fromDepth = from.path.split('/').length
      this.transitionName = toDepth < fromDepth ? 'slide-right' : 'slide-left'
    }
  }
}
```

```css
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.5s;
}
.slide-left-enter {
  transform: translateX(100%);
}
.slide-left-leave-to {
  transform: translateX(-100%);
}
.slide-right-enter {
  transform: translateX(-100%);
}
.slide-right-leave-to {
  transform: translateX(100%);
}
```

## 性能优化提示

### keep-alive 最佳实践

```html
<!-- 合理设置最大缓存数 -->
<keep-alive :max="5">
  <router-view></router-view>
</keep-alive>

<!-- 只缓存必要的组件 -->
<keep-alive :include="['Home', 'UserProfile']">
  <router-view></router-view>
</keep-alive>
```

### 过渡性能优化

```css
/* 使用 transform 和 opacity 实现动画，性能更好 */
.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* 启用硬件加速 */
.optimized-transition {
  transform: translateZ(0);
  will-change: transform;
}
```

### 列表渲染优化

```html
<transition-group name="list" tag="div">
  <div 
    v-for="item in visibleItems" 
    :key="item.id"
    class="list-item"
  >
    {{ item.name }}
  </div>
</transition-group>
```

```javascript
export default {
  computed: {
    // 只渲染可见项，提高性能
    visibleItems() {
      return this.items.slice(this.startIndex, this.endIndex)
    }
  }
}
```

## 内置组件使用场景总结

```
component: 动态组件切换，标签页，多步骤表单
transition: 单个元素显示隐藏动画，路由过渡
transition-group: 列表项动画，排序动画，购物车
keep-alive: 标签页缓存，表单状态保持，路由缓存
slot: 组件内容定制，布局组件，高阶组件
```