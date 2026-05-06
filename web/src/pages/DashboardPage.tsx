import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Button, Card, Col, Empty, List, Modal, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/services';
import type { AppMetrics, ContainerMetrics, DashboardOverview, HostMetrics } from '../types';
import { formatBytes, formatDateTime, formatDuration } from '../utils/format';
import { getTodoStatusColor, getTodoStatusLabel } from '../utils/todo';

const APP_METRICS_REFRESH_INTERVAL_MS = 1000;
const HOST_METRICS_REFRESH_INTERVAL_MS = 1000;

function clampPercent(value?: number | null) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Number(value!.toFixed(2))));
}

function getUsagePercent(used?: number | null, total?: number | null) {
  if (!used || !total || total <= 0) {
    return 0;
  }
  return clampPercent((used / total) * 100);
}

function resolveMemoryLimit(max?: number | null, committed?: number | null) {
  if (max && max > 0) {
    return max;
  }
  return committed && committed > 0 ? committed : 0;
}

function getContainerStateColor(state: string) {
  switch (state) {
    case 'running':
      return 'green';
    case 'paused':
      return 'gold';
    case 'restarting':
      return 'orange';
    case 'created':
      return 'blue';
    case 'exited':
    case 'dead':
      return 'red';
    default:
      return 'default';
  }
}

