import { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Layout, Menu, Select, Dropdown, Badge, Avatar, notification, Tag, List, Popover, Empty, Typography } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  AppstoreOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  ApiOutlined,
  TeamOutlined,
  BankOutlined,
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { branchesApi } from '../api/resources';
import { getSocket } from '../api/socket';

const { Header, Sider, Content } = Layout;

const ROLE_LABEL = { OWNER: 'Chủ cửa hàng', STAFF: 'Nhân viên', CASHIER: 'Thu ngân' };

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { branches, selectedBranchId, setBranches, setSelectedBranchId } = useUiStore();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    branchesApi.list().then((data) => {
      setBranches(data);
      if (!selectedBranchId && data.length > 0) setSelectedBranchId(data[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const pushEvent = (title, description) => {
      notification.open({ message: title, description, placement: 'topRight' });
      setEvents((prev) => [{ title, description, time: new Date() }, ...prev].slice(0, 20));
    };

    const onNewOrder = (order) => pushEvent('🔔 Đơn hàng mới', `${order.channel} - ${order.externalOrderId}`);
    const onWebhook = (data) => pushEvent('📦 Webhook đơn hàng', `Kênh ${data.channel} - ${data.reserved ? 'đã giữ hàng' : 'không đủ hàng, cần duyệt tay'}`);
    const onStockAlert = (alerts) => pushEvent('⚠️ Cảnh báo tồn kho thấp', `${alerts.length} SKU cần nhập thêm hàng`);

    socket.on('order:new', onNewOrder);
    socket.on('webhook:received', onWebhook);
    socket.on('stock:alert', onStockAlert);

    return () => {
      socket.off('order:new', onNewOrder);
      socket.off('webhook:received', onWebhook);
      socket.off('stock:alert', onStockAlert);
    };
  }, []);

  const menuItems = useMemo(() => {
    const items = [
      { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">Tổng quan</Link> },
      { key: '/pos', icon: <ShopOutlined />, label: <Link to="/pos">Bán hàng (POS)</Link> },
    ];

    if (user?.role !== 'CASHIER') {
      items.push(
        { key: '/catalog', icon: <AppstoreOutlined />, label: <Link to="/catalog">Sản phẩm & Danh mục</Link> },
        {
          key: '/inventory',
          icon: <InboxOutlined />,
          label: 'Kho hàng',
          children: [
            { key: '/inventory/stock', label: <Link to="/inventory/stock">Tồn kho theo chi nhánh</Link> },
            { key: '/inventory/receipts', label: <Link to="/inventory/receipts">Phiếu nhập hàng</Link> },
            { key: '/inventory/transfers', label: <Link to="/inventory/transfers">Chuyển kho</Link> },
            { key: '/inventory/stocktake', label: <Link to="/inventory/stocktake">Kiểm kê</Link> },
            { key: '/inventory/ledger', label: <Link to="/inventory/ledger">Sổ cái tồn kho</Link> },
          ],
        },
        { key: '/orders', icon: <ShoppingCartOutlined />, label: <Link to="/orders">Trung tâm đơn hàng</Link> },
        { key: '/reports', icon: <BarChartOutlined />, label: <Link to="/reports">Báo cáo</Link> },
        { key: '/webhook-simulator', icon: <ApiOutlined />, label: <Link to="/webhook-simulator">Giả lập Webhook</Link> },
      );
    }

    if (user?.role === 'OWNER') {
      items.push({
        key: '/admin',
        icon: <TeamOutlined />,
        label: 'Quản trị',
        children: [
          { key: '/admin/users', label: <Link to="/admin/users">Nhân viên & phân quyền</Link> },
          { key: '/admin/branches', icon: <BankOutlined />, label: <Link to="/admin/branches">Chi nhánh</Link> },
        ],
      });
    }

    return items;
  }, [user]);

  const userMenu = {
    items: [{ key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất' }],
    onClick: ({ key }) => {
      if (key === 'logout') {
        logout();
        navigate('/login');
      }
    },
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0" theme="dark" width={240}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, padding: '18px 20px' }}>
          OISM<span style={{ color: '#52c41a' }}>•</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['/inventory', '/admin']}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
          <Select
            style={{ width: 260 }}
            value={selectedBranchId}
            onChange={setSelectedBranchId}
            options={branches.map((b) => ({ value: b.id, label: b.name + (b.isActive ? '' : ' (ẩn)') }))}
            placeholder="Chọn chi nhánh"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Popover
              trigger="click"
              placement="bottomRight"
              title="Thông báo thời gian thực"
              content={
                <div style={{ width: 320, maxHeight: 360, overflowY: 'auto' }}>
                  {events.length === 0 ? (
                    <Empty description="Chưa có thông báo" />
                  ) : (
                    <List
                      size="small"
                      dataSource={events}
                      renderItem={(item) => (
                        <List.Item>
                          <List.Item.Meta
                            title={item.title}
                            description={
                              <>
                                <Typography.Text type="secondary">{item.description}</Typography.Text>
                                <br />
                                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                  {item.time.toLocaleTimeString('vi-VN')}
                                </Typography.Text>
                              </>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </div>
              }
            >
              <Badge count={events.length} size="small">
                <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
              </Badge>
            </Popover>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <div style={{ lineHeight: 1.2 }}>
                  <div>{user?.name}</div>
                  <Tag color="blue" style={{ marginTop: 2 }}>{ROLE_LABEL[user?.role] ?? user?.role}</Tag>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 20 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
