import { getTenantFromHeaders } from '@/lib/tenant/resolver'
import { getDesignTokens, getDesignAssets } from '@/lib/design-system/tokens'
import { tokensToCSS } from '@/lib/design-system/css-generator'
import { TenantProvider } from '@/lib/tenant/context'
import { ThemeProvider } from 'next-themes'
import { QueryProvider } from '@/components/providers/QueryProvider'

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenantFromHeaders()

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
        <QueryProvider>
          <style dangerouslySetInnerHTML={{
            __html: `:root, .light { ${lightCSS} } .dark { ${darkCSS} }`
          }} />
          {assets?.faviconUrl && <link rel="icon" href={assets.faviconUrl} />}
          <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-page)', color: 'var(--color-text-primary)' }}>
            {children}
          </div>
        </QueryProvider>
      </ThemeProvider>
    </TenantProvider>
  )
}
