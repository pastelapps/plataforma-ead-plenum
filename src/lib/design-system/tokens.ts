import { createServerComponentClient } from '@/lib/supabase/server'
import { redis } from '@/lib/redis/client'

export type DesignMode = 'light' | 'dark'

export interface DesignTokens {
  colorPrimary50: string; colorPrimary100: string; colorPrimary200: string;
  colorPrimary300: string; colorPrimary400: string; colorPrimary500: string;
  colorPrimary600: string; colorPrimary700: string; colorPrimary800: string;
  colorPrimary900: string;
  colorSecondary50: string; colorSecondary100: string; colorSecondary200: string;
  colorSecondary300: string; colorSecondary400: string; colorSecondary500: string;
  colorSecondary600: string; colorSecondary700: string; colorSecondary800: string;
  colorSecondary900: string;
  colorTertiary50: string; colorTertiary100: string; colorTertiary200: string;
  colorTertiary300: string; colorTertiary400: string; colorTertiary500: string;
  colorTertiary600: string; colorTertiary700: string; colorTertiary800: string;
  colorTertiary900: string;
  colorNeutral50: string; colorNeutral100: string; colorNeutral200: string;
  colorNeutral300: string; colorNeutral400: string; colorNeutral500: string;
  colorNeutral600: string; colorNeutral700: string; colorNeutral800: string;
  colorNeutral900: string;
  colorSuccess: string; colorSuccessLight: string; colorSuccessDark: string;
  colorWarning: string; colorWarningLight: string; colorWarningDark: string;
  colorError: string; colorErrorLight: string; colorErrorDark: string;
  colorInfo: string; colorInfoLight: string; colorInfoDark: string;
  colorBgPage: string; colorBgSurface: string; colorBgElevated: string; colorBgOverlay: string;
  colorTextPrimary: string; colorTextSecondary: string; colorTextDisabled: string;
  colorTextInverse: string; colorTextLink: string; colorTextLinkHover: string;
  colorBorderDefault: string; colorBorderStrong: string; colorBorderFocus: string;
  colorHeaderBg: string; colorHeaderText: string;
  colorSidebarBg: string; colorSidebarText: string; colorSidebarActive: string;
  colorFooterBg: string; colorFooterText: string;
  colorBtnPrimaryBg: string; colorBtnPrimaryText: string; colorBtnPrimaryHover: string;
  colorBtnSecondaryBg: string; colorBtnSecondaryText: string; colorBtnSecondaryHover: string;
  colorBtnDangerBg: string; colorBtnDangerText: string; colorBtnDangerHover: string;
  colorCardBg: string; colorCardBorder: string; colorCardShadow: string;
  colorProgressTrack: string; colorProgressFill: string;
  colorBadgeDefaultBg: string; colorBadgeDefaultText: string;
  colorInputBg: string; colorInputBorder: string; colorInputFocusRing: string; colorInputPlaceholder: string;
  fontFamilyHeading: string; fontFamilyBody: string;
  fontSizeXs: string; fontSizeSm: string; fontSizeBase: string;
  fontSizeLg: string; fontSizeXl: string; fontSize2xl: string; fontSize3xl: string;
  radiusSm: string; radiusMd: string; radiusLg: string; radiusXl: string; radiusFull: string;
  shadowSm: string; shadowMd: string; shadowLg: string;
}

export interface DesignAssets {
  logoSquareUrl: string | null;
  logoHorizontalUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
  loginBannerUrl: string | null;
  loginBannerVerticalUrl: string | null;
  homepageHeroUrl: string | null;
  homepageHeroMobileUrl: string | null;
  cardBgPattern1Url: string | null;
  cardBgPattern2Url: string | null;
  cardBgPattern3Url: string | null;
  cardBgGradientCss: string | null;
  cardOverlayColor: string;
  platformBgUrl: string | null;
  certificateBgUrl: string | null;
  certificateLogoUrl: string | null;
  certificateSignatureUrl: string | null;
}

