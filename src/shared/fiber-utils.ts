/**
 * React Fiber 类型定义
 *
 * React Fiber 是 React 16+ 的核心架构，它将原本的递归渲染改为可中断的链表结构。
 * 每个被渲染的 DOM 元素都对应着一个 Fiber 节点，这些节点通过 child、sibling、return
 * 属性连接成树形结构。
 *
 * 重要提示：以下代码使用了 React 内部实现细节，属于"黑科技"，可能在不同 React 版本中失效。
 * React 官方并未公开这些 API，仅用于调试和特殊场景。
 */
export interface Fiber {
  /** 指向父 Fiber 节点 */
  return?: Fiber;
  /** 指向第一个子 Fiber 节点 */
  child?: Fiber;
  /** 指向下一个兄弟 Fiber 节点 */
  sibling?: Fiber;
  /** 对应的 DOM 节点或组件实例 */
  stateNode?: unknown;
  /** Fiber 的类型：
   * - 函数组件：指向函数本身
   * - 类组件：指向类构造函数
   * - HTML 元素：指向字符串如 'div', 'span' 等
   */
  type?: unknown;
  /** 已经完成渲染的 props（用于对比是否需要更新） */
  memoizedProps?: Record<string, unknown>;
  /** 正在处理的 props（即将生效） */
  pendingProps?: Record<string, unknown>;
  /** 已经完成渲染的 state */
  memoizedState?: unknown;
  /** 更新队列，存储待处理的 state 和 props 变化 */
  updateQueue?: unknown;
  /** 副作用标记，用于标识需要执行的 DOM 操作 */
  flags?: number;
  effectTag?: number;
  /** 替代 Fiber，用于并发更新时的双缓冲机制 */
  alternate?: Fiber;
  /** 在兄弟节点中的索引 */
  index?: number;
  /** React key，用于列表渲染时的 Diff 算法 */
  key?: string | null;
}

/**
 * 从 DOM 元素找到对应的 Fiber 节点
 *
 * 原理说明：
 * React 在渲染 DOM 元素时，会在 DOM 元素上附加一个特殊的属性来存储对应的 Fiber 节点引用。
 * 这个属性的命名规则是：__reactFiber${随机字符串} 或 __reactContainer${随机字符串}
 *
 * 适配说明：
 * - React 17: 使用 __reactFiber${random} 格式
 * - React 18+: 使用 __reactContainer${random} 或 _internalRoot
 *
 * 注意：这是一个 Hack，依赖 React 内部实现，不同版本可能失效
 *
 * @param domElement - DOM 元素
 * @returns 对应的 Fiber 节点，如果没有找到则返回 null
 */
export function findFiberByDomElement(domElement: Element): Fiber | null {
  // 方法1：尝试从 DOM 元素本身获取 Fiber（React 17 方式）
  // React 17 会将 Fiber 引用直接附加到 DOM 元素上，属性名类似 __reactFiber$xxx
  const fiberKey = Object.keys(domElement).find(k => k.startsWith('__reactFiber'));
  if (fiberKey) return (domElement as any)[fiberKey];

  // 方法2：尝试获取 React 18+ 的容器（__reactContainer 格式）
  const containerKey = Object.keys(domElement).find(k => k.startsWith('__reactContainer'));
  if (containerKey) {
    const container = (domElement as any)[containerKey];
    // React 18+ 使用 _internalRoot 存储根 Fiber
    if (container?._internalRoot) return container._internalRoot.current;
    if (container?.current) return container.current;
  }

  // 方法3：向上遍历 DOM 树，从父元素查找 Fiber
  // 这是因为某些情况下 Fiber 可能附加在父元素上
  let current: Element | null = domElement;
  while (current) {
    const keys = Object.keys(current);
    for (const key of keys) {
      // 匹配各种可能的 React 属性名格式
      if (key.includes('reactFiber') || key.includes('reactRoot')) {
        const fiber = (current as any)[key];
        // React 18+
        if (fiber?._internalRoot) return fiber._internalRoot.current;
        // React 17 或更早版本
        if (fiber?.current) return fiber.current;
      }
    }
    current = current.parentElement;
  }
  return null;
}

/**
 * 通过组件名称查找 Fiber 节点
 *
 * 原理说明：
 * 使用深度优先搜索（DFS）遍历 Fiber 树，检查每个节点的 type 是否匹配目标组件名。
 * 组件名可以通过以下方式获取：
 * 1. 函数/类组件的 displayName 属性（优先使用）
 * 2. 函数/类组件的 name 属性（函数名）
 * 3. HTML 元素直接使用标签名
 *
 * @param rootFiber - Fiber 树根节点
 * @param componentName - 要查找的组件名称（不区分大小写）
 * @returns 找到的 Fiber 节点，如果未找到则返回 null
 */
export function findFiberByComponentName(rootFiber: Fiber | null, componentName: string): Fiber | null {
  if (!rootFiber) return null;

  // 检查当前节点是否匹配
  if (rootFiber.type) {
    const typeName = getComponentName(rootFiber.type);
    if (typeName?.toLowerCase() === componentName.toLowerCase()) return rootFiber;
  }

  // 深度优先遍历：先检查子节点
  let child = rootFiber.child;
  while (child) {
    const result = findFiberByComponentName(child, componentName);
    if (result) return result;
    // 子节点遍历完后，检查兄弟节点
    child = child.sibling;
  }
  return null;
}

