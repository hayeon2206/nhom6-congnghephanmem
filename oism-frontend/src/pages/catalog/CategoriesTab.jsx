import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { categoriesApi } from '../../api/resources';

export default function CategoriesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    categoriesApi.list().then(setItems).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onSubmit = async () => {
    const values = await form.validateFields();
    await categoriesApi.create(values);
    message.success('Đã thêm danh mục.');
    setModalOpen(false);
    form.resetFields();
    load();
  };

  const onDelete = async (id) => {
    await categoriesApi.remove(id);
    message.success('Đã xoá.');
    load();
  };

  const columns = [
    { title: 'Tên danh mục', dataIndex: 'name' },
    { title: 'Danh mục cha', dataIndex: 'parentCategoryId', render: (id) => items.find((c) => c.id === id)?.name ?? '—' },
    { title: 'Mô tả', dataIndex: 'description' },
    {
      title: '',
      render: (_, record) => (
        <Popconfirm title="Xoá danh mục này?" onConfirm={() => onDelete(record.id)}>
          <Button size="small" danger>Xoá</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Thêm danh mục
        </Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={items} loading={loading} pagination={false} />

      <Modal open={modalOpen} title="Thêm danh mục" onCancel={() => setModalOpen(false)} onOk={onSubmit} okText="Lưu">
        <Form layout="vertical" form={form}>
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="parentCategoryId" label="Danh mục cha (tuỳ chọn)">
            <Select allowClear options={items.map((c) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
