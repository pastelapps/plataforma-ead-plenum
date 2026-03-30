import { requireRole } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/admin/StatsCard'
import { Users, BookOpen, Award, TrendingUp } from 'lucide-react'

export default async function TenantAdminDashboard() {
  const { tenant } = await requireRole('admin_tenant')
  const supabase = await createServerComponentClient()

  const [profilesRes, coursesRes, certsRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('role', 'student'),
    supabase.from('tenant_courses').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('active', true),
    supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard - {tenant.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Alunos" value={profilesRes.count ?? 0} icon={Users} />
        <StatsCard title="Cursos" value={coursesRes.count ?? 0} icon={BookOpen} />
        <StatsCard title="Certificados" value={certsRes.count ?? 0} icon={Award} />
        <StatsCard title="Taxa Conclusão" value="-" icon={TrendingUp} />
      </div>
    </div>
  )
}
