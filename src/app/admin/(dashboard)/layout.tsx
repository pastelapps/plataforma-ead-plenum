import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { requireOrgAdmin } from '@/lib/auth/guards'

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireOrgAdmin()
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  )
}
