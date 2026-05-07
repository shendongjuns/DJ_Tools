import { FileOutlined, FolderAddOutlined, PaperClipOutlined, ShareAltOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Image, Input, Modal, Popconfirm, Select, Space, Tabs, Tag, Typography, Upload } from 'antd';
import { MdCatalog, MdEditor, MdPreview } from 'md-editor-rt';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { noteApi } from '../api/services';
import type { NoteDetail, NoteFolder } from '../types';
import { formatDateTime } from '../utils/format';
import { storage } from '../utils/storage';

const shareOptions = [
  { label: '1 天', value: 'ONE_DAY' },
  { label: '7 天', value: 'SEVEN_DAYS' },
  { label: '30 天', value: 'THIRTY_DAYS' },
  { label: '永久', value: 'PERMANENT' },
];

function headingId(text: string, _level: number, index: number) {
  const slug = text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-龥-]/g, '');
  return slug ? `${slug}-${index}` : `heading-${index}`;
}

function absoluteAppUrl(path: string) {
  return new URL(path, window.location.origin).href;
}

function authenticatedAttachmentUrl(id: number) {
  const url = new URL(noteApi.attachmentUrl(id), import.meta.env.VITE_API_BASE_URL || window.location.origin);
  const token = storage.getToken();
  if (token) {
    url.searchParams.set('access_token', token);
  }
  return url.href;
}

function isImageAttachment(contentType?: string, filename?: string) {
  return Boolean(contentType?.startsWith('image/') || filename?.match(/\.(apng|avif|gif|jpe?g|png|svg|webp)$/i));
}

function shareUrl(shareToken: string) {
  return absoluteAppUrl(`/share/notes/${shareToken}`);
}

