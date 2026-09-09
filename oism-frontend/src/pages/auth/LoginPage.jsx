import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Form, Input, Typography, message, Alert } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' }}>
      <Card style={{ width: 400, borderRadius: 16 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 4 }}>
          OISM
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
          Hệ thống quản lý bán hàng và tồn kho đa kênh
        </Typography.Paragraph>

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

        <Typography.Paragraph style={{ textAlign: 'center', marginTop: 16 }}>
          Chưa có cửa hàng? <Link to="/register">Đăng ký ngay</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
