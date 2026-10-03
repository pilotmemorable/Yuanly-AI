import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import MerchantLogin from './pages/MerchantLogin';
import MerchantDashboard from './pages/MerchantDashboard';
import MerchantExperiences from './pages/MerchantExperiences';
import MerchantBookings from './pages/MerchantBookings';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import AdminMerchants from './pages/AdminMerchants';
import AdminFinancial from './pages/AdminFinancial';

// ─── Simple state-based router ──────────────────────────────────────────────
// Routes:
//   'landing'         — public user portal
//   'merchant-login'  — merchant auth
//   'merchant-dashboard'
//   'merchant-experiences'
//   'merchant-bookings'
//   'admin-login'     — admin auth
//   'admin-dashboard'
//   'admin-merchants'
//   'admin-financial'

export type Route =
  | 'landing'
  | 'merchant-login'
  | 'merchant-dashboard'
  | 'merchant-experiences'
  | 'merchant-bookings'
  | 'admin-login'
  | 'admin-dashboard'
  | 'admin-merchants'
  | 'admin-financial';

const App: React.FC = () => {
  const [route, setRoute] = useState<Route>('landing');
  const { user, loading } = useAuth();

  // Guard: if trying to access merchant or admin pages without auth, redirect to login
  const navigate = (dest: Route) => {
    const merchantRoutes: Route[] = ['merchant-dashboard', 'merchant-experiences', 'merchant-bookings'];
    const adminRoutes: Route[] = ['admin-dashboard', 'admin-merchants', 'admin-financial'];

    if (merchantRoutes.includes(dest) && !user) {
      setRoute('merchant-login');
      return;
    }
    if (adminRoutes.includes(dest) && user?.role !== 'admin') {
      setRoute('admin-login');
      return;
    }
    setRoute(dest);
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: "'Inter', sans-serif",
          backgroundColor: '#F8F9FA',
          color: '#40E0D0',
          fontSize: '24px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>远</div>
          <div style={{ color: '#757575', fontSize: '16px' }}>Yuanly AI 加载中...</div>
        </div>
      </div>
    );
  }

  switch (route) {
    case 'landing':
      return <LandingPage navigate={navigate} />;
    case 'merchant-login':
      return <MerchantLogin navigate={navigate} />;
    case 'merchant-dashboard':
      return <MerchantDashboard navigate={navigate} />;
    case 'merchant-experiences':
      return <MerchantExperiences navigate={navigate} />;
    case 'merchant-bookings':
      return <MerchantBookings navigate={navigate} />;
    case 'admin-login':
      return <AdminLogin navigate={navigate} />;
    case 'admin-dashboard':
      return <AdminPanel navigate={navigate} />;
    case 'admin-merchants':
      return <AdminMerchants navigate={navigate} />;
    case 'admin-financial':
      return <AdminFinancial navigate={navigate} />;
    default:
      return <LandingPage navigate={navigate} />;
  }
};

export default App;