/**
 * 获取组件/元素的显示名称
 *
 * 原理说明：
 * - 函数组件：优先使用 displayName，其次使用函数名（name）
 * - 类组件：同样优先 displayName
 * - HTML 元素：直接返回标签名（如 'div', 'span'）
 *
 * 重要提示：
 * 生产环境下代码压缩后，函数名会被替换为短字符（如 a, b, c），
 * 此时只能依赖 displayName。如果组件未设置 displayName 且在生产环境，
 * 可能无法通过名称找到组件。
 *
 * @param type - Fiber 的 type 属性
 * @returns 组件的显示名称，如果没有则返回 null
 */
export function getComponentName(type: unknown): string | null {
  if (!type) return null;

  // 函数组件或类组件
  if (typeof type === 'function') {
    // displayName 优先级最高，通常在开发环境可用
    // 生产环境下可能被压缩掉，或者开发者未设置
    return (type as any).displayName || (type as any).name || null;
  }

  // HTML 原生元素（div, span, button 等）
  if (typeof type === 'string') return type;

  return null;
}

/**
 * 遍历整个 Fiber 树
 *
 * 原理说明：
 * Fiber 树是链表结构，不是传统数组：
 * - child: 指向第一个子节点
 * - sibling: 指向下一个兄弟节点
 * - return: 指向父节点
 *
 * 遍历顺序：深度优先，先子后兄弟
 *
 * @param rootFiber - 根 Fiber 节点
 * @param callback - 对每个 Fiber 节点执行的回调函数，返回 true 可停止遍历
 */
export function traverseFiberTree(rootFiber: Fiber | null, callback: (fiber: Fiber) => boolean | void): void {
  if (!rootFiber) return;

  function traverse(fiber: Fiber) {
    if (!fiber) return;

    const shouldStop = callback(fiber);
    // 如果回调返回 true，停止遍历
    if (shouldStop === true) return;

    // 继续遍历子节点
    if (fiber.child) traverse(fiber.child);
    // 子节点遍历完后，遍历兄弟节点
    if (fiber.sibling) traverse(fiber.sibling);
  }

  traverse(rootFiber);
}

/**
 * 安全地获取对象信息（避免循环引用导致 JSON.stringify 失败）
 *
 * 原理说明：
 * Fiber 节点包含大量复杂的引用对象，直接序列化会失败（Maximum call stack exceeded）。
 * 这个函数尝试提取对象的基本信息，用于调试展示。
 *
 * @param obj - 任意对象
 * @returns 对象的字符串描述
 */
function safeGetObjectInfo(obj: unknown): string {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj === 'function') return `function: ${(obj as any).name || 'anonymous'}`;
  if (typeof obj !== 'object') return String(obj);
  if (Array.isArray(obj)) return `[Array:${obj.length}]`;
  try {
    // 只展示前5个键，避免输出过长
    const keys = Object.keys(obj as object).slice(0, 5);
    return keys.map(k => `${k}: <object>`).join(', ');
  } catch { return '<cannot read>'; }
}

/**
 * 获取 Fiber 节点的详细信息
 *
 * 用于调试和展示组件状态
 *
 * @param fiber - Fiber 节点
 * @returns 包含组件名、类型、props、state 等信息
 */
export function getFiberInfo(fiber: Fiber) {
  const name = fiber.type ? getComponentName(fiber.type) : 'unknown';
  const typeStr = fiber.type ? (typeof fiber.type === 'string' ? fiber.type : 'Component') : 'unknown';
  return {
    name: name || 'anonymous',
    type: typeStr,
    props: safeGetObjectInfo(fiber.memoizedProps),
    memoizedState: safeGetObjectInfo(fiber.memoizedState),
  };
}

/**
 * 获取目标应用的 Fiber 根节点
 *
 * 原理说明：
 * 我们通过 window.__targetRootElement 获取目标应用的根 DOM 元素，
 * 然后从中解析出 Fiber 根节点。
 *
 * 这里使用了一个技巧：因为两个 React 应用在同一个页面中各自有独立的根节点，
 * 我们通过将目标应用的根 DOM 元素保存到 window 上，使得控制面板可以访问它。
 *
 * @returns 目标应用的根 Fiber 节点
 */
export function getTargetFiberRoot(): Fiber | null {
  // 获取在 target/main.tsx 中保存的根 DOM 元素引用
  const targetRoot = (window as any).__targetRootElement;
  if (!targetRoot) return null;

  // 尝试从根元素获取 Fiber（React 18+ 方式）
  const keys = Object.keys(targetRoot);
  for (const key of keys) {
    if (key.includes('reactRoot') || key.includes('Container')) {
      const value = (targetRoot as any)[key];
      if (value?._internalRoot) return value._internalRoot.current;
      if (value?.current) return value.current;
    }
  }

  // 如果根元素没有，尝试从子元素中查找
  // React 可能在子元素上附加 Fiber 引用
  if (targetRoot.children?.length > 0) {
    for (const child of targetRoot.children) {
      const childFiber = findFiberByDomElement(child);
      if (childFiber) return childFiber;
    }
  }

  return null;
}
