import { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Select, Typography, message, Modal, Form, InputNumber, Input } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ordersApi, productsApi } from '../../api/resources';
import { useUiStore } from '../../store/uiStore';
import { money } from '../../utils/format';

const STATE_TAG = {
  DRAFT: <Tag>Nháp</Tag>,
  RESERVED: <Tag color="gold">Đang giữ chỗ</Tag>,
  CONFIRMED: <Tag color="blue">Đã xác nhận</Tag>,
  COMPLETED: <Tag color="green">Hoàn tất</Tag>,
  CANCELLED: <Tag color="red">Đã huỷ</Tag>,
};

export default function OrdersPage() {
  const { branches, selectedBranchId } = useUiStore();
  const [data, setData] = useState({ items: [] });
  const [stateFilter, setStateFilter] = useState();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    ordersApi.list({ state: stateFilter, pageSize: 100 }).then(setData).finally(() => setLoading(false));
  };

  useEffect(load, [stateFilter]);
  useEffect(() => {
    productsApi.search({ pageSize: 200 }).then((d) => setProducts(d.items));
  }, []);

  const act = async (fn, id, okMsg) => {
    try {
      await fn(id);
      message.success(okMsg);
      load();
    } catch (err) {
      message.error(err.response?.data?.message ?? 'Có lỗi xảy ra.');
    }
  };

  const onCreate = async () => {
    const values = await form.validateFields();
    await ordersApi.create(values);
    message.success('Đã tạo đơn hàng thủ công (Draft).');
    setModalOpen(false);
    form.resetFields();
    load();
  };

  const columns = [
    { title: 'Kênh', dataIndex: 'channel' },
    { title: 'Mã đơn', dataIndex: 'externalOrderId', ellipsis: true },
    { title: 'Chi nhánh', dataIndex: ['branch', 'name'] },
    { title: 'Số SP', render: (_, r) => r.items.length },
    {
      title: 'Tổng tiền',
      render: (_, r) => money(r.items.reduce((s, i) => s + i.quantity * Number(i.sellingPrice), 0)),
      align: 'right',
    },
    { title: 'Trạng thái', dataIndex: 'state', render: (v) => STATE_TAG[v] },
    { title: 'Tạo lúc', dataIndex: 'createdAt', render: (v) => dayjs(v).format('HH:mm DD/MM') },
    {
      title: 'Thao tác',
      render: (_, r) => (
        <Space>
          {r.state === 'DRAFT' && (
            <Button size="small" type="primary" onClick={() => act(ordersApi.reserve, r.id, 'Đã giữ chỗ tồn kho.')}>
              Giữ chỗ
            </Button>
          )}
          {r.state === 'RESERVED' && (
            <Button size="small" type="primary" onClick={() => act(ordersApi.confirm, r.id, 'Đã xác nhận & trừ kho.')}>
              Xác nhận
            </Button>
          )}
          {r.state === 'CONFIRMED' && (
            <Button size="small" onClick={() => act(ordersApi.complete, r.id, 'Đã hoàn tất đơn hàng.')}>
              Hoàn tất
            </Button>
          )}
          {(r.state === 'DRAFT' || r.state === 'RESERVED') && (
            <Button size="small" danger onClick={() => act(ordersApi.cancel, r.id, 'Đã huỷ đơn.')}>
              Huỷ
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Typography.Title level={3}>Trung tâm đơn hàng</Typography.Title>
        <Space>
          <Select
            style={{ width: 200 }}
            allowClear
            placeholder="Tất cả trạng thái"
            value={stateFilter}
            onChange={setStateFilter}
            options={['DRAFT', 'RESERVED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((s) => ({ value: s, label: s }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Tạo đơn thủ công
          </Button>
        </Space>
      </div>

      <Table rowKey="id" columns={columns} dataSource={data.items} loading={loading} pagination={{ pageSize: 20 }} />

      <Modal open={modalOpen} title="Tạo đơn hàng thủ công" width={640} onCancel={() => setModalOpen(false)} onOk={onCreate} okText="Tạo đơn">
        <Form layout="vertical" form={form} initialValues={{ branchId: selectedBranchId, items: [{}] }}>
          <Form.Item name="branchId" label="Chi nhánh" rules={[{ required: true }]}>
            <Select options={branches.map((b) => ({ value: b.id, label: b.name }))} />
          </Form.Item>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="customerName" label="Tên khách hàng" style={{ width: '50%' }}>
              <Input />
            </Form.Item>
            <Form.Item name="customerPhone" label="SĐT khách hàng" style={{ width: '50%' }}>
              <Input />
            </Form.Item>
          </Space.Compact>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item {...rest} name={[name, 'productId']} rules={[{ required: true, message: 'Chọn sản phẩm' }]}>
                      <Select
                        style={{ width: 260 }}
                        showSearch
                        optionFilterProp="label"
                        placeholder="Sản phẩm"
                        options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.skuCode})` }))}
                      />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'quantity']} rules={[{ required: true }]}>
                      <InputNumber placeholder="Số lượng" min={1} />
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
