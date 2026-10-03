import React, { useState, useEffect, useCallback } from 'react';
import { Route } from '../App';
import { useAuth } from '../context/AuthContext';
import { colors, font, spacing, radii, shadows, transitions, styles, formatCNY, statusPillStyle } from '../styles/theme';
import { FinancialOverview, adminApi, Booking } from '../api/client';
import Sidebar, { NavItem } from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import DataTable, { Column } from '../components/DataTable';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface AdminFinancialProps {
  navigate: (route: Route) => void;
}

const navItems: NavItem[] = [
  { key: 'admin-dashboard', label: '平台概览', icon: '📊' },
  { key: 'admin-merchants', label: '商家审核', icon: '🏢' },
  { key: 'admin-financial', label: '财务总览', icon: '💰' },
];

const AdminFinancial: React.FC<AdminFinancialProps> = ({ navigate }) => {
  const { user, logout } = useAuth();
  const [financial, setFinancial] = useState<FinancialOverview | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [finData, bookingsData] = await Promise.all([
        adminApi.financial(),
        adminApi.allBookings({ limit: 50 }),
      ]);
      setFinancial(finData);
      setAllBookings(Array.isArray(bookingsData) ? bookingsData : (bookingsData as any).data || []);
    } catch (err: any) {
      setError(err.message || '加载财务数据失败');
      setFinancial({
        totalRevenue: 0,
        platformCommission: 0,
        merchantPayouts: 0,
        pendingPayouts: 0,
        refundedAmount: 0,
        transactions: [],
        revenueByMerchant: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNav = (key: string) => navigate(key as Route);

  // Revenue by merchant chart data
  const revenueByMerchant = financial?.revenueByMerchant || [];
  const maxRevenue = Math.max(...revenueByMerchant.map((m) => m.revenue), 1);

  // Pie data for revenue breakdown
  const breakdownData = financial
    ? [
        { name: '商家分成', value: financial.merchantPayouts, color: colors.primary },
        { name: '平台佣金', value: financial.platformCommission, color: colors.secondary },
        { name: '待结算', value: financial.pendingPayouts, color: colors.warning },
        { name: '已退款', value: financial.refundedAmount, color: colors.accent },
      ].filter((d) => d.value > 0)
    : [];

  const commissionRate = financial && financial.totalRevenue > 0
    ? ((financial.platformCommission / financial.totalRevenue) * 100).toFixed(1)
    : '0';

  const bookingColumns: Column<Booking>[] = [
    {
      key: 'id',
      label: '订单号',
      render: (b) => <span style={{ fontFamily: 'monospace', fontSize: font.sizes.xs }}>#{b.id?.slice(-8)}</span>,
    },
    {
      key: 'userNickname',
      label: '用户',
      render: (b) => b.userNickname || `用户${b.userId?.slice(-4) || ''}`,
    },
    {
      key: 'experienceTitle',
      label: '体验',
      render: (b) => b.experienceTitle || `体验#${b.experienceId?.slice(-4)}`,
    },
    { key: 'totalAmount', label: '金额', align: 'right', render: (b) => formatCNY(b.totalAmount), sortable: true },
    { key: 'status', label: '状态' },
    { key: 'paymentStatus', label: '支付状态' },
    {
      key: 'createdAt',
      label: '创建时间',
      render: (b) => b.createdAt?.slice(0, 10) || '-',
    },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.surface }}>
      <Sidebar
        items={navItems}
        activeKey="admin-financial"
        onSelect={handleNav}
        title="管理后台"
        subtitle={user?.nickname || 'Admin'}
        accentColor={colors.accent}
        onExit={() => navigate('landing')}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <Header
          title="财务总览"
          subtitle="平台财务数据分析"
          user={user}
          onLogout={logout}
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

          {/* Financial stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing.lg, marginBottom: spacing.xl }}>
            <StatCard
              label="平台总收入"
              value={financial?.totalRevenue || 0}
              type="currency"
              icon="💰"
              accentColor={colors.primary}
              trend={{ value: 22.8, isPositive: true }}
              subtitle="本月"
            />
            <StatCard
              label="平台佣金"
              value={financial?.platformCommission || 0}
              type="currency"
              icon="🏦"
              accentColor={colors.secondary}
              subtitle={`佣金率 ${commissionRate}%`}
            />
            <StatCard
              label="商家分成"
              value={financial?.merchantPayouts || 0}
              type="currency"
              icon="📤"
              accentColor={colors.success}
              subtitle="已结算"
            />
            <StatCard
              label="待结算"
              value={financial?.pendingPayouts || 0}
              type="currency"
              icon="⏳"
              accentColor={colors.warning}
            />
            <StatCard
              label="已退款"
              value={financial?.refundedAmount || 0}
              type="currency"
              icon="↩️"
              accentColor={colors.accent}
            />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg, marginBottom: spacing.xl }}>
            {/* Revenue breakdown pie */}
            <div style={styles.card}>
              <h3 style={{ fontSize: font.sizes.lg, fontWeight: font.weights.semibold, color: colors.text, marginBottom: spacing.lg }}>
                收入构成
              </h3>
              {breakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={breakdownData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={(entry: any) => `${entry.name}: ${formatCNY(entry.value)}`}
                    >
                      {breakdownData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: `1px solid ${colors.border}`, fontSize: '13px' }}
                      formatter={(value: number) => formatCNY(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textTertiary, flexDirection: 'column' as const, gap: spacing.sm }}>
                  <div style={{ fontSize: '40px', opacity: 0.3 }}>💰</div>
                  暂无财务数据
                </div>
              )}
            </div>

            {/* Revenue by merchant bar chart */}
            <div style={styles.card}>
              <h3 style={{ fontSize: font.sizes.lg, fontWeight: font.weights.semibold, color: colors.text, marginBottom: spacing.lg }}>
                各商家收入
              </h3>
              {revenueByMerchant.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByMerchant} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: colors.textSecondary }} tickFormatter={(v) => `¥${v / 1000}k`} />
                    <YAxis type="category" dataKey="merchantName" tick={{ fontSize: 11, fill: colors.textSecondary }} width={80} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: `1px solid ${colors.border}`, fontSize: '13px' }}
                      formatter={(value: number) => formatCNY(value)}
                    />
                    <Bar dataKey="revenue" fill={colors.primary} radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textTertiary, flexDirection: 'column' as const, gap: spacing.sm }}>
                  <div style={{ fontSize: '40px', opacity: 0.3 }}>📊</div>
                  暂无数据
                </div>
              )}
            </div>
          </div>

          {/* Revenue by merchant table */}
          {revenueByMerchant.length > 0 && (
            <div style={{ ...styles.card, marginBottom: spacing.xl }}>
              <h3 style={{ fontSize: font.sizes.lg, fontWeight: font.weights.semibold, color: colors.text, marginBottom: spacing.lg }}>
                商家收入明细
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.borderLight}` }}>
                    <th style={{ padding: spacing.md, textAlign: 'left' as const, fontSize: font.sizes.xs, color: colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>商家</th>
                    <th style={{ padding: spacing.md, textAlign: 'right' as const, fontSize: font.sizes.xs, color: colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>总收入</th>
                    <th style={{ padding: spacing.md, textAlign: 'right' as const, fontSize: font.sizes.xs, color: colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>平台佣金</th>
                    <th style={{ padding: spacing.md, textAlign: 'right' as const, fontSize: font.sizes.xs, color: colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>占比</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByMerchant.map((m, i) => {
                    const pct = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                    return (
                      <tr key={m.merchantId || i} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                        <td style={{ padding: spacing.md, fontSize: font.sizes.sm, fontWeight: font.weights.medium, color: colors.text }}>
                          {m.merchantName}
                        </td>
                        <td style={{ padding: spacing.md, fontSize: font.sizes.sm, textAlign: 'right' as const, fontWeight: font.weights.semibold, color: colors.primary }}>
                          {formatCNY(m.revenue)}
                        </td>
                        <td style={{ padding: spacing.md, fontSize: font.sizes.sm, textAlign: 'right' as const, color: colors.secondary }}>
                          {formatCNY(m.commission)}
                        </td>
                        <td style={{ padding: spacing.md, fontSize: font.sizes.sm, textAlign: 'right' as const, color: colors.textSecondary }}>
                          {pct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* All bookings table */}
          <div style={styles.card}>
            <h3 style={{ fontSize: font.sizes.lg, fontWeight: font.weights.semibold, color: colors.text, marginBottom: spacing.lg }}>
              全平台订单 ({allBookings.length})
            </h3>
            <DataTable
              columns={bookingColumns}
              data={allBookings}
              rowKey={(b) => b.id}
              pageSize={15}
              loading={loading}
              emptyMessage="暂无订单数据"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFinancial;