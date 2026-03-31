import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/admin/StatsCard'
import { DashboardCharts } from '@/components/admin/DashboardCharts'
import Link from 'next/link'
import { BookOpen, Building2, Users, Award, Plus, BarChart3, ArrowRight } from 'lucide-react'

function formatDatePtBR(date: Date): string {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ]
  const dayOfWeek = days[date.getDay()]
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${dayOfWeek}, ${day} de ${month} de ${year}`
}

export default async function AdminDashboard() {
  const { user, organization } = await requireOrgAdmin()
  const supabase = await createServerComponentClient()

  // Fetch tenant IDs for the organization
  const { data: orgTenants } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('organization_id', organization.id)
    .eq('active', true)

  const tenantIds = orgTenants?.map(t => t.id) ?? []

  // Fetch all stats in parallel
  const [coursesRes, tenantsRes, studentsRes, certsRes] = await Promise.all([
    supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organization.id),
    supabase
      .from('tenants')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organization.id)
      .eq('active', true),
    tenantIds.length > 0
      ? supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'student')
          .in('tenant_id', tenantIds)
      : Promise.resolve({ count: 0 }),
    tenantIds.length > 0
      ? supabase
          .from('certificates')
          .select('id', { count: 'exact', head: true })
          .in('tenant_id', tenantIds)
      : Promise.resolve({ count: 0 }),
  ])

  // Fetch student counts per tenant for chart
  const tenantStudentCounts: { name: string; count: number }[] = []
  if (tenantIds.length > 0 && orgTenants) {
    const studentCountPromises = orgTenants.map(async (tenant) => {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('tenant_id', tenant.id)
      return { name: tenant.name, count: count ?? 0 }
    })
    const results = await Promise.all(studentCountPromises)
    tenantStudentCounts.push(...results.filter(r => r.count > 0))
    tenantStudentCounts.sort((a, b) => b.count - a.count)
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Administrador'
  const totalStudents = studentsRes.count ?? 0
  const today = formatDatePtBR(new Date())

  const quickLinks = [
    {
      title: 'Criar Curso',
      description: 'Adicione um novo curso à plataforma',
      href: '/admin/cursos/novo',
      icon: Plus,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Gerenciar Tenants',
      description: 'Administre as instituições parceiras',
      href: '/admin/tenants',
      icon: Building2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Ver Relatórios',
      description: 'Acompanhe métricas e desempenho',
      href: '/admin/relatorios',
      icon: BarChart3,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          Olá, {userName}!
        </h1>
        <p className="text-muted-foreground mt-1">{today}</p>
        <p className="text-sm text-muted-foreground">{organization.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Cursos" value={coursesRes.count ?? 0} icon={BookOpen} />
        <StatsCard title="Tenants Ativos" value={tenantsRes.count ?? 0} icon={Building2} />
        <StatsCard title="Alunos" value={totalStudents} icon={Users} description="Total geral" />
        <StatsCard title="Certificados" value={certsRes.count ?? 0} icon={Award} description="Emitidos" />
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-all"
            >
              <div className={`p-3 rounded-lg ${link.bg}`}>
                <link.icon className={`h-5 w-5 ${link.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{link.title}</p>
                <p className="text-xs text-muted-foreground">{link.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Visão Geral</h2>
        <DashboardCharts
          tenantStudentCounts={tenantStudentCounts}
          totalStudents={totalStudents}
        />
      </div>
    </div>
  )
}
