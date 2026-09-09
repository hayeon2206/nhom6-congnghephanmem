import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import PosPage from './pages/pos/PosPage';
import CatalogPage from './pages/catalog/CatalogPage';
import StockPage from './pages/inventory/StockPage';
import PurchaseReceiptsPage from './pages/inventory/PurchaseReceiptsPage';
import TransfersPage from './pages/inventory/TransfersPage';
import StocktakePage from './pages/inventory/StocktakePage';
import LedgerPage from './pages/inventory/LedgerPage';
import OrdersPage from './pages/orders/OrdersPage';
import ReportsPage from './pages/reports/ReportsPage';
import WebhookSimulatorPage from './pages/orders/WebhookSimulatorPage';
import UsersPage from './pages/admin/UsersPage';
import BranchesPage from './pages/admin/BranchesPage';

function App() {
  return (
    <ConfigProvider locale={viVN} theme={{ token: { colorPrimary: '#1d4ed8', borderRadius: 8 } }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/pos" element={<PosPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/inventory/stock" element={<StockPage />} />
              <Route path="/inventory/receipts" element={<PurchaseReceiptsPage />} />
              <Route path="/inventory/transfers" element={<TransfersPage />} />
              <Route path="/inventory/stocktake" element={<StocktakePage />} />
              <Route path="/inventory/ledger" element={<LedgerPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/webhook-simulator" element={<WebhookSimulatorPage />} />

              <Route element={<ProtectedRoute roles={['OWNER']} />}>
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/branches" element={<BranchesPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
