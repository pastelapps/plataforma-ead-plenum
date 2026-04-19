# AGENTS-PART2.md — Design System Engine, Auth & Tenant, Admin Organization

> **Continuação de AGENTS-PART1.md** — Leia PART1 primeiro.

---

## 7. AGENTE 3 — DESIGN SYSTEM ENGINE

**Responsabilidade:** Criar o motor de Design System dinâmico que lê tokens do banco, cacheia no Redis, e injeta CSS Variables no SSR. Inclui: lib de tokens, gerador de CSS, provider de tema, presets de paleta, e integração com Tailwind.

### Arquivo: `src/lib/redis/client.ts`

```typescript
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})
```

### Arquivo: `src/lib/design-system/tokens.ts`

```typescript
import { createServerComponentClient } from '@/lib/supabase/server'
import { redis } from '@/lib/redis/client'

export type DesignMode = 'light' | 'dark'

// Interface completa — espelha TODAS as colunas da tabela design_tokens
export interface DesignTokens {
  // Primárias (escala 50-900)
  colorPrimary50: string; colorPrimary100: string; colorPrimary200: string;
  colorPrimary300: string; colorPrimary400: string; colorPrimary500: string;
  colorPrimary600: string; colorPrimary700: string; colorPrimary800: string;
  colorPrimary900: string;
  // Secundárias (escala 50-900)
  colorSecondary50: string; colorSecondary100: string; colorSecondary200: string;
  colorSecondary300: string; colorSecondary400: string; colorSecondary500: string;
  colorSecondary600: string; colorSecondary700: string; colorSecondary800: string;
  colorSecondary900: string;
  // Terciárias (escala 50-900)
  colorTertiary50: string; colorTertiary100: string; colorTertiary200: string;
  colorTertiary300: string; colorTertiary400: string; colorTertiary500: string;
  colorTertiary600: string; colorTertiary700: string; colorTertiary800: string;
  colorTertiary900: string;
  // Neutras (escala 50-900)
  colorNeutral50: string; colorNeutral100: string; colorNeutral200: string;
  colorNeutral300: string; colorNeutral400: string; colorNeutral500: string;
  colorNeutral600: string; colorNeutral700: string; colorNeutral800: string;
  colorNeutral900: string;
  // Semânticas
  colorSuccess: string; colorSuccessLight: string; colorSuccessDark: string;
  colorWarning: string; colorWarningLight: string; colorWarningDark: string;
  colorError: string; colorErrorLight: string; colorErrorDark: string;
  colorInfo: string; colorInfoLight: string; colorInfoDark: string;
  // Backgrounds
  colorBgPage: string; colorBgSurface: string; colorBgElevated: string; colorBgOverlay: string;
  // Textos
  colorTextPrimary: string; colorTextSecondary: string; colorTextDisabled: string;
  colorTextInverse: string; colorTextLink: string; colorTextLinkHover: string;
  // Bordas
  colorBorderDefault: string; colorBorderStrong: string; colorBorderFocus: string;
  // Componentes
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
  // Tipografia
  fontFamilyHeading: string; fontFamilyBody: string;
  fontSizeXs: string; fontSizeSm: string; fontSizeBase: string;
  fontSizeLg: string; fontSizeXl: string; fontSize2xl: string; fontSize3xl: string;
  // Espaçamento / Radius
  radiusSm: string; radiusMd: string; radiusLg: string; radiusXl: string; radiusFull: string;
  // Sombras
  shadowSm: string; shadowMd: string; shadowLg: string;
}

// Interface de assets do tenant
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

// Mapa de conversão: campo do banco (snake_case) → campo do TypeScript (camelCase) → CSS Variable
const TOKEN_MAP: Record<string, { tsKey: keyof DesignTokens; cssVar: string }> = {
  color_primary_50:    { tsKey: 'colorPrimary50',    cssVar: '--color-primary-50' },
  color_primary_100:   { tsKey: 'colorPrimary100',   cssVar: '--color-primary-100' },
  color_primary_200:   { tsKey: 'colorPrimary200',   cssVar: '--color-primary-200' },
  color_primary_300:   { tsKey: 'colorPrimary300',   cssVar: '--color-primary-300' },
  color_primary_400:   { tsKey: 'colorPrimary400',   cssVar: '--color-primary-400' },
  color_primary_500:   { tsKey: 'colorPrimary500',   cssVar: '--color-primary-500' },
  color_primary_600:   { tsKey: 'colorPrimary600',   cssVar: '--color-primary-600' },
  color_primary_700:   { tsKey: 'colorPrimary700',   cssVar: '--color-primary-700' },
  color_primary_800:   { tsKey: 'colorPrimary800',   cssVar: '--color-primary-800' },
  color_primary_900:   { tsKey: 'colorPrimary900',   cssVar: '--color-primary-900' },
  // ... (REPETIR PARA TODAS AS COLUNAS — o agente deve gerar o mapa completo)
  // Secundárias, Terciárias, Neutras, Semânticas, Backgrounds, Textos, Bordas,
  // Componentes, Tipografia, Radius, Sombras
  color_bg_page:       { tsKey: 'colorBgPage',       cssVar: '--color-bg-page' },
  color_bg_surface:    { tsKey: 'colorBgSurface',    cssVar: '--color-bg-surface' },
  color_text_primary:  { tsKey: 'colorTextPrimary',  cssVar: '--color-text-primary' },
  color_text_secondary:{ tsKey: 'colorTextSecondary', cssVar: '--color-text-secondary' },
  color_btn_primary_bg:    { tsKey: 'colorBtnPrimaryBg',    cssVar: '--color-btn-primary-bg' },
  color_btn_primary_text:  { tsKey: 'colorBtnPrimaryText',  cssVar: '--color-btn-primary-text' },
  color_btn_primary_hover: { tsKey: 'colorBtnPrimaryHover',  cssVar: '--color-btn-primary-hover' },
  color_card_bg:       { tsKey: 'colorCardBg',       cssVar: '--color-card-bg' },
  color_card_border:   { tsKey: 'colorCardBorder',   cssVar: '--color-card-border' },
  color_progress_fill: { tsKey: 'colorProgressFill', cssVar: '--color-progress-fill' },
  font_family_heading: { tsKey: 'fontFamilyHeading', cssVar: '--font-family-heading' },
  font_family_body:    { tsKey: 'fontFamilyBody',    cssVar: '--font-family-body' },
  radius_md:           { tsKey: 'radiusMd',          cssVar: '--radius-md' },
  shadow_md:           { tsKey: 'shadowMd',          cssVar: '--shadow-md' },
  // ... (AGENTE: gere o mapa completo para TODOS os campos da tabela design_tokens)
}

/**
 * Busca tokens de design do tenant com cache Redis (TTL 1h)
 * Retorna null se tenant não tiver tokens configurados
 */
export async function getDesignTokens(
  tenantId: string,
  mode: DesignMode = 'light'
): Promise<DesignTokens | null> {
  const cacheKey = `design-tokens:${tenantId}:${mode}`

  // 1. Tentar cache Redis primeiro
  const cached = await redis.get<DesignTokens>(cacheKey)
  if (cached) return cached

  // 2. Buscar no banco
  const supabase = createServerComponentClient()
  const { data: row, error } = await supabase
    .from('design_tokens')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('mode', mode)
    .single()

  if (error || !row) return null

  // 3. Converter snake_case → camelCase usando o mapa
  const tokens = {} as DesignTokens
  for (const [dbField, { tsKey }] of Object.entries(TOKEN_MAP)) {
    ;(tokens as any)[tsKey] = (row as any)[dbField]
  }

  // 4. Salvar no cache por 1 hora
  await redis.set(cacheKey, tokens, { ex: 3600 })

  return tokens
}

/**
 * Busca assets de design do tenant com cache Redis (TTL 1h)
 */
export async function getDesignAssets(tenantId: string): Promise<DesignAssets | null> {
  const cacheKey = `design-assets:${tenantId}`

  const cached = await redis.get<DesignAssets>(cacheKey)
  if (cached) return cached

  const supabase = createServerComponentClient()
  const { data, error } = await supabase
    .from('design_assets')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

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

  await redis.set(cacheKey, assets, { ex: 3600 })
  return assets
}

/**
 * Invalida cache quando design system é atualizado
 * DEVE ser chamado sempre que admin do tenant salvar alterações
 */
export async function invalidateDesignCache(tenantId: string) {
  await Promise.all([
    redis.del(`design-tokens:${tenantId}:light`),
    redis.del(`design-tokens:${tenantId}:dark`),
    redis.del(`design-assets:${tenantId}`),
  ])
}
```

