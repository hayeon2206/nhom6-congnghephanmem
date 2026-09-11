import { useEffect, useState } from 'react';
import { App, Table, Typography, Tag, Select } from 'antd';
import { inventoryApi } from '../../api/resources';
import { useUiStore } from '../../store/uiStore';

export default function StockPage() {
  const { message } = App.useApp();
  const { branches, selectedBranchId, setSelectedBranchId } = useUiStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    inventoryApi
      .stock(selectedBranchId)
      .then(setItems)
      .catch((err) => message.error(err.response?.data?.message ?? 'Không tải được tồn kho theo chi nhánh.'))
      .finally(() => setLoading(false));
  }, [selectedBranchId]);

  const columns = [
    { title: 'Sản phẩm', dataIndex: ['product', 'name'] },
    { title: 'SKU', dataIndex: ['product', 'skuCode'] },
    { title: 'Tồn thực tế', dataIndex: 'onHand', align: 'right' },
    { title: 'Đang giữ chỗ', dataIndex: 'reserved', align: 'right' },
    {
      title: 'Khả dụng',
      align: 'right',
      render: (_, r) => {
        const available = r.onHand - r.reserved;
        const low = available <= r.product.reorderThreshold;
        return <Tag color={low ? 'red' : 'green'}>{available}</Tag>;
      },
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Typography.Title level={3}>Tồn kho theo chi nhánh</Typography.Title>
        <Select
          style={{ width: 240 }}
          value={selectedBranchId}
          onChange={setSelectedBranchId}
          options={branches.map((b) => ({ value: b.id, label: b.name }))}
        />
      </div>
      <Table rowKey="id" columns={columns} dataSource={items} loading={loading} pagination={{ pageSize: 20 }} />
    </div>
  );
}
