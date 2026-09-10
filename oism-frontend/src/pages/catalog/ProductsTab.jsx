import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Tag, message, Typography } from 'antd';
import { PlusOutlined, BarcodeOutlined } from '@ant-design/icons';
import { productsApi, categoriesApi, brandsApi } from '../../api/resources';
import { money } from '../../utils/format';

export default function ProductsTab() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    productsApi.search({ pageSize: 100 }).then(setData).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    categoriesApi.list().then(setCategories);
    brandsApi.list().then(setBrands);
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      skuCode: record.skuCode,
      barcode: record.barcode,
      categoryId: record.categoryId,
      brandId: record.brandId,
      sellingPrice: Number(record.sellingPrice),
      wholesalePrice: record.wholesalePrice ? Number(record.wholesalePrice) : undefined,
      reorderThreshold: record.reorderThreshold,
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await productsApi.update(editing.id, values);
        message.success('Đã cập nhật sản phẩm.');
      } else {
        await productsApi.create(values);
        message.success('Đã tạo sản phẩm mới (SKU/mã vạch tự sinh nếu bỏ trống).');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      if (err?.response) message.error(err.response.data?.message ?? 'Có lỗi xảy ra.');
    }
  };

  const columns = [
    { title: 'Tên sản phẩm', dataIndex: 'name' },
    { title: 'SKU', dataIndex: 'skuCode' },
    { title: 'Mã vạch', dataIndex: 'barcode', render: (v) => v && <Tag icon={<BarcodeOutlined />}>{v}</Tag> },
    { title: 'Danh mục', dataIndex: ['category', 'name'] },
    { title: 'Giá vốn (BQGQ)', dataIndex: 'costPrice', render: money, align: 'right' },
    { title: 'Giá bán', dataIndex: 'sellingPrice', render: money, align: 'right' },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      render: (v) => (v ? <Tag color="green">Đang bán</Tag> : <Tag>Ngừng bán</Tag>),
    },
    {
      title: '',
      render: (_, record) => <Button size="small" onClick={() => openEdit(record)}>Sửa</Button>,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm sản phẩm
        </Button>
      </Space>

      <Table rowKey="id" columns={columns} dataSource={data.items} loading={loading} pagination={{ pageSize: 20 }} />

      <Modal
        open={modalOpen}
        title={editing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
        onCancel={() => setModalOpen(false)}
        onOk={onSubmit}
        okText="Lưu"
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Typography.Paragraph type="secondary" style={{ marginTop: -12 }}>
            Để trống SKU / mã vạch để hệ thống tự sinh.
          </Typography.Paragraph>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="skuCode" label="Mã SKU" style={{ width: '50%' }}>
              <Input placeholder="Tự sinh nếu để trống" disabled={!!editing} />
            </Form.Item>
            <Form.Item name="barcode" label="Mã vạch (EAN-13)" style={{ width: '50%' }}>
              <Input placeholder="Tự sinh nếu để trống" />
            </Form.Item>
          </Space.Compact>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="categoryId" label="Danh mục" style={{ width: '50%' }}>
              <Select allowClear options={categories.map((c) => ({ value: c.id, label: c.name }))} />
            </Form.Item>
            <Form.Item name="brandId" label="Thương hiệu" style={{ width: '50%' }}>
              <Select allowClear options={brands.map((b) => ({ value: b.id, label: b.name }))} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="sellingPrice" label="Giá bán lẻ" style={{ width: '50%' }} rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="wholesalePrice" label="Giá bán sỉ" style={{ width: '50%' }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="reorderThreshold" label="Ngưỡng cảnh báo tồn kho tối thiểu" initialValue={5}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
