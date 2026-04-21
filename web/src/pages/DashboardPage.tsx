import { Card, Col, List, Row, Space, Statistic, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/services';
import type { AppMetrics, ContainerMetrics, DashboardOverview, HostMetrics } from '../types';
import { formatBytes, formatDateTime, formatDuration } from '../utils/format';

export function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [hostMetrics, setHostMetrics] = useState<HostMetrics | null>(null);
  const [containerMetrics, setContainerMetrics] = useState<ContainerMetrics | null>(null);
  const [appMetrics, setAppMetrics] = useState<AppMetrics | null>(null);

  useEffect(() => {
    async function load() {
      const [overviewData, hostData, containerData, appData] = await Promise.all([
        dashboardApi.overview(),
        dashboardApi.hostMetrics(),
        dashboardApi.containerMetrics(),
        dashboardApi.appMetrics(),
      ]);
      setOverview(overviewData);
      setHostMetrics(hostData);
      setContainerMetrics(containerData);
      setAppMetrics(appData);
    }
    void load();
  }, []);

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card className="feature-card"><Statistic title="未完成 TODO" value={overview?.todoUnfinishedCount ?? 0} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="feature-card"><Statistic title="笔记总数" value={overview?.noteCount ?? 0} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="feature-card"><Statistic title="未读提醒" value={overview?.unreadNotificationCount ?? 0} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card className="feature-card" title="最新 TODO">
            <List
              dataSource={overview?.latestTodos ?? []}
              locale={{ emptyText: '暂无待办任务' }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{item.title}</span>
                        <Tag color={item.status === 'COMPLETED' ? 'green' : item.overdue ? 'red' : 'blue'}>{item.status}</Tag>
                      </Space>
                    }
                    description={`截止时间：${formatDateTime(item.dueAt)}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className="feature-card" title="最新笔记">
            <List
              dataSource={overview?.latestNotes ?? []}
              locale={{ emptyText: '暂无笔记内容' }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={
                      <Space wrap>
                        <span>{item.folderName || '未分类'}</span>
                        {item.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={8}>
          <Card className="feature-card" title="宿主机监控">
            <Typography.Paragraph>CPU 使用率：{hostMetrics?.cpuUsage ?? 0}%</Typography.Paragraph>
            <Typography.Paragraph>
              内存：{formatBytes((hostMetrics?.totalMemory ?? 0) - (hostMetrics?.availableMemory ?? 0))} / {formatBytes(hostMetrics?.totalMemory)}
            </Typography.Paragraph>
            <Typography.Paragraph>开机时长：{hostMetrics ? formatDuration(hostMetrics.uptimeSeconds) : '-'}</Typography.Paragraph>
            <Typography.Title level={5}>网络</Typography.Title>
            <List
              size="small"
              dataSource={hostMetrics?.networks ?? []}
              renderItem={(item) => (
                <List.Item>
                  {item.name}：收 {formatBytes(item.bytesRecv)} / 发 {formatBytes(item.bytesSent)}
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card className="feature-card" title="Docker 容器监控">
            {!containerMetrics?.available ? (
              <Typography.Text type="secondary">{containerMetrics?.message || '暂无容器数据'}</Typography.Text>
            ) : (
              <List
                size="small"
                dataSource={containerMetrics.items}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={`${item.name} (${item.state})`}
                      description={`CPU ${item.cpuUsage}% / 内存 ${formatBytes(item.memoryUsage)}`}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card className="feature-card" title="应用监控">
            <Typography.Paragraph>PID：{appMetrics?.pid ?? '-'}</Typography.Paragraph>
            <Typography.Paragraph>运行时长：{appMetrics ? formatDuration(Math.floor(appMetrics.uptimeMillis / 1000)) : '-'}</Typography.Paragraph>
            <Typography.Paragraph>进程 CPU：{appMetrics?.processCpuLoad ?? 0}%</Typography.Paragraph>
            <Typography.Paragraph>进程内存：{formatBytes(appMetrics?.processMemoryBytes)}</Typography.Paragraph>
            <Typography.Paragraph>
              堆内存：{formatBytes(appMetrics?.heapMemory.used)} / {formatBytes(appMetrics?.heapMemory.max)}
            </Typography.Paragraph>
            <Typography.Paragraph>应用磁盘 IO：{appMetrics?.diskIoMessage ?? '-'}</Typography.Paragraph>
            <Typography.Paragraph>应用网络 IO：{appMetrics?.networkIoMessage ?? '-'}</Typography.Paragraph>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

