import { BellOutlined } from '@ant-design/icons';
import { Badge, Button, Dropdown, List, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { notificationApi } from '../api/services';
import type { NotificationListResponse } from '../types';
import { formatDateTime } from '../utils/format';

export function NotificationBell() {
  const [data, setData] = useState<NotificationListResponse>({ unreadCount: 0, items: [] });
  const [messageApi, contextHolder] = message.useMessage();

  async function loadNotifications() {
    const result = await notificationApi.list();
    setData(result);
  }

  useEffect(() => {
    void loadNotifications();
    const timer = window.setInterval(() => void loadNotifications(), 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      {contextHolder}
      <Dropdown
        trigger={['click']}
        dropdownRender={() => (
          <div className="floating-panel">
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              提醒中心
            </Typography.Title>
            <List
              dataSource={data.items}
              locale={{ emptyText: '当前没有提醒' }}
              renderItem={(item) => (
                <List.Item
                  onClick={async () => {
                    if (!item.readFlag) {
                      await notificationApi.read(item.id);
                      await loadNotifications();
                      messageApi.success('已标记为已读');
                    }
                  }}
                  style={{ cursor: 'pointer', alignItems: 'flex-start' }}
                >
                  <List.Item.Meta
                    title={
                      <span>
                        {!item.readFlag ? '• ' : ''}
                        {item.title}
                      </span>
                    }
                    description={
                      <>
                        <div>{item.content || '暂无详情'}</div>
                        <div style={{ marginTop: 4, opacity: 0.7 }}>{formatDateTime(item.createdAt)}</div>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      >
        <Badge count={data.unreadCount} size="small">
          <Button shape="circle" icon={<BellOutlined />} />
        </Badge>
      </Dropdown>
    </>
  );
}
