import { getTenantFromHeaders } from '@/lib/tenant/resolver'
import { getDesignTokens, getDesignAssets } from '@/lib/design-system/tokens'
import { tokensToCSS } from '@/lib/design-system/css-generator'
import { TenantProvider } from '@/lib/tenant/context'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ThemeWrapper } from '@/components/providers/ThemeWrapper'
import { StudentHeader } from '@/components/layout/StudentHeader'
import { StudentFooter } from '@/components/layout/StudentFooter'

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenantFromHeaders()

  const [lightTokens, darkTokens, assets] = await Promise.all([
    getDesignTokens(tenant.id, 'light'),
    getDesignTokens(tenant.id, 'dark'),
    getDesignAssets(tenant.id),
  ])

  const lightCSS = lightTokens ? tokensToCSS(lightTokens) : ''
  const darkCSS = darkTokens ? tokensToCSS(darkTokens) : ''

  const cssVars = `
    .light {
      ${lightCSS}
      --color-bg: #f5f5f5;
      --color-bg-secondary: #ffffff;
      --color-bg-tertiary: #e5e5e5;
      --color-text: #111111;
      --color-text-secondary: #6b7280;
      --color-text-muted: #9ca3af;
      --color-border: #e5e7eb;
      --color-card-bg: #ffffff;
      --color-card-border: #e5e7eb;
      --color-header-bg: rgba(255,255,255,0.85);
      --color-header-text: #111111;
      --color-primary: var(--color-primary-500, #6366f1);
      --color-instructor-badge: #16a34a;
      /* shadcn overrides */
      --background: #f5f5f5;
      --foreground: #111111;
      --popover: #ffffff;
      --popover-foreground: #111111;
      --card: #ffffff;
      --card-foreground: #111111;
      --border: #e5e7eb;
      --input: #e5e7eb;
      --muted: #e5e5e5;
      --muted-foreground: #6b7280;
      --accent: #e5e5e5;
      --accent-foreground: #111111;
      --ring: #6366f1;
    }
    .dark {
      ${darkCSS}
      --color-bg: #0a0a0a;
      --color-bg-secondary: #111111;
      --color-bg-tertiary: #1a1a1a;
      --color-text: #ffffff;
      --color-text-secondary: #9ca3af;
      --color-text-muted: #6b7280;
      --color-border: #222222;
      --color-card-bg: rgba(255,255,255,0.04);
      --color-card-border: rgba(255,255,255,0.06);
      --color-header-bg: rgba(17,17,17,0.85);
      --color-header-text: #ffffff;
      --color-primary: var(--color-primary-500, #6366f1);
      --color-instructor-badge: #00e676;
      /* shadcn overrides */
      --background: #0a0a0a;
      --foreground: #ffffff;
      --popover: #1a1a1a;
      --popover-foreground: #ffffff;
      --card: #111111;
      --card-foreground: #ffffff;
      --border: #222222;
      --input: #222222;
      --muted: #1a1a1a;
      --muted-foreground: #6b7280;
      --accent: #1a1a1a;
      --accent-foreground: #ffffff;
      --ring: #6366f1;
    }
  `

  return (
    <TenantProvider tenant={tenant} assets={assets}>
      <QueryProvider>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        {assets?.faviconUrl && <link rel="icon" href={assets.faviconUrl} />}
        <ThemeWrapper>
          <StudentHeader />
          <main className="flex-1">
            {children}
          </main>
          <StudentFooter />
        </ThemeWrapper>
      </QueryProvider>
    </TenantProvider>
  )
}
