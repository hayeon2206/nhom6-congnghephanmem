/**
 * Single source of truth for the design system's color/type tokens, mirrored
 * from the CSS custom properties in index.css. AntD's theme API needs plain
 * JS values (it can't read CSS variables), so this file keeps the two in sync
 * by hand — update both together when the palette changes.
 */
export const colors = {
  primary: '#0b1e33',
  primaryForeground: '#ffffff',
  accent: '#0369a1',
  accentHover: '#075985',
  accentForeground: '#ffffff',
  accentSoft: '#e0f2fe',
  gold: '#d9b978',
  bg: '#f8fafc',
  surface: '#ffffff',
  surfaceMuted: '#f1f5f9',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
};

export const fontFamily = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
export const displayFontFamily = "'Fraunces', Georgia, 'Times New Roman', serif";

export const antdTheme = {
  token: {
    colorPrimary: colors.accent,
    colorLink: colors.accent,
    colorLinkHover: colors.accentHover,
    colorInfo: colors.accent,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.danger,
    colorTextBase: colors.text,
    colorBgLayout: colors.bg,
    colorBorder: colors.border,
    borderRadius: 8,
    fontFamily,
    fontSize: 14,
    controlHeight: 36,
  },
  components: {
    Layout: {
      siderBg: colors.primary,
      headerBg: colors.surface,
      bodyBg: colors.bg,
    },
    Menu: {
      darkItemBg: colors.primary,
      darkItemSelectedBg: colors.accent,
      darkItemHoverBg: 'rgba(255,255,255,0.06)',
      darkSubMenuItemBg: 'rgba(0,0,0,0.15)',
    },
    Table: {
      headerBg: colors.surfaceMuted,
      headerColor: colors.textSecondary,
      rowHoverBg: colors.surfaceMuted,
    },
    Card: {
      colorBorderSecondary: colors.border,
    },
    Statistic: {
      titleFontSize: 13,
    },
  },
};
