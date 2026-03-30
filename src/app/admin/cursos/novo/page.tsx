'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function NewCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const supabase = createClient()

    const title = form.get('title') as string
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { data: org } = await supabase.from('organization_admins').select('organization_id').limit(1).single()

    const { error } = await supabase.from('courses').insert({
      organization_id: org?.organization_id,
      title,
      slug,
      description: form.get('description') as string,
      short_description: form.get('short_description') as string,
      category: form.get('category') as string,
      level: form.get('level') as string || 'beginner',
      instructor_name: form.get('instructor_name') as string,
    })

    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Curso criado!')
    router.push('/admin/cursos')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Novo Curso</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Título</Label><Input name="title" required /></div>
            <div><Label>Descrição curta</Label><Input name="short_description" maxLength={200} /></div>
            <div><Label>Descrição completa</Label><Textarea name="description" rows={4} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Categoria</Label><Input name="category" /></div>
              <div><Label>Nível</Label><select name="level" className="w-full border rounded-md p-2"><option value="beginner">Iniciante</option><option value="intermediate">Intermediário</option><option value="advanced">Avançado</option></select></div>
            </div>
            <div><Label>Instrutor</Label><Input name="instructor_name" /></div>
            <Button type="submit" disabled={loading}>{loading ? 'Criando...' : 'Criar Curso'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