const TOKEN_MAP: Record<string, { tsKey: keyof DesignTokens; cssVar: string }> = {
  color_primary_50: { tsKey: 'colorPrimary50', cssVar: '--color-primary-50' },
  color_primary_100: { tsKey: 'colorPrimary100', cssVar: '--color-primary-100' },
  color_primary_200: { tsKey: 'colorPrimary200', cssVar: '--color-primary-200' },
  color_primary_300: { tsKey: 'colorPrimary300', cssVar: '--color-primary-300' },
  color_primary_400: { tsKey: 'colorPrimary400', cssVar: '--color-primary-400' },
  color_primary_500: { tsKey: 'colorPrimary500', cssVar: '--color-primary-500' },
  color_primary_600: { tsKey: 'colorPrimary600', cssVar: '--color-primary-600' },
  color_primary_700: { tsKey: 'colorPrimary700', cssVar: '--color-primary-700' },
  color_primary_800: { tsKey: 'colorPrimary800', cssVar: '--color-primary-800' },
  color_primary_900: { tsKey: 'colorPrimary900', cssVar: '--color-primary-900' },
  color_secondary_50: { tsKey: 'colorSecondary50', cssVar: '--color-secondary-50' },
  color_secondary_100: { tsKey: 'colorSecondary100', cssVar: '--color-secondary-100' },
  color_secondary_200: { tsKey: 'colorSecondary200', cssVar: '--color-secondary-200' },
  color_secondary_300: { tsKey: 'colorSecondary300', cssVar: '--color-secondary-300' },
  color_secondary_400: { tsKey: 'colorSecondary400', cssVar: '--color-secondary-400' },
  color_secondary_500: { tsKey: 'colorSecondary500', cssVar: '--color-secondary-500' },
  color_secondary_600: { tsKey: 'colorSecondary600', cssVar: '--color-secondary-600' },
  color_secondary_700: { tsKey: 'colorSecondary700', cssVar: '--color-secondary-700' },
  color_secondary_800: { tsKey: 'colorSecondary800', cssVar: '--color-secondary-800' },
  color_secondary_900: { tsKey: 'colorSecondary900', cssVar: '--color-secondary-900' },
  color_tertiary_50: { tsKey: 'colorTertiary50', cssVar: '--color-tertiary-50' },
  color_tertiary_100: { tsKey: 'colorTertiary100', cssVar: '--color-tertiary-100' },
  color_tertiary_200: { tsKey: 'colorTertiary200', cssVar: '--color-tertiary-200' },
  color_tertiary_300: { tsKey: 'colorTertiary300', cssVar: '--color-tertiary-300' },
  color_tertiary_400: { tsKey: 'colorTertiary400', cssVar: '--color-tertiary-400' },
  color_tertiary_500: { tsKey: 'colorTertiary500', cssVar: '--color-tertiary-500' },
  color_tertiary_600: { tsKey: 'colorTertiary600', cssVar: '--color-tertiary-600' },
  color_tertiary_700: { tsKey: 'colorTertiary700', cssVar: '--color-tertiary-700' },
  color_tertiary_800: { tsKey: 'colorTertiary800', cssVar: '--color-tertiary-800' },
  color_tertiary_900: { tsKey: 'colorTertiary900', cssVar: '--color-tertiary-900' },
  color_neutral_50: { tsKey: 'colorNeutral50', cssVar: '--color-neutral-50' },
  color_neutral_100: { tsKey: 'colorNeutral100', cssVar: '--color-neutral-100' },
  color_neutral_200: { tsKey: 'colorNeutral200', cssVar: '--color-neutral-200' },
  color_neutral_300: { tsKey: 'colorNeutral300', cssVar: '--color-neutral-300' },
  color_neutral_400: { tsKey: 'colorNeutral400', cssVar: '--color-neutral-400' },
  color_neutral_500: { tsKey: 'colorNeutral500', cssVar: '--color-neutral-500' },
  color_neutral_600: { tsKey: 'colorNeutral600', cssVar: '--color-neutral-600' },
  color_neutral_700: { tsKey: 'colorNeutral700', cssVar: '--color-neutral-700' },
  color_neutral_800: { tsKey: 'colorNeutral800', cssVar: '--color-neutral-800' },
  color_neutral_900: { tsKey: 'colorNeutral900', cssVar: '--color-neutral-900' },
  color_success: { tsKey: 'colorSuccess', cssVar: '--color-success' },
  color_success_light: { tsKey: 'colorSuccessLight', cssVar: '--color-success-light' },
  color_success_dark: { tsKey: 'colorSuccessDark', cssVar: '--color-success-dark' },
  color_warning: { tsKey: 'colorWarning', cssVar: '--color-warning' },
  color_warning_light: { tsKey: 'colorWarningLight', cssVar: '--color-warning-light' },
  color_warning_dark: { tsKey: 'colorWarningDark', cssVar: '--color-warning-dark' },
  color_error: { tsKey: 'colorError', cssVar: '--color-error' },
  color_error_light: { tsKey: 'colorErrorLight', cssVar: '--color-error-light' },
  color_error_dark: { tsKey: 'colorErrorDark', cssVar: '--color-error-dark' },
  color_info: { tsKey: 'colorInfo', cssVar: '--color-info' },
  color_info_light: { tsKey: 'colorInfoLight', cssVar: '--color-info-light' },
  color_info_dark: { tsKey: 'colorInfoDark', cssVar: '--color-info-dark' },
  color_bg_page: { tsKey: 'colorBgPage', cssVar: '--color-bg-page' },
  color_bg_surface: { tsKey: 'colorBgSurface', cssVar: '--color-bg-surface' },
  color_bg_elevated: { tsKey: 'colorBgElevated', cssVar: '--color-bg-elevated' },
  color_bg_overlay: { tsKey: 'colorBgOverlay', cssVar: '--color-bg-overlay' },
  color_text_primary: { tsKey: 'colorTextPrimary', cssVar: '--color-text-primary' },
  color_text_secondary: { tsKey: 'colorTextSecondary', cssVar: '--color-text-secondary' },
  color_text_disabled: { tsKey: 'colorTextDisabled', cssVar: '--color-text-disabled' },
  color_text_inverse: { tsKey: 'colorTextInverse', cssVar: '--color-text-inverse' },
  color_text_link: { tsKey: 'colorTextLink', cssVar: '--color-text-link' },
  color_text_link_hover: { tsKey: 'colorTextLinkHover', cssVar: '--color-text-link-hover' },
  color_border_default: { tsKey: 'colorBorderDefault', cssVar: '--color-border-default' },
  color_border_strong: { tsKey: 'colorBorderStrong', cssVar: '--color-border-strong' },
  color_border_focus: { tsKey: 'colorBorderFocus', cssVar: '--color-border-focus' },
  color_header_bg: { tsKey: 'colorHeaderBg', cssVar: '--color-header-bg' },
  color_header_text: { tsKey: 'colorHeaderText', cssVar: '--color-header-text' },
  color_sidebar_bg: { tsKey: 'colorSidebarBg', cssVar: '--color-sidebar-bg' },
  color_sidebar_text: { tsKey: 'colorSidebarText', cssVar: '--color-sidebar-text' },
  color_sidebar_active: { tsKey: 'colorSidebarActive', cssVar: '--color-sidebar-active' },
  color_footer_bg: { tsKey: 'colorFooterBg', cssVar: '--color-footer-bg' },
  color_footer_text: { tsKey: 'colorFooterText', cssVar: '--color-footer-text' },
  color_btn_primary_bg: { tsKey: 'colorBtnPrimaryBg', cssVar: '--color-btn-primary-bg' },
  color_btn_primary_text: { tsKey: 'colorBtnPrimaryText', cssVar: '--color-btn-primary-text' },
  color_btn_primary_hover: { tsKey: 'colorBtnPrimaryHover', cssVar: '--color-btn-primary-hover' },
  color_btn_secondary_bg: { tsKey: 'colorBtnSecondaryBg', cssVar: '--color-btn-secondary-bg' },
  color_btn_secondary_text: { tsKey: 'colorBtnSecondaryText', cssVar: '--color-btn-secondary-text' },
  color_btn_secondary_hover: { tsKey: 'colorBtnSecondaryHover', cssVar: '--color-btn-secondary-hover' },
  color_btn_danger_bg: { tsKey: 'colorBtnDangerBg', cssVar: '--color-btn-danger-bg' },
  color_btn_danger_text: { tsKey: 'colorBtnDangerText', cssVar: '--color-btn-danger-text' },
  color_btn_danger_hover: { tsKey: 'colorBtnDangerHover', cssVar: '--color-btn-danger-hover' },
  color_card_bg: { tsKey: 'colorCardBg', cssVar: '--color-card-bg' },
  color_card_border: { tsKey: 'colorCardBorder', cssVar: '--color-card-border' },
  color_card_shadow: { tsKey: 'colorCardShadow', cssVar: '--color-card-shadow' },
  color_progress_track: { tsKey: 'colorProgressTrack', cssVar: '--color-progress-track' },
  color_progress_fill: { tsKey: 'colorProgressFill', cssVar: '--color-progress-fill' },
  color_badge_default_bg: { tsKey: 'colorBadgeDefaultBg', cssVar: '--color-badge-default-bg' },
  color_badge_default_text: { tsKey: 'colorBadgeDefaultText', cssVar: '--color-badge-default-text' },
  color_input_bg: { tsKey: 'colorInputBg', cssVar: '--color-input-bg' },
  color_input_border: { tsKey: 'colorInputBorder', cssVar: '--color-input-border' },
  color_input_focus_ring: { tsKey: 'colorInputFocusRing', cssVar: '--color-input-focus-ring' },
  color_input_placeholder: { tsKey: 'colorInputPlaceholder', cssVar: '--color-input-placeholder' },
  font_family_heading: { tsKey: 'fontFamilyHeading', cssVar: '--font-family-heading' },
  font_family_body: { tsKey: 'fontFamilyBody', cssVar: '--font-family-body' },
  font_size_xs: { tsKey: 'fontSizeXs', cssVar: '--font-size-xs' },
  font_size_sm: { tsKey: 'fontSizeSm', cssVar: '--font-size-sm' },
  font_size_base: { tsKey: 'fontSizeBase', cssVar: '--font-size-base' },
  font_size_lg: { tsKey: 'fontSizeLg', cssVar: '--font-size-lg' },
  font_size_xl: { tsKey: 'fontSizeXl', cssVar: '--font-size-xl' },
  font_size_2xl: { tsKey: 'fontSize2xl', cssVar: '--font-size-2xl' },
  font_size_3xl: { tsKey: 'fontSize3xl', cssVar: '--font-size-3xl' },
  radius_sm: { tsKey: 'radiusSm', cssVar: '--radius-sm' },
  radius_md: { tsKey: 'radiusMd', cssVar: '--radius-md' },
  radius_lg: { tsKey: 'radiusLg', cssVar: '--radius-lg' },
  radius_xl: { tsKey: 'radiusXl', cssVar: '--radius-xl' },
  radius_full: { tsKey: 'radiusFull', cssVar: '--radius-full' },
  shadow_sm: { tsKey: 'shadowSm', cssVar: '--shadow-sm' },
  shadow_md: { tsKey: 'shadowMd', cssVar: '--shadow-md' },
  shadow_lg: { tsKey: 'shadowLg', cssVar: '--shadow-lg' },
}

