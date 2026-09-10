import { useEffect, useMemo, useRef, useState } from 'react';
import { Row, Col, Card, Input, List, Button, InputNumber, Empty, Typography, Radio, message, Tag, Divider, Modal } from 'antd';
import { DeleteOutlined, SearchOutlined, PrinterOutlined } from '@ant-design/icons';
import { posApi } from '../../api/resources';
import { useUiStore } from '../../store/uiStore';
import { money } from '../../utils/format';

/** FR-POS-01/02/03/04: fast search, live stock guard, cash/QR checkout, single-transaction Reserve->Confirm->Complete. */
export default function PosPage() {
  const { selectedBranchId } = useUiStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [cart, setCart] = useState([]); // { product, quantity }
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [checkingOut, setCheckingOut] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runSearch = async (q) => {
    if (!q || !selectedBranchId) {
      setResults([]);
      return;
    }
    const data = await posApi.lookup(selectedBranchId, q);
    setResults(data);
  };

  // FR-POS-01: barcode scanner + Enter behaves as "scan and add to cart" in one motion.
  const onSearchSubmit = async () => {
    if (!query || !selectedBranchId) return;
    const data = await posApi.lookup(selectedBranchId, query);
    if (data.length === 1) {
      addToCart(data[0]);
      setQuery('');
      setResults([]);
    } else {
      setResults(data);
    }
  };

  const addToCart = (product) => {
    if (product.available <= 0) {
      message.warning(`${product.name} đã hết hàng khả dụng.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.available) {
          message.warning('Không đủ hàng khả dụng để thêm nữa.');
          return prev;
        }
        return prev.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId, quantity) => {
    setCart((prev) =>
      prev.map((l) => {
        if (l.product.id !== productId) return l;
        const requested = Math.max(1, Math.floor(quantity || 1));
        if (requested > l.product.available) {
          message.warning(
            `${l.product.name} chỉ còn ${l.product.available} sản phẩm khả dụng trong kho — đã điều chỉnh số lượng về ${l.product.available}.`,
            4,
          );
          return { ...l, quantity: l.product.available };
        }
        return { ...l, quantity: requested };
      }),
    );
  };

  const removeLine = (productId) => setCart((prev) => prev.filter((l) => l.product.id !== productId));

  const total = useMemo(() => cart.reduce((sum, l) => sum + l.quantity * Number(l.product.sellingPrice), 0), [cart]);

  const checkout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    try {
      const order = await posApi.checkout({
        branchId: selectedBranchId,
        paymentMethod,
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      });
      message.success('Thanh toán thành công!');
      setReceipt(order);
      setCart([]);
    } catch (err) {
      message.error(err.response?.data?.message ?? 'Thanh toán thất bại.');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <Row gutter={16} style={{ height: 'calc(100vh - 130px)' }}>
      <Col xs={24} lg={14} style={{ height: '100%' }}>
        <Card style={{ height: '100%' }} bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Input
            ref={inputRef}
            size="large"
            autoFocus
            placeholder="Quét mã vạch hoặc nhập tên / SKU rồi nhấn Enter..."
            prefix={<SearchOutlined />}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              runSearch(e.target.value);
            }}
            onPressEnter={onSearchSubmit}
          />
          <List
            style={{ marginTop: 12, flex: 1, overflowY: 'auto' }}
            dataSource={results}
            locale={{ emptyText: <Empty description="Nhập từ khoá để tìm sản phẩm" /> }}
            renderItem={(p) => (
              <List.Item
                onClick={() => addToCart(p)}
                style={{ cursor: 'pointer', padding: '10px 12px', borderRadius: 8 }}
                className="pos-result-item"
              >
                <List.Item.Meta
                  title={p.name}
                  description={`SKU: ${p.skuCode}${p.barcode ? ' · Mã vạch: ' + p.barcode : ''}`}
                />
                <div style={{ textAlign: 'right' }}>
                  <div>{money(p.sellingPrice)}</div>
                  <Tag color={p.available > 0 ? 'green' : 'red'}>Khả dụng: {p.available}</Tag>
                </div>
              </List.Item>
            )}
          />
        </Card>
      </Col>

      <Col xs={24} lg={10} style={{ height: '100%' }}>
        <Card title="Giỏ hàng" style={{ height: '100%' }} bodyStyle={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 58px)' }}>
          <List
            style={{ flex: 1, overflowY: 'auto' }}
            dataSource={cart}
            locale={{ emptyText: <Empty description="Chưa có sản phẩm nào" /> }}
            renderItem={(line) => (
              <List.Item
                actions={[
                  <Button key="del" danger type="text" icon={<DeleteOutlined />} onClick={() => removeLine(line.product.id)} />,
                ]}
              >
                <List.Item.Meta
                  title={line.product.name}
                  description={`${money(line.product.sellingPrice)} · Tối đa ${line.product.available}`}
                />
                {/* No `max` prop here on purpose: AntD silently clamps out-of-range typed
                    values on blur without telling the cashier, so a typed "9999" against
                    3 available would look accepted until the total quietly stayed small.
                    updateQty() does the clamping itself and surfaces a warning so the
                    cashier always knows when — and why — a quantity was corrected. */}
                <InputNumber
                  min={1}
                  value={line.quantity}
                  onChange={(v) => updateQty(line.product.id, v ?? 1)}
                />
              </List.Item>
            )}
          />

          <Divider style={{ margin: '12px 0' }} />

          <Typography.Title level={3} style={{ textAlign: 'right', margin: 0 }}>
            Tổng: {money(total)}
          </Typography.Title>

          <Radio.Group
            style={{ margin: '16px 0' }}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: 'Tiền mặt', value: 'CASH' },
              { label: 'QR chuyển khoản', value: 'QR_TRANSFER' },
            ]}
          />

          <Button
            type="primary"
            size="large"
            block
            disabled={cart.length === 0}
            loading={checkingOut}
            onClick={checkout}
          >
            Thanh toán ({cart.length} sản phẩm)
          </Button>
        </Card>
      </Col>

      <Modal
        open={!!receipt}
        onCancel={() => setReceipt(null)}
        title="Hoá đơn"
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>
            In hoá đơn
          </Button>,
          <Button key="close" type="primary" onClick={() => setReceipt(null)}>
            Đóng
          </Button>,
        ]}
      >
        {receipt && (
          <div id="receipt-print">
            <p>Mã đơn: {receipt.externalOrderId}</p>
            <List
              size="small"
              dataSource={receipt.items}
              renderItem={(i) => (
                <List.Item>
                  {i.product.name} x{i.quantity} — {money(i.quantity * i.sellingPrice)}
                </List.Item>
              )}
            />
            <Divider />
            <Typography.Title level={4} style={{ textAlign: 'right' }}>
              Tổng cộng: {money(receipt.items.reduce((s, i) => s + i.quantity * Number(i.sellingPrice), 0))}
            </Typography.Title>
          </div>
        )}
      </Modal>
    </Row>
  );
}
