import { Card, Space, Tag, Typography } from 'antd';
import { MdPreview } from 'md-editor-rt';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { noteApi } from '../api/services';
import type { SharedNote } from '../types';
import { formatDateTime } from '../utils/format';

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
      <Card className="feature-card shared-card">
        <Typography.Title>{note?.title || '共享笔记'}</Typography.Title>
        <Typography.Paragraph type="secondary">{note?.summary || '仅支持只读预览，不提供编辑和管理权限。'}</Typography.Paragraph>
        <Space wrap style={{ marginBottom: 16 }}>
          <Tag>{note?.folderName || '未分类'}</Tag>
          {note?.tags.map((item) => <Tag key={item}>{item}</Tag>)}
          <Tag color="blue">{note ? `更新时间 ${formatDateTime(note.updatedAt)}` : '加载中'}</Tag>
        </Space>
        <MdPreview editorId={`shared-${token || 'note'}`} modelValue={note?.content || ''} />
      </Card>
    </div>
  );
}

