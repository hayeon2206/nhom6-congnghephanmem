import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { App, Button, Form, Input, Typography, Alert } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import AuthBrandPanel from './AuthBrandPanel';
import whaleHero from '../../assets/whale-hero.png';

export default function LoginPage() {
  const { message } = App.useApp();
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

      <div className="auth-form-panel">
        <img src={whaleHero} alt="" className="auth-form-watermark" aria-hidden="true" />
        <div className="auth-form-card" style={{ maxWidth: 520 }}>
          <h1 className="auth-form-title">Đăng nhập</h1>
          <Typography.Paragraph type="secondary">Vào hệ thống quản lý cửa hàng của bạn.</Typography.Paragraph>

          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

          <Form layout="vertical" onFinish={onFinish} initialValues={{ email: 'owner@demo.com', password: '123456' }}>
            <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email' }]}>
              <Input prefix={<MailOutlined />} placeholder="owner@demo.com" size="large" />
            </Form.Item>
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="••••••" size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
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
