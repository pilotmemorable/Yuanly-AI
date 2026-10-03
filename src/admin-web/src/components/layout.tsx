import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../auth';
import { tr } from '../tr';

const navItems: Array<{ to: string; label: string; emoji: string; end?: boolean }> = [
  { to: '/', label: tr.nav.dashboard, emoji: '▣', end: true },
  { to: '/users', label: tr.nav.users, emoji: '👤' },
  { to: '/companies', label: tr.nav.companies, emoji: '🏢' },
  { to: '/experiences', label: tr.nav.experiences, emoji: '✨' },
  { to: '/reservations', label: tr.nav.reservations, emoji: '🧾' },
  { to: '/audit', label: tr.nav.audit, emoji: '🛡️' },
  { to: '/account', label: tr.nav.account, emoji: '⚙️' },
] as const;

export function AppLayout(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const currentTitle = useMemo(() => {
    const found = navItems.find((item) => (item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)));
    return found?.label ?? tr.brand.name;
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <div
        className={sidebarOpen ? 'sidebar-overlay is-visible' : 'sidebar-overlay'}
        role="presentation"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={sidebarOpen ? 'sidebar is-open' : 'sidebar'}>
        <div className="sidebar-brand">
          <div className="brand-mark">缘</div>
          <div>
            <strong>{tr.brand.name}</strong>
            <span>{tr.brand.subtitle}</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Ana gezinme">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.emoji}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <strong>{user?.fullName || user?.email}</strong>
          <span>{user?.email}</span>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <button className="icon-button mobile-nav-button" type="button" onClick={() => setSidebarOpen((value) => !value)}>
            ☰
          </button>
          <div>
            <p className="eyebrow">Yuanly yönetim merkezi</p>
            <h1>{currentTitle}</h1>
          </div>
          <div className="header-user-card">
            <strong>{user?.fullName || 'Yönetici'}</strong>
            <span>{user?.email}</span>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
