import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, Space, Tag, message, Typography, Input } from 'antd';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';
import { inventoryApi } from '../../api/resources';
import { useUiStore } from '../../store/uiStore';

export default function StocktakePage() {
  const { branches, selectedBranchId } = useUiStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [countModal, setCountModal] = useState(null); // session being counted
  const [counts, setCounts] = useState({});
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    inventoryApi.stocktake.list().then(setSessions).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onOpenSession = async () => {
    const values = await form.validateFields();
    await inventoryApi.stocktake.open(values);
    message.success('Đã mở phiên kiểm kê — hệ thống đã chốt số liệu tồn kho hiện tại.');
    setOpenModal(false);
    form.resetFields();
    load();
  };

  const startCounting = (session) => {
    setCountModal(session);
    setCounts(Object.fromEntries(session.items.map((i) => [i.productId, i.countedQty])));
  };

  const submitCount = async () => {
    const items = Object.entries(counts).map(([productId, countedQty]) => ({ productId, countedQty }));
    await inventoryApi.stocktake.complete(countModal.id, items);
    message.success('Đã hoàn tất kiểm kê — chênh lệch đã được ghi vào sổ cái tồn kho.');
    setCountModal(null);
    load();
  };

  const columns = [
    { title: 'Mã phiên', dataIndex: 'code' },
    { title: 'Chi nhánh', dataIndex: ['branch', 'name'] },
    { title: 'Trạng thái', dataIndex: 'status', render: (v) => (v === 'COMPLETED' ? <Tag color="green">Hoàn tất</Tag> : <Tag color="orange">Đang kiểm</Tag>) },
    {
      title: '',
      render: (_, r) =>
        r.status === 'OPEN' && (
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => startCounting(r)}>
            Nhập số đếm thực tế
          </Button>
        ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Typography.Title level={3}>Kiểm kê kho (FR-INV-04)</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenModal(true)}>
          Mở phiên kiểm kê
        </Button>
      </div>

      <Table rowKey="id" columns={columns} dataSource={sessions} loading={loading} />

      <Modal open={openModal} title="Mở phiên kiểm kê" onCancel={() => setOpenModal(false)} onOk={onOpenSession} okText="Mở phiên">
        <Form layout="vertical" form={form} initialValues={{ branchId: selectedBranchId }}>
          <Form.Item name="branchId" label="Chi nhánh" rules={[{ required: true }]}>
            <Select options={branches.map((b) => ({ value: b.id, label: b.name }))} />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={!!countModal}
        title={`Nhập số đếm thực tế — ${countModal?.code}`}
        width={640}
        onCancel={() => setCountModal(null)}
        onOk={submitCount}
        okText="Hoàn tất kiểm kê"
      >
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={countModal?.items ?? []}
          columns={[
            { title: 'Sản phẩm', dataIndex: ['product', 'name'] },
            { title: 'Tồn hệ thống', dataIndex: 'systemQty', align: 'right' },
            {
              title: 'Số đếm thực tế',
              align: 'right',
              render: (_, r) => (
                <InputNumber
                  min={0}
                  value={counts[r.productId]}
                  onChange={(v) => setCounts((prev) => ({ ...prev, [r.productId]: v ?? 0 }))}
                />
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
}
