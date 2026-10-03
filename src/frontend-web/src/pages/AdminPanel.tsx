import React, { useState, useEffect, useCallback } from 'react';
import { Route } from '../App';
import { useAuth } from '../context/AuthContext';
import { colors, font, spacing, radii, shadows, transitions, styles, formatCNY, formatNumber } from '../styles/theme';
import { AdminStats, adminApi, Merchant } from '../api/client';
import Sidebar, { NavItem } from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface AdminPanelProps {
  navigate: (route: Route) => void;
}

const navItems: NavItem[] = [
  { key: 'admin-dashboard', label: '平台概览', icon: '📊' },
  { key: 'admin-merchants', label: '商家审核', icon: '🏢' },
  { key: 'admin-financial', label: '财务总览', icon: '💰' },
];

const AdminPanel: React.FC<AdminPanelProps> = ({ navigate }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingMerchants, setPendingMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, pending] = await Promise.all([
        adminApi.stats(),
        adminApi.pendingMerchants(),
      ]);
      setStats(statsData);
      setPendingMerchants(Array.isArray(pending) ? pending : []);
    } catch (err: any) {
      setError(err.message || '加载平台数据失败');
      setStats({
        totalUsers: 0,
        totalMerchants: 0,
        totalExperiences: 0,
        totalBookings: 0,
        totalRevenue: 0,
        pendingMerchants: 0,
        activeBookings: 0,
        monthlyGrowth: 0,
        bookingsByMonth: [],
        revenueByMonth: [],
        topMerchants: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNav = (key: string) => navigate(key as Route);

  const monthlyData = stats?.bookingsByMonth?.map((m, i) => ({
    month: m.month,
    bookings: m.count,
    revenue: stats.revenueByMonth?.[i]?.revenue || 0,
  })) || [];

  const categoryData = [
    { name: '滑翔伞', value: 35 },
    { name: '热气球', value: 28 },
    { name: '文化体验', value: 18 },
    { name: '美食', value: 12 },
    { name: '其他', value: 7 },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.surface }}>
      <Sidebar
        items={navItems}
        activeKey="admin-dashboard"
        onSelect={handleNav}
        title="管理后台"
        subtitle={user?.nickname || 'Admin'}
        accentColor={colors.accent}
        onExit={() => navigate('landing')}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <Header
          title="平台概览"
          subtitle="Yuanly AI 平台运营数据"
          user={user}
          onLogout={logout}
          actions={
            pendingMerchants.length > 0 ? (
              <button
                onClick={() => navigate('admin-merchants')}
                style={{
                  ...styles.buttonPrimary,
                  backgroundColor: colors.accent,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}
              >
                🔔 {pendingMerchants.length} 待审核
              </button>
            ) : undefined
          }
        />

        <div style={{ padding: spacing.xl }}>
          {error && (
            <div
              style={{
                ...styles.card,
                backgroundColor: colors.warningBg,
                marginBottom: spacing.lg,
                fontSize: font.sizes.sm,
                color: colors.warning,
              }}
            >
              ⚠️ {error} — 确保后端服务正常运行。
            </div>
          )}

          {/* Top stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing.lg, marginBottom: spacing.xl }}>
            <StatCard
              label="总用户数"
              value={stats?.totalUsers || 0}
              icon="👥"
              accentColor={colors.primary}
              trend={{ value: 15.2, isPositive: true }}
              subtitle="本月增长"
            />
            <StatCard
              label="入驻商家"
              value={stats?.totalMerchants || 0}
              icon="🏢"
              accentColor={colors.secondary}
              subtitle={`${stats?.pendingMerchants || 0} 待审核`}
            />
            <StatCard
              label="体验总数"
              value={stats?.totalExperiences || 0}
              icon="🎯"
              accentColor={colors.info}
            />
            <StatCard
              label="订单总数"
              value={stats?.totalBookings || 0}
              icon="📋"
              accentColor={colors.primary}
              trend={{ value: stats?.monthlyGrowth || 0, isPositive: (stats?.monthlyGrowth || 0) >= 0 }}
              subtitle="月增长率"
            />
            <StatCard
              label="平台总收入"
              value={stats?.totalRevenue || 0}
              type="currency"
              icon="💰"
              accentColor={colors.primary}
              trend={{ value: 22.8, isPositive: true }}
              subtitle="本月"
            />
            <StatCard
              label="活跃订单"
              value={stats?.activeBookings || 0}
              icon="⚡"
              accentColor={colors.success}
            />
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: spacing.lg, marginBottom: spacing.xl }}>
            {/* Revenue & bookings trend */}
            <div style={styles.card}>
              <h3 style={{ fontSize: font.sizes.lg, fontWeight: font.weights.semibold, color: colors.text, marginBottom: spacing.lg }}>
                收入与订单趋势
              </h3>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.primary} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorBook" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.secondary} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={colors.secondary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: colors.textSecondary }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12, fill: colors.textSecondary }} tickFormatter={(v) => `¥${v / 1000}k`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: colors.textSecondary }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: `1px solid ${colors.border}`, fontSize: '13px' }} />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                    <Area yAxisId="left" type="monotone" dataKey="revenue" name="收入" stroke={colors.primary} strokeWidth={2.5} fill="url(#colorRev)" />
                    <Area yAxisId="right" type="monotone" dataKey="bookings" name="订单" stroke={colors.secondary} strokeWidth={2.5} fill="url(#colorBook)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textTertiary, flexDirection: 'column' as const, gap: spacing.sm }}>
                  <div style={{ fontSize: '40px', opacity: 0.3 }}>📈</div>
                  暂无数据
                </div>
              )}
            </div>

            {/* Category pie chart */}
            <div style={styles.card}>
              <h3 style={{ fontSize: font.sizes.lg, fontWeight: font.weights.semibold, color: colors.text, marginBottom: spacing.lg }}>
                体验分类分布
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={colors.chart[i % colors.chart.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: `1px solid ${colors.border}`, fontSize: '13px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top merchants + pending review */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
            {/* Top merchants */}
            <div style={styles.card}>
              <h3 style={{ fontSize: font.sizes.lg, fontWeight: font.weights.semibold, color: colors.text, marginBottom: spacing.lg }}>
                商家排行
              </h3>
              {(stats?.topMerchants || []).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: spacing.md }}>
                  {(stats?.topMerchants || []).map((m, i) => {
                    const maxRev = stats?.topMerchants?.[0]?.revenue || 1;
                    const pct = (m.revenue / maxRev) * 100;
                    return (
                      <div key={m.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: font.sizes.sm, fontWeight: font.weights.medium, color: colors.text }}>
                            {i + 1}. {m.name}
                          </span>
                          <span style={{ fontSize: font.sizes.xs, color: colors.textSecondary }}>
                            {formatNumber(m.bookings)} 单 · {formatCNY(m.revenue)}
                          </span>
                        </div>
                        <div style={{ height: '8px', backgroundColor: colors.surfaceAlt, borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${colors.secondary}, ${colors.secondaryDark})`,
                            borderRadius: '4px',
                            transition: transitions.slow,
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center' as const, padding: spacing.xl, color: colors.textSecondary, fontSize: font.sizes.sm }}>
                  暂无商家数据
                </div>
              )}
            </div>

            {/* Pending merchants */}
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
                <h3 style={{ fontSize: font.sizes.lg, fontWeight: font.weights.semibold, color: colors.text, margin: 0 }}>
                  待审核商家
                </h3>
                {pendingMerchants.length > 0 && (
                  <button
                    onClick={() => navigate('admin-merchants')}
                    style={{ ...styles.buttonGhost, fontSize: font.sizes.xs, color: colors.accent }}
                  >
                    查看全部 →
                  </button>
                )}
              </div>
              {pendingMerchants.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: spacing.sm }}>
                  {pendingMerchants.slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: spacing.md,
                        backgroundColor: colors.surface,
                        borderRadius: radii.small,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: font.sizes.sm, fontWeight: font.weights.semibold, color: colors.text }}>
                          {m.businessNameZh || m.businessName}
                        </div>
                        <div style={{ fontSize: font.sizes.xs, color: colors.textSecondary, marginTop: '2px' }}>
                          📍 {m.city} · {m.category} · {m.createdAt?.slice(0, 10)}
                        </div>
                      </div>
                      <span style={{ ...styles.pill, backgroundColor: colors.warningBg, color: colors.warning }}>
                        待审核
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center' as const, padding: spacing.xl, color: colors.textSecondary, fontSize: font.sizes.sm }}>
                  ✅ 暂无待审核商家
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;