### Arquivo: `src/lib/design-system/css-generator.ts`

```typescript
import type { DesignTokens } from './tokens'

/**
 * Converte um objeto DesignTokens em string de CSS Variables
 * Resultado é injetado no <style> do layout via SSR
 */
export function tokensToCSS(tokens: DesignTokens): string {
  // Mapa completo: propriedade TypeScript → CSS Variable
  const cssMap: Record<keyof DesignTokens, string> = {
    // Primárias
    colorPrimary50: '--color-primary-50',
    colorPrimary100: '--color-primary-100',
    colorPrimary200: '--color-primary-200',
    colorPrimary300: '--color-primary-300',
    colorPrimary400: '--color-primary-400',
    colorPrimary500: '--color-primary-500',
    colorPrimary600: '--color-primary-600',
    colorPrimary700: '--color-primary-700',
    colorPrimary800: '--color-primary-800',
    colorPrimary900: '--color-primary-900',
    // Secundárias
    colorSecondary50: '--color-secondary-50',
    colorSecondary100: '--color-secondary-100',
    colorSecondary200: '--color-secondary-200',
    colorSecondary300: '--color-secondary-300',
    colorSecondary400: '--color-secondary-400',
    colorSecondary500: '--color-secondary-500',
    colorSecondary600: '--color-secondary-600',
    colorSecondary700: '--color-secondary-700',
    colorSecondary800: '--color-secondary-800',
    colorSecondary900: '--color-secondary-900',
    // Terciárias
    colorTertiary50: '--color-tertiary-50',
    colorTertiary100: '--color-tertiary-100',
    colorTertiary200: '--color-tertiary-200',
    colorTertiary300: '--color-tertiary-300',
    colorTertiary400: '--color-tertiary-400',
    colorTertiary500: '--color-tertiary-500',
    colorTertiary600: '--color-tertiary-600',
    colorTertiary700: '--color-tertiary-700',
    colorTertiary800: '--color-tertiary-800',
    colorTertiary900: '--color-tertiary-900',
    // Neutras
    colorNeutral50: '--color-neutral-50',
    colorNeutral100: '--color-neutral-100',
    colorNeutral200: '--color-neutral-200',
    colorNeutral300: '--color-neutral-300',
    colorNeutral400: '--color-neutral-400',
    colorNeutral500: '--color-neutral-500',
    colorNeutral600: '--color-neutral-600',
    colorNeutral700: '--color-neutral-700',
    colorNeutral800: '--color-neutral-800',
    colorNeutral900: '--color-neutral-900',
    // Semânticas
    colorSuccess: '--color-success', colorSuccessLight: '--color-success-light', colorSuccessDark: '--color-success-dark',
    colorWarning: '--color-warning', colorWarningLight: '--color-warning-light', colorWarningDark: '--color-warning-dark',
    colorError: '--color-error', colorErrorLight: '--color-error-light', colorErrorDark: '--color-error-dark',
    colorInfo: '--color-info', colorInfoLight: '--color-info-light', colorInfoDark: '--color-info-dark',
    // Backgrounds
    colorBgPage: '--color-bg-page', colorBgSurface: '--color-bg-surface',
    colorBgElevated: '--color-bg-elevated', colorBgOverlay: '--color-bg-overlay',
    // Textos
    colorTextPrimary: '--color-text-primary', colorTextSecondary: '--color-text-secondary',
    colorTextDisabled: '--color-text-disabled', colorTextInverse: '--color-text-inverse',
    colorTextLink: '--color-text-link', colorTextLinkHover: '--color-text-link-hover',
    // Bordas
    colorBorderDefault: '--color-border-default', colorBorderStrong: '--color-border-strong',
    colorBorderFocus: '--color-border-focus',
    // Header / Sidebar / Footer
    colorHeaderBg: '--color-header-bg', colorHeaderText: '--color-header-text',
    colorSidebarBg: '--color-sidebar-bg', colorSidebarText: '--color-sidebar-text',
    colorSidebarActive: '--color-sidebar-active',
    colorFooterBg: '--color-footer-bg', colorFooterText: '--color-footer-text',
    // Botões
    colorBtnPrimaryBg: '--color-btn-primary-bg', colorBtnPrimaryText: '--color-btn-primary-text',
    colorBtnPrimaryHover: '--color-btn-primary-hover',
    colorBtnSecondaryBg: '--color-btn-secondary-bg', colorBtnSecondaryText: '--color-btn-secondary-text',
    colorBtnSecondaryHover: '--color-btn-secondary-hover',
    colorBtnDangerBg: '--color-btn-danger-bg', colorBtnDangerText: '--color-btn-danger-text',
    colorBtnDangerHover: '--color-btn-danger-hover',
    // Cards
    colorCardBg: '--color-card-bg', colorCardBorder: '--color-card-border', colorCardShadow: '--color-card-shadow',
    // Progress
    colorProgressTrack: '--color-progress-track', colorProgressFill: '--color-progress-fill',
    // Badge
    colorBadgeDefaultBg: '--color-badge-default-bg', colorBadgeDefaultText: '--color-badge-default-text',
    // Input
    colorInputBg: '--color-input-bg', colorInputBorder: '--color-input-border',
    colorInputFocusRing: '--color-input-focus-ring', colorInputPlaceholder: '--color-input-placeholder',
    // Tipografia
    fontFamilyHeading: '--font-family-heading', fontFamilyBody: '--font-family-body',
    fontSizeXs: '--font-size-xs', fontSizeSm: '--font-size-sm', fontSizeBase: '--font-size-base',
    fontSizeLg: '--font-size-lg', fontSizeXl: '--font-size-xl', fontSize2xl: '--font-size-2xl',
    fontSize3xl: '--font-size-3xl',
    // Radius
    radiusSm: '--radius-sm', radiusMd: '--radius-md', radiusLg: '--radius-lg',
    radiusXl: '--radius-xl', radiusFull: '--radius-full',
    // Sombras
    shadowSm: '--shadow-sm', shadowMd: '--shadow-md', shadowLg: '--shadow-lg',
  }

  const lines: string[] = []
  for (const [key, cssVar] of Object.entries(cssMap)) {
    const value = tokens[key as keyof DesignTokens]
    if (value) {
      lines.push(`${cssVar}: ${value};`)
    }
  }

  return lines.join('\n    ')
}
```

