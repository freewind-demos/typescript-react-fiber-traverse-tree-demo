import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Card, Button, Typography, List, message } from 'antd';
import { getTargetFiberRoot, traverseFiberTree, getComponentName } from '../shared/fiber-utils';

const { Title, Text } = Typography;

interface TreeNode {
  name: string;
  type: string;
  children: TreeNode[];
}

function ControllerApp() {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);

  /**
   * 遍历整个 Fiber 树
   *
   * 原理说明：
   * Fiber 树是链表结构，不是传统数组：
   * - child: 指向第一个子节点
   * - sibling: 指向下一个兄弟节点
   * - return: 指向父节点
   *
   * 遍历顺序是深度优先（DFS）：
   * 1. 从根节点开始
   * 2. 访问当前节点
   * 3. 递归访问子节点
   * 4. 子节点访问完后，访问兄弟节点
   *
   * 这种遍历方式可以：
   * - 查看所有渲染的组件
   * - 了解组件的层次结构
   * - 找到特定类型的组件
   */
  const handleTraverse = () => {
    const rootFiber = getTargetFiberRoot();
    if (!rootFiber) {
      message.error('找不到 fiber 根节点');
      return;
    }

    const result: TreeNode[] = [];

    /**
     * 使用 traverseFiberTree 遍历所有 Fiber 节点
     * 回调函数会对每个 Fiber 节点执行
     */
    traverseFiberTree(rootFiber, (fiber) => {
      // 获取组件/元素的名称
      const name = fiber.type ? getComponentName(fiber.type) : null;
      // 获取类型：'Component' 表示 React 组件，'div'/'button' 等表示 DOM 元素
      const typeStr = fiber.type ? (typeof fiber.type === 'string' ? fiber.type : 'Component') : 'unknown';

      // 只保留有名称的节点，并且去重
      if (name && !result.find(r => r.name === name)) {
        result.push({
          name,
          type: typeStr,
          children: []
        });
      }
    });

    setTreeData(result);
    message.success(`遍历完成，找到 ${result.length} 个组件`);
  };

  return (
    <div>
      <Title level={2}>控制面板</Title>
      <Text type="secondary">遍历整个 Fiber 树，查看所有组件</Text>

      <Card title="操作" style={{ marginTop: 16 }}>
        <Button type="primary" onClick={handleTraverse}>
          遍历 Fiber 树
        </Button>
      </Card>

      {treeData.length > 0 && (
        <Card title={`组件列表 (${treeData.length})`} style={{ marginTop: 16 }}>
          <List
            size="small"
            dataSource={treeData}
            renderItem={(item) => (
              <List.Item>
                <Text strong>{item.name}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>({item.type})</Text>
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}

const controllerRootElement = document.getElementById('controller-root');
if (controllerRootElement) {
  const root = createRoot(controllerRootElement);
  root.render(<ControllerApp />);
}
