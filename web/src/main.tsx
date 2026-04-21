import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import 'md-editor-rt/lib/style.css';
import './styles/global.css';
import App from './App';
import { AuthProvider } from './store/AuthContext';
import { ThemeProvider } from './store/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
