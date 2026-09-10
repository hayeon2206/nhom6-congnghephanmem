import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Form, Input, Typography, message, Alert } from 'antd';
import { LockOutlined, MailOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import AuthBrandPanel from './AuthBrandPanel';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    try {
      await login(values.email, values.password);
      message.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <AuthBrandPanel />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--color-bg)' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Đăng nhập
          </Typography.Title>
          <Typography.Paragraph type="secondary">Vào hệ thống quản lý cửa hàng của bạn.</Typography.Paragraph>

          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

          <Form layout="vertical" onFinish={onFinish} initialValues={{ email: 'owner@demo.com', password: '123456' }}>
            <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email' }]}>
              <Input prefix={<MailOutlined />} placeholder="owner@demo.com" size="large" />
            </Form.Item>
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="••••••" size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading} icon={<ArrowRightOutlined />} iconPosition="end">
              Đăng nhập
            </Button>
          </Form>

          <Typography.Paragraph style={{ textAlign: 'center', marginTop: 20 }}>
            Chưa có cửa hàng? <Link to="/register">Đăng ký ngay</Link>
          </Typography.Paragraph>
        </div>
      </div>
    </div>
  );
}
