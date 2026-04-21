import {
  AppstoreOutlined,
  EditOutlined,
  HomeOutlined,
  LogoutOutlined,
  ProfileOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Drawer, Form, Input, Layout, Menu, Select, Space, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { userApi } from '../api/services';
import { GlobalSearch } from '../components/GlobalSearch';
import { NotificationBell } from '../components/NotificationBell';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { useAuth } from '../store/AuthContext';
import { themePresets, useThemeContext } from '../store/ThemeContext';

const { Header, Content } = Layout;

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout, refreshProfile } = useAuth();
  const { themeId, setThemeId } = useThemeContext();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        nickname: profile.nickname,
        loginAccount: profile.loginAccount,
        themeId: profile.themeId || themeId,
      });
    }
  }, [form, profile, themeId]);

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: <NavLink to="/">首页</NavLink> },
    { key: '/todos', icon: <ProfileOutlined />, label: <NavLink to="/todos">TODO</NavLink> },
    { key: '/notes', icon: <EditOutlined />, label: <NavLink to="/notes">笔记</NavLink> },
  ];

  return (
    <Layout className="app-shell">
      {contextHolder}
      <Header className="app-header">
        <div className="brand-block">
          <AppstoreOutlined />
          <Typography.Title level={4} style={{ margin: 0 }}>
            DJ Tools
          </Typography.Title>
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname === '/' ? '/' : location.pathname.startsWith('/notes') ? '/notes' : '/todos']}
          items={menuItems}
          className="top-nav"
        />
        <Space wrap>
          <GlobalSearch />
          <NotificationBell />
          <ThemeSwitcher />
          <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
            个人设置
          </Button>
          <Button
            icon={<LogoutOutlined />}
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            退出
          </Button>
          <Avatar>{profile?.nickname?.slice(0, 1)?.toUpperCase() || 'A'}</Avatar>
        </Space>
      </Header>
      <Content className="app-content">
        <Outlet />
      </Content>

      <Drawer
        title="个人设置"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        width={420}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            await userApi.updateProfile(values);
            setThemeId(values.themeId);
            await refreshProfile();
            messageApi.success('个人信息已更新，建议重新登录以刷新登录态');
          }}
        >
          <Form.Item label="昵称" name="nickname" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="登录账号" name="loginAccount" rules={[{ required: true, message: '请输入登录账号' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="主题" name="themeId" rules={[{ required: true, message: '请选择主题' }]}>
            <Select
              options={themePresets.map((item) => ({
                label: item.name,
                value: item.id,
              }))}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            保存信息
          </Button>
        </Form>

        <Typography.Title level={5} style={{ marginTop: 28 }}>
          修改密码
        </Typography.Title>
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={async (values) => {
            await userApi.changePassword(values);
            messageApi.success('密码已更新，请重新登录');
            await logout();
            navigate('/login');
          }}
        >
          <Form.Item label="原密码" name="oldPassword" rules={[{ required: true, message: '请输入原密码' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label="新密码" name="newPassword" rules={[{ required: true, message: '请输入新密码' }]}>
            <Input.Password />
          </Form.Item>
          <Button htmlType="submit" block>
            更新密码
          </Button>
        </Form>
      </Drawer>
    </Layout>
  );
}
