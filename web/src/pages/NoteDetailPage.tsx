import { App, Button, Card, Col, Form, Input, Row, Select, Space, Tag, Typography, Upload } from 'antd';
import { MdCatalog, MdEditor, MdPreview } from 'md-editor-rt';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { noteApi } from '../api/services';
import type { NoteDetail, NoteFolder } from '../types';
import { formatDateTime } from '../utils/format';

const shareOptions = [
  { label: '1 天', value: 'ONE_DAY' },
  { label: '7 天', value: 'SEVEN_DAYS' },
  { label: '30 天', value: 'THIRTY_DAYS' },
  { label: '永久', value: 'PERMANENT' },
];

export function NoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [editing, setEditing] = useState(id === 'new');
  const [form] = Form.useForm();

  const editorId = useMemo(() => `note-editor-${id || 'new'}`, [id]);

  async function loadFolders() {
    const data = await noteApi.folders();
    setFolders(data);
  }

  async function loadDetail(noteId: number) {
    const data = await noteApi.detail(noteId);
    setNote(data);
    form.setFieldsValue({
      ...data,
      tags: data.tags.join(', '),
    });
  }

  useEffect(() => {
    void loadFolders();
    if (id && id !== 'new') {
      void loadDetail(Number(id));
    } else {
      form.setFieldsValue({ title: '', summary: '', content: '# 新笔记\n', tags: '', folderId: undefined });
      setNote(null);
    }
  }, [form, id]);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={20}>
      <Card className="feature-card">
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Button onClick={() => navigate('/notes')}>返回列表</Button>
            <Button type={editing ? 'default' : 'primary'} onClick={() => setEditing(false)}>
              预览模式
            </Button>
            <Button type={editing ? 'primary' : 'default'} onClick={() => setEditing(true)}>
              编辑模式
            </Button>
          </Space>
          <Space wrap>
            {note?.shares.map((item) => (
              <Tag key={item.id} color={item.disabled ? 'default' : 'green'}>
                {item.expiresAt ? `有效至 ${formatDateTime(item.expiresAt)}` : '永久分享'}
              </Tag>
            ))}
            {note && (
              <Select
                style={{ width: 140 }}
                placeholder="创建分享"
                options={shareOptions}
                onChange={async (value) => {
                  await noteApi.createShare(note.id, value);
                  message.success('分享链接已生成');
                  await loadDetail(note.id);
                }}
              />
            )}
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={18}>
          <Card className="feature-card">
            <Form
              form={form}
              layout="vertical"
              onFinish={async (values) => {
                const payload = {
                  ...values,
                  tags: (values.tags || '')
                    .split(',')
                    .map((item: string) => item.trim())
                    .filter(Boolean),
                };
                if (id === 'new') {
                  const created = await noteApi.create(payload);
                  message.success('笔记已创建');
                  navigate(`/notes/${created.id}`);
                  return;
                }
                const updated = await noteApi.update(Number(id), payload);
                setNote(updated);
                message.success('笔记已更新');
                setEditing(false);
              }}
            >
              <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
                <Input disabled={!editing} />
              </Form.Item>
              <Form.Item label="摘要" name="summary">
                <Input.TextArea rows={2} disabled={!editing} />
              </Form.Item>
              <Space wrap style={{ width: '100%' }}>
                <Form.Item label="文件夹" name="folderId" style={{ minWidth: 220 }}>
                  <Select
                    allowClear
                    disabled={!editing}
                    options={folders.map((item) => ({ label: item.name, value: item.id }))}
                  />
                </Form.Item>
                <Form.Item label="标签（逗号分隔）" name="tags" style={{ minWidth: 300, flex: 1 }}>
                  <Input disabled={!editing} />
                </Form.Item>
              </Space>
              <Form.Item label="正文" name="content" rules={[{ required: true, message: '请输入正文' }]}>
                {editing ? (
                  <MdEditor editorId={editorId} modelValue={form.getFieldValue('content') || ''} onChange={(value) => form.setFieldValue('content', value)} />
                ) : (
                  <div className="preview-shell">
                    <MdPreview editorId={editorId} modelValue={form.getFieldValue('content') || note?.content || ''} />
                  </div>
                )}
              </Form.Item>
              {editing ? (
                <Space>
                  <Button type="primary" htmlType="submit">
                    保存笔记
                  </Button>
                  {note ? (
                    <Button
                      danger
                      onClick={async () => {
                        await noteApi.remove(note.id);
                        message.success('笔记已删除');
                        navigate('/notes');
                      }}
                    >
                      删除笔记
                    </Button>
                  ) : null}
                </Space>
              ) : null}
            </Form>
          </Card>
        </Col>
        <Col xs={24} xl={6}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card className="feature-card" title="正文目录">
              <MdCatalog editorId={editorId} scrollElement={document.documentElement} />
            </Card>
            <Card className="feature-card" title="附件管理">
              {note ? (
                <>
                  <Upload
                    showUploadList={false}
                    beforeUpload={async (file) => {
                      await noteApi.uploadAttachment(note.id, file);
                      message.success('附件上传成功');
                      await loadDetail(note.id);
                      return false;
                    }}
                  >
                    <Button block>上传附件</Button>
                  </Upload>
                  <Space direction="vertical" style={{ width: '100%', marginTop: 12 }}>
                    {note.attachments.map((item) => (
                      <Card key={item.id} size="small">
                        <Typography.Text>{item.originalFilename}</Typography.Text>
                        <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
                          {formatDateTime(item.createdAt)}
                        </Typography.Paragraph>
                        <Button
                          danger
                          size="small"
                          onClick={async () => {
                            await noteApi.deleteAttachment(item.id);
                            message.success('附件已删除');
                            await loadDetail(note.id);
                          }}
                        >
                          删除
                        </Button>
                      </Card>
                    ))}
                  </Space>
                </>
              ) : (
                <Typography.Text type="secondary">请先保存笔记后再上传附件。</Typography.Text>
              )}
            </Card>
            <Card className="feature-card" title="分享链接">
              {note?.shares.length ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {note.shares.map((item) => (
                    <Card key={item.id} size="small">
                      <Typography.Paragraph copyable={{ text: item.shareUrl }} style={{ marginBottom: 8 }}>
                        {item.shareUrl}
                      </Typography.Paragraph>
                      <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
                        {item.expiresAt ? `有效至：${formatDateTime(item.expiresAt)}` : '永久有效'}
                      </Typography.Paragraph>
                      <Button
                        danger
                        size="small"
                        disabled={item.disabled}
                        onClick={async () => {
                          if (!note) {
                            return;
                          }
                          await noteApi.closeShare(item.id);
                          message.success('分享链接已关闭');
                          await loadDetail(note.id);
                        }}
                      >
                        关闭分享
                      </Button>
                    </Card>
                  ))}
                </Space>
              ) : (
                <Typography.Text type="secondary">当前还没有分享链接。</Typography.Text>
              )}
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
