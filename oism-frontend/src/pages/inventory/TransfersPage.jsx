import { useEffect, useState } from 'react';
import { App, Table, Button, Modal, Form, Select, InputNumber, Space, Tag, Typography, Input, Popconfirm } from 'antd';
import { PlusOutlined, MinusCircleOutlined, SendOutlined, InboxOutlined, CloseOutlined } from '@ant-design/icons';
import { inventoryApi, productsApi } from '../../api/resources';
import { useUiStore } from '../../store/uiStore';

const STATUS_TAG = {
  DRAFT: <Tag color="default">Nháp</Tag>,
  IN_TRANSIT: <Tag color="processing">Đang chuyển</Tag>,
  COMPLETED: <Tag color="success">Hoàn tất</Tag>,
  CANCELLED: <Tag color="error">Đã huỷ</Tag>,
};

export default function TransfersPage() {
  const { message } = App.useApp();
  const { branches } = useUiStore();
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    inventoryApi.transfers
      .list()
      .then(setItems)
      .catch((err) => message.error(err.response?.data?.message ?? 'Không tải được danh sách phiếu chuyển kho.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    productsApi
      .search({ pageSize: 200 })
      .then((d) => setProducts(d.items))
      .catch((err) => message.error(err.response?.data?.message ?? 'Không tải được danh sách sản phẩm.'));
  }, []);

  const onCreate = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return; // invalid fields — AntD already highlights them inline
    }
    try {
      await inventoryApi.transfers.create(values);
      message.success('Đã tạo phiếu chuyển kho (nháp).');
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (err) {
      message.error(err.response?.data?.message ?? 'Có lỗi xảy ra.');
    }
  };

  const act = async (fn, id, okMsg) => {
    try {
      await fn(id);
      message.success(okMsg);
      load();
    } catch (err) {
      message.error(err.response?.data?.message ?? 'Có lỗi xảy ra.');
    }
  };

  const columns = [
    { title: 'Mã phiếu', dataIndex: 'code' },
    { title: 'Từ chi nhánh', dataIndex: ['fromBranch', 'name'] },
    { title: 'Đến chi nhánh', dataIndex: ['toBranch', 'name'] },
    { title: 'Trạng thái', dataIndex: 'status', render: (v) => STATUS_TAG[v] },
    {
      title: '',
      render: (_, r) => (
        <Space>
          {r.status === 'DRAFT' && (
            <>
              <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => act(inventoryApi.transfers.dispatch, r.id, 'Đã xuất kho, đang chuyển.')}>
                Xuất kho
              </Button>
              <Popconfirm title="Huỷ phiếu chuyển kho?" onConfirm={() => act(inventoryApi.transfers.cancel, r.id, 'Đã huỷ.')}>
                <Button size="small" danger icon={<CloseOutlined />} />
              </Popconfirm>
            </>
          )}
          {r.status === 'IN_TRANSIT' && (
            <Button size="small" type="primary" icon={<InboxOutlined />} onClick={() => act(inventoryApi.transfers.receive, r.id, 'Đã nhập kho đích.')}>
              Nhận hàng
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Typography.Title level={3}>Chuyển kho giữa các chi nhánh</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Tạo phiếu chuyển kho
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
              ]}
            />
          ),
        }}
      />

      <Modal open={modalOpen} title="Tạo phiếu chuyển kho" width={640} onCancel={() => setModalOpen(false)} onOk={onCreate} okText="Tạo phiếu">
        <Form layout="vertical" form={form} initialValues={{ items: [{}] }}>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="fromBranchId" label="Từ chi nhánh" style={{ width: '50%' }} rules={[{ required: true }]}>
              <Select options={branches.map((b) => ({ value: b.id, label: b.name }))} />
            </Form.Item>
            <Form.Item name="toBranchId" label="Đến chi nhánh" style={{ width: '50%' }} rules={[{ required: true }]}>
              <Select options={branches.map((b) => ({ value: b.id, label: b.name }))} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="note" label="Ghi chú">
            <Input />
          </Form.Item>

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
