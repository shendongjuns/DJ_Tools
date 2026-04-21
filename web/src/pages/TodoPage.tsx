import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, DatePicker, Form, Input, Modal, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { todoApi } from '../api/services';
import type { TodoItem } from '../types';
import { formatDateTime } from '../utils/format';

export function TodoPage() {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<TodoItem | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  async function loadTodos(search = keyword) {
    const data = await todoApi.list(search);
    setItems(data);
  }

  useEffect(() => {
    void loadTodos();
  }, []);

  return (
    <Card className="feature-card" title="TODO List">
      <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索任务标题或描述"
          style={{ maxWidth: 320 }}
          allowClear
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onSearch={(value) => void loadTodos(value)}
        />
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
        scroll={{ x: 980 }}
        columns={[
          { title: '标题', dataIndex: 'title', width: 200 },
          { title: '描述', dataIndex: 'description', ellipsis: true },
          {
            title: '状态',
            dataIndex: 'status',
            width: 140,
            render: (_, record: TodoItem) => (
              <Space>
                <Tag color={record.status === 'COMPLETED' ? 'green' : record.overdue ? 'red' : 'blue'}>
                  {record.overdue ? 'OVERDUE' : record.status}
                </Tag>
                <Select
                  size="small"
                  value={record.status}
                  style={{ width: 120 }}
                  onChange={async (value) => {
                    await todoApi.updateStatus(record.id, value);
                    message.success('任务状态已更新');
                    await loadTodos();
                  }}
                  options={[
                    { label: '待开始', value: 'PENDING' },
                    { label: '进行中', value: 'IN_PROGRESS' },
                    { label: '已完成', value: 'COMPLETED' },
                  ]}
                />
              </Space>
            ),
          },
          { title: '截止时间', dataIndex: 'dueAt', width: 180, render: formatDateTime },
          { title: '提醒时间', dataIndex: 'remindAt', width: 180, render: formatDateTime },
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
                      remindAt: record.remindAt ? dayjs(record.remindAt) : null,
                    });
                    setOpen(true);
                  }}
                >
                  编辑
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={async () => {
                    await todoApi.remove(record.id);
                    message.success('任务已删除');
                    await loadTodos();
                  }}
                />
              </Space>
            ),
          },
        ]}
      />

      <Modal
        open={open}
        title={editing ? '编辑任务' : '新建任务'}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            const payload = {
              ...values,
              dueAt: values.dueAt ? values.dueAt.toISOString() : null,
              remindAt: values.remindAt ? values.remindAt.toISOString() : null,
            };
            if (editing) {
              await todoApi.update(editing.id, payload);
            } else {
              await todoApi.create(payload);
            }
            message.success(editing ? '任务已更新' : '任务已创建');
            setOpen(false);
            await loadTodos();
          }}
        >
          <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="状态" name="status" initialValue="PENDING">
            <Select
              options={[
                { label: '待开始', value: 'PENDING' },
                { label: '进行中', value: 'IN_PROGRESS' },
                { label: '已完成', value: 'COMPLETED' },
              ]}
            />
          </Form.Item>
          <Form.Item label="截止时间" name="dueAt">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="提醒时间" name="remindAt">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

