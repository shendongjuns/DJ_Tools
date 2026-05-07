import { Card, Space, Tag, Typography } from 'antd';
import { MdPreview } from 'md-editor-rt';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MarkdownCatalog } from '../components/MarkdownCatalog';
import { noteApi } from '../api/services';
import type { SharedNote } from '../types';
import { formatDateTime } from '../utils/format';
import { headingId } from '../utils/markdown';

const sharedEditorId = 'shared-note-preview';

export function SharedNotePage() {
  const { token } = useParams();
  const [note, setNote] = useState<SharedNote | null>(null);

  useEffect(() => {
    if (token) {
      void noteApi.sharedDetail(token).then(setNote);
    }
  }, [token]);

  return (
    <div className="shared-page">
      <div className="shared-layout">
        <Card className="feature-card shared-card">
          <Typography.Title>{note?.title || '共享笔记'}</Typography.Title>
          <Typography.Paragraph type="secondary">{note?.summary || '仅支持只读预览，不提供编辑和管理权限。'}</Typography.Paragraph>
          <div className="shared-note-meta">
            <div className="shared-note-meta-group">
              <Typography.Text className="shared-note-meta-label">文件夹</Typography.Text>
              <Tag className="shared-note-folder-tag">{note?.folderName || '未分类'}</Tag>
            </div>
            <div className="shared-note-meta-group">
              <Typography.Text className="shared-note-meta-label">标签</Typography.Text>
              <Space size={[6, 6]} wrap>
                {note?.tags.length ? note.tags.map((item) => <Tag key={item}>{item}</Tag>) : <Tag>无标签</Tag>}
              </Space>
            </div>
            <Tag color="blue" className="shared-note-time-tag">
              {note ? `更新时间 ${formatDateTime(note.updatedAt)}` : '加载中'}
            </Tag>
          </div>
          <div className="note-reader-layout shared-reader-layout">
            <div className="preview-shell note-reader-scroll shared-reader-scroll" id={`${sharedEditorId}-scroll`}>
              <MdPreview editorId={sharedEditorId} modelValue={note?.content || ''} mdHeadingId={headingId} />
            </div>
            <aside className="note-reader-catalog shared-reader-catalog" aria-label="目录">
              <div className="note-reader-catalog-header">
                <Typography.Title level={5}>目录</Typography.Title>
              </div>
              <MarkdownCatalog
                content={note?.content || ''}
                scrollElementId={`${sharedEditorId}-scroll`}
                offsetTop={18}
                scrollOffset={12}
              />
            </aside>
          </div>
        </Card>
      </div>
    </div>
  );
}

