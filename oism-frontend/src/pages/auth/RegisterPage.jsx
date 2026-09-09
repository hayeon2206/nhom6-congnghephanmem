import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Form, Input, Typography, message, Alert } from 'antd';
import { useAuthStore } from '../../store/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerTenant = useAuthStore((s) => s.registerTenant);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    try {
      await registerTenant(values);
      message.success('Tạo cửa hàng thành công!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' }}>
      <Card style={{ width: 440, borderRadius: 16 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 4 }}>
          Tạo cửa hàng mới
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
          FR-AUTH-01: mỗi cửa hàng là một tenant độc lập, dữ liệu tách biệt hoàn toàn.
        </Typography.Paragraph>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="tenantName" label="Tên cửa hàng" rules={[{ required: true }]}>
            <Input placeholder="VD: Thời trang ABC" size="large" />
          </Form.Item>
          <Form.Item name="ownerName" label="Họ tên chủ cửa hàng" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="email" label="Email đăng nhập" rules={[{ required: true, type: 'email' }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input size="large" />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6, message: 'Tối thiểu 6 ký tự' }]}>
            <Input.Password size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            Tạo cửa hàng
          </Button>
        </Form>

        <Typography.Paragraph style={{ textAlign: 'center', marginTop: 16 }}>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
