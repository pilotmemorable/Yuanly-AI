import React, { useState } from 'react';
import { Route } from '../App';
import { useAuth } from '../context/AuthContext';
import { colors, font, spacing, radii, shadows, transitions, styles } from '../styles/theme';
import { authApi } from '../api/client';

interface AdminLoginProps {
  navigate: (route: Route) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ navigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authApi.register({
        phone: email,
        email,
        password,
        role: 'admin',
      });
      // Only allow admin role to proceed
      if (result.user.role !== 'admin') {
        setError('此账户无管理员权限。');
        setLoading(false);
        return;
      }
      login(result.token, result.user, result.refreshToken);
      navigate('admin-dashboard');
    } catch (err: any) {
      setError(err.message || '登录失败，请检查凭据。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        fontFamily: font.family,
        background: `linear-gradient(135deg, ${colors.text} 0%, #2d2d2d 100%)`,
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
            color: 'rgba(255,255,255,0.6)',
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
          maxWidth: '420px',
          backgroundColor: colors.white,
          borderRadius: radii.card,
          boxShadow: shadows.lg,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
            padding: `${spacing.xl} ${spacing.xl} ${spacing.lg}`,
            textAlign: 'center' as const,
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto ' + spacing.sm,
            }}
          >
            🛡️
          </div>
          <h1 style={{ color: colors.white, fontSize: font.sizes.xl, fontWeight: font.weights.bold, margin: 0 }}>
            管理后台
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: font.sizes.sm, margin: '4px 0 0' }}>
            Yuanly AI 平台管理控制台
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: spacing.xl, display: 'flex', flexDirection: 'column' as const, gap: spacing.md }}>
          {error && (
            <div
              style={{
                backgroundColor: colors.dangerBg,
                color: colors.danger,
                padding: `${spacing.sm} ${spacing.md}`,
                borderRadius: radii.small,
                fontSize: font.sizes.sm,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <div>
            <label style={styles.label}>管理员邮箱 / 手机号</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yuanly.ai"
              style={styles.input}
              onFocus={(e) => { e.target.style.borderColor = colors.accent; }}
              onBlur={(e) => { e.target.style.borderColor = colors.border; }}
            />
          </div>
          <div>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入管理员密码"
              style={styles.input}
              onFocus={(e) => { e.target.style.borderColor = colors.accent; }}
              onBlur={(e) => { e.target.style.borderColor = colors.border; }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.buttonPrimary,
              backgroundColor: colors.accent,
              marginTop: spacing.sm,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = colors.accentDark; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = colors.accent; }}
          >
            {loading ? '登录中...' : '进入管理后台'}
          </button>

          <div
            style={{
              marginTop: spacing.md,
              padding: spacing.md,
              backgroundColor: colors.surface,
              borderRadius: radii.small,
              fontSize: font.sizes.xs,
              color: colors.textSecondary,
              textAlign: 'center' as const,
            }}
          >
            仅限授权管理员访问 · 所有操作将被记录
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;