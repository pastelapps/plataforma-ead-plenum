import { LoginForm } from '@/components/auth/LoginForm'
import { getTenantFromHeaders } from '@/lib/tenant/resolver'
import { getDesignAssets } from '@/lib/design-system/tokens'

export default async function LoginPage() {
  const tenant = await getTenantFromHeaders()
  const assets = await getDesignAssets(tenant.id)

  const bannerUrl = assets?.loginBannerUrl ?? assets?.loginBannerVerticalUrl ?? null
  const logoUrl = assets?.logoDarkUrl ?? assets?.logoHorizontalUrl ?? assets?.logoSquareUrl ?? null

  return (
    <LoginForm
      bannerUrl={bannerUrl}
      logoUrl={logoUrl}
      tenantName={tenant.name}
    />
  )
}
