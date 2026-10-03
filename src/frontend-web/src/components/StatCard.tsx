import React from 'react';
import { colors, font, spacing, radii, shadows, transitions, formatCNY, formatNumber } from '../styles/theme';

interface StatCardProps {
  label: string;
  value: number | string;
  type?: 'number' | 'currency' | 'rating' | 'plain';
  icon?: string;
  accentColor?: string;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  type = 'number',
  icon,
  accentColor = colors.primary,
  trend,
  subtitle,
}) => {
  let displayValue: string;
  if (type === 'currency') {
    displayValue = formatCNY(typeof value === 'number' ? value : parseFloat(value));
  } else if (type === 'rating') {
    displayValue = typeof value === 'number' ? value.toFixed(1) : String(value);
  } else if (type === 'number') {
    displayValue = formatNumber(typeof value === 'number' ? value : 0);
  } else {
    displayValue = String(value);
  }

  return (
    <div
      style={{
        backgroundColor: colors.white,
        borderRadius: radii.card,
        padding: spacing.lg,
        boxShadow: shadows.card,
        position: 'relative' as const,
        overflow: 'hidden',
        transition: transitions.normal,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = shadows.lg;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = shadows.card;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          position: 'absolute' as const,
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)`,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <span style={{ fontSize: font.sizes.sm, color: colors.textSecondary, fontWeight: font.weights.medium }}>
          {label}
        </span>
        {icon && (
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: accentColor + '15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: font.sizes.xxl,
          fontWeight: font.weights.bold,
          color: type === 'currency' ? accentColor : colors.text,
          lineHeight: 1.2,
          marginBottom: '4px',
        }}
      >
        {displayValue}
        {type === 'rating' && (
          <span style={{ fontSize: font.sizes.lg, color: colors.secondary, marginLeft: spacing.xs }}>★</span>
        )}
      </div>

      {(trend || subtitle) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginTop: '4px' }}>
          {trend && (
            <span
              style={{
                fontSize: font.sizes.xs,
                fontWeight: font.weights.semibold,
                color: trend.isPositive ? colors.success : colors.danger,
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
          {subtitle && (
            <span style={{ fontSize: font.sizes.xs, color: colors.textTertiary }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;