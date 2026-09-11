import { useEffect, useState } from 'react';
import { App, Table, Button, Modal, Form, Input, Switch, Typography, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { branchesApi } from '../../api/resources';
import { useUiStore } from '../../store/uiStore';

export default function BranchesPage() {
  const { message } = App.useApp();
  const { setBranches } = useUiStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    branchesApi
      .list()
      .then((data) => {
        setItems(data);
        setBranches(data);
      })
      .catch((err) => message.error(err.response?.data?.message ?? 'Không tải được danh sách chi nhánh.'))
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
      await branchesApi.create(values);
      message.success('Đã thêm chi nhánh.');
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (err) {
      message.error(err.response?.data?.message ?? 'Có lỗi xảy ra.');
    }
  };

  const onToggle = async (id) => {
    try {
      await branchesApi.toggle(id);
      load();
    } catch (err) {
      message.error(err.response?.data?.message ?? 'Có lỗi xảy ra.');
    }
  };

  const columns = [
    { title: 'Tên chi nhánh', dataIndex: 'name' },
    { title: 'Địa chỉ', dataIndex: 'address' },
    { title: 'SĐT', dataIndex: 'phone' },
    { title: 'Kho tổng', dataIndex: 'isWarehouse', render: (v) => v && <Tag color="blue">Kho tổng</Tag> },
    {
      title: 'Hiển thị',
      dataIndex: 'isActive',
      render: (v, record) => <Switch checked={v} onChange={() => onToggle(record.id)} />,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Typography.Title level={3}>Chi nhánh & Kho hàng</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Thêm chi nhánh
        </Button>
      </div>

      <Table rowKey="id" columns={columns} dataSource={items} loading={loading} />

      <Modal open={modalOpen} title="Thêm chi nhánh mới" onCancel={() => setModalOpen(false)} onOk={onCreate} okText="Tạo chi nhánh">
        <Form layout="vertical" form={form}>
          <Form.Item name="name" label="Tên chi nhánh" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="SĐT">
            <Input />
          </Form.Item>
          <Form.Item name="isWarehouse" label="Là kho tổng?" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
