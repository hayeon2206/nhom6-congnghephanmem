import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, List, Tag, Spin } from 'antd';
import { DollarOutlined, RiseOutlined, WarningOutlined, ShoppingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { reportsApi, ordersApi } from '../../api/resources';
import { useUiStore } from '../../store/uiStore';

const money = (v) => Number(v ?? 0).toLocaleString('vi-VN') + ' đ';

export default function DashboardPage() {
  const { selectedBranchId } = useUiStore();
  const [revenue, setRevenue] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const today = dayjs().startOf('day').toISOString();

    Promise.all([
      reportsApi.revenue({ from: today, branchId: selectedBranchId }),
      reportsApi.stockAlerts(selectedBranchId),
      ordersApi.list({ state: 'RESERVED', pageSize: 5 }),
    ])
      .then(([rev, stockAlerts, orders]) => {
        setRevenue(rev);
        setAlerts(stockAlerts);
        setPendingOrders(orders.items);
      })
      .finally(() => setLoading(false));
  }, [selectedBranchId]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;

  return (
    <div>
      <div className="page-header">
        <Typography.Title level={3}>Tổng quan hôm nay</Typography.Title>
      </div>

      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic title="Doanh thu hôm nay" value={money(revenue?.totalRevenue)} prefix={<DollarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic title="Lợi nhuận gộp" value={money(revenue?.grossProfit)} prefix={<RiseOutlined />} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic title="Đơn chờ xử lý" value={pendingOrders.length} prefix={<ShoppingOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic title="Cảnh báo tồn kho thấp" value={alerts.length} prefix={<WarningOutlined />} valueStyle={{ color: alerts.length ? '#cf1322' : undefined }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 20 }}>
        <Col xs={24} lg={12}>
          <Card title="Đơn hàng đang giữ chỗ (Reserved) cần duyệt">
            <List
              dataSource={pendingOrders}
              locale={{ emptyText: 'Không có đơn nào đang chờ' }}
              renderItem={(o) => (
                <List.Item>
                  <List.Item.Meta
                    title={`${o.channel} · ${o.externalOrderId}`}
                    description={`${o.items.length} sản phẩm · ${dayjs(o.createdAt).format('HH:mm DD/MM')}`}
                  />
                  <Tag color="gold">Reserved</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="SKU cần nhập thêm hàng (FR-REP-03)">
            <List
              dataSource={alerts.slice(0, 8)}
              locale={{ emptyText: 'Tồn kho đang ổn định' }}
              renderItem={(a) => (
                <List.Item>
                  <List.Item.Meta title={`${a.productName} (${a.skuCode})`} description={a.branchName} />
                  <Tag color="red">Còn {a.available}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
