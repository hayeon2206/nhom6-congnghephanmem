import { useEffect, useState } from 'react';
import { App, Tabs, Typography, Row, Col, Card, Statistic, DatePicker, Select, Space, Table, Progress, Tag } from 'antd';
import dayjs from 'dayjs';
import { reportsApi } from '../../api/resources';
import { useUiStore } from '../../store/uiStore';
import { money } from '../../utils/format';

const { RangePicker } = DatePicker;

function RevenueTab() {
  const { message } = App.useApp();
  const { branches, selectedBranchId, setSelectedBranchId } = useUiStore();
  const [range, setRange] = useState([dayjs().startOf('month'), dayjs()]);
  const [report, setReport] = useState(null);

  useEffect(() => {
    reportsApi
      .revenue({ from: range[0]?.toISOString(), to: range[1]?.toISOString(), branchId: selectedBranchId })
      .then(setReport)
      .catch((err) => message.error(err.response?.data?.message ?? 'Không tải được báo cáo doanh thu.'));
  }, [range, selectedBranchId]);

  const maxRevenue = Math.max(1, ...(report?.revenueByProduct.map((p) => p.value) ?? [1]));

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <RangePicker value={range} onChange={setRange} />
        <Select
          style={{ width: 200 }}
          allowClear
          placeholder="Tất cả chi nhánh"
          value={selectedBranchId}
          onChange={setSelectedBranchId}
          options={branches.map((b) => ({ value: b.id, label: b.name }))}
        />
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card"><Statistic title="Doanh thu thuần" value={money(report?.totalRevenue)} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card"><Statistic title="Tổng giá vốn hàng bán" value={money(report?.totalCostOfGoodsSold)} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card"><Statistic title="Lợi nhuận gộp" value={money(report?.grossProfit)} valueStyle={{ color: 'var(--color-success)' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card"><Statistic title="Biên lợi nhuận" value={`${report?.grossMarginPercent ?? 0}%`} /></Card>
        </Col>
      </Row>

      <Card title="Doanh thu theo sản phẩm" style={{ marginTop: 16 }}>
        {report?.revenueByProduct
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
          .map((p) => (
            <div key={p.key} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{p.key}</span>
                <span>{money(p.value)}</span>
              </div>
              <Progress percent={Math.round((p.value / maxRevenue) * 100)} showInfo={false} />
            </div>
          ))}
      </Card>
    </div>
  );
}

function VelocityTab() {
  const { message } = App.useApp();
  const { branches, selectedBranchId, setSelectedBranchId } = useUiStore();
  const [report, setReport] = useState(null);

  useEffect(() => {
    reportsApi
      .velocity({ branchId: selectedBranchId })
      .then(setReport)
      .catch((err) => message.error(err.response?.data?.message ?? 'Không tải được báo cáo vòng quay tồn kho.'));
  }, [selectedBranchId]);

  return (
    <div>
      <Select
        style={{ width: 200, marginBottom: 16 }}
        allowClear
        placeholder="Tất cả chi nhánh"
        value={selectedBranchId}
        onChange={setSelectedBranchId}
        options={branches.map((b) => ({ value: b.id, label: b.name }))}
      />

      <Card className="stat-card">
        <Statistic title="Tổng giá trị tồn kho (theo giá vốn)" value={money(report?.totalInventoryValue)} />
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Bán chạy nhất">
            <Table
              size="small"
              rowKey="productId"
              pagination={false}
              dataSource={report?.bestSellers}
              columns={[
                { title: 'Sản phẩm', dataIndex: 'name' },
                { title: 'SL đã bán', dataIndex: 'unitsSold', align: 'right' },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Bán chậm">
            <Table
              size="small"
              rowKey="productId"
              pagination={false}
              dataSource={report?.slowMovers}
              columns={[
                { title: 'Sản phẩm', dataIndex: 'name' },
                { title: 'Tồn kho', dataIndex: 'onHand', align: 'right' },
                { title: 'SL đã bán', dataIndex: 'unitsSold', align: 'right' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function StockAlertsTab() {
  const { message } = App.useApp();
  const { branches, selectedBranchId, setSelectedBranchId } = useUiStore();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    reportsApi
      .stockAlerts(selectedBranchId)
      .then(setAlerts)
      .catch((err) => message.error(err.response?.data?.message ?? 'Không tải được cảnh báo tồn kho.'));
  }, [selectedBranchId]);

  return (
    <div>
      <Select
        style={{ width: 200, marginBottom: 16 }}
        allowClear
        placeholder="Tất cả chi nhánh"
        value={selectedBranchId}
        onChange={setSelectedBranchId}
        options={branches.map((b) => ({ value: b.id, label: b.name }))}
      />
      <Table
        rowKey={(r) => r.productId + r.branchId}
        dataSource={alerts}
        columns={[
          { title: 'Sản phẩm', dataIndex: 'productName' },
          { title: 'SKU', dataIndex: 'skuCode' },
          { title: 'Chi nhánh', dataIndex: 'branchName' },
          { title: 'Khả dụng', dataIndex: 'available', align: 'right', render: (v) => <Tag color="red">{v}</Tag> },
          { title: 'Ngưỡng cảnh báo', dataIndex: 'threshold', align: 'right' },
        ]}
      />
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div>
      <div className="page-header">
        <Typography.Title level={3}>Báo cáo</Typography.Title>
      </div>
      <Tabs
        items={[
          { key: 'revenue', label: 'Doanh thu & Lợi nhuận', children: <RevenueTab /> },
          { key: 'velocity', label: 'Tồn kho & Vòng quay', children: <VelocityTab /> },
          { key: 'alerts', label: 'Cảnh báo tồn kho', children: <StockAlertsTab /> },
        ]}
      />
    </div>
  );
}
