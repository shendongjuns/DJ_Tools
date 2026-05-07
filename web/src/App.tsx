import { App as AntdApp } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import { GlobalCursorEffect } from './components/GlobalCursorEffect';
import { GlobalErrorPrompt } from './components/GlobalErrorPrompt';
import { AppRoutes } from './router';

export default function App() {
  return (
    <AntdApp>
      <GlobalCursorEffect />
      <GlobalErrorPrompt />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AntdApp>
  );
}

