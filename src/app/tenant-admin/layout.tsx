import { TenantAdminSidebar } from '@/components/layout/TenantAdminSidebar'
import { requireAdminProfile } from '@/lib/auth/guards'

export default async function TenantAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminProfile()
  return (
    <div className="flex min-h-screen">
      <TenantAdminSidebar />
      <main className="flex-1 p-8" style={{ backgroundColor: 'var(--color-bg-page)' }}>{children}</main>
    </div>
  )
}
