# DOM 操作

在 Web 开发中，通过对 DOM 元素的操作，我们可以修改页面内容、样式、结构以及响应用户行为。

## 获取 DOM

### 传统方法

| 代码                                                         | DOM 举例                      | 返回值                   |
| ------------------------------------------------------------ | ----------------------------- | ------------------------ |
| `document.getElementById('myId')`                            | `<div id="myId"></div>`       | DOM  \| `null`           |
| `document.getElementsByClassName('myClass')`                 | `<div class="myClass"></div>` | HTMLCollection \| `null` |
| `document.getElementsByName('myName')`                       | `<input name="myName" />`     | NodeList \| `null`       |
| `document.getElementsByTagName('div')`                       | `<div></div>`                 | HTMLCollection \| `null` |
| `document.getElementsByTagNameNS('http://www.w3.org/2000/svg', 'rect')` | `<svg><rect></rect></svg>`    | NodeList \| `null`       |

说明：

- `HTMLCollection`：元素的类数组，仅包含元素节点
- `NodeList`：节点的类数组，可能包含元素节点、文本节点等
- `类数组`：含有 `length`、`0~(length-1)` 属性的对象，但是没有数组的 `push`、`pop` 等方法，如 `{ length:2, 0: 0, 1: 1 }`



### querySelector, querySelectorAll

上述方法每次只能通过一种选择器来获取 DOM，复杂难用，因此更简便的 API 被推出了。

| 代码                               | DOM 举例                 | 返回值                        |
| ---------------------------------- | ------------------------ | ----------------------------- |
| `document.querySelector('div')`    | `<div></div>`            | Node \| `null` (第一个节点)   |
| `document.querySelectorAll('div')` | `<div></div><div></div>` | NodeList\| `null`  (所有节点) |

`querySelector`、`querySelectorAll` 的参数都是 [selector (css 选择器)](/basic/css/selector.html)，有以下类型的值：

| 选择器类型           | 选择器语法             | 选择器示例       | 对应DOM举例                          |
| -------------------- | ---------------------- | ---------------- | ------------------------------------ |
| **元素**       | `element`              | `div`            | `<div></div>`                        |
| **类**         | `.class-name`          | `.class1`        | `<div class="class1"></div>`         |
| **ID**         | `#id-name`             | `#id1`           | `<div id="id1"></div>`               |
| **通配**     | `*`                    | `*`              | `<div></div>`                        |
| **属性**       | `[attr]`          | `[attr]`     | `<div attr></div>`               |
| **属性-值** | `[attr="value"]`  | `[attr="a"]` | `<div attr="a"></div>`           |
| **伪类**       | `:pseudo-class`        | `:hover`         | `<a></a>`  (鼠标放上时)              |
| **伪元素**     | `::pseudo-element`     | `::after`        | `<p></p>` (p的`::after`元素)         |
| **后代**       | `ancestor descendant`  | `div p`          | `<div><p></p></div>` (选中`p`)       |
| **子元素**     | `parent > child`       | `div > p`        | `<div><p></p></div>`(选中`p`)        |
| **相邻兄弟**   | `previous + next`      | `div + p`        | `<div></div><p></p>`(选中`p`)        |
| **通用兄弟**   | `previous ~ siblings`  | `div ~ p`        | `<div></div><p></p><p></p>`(选中`p`) |
| **并列**       | `selector1, selector2` | `div, p`         | `<div></div><p></p>` |



### 节点关系选择

```javascript
const parent = element.parentNode // 父节点
const children = element.childNodes // 所有子节点
const firstChild = element.firstChild // 第一个子节点
const lastChild = element.lastChild // 最后一个子节点
const next = element.nextSibling // 下一个兄弟节点
const prev = element.previousSibling // 上一个兄弟节点
```

## 内容修改

### innerHTML

```javascript
// 获取HTML内容
const htmlContent = element.innerHTML

// 设置HTML内容（会解析HTML标签）
element.innerHTML = '<strong>新内容</strong>'

// 清空元素内容
element.innerHTML = ''

// 追加内容
element.innerHTML += '<span>追加的内容</span>'
```

### textContent vs innerText

```javascript
// textContent - 获取所有文本内容，包括隐藏元素
const text = element.textContent

// innerText - 只获取可见文本，考虑CSS样式
const visibleText = element.innerText

// 设置文本内容（不会解析HTML）
element.textContent = '纯文本内容'
element.innerText = '可见文本内容'

// 差异示例
;<div id="demo">
  文本内容
  <span style="display:none">隐藏文本</span>
</div>

console.log(demo.textContent) // "文本内容 隐藏文本"
console.log(demo.innerText) // "文本内容"
```

## 属性操作

### 基本属性操作

```javascript
// 获取属性
const value = element.getAttribute('data-custom')

// 设置属性
element.setAttribute('data-custom', 'new-value')

// 移除属性
element.removeAttribute('data-custom')

// 检查属性是否存在
const hasAttr = element.hasAttribute('data-custom')
```

### 数据集操作 (data-\* 属性)

```javascript
// HTML: <div id="user" data-user-id="123" data-user-role="admin">
const userDiv = document.getElementById('user')

// 访问data属性
console.log(userDiv.dataset.userId) // "123"
console.log(userDiv.dataset.userRole) // "admin"

// 设置data属性
userDiv.dataset.userStatus = 'active'
```

