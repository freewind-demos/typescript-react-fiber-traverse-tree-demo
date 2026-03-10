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

  const handleTraverse = () => {
    const rootFiber = getTargetFiberRoot();
    if (!rootFiber) {
      message.error('找不到 fiber 根节点');
      return;
    }

    const result: TreeNode[] = [];

    traverseFiberTree(rootFiber, (fiber) => {
      const name = fiber.type ? getComponentName(fiber.type) : null;
      const typeStr = fiber.type ? (typeof fiber.type === 'string' ? fiber.type : 'Component') : 'unknown';

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
