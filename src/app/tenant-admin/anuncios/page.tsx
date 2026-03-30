import { requireRole } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

export default async function AnunciosPage() {
  const { tenant } = await requireRole('admin_tenant')
  const supabase = await createServerComponentClient()

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Anúncios</h1>
        <Link href="/tenant-admin/anuncios/novo"><Button><Plus className="h-4 w-4 mr-2" />Novo Anúncio</Button></Link>
      </div>
      <div className="bg-white rounded-lg border divide-y">
        {announcements?.map(a => (
          <div key={a.id} className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{a.title}</p>
              <div className="flex gap-2">
                {a.pinned && <Badge>Fixado</Badge>}
                <Badge variant={a.published ? 'default' : 'secondary'}>{a.published ? 'Publicado' : 'Rascunho'}</Badge>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.body}</p>
          </div>
        ))}
        {(!announcements || announcements.length === 0) && <p className="p-4 text-gray-500">Nenhum anúncio criado.</p>}
      </div>
    </div>
  )
}
