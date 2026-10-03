import type { CSSProperties } from 'react';

// ─── Yuanly AI Design System ──────────────────────────────────────────────
// Primary:      Celestial Turquoise  #40E0D0
// Secondary:    Imperial Gold         #D4AF37
// Accent:       Imperial Red          #C41E3A
// Background:   #FFFFFF
// Surface:      #F8F9FA
// Text:         #1A1A1A
// TextSecondary:#757575
// Card radius:  28px
// Button radius:30px
// Pill radius:  20px

export const colors = {
  primary: '#40E0D0',
  primaryDark: '#2BB5A5',
  primaryLight: '#A8F0E8',
  primarySoft: '#E6FBF8',

  secondary: '#D4AF37',
  secondaryDark: '#B8941E',
  secondaryLight: '#F0E6C0',

  accent: '#C41E3A',
  accentDark: '#A01830',
  accentLight: '#F4DDE2',

  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceAlt: '#F1F3F5',

  text: '#1A1A1A',
  textSecondary: '#757575',
  textTertiary: '#AAAAAA',

  border: '#E5E7EB',
  borderLight: '#F0F0F0',

  white: '#FFFFFF',
  black: '#000000',

  success: '#22C55E',
  successBg: '#DCFCE7',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  info: '#3B82F6',
  infoBg: '#DBEAFE',

  chart: ['#40E0D0', '#D4AF37', '#C41E3A', '#3B82F6', '#A855F7', '#22C55E', '#F59E0B'],
} as const;

export const radii = {
  card: '28px',
  cardSmall: '16px',
  button: '30px',
  pill: '20px',
  input: '12px',
  small: '8px',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px',
} as const;

export const font = {
  family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  sizes: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '20px',
    xl: '28px',
    xxl: '36px',
    display: '48px',
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const shadows = {
  sm: '0 1px 3px rgba(0,0,0,0.06)',
  md: '0 4px 12px rgba(0,0,0,0.08)',
  lg: '0 8px 28px rgba(0,0,0,0.10)',
  card: '0 2px 12px rgba(0,0,0,0.06)',
  primary: '0 4px 16px rgba(64, 224, 208, 0.3)',
  gold: '0 4px 16px rgba(212, 175, 55, 0.3)',
} as const;

export const transitions = {
  fast: '150ms ease',
  normal: '250ms ease',
  slow: '400ms ease',
} as const;

// ─── Reusable inline style objects ─────────────────────────────────────────

export const styles = {
  page: {
    backgroundColor: colors.surface,
    minHeight: '100vh',
    fontFamily: font.family,
    color: colors.text,
  } as CSSProperties,

  card: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: spacing.lg,
    boxShadow: shadows.card,
  } as CSSProperties,

  cardSmall: {
    backgroundColor: colors.white,
    borderRadius: radii.cardSmall,
    padding: spacing.lg,
    boxShadow: shadows.card,
  } as CSSProperties,

  buttonPrimary: {
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: radii.button,
    padding: '12px 28px',
    fontSize: font.sizes.sm,
    fontWeight: font.weights.semibold,
    cursor: 'pointer',
    transition: transitions.normal,
  } as CSSProperties,

  buttonSecondary: {
    backgroundColor: 'transparent',
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    borderRadius: radii.button,
    padding: '10px 26px',
    fontSize: font.sizes.sm,
    fontWeight: font.weights.semibold,
    cursor: 'pointer',
    transition: transitions.normal,
  } as CSSProperties,

  buttonGhost: {
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    border: 'none',
    borderRadius: radii.small,
    padding: '8px 16px',
    fontSize: font.sizes.sm,
    cursor: 'pointer',
    transition: transitions.normal,
  } as CSSProperties,

  buttonDanger: {
    backgroundColor: colors.accent,
    color: colors.white,
    border: 'none',
    borderRadius: radii.button,
    padding: '12px 28px',
    fontSize: font.sizes.sm,
    fontWeight: font.weights.semibold,
    cursor: 'pointer',
    transition: transitions.normal,
  } as CSSProperties,

  input: {
    width: '100%',
    padding: '14px 18px',
    border: `1.5px solid ${colors.border}`,
    borderRadius: radii.input,
    fontSize: font.sizes.md,
    fontFamily: font.family,
    color: colors.text,
    backgroundColor: colors.white,
    outline: 'none',
    transition: transitions.fast,
    boxSizing: 'border-box',
  } as CSSProperties,

  label: {
    display: 'block',
    fontSize: font.sizes.sm,
    fontWeight: font.weights.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  } as CSSProperties,

  pill: {
    display: 'inline-block',
    padding: '4px 14px',
    borderRadius: radii.pill,
    fontSize: font.sizes.xs,
    fontWeight: font.weights.semibold,
  } as CSSProperties,
} as const;

// ─── Status helpers ────────────────────────────────────────────────────────

export function statusPillStyle(status: string): CSSProperties {
  const s = status.toLowerCase();
  let bg = colors.infoBg;
  let color = colors.info;
  if (s === 'confirmed' || s === 'active' || s === 'verified' || s === 'completed' || s === 'approved') {
    bg = colors.successBg;
    color = colors.success;
  } else if (s === 'pending' || s === 'on_hold' || s === 'hold' || s === 'waiting') {
    bg = colors.warningBg;
    color = colors.warning;
  } else if (s === 'cancelled' || s === 'rejected' || s === 'expired' || s === 'failed') {
    bg = colors.dangerBg;
    color = colors.danger;
  }
  return { ...styles.pill, backgroundColor: bg, color };
}

// ─── Currency / number formatting ──────────────────────────────────────────

export function formatCNY(amount: number | string | undefined): string {
  if (amount === undefined || amount === null) return '¥0';
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return '¥0';
  return '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatNumber(n: number | undefined): string {
  if (n === undefined || n === null) return '0';
  return n.toLocaleString('en-US');
}