export function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [hostMetrics, setHostMetrics] = useState<HostMetrics | null>(null);
  const [containerMetrics, setContainerMetrics] = useState<ContainerMetrics | null>(null);
  const [appMetrics, setAppMetrics] = useState<AppMetrics | null>(null);
  const [containerQueryStarted, setContainerQueryStarted] = useState(false);
  const [containerQuerying, setContainerQuerying] = useState(false);
  const [containerQueryProgress, setContainerQueryProgress] = useState(0);
  const [containerQueryMessage, setContainerQueryMessage] = useState<string | null>(null);
  const [containerModalOpen, setContainerModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      try {
        const overviewData = await dashboardApi.overview();
        if (!cancelled) {
          setOverview(overviewData);
        }
      } catch {
        // 首页摘要首次加载失败时保持默认空态，避免把监控轮询也一并中断。
      }
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    async function refreshAppMetrics() {
      if (inFlight) {
        return;
      }

      inFlight = true;

      try {
        const appResult = await dashboardApi.appMetrics();
        if (cancelled) {
          return;
        }

        setAppMetrics(appResult);
        if (!appResult.dockerMonitoringAvailable) {
          setContainerMetrics(null);
          setContainerQueryStarted(false);
          setContainerModalOpen(false);
          setContainerQueryProgress(0);
          setContainerQueryMessage(null);
        }
      } catch {
        // 保留最近一次成功数据，避免单次失败让其它监控卡片回退为空。
      } finally {
        inFlight = false;
      }
    }

    void refreshAppMetrics();

    const timer = window.setInterval(() => {
      void refreshAppMetrics();
    }, APP_METRICS_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    async function refreshHostMetrics() {
      if (inFlight) {
        return;
      }

      inFlight = true;

      try {
        const hostResult = await dashboardApi.hostMetrics();
        if (!cancelled) {
          setHostMetrics(hostResult);
        }
      } catch {
        // 保留最近一次成功数据，失败只影响当前卡片的本次更新。
      } finally {
        inFlight = false;
      }
    }

    void refreshHostMetrics();

    const timer = window.setInterval(() => {
      void refreshHostMetrics();
    }, HOST_METRICS_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!containerQuerying) {
      return;
    }

    const timer = window.setInterval(() => {
      setContainerQueryProgress((previous) => {
        if (previous >= 90) {
          return previous;
        }
        return Math.min(previous + 12, 90);
      });
    }, 200);
    return () => {
      window.clearInterval(timer);
    };
  }, [containerQuerying]);

  async function handleContainerQuery() {
    setContainerModalOpen(true);
    setContainerQueryStarted(true);
    setContainerQuerying(true);
    setContainerQueryProgress(12);
    setContainerQueryMessage(null);

    try {
      const result = await dashboardApi.containerMetrics();
      setContainerMetrics((previous) => {
        if (!result.available && previous?.available) {
          return previous;
        }
        return result;
      });
      setContainerQueryMessage(result.message !== 'ok' ? result.message : null);
      setContainerQueryProgress(100);
    } catch {
      setContainerQueryMessage('Docker 容器监控查询失败，请稍后重试');
      setContainerQueryProgress(100);
    } finally {
      window.setTimeout(() => {
        setContainerQuerying(false);
        setContainerQueryProgress(0);
      }, 180);
    }
  }

  const hostMemoryUsed = (hostMetrics?.totalMemory ?? 0) - (hostMetrics?.availableMemory ?? 0);
  const hostMemoryPercent = getUsagePercent(hostMemoryUsed, hostMetrics?.totalMemory);
  const heapLimit = resolveMemoryLimit(appMetrics?.heapMemory.max, appMetrics?.heapMemory.committed);
  const nonHeapLimit = resolveMemoryLimit(appMetrics?.nonHeapMemory.max, appMetrics?.nonHeapMemory.committed);
  const heapPercent = getUsagePercent(appMetrics?.heapMemory.used, heapLimit);
  const nonHeapPercent = getUsagePercent(appMetrics?.nonHeapMemory.used, nonHeapLimit);
  const showDockerMonitoring = Boolean(appMetrics?.dockerMonitoringAvailable);
  const runningContainerCount = containerMetrics?.items.filter((item) => item.state === 'running').length ?? 0;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card className="feature-card"><Statistic title="未完成待办" value={overview?.todoUnfinishedCount ?? 0} /></Card>
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
          <Card className="feature-card" title="最新待办">
            <List
              dataSource={overview?.latestTodos ?? []}
              locale={{ emptyText: '暂无待办任务' }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{item.title}</span>
                        <Tag color={getTodoStatusColor(item.status)}>{getTodoStatusLabel(item.status)}</Tag>
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

      <section className="monitoring-section">
        <div className="monitoring-section-header">
          <Typography.Title level={4} style={{ margin: 0 }}>
            运行态观测台
          </Typography.Title>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card
              className="feature-card monitor-card"
              title="宿主机监控"
              extra={showDockerMonitoring ? (
                <Button type="link" size="small" onClick={() => void handleContainerQuery()} loading={containerQuerying}>
                  {containerQueryStarted ? '刷新容器监控' : '查询 Docker 容器监控'}
                </Button>
              ) : null}
            >
              <div className="monitor-card-body">
                <div className="monitor-gauge-grid">
                  <div className="monitor-gauge">
                    <span className="monitor-kicker">CPU 使用率</span>
                    <Progress
                      type="dashboard"
                      percent={clampPercent(hostMetrics?.cpuUsage)}
                      strokeColor={{ '0%': '#ff8b5b', '100%': '#ffbd73' }}
                      trailColor="var(--monitor-progress-trail)"
                    />
                  </div>
                  <div className="monitor-gauge">
                    <span className="monitor-kicker">内存占用</span>
                    <Progress
                      type="dashboard"
                      percent={hostMemoryPercent}
                      strokeColor={{ '0%': '#3dbb8a', '100%': '#67d6a5' }}
                      trailColor="var(--monitor-progress-trail)"
                    />
                    <div className="monitor-gauge-value">
                      {formatBytes(hostMemoryUsed)} / {formatBytes(hostMetrics?.totalMemory)}
                    </div>
                  </div>
                </div>

                <div className="monitor-pill-row">
                  <div className="monitor-pill">
                    <span className="monitor-pill-label">开机时长</span>
                    <strong>{hostMetrics ? formatDuration(hostMetrics.uptimeSeconds) : '-'}</strong>
                  </div>
                  <div className="monitor-pill">
                    <span className="monitor-pill-label">Swap</span>
                    <strong>{formatBytes(hostMetrics?.usedSwap)} / {formatBytes(hostMetrics?.totalSwap)}</strong>
                  </div>
                </div>

                <div className="monitor-network-list">
                  {(hostMetrics?.networks ?? []).slice(0, 3).map((item) => (
                    <div className="monitor-network-item" key={item.name}>
                      <div>
                        <Typography.Text strong>{item.name}</Typography.Text>
                      </div>
                      <div className="monitor-network-flow">
                        <span><ArrowDownOutlined /> {formatBytes(item.bytesRecv)}</span>
                        <span><ArrowUpOutlined /> {formatBytes(item.bytesSent)}</span>
                      </div>
                    </div>
                  ))}
                  {hostMetrics && hostMetrics.networks.length === 0 ? (
                    <div className="monitor-network-empty">暂无网络接口数据</div>
                  ) : null}
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} xl={12}>
            <Card className="feature-card monitor-card" title="应用监控">
              <div className="monitor-card-body">
                <div className="monitor-gauge-grid">
                  <div className="monitor-gauge">
                    <span className="monitor-kicker">进程 CPU</span>
                    <Progress
                      type="dashboard"
                      percent={clampPercent(appMetrics?.processCpuLoad)}
                      strokeColor={{ '0%': '#5b8cff', '100%': '#89a8ff' }}
                      trailColor="var(--monitor-progress-trail)"
                    />
                  </div>
                  <div className="monitor-gauge">
                    <span className="monitor-kicker">堆内存</span>
                    <Progress
                      type="dashboard"
                      percent={heapPercent}
                      strokeColor={{ '0%': '#14b8a6', '100%': '#2dd4bf' }}
                      trailColor="var(--monitor-progress-trail)"
                    />
                    <div className="monitor-gauge-value">
                      {formatBytes(appMetrics?.heapMemory.used)} / {formatBytes(heapLimit)}
                    </div>
                  </div>
                </div>

                <div className="monitor-pill-row">
                  <div className="monitor-pill">
                    <span className="monitor-pill-label">PID</span>
                    <strong>{appMetrics?.pid ?? '-'}</strong>
                  </div>
                  <div className="monitor-pill">
                    <span className="monitor-pill-label">运行时长</span>
                    <strong>{appMetrics ? formatDuration(Math.floor(appMetrics.uptimeMillis / 1000)) : '-'}</strong>
                  </div>
                  <div className="monitor-pill">
                    <span className="monitor-pill-label">虚拟内存</span>
                    <strong>{formatBytes(appMetrics?.processMemoryBytes)}</strong>
                  </div>
                </div>

                <div className="monitor-memory-band">
                  <div className="monitor-inline-stat">
                    <span>非堆内存</span>
                    <strong>{formatBytes(appMetrics?.nonHeapMemory.used)} / {formatBytes(nonHeapLimit)}</strong>
                  </div>
                  <Progress
                    percent={nonHeapPercent}
                    showInfo={false}
                    strokeColor={{ '0%': '#6366f1', '100%': '#8b5cf6' }}
                    trailColor="var(--monitor-progress-trail)"
                  />
                </div>

                <div className="monitor-gc-list">
                  {appMetrics?.gcMetrics.map((item) => (
                    <div className="monitor-gc-item" key={item.name}>
                      <div>
                        <Typography.Text strong>{item.name}</Typography.Text>
                      </div>
                      <div className="monitor-gc-meta">
                        <span>{item.collectionCount} 次</span>
                        <span>{item.collectionTime} ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </section>

      <Modal
        title="Docker 容器监控"
        open={containerModalOpen}
        onCancel={() => setContainerModalOpen(false)}
        footer={null}
        width={760}
      >
        {containerQuerying ? (
          <div className="monitor-query-state">
            <Progress percent={containerQueryProgress} status="active" strokeColor="#1677ff" />
            <Typography.Text type="secondary">正在查询容器监控...</Typography.Text>
          </div>
        ) : (
          <div className="monitor-card-body monitor-modal-body">
            {!containerQueryStarted ? (
              <div className="monitor-empty">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="点击宿主机监控右上角按钮后查询 Docker 容器监控"
                />
              </div>
            ) : !containerMetrics?.available ? (
              <div className="monitor-empty">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={containerQueryMessage || containerMetrics?.message || 'Docker 容器监控查询失败'}
                />
              </div>
            ) : (
              <>
                <div className="monitor-pill-row">
                  <div className="monitor-pill">
                    <span className="monitor-pill-label">容器总数</span>
                    <strong>{containerMetrics.items.length}</strong>
                  </div>
                  <div className="monitor-pill">
                    <span className="monitor-pill-label">运行中</span>
                    <strong>{runningContainerCount}</strong>
                  </div>
                </div>

                {containerQueryMessage ? (
                  <div className="monitor-query-message is-warning">{containerQueryMessage}</div>
                ) : null}

                {containerMetrics.items.length === 0 ? (
                  <div className="monitor-empty">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前没有可展示的容器数据" />
                  </div>
                ) : (
                  <div className="monitor-container-list">
                    {containerMetrics.items.map((item) => (
                      <div className="monitor-container-item" key={item.id}>
                        <div className="monitor-container-top">
                          <div className="monitor-container-meta">
                            <Typography.Text strong>{item.name}</Typography.Text>
                            <span className="monitor-container-image">{item.image}</span>
                          </div>
                          <Tag color={getContainerStateColor(item.state)}>{item.state}</Tag>
                        </div>
                        <div className="monitor-inline-stat">
                          <span>CPU 负载</span>
                          <strong>{clampPercent(item.cpuUsage)}%</strong>
                        </div>
                        <Progress
                          percent={clampPercent(item.cpuUsage)}
                          showInfo={false}
                          strokeColor={{ '0%': '#f97316', '100%': '#fb7185' }}
                          trailColor="var(--monitor-progress-trail)"
                        />
                        <div className="monitor-memory-note">内存占用 {formatBytes(item.memoryUsage)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </Space>
  );
}
