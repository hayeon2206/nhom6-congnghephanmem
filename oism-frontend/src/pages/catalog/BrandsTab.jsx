import { useEffect, useState } from 'react';
import { App, Table, Button, Modal, Form, Input, Space, Popconfirm, Avatar } from 'antd';
import { PlusOutlined, TagsOutlined } from '@ant-design/icons';
import { brandsApi } from '../../api/resources';
import { resolveImageUrl } from '../../utils/format';
import ImageUploadField from '../../components/ImageUploadField';

export default function BrandsTab() {
  const { message } = App.useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    brandsApi
      .list()
      .then(setItems)
      .catch((err) => message.error(err.response?.data?.message ?? 'Không tải được danh sách thương hiệu.'))
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
      await brandsApi.create(values);
      message.success('Đã thêm thương hiệu.');
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (err) {
      message.error(err.response?.data?.message ?? 'Có lỗi xảy ra.');
    }
  };

  const onDelete = async (id) => {
    try {
      await brandsApi.remove(id);
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
      render: (url) => <Avatar shape="square" size={40} src={url ? resolveImageUrl(url) : undefined} icon={<TagsOutlined />} />,
    },
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
          <Form.Item name="imageUrl" label="Hình ảnh">
            <ImageUploadField />
          </Form.Item>
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
