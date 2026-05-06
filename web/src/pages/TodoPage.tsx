import { DeleteOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, DatePicker, Dropdown, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { todoApi } from '../api/services';
import type { TodoItem, TodoStatus } from '../types';
import { formatDateTime } from '../utils/format';
import {
  DEFAULT_TODO_FILTER_STATUSES,
  TODO_FILTER_STATUS_OPTIONS,
  getTodoStatusColor,
  getTodoStatusLabel,
  TODO_STATUS_OPTIONS,
  TODO_STATUS_OPTIONS_WITH_UNFINISHED,
} from '../utils/todo';

type StatusTimeMode = 'COMPLETED' | 'CANCELLED';

interface StatusTimeDialogState {
  source: 'list' | 'form';
  status: StatusTimeMode;
  record?: TodoItem;
  formValues?: Record<string, unknown>;
}

export function TodoPage() {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<TodoStatus[]>(DEFAULT_TODO_FILTER_STATUSES);
  const [editing, setEditing] = useState<TodoItem | null>(null);
  const [open, setOpen] = useState(false);
  const [statusTimeDialog, setStatusTimeDialog] = useState<StatusTimeDialogState | null>(null);
  const [form] = Form.useForm();
  const [statusTimeForm] = Form.useForm();
  const { message } = App.useApp();

  async function loadTodos(search = keyword, statuses = selectedStatuses) {
    const data = await todoApi.list(search, statuses);
    setItems(data);
  }

  function needsStatusTime(status: TodoStatus): status is StatusTimeMode {
    return status === 'COMPLETED' || status === 'CANCELLED';
  }

  function openStatusTimeModal(state: StatusTimeDialogState) {
    const existingTime =
      state.source === 'list'
        ? state.status === 'COMPLETED'
          ? state.record?.completedAt
          : state.record?.cancelledAt
        : state.status === 'COMPLETED'
          ? editing?.completedAt
          : editing?.cancelledAt;

    statusTimeForm.setFieldsValue({
      actionTime: existingTime ? dayjs(existingTime) : dayjs(),
    });
    setStatusTimeDialog(state);
  }

  function closeEditor() {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  }

  async function submitTodo(values: Record<string, unknown>, overrides?: { completedAt?: string | null; cancelledAt?: string | null }) {
    const payload = {
      ...values,
      dueAt: values.dueAt ? (values.dueAt as Dayjs).toISOString() : null,
      completedAt: overrides?.completedAt ?? null,
      cancelledAt: overrides?.cancelledAt ?? null,
    };
    if (editing) {
      await todoApi.update(editing.id, payload);
    } else {
      await todoApi.create(payload);
    }
    message.success(editing ? '任务已更新' : '任务已创建');
    closeEditor();
    await loadTodos(keyword, selectedStatuses);
  }

  async function handleStatusChange(record: TodoItem, nextStatus: TodoStatus) {
    if (needsStatusTime(nextStatus)) {
      openStatusTimeModal({
        source: 'list',
        status: nextStatus,
        record,
      });
      return;
    }

    await todoApi.updateStatus(record.id, {
      status: nextStatus,
      completedAt: null,
      cancelledAt: null,
    });
    message.success('任务状态已更新');
    await loadTodos(keyword, selectedStatuses);
  }

  useEffect(() => {
    void loadTodos();
  }, []);

  return (
    <Card className="feature-card" title="待办事项">
      <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            placeholder="搜索任务标题或描述"
            style={{ width: 320 }}
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={(value) => void loadTodos(value, selectedStatuses)}
          />
          <Select
            mode="multiple"
            value={selectedStatuses}
            style={{ minWidth: 260 }}
            placeholder="按状态筛选"
            options={TODO_FILTER_STATUS_OPTIONS}
            onChange={(values: TodoStatus[]) => {
              setSelectedStatuses(values);
              void loadTodos(keyword, values);
            }}
          />
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            form.resetFields();
            setOpen(true);
          }}
        >
          新建任务
        </Button>
      </Space>

      <Table
        rowKey="id"
        dataSource={items}
        scroll={{ x: 1180 }}
        columns={[
          { title: '标题', dataIndex: 'title', width: 200 },
          { title: '描述', dataIndex: 'description', ellipsis: true },
          {
            title: '状态',
            dataIndex: 'status',
            width: 140,
            render: (_, record: TodoItem) => {
              const statusMenuItems = TODO_STATUS_OPTIONS.map((item) => ({
                key: item.value,
                label: item.label,
              }));
              return (
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: statusMenuItems,
                    selectable: false,
                    onClick: async ({ key }) => {
                      await handleStatusChange(record, key as TodoStatus);
                    },
                  }}
                >
                  <Tag
                    color={getTodoStatusColor(record.status)}
                    style={{ cursor: 'pointer', userSelect: 'none', marginInlineEnd: 0 }}
                  >
                    <Space size={4}>
                      <span>{getTodoStatusLabel(record.status)}</span>
                      <DownOutlined style={{ fontSize: 10 }} />
                    </Space>
                  </Tag>
                </Dropdown>
              );
            },
          },
          { title: '截止时间', dataIndex: 'dueAt', width: 180, render: formatDateTime },
          { title: '完成时间', dataIndex: 'completedAt', width: 180, render: formatDateTime },
          { title: '取消时间', dataIndex: 'cancelledAt', width: 180, render: formatDateTime },
          {
            title: '操作',
            width: 140,
            render: (_, record: TodoItem) => (
              <Space>
                <Button
                  size="small"
                  onClick={() => {
                    setEditing(record);
                    form.setFieldsValue({
                      ...record,
                      dueAt: record.dueAt ? dayjs(record.dueAt) : null,
                    });
                    setOpen(true);
                  }}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确认删除该待办事项吗？"
                  okText="确认"
                  cancelText="取消"
                  onConfirm={async () => {
                    await todoApi.remove(record.id);
                    message.success('任务已删除');
                    await loadTodos(keyword, selectedStatuses);
                  }}
                >
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        open={open}
        title={editing ? '编辑任务' : '新建任务'}
        onCancel={closeEditor}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            if (needsStatusTime(values.status as TodoStatus)) {
              openStatusTimeModal({
                source: 'form',
                status: values.status as StatusTimeMode,
                formValues: values,
              });
              return;
            }

            await submitTodo(values, {
              completedAt: null,
              cancelledAt: null,
            });
          }}
        >
          <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="状态" name="status" initialValue="PENDING">
            <Select options={TODO_STATUS_OPTIONS_WITH_UNFINISHED} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}>
            {({ getFieldValue }) => {
              const currentStatus = getFieldValue('status') as TodoStatus | undefined;
              if (!currentStatus || !needsStatusTime(currentStatus)) {
                return null;
              }
              const currentTime = currentStatus === 'COMPLETED' ? editing?.completedAt : editing?.cancelledAt;
              return (
                <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
                  {currentStatus === 'COMPLETED' ? '保存时会弹出完成时间确认框。' : '保存时会弹出取消时间确认框。'}
                  {currentTime ? ` 当前记录时间：${formatDateTime(currentTime)}` : ''}
                </Typography.Paragraph>
              );
            }}
          </Form.Item>
          <Form.Item label="截止时间" name="dueAt">
            <DatePicker
              showTime={{ format: 'HH:mm', showSecond: false }}
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            默认截止前 10 分钟提醒，不足 10 分钟则提前 1 分钟，不足 1 分钟则立即提醒。
          </Typography.Paragraph>
        </Form>
      </Modal>

      <Modal
        open={Boolean(statusTimeDialog)}
        title={statusTimeDialog?.status === 'COMPLETED' ? '确认完成时间' : '确认取消时间'}
        onCancel={() => {
          setStatusTimeDialog(null);
          statusTimeForm.resetFields();
        }}
        onOk={() => statusTimeForm.submit()}
      >
        <Form
          form={statusTimeForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!statusTimeDialog) {
              return;
            }

            const actionTime = (values.actionTime as Dayjs).toISOString();
            const payload =
              statusTimeDialog.status === 'COMPLETED'
                ? { completedAt: actionTime, cancelledAt: null }
                : { completedAt: null, cancelledAt: actionTime };

            if (statusTimeDialog.source === 'list' && statusTimeDialog.record) {
              await todoApi.updateStatus(statusTimeDialog.record.id, {
                status: statusTimeDialog.status,
                ...payload,
              });
              message.success('任务状态已更新');
              setStatusTimeDialog(null);
              statusTimeForm.resetFields();
              await loadTodos(keyword, selectedStatuses);
              return;
            }

            if (statusTimeDialog.source === 'form' && statusTimeDialog.formValues) {
              await submitTodo(statusTimeDialog.formValues, payload);
              setStatusTimeDialog(null);
              statusTimeForm.resetFields();
            }
          }}
        >
          <Form.Item
            label={statusTimeDialog?.status === 'COMPLETED' ? '完成时间' : '取消时间'}
            name="actionTime"
            rules={[{ required: true, message: '请选择时间' }]}
          >
            <DatePicker
              showTime={{ format: 'HH:mm', showSecond: false }}
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
