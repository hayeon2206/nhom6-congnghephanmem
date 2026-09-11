import { useEffect, useState } from 'react';
import { App, Table, Button, Modal, Form, Input, Select, Space, Tag, Switch, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { usersApi } from '../../api/resources';

const ROLE_TAG = {
  OWNER: <Tag color="purple">Chủ cửa hàng</Tag>,
  STAFF: <Tag color="blue">Nhân viên</Tag>,
  CASHIER: <Tag color="green">Thu ngân</Tag>,
};

export default function UsersPage() {
  const { message } = App.useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    usersApi
      .list()
      .then(setItems)
      .catch((err) => message.error(err.response?.data?.message ?? 'Không tải được danh sách nhân viên.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onCreate = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return; // invalid fields — AntD already highlights them inline
    }
    try {
      await usersApi.create(values);
      message.success('Đã thêm nhân viên.');
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (err) {
      message.error(err.response?.data?.message ?? 'Có lỗi xảy ra.');
    }
  };

  const toggleActive = async (record) => {
    try {
      await usersApi.update(record.id, { isActive: !record.isActive });
      load();
    } catch (err) {
      message.error(err.response?.data?.message ?? 'Có lỗi xảy ra.');
    }
  };

  const columns = [
    { title: 'Họ tên', dataIndex: 'name' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'SĐT', dataIndex: 'phone' },
    { title: 'Vai trò', dataIndex: 'role', render: (v) => ROLE_TAG[v] },
    {
      title: 'Hoạt động',
      dataIndex: 'isActive',
      render: (v, record) => <Switch checked={v} onChange={() => toggleActive(record)} />,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Typography.Title level={3}>Nhân viên & phân quyền</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Thêm nhân viên
        </Button>
      </div>

      <Table rowKey="id" columns={columns} dataSource={items} loading={loading} />

      <Modal open={modalOpen} title="Thêm nhân viên" onCancel={() => setModalOpen(false)} onOk={onCreate} okText="Tạo tài khoản">
        <Form layout="vertical" form={form}>
          <Form.Item name="name" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email đăng nhập" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="SĐT">
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]} initialValue="STAFF">
            <Select
              options={[
                { value: 'STAFF', label: 'Nhân viên (quản lý kho / đơn hàng)' },
                { value: 'CASHIER', label: 'Thu ngân (chỉ dùng POS)' },
                { value: 'OWNER', label: 'Chủ cửa hàng (toàn quyền)' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
