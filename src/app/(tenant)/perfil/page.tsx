'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StudentHeader } from '@/components/layout/StudentHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function PerfilPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
      setProfile(data)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const supabase = createClient()
    await supabase.from('profiles').update({
      full_name: form.get('full_name') as string,
      phone: form.get('phone') as string,
      department: form.get('department') as string,
      job_title: form.get('job_title') as string,
    }).eq('id', profile.id)
    toast.success('Perfil atualizado!')
    setLoading(false)
  }

  if (!profile) return <><StudentHeader /><main className="max-w-lg mx-auto px-4 py-8">Carregando...</main></>

  return (
    <>
      <StudentHeader />
      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div><Label>Nome completo</Label><Input name="full_name" defaultValue={profile.full_name} /></div>
              <div><Label>Telefone</Label><Input name="phone" defaultValue={profile.phone ?? ''} /></div>
              <div><Label>Departamento</Label><Input name="department" defaultValue={profile.department ?? ''} /></div>
              <div><Label>Cargo</Label><Input name="job_title" defaultValue={profile.job_title ?? ''} /></div>
              <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
