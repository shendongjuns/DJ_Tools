import { Card, Space, Tag, Typography } from 'antd';
import { MdCatalog, MdPreview } from 'md-editor-rt';
import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { useParams } from 'react-router-dom';
import { noteApi } from '../api/services';
import type { SharedNote } from '../types';
import { formatDateTime } from '../utils/format';

const sharedEditorId = 'shared-note-preview';

function headingId(text: string, _level: number, index: number) {
  const slug = text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-龥-]/g, '');
  return slug ? `${slug}-${index}` : `heading-${index}`;
}

export function SharedNotePage() {
  const { token } = useParams();
  const [note, setNote] = useState<SharedNote | null>(null);

  useEffect(() => {
    if (token) {
      void noteApi.sharedDetail(token).then(setNote);
    }
  }, [token]);

  function handleCatalogClick(event: MouseEvent, tocItem: { text: string; level: number; index: number }) {
    const scrollElement = document.getElementById(`${sharedEditorId}-scroll`);
    const headingElement = document.getElementById(headingId(tocItem.text, tocItem.level, tocItem.index));
    if (!scrollElement || !headingElement) {
      return;
    }
    event.preventDefault();
    const scrollTop = headingElement.getBoundingClientRect().top - scrollElement.getBoundingClientRect().top + scrollElement.scrollTop;
    scrollElement.scrollTo({ top: scrollTop, behavior: 'smooth' });
  }

  return (
    <div className="shared-page">
      <div className="shared-layout">
        <Card className="feature-card shared-card">
          <Typography.Title>{note?.title || '共享笔记'}</Typography.Title>
          <Typography.Paragraph type="secondary">{note?.summary || '仅支持只读预览，不提供编辑和管理权限。'}</Typography.Paragraph>
          <Space wrap style={{ marginBottom: 16 }}>
            <Tag>{note?.folderName || '未分类'}</Tag>
            {note?.tags.map((item) => <Tag key={item}>{item}</Tag>)}
            <Tag color="blue">{note ? `更新时间 ${formatDateTime(note.updatedAt)}` : '加载中'}</Tag>
          </Space>
          <div className="note-reader-layout shared-reader-layout">
            <div className="preview-shell note-reader-scroll shared-reader-scroll" id={`${sharedEditorId}-scroll`}>
              <MdPreview editorId={sharedEditorId} modelValue={note?.content || ''} mdHeadingId={headingId} />
            </div>
            <aside className="note-reader-catalog shared-reader-catalog" aria-label="目录">
              <div className="note-reader-catalog-header">
                <Typography.Title level={5}>目录</Typography.Title>
              </div>
              <MdCatalog
                editorId={sharedEditorId}
                mdHeadingId={headingId}
                scrollElement={`#${sharedEditorId}-scroll`}
                onClick={handleCatalogClick}
              />
            </aside>
          </div>
        </Card>
      </div>
    </div>
  );
}

