import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { App, Button, Form, Input, Typography, Alert, Space } from 'antd';
import { useAuthStore } from '../../store/authStore';
import AuthBrandPanel from './AuthBrandPanel';
import whaleHero from '../../assets/whale-hero.png';

export default function RegisterPage() {
  const { message } = App.useApp();
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

      <div className="auth-form-panel">
        <img src={whaleHero} alt="" className="auth-form-watermark" aria-hidden="true" />
        <div className="auth-form-card" style={{ maxWidth: 560 }}>
          <h1 className="auth-form-title">Tạo cửa hàng mới</h1>
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
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
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
