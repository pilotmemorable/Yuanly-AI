import React, { useState, useEffect, useCallback } from 'react';
import { Route } from '../App';
import { useAuth } from '../context/AuthContext';
import { colors, font, spacing, radii, shadows, transitions, styles, statusPillStyle } from '../styles/theme';
import { Merchant, adminApi, merchantApi } from '../api/client';
import Sidebar, { NavItem } from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import DataTable, { Column } from '../components/DataTable';

interface AdminMerchantsProps {
  navigate: (route: Route) => void;
}

const navItems: NavItem[] = [
  { key: 'admin-dashboard', label: '平台概览', icon: '📊' },
  { key: 'admin-merchants', label: '商家审核', icon: '🏢' },
  { key: 'admin-financial', label: '财务总览', icon: '💰' },
];

type FilterTab = 'pending' | 'verified' | 'all' | 'suspended';

const AdminMerchants: React.FC<AdminMerchantsProps> = ({ navigate }) => {
  const { user, logout } = useAuth();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);

  const loadMerchants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let data: Merchant[];
      if (filter === 'pending') {
        data = await adminApi.pendingMerchants();
      } else {
        data = await merchantApi.list();
      }
      setMerchants(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || '加载商家列表失败');
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadMerchants();
  }, [loadMerchants]);

  const handleVerify = async (merchant: Merchant, approved: boolean) => {
    setActionLoading(merchant.id);
    try {
      await adminApi.verifyMerchant(merchant.id, {
        approved,
        notes: approved ? '审核通过' : '资料不全，请补充后重新申请',
      });
      await loadMerchants();
      setSelectedMerchant(null);
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleNav = (key: string) => navigate(key as Route);

  const filteredMerchants = merchants.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return m.status === 'pending';
    if (filter === 'verified') return m.status === 'verified';
    if (filter === 'suspended') return m.status === 'suspended';
    return true;
  });

  const counts = {
    pending: merchants.filter((m) => m.status === 'pending').length,
    verified: merchants.filter((m) => m.status === 'verified').length,
    suspended: merchants.filter((m) => m.status === 'suspended').length,
    total: merchants.length,
  };

  const columns: Column<Merchant>[] = [
    {
      key: 'businessName',
      label: '商家名称',
      render: (m) => (
        <div>
          <div style={{ fontWeight: font.weights.semibold }}>{m.businessNameZh || m.businessName}</div>
          <div style={{ fontSize: font.sizes.xs, color: colors.textSecondary }}>{m.businessName}</div>
        </div>
      ),
    },
    { key: 'contactName', label: '联系人' },
    { key: 'contactPhone', label: '电话' },
    { key: 'city', label: '城市' },
    { key: 'category', label: '类别' },
    {
      key: 'rating',
      label: '评分',
      align: 'center',
      render: (m) => (
        <span>
          <span style={{ color: colors.secondary }}>★</span> {m.rating?.toFixed(1) || '—'}
        </span>
      ),
    },
    { key: 'status', label: '状态' },
    {
      key: 'actions',
      label: '操作',
      align: 'center',
      render: (m) => (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedMerchant(m); }}
            style={{ ...miniBtnStyle, color: colors.info, borderColor: colors.info }}
          >
            详情
          </button>
          {m.status === 'pending' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleVerify(m, true); }}
                disabled={actionLoading === m.id}
                style={{ ...miniBtnStyle, color: colors.success, borderColor: colors.success }}
              >
                {actionLoading === m.id ? '...' : '通过'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleVerify(m, false); }}
                disabled={actionLoading === m.id}
                style={{ ...miniBtnStyle, color: colors.accent, borderColor: colors.accent }}
              >
                {actionLoading === m.id ? '...' : '拒绝'}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'pending', label: '待审核', count: counts.pending },
    { key: 'verified', label: '已认证', count: counts.verified },
    { key: 'suspended', label: '已暂停', count: counts.suspended },
    { key: 'all', label: '全部', count: counts.total },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.surface }}>
      <Sidebar
        items={navItems}
        activeKey="admin-merchants"
        onSelect={handleNav}
        title="管理后台"
        subtitle={user?.nickname || 'Admin'}
        accentColor={colors.accent}
        onExit={() => navigate('landing')}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <Header
          title="商家审核"
          subtitle="审核和管理平台入驻商家"
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
            <StatCard label="待审核" value={counts.pending} icon="⏳" accentColor={colors.warning} />
            <StatCard label="已认证" value={counts.verified} icon="✅" accentColor={colors.success} />
            <StatCard label="已暂停" value={counts.suspended} icon="⏸️" accentColor={colors.accent} />
            <StatCard label="商家总数" value={counts.total} icon="🏢" accentColor={colors.primary} />
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
                  border: `1.5px solid ${filter === tab.key ? colors.accent : colors.border}`,
                  backgroundColor: filter === tab.key ? colors.accent : colors.white,
                  color: filter === tab.key ? colors.white : colors.textSecondary,
                  fontSize: font.sizes.sm,
                  fontWeight: font.weights.medium,
                  cursor: 'pointer',
                  fontFamily: font.family,
                  transition: transitions.fast,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    style={{
                      backgroundColor: filter === tab.key ? 'rgba(255,255,255,0.3)' : colors.surfaceAlt,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: font.sizes.xs,
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Merchants table */}
          <div style={styles.card}>
            <DataTable
              columns={columns}
              data={filteredMerchants}
              rowKey={(m) => m.id}
              pageSize={15}
              loading={loading}
              emptyMessage="暂无商家"
              onRowClick={(m) => setSelectedMerchant(m)}
            />
          </div>
        </div>
      </div>

      {/* Merchant detail modal */}
      {selectedMerchant && (
        <div
          onClick={() => setSelectedMerchant(null)}
          style={{
            position: 'fixed' as const,
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: spacing.lg,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.white,
              borderRadius: radii.card,
              padding: spacing.xl,
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto' as const,
              boxShadow: shadows.lg,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing.lg }}>
              <div>
                <h2 style={{ fontSize: font.sizes.xl, fontWeight: font.weights.bold, margin: 0, marginBottom: '4px' }}>
                  {selectedMerchant.businessNameZh || selectedMerchant.businessName}
                </h2>
                <div style={{ fontSize: font.sizes.sm, color: colors.textSecondary }}>
                  {selectedMerchant.businessName}
                </div>
              </div>
              <span style={statusPillStyle(selectedMerchant.status)}>{selectedMerchant.status}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, marginBottom: spacing.lg }}>
              <DetailField label="联系人" value={selectedMerchant.contactName} />
              <DetailField label="电话" value={selectedMerchant.contactPhone} />
              <DetailField label="邮箱" value={selectedMerchant.contactEmail || '—'} />
              <DetailField label="城市" value={selectedMerchant.city} />
              <DetailField label="类别" value={selectedMerchant.category} />
              <DetailField label="评分" value={`★ ${selectedMerchant.rating?.toFixed(1) || '—'}`} />
              <DetailField label="总订单" value={String(selectedMerchant.totalBookings || 0)} />
              <DetailField label="总收入" value={`¥${(selectedMerchant.totalRevenue || 0).toLocaleString()}`} />
            </div>

            {selectedMerchant.description && (
              <div style={{ marginBottom: spacing.lg }}>
                <div style={{ ...styles.label, fontSize: font.sizes.xs, color: colors.textSecondary }}>简介</div>
                <div style={{ fontSize: font.sizes.sm, color: colors.text, lineHeight: 1.6 }}>
                  {selectedMerchant.description}
                </div>
              </div>
            )}

            <div style={{ marginBottom: spacing.lg }}>
              <div style={{ ...styles.label, fontSize: font.sizes.xs, color: colors.textSecondary }}>注册时间</div>
              <div style={{ fontSize: font.sizes.sm, color: colors.text }}>
                {selectedMerchant.createdAt?.slice(0, 19).replace('T', ' ') || '—'}
              </div>
            </div>

            {selectedMerchant.status === 'pending' && (
              <div style={{ display: 'flex', gap: spacing.md, borderTop: `1px solid ${colors.borderLight}`, paddingTop: spacing.lg }}>
                <button
                  onClick={() => handleVerify(selectedMerchant, true)}
                  disabled={actionLoading === selectedMerchant.id}
                  style={{
                    ...styles.buttonPrimary,
                    backgroundColor: colors.success,
                    flex: 1,
                    opacity: actionLoading === selectedMerchant.id ? 0.7 : 1,
                  }}
                >
                  {actionLoading === selectedMerchant.id ? '处理中...' : '✓ 审核通过'}
                </button>
                <button
                  onClick={() => handleVerify(selectedMerchant, false)}
                  disabled={actionLoading === selectedMerchant.id}
                  style={{
                    ...styles.buttonDanger,
                    flex: 1,
                    opacity: actionLoading === selectedMerchant.id ? 0.7 : 1,
                  }}
                >
                  {actionLoading === selectedMerchant.id ? '处理中...' : '✕ 拒绝申请'}
                </button>
              </div>
            )}

            <button
              onClick={() => setSelectedMerchant(null)}
              style={{ ...styles.buttonSecondary, width: '100%', marginTop: spacing.md }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div style={{ fontSize: font.sizes.xs, color: colors.textSecondary, marginBottom: '2px' }}>{label}</div>
    <div style={{ fontSize: font.sizes.sm, color: colors.text, fontWeight: font.weights.medium }}>{value}</div>
  </div>
);

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

export default AdminMerchants;