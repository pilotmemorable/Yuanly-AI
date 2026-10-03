import React, { useState, useEffect, useCallback } from 'react';
import { Route } from '../App';
import { useAuth } from '../context/AuthContext';
import { colors, font, spacing, radii, shadows, transitions, styles, formatCNY, statusPillStyle } from '../styles/theme';
import { Booking, bookingApi } from '../api/client';
import Sidebar, { NavItem } from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import DataTable, { Column } from '../components/DataTable';

interface MerchantBookingsProps {
  navigate: (route: Route) => void;
}

const navItems: NavItem[] = [
  { key: 'merchant-dashboard', label: '数据概览', icon: '📊' },
  { key: 'merchant-experiences', label: '体验管理', icon: '🎯' },
  { key: 'merchant-bookings', label: '订单管理', icon: '📋' },
];

type FilterStatus = 'all' | 'pending' | 'on_hold' | 'confirmed' | 'cancelled' | 'completed';

const MerchantBookings: React.FC<MerchantBookingsProps> = ({ navigate }) => {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = filter !== 'all' ? { status: filter, limit: 100 } : { limit: 100 };
      const data = await bookingApi.list(params);
      setBookings(Array.isArray(data) ? data : (data as any).data || []);
    } catch (err: any) {
      setError(err.message || '加载订单失败');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleConfirm = async (booking: Booking) => {
    setActionLoading(booking.id);
    try {
      await bookingApi.confirm({ bookingId: booking.id });
      await loadBookings();
    } catch (err: any) {
      setError(err.message || '确认订单失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (booking: Booking) => {
    if (!confirm('确定要取消此订单吗？')) return;
    setActionLoading(booking.id);
    try {
      await bookingApi.cancel(booking.id, '商家取消');
      await loadBookings();
    } catch (err: any) {
      setError(err.message || '取消订单失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewQR = async (booking: Booking) => {
    try {
      const data = await bookingApi.getQR(booking.id);
      setSelectedBooking({ ...booking, qrCode: data.qrCode });
    } catch (err: any) {
      setSelectedBooking(booking);
    }
  };

  const handleNav = (key: string) => navigate(key as Route);

  const filteredBookings = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  const counts = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending' || b.status === 'on_hold').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    revenue: bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed').reduce((s, b) => s + (b.totalAmount || 0), 0),
  };

  const columns: Column<Booking>[] = [
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
    {
      key: 'slotDate',
      label: '日期',
      render: (b) => b.slotDate || b.createdAt?.slice(0, 10) || '-',
    },
    { key: 'participants', label: '人数', align: 'center' },
    { key: 'totalAmount', label: '金额', align: 'right', render: (b) => formatCNY(b.totalAmount), sortable: true },
    { key: 'status', label: '状态', sortable: true },
    { key: 'paymentStatus', label: '支付' },
    {
      key: 'actions',
      label: '操作',
      align: 'center',
      render: (b) => (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
          <button
            onClick={(e) => { e.stopPropagation(); handleViewQR(b); }}
            style={{ ...miniBtnStyle, color: colors.info, borderColor: colors.info }}
            title="查看二维码"
          >
            QR
          </button>
          {(b.status === 'pending' || b.status === 'on_hold') && (
            <button
              onClick={(e) => { e.stopPropagation(); handleConfirm(b); }}
              disabled={actionLoading === b.id}
              style={{ ...miniBtnStyle, color: colors.success, borderColor: colors.success }}
              title="确认订单"
            >
              {actionLoading === b.id ? '...' : '✓'}
            </button>
          )}
          {b.status !== 'cancelled' && b.status !== 'completed' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCancel(b); }}
              disabled={actionLoading === b.id}
              style={{ ...miniBtnStyle, color: colors.accent, borderColor: colors.accent }}
              title="取消订单"
            >
              {actionLoading === b.id ? '...' : '✕'}
            </button>
          )}
        </div>
      ),
    },
  ];

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待确认' },
    { key: 'on_hold', label: '保留中' },
    { key: 'confirmed', label: '已确认' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.surface }}>
      <Sidebar
        items={navItems}
        activeKey="merchant-bookings"
        onSelect={handleNav}
        title="商家中心"
        subtitle={user?.nickname || 'Merchant'}
        onExit={() => navigate('landing')}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <Header
          title="订单管理"
          subtitle="查看和管理客户预订"
          user={user}
          onLogout={logout}
        />

        <div style={{ padding: spacing.xl }}>
          {error && (
            <div
              style={{
                ...styles.card,
                backgroundColor: colors.dangerBg,
                marginBottom: spacing.lg,
                fontSize: font.sizes.sm,
                color: colors.danger,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md, marginBottom: spacing.xl }}>
            <StatCard label="订单总数" value={counts.total} icon="📋" accentColor={colors.primary} />
            <StatCard label="待处理" value={counts.pending} icon="⏳" accentColor={colors.warning} />
            <StatCard label="已确认" value={counts.confirmed} icon="✅" accentColor={colors.success} />
            <StatCard label="收入" value={counts.revenue} type="currency" icon="💰" accentColor={colors.primary} />
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' as const }}>
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  padding: '8px 18px',
                  borderRadius: radii.pill,
                  border: `1.5px solid ${filter === tab.key ? colors.primary : colors.border}`,
                  backgroundColor: filter === tab.key ? colors.primary : colors.white,
                  color: filter === tab.key ? colors.white : colors.textSecondary,
                  fontSize: font.sizes.sm,
                  fontWeight: font.weights.medium,
                  cursor: 'pointer',
                  fontFamily: font.family,
                  transition: transitions.fast,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Bookings table */}
          <div style={styles.card}>
            <DataTable
              columns={columns}
              data={filteredBookings}
              rowKey={(b) => b.id}
              pageSize={15}
              loading={loading}
              emptyMessage="暂无订单"
            />
          </div>
        </div>
      </div>

      {/* QR code modal */}
      {selectedBooking && (
        <div
          onClick={() => setSelectedBooking(null)}
          style={{
            position: 'fixed' as const,
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.white,
              borderRadius: radii.card,
              padding: spacing.xl,
              textAlign: 'center' as const,
              maxWidth: '360px',
            }}
          >
            <h3 style={{ fontSize: font.sizes.lg, fontWeight: font.weights.bold, marginBottom: spacing.md }}>
              订单二维码
            </h3>
            <div style={{ fontSize: font.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg }}>
              #{selectedBooking.id?.slice(-8)} · {selectedBooking.experienceTitle}
            </div>
            {selectedBooking.qrCode ? (
              <img
                src={selectedBooking.qrCode}
                alt="QR Code"
                style={{ width: '200px', height: '200px', borderRadius: radii.small }}
              />
            ) : (
              <div
                style={{
                  width: '200px',
                  height: '200px',
                  margin: '0 auto',
                  backgroundColor: colors.surface,
                  borderRadius: radii.small,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '60px',
                }}
              >
                📱
              </div>
            )}
            <div style={{ marginTop: spacing.lg }}>
              <span style={statusPillStyle(selectedBooking.status)}>{selectedBooking.status}</span>
            </div>
            <button
              onClick={() => setSelectedBooking(null)}
              style={{ ...styles.buttonSecondary, marginTop: spacing.lg }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const miniBtnStyle: React.CSSProperties = {
  padding: '4px 10px',
  border: `1.5px solid ${colors.border}`,
  borderRadius: '6px',
  backgroundColor: 'transparent',
  fontSize: font.sizes.xs,
  fontWeight: font.weights.semibold,
  cursor: 'pointer',
  fontFamily: font.family,
  transition: transitions.fast,
};

export default MerchantBookings;