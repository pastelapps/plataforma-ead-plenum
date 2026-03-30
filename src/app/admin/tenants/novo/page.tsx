'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function NewTenantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const supabase = createClient()
    const name = form.get('name') as string
    const slug = (form.get('slug') as string) || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const { data: org } = await supabase.from('organization_admins').select('organization_id').limit(1).single()

    const { data: tenant, error } = await supabase.from('tenants').insert({ organization_id: org?.organization_id, name, slug }).select().single()

    if (error) { toast.error(error.message); setLoading(false); return }

    // Create default design tokens
    await supabase.from('design_tokens').insert([
      { tenant_id: tenant.id, mode: 'light' },
      { tenant_id: tenant.id, mode: 'dark' },
    ])
    await supabase.from('design_assets').insert({ tenant_id: tenant.id })

    toast.success('Tenant criado!')
    router.push('/admin/tenants')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Novo Tenant</h1>
      <Card><CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Nome</Label><Input name="name" required placeholder="Prefeitura de..." /></div>
          <div><Label>Slug</Label><Input name="slug" placeholder="prefeitura-nome" /></div>
          <div><Label>Domínio customizado (opcional)</Label><Input name="custom_domain" placeholder="ead.prefeitura.gov.br" /></div>
          <Button type="submit" disabled={loading}>{loading ? 'Criando...' : 'Criar Tenant'}</Button>
        </form>
      </CardContent></Card>
    </div>
  )
}