### Arquivo: `src/lib/design-system/presets.ts`

```typescript
/**
 * Paletas pré-definidas para facilitar a configuração inicial de tenants.
 * O admin do tenant pode escolher um preset e depois customizar.
 * Estes presets também são salvos na tabela design_presets para
 * permitir que a organization crie novos via admin panel.
 */

export interface DesignPreset {
  name: string
  description: string
  colors: {
    primary500: string
    primary600: string
    secondary500: string
    tertiary500: string
    bgPage: string
    bgSurface: string
    sidebarBg: string
  }
}

export const DEFAULT_PRESETS: DesignPreset[] = [
  {
    name: 'Azul Institucional',
    description: 'Clássico e profissional. Ideal para prefeituras e órgãos públicos.',
    colors: {
      primary500: '#3b82f6',
      primary600: '#2563eb',
      secondary500: '#22c55e',
      tertiary500: '#d946ef',
      bgPage: '#ffffff',
      bgSurface: '#f9fafb',
      sidebarBg: '#1e3a5f',
    },
  },
  {
    name: 'Verde Natureza',
    description: 'Fresco e acolhedor. Bom para temas de saúde, meio ambiente.',
    colors: {
      primary500: '#16a34a',
      primary600: '#15803d',
      secondary500: '#0ea5e9',
      tertiary500: '#f59e0b',
      bgPage: '#ffffff',
      bgSurface: '#f0fdf4',
      sidebarBg: '#14532d',
    },
  },
  {
    name: 'Roxo Educação',
    description: 'Moderno e criativo. Ótimo para cursos de tecnologia e inovação.',
    colors: {
      primary500: '#8b5cf6',
      primary600: '#7c3aed',
      secondary500: '#ec4899',
      tertiary500: '#f97316',
      bgPage: '#ffffff',
      bgSurface: '#faf5ff',
      sidebarBg: '#3b0764',
    },
  },
  {
    name: 'Terracota Cultura',
    description: 'Quente e acessível. Para cursos de cultura, artes e humanidades.',
    colors: {
      primary500: '#ea580c',
      primary600: '#c2410c',
      secondary500: '#84cc16',
      tertiary500: '#06b6d4',
      bgPage: '#fffbeb',
      bgSurface: '#fff7ed',
      sidebarBg: '#431407',
    },
  },
  {
    name: 'Escuro Elegante',
    description: 'Dark mode sofisticado. Para plataformas com visual premium.',
    colors: {
      primary500: '#6366f1',
      primary600: '#4f46e5',
      secondary500: '#14b8a6',
      tertiary500: '#f43f5e',
      bgPage: '#0f172a',
      bgSurface: '#1e293b',
      sidebarBg: '#020617',
    },
  },
]

/**
 * Gera uma paleta completa (50-900) a partir de uma cor base (500).
 * Usa interpolação simples — em produção, considere usar chroma.js
 * para gerar escalas perceptualmente uniformes.
 */
export function generatePaletteFromBase(base: string): Record<string, string> {
  // Implementação: converter hex → HSL, variar lightness
  // 50 = 95% lightness, 900 = 15% lightness
  // O agente deve implementar a conversão hex→hsl→hex com interpolação
  return {
    '50': lighten(base, 0.95),
    '100': lighten(base, 0.90),
    '200': lighten(base, 0.80),
    '300': lighten(base, 0.65),
    '400': lighten(base, 0.45),
    '500': base,
    '600': darken(base, 0.15),
    '700': darken(base, 0.30),
    '800': darken(base, 0.45),
    '900': darken(base, 0.60),
  }
}

// Helper functions (o agente deve implementar)
function lighten(hex: string, amount: number): string {
  // TODO: implementar conversão hex → hsl, aumentar lightness, converter de volta
  return hex
}
function darken(hex: string, amount: number): string {
  // TODO: implementar conversão hex → hsl, diminuir lightness, converter de volta
  return hex
}
```

