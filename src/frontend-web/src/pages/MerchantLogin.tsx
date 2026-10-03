import React, { useState } from 'react';
import { Route } from '../App';
import { useAuth } from '../context/AuthContext';
import { colors, font, spacing, radii, shadows, transitions, styles } from '../styles/theme';
import { authApi, merchantApi } from '../api/client';

interface MerchantLoginProps {
  navigate: (route: Route) => void;
}

type Tab = 'login' | 'register';

const MerchantLogin: React.FC<MerchantLoginProps> = ({ navigate }) => {
  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, registerMerchant } = useAuth();

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regForm, setRegForm] = useState({
    businessName: '',
    businessNameZh: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    city: '',
    category: '',
    description: '',
    password: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authApi.register({
        phone: loginPhone,
        password: loginPassword,
        role: 'merchant',
      });
      login(result.token, result.user, result.refreshToken);
      navigate('merchant-dashboard');
    } catch (err: any) {
      setError(err.message || '登录失败，请重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerMerchant({
        businessName: regForm.businessName,
        businessNameZh: regForm.businessNameZh || undefined,
        contactName: regForm.contactName,
        contactPhone: regForm.contactPhone,
        contactEmail: regForm.contactEmail || undefined,
        city: regForm.city,
        category: regForm.category,
        description: regForm.description || undefined,
        password: regForm.password,
      });
      navigate('merchant-dashboard');
    } catch (err: any) {
      setError(err.message || '注册失败，请重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        fontFamily: font.family,
        background: `linear-gradient(135deg, ${colors.primarySoft} 0%, ${colors.white} 50%, ${colors.secondaryLight}40 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
      }}
    >
      <div style={{ position: 'absolute' as const, top: '24px', left: '24px' }}>
        <button
          onClick={() => navigate('landing')}
          style={{
            ...styles.buttonGhost,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
          }}
        >
          ← 返回主页
        </button>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: colors.white,
          borderRadius: radii.card,
          boxShadow: shadows.lg,
          overflow: 'hidden',
        }}
      >
        {/* Header band */}
        <div
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
            padding: `${spacing.xl} ${spacing.xl} ${spacing.lg}`,
            textAlign: 'center' as const,
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '18px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: colors.white,
              fontWeight: 700,
              margin: '0 auto ' + spacing.sm,
            }}
          >
            远
          </div>
          <h1 style={{ color: colors.white, fontSize: font.sizes.xl, fontWeight: font.weights.bold, margin: 0 }}>
            商家中心
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: font.sizes.sm, margin: '4px 0 0' }}>
            Yuanly AI 商家管理平台
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${colors.borderLight}` }}>
          {(['login', 'register'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setError('');
              }}
              style={{
                flex: 1,
                padding: spacing.md,
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: font.sizes.sm,
                fontWeight: tab === t ? font.weights.semibold : font.weights.medium,
                color: tab === t ? colors.primary : colors.textSecondary,
                cursor: 'pointer',
                fontFamily: font.family,
                borderBottom: tab === t ? `2.5px solid ${colors.primary}` : '2.5px solid transparent',
                transition: transitions.fast,
              }}
            >
              {t === 'login' ? '登录' : '注册商家'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ padding: spacing.xl }}>
          {error && (
            <div
              style={{
                backgroundColor: colors.dangerBg,
                color: colors.danger,
                padding: `${spacing.sm} ${spacing.md}`,
                borderRadius: radii.small,
                fontSize: font.sizes.sm,
                marginBottom: spacing.md,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' as const, gap: spacing.md }}>
              <div>
                <label style={styles.label}>手机号</label>
                <input
                  type="tel"
                  required
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  placeholder="请输入手机号"
                  style={styles.input}
                  onFocus={(e) => { e.target.style.borderColor = colors.primary; }}
                  onBlur={(e) => { e.target.style.borderColor = colors.border; }}
                />
              </div>
              <div>
                <label style={styles.label}>密码</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="请输入密码"
                  style={styles.input}
                  onFocus={(e) => { e.target.style.borderColor = colors.primary; }}
                  onBlur={(e) => { e.target.style.borderColor = colors.border; }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.buttonPrimary,
                  marginTop: spacing.sm,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column' as const, gap: spacing.md }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
                <div>
                  <label style={styles.label}>商家名称 (英文)</label>
                  <input
                    type="text"
                    required
                    value={regForm.businessName}
                    onChange={(e) => setRegForm({ ...regForm, businessName: e.target.value })}
                    placeholder="Business Name"
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>商家名称 (中文)</label>
                  <input
                    type="text"
                    value={regForm.businessNameZh}
                    onChange={(e) => setRegForm({ ...regForm, businessNameZh: e.target.value })}
                    placeholder="商家中文名"
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
                <div>
                  <label style={styles.label}>联系人姓名</label>
                  <input
                    type="text"
                    required
                    value={regForm.contactName}
                    onChange={(e) => setRegForm({ ...regForm, contactName: e.target.value })}
                    placeholder="联系人"
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>联系电话</label>
                  <input
                    type="tel"
                    required
                    value={regForm.contactPhone}
                    onChange={(e) => setRegForm({ ...regForm, contactPhone: e.target.value })}
                    placeholder="手机号"
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
                <div>
                  <label style={styles.label}>所在城市</label>
                  <select
                    required
                    value={regForm.city}
                    onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
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
                <div>
                  <label style={styles.label}>体验类别</label>
                  <select
                    required
                    value={regForm.category}
                    onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
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
              </div>
              <div>
                <label style={styles.label}>联系邮箱</label>
                <input
                  type="email"
                  value={regForm.contactEmail}
                  onChange={(e) => setRegForm({ ...regForm, contactEmail: e.target.value })}
                  placeholder="email@example.com"
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>商家简介</label>
                <textarea
                  value={regForm.description}
                  onChange={(e) => setRegForm({ ...regForm, description: e.target.value })}
                  placeholder="简要描述您的业务..."
                  style={{ ...styles.input, minHeight: '80px', resize: 'vertical' as const }}
                />
              </div>
              <div>
                <label style={styles.label}>设置密码</label>
                <input
                  type="password"
                  required
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  placeholder="至少6位密码"
                  style={styles.input}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.buttonPrimary,
                  marginTop: spacing.sm,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '注册中...' : '注册并登录'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantLogin;