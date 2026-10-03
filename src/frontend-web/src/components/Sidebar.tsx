import React from 'react';
import { colors, font, spacing, radii, transitions } from '../styles/theme';

export interface NavItem {
  key: string;
  label: string;
  icon: string;
  badge?: number;
}

interface SidebarProps {
  items: NavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  title: string;
  subtitle?: string;
  accentColor?: string;
  onExit?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  items,
  activeKey,
  onSelect,
  title,
  subtitle,
  accentColor = colors.primary,
  onExit,
}) => {
  return (
    <aside
      style={{
        width: '260px',
        minHeight: '100vh',
        backgroundColor: colors.white,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky' as const,
        top: 0,
        height: '100vh',
      }}
    >
      {/* Logo / Brand */}
      <div
        style={{
          padding: spacing.xl,
          borderBottom: `1px solid ${colors.borderLight}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}DD)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              color: colors.white,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            远
          </div>
          <div>
            <div style={{ fontSize: font.sizes.md, fontWeight: font.weights.bold, color: colors.text, lineHeight: 1.2 }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: font.sizes.xs, color: colors.textSecondary, marginTop: '2px' }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: `${spacing.md} ${spacing.sm}`, overflowY: 'auto' as const }}>
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                width: '100%',
                padding: `${spacing.md} ${spacing.md}`,
                marginBottom: '4px',
                border: 'none',
                borderRadius: radii.input,
                backgroundColor: active ? accentColor + '18' : 'transparent',
                color: active ? accentColor : colors.textSecondary,
                cursor: 'pointer',
                fontSize: font.sizes.sm,
                fontWeight: active ? font.weights.semibold : font.weights.medium,
                transition: transitions.fast,
                textAlign: 'left' as const,
                fontFamily: font.family,
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = colors.surface;
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' as const }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  style={{
                    backgroundColor: colors.accent,
                    color: colors.white,
                    fontSize: font.sizes.xs,
                    fontWeight: font.weights.bold,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    minWidth: '20px',
                    textAlign: 'center' as const,
                  }}
                >
                  {item.badge}
                </span>
              )}
              {active && (
                <span
                  style={{
                    width: '4px',
                    height: '20px',
                    backgroundColor: accentColor,
                    borderRadius: '2px',
                    position: 'absolute' as const,
                    right: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Exit / back to portal */}
      {onExit && (
        <div style={{ padding: spacing.lg, borderTop: `1px solid ${colors.borderLight}` }}>
          <button
            onClick={onExit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              width: '100%',
              padding: spacing.md,
              border: 'none',
              borderRadius: radii.input,
              backgroundColor: 'transparent',
              color: colors.textSecondary,
              cursor: 'pointer',
              fontSize: font.sizes.sm,
              fontFamily: font.family,
              fontWeight: font.weights.medium,
              transition: transitions.fast,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.surface;
              e.currentTarget.style.color = colors.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.textSecondary;
            }}
          >
            <span style={{ fontSize: '18px' }}>↩</span>
            返回主页
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;