### Arquivo: `src/styles/globals.css` — Tailwind usando CSS Variables

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Fallbacks — são sobrescritos pelas CSS Variables injetadas pelo SSR */
  :root {
    --color-primary-50: #eff6ff;
    --color-primary-500: #3b82f6;
    --color-primary-600: #2563eb;
    --color-bg-page: #ffffff;
    --color-bg-surface: #f9fafb;
    --color-bg-elevated: #ffffff;
    --color-text-primary: #111827;
    --color-text-secondary: #6b7280;
    --color-text-link: #3b82f6;
    --color-border-default: #e5e7eb;
    --color-border-focus: #3b82f6;
    --color-card-bg: #ffffff;
    --color-card-border: #e5e7eb;
    --color-btn-primary-bg: #3b82f6;
    --color-btn-primary-text: #ffffff;
    --color-success: #22c55e;
    --color-warning: #f59e0b;
    --color-error: #ef4444;
    --color-info: #3b82f6;
    --color-progress-track: #e5e7eb;
    --color-progress-fill: #3b82f6;
    --font-family-heading: 'Inter', system-ui, sans-serif;
    --font-family-body: 'Inter', system-ui, sans-serif;
    --radius-sm: 0.25rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  }

  body {
    background-color: var(--color-bg-page);
    color: var(--color-text-primary);
    font-family: var(--font-family-body);
  }
}

@layer components {
  /* Classes utilitárias que usam tokens do Design System */
  .btn-primary {
    @apply px-4 py-2 rounded-md font-medium transition-colors;
    background-color: var(--color-btn-primary-bg);
    color: var(--color-btn-primary-text);
  }
  .btn-primary:hover {
    background-color: var(--color-btn-primary-hover, var(--color-primary-600));
  }

  .btn-secondary {
    @apply px-4 py-2 rounded-md font-medium transition-colors;
    background-color: var(--color-btn-secondary-bg);
    color: var(--color-btn-secondary-text);
  }

  .card-tenant {
    background-color: var(--color-card-bg);
    border: 1px solid var(--color-card-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  .progress-bar-track {
    background-color: var(--color-progress-track);
    border-radius: var(--radius-full);
  }
  .progress-bar-fill {
    background-color: var(--color-progress-fill);
    border-radius: var(--radius-full);
    transition: width 0.3s ease;
  }

  .link-tenant {
    color: var(--color-text-link);
  }
  .link-tenant:hover {
    color: var(--color-text-link-hover, var(--color-primary-600));
  }
}
```

### Arquivo: `tailwind.config.ts` — Extend com CSS Variables

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tokens do Design System como cores do Tailwind
        // Uso: bg-ds-primary-500, text-ds-neutral-900, etc.
        ds: {
          primary: {
            50: 'var(--color-primary-50)',
            100: 'var(--color-primary-100)',
            200: 'var(--color-primary-200)',
            300: 'var(--color-primary-300)',
            400: 'var(--color-primary-400)',
            500: 'var(--color-primary-500)',
            600: 'var(--color-primary-600)',
            700: 'var(--color-primary-700)',
            800: 'var(--color-primary-800)',
            900: 'var(--color-primary-900)',
          },
          secondary: {
            50: 'var(--color-secondary-50)',
            500: 'var(--color-secondary-500)',
            600: 'var(--color-secondary-600)',
          },
          neutral: {
            50: 'var(--color-neutral-50)',
            100: 'var(--color-neutral-100)',
            200: 'var(--color-neutral-200)',
            300: 'var(--color-neutral-300)',
            500: 'var(--color-neutral-500)',
            700: 'var(--color-neutral-700)',
            800: 'var(--color-neutral-800)',
            900: 'var(--color-neutral-900)',
          },
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          error: 'var(--color-error)',
          info: 'var(--color-info)',
          bg: {
            page: 'var(--color-bg-page)',
            surface: 'var(--color-bg-surface)',
            elevated: 'var(--color-bg-elevated)',
          },
          text: {
            primary: 'var(--color-text-primary)',
            secondary: 'var(--color-text-secondary)',
            disabled: 'var(--color-text-disabled)',
            inverse: 'var(--color-text-inverse)',
            link: 'var(--color-text-link)',
          },
          border: {
            default: 'var(--color-border-default)',
            strong: 'var(--color-border-strong)',
            focus: 'var(--color-border-focus)',
          },
        },
      },
      fontFamily: {
        heading: 'var(--font-family-heading)',
        body: 'var(--font-family-body)',
      },
      borderRadius: {
        ds: 'var(--radius-md)',
        'ds-lg': 'var(--radius-lg)',
        'ds-xl': 'var(--radius-xl)',
      },
      boxShadow: {
        'ds-sm': 'var(--shadow-sm)',
        'ds-md': 'var(--shadow-md)',
        'ds-lg': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
```

### Arquivo: `src/app/(tenant)/layout.tsx` — Injeção de CSS Variables via SSR

```typescript
import { getTenantFromHeaders } from '@/lib/tenant/resolver'
import { getDesignTokens, getDesignAssets } from '@/lib/design-system/tokens'
import { tokensToCSS } from '@/lib/design-system/css-generator'
import { TenantProvider } from '@/lib/tenant/context'
import { ThemeProvider } from 'next-themes'
import '@/styles/globals.css'

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenant = await getTenantFromHeaders()

  // Buscar tokens para ambos os modos
  const [lightTokens, darkTokens, assets] = await Promise.all([
    getDesignTokens(tenant.id, 'light'),
    getDesignTokens(tenant.id, 'dark'),
    getDesignAssets(tenant.id),
  ])

  const lightCSS = lightTokens ? tokensToCSS(lightTokens) : ''
  const darkCSS = darkTokens ? tokensToCSS(darkTokens) : ''

  return (
    <TenantProvider tenant={tenant} assets={assets}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {/* CSS Variables injetadas no SSR — sem flash de conteúdo sem tema */}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root, .light { ${lightCSS} }
            .dark { ${darkCSS} }
          `
        }} />

        {/* Favicon dinâmico */}
        {assets?.faviconUrl && (
          <link rel="icon" href={assets.faviconUrl} />
        )}

        <div className="min-h-screen bg-ds-bg-page text-ds-text-primary">
          {children}
        </div>
      </ThemeProvider>
    </TenantProvider>
  )
}
```

**Entrega esperada do Agente 3:**

- [ ] `src/lib/redis/client.ts` — cliente Redis
- [ ] `src/lib/design-system/tokens.ts` — busca tokens + assets com cache Redis
- [ ] `src/lib/design-system/css-generator.ts` — converte tokens em CSS Variables (mapa COMPLETO)
- [ ] `src/lib/design-system/presets.ts` — 5 paletas pré-definidas + gerador de paleta
- [ ] `src/styles/globals.css` — Tailwind com classes utilitárias usando CSS Variables
- [ ] `tailwind.config.ts` — extend com cores `ds-*` usando CSS Variables
- [ ] `src/app/(tenant)/layout.tsx` — SSR injetando CSS Vars para light e dark mode
- [ ] Todas as classes CSS começam com prefixo `ds-` para evitar conflito

---

## 8. AGENTE 4 — AUTH & TENANT RESOLVER

**Responsabilidade:** Implementar a resolução de tenant por subdomínio/domínio customizado, middleware global, fluxo de magic link, sistema de convites por email, guards de rota, e criação automática de profile.

### Arquivo: `src/lib/tenant/resolver.ts` — Resolução de Tenant

```typescript
import { headers } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase/server'
import { redis } from '@/lib/redis/client'
import { redirect } from 'next/navigation'

