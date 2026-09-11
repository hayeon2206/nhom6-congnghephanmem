import { useEffect, useState } from 'react';
import { App, Table, Button, Modal, Form, Input, Select, Space, Popconfirm, Avatar } from 'antd';
import { PlusOutlined, AppstoreOutlined } from '@ant-design/icons';
import { categoriesApi } from '../../api/resources';
import { resolveImageUrl } from '../../utils/format';
import ImageUploadField from '../../components/ImageUploadField';

export default function CategoriesTab() {
  const { message } = App.useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    categoriesApi
      .list()
      .then(setItems)
      .catch((err) => message.error(err.response?.data?.message ?? 'Không tải được danh sách danh mục.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return; // invalid fields — AntD already highlights them inline
    }
    try {
      await categoriesApi.create(values);
      message.success('Đã thêm danh mục.');
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (err) {
      message.error(err.response?.data?.message ?? 'Có lỗi xảy ra.');
    }
  };

  const onDelete = async (id) => {
    try {
      await categoriesApi.remove(id);
      message.success('Đã xoá.');
      load();
    } catch (err) {
      message.error(err.response?.data?.message ?? 'Có lỗi xảy ra.');
    }
  };

  const columns = [
    {
      title: '',
      dataIndex: 'imageUrl',
      width: 56,
      render: (url) => <Avatar shape="square" size={40} src={url ? resolveImageUrl(url) : undefined} icon={<AppstoreOutlined />} />,
    },
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
          <Form.Item name="imageUrl" label="Hình ảnh">
            <ImageUploadField />
          </Form.Item>
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