### 标准属性直接访问

```javascript
// 直接访问标准属性
element.id = 'newId'
element.className = 'new-class'
element.title = '新标题'
element.src = 'image.jpg'
```

## 样式控制

### className

```javascript
// 获取class
const classes = element.className

// 设置class（会覆盖原有class）
element.className = 'class1 class2'

// 添加class（不覆盖）
element.className += ' new-class'
```

### classList (推荐使用)

```javascript
// 添加class
element.classList.add('new-class')

// 移除class
element.classList.remove('old-class')

// 切换class
element.classList.toggle('active')

// 检查是否包含class
if (element.classList.contains('active')) {
  // 执行操作
}

// 替换class
element.classList.replace('old-class', 'new-class')
```

### style 属性

```javascript
// 设置单个样式
element.style.color = 'red'
element.style.backgroundColor = '#fff'
element.style.fontSize = '16px'

// 批量设置样式
element.style.cssText = 'color: red; background: blue;'

// 获取计算后的样式
const computedStyle = window.getComputedStyle(element)
const color = computedStyle.color
```

## 创建新元素

### createElement

```javascript
// 创建新元素
const newDiv = document.createElement('div')
const newButton = document.createElement('button')

// 设置属性
newDiv.id = 'new-element'
newDiv.className = 'container'

// 创建文本节点
const textNode = document.createTextNode('这是文本内容')

// 将文本节点添加到元素
newDiv.appendChild(textNode)
```

### 创建复杂结构

```javascript
// 创建列表项
function createListItem(text) {
  const li = document.createElement('li')
  li.className = 'list-item'
  li.textContent = text
  return li
}

// 使用
const listItem = createListItem('项目内容')
```

## 添加节点

### appendChild

```javascript
// 添加到父元素的末尾
const parent = document.getElementById('parent')
const newChild = document.createElement('div')
parent.appendChild(newChild)

// 示例：动态创建列表
const ul = document.createElement('ul')
;['项目1', '项目2', '项目3'].forEach((text) => {
  const li = document.createElement('li')
  li.textContent = text
  ul.appendChild(li)
})
document.body.appendChild(ul)
```

### insertBefore

```javascript
// 在指定节点前插入
const parent = document.getElementById('parent')
const newElement = document.createElement('div')
const referenceElement = document.getElementById('reference')

parent.insertBefore(newElement, referenceElement)

// 如果没有referenceElement，则添加到末尾（等同于appendChild）
parent.insertBefore(newElement, null)
```

### 其他插入方法

```javascript
// insertAdjacentHTML - 强大的HTML插入方法
element.insertAdjacentHTML('beforebegin', '<div>在前面插入</div>') // 元素之前
element.insertAdjacentHTML('afterbegin', '<div>在开头插入</div>') // 元素内部开头
element.insertAdjacentHTML('beforeend', '<div>在末尾插入</div>') // 元素内部末尾
element.insertAdjacentHTML('afterend', '<div>在后面插入</div>') // 元素之后
```

## 删除节点

### removeChild

```javascript
// 删除子节点
const parent = document.getElementById('parent')
const child = document.getElementById('child')

parent.removeChild(child)

// 安全删除（检查是否存在）
if (parent.contains(child)) {
  parent.removeChild(child)
}
```

### 现代删除方法

```javascript
// remove() 方法 - 更简洁
const element = document.getElementById('to-remove')
element.remove()

// 批量删除
const elementsToRemove = document.querySelectorAll('.remove-me')
elementsToRemove.forEach((element) => element.remove())
```

### 清空所有子节点

```javascript
// 方法1: innerHTML
element.innerHTML = ''

// 方法2: 循环删除
while (element.firstChild) {
  element.removeChild(element.firstChild)
}

// 方法3: 现代方式
element.replaceChildren()
```

## 替换与克隆节点

### replaceChild

```javascript
// 替换子节点
const parent = document.getElementById('parent')
const oldChild = document.getElementById('old-child')
const newChild = document.createElement('div')

parent.replaceChild(newChild, oldChild)

// 现代替换方法
oldChild.replaceWith(newChild)
```

### cloneNode

```javascript
// 浅克隆（不克隆子节点）
const original = document.getElementById('original')
const shallowClone = original.cloneNode(false)

// 深克隆（克隆所有子节点）
const deepClone = original.cloneNode(true)

// 使用克隆
deepClone.id = 'cloned-element' // 避免ID重复
parent.appendChild(deepClone)
```

1. **缓存 DOM 查询**：避免重复查询相同的元素
2. **批量操作**：使用 DocumentFragment 进行批量 DOM 操作
3. **事件委托**：对动态内容使用事件委托
4. **避免重排**：尽量减少会引发重排的操作
5. **使用现代 API**：优先使用 classList、dataset 等现代 API

```javascript
// 优化示例：使用DocumentFragment
const fragment = document.createDocumentFragment()
for (let i = 0; i < 100; i++) {
  const li = document.createElement('li')
  li.textContent = `项目 ${i}`
  fragment.appendChild(li)
}
document.getElementById('list').appendChild(fragment)
```

掌握这些 DOM 操作方法，你就能够创建丰富、动态的网页交互效果。记住在实践中不断练习，才能更好地理解和运用这些技术！
