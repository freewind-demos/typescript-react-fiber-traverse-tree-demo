export interface Fiber {
  return?: Fiber;
  child?: Fiber;
  sibling?: Fiber;
  stateNode?: unknown;
  type?: unknown;
  memoizedProps?: Record<string, unknown>;
  pendingProps?: Record<string, unknown>;
  memoizedState?: unknown;
  updateQueue?: unknown;
  flags?: number;
  effectTag?: number;
  alternate?: Fiber;
  index?: number;
  key?: string | null;
}

export function findFiberByDomElement(domElement: Element): Fiber | null {
  const fiberKey = Object.keys(domElement).find(k => k.startsWith('__reactFiber'));
  if (fiberKey) return (domElement as any)[fiberKey];

  const containerKey = Object.keys(domElement).find(k => k.startsWith('__reactContainer'));
  if (containerKey) {
    const container = (domElement as any)[containerKey];
    if (container?._internalRoot) return container._internalRoot.current;
    if (container?.current) return container.current;
  }

  let current: Element | null = domElement;
  while (current) {
    const keys = Object.keys(current);
    for (const key of keys) {
      if (key.includes('reactFiber') || key.includes('reactRoot')) {
        const fiber = (current as any)[key];
        if (fiber?._internalRoot) return fiber._internalRoot.current;
        if (fiber?.current) return fiber.current;
      }
    }
    current = current.parentElement;
  }
  return null;
}

export function findFiberByComponentName(rootFiber: Fiber | null, componentName: string): Fiber | null {
  if (!rootFiber) return null;

  if (rootFiber.type) {
    const typeName = getComponentName(rootFiber.type);
    if (typeName?.toLowerCase() === componentName.toLowerCase()) return rootFiber;
  }

  let child = rootFiber.child;
  while (child) {
    const result = findFiberByComponentName(child, componentName);
    if (result) return result;
    child = child.sibling;
  }
  return null;
}

export function getComponentName(type: unknown): string | null {
  if (!type) return null;
  if (typeof type === 'function') {
    return (type as any).displayName || (type as any).name || null;
  }
  if (typeof type === 'string') return type;
  return null;
}

export function traverseFiberTree(rootFiber: Fiber | null, callback: (fiber: Fiber) => boolean | void): void {
  if (!rootFiber) return;
  function traverse(fiber: Fiber) {
    if (!fiber) return;
    const shouldStop = callback(fiber);
    if (shouldStop === true) return;
    if (fiber.child) traverse(fiber.child);
    if (fiber.sibling) traverse(fiber.sibling);
  }
  traverse(rootFiber);
}

function safeGetObjectInfo(obj: unknown): string {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj === 'function') return `function: ${(obj as any).name || 'anonymous'}`;
  if (typeof obj !== 'object') return String(obj);
  if (Array.isArray(obj)) return `[Array:${obj.length}]`;
  try {
    const keys = Object.keys(obj as object).slice(0, 5);
    return keys.map(k => `${k}: <object>`).join(', ');
  } catch { return '<cannot read>'; }
}

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

export function getTargetFiberRoot(): Fiber | null {
  const targetRoot = (window as any).__targetRootElement;
  if (!targetRoot) return null;

  // Try to find fiber from the container element or its children
  const keys = Object.keys(targetRoot);
  for (const key of keys) {
    if (key.includes('reactRoot') || key.includes('Container')) {
      const value = (targetRoot as any)[key];
      if (value?._internalRoot) return value._internalRoot.current;
      if (value?.current) return value.current;
    }
  }

  // Try from children
  if (targetRoot.children?.length > 0) {
    for (const child of targetRoot.children) {
      const childFiber = findFiberByDomElement(child);
      if (childFiber) return childFiber;
    }
  }

  return null;
}
