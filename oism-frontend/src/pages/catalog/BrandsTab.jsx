import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { brandsApi } from '../../api/resources';

export default function BrandsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    brandsApi.list().then(setItems).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onSubmit = async () => {
    const values = await form.validateFields();
    await brandsApi.create(values);
    message.success('Đã thêm thương hiệu.');
    setModalOpen(false);
    form.resetFields();
    load();
  };

  const onDelete = async (id) => {
    await brandsApi.remove(id);
    message.success('Đã xoá.');
    load();
  };

  const columns = [
    { title: 'Tên thương hiệu', dataIndex: 'name' },
    { title: 'Mô tả', dataIndex: 'description' },
    {
      title: '',
      render: (_, record) => (
        <Popconfirm title="Xoá thương hiệu này?" onConfirm={() => onDelete(record.id)}>
          <Button size="small" danger>Xoá</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Thêm thương hiệu
        </Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={items} loading={loading} pagination={false} />

      <Modal open={modalOpen} title="Thêm thương hiệu" onCancel={() => setModalOpen(false)} onOk={onSubmit} okText="Lưu">
        <Form layout="vertical" form={form}>
          <Form.Item name="name" label="Tên thương hiệu" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
