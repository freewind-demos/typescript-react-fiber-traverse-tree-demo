import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Card, Typography, Space, Flex } from 'antd';

const { Title, Text } = Typography;

const Counter: React.FC<{ initialCount?: number }> = ({ initialCount = 0 }) => {
  const [count, setCount] = useState(initialCount);

  return (
    <Card title="计数器 (Counter)" style={{ marginBottom: 16 }}>
      <Flex vertical style={{ width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>{count}</Title>
        </div>
        <Space>
          <Button type="primary" onClick={() => setCount(c => c + 1)}>+1</Button>
          <Button onClick={() => setCount(c => c - 1)}>-1</Button>
          <Button danger onClick={() => setCount(0)}>重置</Button>
        </Space>
        <Text type="secondary">初始值: {initialCount}</Text>
      </Flex>
    </Card>
  );
};
Counter.displayName = 'Counter';

const MessageBox: React.FC<{ message?: string }> = ({ message = '你好！' }) => {
  return (
    <Card title="消息框 (MessageBox)">
      <Text>{message}</Text>
    </Card>
  );
};
MessageBox.displayName = 'MessageBox';

function TargetApp() {
  return (
    <div>
      <Title level={2}>目标应用</Title>
      <Text type="secondary">这是"别人的"React 应用，下面是可以被查找的组件：</Text>
      <Counter initialCount={10} />
      <MessageBox message="Hello from Target!" />
    </div>
  );
}

const targetRootElement = document.getElementById('target-root');
if (targetRootElement) {
  const root = createRoot(targetRootElement);
  root.render(<TargetApp />);
  (window as any).__targetRootElement = targetRootElement;
}
