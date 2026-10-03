import React from 'react';
import { colors, font, spacing, radii, transitions, shadows } from '../styles/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  user?: { nickname?: string; avatar?: string; role?: string } | null;
  onLogout?: () => void;
  actions?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, user, onLogout, actions }) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${spacing.lg} ${spacing.xl}`,
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.borderLight}`,
        position: 'sticky' as const,
        top: 0,
        zIndex: 100,
      }}
    >
      <div>
        <h1 style={{ fontSize: font.sizes.xl, fontWeight: font.weights.bold, color: colors.text, margin: 0, lineHeight: 1.3 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: font.sizes.sm, color: colors.textSecondary, margin: 0, marginTop: '4px' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        {actions}

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: colors.primary,
                color: colors.white,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: font.weights.semibold,
                fontSize: font.sizes.sm,
                overflow: 'hidden',
                boxShadow: shadows.sm,
              }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.nickname || '用户'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (user.nickname || '用')[0]
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const }}>
              <span style={{ fontSize: font.sizes.sm, fontWeight: font.weights.semibold, color: colors.text }}>
                {user.nickname || '用户'}
              </span>
              {user.role && (
                <span style={{ fontSize: font.sizes.xs, color: colors.textSecondary, textTransform: 'capitalize' }}>
                  {user.role === 'merchant' ? '商家' : user.role === 'admin' ? '管理员' : '用户'}
                </span>
              )}
            </div>
          </div>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              padding: '8px 16px',
              border: `1.5px solid ${colors.border}`,
              borderRadius: radii.button,
              backgroundColor: 'transparent',
              color: colors.textSecondary,
              fontSize: font.sizes.sm,
              fontWeight: font.weights.medium,
              cursor: 'pointer',
              fontFamily: font.family,
              transition: transitions.fast,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.accent;
              e.currentTarget.style.color = colors.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.color = colors.textSecondary;
            }}
          >
            退出
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;