export interface TenantInfo {
  id: string
  organizationId: string
  name: string
  slug: string
  customDomain: string | null
  active: boolean
  completionThreshold: number
  allowSelfRegistration: boolean
}

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN! // suaplataforma.com.br

/**
 * Resolve o tenant a partir do hostname da requisição.
 *
 * Lógica de resolução:
 * 1. `prefeitura-guaxupe.suaplataforma.com.br` → slug = "prefeitura-guaxupe"
 * 2. `ead.guaxupe.mg.gov.br` → busca na coluna custom_domain
 * 3. `suaplataforma.com.br` (sem subdomain) → redireciona para landing page
 * 4. `admin.suaplataforma.com.br` → painel da organization (sem tenant)
 * 5. `localhost:3000` → usa header `x-tenant-slug` para dev
 *
 * Cache Redis: TTL 1h por hostname → tenant_id
 */
export async function getTenantFromHeaders(): Promise<TenantInfo> {
  const headersList = headers()
  const hostname = headersList.get('host') ?? ''

  // DEV MODE: usar header customizado
  if (hostname.includes('localhost')) {
    const devSlug = headersList.get('x-tenant-slug')
    if (devSlug) {
      return resolveTenantBySlug(devSlug)
    }
    // Fallback: primeiro tenant ativo
    const supabase = createServerComponentClient()
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .eq('active', true)
      .limit(1)
      .single()
    if (data) return mapTenant(data)
    throw new Error('No active tenant found for development')
  }

  // Checar se é o domínio root (sem subdomain)
  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    redirect('/landing')  // Landing page pública (sem tenant)
  }

  // Checar se é subdomínio do root domain
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const slug = hostname.replace(`.${ROOT_DOMAIN}`, '')

    // Subdomínios reservados
    if (slug === 'admin' || slug === 'api' || slug === 'www') {
      redirect(`https://${ROOT_DOMAIN}/${slug}`)
    }

    return resolveTenantBySlug(slug)
  }

  // Domínio customizado (ex: ead.guaxupe.mg.gov.br)
  return resolveTenantByDomain(hostname)
}

async function resolveTenantBySlug(slug: string): Promise<TenantInfo> {
  const cacheKey = `tenant-slug:${slug}`
  const cached = await redis.get<TenantInfo>(cacheKey)
  if (cached) return cached

  const supabase = createServerComponentClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (error || !data) {
    redirect('/404?reason=tenant-not-found')
  }

  const tenant = mapTenant(data)
  await redis.set(cacheKey, tenant, { ex: 3600 })
  return tenant
}

async function resolveTenantByDomain(domain: string): Promise<TenantInfo> {
  const cacheKey = `tenant-domain:${domain}`
  const cached = await redis.get<TenantInfo>(cacheKey)
  if (cached) return cached

  const supabase = createServerComponentClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('custom_domain', domain)
    .eq('active', true)
    .single()

  if (error || !data) {
    redirect('/404?reason=domain-not-found')
  }

  const tenant = mapTenant(data)
  await redis.set(cacheKey, tenant, { ex: 3600 })
  return tenant
}

