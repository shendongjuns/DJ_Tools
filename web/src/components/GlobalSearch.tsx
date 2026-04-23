import { SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Modal, Radio, Space, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchApi } from '../api/services';
import type { SearchResult } from '../types';

export function GlobalSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const defaultScope = useMemo(() => (location.pathname.startsWith('/notes') ? 'note' : 'all'), [location.pathname]);
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState(defaultScope);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (open) {
      setScope(defaultScope);
    }
  }, [defaultScope, open]);

  async function handleSearch() {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await searchApi.search(scope, keyword.trim());
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button icon={<SearchOutlined />} onClick={() => setOpen(true)}>
        全局搜索
      </Button>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={780}
        title="全局搜索"
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Radio.Group value={scope} onChange={(event) => setScope(event.target.value)}>
            <Radio.Button value="all">全部</Radio.Button>
            <Radio.Button value="todo">待办</Radio.Button>
            <Radio.Button value="note">笔记</Radio.Button>
          </Radio.Group>
          <Input.Search
            placeholder="输入关键词后回车搜索"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={() => void handleSearch()}
            loading={loading}
          />
          {results.length === 0 ? (
            <Empty description="输入关键词后开始搜索" />
          ) : (
            <div className="search-result-list">
              {results.map((item) => (
                <button
                  type="button"
                  key={`${item.scope}-${item.targetId}`}
                  className="search-result-item"
                  onClick={() => {
                    setOpen(false);
                    if (item.scope === 'note') {
                      navigate(`/notes/${item.targetId}`);
                    } else {
                      navigate('/todos');
                    }
                  }}
                >
                  <Typography.Text strong>{item.title}</Typography.Text>
                  <Typography.Paragraph style={{ marginBottom: 0 }} ellipsis={{ rows: 2 }}>
                    {item.snippet || '暂无摘要'}
                  </Typography.Paragraph>
                  <Typography.Text type="secondary">
                    {item.scope === 'todo' ? '待办' : item.scope === 'note' ? '笔记' : '全部'}
                  </Typography.Text>
                </button>
              ))}
            </div>
          )}
        </Space>
      </Modal>
    </>
  );
}
