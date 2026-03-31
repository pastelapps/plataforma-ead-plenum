import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

export default async function TenantsListPage() {
  const { organization } = await requireOrgAdmin()
  const supabase = await createServerComponentClient()

  const { data: tenants } = await supabase
    .from('tenants')
    .select('*')
    .eq('organization_id', organization.id)
    .order('name')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tenants</h1>
        <Link href="/admin/tenants/novo"><Button><Plus className="h-4 w-4 mr-2" />Novo Tenant</Button></Link>
      </div>
      <div className="bg-white rounded-lg border divide-y">
        {tenants?.map(t => (
          <Link key={t.id} href={`/admin/tenants/${t.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
            <div>
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-gray-500">{t.slug}</p>
            </div>
            <Badge variant={t.active ? 'default' : 'secondary'}>{t.active ? 'Ativo' : 'Inativo'}</Badge>
          </Link>
        ))}
        {(!tenants || tenants.length === 0) && <p className="p-4 text-gray-500">Nenhum tenant criado.</p>}
      </div>
    </div>
  )
}
