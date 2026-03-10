# React Fiber 遍历 Fiber 树 Demo

## 概述

本 Demo 展示如何**遍历整个 Fiber 树**，查看所有组件。

## 场景

- **左侧**：目标应用
- **右侧**：控制面板

## 核心原理

Fiber 树是链表结构：
- `child`: 指向第一个子节点
- `sibling`: 指向下一个兄弟节点
- `return`: 指向父节点

```typescript
function traverseFiberTree(rootFiber, callback) {
  function traverse(fiber) {
    callback(fiber);
    if (fiber.child) traverse(fiber.child);
    if (fiber.sibling) traverse(fiber.sibling);
  }
  traverse(rootFiber);
}
```

## 运行

```bash
pnpm install
pnpm start
```

## 功能

点击"遍历 Fiber 树"按钮，显示所有组件列表。
