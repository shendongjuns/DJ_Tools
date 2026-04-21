import { App as AntdApp } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './router';

export default function App() {
  return (
    <AntdApp>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AntdApp>
  );
}

