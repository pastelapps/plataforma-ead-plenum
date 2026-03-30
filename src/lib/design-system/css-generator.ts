import type { DesignTokens } from './tokens'

const cssMap: Record<keyof DesignTokens, string> = {
  colorPrimary50: '--color-primary-50', colorPrimary100: '--color-primary-100',
  colorPrimary200: '--color-primary-200', colorPrimary300: '--color-primary-300',
  colorPrimary400: '--color-primary-400', colorPrimary500: '--color-primary-500',
  colorPrimary600: '--color-primary-600', colorPrimary700: '--color-primary-700',
  colorPrimary800: '--color-primary-800', colorPrimary900: '--color-primary-900',
  colorSecondary50: '--color-secondary-50', colorSecondary100: '--color-secondary-100',
  colorSecondary200: '--color-secondary-200', colorSecondary300: '--color-secondary-300',
  colorSecondary400: '--color-secondary-400', colorSecondary500: '--color-secondary-500',
  colorSecondary600: '--color-secondary-600', colorSecondary700: '--color-secondary-700',
  colorSecondary800: '--color-secondary-800', colorSecondary900: '--color-secondary-900',
  colorTertiary50: '--color-tertiary-50', colorTertiary100: '--color-tertiary-100',
  colorTertiary200: '--color-tertiary-200', colorTertiary300: '--color-tertiary-300',
  colorTertiary400: '--color-tertiary-400', colorTertiary500: '--color-tertiary-500',
  colorTertiary600: '--color-tertiary-600', colorTertiary700: '--color-tertiary-700',
  colorTertiary800: '--color-tertiary-800', colorTertiary900: '--color-tertiary-900',
  colorNeutral50: '--color-neutral-50', colorNeutral100: '--color-neutral-100',
  colorNeutral200: '--color-neutral-200', colorNeutral300: '--color-neutral-300',
  colorNeutral400: '--color-neutral-400', colorNeutral500: '--color-neutral-500',
  colorNeutral600: '--color-neutral-600', colorNeutral700: '--color-neutral-700',
  colorNeutral800: '--color-neutral-800', colorNeutral900: '--color-neutral-900',
  colorSuccess: '--color-success', colorSuccessLight: '--color-success-light', colorSuccessDark: '--color-success-dark',
  colorWarning: '--color-warning', colorWarningLight: '--color-warning-light', colorWarningDark: '--color-warning-dark',
  colorError: '--color-error', colorErrorLight: '--color-error-light', colorErrorDark: '--color-error-dark',
  colorInfo: '--color-info', colorInfoLight: '--color-info-light', colorInfoDark: '--color-info-dark',
  colorBgPage: '--color-bg-page', colorBgSurface: '--color-bg-surface',
  colorBgElevated: '--color-bg-elevated', colorBgOverlay: '--color-bg-overlay',
  colorTextPrimary: '--color-text-primary', colorTextSecondary: '--color-text-secondary',
  colorTextDisabled: '--color-text-disabled', colorTextInverse: '--color-text-inverse',
  colorTextLink: '--color-text-link', colorTextLinkHover: '--color-text-link-hover',
  colorBorderDefault: '--color-border-default', colorBorderStrong: '--color-border-strong',
  colorBorderFocus: '--color-border-focus',
  colorHeaderBg: '--color-header-bg', colorHeaderText: '--color-header-text',
  colorSidebarBg: '--color-sidebar-bg', colorSidebarText: '--color-sidebar-text',
  colorSidebarActive: '--color-sidebar-active',
  colorFooterBg: '--color-footer-bg', colorFooterText: '--color-footer-text',
  colorBtnPrimaryBg: '--color-btn-primary-bg', colorBtnPrimaryText: '--color-btn-primary-text',
  colorBtnPrimaryHover: '--color-btn-primary-hover',
  colorBtnSecondaryBg: '--color-btn-secondary-bg', colorBtnSecondaryText: '--color-btn-secondary-text',
  colorBtnSecondaryHover: '--color-btn-secondary-hover',
  colorBtnDangerBg: '--color-btn-danger-bg', colorBtnDangerText: '--color-btn-danger-text',
  colorBtnDangerHover: '--color-btn-danger-hover',
  colorCardBg: '--color-card-bg', colorCardBorder: '--color-card-border', colorCardShadow: '--color-card-shadow',
  colorProgressTrack: '--color-progress-track', colorProgressFill: '--color-progress-fill',
  colorBadgeDefaultBg: '--color-badge-default-bg', colorBadgeDefaultText: '--color-badge-default-text',
  colorInputBg: '--color-input-bg', colorInputBorder: '--color-input-border',
  colorInputFocusRing: '--color-input-focus-ring', colorInputPlaceholder: '--color-input-placeholder',
  fontFamilyHeading: '--font-family-heading', fontFamilyBody: '--font-family-body',
  fontSizeXs: '--font-size-xs', fontSizeSm: '--font-size-sm', fontSizeBase: '--font-size-base',
  fontSizeLg: '--font-size-lg', fontSizeXl: '--font-size-xl', fontSize2xl: '--font-size-2xl',
  fontSize3xl: '--font-size-3xl',
  radiusSm: '--radius-sm', radiusMd: '--radius-md', radiusLg: '--radius-lg',
  radiusXl: '--radius-xl', radiusFull: '--radius-full',
  shadowSm: '--shadow-sm', shadowMd: '--shadow-md', shadowLg: '--shadow-lg',
}

export function tokensToCSS(tokens: DesignTokens): string {
  const lines: string[] = []
  for (const [key, cssVar] of Object.entries(cssMap)) {
    const value = tokens[key as keyof DesignTokens]
    if (value) lines.push(`${cssVar}: ${value};`)
  }
  return lines.join('\n    ')
}