export function NoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [editing, setEditing] = useState(id === 'new');
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const savingRef = useRef(false);
  const [form] = Form.useForm();
  const [folderForm] = Form.useForm();

  const editorId = useMemo(() => `note-editor-${id || 'new'}`, [id]);
  const content = Form.useWatch('content', form) || note?.content || '';

  async function loadFolders() {
    const data = await noteApi.folders();
    setFolders(data);
  }

  async function loadDetail(noteId: number) {
    const data = await noteApi.detail(noteId);
    setNote(data);
    form.setFieldsValue({
      ...data,
      tags: data.tags,
    });
  }

  async function saveNote(values: Record<string, unknown>) {
    if (savingRef.current) {
      return;
    }
    savingRef.current = true;
    try {
      const payload = {
        ...values,
        tags: Array.isArray(values.tags) ? values.tags : [],
      };
      if (id === 'new') {
        const created = await noteApi.create(payload);
        message.success('笔记已创建');
        navigate(`/notes/${created.id}`);
        return;
      }
      const updated = await noteApi.update(Number(id), payload);
      setNote(updated);
      form.setFieldsValue({ ...updated, tags: updated.tags });
      message.success('笔记已更新');
    } finally {
      savingRef.current = false;
    }
  }

  async function handleUploadMarkdownImages(files: File[], callback: (urls: string[]) => void) {
    if (!note) {
      message.warning('请先保存笔记后再上传图片');
      return;
    }
    const uploaded = await Promise.all(files.map((file) => noteApi.uploadAttachment(note.id, file)));
    message.success('图片已上传');
    await loadDetail(note.id);
    callback(uploaded.map((item) => authenticatedAttachmentUrl(item.id)));
  }

  function renderAttachmentCard(item: NonNullable<NoteDetail['attachments']>[number], noteId: number) {
    const image = isImageAttachment(item.contentType, item.originalFilename);
    return (
      <Card key={item.id} size="small" className={image ? 'attachment-card image-attachment-card' : 'attachment-card'}>
        <Space align="start" style={{ width: '100%' }}>
          {image ? (
            <Image className="attachment-thumb" src={authenticatedAttachmentUrl(item.id)} alt={item.originalFilename} />
          ) : (
            <div className="attachment-file-icon">
              <FileOutlined />
            </div>
          )}
          <div className="attachment-meta">
            <Typography.Text>{item.originalFilename}</Typography.Text>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
              {formatDateTime(item.createdAt)}
            </Typography.Paragraph>
            <Popconfirm
              title="确认删除该附件吗？"
              okText="确认"
              cancelText="取消"
              onConfirm={async () => {
                await noteApi.deleteAttachment(item.id);
                message.success('附件已删除');
                await loadDetail(noteId);
              }}
            >
              <Button danger size="small">
                删除
              </Button>
            </Popconfirm>
          </div>
        </Space>
      </Card>
    );
  }

  function renderAttachmentManager() {
    if (!note) {
      return <Typography.Text type="secondary">请先保存笔记后再上传附件。</Typography.Text>;
    }
    const imageAttachments = note.attachments.filter((item) => isImageAttachment(item.contentType, item.originalFilename));
    const fileAttachments = note.attachments.filter((item) => !isImageAttachment(item.contentType, item.originalFilename));

    return (
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
          <Tabs
            defaultActiveKey="files"
            items={[
              {
                key: 'files',
                label: `其他文件 ${fileAttachments.length}`,
                children: fileAttachments.length ? (
                  <div className="attachment-list">{fileAttachments.map((item) => renderAttachmentCard(item, note.id))}</div>
                ) : (
                  <Typography.Text type="secondary">当前还没有其他文件。</Typography.Text>
                ),
              },
              {
                key: 'images',
                label: `图片 ${imageAttachments.length}`,
                children: imageAttachments.length ? (
                  <div className="attachment-list attachment-image-list">
                    {imageAttachments.map((item) => renderAttachmentCard(item, note.id))}
                  </div>
                ) : (
                  <Typography.Text type="secondary">当前还没有图片附件。</Typography.Text>
                ),
              },
            ]}
          />
          {!note.attachments.length ? <Typography.Text type="secondary">当前还没有附件。</Typography.Text> : null}
        </Space>
      </>
    );
  }

  function handleCatalogClick(event: MouseEvent, tocItem: { text: string; level: number; index: number }) {
    const scrollElement = document.getElementById(`${editorId}-preview`);
    const headingElement = document.getElementById(headingId(tocItem.text, tocItem.level, tocItem.index));
    if (!scrollElement || !headingElement) {
      return;
    }
    event.preventDefault();
    const scrollTop = headingElement.getBoundingClientRect().top - scrollElement.getBoundingClientRect().top + scrollElement.scrollTop;
    scrollElement.scrollTo({ top: scrollTop, behavior: 'smooth' });
  }

  function renderShareManager() {
    return note ? (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Select
          style={{ width: '100%' }}
          placeholder="创建分享"
          options={shareOptions}
          onChange={async (value) => {
            await noteApi.createShare(note.id, value);
            message.success('分享链接已生成');
            await loadDetail(note.id);
          }}
        />
        {note.shares.length ? (
          note.shares.map((item) => (
            <Card key={item.id} size="small">
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Typography.Paragraph copyable={{ text: shareUrl(item.shareToken) }} style={{ marginBottom: 0 }}>
                  {shareUrl(item.shareToken)}
                </Typography.Paragraph>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  {item.expiresAt ? `有效至：${formatDateTime(item.expiresAt)}` : '永久有效'}
                </Typography.Paragraph>
                <Space wrap>
                  <Select
                    size="small"
                    placeholder="修改时效"
                    options={shareOptions}
                    style={{ width: 120 }}
                    onChange={async (value) => {
                      await noteApi.updateShare(item.id, value);
                      message.success('分享时效已更新');
                      await loadDetail(note.id);
                    }}
                  />
                  <Popconfirm
                    title="确认删除该分享链接吗？"
                    okText="确认"
                    cancelText="取消"
                    onConfirm={async () => {
                      await noteApi.deleteShare(item.id);
                      message.success('分享链接已删除');
                      await loadDetail(note.id);
                    }}
                  >
                    <Button danger size="small">
                      删除链接
                    </Button>
                  </Popconfirm>
                </Space>
              </Space>
            </Card>
          ))
        ) : (
          <Typography.Text type="secondary">当前还没有分享链接。</Typography.Text>
        )}
      </Space>
    ) : (
      <Typography.Text type="secondary">请先保存笔记后再创建分享链接。</Typography.Text>
    );
  }

  useEffect(() => {
    void loadFolders();
    if (id && id !== 'new') {
      void loadDetail(Number(id));
    } else {
      form.setFieldsValue({ title: '', summary: '', content: '# 新笔记\n', tags: [], folderId: undefined });
      setNote(null);
    }
  }, [form, id]);

  useEffect(() => {
    function handleSaveShortcut(event: KeyboardEvent) {
      if (!editing || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      form.submit();
    }

    window.addEventListener('keydown', handleSaveShortcut, true);
    return () => window.removeEventListener('keydown', handleSaveShortcut, true);
  }, [editing, form]);

  return (
    <Space className="note-detail-page" direction="vertical" style={{ width: '100%' }} size={20}>
      <Card className="feature-card note-detail-toolbar">
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
          </Space>
        </Space>
      </Card>

      <Card className={editing ? 'feature-card note-editor-card' : 'feature-card note-reader-card'}>
            <Form form={form} layout="vertical" onFinish={saveNote}>
              {editing ? (
                <>
                  <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="摘要" name="summary">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Space wrap className="note-meta-row">
                    <Form.Item label="文件夹" name="folderId" style={{ minWidth: 220 }}>
                      <Select
                        allowClear
                        options={folders.map((item) => ({ label: item.name, value: item.id }))}
                        popupRender={(menu) => (
                          <>
                            {menu}
                            <Button
                              type="text"
                              icon={<FolderAddOutlined />}
                              style={{ width: '100%', textAlign: 'left' }}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => setFolderModalOpen(true)}
                            >
                              新建文件夹
                            </Button>
                          </>
                        )}
                      />
                    </Form.Item>
                    <Form.Item label="标签" name="tags" className="note-tags-field">
                      <Select mode="tags" tokenSeparators={[]} placeholder="输入标签后按回车" options={[]} />
                    </Form.Item>
                    <Form.Item label="附件" className="note-action-field">
                      <Button icon={<PaperClipOutlined />} onClick={() => setAttachmentModalOpen(true)}>
                        附件管理
                      </Button>
                    </Form.Item>
                  </Space>
                </>
              ) : null}
              <Form.Item
                label={editing ? '正文' : undefined}
                name="content"
                className={editing ? 'note-editor-form-item' : 'note-preview-form-item'}
                rules={[{ required: true, message: '请输入正文' }]}
              >
                {editing ? (
                  <MdEditor
                    editorId={editorId}
                    modelValue={content}
                    onChange={(value) => form.setFieldValue('content', value)}
                    onUploadImg={handleUploadMarkdownImages}
                    catalogLayout="flat"
                    toolbarsExclude={['github']}
                    className="note-markdown-editor"
                  />
                ) : (
                  <div className="note-reader-layout">
                    <div className="preview-shell note-reader-scroll" id={`${editorId}-preview`}>
                      <MdPreview editorId={editorId} modelValue={content} mdHeadingId={headingId} />
                    </div>
                    <aside className="note-reader-catalog" aria-label="目录">
                      <div className="note-reader-catalog-header">
                        <Typography.Title level={5}>目录</Typography.Title>
                        <Space size={8}>
                          <Button size="small" icon={<PaperClipOutlined />} onClick={() => setAttachmentModalOpen(true)}>
                            附件
                          </Button>
                          <Button size="small" icon={<ShareAltOutlined />} onClick={() => setShareModalOpen(true)}>
                            分享
                          </Button>
                        </Space>
                      </div>
                      <MdCatalog
                        editorId={editorId}
                        mdHeadingId={headingId}
                        scrollElement={`#${editorId}-preview`}
                        onClick={handleCatalogClick}
                      />
                    </aside>
                  </div>
                )}
              </Form.Item>
              {editing ? (
                <Space>
                  <Button type="primary" htmlType="submit">
                    保存笔记
                  </Button>
                  {note ? (
                    <Popconfirm
                      title="确认删除该笔记吗？"
                      okText="确认"
                      cancelText="取消"
                      onConfirm={async () => {
                        await noteApi.remove(note.id);
                        message.success('笔记已删除');
                        navigate('/notes');
                      }}
                    >
                      <Button danger>删除笔记</Button>
                    </Popconfirm>
                  ) : null}
                </Space>
              ) : null}
        </Form>
      </Card>

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
            const created = await noteApi.createFolder(values);
            message.success('文件夹已创建');
            setFolderModalOpen(false);
            folderForm.resetFields();
            await loadFolders();
            form.setFieldValue('folderId', created.id);
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

      <Modal open={attachmentModalOpen} title="附件管理" footer={null} onCancel={() => setAttachmentModalOpen(false)}>
        {renderAttachmentManager()}
      </Modal>

      <Modal open={shareModalOpen} title="分享链接" footer={null} onCancel={() => setShareModalOpen(false)}>
        {renderShareManager()}
      </Modal>
    </Space>
  );
}
