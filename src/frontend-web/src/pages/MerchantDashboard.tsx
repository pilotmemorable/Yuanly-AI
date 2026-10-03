import React, { useState, useEffect, useCallback } from 'react';
import { Route } from '../App';
import { useAuth } from '../context/AuthContext';
import { colors, font, spacing, radii, shadows, transitions, styles, formatCNY, formatNumber } from '../styles/theme';
import { DashboardStats, Booking, merchantApi, bookingApi } from '../api/client';
import Sidebar, { NavItem } from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import DataTable, { Column } from '../components/DataTable';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from 'recharts';

interface MerchantDashboardProps {
  navigate: (route: Route) => void;
}

const navItems: NavItem[] = [
  { key: 'merchant-dashboard', label: '数据概览', icon: '📊' },
  { key: 'merchant-experiences', label: '体验管理', icon: '🎯' },
  { key: 'merchant-bookings', label: '订单管理', icon: '📋' },
];

const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ navigate }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const merchantId = user?.merchantId || user?.id || '';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashData, bookingData] = await Promise.all([
        merchantApi.dashboard(merchantId),
        bookingApi.list({ limit: 5 }),
      ]);
      setStats(dashData);
      setBookings(Array.isArray(bookingData) ? bookingData : (bookingData as any).data || []);
    } catch (err: any) {
      setError(err.message || '加载数据失败');
      // Use fallback mock data so UI still renders for demo
      setStats({
        totalBookings: 0,
        totalRevenue: 0,
        averageRating: 0,
        monthlyBookings: [],
        monthlyRevenue: [],
        recentBookings: [],
        topExperiences: [],
      });
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNav = (key: string) => navigate(key as Route);

  const bookingColumns: Column<Booking>[] = [
    { key: 'userNickname', label: '用户', render: (b) => b.userNickname || `用户${b.userId?.slice(-4) || ''}` },
    { key: 'experienceTitle', label: '体验', render: (b) => b.experienceTitle || `体验#${b.experienceId?.slice(-4)}` },
    { key: 'slotDate', label: '日期', render: (b) => b.slotDate || b.createdAt?.slice(0, 10) || '-' },
    { key: 'status', label: '状态' },
    { key: 'totalAmount', label: '金额', align: 'right', render: (b) => formatCNY(b.totalAmount) },
  ];

  // Chart data
  const monthlyData = stats?.monthlyBookings?.map((m, i) => ({
    month: m.month,
    bookings: m.count,
    revenue: stats.monthlyRevenue?.[i]?.revenue || 0,
  })) || [];

  const topExperiences = stats?.topExperiences || [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.surface }}>
      <Sidebar
        items={navItems}
        activeKey="merchant-dashboard"
        onSelect={handleNav}
        title="商家中心"
        subtitle={user?.nickname || 'Merchant'}
        onExit={() => navigate('landing')}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <Header
          title="数据概览"
          subtitle="商家经营数据实时统计"
          user={user}
          onLogout={logout}
          actions={
            <button
              onClick={() => navigate('merchant-experiences')}
              style={styles.buttonPrimary}
            >
              + 新建体验
            </button>
          }
        />

        <div style={{ padding: spacing.xl }}>
          {error && (
            <div
              style={{
                ...styles.card,
                backgroundColor: colors.warningBg,
                borderColor: colors.warning,
                marginBottom: spacing.lg,
                fontSize: font.sizes.sm,
                color: colors.warning,
              }}
            >
              ⚠️ {error} — 显示的为空数据，请确保后端服务正常运行。
            </div>
          )}

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: spacing.lg, marginBottom: spacing.xl }}>
            <StatCard
              label="总订单数"
              value={stats?.totalBookings || 0}
              type="number"
              icon="📋"
              accentColor={colors.primary}
              trend={{ value: 12.5, isPositive: true }}
              subtitle="本月"
            />
            <StatCard
              label="总收入"
              value={stats?.totalRevenue || 0}
              type="currency"
              icon="💰"
              accentColor={colors.primary}
              trend={{ value: 8.3, isPositive: true }}
              subtitle="本月"
            />
            <StatCard
              label="平均评分"
              value={stats?.averageRating || 0}
              type="rating"
              icon="⭐"
              accentColor={colors.secondary}
              subtitle={`${stats?.recentBookings?.length || 0} 条评价`}
            />
            <StatCard
              label="待处理订单"
              value={stats?.recentBookings?.filter((b) => b.status === 'pending' || b.status === 'on_hold').length || 0}
              type="number"
              icon="⏳"
              accentColor={colors.accent}
              subtitle="需要确认"
            />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg, marginBottom: spacing.xl }}>
            {/* Revenue chart */}
            <div style={styles.card}>
              <h3 style={{ fontSize: font.sizes.lg, fontWeight: font.weights.semibold, color: colors.text, marginBottom: spacing.lg }}>
                收入趋势
              </h3>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.primary} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: colors.textSecondary }} />
                    <YAxis tick={{ fontSize: 12, fill: colors.textSecondary }} tickFormatter={(v) => `¥${v / 1000}k`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: `1px solid ${colors.border}`, fontSize: '13px' }}
                      formatter={(value: number) => [formatCNY(value), '收入']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={colors.primary}
                      strokeWidth={2.5}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>

            {/* Bookings chart */}
            <div style={styles.card}>
              <h3 style={{ fontSize: font.sizes.lg, fontWeight: font.weights.semibold, color: colors.text, marginBottom: spacing.lg }}>
                订单趋势
              </h3>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: colors.textSecondary }} />
                    <YAxis tick={{ fontSize: 12, fill: colors.textSecondary }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: `1px solid ${colors.border}`, fontSize: '13px' }}
                    />
                    <Bar dataKey="bookings" fill={colors.secondary} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>

          {/* Top experiences + Recent bookings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg, marginBottom: spacing.xl }}>
            {/* Top experiences */}
            <div style={styles.card}>
              <h3 style={{ fontSize: font.sizes.lg, fontWeight: font.weights.semibold, color: colors.text, marginBottom: spacing.lg }}>
                热门体验
              </h3>
              {topExperiences.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: spacing.md }}>
                  {topExperiences.map((exp, i) => {
                    const maxBookings = topExperiences[0]?.bookings || 1;
                    const pct = (exp.bookings / maxBookings) * 100;
                    return (
                      <div key={exp.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: font.sizes.sm, color: colors.text, fontWeight: font.weights.medium }}>
                            {i + 1}. {exp.title}
                          </span>
                          <span style={{ fontSize: font.sizes.xs, color: colors.textSecondary }}>
                            {formatNumber(exp.bookings)} 单 · {formatCNY(exp.revenue)}
                          </span>
                        </div>
                        <div
                          style={{
                            height: '8px',
                            backgroundColor: colors.surfaceAlt,
                            borderRadius: '4px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryDark})`,
                              borderRadius: '4px',
                              transition: transitions.slow,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center' as const, padding: spacing.xl, color: colors.textSecondary, fontSize: font.sizes.sm }}>
                  暂无体验数据
                </div>
              )}
            </div>

            {/* Recent bookings */}
            <div style={styles.card}>
              <h3 style={{ fontSize: font.sizes.lg, fontWeight: font.weights.semibold, color: colors.text, marginBottom: spacing.lg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                最近订单
                <button
                  onClick={() => navigate('merchant-bookings')}
                  style={{ ...styles.buttonGhost, fontSize: font.sizes.xs, color: colors.primary }}
                >
                  查看全部 →
                </button>
              </h3>
              <DataTable
                columns={bookingColumns}
                data={bookings}
                rowKey={(b) => b.id}
                pageSize={5}
                loading={loading}
                emptyMessage="暂无订单"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyChart: React.FC = () => (
  <div
    style={{
      height: 250,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.textTertiary,
      fontSize: font.sizes.sm,
      flexDirection: 'column' as const,
      gap: spacing.sm,
    }}
  >
    <div style={{ fontSize: '40px', opacity: 0.3 }}>📈</div>
    暂无数据
  </div>
);

export default MerchantDashboard;