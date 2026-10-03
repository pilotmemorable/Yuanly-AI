import React, { useState, useEffect, useCallback } from 'react';
import { Route } from '../App';
import { useAuth } from '../context/AuthContext';
import { colors, font, spacing, radii, shadows, transitions, styles, formatCNY, statusPillStyle } from '../styles/theme';
import {
  Experience,
  merchantApi,
  slotApi,
  Slot,
  experienceApi,
} from '../api/client';
import Sidebar, { NavItem } from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';

interface MerchantExperiencesProps {
  navigate: (route: Route) => void;
}

const navItems: NavItem[] = [
  { key: 'merchant-dashboard', label: '数据概览', icon: '📊' },
  { key: 'merchant-experiences', label: '体验管理', icon: '🎯' },
  { key: 'merchant-bookings', label: '订单管理', icon: '📋' },
];

type ModalMode = 'create' | 'edit' | 'slots' | null;

const MerchantExperiences: React.FC<MerchantExperiencesProps> = ({ navigate }) => {
  const { user, logout } = useAuth();
  const merchantId = user?.merchantId || user?.id || '';

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [showSlotsFor, setShowSlotsFor] = useState<Experience | null>(null);

  // Form state
  const emptyForm: Partial<Experience> = {
    title: '',
    titleZh: '',
    description: '',
    descriptionZh: '',
    category: '',
    city: '',
    location: '',
    price: 0,
    currency: 'CNY',
    durationMinutes: 60,
    maxParticipants: 10,
    images: [],
    tags: [],
  };
  const [form, setForm] = useState<Partial<Experience>>(emptyForm);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Slot form state
  const [slotForm, setSlotForm] = useState({
    date: '',
    startTime: '09:00',
    endTime: '11:00',
    capacity: 10,
    price: 0,
  });

  const loadExperiences = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dashData = await merchantApi.dashboard(merchantId);
      // Try to get experiences from dashboard or explore endpoint
      const exploreData = await experienceApi.explore({ limit: 100 });
      const allExps = Array.isArray(exploreData) ? exploreData : (exploreData as any).data || [];
      // Filter to this merchant's experiences
      const mine = allExps.filter((e: Experience) => e.merchantId === merchantId);
      setExperiences(mine.length > 0 ? mine : allExps.slice(0, 4)); // fallback for demo
    } catch (err: any) {
      setError(err.message || '加载体验失败');
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    loadExperiences();
  }, [loadExperiences]);

  const openCreate = () => {
    setForm(emptyForm);
    setTagInput('');
    setModalMode('create');
  };

  const openEdit = (exp: Experience) => {
    setForm({ ...exp });
    setTagInput((exp.tags || []).join(', '));
    setEditingExp(exp);
    setModalMode('edit');
  };

  const openSlots = async (exp: Experience) => {
    setShowSlotsFor(exp);
    setModalMode('slots');
    try {
      const data = await slotApi.available({ experienceId: exp.id });
      setSlots(Array.isArray(data) ? data : []);
    } catch {
      setSlots([]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        tags: tagInput.split(',').map((t) => t.trim()).filter(Boolean),
        images: form.images || [],
      };
      if (modalMode === 'create') {
        await merchantApi.createExperience(merchantId, payload);
      } else if (modalMode === 'edit' && editingExp) {
        await merchantApi.updateExperience(merchantId, editingExp.id, payload);
      }
      setModalMode(null);
      setEditingExp(null);
      await loadExperiences();
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (exp: Experience) => {
    if (!confirm(`确定要删除"${exp.titleZh || exp.title}"吗？此操作不可撤销。`)) return;
    try {
      await merchantApi.deleteExperience(merchantId, exp.id);
      await loadExperiences();
    } catch (err: any) {
      setError(err.message || '删除失败');
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSlotsFor) return;
    try {
      const startISO = `${slotForm.date}T${slotForm.startTime}:00`;
      const endISO = `${slotForm.date}T${slotForm.endTime}:00`;
      await slotApi.create({
        experienceId: showSlotsFor.id,
        startTime: startISO,
        endTime: endISO,
        capacity: slotForm.capacity,
        price: slotForm.price || showSlotsFor.price,
      });
      // Refresh slots
      const data = await slotApi.available({ experienceId: showSlotsFor.id });
      setSlots(Array.isArray(data) ? data : []);
      setSlotForm({ ...slotForm, date: '' });
    } catch (err: any) {
      setError(err.message || '创建时段失败');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('确定要删除此时段吗？')) return;
    try {
      await slotApi.delete(slotId);
      if (showSlotsFor) {
        const data = await slotApi.available({ experienceId: showSlotsFor.id });
        setSlots(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      setError(err.message || '删除时段失败');
    }
  };

  const handleNav = (key: string) => navigate(key as Route);

  const activeCount = experiences.filter((e) => e.status === 'active').length;
  const avgPrice = experiences.length > 0 ? experiences.reduce((s, e) => s + (e.price || 0), 0) / experiences.length : 0;
  const avgRating = experiences.length > 0 ? experiences.reduce((s, e) => s + (e.rating || 0), 0) / experiences.length : 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.surface }}>
      <Sidebar
        items={navItems}
        activeKey="merchant-experiences"
        onSelect={handleNav}
        title="商家中心"
        subtitle={user?.nickname || 'Merchant'}
        onExit={() => navigate('landing')}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <Header
          title="体验管理"
          subtitle="创建、编辑和管理您的旅行体验"
          user={user}
          onLogout={logout}
          actions={
            <button onClick={openCreate} style={styles.buttonPrimary}>
              + 新建体验
            </button>
          }
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

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md, marginBottom: spacing.xl }}>
            <StatCard label="体验总数" value={experiences.length} icon="🎯" accentColor={colors.primary} />
            <StatCard label="上架中" value={activeCount} icon="✅" accentColor={colors.success} />
            <StatCard label="平均价格" value={avgPrice} type="currency" icon="💰" accentColor={colors.secondary} />
            <StatCard label="平均评分" value={avgRating} type="rating" icon="⭐" accentColor={colors.secondary} />
          </div>

          {/* Experience cards grid */}
          {loading ? (
            <div style={{ textAlign: 'center' as const, padding: spacing.xxxl, color: colors.textSecondary }}>
              加载中...
            </div>
          ) : experiences.length === 0 ? (
            <div style={{ ...styles.card, textAlign: 'center' as const, padding: spacing.xxxl }}>
              <div style={{ fontSize: '48px', marginBottom: spacing.md, opacity: 0.3 }}>🎯</div>
              <h3 style={{ fontSize: font.sizes.lg, color: colors.text, marginBottom: spacing.sm }}>还没有体验</h3>
              <p style={{ fontSize: font.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg }}>
                创建您的第一个旅行体验，开始接收订单
              </p>
              <button onClick={openCreate} style={styles.buttonPrimary}>
                + 创建体验
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: spacing.lg }}>
              {experiences.map((exp) => (
                <div key={exp.id} style={styles.card}>
                  {/* Image area */}
                  <div
                    style={{
                      height: '160px',
                      borderRadius: radii.cardSmall,
                      marginBottom: spacing.md,
                      background: `linear-gradient(135deg, ${colors.primaryLight}, ${colors.secondaryLight})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '40px',
                      position: 'relative' as const,
                      overflow: 'hidden',
                    }}
                  >
                    {exp.images?.[0] ? (
                      <img src={exp.images[0]} alt={exp.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: radii.cardSmall }} />
                    ) : (
                      <span>🎈</span>
                    )}
                    <span style={{ position: 'absolute' as const, top: spacing.sm, right: spacing.sm, ...statusPillStyle(exp.status) }}>
                      {exp.status}
                    </span>
                  </div>

                  <div style={{ fontSize: font.sizes.xs, color: colors.textSecondary, marginBottom: '4px' }}>
                    📍 {exp.city || exp.location} · {exp.category}
                  </div>
                  <h3 style={{ fontSize: font.sizes.md, fontWeight: font.weights.semibold, color: colors.text, marginBottom: '4px' }}>
                    {exp.titleZh || exp.title}
                  </h3>
                  <p style={{ fontSize: font.sizes.xs, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                    {exp.descriptionZh || exp.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
                    <span style={{ fontSize: font.sizes.lg, fontWeight: font.weights.bold, color: colors.primary }}>
                      {formatCNY(exp.price)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: colors.secondary }}>★</span>
                      <span style={{ fontSize: font.sizes.sm, fontWeight: font.weights.semibold }}>
                        {exp.rating?.toFixed(1) || '5.0'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: spacing.sm, borderTop: `1px solid ${colors.borderLight}`, paddingTop: spacing.md }}>
                    <button
                      onClick={() => openEdit(exp)}
                      style={{ ...actionBtnStyle, flex: 1, color: colors.primary, borderColor: colors.primary }}
                    >
                      ✏️ 编辑
                    </button>
                    <button
                      onClick={() => openSlots(exp)}
                      style={{ ...actionBtnStyle, flex: 1, color: colors.info, borderColor: colors.info }}
                    >
                      📅 时段
                    </button>
                    <button
                      onClick={() => handleDelete(exp)}
                      style={{ ...actionBtnStyle, color: colors.accent, borderColor: colors.accent }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Create/Edit Modal ─── */}
      {modalMode === 'create' || modalMode === 'edit' ? (
        <Modal onClose={() => { setModalMode(null); setEditingExp(null); }} title={modalMode === 'create' ? '新建体验' : '编辑体验'}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column' as const, gap: spacing.md }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <div>
                <label style={styles.label}>体验名称 (英文)</label>
                <input
                  type="text"
                  required
                  value={form.title || ''}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Experience Title"
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>体验名称 (中文)</label>
                <input
                  type="text"
                  value={form.titleZh || ''}
                  onChange={(e) => setForm({ ...form, titleZh: e.target.value })}
                  placeholder="体验中文名"
                  style={styles.input}
                />
              </div>
            </div>

            <div>
              <label style={styles.label}>描述 (英文)</label>
              <textarea
                required
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description..."
                style={{ ...styles.input, minHeight: '60px', resize: 'vertical' as const }}
              />
            </div>
            <div>
              <label style={styles.label}>描述 (中文)</label>
              <textarea
                value={form.descriptionZh || ''}
                onChange={(e) => setForm({ ...form, descriptionZh: e.target.value })}
                placeholder="中文描述..."
                style={{ ...styles.input, minHeight: '60px', resize: 'vertical' as const }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <div>
                <label style={styles.label}>类别</label>
                <select
                  required
                  value={form.category || ''}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={styles.input}
                >
                  <option value="">选择类别</option>
                  <option value="paragliding">滑翔伞</option>
                  <option value="balloon">热气球</option>
                  <option value="cultural">文化体验</option>
                  <option value="food">美食</option>
                  <option value="coastal">海岸活动</option>
                  <option value="historical">历史古迹</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>城市</label>
                <select
                  required
                  value={form.city || ''}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  style={styles.input}
                >
                  <option value="">选择城市</option>
                  <option value="Istanbul">伊斯坦布尔</option>
                  <option value="Cappadocia">卡帕多奇亚</option>
                  <option value="Antalya">安塔利亚</option>
                  <option value="Bodrum">博德鲁姆</option>
                  <option value="Izmir">伊兹密尔</option>
                </select>
              </div>
            </div>

            <div>
              <label style={styles.label}>详细地址</label>
              <input
                type="text"
                value={form.location || ''}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="详细地址"
                style={styles.input}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing.md }}>
              <div>
                <label style={styles.label}>价格 (CNY)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.price || 0}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>时长 (分钟)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.durationMinutes || 60}
                  onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) })}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>最大人数</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.maxParticipants || 10}
                  onChange={(e) => setForm({ ...form, maxParticipants: parseInt(e.target.value) })}
                  style={styles.input}
                />
              </div>
            </div>

            <div>
              <label style={styles.label}>标签 (逗号分隔)</label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="刺激, 适合家庭, 拍照打卡"
                style={styles.input}
              />
            </div>

            <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.sm }}>
              <button
                type="submit"
                disabled={saving}
                style={{ ...styles.buttonPrimary, flex: 1, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? '保存中...' : modalMode === 'create' ? '创建体验' : '保存修改'}
              </button>
              <button
                type="button"
                onClick={() => { setModalMode(null); setEditingExp(null); }}
                style={styles.buttonSecondary}
              >
                取消
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {/* ─── Slots Modal ─── */}
      {modalMode === 'slots' && showSlotsFor ? (
        <Modal onClose={() => { setModalMode(null); setShowSlotsFor(null); setSlots([]); }} title={`时段管理 — ${showSlotsFor.titleZh || showSlotsFor.title}`}>
          {/* Create slot form */}
          <form onSubmit={handleCreateSlot} style={{ marginBottom: spacing.lg }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: spacing.sm, alignItems: 'end' }}>
              <div>
                <label style={{ ...styles.label, fontSize: font.sizes.xs }}>日期</label>
                <input
                  type="date"
                  required
                  value={slotForm.date}
                  onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={{ ...styles.label, fontSize: font.sizes.xs }}>开始</label>
                <input
                  type="time"
                  required
                  value={slotForm.startTime}
                  onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={{ ...styles.label, fontSize: font.sizes.xs }}>结束</label>
                <input
                  type="time"
                  required
                  value={slotForm.endTime}
                  onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={{ ...styles.label, fontSize: font.sizes.xs }}>容量</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={slotForm.capacity}
                  onChange={(e) => setSlotForm({ ...slotForm, capacity: parseInt(e.target.value) })}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={{ ...styles.label, fontSize: font.sizes.xs }}>价格</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={slotForm.price}
                  onChange={(e) => setSlotForm({ ...slotForm, price: parseFloat(e.target.value) })}
                  style={styles.input}
                />
              </div>
              <button type="submit" style={{ ...styles.buttonPrimary, padding: '12px 20px' }}>
                +
              </button>
            </div>
          </form>

          {/* Existing slots */}
          <div style={{ borderTop: `1px solid ${colors.borderLight}`, paddingTop: spacing.lg }}>
            <h4 style={{ fontSize: font.sizes.sm, fontWeight: font.weights.semibold, color: colors.text, marginBottom: spacing.md }}>
              已有时段 ({slots.length})
            </h4>
            {slots.length === 0 ? (
              <div style={{ textAlign: 'center' as const, padding: spacing.xl, color: colors.textSecondary, fontSize: font.sizes.sm }}>
                暂无时段，请添加
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: spacing.sm }}>
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: `${spacing.md} ${spacing.md}`,
                      backgroundColor: colors.surface,
                      borderRadius: radii.small,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: font.sizes.sm, fontWeight: font.weights.semibold, color: colors.text }}>
                        {slot.startTime?.slice(0, 16).replace('T', ' ')} — {slot.endTime?.slice(11, 16)}
                      </div>
                      <div style={{ fontSize: font.sizes.xs, color: colors.textSecondary, marginTop: '2px' }}>
                        容量: {slot.bookedCount}/{slot.capacity} · {formatCNY(slot.price)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <span style={statusPillStyle(slot.status)}>{slot.status}</span>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        style={{ ...actionBtnStyle, color: colors.accent, borderColor: colors.accent }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      ) : null}
    </div>
  );
};

// ─── Reusable action button style ───────────────────────────────────────────
const actionBtnStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: `1.5px solid ${colors.border}`,
  borderRadius: radii.small,
  backgroundColor: 'transparent',
  fontSize: font.sizes.xs,
  fontWeight: font.weights.medium,
  cursor: 'pointer',
  fontFamily: font.family,
  transition: transitions.fast,
};

// ─── Modal component ────────────────────────────────────────────────────────
const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string }> = ({ children, onClose, title }) => (
  <div
    onClick={onClose}
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
        maxWidth: '640px',
        maxHeight: '90vh',
        overflowY: 'auto' as const,
        boxShadow: shadows.lg,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
        <h2 style={{ fontSize: font.sizes.xl, fontWeight: font.weights.bold, color: colors.text, margin: 0 }}>{title}</h2>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            backgroundColor: colors.surface,
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: font.sizes.md,
            color: colors.textSecondary,
          }}
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default MerchantExperiences;