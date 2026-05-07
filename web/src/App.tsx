import { App as AntdApp } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import { GlobalErrorPrompt } from './components/GlobalErrorPrompt';
import { AppRoutes } from './router';

export default function App() {
  return (
    <AntdApp>
      <GlobalErrorPrompt />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AntdApp>
  );
}

