'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function NovoAnuncioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const supabase = createClient()

    const { data: profile } = await supabase.from('profiles').select('id, tenant_id').limit(1).single()
    if (!profile) { toast.error('Perfil não encontrado'); setLoading(false); return }

    const { error } = await supabase.from('announcements').insert({
      tenant_id: profile.tenant_id,
      author_id: profile.id,
      title: form.get('title') as string,
      body: form.get('body') as string,
      priority: form.get('priority') as string || 'normal',
      pinned: form.get('pinned') === 'on',
      published: true,
    })

    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Anúncio criado!')
    router.push('/tenant-admin/anuncios')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Novo Anúncio</h1>
      <Card><CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Título</Label><Input name="title" required /></div>
          <div><Label>Conteúdo</Label><Textarea name="body" rows={6} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prioridade</Label>
              <select name="priority" className="w-full border rounded-md p-2">
                <option value="low">Baixa</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <input type="checkbox" name="pinned" id="pinned" />
              <Label htmlFor="pinned">Fixar no topo</Label>
            </div>
          </div>
          <Button type="submit" disabled={loading}>{loading ? 'Criando...' : 'Publicar Anúncio'}</Button>
        </form>
      </CardContent></Card>
    </div>
  )
}
