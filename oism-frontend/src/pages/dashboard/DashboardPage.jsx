import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, List, Tag, Spin, Empty } from 'antd';
import {
  WalletOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { reportsApi, ordersApi } from '../../api/resources';
import { useUiStore } from '../../store/uiStore';
import { money } from '../../utils/format';

function StatCard({ icon, tone, label, value, hint }) {
  const tones = {
    accent: { bg: 'var(--color-accent-soft)', fg: 'var(--color-accent)' },
    success: { bg: 'var(--color-success-soft)', fg: 'var(--color-success)' },
    warning: { bg: 'var(--color-warning-soft)', fg: 'var(--color-warning)' },
    danger: { bg: 'var(--color-danger-soft)', fg: 'var(--color-danger)' },
  }[tone];

  return (
    <Card className="stat-card" bodyStyle={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, fontWeight: 500 }}>{label}</div>
          <div className="num" style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text)', marginTop: 6, letterSpacing: '-0.01em' }}>
            {value}
          </div>
          {hint && <div style={{ color: 'var(--color-text-tertiary)', fontSize: 12, marginTop: 4 }}>{hint}</div>}
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: tones.bg,
            color: tones.fg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

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

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '96px auto' }} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">{dayjs().format('dddd, DD/MM/YYYY')}</div>
          <Typography.Title level={3}>Tổng quan</Typography.Title>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard icon={<WalletOutlined />} tone="accent" label="Doanh thu hôm nay" value={money(revenue?.totalRevenue)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<RiseOutlined />}
            tone="success"
            label="Lợi nhuận gộp"
            value={money(revenue?.grossProfit)}
            hint={revenue?.grossMarginPercent != null ? `Biên lợi nhuận ${revenue.grossMarginPercent}%` : undefined}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard icon={<ShoppingCartOutlined />} tone="accent" label="Đơn chờ xử lý" value={pendingOrders.length} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<WarningOutlined />}
            tone={alerts.length ? 'danger' : 'success'}
            label="Cảnh báo tồn kho thấp"
            value={alerts.length}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title="Đơn hàng đang giữ chỗ cần duyệt"
            extra={
              <Link to="/orders" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Xem tất cả <ArrowRightOutlined style={{ fontSize: 11 }} />
              </Link>
            }
          >
            <List
              dataSource={pendingOrders}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có đơn nào đang chờ" /> }}
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
          <Card
            title="SKU cần nhập thêm hàng"
            extra={
              <Link to="/reports" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Xem báo cáo <ArrowRightOutlined style={{ fontSize: 11 }} />
              </Link>
            }
          >
            <List
              dataSource={alerts.slice(0, 8)}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Tồn kho đang ổn định" /> }}
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
