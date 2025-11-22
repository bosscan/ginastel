import React from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import ProductGrid from './components/ProductGrid';
import CartView from './components/CartView';
import SalesReport from './components/SalesReport';
import StockReport from './components/StockReport';
import StockManagement from './components/StockManagement';
import { useAuth, AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { StockProvider } from './context/StockContext';

const Protected: React.FC<{ children: React.ReactNode; roles?: ('staff' | 'owner')[] }> = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <div>Akses ditolak</div>;
  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [openMenu, setOpenMenu] = React.useState(false);
  const location = useLocation();

  function currentTitle(path: string) {
    if (path === '/' || path.startsWith('/?')) return 'Kasir';
    if (path.startsWith('/report-sales')) return 'Report Penjualan';
    if (path.startsWith('/report-stock')) return 'Report Stok';
    if (path.startsWith('/stock')) return 'Input Stok';
    return 'Menu';
  }

  const title = currentTitle(location.pathname);

  return (
    <div>
      <nav className="topnav">
        <div className="nav-left">
          <button className="nav-toggle" onClick={() => setOpenMenu(o => !o)} aria-label="Toggle menu">☰</button>
          <span className="brand" data-active={title}>{title}</span>
        </div>
        <div className={`nav-links ${openMenu ? 'open' : ''}`}> 
          <Link to="/" onClick={() => setOpenMenu(false)}>Kasir</Link>
          <Link to="/report-sales" onClick={() => setOpenMenu(false)}>Report Penjualan</Link>
          <Link to="/report-stock" onClick={() => setOpenMenu(false)}>Report Stok</Link>
          {user?.role === 'owner' && (
            <Link to="/stock" onClick={() => setOpenMenu(false)}>Input Stok</Link>
          )}
        </div>
        {user && <div className="nav-right">
          <span className="user">{user.role === 'owner' ? 'Owner Outlet' : 'Penjaga Outlet'}</span>
          <button onClick={logout}>Logout</button>
        </div>}
      </nav>
      <main>{children}</main>
    </div>
  );
};

const CashierPage: React.FC = () => (
  <div className="cashier">
    <ProductGrid />
    <CartView />
  </div>
);

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<Protected><Layout><CashierPage /></Layout></Protected>} />
  <Route path="/report-sales" element={<Protected><Layout><SalesReport /></Layout></Protected>} />
  <Route path="/report-stock" element={<Protected><Layout><StockReport /></Layout></Protected>} />
    <Route path="/stock" element={<Protected roles={['owner']}><Layout><StockManagement /></Layout></Protected>} />
  </Routes>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <StockProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </StockProvider>
    </AuthProvider>
  );
};

export default App;
