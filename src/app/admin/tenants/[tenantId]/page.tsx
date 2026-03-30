import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props { params: Promise<{ tenantId: string }> }

export default async function TenantDetailPage({ params }: Props) {
  const { tenantId } = await params
  await requireOrgAdmin()
  const supabase = await createServerComponentClient()

  const { data: tenant } = await supabase.from('tenants').select('*').eq('id', tenantId).single()
  if (!tenant) notFound()

  const [{ count: profileCount }, { count: courseCount }] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('tenant_courses').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/tenants" className="text-sm text-blue-600 hover:underline">← Tenants</Link>
          <h1 className="text-2xl font-bold mt-1">{tenant.name}</h1>
        </div>
        <Badge variant={tenant.active ? 'default' : 'secondary'}>{tenant.active ? 'Ativo' : 'Inativo'}</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Informações</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Slug:</strong> {tenant.slug}</p>
            <p><strong>Domínio:</strong> {tenant.custom_domain ?? 'Não configurado'}</p>
            <p><strong>Auto-registro:</strong> {tenant.allow_self_registration ? 'Sim' : 'Não'}</p>
            <p><strong>Threshold:</strong> {tenant.completion_threshold}%</p>
            <p><strong>Contrato:</strong> {tenant.contract_start ?? '—'} a {tenant.contract_end ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Estatísticas</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Perfis:</strong> {profileCount ?? 0}</p>
            <p><strong>Cursos contratados:</strong> {courseCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4">
        <Link href={`/admin/tenants/${tenantId}/contratos`}><Button variant="outline">Gerenciar Contratos</Button></Link>
      </div>
    </div>
  )
}