function mapTenant(data: any): TenantInfo {
  return {
    id: data.id,
    organizationId: data.organization_id,
    name: data.name,
    slug: data.slug,
    customDomain: data.custom_domain,
    active: data.active,
    completionThreshold: data.completion_threshold ?? 80,
    allowSelfRegistration: data.allow_self_registration ?? false,
  }
}

/**
 * Invalida cache de tenant (chamar quando slug ou domain mudar)
 */
export async function invalidateTenantCache(slug: string, domain?: string | null) {
  await redis.del(`tenant-slug:${slug}`)
  if (domain) await redis.del(`tenant-domain:${domain}`)
}
```

### Arquivo: `src/lib/tenant/context.tsx` — React Context do Tenant

```typescript
'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { TenantInfo } from './resolver'
import type { DesignAssets } from '@/lib/design-system/tokens'

interface TenantContextType {
  tenant: TenantInfo
  assets: DesignAssets | null
}

const TenantContext = createContext<TenantContextType | null>(null)

export function TenantProvider({
  tenant,
  assets,
  children,
}: {
  tenant: TenantInfo
  assets: DesignAssets | null
  children: ReactNode
}) {
  return (
    <TenantContext.Provider value={{ tenant, assets }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within TenantProvider')
  return ctx
}
```

### Arquivo: `src/middleware.ts` — Middleware Global

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN!

// Rotas que não precisam de autenticação
const PUBLIC_PATHS = [
  '/login',
  '/magic-link',
  '/invite',
  '/verify',         // verificação de certificado
  '/api/webhooks',   // webhooks (Panda, etc.)
  '/api/auth',       // callbacks de auth
  '/_next',
  '/favicon.ico',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') ?? ''

  // Ignorar rotas públicas e assets
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Criar cliente Supabase para middleware
  const { supabase, response } = createMiddlewareClient(request)

  // Verificar sessão
  const { data: { session } } = await supabase.auth.getSession()

  // Rotas de admin da organization (admin.suaplataforma.com.br)
  if (hostname.startsWith('admin.')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Verificar se é admin de alguma organization
    const { data: orgAdmin } = await supabase
      .from('organization_admins')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('active', true)
      .limit(1)
      .single()

    if (!orgAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    return response
  }

  // Rotas de tenant-admin
  if (pathname.startsWith('/tenant-admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // O guard de role 'admin_tenant' será verificado no layout/page
    return response
  }

  // Rotas de tenant (aluno)
  if (!session && !pathname.startsWith('/login') && !pathname.startsWith('/invite')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
```

### Arquivo: `src/lib/auth/guards.ts` — Guards de Rota

```typescript
import { createServerComponentClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTenantFromHeaders } from '@/lib/tenant/resolver'

/**
 * Requer autenticação. Retorna o user ou redireciona para login.
 */
export async function requireAuth() {
  const supabase = createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Requer que o user tenha um profile no tenant atual.
 * Retorna o profile ou redireciona.
 */
export async function requireProfile() {
  const user = await requireAuth()
  const tenant = await getTenantFromHeaders()
  const supabase = createServerComponentClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('tenant_id', tenant.id)
    .eq('active', true)
    .single()

  if (!profile) {
    redirect('/login?error=no-profile')
  }

  return { user, profile, tenant }
}

/**
 * Requer role específico no tenant.
 * 'admin_tenant' tem acesso a tudo. 'manager' a relatórios. 'student' ao portal.
 */
export async function requireRole(requiredRole: 'student' | 'manager' | 'admin_tenant') {
  const { user, profile, tenant } = await requireProfile()

  const roleHierarchy: Record<string, number> = {
    student: 1,
    manager: 2,
    admin_tenant: 3,
  }

  if (roleHierarchy[profile.role] < roleHierarchy[requiredRole]) {
    redirect('/unauthorized')
  }

  return { user, profile, tenant }
}

/**
 * Requer que o user seja admin de uma organization.
 * Usado no painel /admin.
 */
export async function requireOrgAdmin() {
  const user = await requireAuth()
  const supabase = createServerComponentClient()

  const { data: orgAdmin } = await supabase
    .from('organization_admins')
    .select('*, organizations(*)')
    .eq('user_id', user.id)
    .eq('active', true)
    .limit(1)
    .single()

  if (!orgAdmin) {
    redirect('/unauthorized')
  }

  return { user, orgAdmin, organization: orgAdmin.organizations }
}
```

### Arquivo: `src/app/api/invitations/send/route.ts` — API de Envio de Convites

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { resend } from '@/lib/resend/client'
import { InvitationEmail } from '@/lib/resend/templates/invitation'
import { z } from 'zod'

const SendInvitationSchema = z.object({
  tenantId: z.string().uuid(),
  emails: z.array(z.string().email()).min(1).max(50),
  role: z.enum(['student', 'manager', 'admin_tenant']).default('student'),
  fullName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient()

  // Verificar que o chamador é admin do tenant
  // (auth header → user_id → profile com role admin_tenant no tenant)
  // ... (implementar verificação)

  const body = await request.json()
  const parsed = SendInvitationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { tenantId, emails, role } = parsed.data

  // Buscar dados do tenant para o email
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, slug')
    .eq('id', tenantId)
    .single()

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const results = []
  for (const email of emails) {
    // Criar convite no banco
    const { data: invitation, error } = await supabase
      .from('invitations')
      .upsert({
        tenant_id: tenantId,
        email,
        role,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
      }, {
        onConflict: 'tenant_id,email',
      })
      .select()
      .single()

    if (error) {
      results.push({ email, success: false, error: error.message })
      continue
    }

    // Enviar email via Resend
    const inviteUrl = `https://${tenant.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/invite/${invitation.token}`

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: `Você foi convidado para ${tenant.name}`,
        react: InvitationEmail({
          tenantName: tenant.name,
          inviteUrl,
          expiresInDays: 7,
        }),
      })
      results.push({ email, success: true })
    } catch (err) {
      results.push({ email, success: false, error: 'Failed to send email' })
    }
  }

  return NextResponse.json({ results })
}
```

### Arquivo: `src/app/(auth)/invite/[token]/page.tsx` — Página de Aceite de Convite

```typescript
import { createServerComponentClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AcceptInviteForm } from '@/components/auth/accept-invite-form'

