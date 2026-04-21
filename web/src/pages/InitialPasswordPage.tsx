import { App, Button, Card, Form, Input, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/services';
import { useAuth } from '../store/AuthContext';
import { useThemeContext } from '../store/ThemeContext';

export function InitialPasswordPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { setSession } = useAuth();
  const { setThemeId } = useThemeContext();

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <Typography.Title level={2}>首次登录修改密码</Typography.Title>
        <Typography.Paragraph type="secondary">
          为保证账号安全，首次登录后必须先修改默认密码，再继续使用其他功能。
        </Typography.Paragraph>
        <Form
          layout="vertical"
          onFinish={async (values) => {
            const response = await authApi.initialPassword(values);
            setSession(response);
            setThemeId(response.profile.themeId || 'cartoon');
            message.success('初始密码已修改');
            navigate('/');
          }}
        >
          <Form.Item label="原始密码" name="oldPassword" rules={[{ required: true, message: '请输入原始密码' }]}>
            <Input.Password size="large" />
          </Form.Item>
          <Form.Item label="新密码" name="newPassword" rules={[{ required: true, message: '请输入新密码' }]}>
            <Input.Password size="large" />
          </Form.Item>
          <Button htmlType="submit" type="primary" size="large" block>
            保存并进入系统
          </Button>
        </Form>
      </Card>
    </div>
  );
}

