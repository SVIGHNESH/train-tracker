// Flat, touch-first transit design system.
// Single source of truth for colors, spacing, and type.

export const colors = {
  primary: '#2563EB',
  onPrimary: '#FFFFFF',
  primarySoft: '#DBEAFE',
  secondary: '#0891B2',
  accent: '#EA580C',
  accentSoft: '#FFEDD5',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  foreground: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  muted: '#F1F5F9',
  border: '#E2E8F0',
  destructive: '#DC2626',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

export const type = {
  title: { fontSize: 24, fontWeight: '700' as const, color: colors.foreground },
  heading: { fontSize: 18, fontWeight: '600' as const, color: colors.foreground },
  body: { fontSize: 16, fontWeight: '400' as const, color: colors.foreground },
  label: { fontSize: 14, fontWeight: '500' as const, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textTertiary },
  mono: { fontVariant: ['tabular-nums'] as const },
};