interface Props {
  params: { token: string }
}

export default async function AcceptInvitePage({ params }: Props) {
  const supabase = createServerComponentClient()

  // Buscar convite pelo token
  const { data: invitation } = await supabase
    .from('invitations')
    .select('*, tenants(name, slug)')
    .eq('token', params.token)
    .eq('status', 'pending')
    .single()

  if (!invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Convite inválido ou expirado</h1>
          <p className="text-gray-600 mt-2">
            Este convite não é mais válido. Solicite um novo convite ao administrador.
          </p>
        </div>
      </div>
    )
  }

  // Verificar se expirou
  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Convite expirado</h1>
          <p className="text-gray-600 mt-2">
            Este convite expirou. Solicite um novo ao administrador.
          </p>
        </div>
      </div>
    )
  }

  // Verificar se o user já está logado
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <AcceptInviteForm
      invitation={invitation}
      tenantName={invitation.tenants.name}
      tenantSlug={invitation.tenants.slug}
      isLoggedIn={!!user}
      userEmail={user?.email}
    />
  )
}
```

### Fluxo completo de convite:

```
1. Admin do tenant acessa /tenant-admin/alunos
2. Clica "Convidar alunos"
3. Preenche emails (individual ou CSV de emails)
4. POST /api/invitations/send → cria registros em invitations + envia email
5. Aluno recebe email com link: prefeitura-guaxupe.suaplataforma.com.br/invite/TOKEN
6. Se aluno NÃO tem conta:
   a. Mostra formulário de cadastro (nome, senha)
   b. Cria auth.user → trigger cria users → aceita convite → cria profile no tenant
7. Se aluno JÁ tem conta:
   a. Mostra "Você já tem conta. Clique para aceitar o convite"
   b. Aceita convite → cria profile no tenant (novo profile, dados separados)
8. Convite marcado como 'accepted', invitation.accepted_at = now()
9. Aluno é redirecionado para a homepage do tenant
```

**Entrega esperada do Agente 4:**

- [ ] `src/lib/tenant/resolver.ts` — resolução por subdomínio + domínio customizado + cache Redis
- [ ] `src/lib/tenant/context.tsx` — React Context do tenant
- [ ] `src/middleware.ts` — middleware global com proteção de rotas
- [ ] `src/lib/auth/guards.ts` — requireAuth, requireProfile, requireRole, requireOrgAdmin
- [ ] `src/lib/auth/session.ts` — getCurrentUser, getCurrentProfile helpers
- [ ] `src/lib/supabase/client.ts` — createBrowserClient
- [ ] `src/lib/supabase/server.ts` — createServerComponentClient
- [ ] `src/lib/supabase/middleware.ts` — createMiddlewareClient
- [ ] `src/lib/supabase/admin.ts` — createServiceRoleClient (service_role)
- [ ] `src/app/api/invitations/send/route.ts` — API de envio de convites em lote
- [ ] `src/app/api/invitations/accept/route.ts` — API de aceite de convite
- [ ] `src/app/(auth)/invite/[token]/page.tsx` — página de aceite de convite
- [ ] `src/app/(auth)/login/page.tsx` — tela de login com magic link
- [ ] `src/app/(auth)/magic-link/page.tsx` — "verifique seu email"
- [ ] `src/app/api/auth/callback/route.ts` — callback do Supabase Auth
- [ ] Fluxo testado: convite → cadastro → profile criado → redirecionamento

---

## 9. AGENTE 5 — ADMIN PANEL (ORGANIZATION)

**Responsabilidade:** Criar o painel administrativo da Organization (master). Este é o painel onde Plenum gerencia seus cursos, módulos, aulas, tenants e contratos.

### Estrutura de rotas do admin:

```
src/app/admin/
├── layout.tsx              # Layout com sidebar, header, guard requireOrgAdmin()
├── page.tsx                # Dashboard com stats: total cursos, tenants, alunos, matrículas
├── cursos/
│   ├── page.tsx            # Lista de cursos com filtro por status (draft/published/archived)
│   ├── novo/page.tsx       # Formulário de criação de curso
│   ├── [courseId]/
│   │   ├── page.tsx        # Detalhes + edição do curso
│   │   ├── modulos/
│   │   │   ├── page.tsx    # Lista de módulos com drag-and-drop para reordenar
│   │   │   └── [moduleId]/
│   │   │       └── aulas/
│   │   │           ├── page.tsx    # Lista de aulas com drag-and-drop
│   │   │           └── nova/page.tsx # Criação de aula + upload de vídeo
│   │   └── publicar/page.tsx  # Preview final + botão publicar
├── tenants/
│   ├── page.tsx            # Lista de tenants da organization
│   ├── novo/page.tsx       # Criação de tenant
│   └── [tenantId]/
│       ├── page.tsx        # Detalhes do tenant
│       └── contratos/page.tsx # Gerenciar cursos contratados
└── relatorios/
    └── page.tsx            # Analytics: matrículas por tenant, conclusão, etc.
```

### Workflow de criação de curso (CRÍTICO — especificação detalhada):

```
ETAPA 1: CRIAR CURSO
─────────────────────
Formulário:
  - title (obrigatório)
  - slug (auto-gerado a partir do title, editável)
  - description (textarea rich text)
  - short_description (máx 200 chars — usado nos cards)
  - category (select: saúde, educação, tecnologia, gestão, etc.)
  - level (select: beginner, intermediate, advanced)
  - tags (input de tags com autocomplete)
  - instructor_name
  - instructor_bio (textarea)
  - instructor_photo_url (upload para Supabase Storage → PNG transparente recomendado)
  - thumbnail_transparent_url (upload PNG transparente — PRINCIPAL)
  - thumbnail_url (upload fallback com fundo)
  - duration_minutes (estimado — será recalculado automaticamente)

