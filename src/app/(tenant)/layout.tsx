import { getTenantFromHeaders } from '@/lib/tenant/resolver'
import { getDesignTokens, getDesignAssets } from '@/lib/design-system/tokens'
import { tokensToCSS } from '@/lib/design-system/css-generator'
import { TenantProvider } from '@/lib/tenant/context'
import { QueryProvider } from '@/components/providers/QueryProvider'
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
    :root, .light { ${lightCSS} }
    .dark { ${darkCSS} }
    :root {
      --color-primary: var(--color-primary-500, #1ed6e4);
      --color-bg: #0a0a0a;
      --color-bg-secondary: #111111;
      --color-text: #ffffff;
      --color-text-secondary: #9ca3af;
      --color-instructor-badge: #00e676;
    }
  `

  return (
    <TenantProvider tenant={tenant} assets={assets}>
      <QueryProvider>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        {assets?.faviconUrl && <link rel="icon" href={assets.faviconUrl} />}
        <div className="min-h-screen flex flex-col dark" style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}>
          <StudentHeader />
          <main className="flex-1">
            {children}
          </main>
          <StudentFooter />
        </div>
      </QueryProvider>
    </TenantProvider>
  )
}
