import { FolderAddOutlined, PlusOutlined, TagsOutlined } from '@ant-design/icons';
import { App, Button, Card, Empty, Form, Input, Modal, Popover, Select, Space, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { noteApi } from '../api/services';
import type { NoteFolder, NoteListItem } from '../types';
import { formatDateTime } from '../utils/format';

export function NotesPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [folderId, setFolderId] = useState<number | undefined>();
  const [tag, setTag] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderForm] = Form.useForm();

  async function loadMeta() {
    const [folderData, tagData] = await Promise.all([noteApi.folders(), noteApi.tags()]);
    setFolders(folderData);
    setTags(tagData);
  }

  async function loadNotes() {
    const data = await noteApi.list({ folderId, tag, keyword });
    setNotes(data);
  }

  useEffect(() => {
    void loadMeta();
  }, []);

  useEffect(() => {
    void loadNotes();
  }, [folderId, tag]);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={20}>
      <Card className="feature-card">
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Select
              allowClear
              style={{ width: 160 }}
              placeholder="按文件夹筛选"
              value={folderId}
              onChange={setFolderId}
              options={folders.map((item) => ({ label: item.name, value: item.id }))}
            />
            <Select
              allowClear
              style={{ width: 180 }}
              placeholder="按标签筛选"
              value={tag}
              onChange={setTag}
              options={tags.map((item) => ({ label: item, value: item }))}
            />
            <Input.Search
              style={{ width: 260 }}
              placeholder="搜索标题、正文或摘要"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onSearch={() => void loadNotes()}
            />
          </Space>
          <Space wrap>
            <Button icon={<FolderAddOutlined />} onClick={() => setFolderModalOpen(true)}>
              新建文件夹
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/notes/new')}>
              新建笔记
            </Button>
          </Space>
        </Space>
      </Card>

      {notes.length === 0 ? (
        <Card className="feature-card"><Empty description="当前筛选条件下没有笔记" /></Card>
      ) : (
        <div className="notes-grid">
          {notes.map((item) => (
            <button
              type="button"
              key={item.id}
              className="note-card"
              onClick={() => navigate(`/notes/${item.id}`)}
            >
              <Typography.Title level={4}>{item.title}</Typography.Title>
              <Popover
                content={<div className="note-popover-content">{item.summary || '暂无摘要，点击进入详情页查看正文。'}</div>}
                trigger="hover"
              >
                <Typography.Paragraph ellipsis={{ rows: 3 }}>{item.summary || '暂无摘要，点击进入详情页查看正文。'}</Typography.Paragraph>
              </Popover>
              <Space wrap className="note-card-meta">
                <Tag color="blue" icon={<FolderAddOutlined />}>{item.folderName || '未分类'}</Tag>
                {item.shared ? <Tag color="green">已分享</Tag> : null}
              </Space>
              <Space wrap className="note-card-tags">
                {item.tags.length ? item.tags.map((tagItem) => (
                  <Popover key={tagItem} content={<div className="note-popover-content">标签：{tagItem}</div>} trigger="hover">
                    <Tag color="purple" icon={<TagsOutlined />}>{tagItem}</Tag>
                  </Popover>
                )) : <Tag color="default" icon={<TagsOutlined />}>无标签</Tag>}
              </Space>
              <Typography.Text type="secondary">更新时间：{formatDateTime(item.updatedAt)}</Typography.Text>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={folderModalOpen}
        title="新建文件夹"
        onCancel={() => setFolderModalOpen(false)}
        onOk={() => folderForm.submit()}
      >
        <Form
          form={folderForm}
          layout="vertical"
          onFinish={async (values) => {
            await noteApi.createFolder(values);
            message.success('文件夹已创建');
            setFolderModalOpen(false);
            folderForm.resetFields();
            await loadMeta();
          }}
        >
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入文件夹名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="排序" name="sortOrder" initialValue={0} rules={[{ required: true, message: '请输入排序值' }]}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