export async function getDesignTokens(tenantId: string, mode: DesignMode = 'light'): Promise<DesignTokens | null> {
  const cacheKey = `design-tokens:${tenantId}:${mode}`
  try {
    const cached = await redis.get<DesignTokens>(cacheKey)
    if (cached) return cached
  } catch {}

  const supabase = await createServerComponentClient()
  const { data: row, error } = await supabase.from('design_tokens').select('*').eq('tenant_id', tenantId).eq('mode', mode).single()
  if (error || !row) return null

  const tokens = {} as DesignTokens
  for (const [dbField, { tsKey }] of Object.entries(TOKEN_MAP)) {
    ;(tokens as any)[tsKey] = (row as any)[dbField]
  }

  try { await redis.set(cacheKey, tokens, { ex: 3600 }) } catch {}
  return tokens
}

export async function getDesignAssets(tenantId: string): Promise<DesignAssets | null> {
  const cacheKey = `design-assets:${tenantId}`
  try {
    const cached = await redis.get<DesignAssets>(cacheKey)
    if (cached) return cached
  } catch {}

  const supabase = await createServerComponentClient()
  const { data, error } = await supabase.from('design_assets').select('*').eq('tenant_id', tenantId).single()
  if (error || !data) return null

  const assets: DesignAssets = {
    logoSquareUrl: data.logo_square_url,
    logoHorizontalUrl: data.logo_horizontal_url,
    logoDarkUrl: data.logo_dark_url,
    faviconUrl: data.favicon_url,
    loginBannerUrl: data.login_banner_url,
    loginBannerVerticalUrl: data.login_banner_vertical_url,
    homepageHeroUrl: data.homepage_hero_url,
    homepageHeroMobileUrl: data.homepage_hero_mobile_url,
    cardBgPattern1Url: data.card_bg_pattern_1_url,
    cardBgPattern2Url: data.card_bg_pattern_2_url,
    cardBgPattern3Url: data.card_bg_pattern_3_url,
    cardBgGradientCss: data.card_bg_gradient_css,
    cardOverlayColor: data.card_overlay_color ?? 'rgba(0,0,0,0.3)',
    platformBgUrl: data.platform_bg_url,
    certificateBgUrl: data.certificate_bg_url,
    certificateLogoUrl: data.certificate_logo_url,
    certificateSignatureUrl: data.certificate_signature_url,
  }

  try { await redis.set(cacheKey, assets, { ex: 3600 }) } catch {}
  return assets
}

export async function invalidateDesignCache(tenantId: string) {
  await Promise.all([
    redis.del(`design-tokens:${tenantId}:light`),
    redis.del(`design-tokens:${tenantId}:dark`),
    redis.del(`design-assets:${tenantId}`),
  ])
}

export { TOKEN_MAP }
