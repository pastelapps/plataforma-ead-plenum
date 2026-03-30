import { requireRole } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

export default async function AlunosPage() {
  const { tenant } = await requireRole('admin_tenant')
  const supabase = await createServerComponentClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('full_name')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Alunos</h1>
        <Link href="/tenant-admin/alunos/convidar"><Button><Plus className="h-4 w-4 mr-2" />Convidar</Button></Link>
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
        {(!profiles || profiles.length === 0) && <p className="p-4 text-gray-500">Nenhum aluno cadastrado. Convide alunos para começar.</p>}
      </div>
    </div>
  )
}
