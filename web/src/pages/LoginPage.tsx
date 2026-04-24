import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/services';
import { useAuth } from '../store/AuthContext';
import { useThemeContext } from '../store/ThemeContext';
import { storage } from '../utils/storage';

export function LoginPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { setSession } = useAuth();
  const { setThemeId } = useThemeContext();

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <Typography.Title level={2}>登录个人工作台</Typography.Title>
        <Form
          layout="vertical"
          onFinish={async (values) => {
            const data = await authApi.login(values);
            setSession(data);
            setThemeId(storage.getTheme() || data.profile.themeId || 'cartoon');
            message.success('登录成功');
            navigate(data.profile.forcePasswordChange ? '/initial-password' : '/');
          }}
        >
          <Form.Item label="登录账号" name="loginAccount" rules={[{ required: true, message: '请输入登录账号' }]}>
            <Input prefix={<UserOutlined />} size="large" />
          </Form.Item>
          <Form.Item label="登录密码" name="password" rules={[{ required: true, message: '请输入登录密码' }]}>
            <Input.Password prefix={<LockOutlined />} size="large" />
          </Form.Item>
          <Button htmlType="submit" type="primary" size="large" block>
            进入工作台
          </Button>
        </Form>
      </Card>
    </div>
  );
}
