import { useEffect, useState } from 'react';
import { App, Card, Form, Select, Input, InputNumber, Button, Space, Typography, Table, Tag, Row, Col, Alert } from 'antd';
import { PlusOutlined, MinusCircleOutlined, SendOutlined, ThunderboltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { webhooksApi, productsApi } from '../../api/resources';
import { useUiStore } from '../../store/uiStore';

export default function WebhookSimulatorPage() {
  const { message } = App.useApp();
  const { branches, selectedBranchId } = useUiStore();
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [singleForm] = Form.useForm();
  const [burstForm] = Form.useForm();
  const [burstResult, setBurstResult] = useState(null);
  const [sending, setSending] = useState(false);
  const [bursting, setBursting] = useState(false);

  const loadLogs = () =>
    webhooksApi
      .logs()
      .then(setLogs)
      .catch((err) => message.error(err.response?.data?.message ?? 'Không tải được nhật ký webhook.'));

  useEffect(() => {
    loadLogs();
    productsApi
      .search({ pageSize: 200 })
      .then((d) => setProducts(d.items))
      .catch((err) => message.error(err.response?.data?.message ?? 'Không tải được danh sách sản phẩm.'));
  }, []);

  const sendSingle = async () => {
    let values;
    try {
      values = await singleForm.validateFields();
    } catch {
      return; // invalid fields — AntD already highlights them inline
    }
    setSending(true);
    try {
      const result = await webhooksApi.simulate({
        ...values,
        externalOrderId: values.externalOrderId || `SIM-${Date.now()}`,
      });
      message.success(
        result.isDuplicate
          ? 'Webhook trùng lặp — đã trả về đơn cũ (idempotent).'
          : result.reserved
          ? 'Đơn hàng đã được tạo và giữ chỗ thành công.'
          : 'Đơn hàng đã được tạo nhưng KHÔNG đủ hàng để giữ chỗ — cần nhân viên duyệt tay.',
      );
      loadLogs();
    } catch (err) {
      message.error(err.response?.data?.message ?? 'Gửi webhook thất bại.');
    } finally {
      setSending(false);
    }
  };

  const runBurst = async () => {
    let values;
    try {
      values = await burstForm.validateFields();
    } catch {
      return;
    }
    setBursting(true);
    setBurstResult(null);
    try {
      const result = await webhooksApi.burst(values);
      setBurstResult(result);
      loadLogs();
    } catch (err) {
      message.error(err.response?.data?.message ?? 'Chạy kiểm thử thất bại.');
    } finally {
      setBursting(false);
    }
  };

  const columns = [
    { title: 'Thời gian', dataIndex: 'receivedAt', render: (v) => dayjs(v).format('HH:mm:ss DD/MM') },
    { title: 'Kênh', dataIndex: 'channel' },
    { title: 'Trùng lặp?', dataIndex: 'isDuplicate', render: (v) => (v ? <Tag color="orange">Trùng (idempotent)</Tag> : <Tag color="green">Mới</Tag>) },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <Typography.Title level={3}>Giả lập đơn hàng sàn TMĐT</Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Công cụ kiểm thử: mô phỏng đơn hàng đổ về từ Shopee, TikTok Shop, Lazada để kiểm tra hệ thống xử lý đúng trước khi kết nối kênh thật.
          </Typography.Paragraph>
        </div>
      </div>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Gửi 1 đơn giả lập (Shopee / TikTok / Lazada)">
            <Form layout="vertical" form={singleForm} initialValues={{ channel: 'SHOPEE', branchId: selectedBranchId, items: [{}] }}>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name="channel" label="Kênh bán" style={{ width: '50%' }} rules={[{ required: true }]}>
                  <Select options={['SHOPEE', 'TIKTOK', 'LAZADA'].map((c) => ({ value: c, label: c }))} />
                </Form.Item>
                <Form.Item name="branchId" label="Chi nhánh xử lý" style={{ width: '50%' }} rules={[{ required: true }]}>
                  <Select options={branches.map((b) => ({ value: b.id, label: b.name }))} />
                </Form.Item>
              </Space.Compact>
              <Form.Item name="externalOrderId" label="Mã đơn từ kênh (bỏ trống để tự sinh)">
                <Input placeholder="VD: SHOPEE-000123" />
              </Form.Item>

              <Form.List name="items">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...rest }) => (
                      <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                        <Form.Item {...rest} name={[name, 'skuCode']} rules={[{ required: true, message: 'Chọn SKU' }]}>
                          <Select
                            style={{ width: 240 }}
                            showSearch
                            placeholder="SKU sản phẩm"
                            options={products.map((p) => ({ value: p.skuCode, label: `${p.name} (${p.skuCode})` }))}
                          />
                        </Form.Item>
                        <Form.Item {...rest} name={[name, 'quantity']} rules={[{ required: true }]}>
                          <InputNumber placeholder="SL" min={1} />
                        </Form.Item>
                        <MinusCircleOutlined onClick={() => remove(name)} />
                      </Space>
                    ))}
                    <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                      Thêm sản phẩm
                    </Button>
                  </>
                )}
              </Form.List>

              <Button type="primary" icon={<SendOutlined />} loading={sending} onClick={sendSingle} style={{ marginTop: 16 }}>
                Gửi webhook giả lập
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Kiểm thử chống bán vượt tồn kho">
            <Typography.Paragraph type="secondary">
              Gửi nhiều đơn hàng cùng lúc vào một sản phẩm để kiểm chứng: dù bao nhiêu đơn ập về cùng lúc, tổng số lượng
              được giữ chỗ thành công không bao giờ vượt quá số hàng thực sự còn trong kho.
            </Typography.Paragraph>
            <Form layout="vertical" form={burstForm} initialValues={{ channel: 'SHOPEE', branchId: selectedBranchId, quantityPerOrder: 1, concurrentOrders: 20 }}>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name="channel" label="Kênh bán" style={{ width: '50%' }} rules={[{ required: true }]}>
                  <Select options={['SHOPEE', 'TIKTOK', 'LAZADA'].map((c) => ({ value: c, label: c }))} />
                </Form.Item>
                <Form.Item name="branchId" label="Chi nhánh" style={{ width: '50%' }} rules={[{ required: true }]}>
                  <Select options={branches.map((b) => ({ value: b.id, label: b.name }))} />
                </Form.Item>
              </Space.Compact>
              <Form.Item name="productId" label="Sản phẩm cần test" rules={[{ required: true }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.skuCode}) — khả dụng: ${p.available}` }))}
                />
              </Form.Item>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name="quantityPerOrder" label="SL mỗi đơn" style={{ width: '50%' }}>
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="concurrentOrders" label="Số đơn đồng thời" style={{ width: '50%' }}>
                  <InputNumber min={1} max={200} style={{ width: '100%' }} />
                </Form.Item>
              </Space.Compact>
              <Button type="primary" danger icon={<ThunderboltOutlined />} loading={bursting} onClick={runBurst}>
                Bắn đồng thời
              </Button>
            </Form>

            {burstResult && (
              <Alert
                style={{ marginTop: 16 }}
                type="success"
                showIcon
                message={`Kết quả: ${burstResult.reserved}/${burstResult.total} đơn giữ chỗ thành công, ${burstResult.rejected} bị từ chối do hết hàng, ${burstResult.failed} lỗi khác.`}
                description="Không có trường hợp nào tồn kho khả dụng bị âm — hệ thống xử lý tuần tự và chính xác dù nhiều đơn đến cùng lúc."
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Nhật ký webhook gần đây" style={{ marginTop: 16 }}>
        <Table rowKey="id" columns={columns} dataSource={logs} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}
