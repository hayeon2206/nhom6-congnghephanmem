import { useEffect, useState } from 'react';
import { Table, Typography, Tag, Select } from 'antd';
import dayjs from 'dayjs';
import { inventoryApi } from '../../api/resources';
import { useUiStore } from '../../store/uiStore';

const TYPE_TAG = {
  IMPORT: <Tag color="blue">Nhập hàng</Tag>,
  SALE: <Tag color="red">Bán hàng</Tag>,
  RETURN: <Tag color="green">Hoàn trả</Tag>,
  STOCKTAKE: <Tag color="purple">Kiểm kê</Tag>,
  TRANSFER_OUT: <Tag color="orange">Xuất chuyển kho</Tag>,
  TRANSFER_IN: <Tag color="cyan">Nhập chuyển kho</Tag>,
  ADJUSTMENT: <Tag>Điều chỉnh</Tag>,
};

export default function LedgerPage() {
  const { branches, selectedBranchId, setSelectedBranchId } = useUiStore();
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    inventoryApi.ledger({ branchId: selectedBranchId, pageSize: 100 }).then(setData).finally(() => setLoading(false));
  }, [selectedBranchId]);

  const columns = [
    { title: 'Thời gian', dataIndex: 'createdAt', render: (v) => dayjs(v).format('HH:mm:ss DD/MM/YYYY') },
    { title: 'Sản phẩm', dataIndex: ['product', 'name'] },
    { title: 'Chi nhánh', dataIndex: ['branch', 'name'] },
    { title: 'Loại giao dịch', dataIndex: 'type', render: (v) => TYPE_TAG[v] ?? v },
    { title: 'Số lượng thay đổi', dataIndex: 'quantity', align: 'right' },
    { title: 'Tồn sau giao dịch', dataIndex: 'balanceAfter', align: 'right' },
    { title: 'Mã tham chiếu', dataIndex: 'referenceId', ellipsis: true },
  ];

  return (
    <div>
      <div className="page-header">
        <Typography.Title level={3}>Sổ cái tồn kho (append-only)</Typography.Title>
        <Select
          style={{ width: 240 }}
          allowClear
          placeholder="Tất cả chi nhánh"
          value={selectedBranchId}
          onChange={setSelectedBranchId}
          options={branches.map((b) => ({ value: b.id, label: b.name }))}
        />
      </div>
      <Typography.Paragraph type="secondary">
        NFR-SEC-03: bảng này chỉ ghi thêm (append-only), không cho phép sửa/xoá — mọi điều chỉnh đều tạo bút toán bù trừ mới.
      </Typography.Paragraph>
      <Table rowKey="id" columns={columns} dataSource={data.items} loading={loading} pagination={{ pageSize: 20 }} />
    </div>
  );
}
