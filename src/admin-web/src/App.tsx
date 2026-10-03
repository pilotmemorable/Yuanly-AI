import { Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from './auth';
import { AppLayout } from './components/layout';
import { LoadingState } from './components/ui';
import AccountPage from './pages/AccountPage';
import AuditLogsPage from './pages/AuditLogsPage';
import CompaniesPage from './pages/CompaniesPage';
import DashboardPage from './pages/DashboardPage';
import ExperiencesPage from './pages/ExperiencesPage';
import LoginPage from './pages/LoginPage';
import ReservationsPage from './pages/ReservationsPage';
import UsersPage from './pages/UsersPage';

export default function App(): JSX.Element {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="screen-shell">
        <LoadingState label="Oturum doğrulanıyor…" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="experiences" element={<ExperiencesPage />} />
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="audit" element={<AuditLogsPage />} />
        <Route path="account" element={<AccountPage />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}
