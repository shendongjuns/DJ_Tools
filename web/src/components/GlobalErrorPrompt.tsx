import { App } from 'antd';
import { useEffect } from 'react';

interface SystemErrorEventDetail {
  message?: string;
  status?: number;
  path?: string;
}

export function GlobalErrorPrompt() {
  const { notification } = App.useApp();

  useEffect(() => {
    function handleSystemError(event: Event) {
      const detail = (event as CustomEvent<SystemErrorEventDetail>).detail;
      notification.error({
        message: detail?.status === 401 ? '认证失败' : '系统错误',
        description: detail?.message || '请求失败，请稍后重试',
        placement: 'topRight',
      });
    }

    window.addEventListener('djtools:system-error', handleSystemError);
    return () => window.removeEventListener('djtools:system-error', handleSystemError);
  }, [notification]);

  return null;
}
