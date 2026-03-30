import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/admin/StatsCard'
import { BookOpen, Building2, Users, Award } from 'lucide-react'

export default async function AdminDashboard() {
  const { organization } = await requireOrgAdmin()
  const supabase = await createServerComponentClient()

  const [coursesRes, tenantsRes] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id),
    supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id).eq('active', true),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard - {organization.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Cursos" value={coursesRes.count ?? 0} icon={BookOpen} />
        <StatsCard title="Tenants Ativos" value={tenantsRes.count ?? 0} icon={Building2} />
        <StatsCard title="Alunos" value="-" icon={Users} description="Total geral" />
        <StatsCard title="Certificados" value="-" icon={Award} description="Emitidos" />
      </div>
    </div>
  )
}
