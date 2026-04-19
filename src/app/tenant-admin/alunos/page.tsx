import { requireAdminProfile } from '@/lib/auth/guards'
import { createServiceRoleClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, UserPlus, Users } from 'lucide-react'

export default async function AlunosPage() {
  const { tenant } = await requireAdminProfile()
  const supabase = createServiceRoleClient()

  const [{ data: profiles }, { count: studentCount }, { data: tenantData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('tenant_id', tenant.id).order('full_name'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('role', 'student'),
    supabase.from('tenants').select('max_students').eq('id', tenant.id).single(),
  ])

  const maxStudents = tenantData?.max_students ?? null
  const current = studentCount ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Alunos</h1>
        <div className="flex items-center gap-3">
          <Link href="/tenant-admin/alunos/convidar"><Button variant="outline"><Plus className="h-4 w-4 mr-2" />Convidar</Button></Link>
          <Link href="/tenant-admin/alunos/novo"><Button><UserPlus className="h-4 w-4 mr-2" />Criar Aluno</Button></Link>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border mb-6">
        <Users className="h-5 w-5 text-gray-400" />
        <p className="text-sm font-medium">
          {current}{maxStudents !== null ? ` de ${maxStudents}` : ''} vagas utilizadas
        </p>
        {maxStudents !== null && current >= maxStudents && (
          <Badge variant="destructive" className="ml-2">Limite atingido</Badge>
        )}
      </div>

      <div className="bg-white rounded-lg border divide-y">
        {profiles?.map(p => (
          <Link key={p.id} href={`/tenant-admin/alunos/${p.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
            <div>
              <p className="font-semibold">{p.full_name}</p>
              <p className="text-sm text-gray-500">{p.department ?? 'Sem departamento'} · {p.role}</p>
            </div>
            <Badge variant={p.active ? 'default' : 'secondary'}>{p.active ? 'Ativo' : 'Inativo'}</Badge>
          </Link>
        ))}
        {(!profiles || profiles.length === 0) && <p className="p-4 text-gray-500">Nenhum aluno cadastrado. Convide ou crie alunos para começar.</p>}
      </div>
    </div>
  )
}
