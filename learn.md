# Fiber 树的结构：链表遍历详解

> 这篇文章讲解 React Fiber 的链表结构。理解这个结构是掌握 Fiber 遍历的基础。

## 什么是链表结构？

Fiber 树和普通的树结构不同，它是用链表实现的。理解这个结构是掌握 Fiber 操作的关键。

## 链表的三根"指针"

每个 Fiber 节点有三个重要的属性，用来连接其他节点：

**child - 指向第一个子节点**

如果一个组件有多个子组件，child 只指向第一个。其他的子组件通过 sibling 来访问。

**sibling - 指向下一个兄弟节点**

同一个父节点下的子节点，通过 sibling 连成一条链。

**return - 指向父节点**

这个属性让子节点可以找到它的父亲。

## 图解链表结构

假设我们有这样一个组件结构：

```
App
├── Header
│   ├── Logo
│   └── Nav
├── Content
│   ├── Post
│   └── Sidebar
└── Footer
```

对应的 Fiber 链表结构是这样的：

```
App
└── child → Header
            ├── child → Logo
            ├── sibling → Nav
            └── return → App
                     └── sibling → Content
                                 ├── child → Post
                                 ├── sibling → Sidebar
                                 └── return → App
                                          └── sibling → Footer
```

注意看，Header、Content、Footer 是兄弟节点，通过 App 的 child 和它们的 sibling 连接。Nav 是 Header 的第二个子节点，和 Logo 通过 sibling 连接。

这就是链表的特点：不直接保存所有子节点，而是通过第一个子节点 + 兄弟节点的方式连接。

## 遍历整个 Fiber 树

因为是链表结构，遍历 Fiber 树需要用递归的方式：

```javascript
function traverseFiberTree(rootFiber, callback) {
  function traverse(fiber) {
    if (!fiber) return;

    // 处理当前节点
    callback(fiber);

    // 先遍历子节点
    if (fiber.child) {
      traverse(fiber.child);
    }

    // 子节点遍历完后，遍历兄弟节点
    if (fiber.sibling) {
      traverse(fiber.sibling);
    }
  }

  traverse(rootFiber);
}
```

这种遍历顺序叫做"深度优先遍历"。先一条道走到黑（child），走不通了再换条道（sibling）。

## 为什么要用链表？

React 16 之前的版本用的是递归遍历。递归虽然简单，但有一个大问题：一旦开始渲染，就必须全部完成，中间无法中断。

这会导致什么问题呢？如果页面很复杂，渲染一个大的组件树可能需要很长时间。在这期间，浏览器无法响应用户的其他操作，页面会卡住。

Fiber 的链表结构让"可中断渲染"成为可能。React 可以把渲染工作拆分成小任务，每个任务完成后可以暂停，去处理用户的其他操作，然后再继续。

这就是为什么叫"Fiber"——纤维化就是将工作拆分成小单元的意思。

## 实战：列出所有组件

理解了遍历方法，我们就可以实现一些有用的功能：

```javascript
function listAllComponents(rootFiber) {
  const components = [];

  traverseFiberTree(rootFiber, (fiber) => {
    if (fiber.type) {
      const name = typeof fiber.type === 'function'
        ? (fiber.type.displayName || fiber.type.name)
        : fiber.type;
      if (name) {
        components.push(name);
      }
    }
  });

  return components;
}
```

这个函数可以列出页面上所有的 React 组件。

## 总结

Fiber 树不是普通的树，而是用链表实现的：

- child 指向第一个子节点
- sibling 指向下一个兄弟节点
- return 指向父节点

这种结构让 React 可以暂停和恢复渲染，实现了自己的调度系统。