Status inicial: 'draft'

ETAPA 2: CRIAR MÓDULOS
─────────────────────
Dentro do curso, o admin adiciona módulos:
  - title
  - description
  - position (drag-and-drop com @dnd-kit/sortable)

Interface: Lista de cards arrastáveis. Botão "Adicionar módulo" no final.

ETAPA 3: CRIAR AULAS (por módulo)
─────────────────────
Dentro de cada módulo, o admin adiciona aulas:
  - title
  - description
  - content_type: 'video' | 'text' | 'pdf'
  - position (drag-and-drop)
  - is_required (toggle — padrão true)
  - is_free_preview (toggle — padrão false)

  Se content_type = 'video':
    UPLOAD para Panda Video:
    1. POST para Panda API v2: criar vídeo na pasta do curso
    2. Receber upload_url
    3. Upload do arquivo de vídeo via upload_url
    4. Salvar panda_video_id no banco
    5. video_status = 'processing'
    6. Webhook do Panda notifica quando encoding terminar → video_status = 'ready'

  Se content_type = 'text':
    Editor de texto rico (markdown ou WYSIWYG simples)
    Salvar em content_body

  Se content_type = 'pdf':
    Upload para Supabase Storage
    Salvar URL em attachment_url

ETAPA 4: PREVIEW
─────────────────────
Tela de preview mostra como o curso aparecerá para o aluno:
  - Card do curso com thumbnail transparente sobre um gradiente de exemplo
  - Lista de módulos expandíveis com aulas
  - Player de vídeo da primeira aula (se ready)
  - Contagem total de aulas, duração, etc.

ETAPA 5: PUBLICAR
─────────────────────
  - Validações antes de publicar:
    - Pelo menos 1 módulo com pelo menos 1 aula
    - Todas as aulas de vídeo com video_status = 'ready'
    - Título e descrição preenchidos
  - Se validação OK: status = 'published', published_at = now()
  - Se falhar: mostrar checklist do que falta
```

### Integração com Panda Video API v2 — Especificação:

```typescript
// src/lib/panda/client.ts

const PANDA_API_URL = process.env.PANDA_API_URL!
const PANDA_API_KEY = process.env.PANDA_API_KEY!

interface PandaVideoResponse {
  id: string
  title: string
  status: string
  folder_id: string
  video_player: string // URL do player embed
}

/**
 * Criar um vídeo no Panda Video e obter a URL de upload
 */
export async function createPandaVideo(params: {
  title: string
  folderId: string
  description?: string
}): Promise<{ videoId: string; uploadUrl: string }> {
  const response = await fetch(`${PANDA_API_URL}/videos`, {
    method: 'POST',
    headers: {
      'Authorization': PANDA_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: params.title,
      folder_id: params.folderId,
      description: params.description,
    }),
  })

  const data = await response.json()
  return {
    videoId: data.id,
    uploadUrl: data.upload_url,
  }
}

/**
 * Obter detalhes de um vídeo
 */
export async function getPandaVideo(videoId: string): Promise<PandaVideoResponse> {
  const response = await fetch(`${PANDA_API_URL}/videos/${videoId}`, {
    headers: { 'Authorization': PANDA_API_KEY },
  })
  return response.json()
}

/**
 * Criar uma pasta no Panda Video (para organizar por curso)
 */
export async function createPandaFolder(name: string, parentId?: string): Promise<string> {
  const response = await fetch(`${PANDA_API_URL}/folders`, {
    method: 'POST',
    headers: {
      'Authorization': PANDA_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      parent_folder_id: parentId ?? process.env.PANDA_FOLDER_ID,
    }),
  })
  const data = await response.json()
  return data.id
}

/**
 * Deletar um vídeo
 */
export async function deletePandaVideo(videoId: string): Promise<void> {
  await fetch(`${PANDA_API_URL}/videos/${videoId}`, {
    method: 'DELETE',
    headers: { 'Authorization': PANDA_API_KEY },
  })
}
```

### Gestão de Tenants pelo Admin da Organization:

```
Funcionalidades:
1. Listar tenants da organization (tabela com nome, slug, status, alunos, cursos contratados)
2. Criar novo tenant (nome, slug, domínio customizado)
   → Ao criar: gerar automaticamente design_tokens (light + dark) com preset padrão
   → Ao criar: gerar automaticamente design_assets (vazio, admin do tenant preenche depois)
3. Editar tenant (nome, contrato, ativar/desativar)
4. Gerenciar cursos contratados por tenant:
   - Lista de cursos publicados da organization
   - Toggle "Ativar para este tenant" → cria/remove tenant_courses
   - Definir max_enrollments e expires_at por contrato
5. Ver relatório do tenant (total alunos, matrículas, taxa conclusão)
```

**Entrega esperada do Agente 5:**

- [ ] Layout do admin com sidebar (cursos, tenants, relatórios) + guard requireOrgAdmin()
- [ ] Dashboard com cards de stats (total cursos, tenants ativos, matrículas, taxa de conclusão)
- [ ] CRUD completo de cursos com formulário multi-step
- [ ] CRUD de módulos com drag-and-drop (@dnd-kit/sortable) para reordenar `position`
- [ ] CRUD de aulas com suporte a 3 tipos (video, text, pdf)
- [ ] Upload de vídeo integrado com Panda Video API v2
- [ ] Upload de thumbnails (transparente + fallback) para Supabase Storage
- [ ] Preview do curso antes de publicar
- [ ] Validação de publicação (checklist)
- [ ] Gestão de tenants (CRUD + ativação de cursos + contratos)
- [ ] Relatórios básicos (matrículas por tenant, cursos mais populares, taxa de conclusão)
- [ ] `src/lib/panda/client.ts` com todas as funções de integração
- [ ] `src/app/api/panda/upload/route.ts` — proxy seguro para upload de vídeo
