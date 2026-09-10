import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Form, Input, Typography, message, Alert, Space } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import AuthBrandPanel from './AuthBrandPanel';

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
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <AuthBrandPanel />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--color-bg)' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Tạo cửa hàng mới
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            Dữ liệu của cửa hàng bạn hoàn toàn tách biệt với các cửa hàng khác trên hệ thống.
          </Typography.Paragraph>

          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item name="tenantName" label="Tên cửa hàng" rules={[{ required: true }]}>
              <Input placeholder="VD: Thời trang ABC" size="large" />
            </Form.Item>
            <Space.Compact block>
              <Form.Item name="ownerName" label="Họ tên chủ cửa hàng" rules={[{ required: true }]} style={{ width: '55%' }}>
                <Input size="large" />
              </Form.Item>
              <Form.Item name="phone" label="Số điện thoại" style={{ width: '45%' }}>
                <Input size="large" />
              </Form.Item>
            </Space.Compact>
            <Form.Item name="email" label="Email đăng nhập" rules={[{ required: true, type: 'email' }]}>
              <Input size="large" />
            </Form.Item>
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6, message: 'Tối thiểu 6 ký tự' }]}>
              <Input.Password size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading} icon={<ArrowRightOutlined />} iconPosition="end">
              Tạo cửa hàng
            </Button>
          </Form>

          <Typography.Paragraph style={{ textAlign: 'center', marginTop: 20 }}>
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </Typography.Paragraph>
        </div>
      </div>
    </div>
  );
}
