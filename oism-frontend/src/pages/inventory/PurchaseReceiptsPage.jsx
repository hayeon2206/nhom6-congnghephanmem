import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, Space, Tag, message, Typography, Input, Popconfirm } from 'antd';
import { PlusOutlined, MinusCircleOutlined, CheckOutlined } from '@ant-design/icons';
import { inventoryApi, productsApi } from '../../api/resources';
import { useUiStore } from '../../store/uiStore';

const money = (v) => Number(v ?? 0).toLocaleString('vi-VN') + ' đ';

export default function PurchaseReceiptsPage() {
  const { branches, selectedBranchId } = useUiStore();
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    inventoryApi.receipts.list().then(setItems).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    productsApi.search({ pageSize: 200 }).then((d) => setProducts(d.items));
  }, []);

  const onCreate = async () => {
    const values = await form.validateFields();
    await inventoryApi.receipts.create(values);
    message.success('Đã tạo phiếu nhập (trạng thái nháp).');
    setModalOpen(false);
    form.resetFields();
    load();
  };

  const onConfirm = async (id) => {
    await inventoryApi.receipts.confirm(id);
    message.success('Đã xác nhận nhập kho — giá vốn bình quân gia quyền đã được cập nhật.');
    load();
  };

  const columns = [
    { title: 'Mã phiếu', dataIndex: 'code' },
    { title: 'Chi nhánh', dataIndex: ['branch', 'name'] },
    { title: 'Nhà cung cấp', dataIndex: 'supplierName' },
    {
      title: 'Số dòng SP',
      render: (_, r) => r.items.length,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (v) => (v === 'CONFIRMED' ? <Tag color="green">Đã xác nhận</Tag> : <Tag color="orange">Nháp</Tag>),
    },
    {
      title: '',
      render: (_, r) =>
        r.status === 'DRAFT' && (
          <Popconfirm title="Xác nhận nhập kho? Giá vốn sẽ được tính lại theo bình quân gia quyền." onConfirm={() => onConfirm(r.id)}>
            <Button size="small" type="primary" icon={<CheckOutlined />}>
              Xác nhận nhập kho
            </Button>
          </Popconfirm>
        ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Typography.Title level={3}>Phiếu nhập hàng (FR-INV-02)</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Tạo phiếu nhập
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        expandable={{
          expandedRowRender: (r) => (
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={r.items}
              columns={[
                { title: 'Sản phẩm', dataIndex: ['product', 'name'] },
                { title: 'Số lượng', dataIndex: 'quantity', align: 'right' },
                { title: 'Đơn giá nhập', dataIndex: 'unitCost', render: money, align: 'right' },
              ]}
            />
          ),
        }}
      />

      <Modal open={modalOpen} title="Tạo phiếu nhập hàng" width={640} onCancel={() => setModalOpen(false)} onOk={onCreate} okText="Tạo phiếu">
        <Form layout="vertical" form={form} initialValues={{ branchId: selectedBranchId, items: [{}] }}>
          <Form.Item name="branchId" label="Chi nhánh nhập hàng" rules={[{ required: true }]}>
            <Select options={branches.map((b) => ({ value: b.id, label: b.name }))} />
          </Form.Item>
          <Form.Item name="supplierName" label="Nhà cung cấp">
            <Input />
          </Form.Item>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item {...rest} name={[name, 'productId']} rules={[{ required: true, message: 'Chọn sản phẩm' }]}>
                      <Select
                        style={{ width: 220 }}
                        showSearch
                        optionFilterProp="label"
                        placeholder="Sản phẩm"
                        options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.skuCode})` }))}
                      />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'quantity']} rules={[{ required: true }]}>
                      <InputNumber placeholder="SL" min={1} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'unitCost']} rules={[{ required: true }]}>
                      <InputNumber placeholder="Đơn giá nhập" min={0} style={{ width: 150 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                  Thêm dòng sản phẩm
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}
