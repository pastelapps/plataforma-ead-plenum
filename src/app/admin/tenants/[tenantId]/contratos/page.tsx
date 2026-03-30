'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function ContratosPage() {
  const { tenantId } = useParams()
  const [tenantCourses, setTenantCourses] = useState<any[]>([])
  const [allCourses, setAllCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [{ data: tc }, { data: courses }] = await Promise.all([
        supabase.from('tenant_courses').select('*, courses(id, title, status)').eq('tenant_id', tenantId as string),
        supabase.from('courses').select('id, title, status').eq('status', 'published'),
      ])
      setTenantCourses(tc ?? [])
      setAllCourses(courses ?? [])
      setLoading(false)
    }
    load()
  }, [tenantId])

  const addCourse = async (courseId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('tenant_courses').insert({ tenant_id: tenantId as string, course_id: courseId })
    if (error) { toast.error(error.message); return }
    toast.success('Curso adicionado!')
    window.location.reload()
  }

  const contractedIds = new Set(tenantCourses.map(tc => tc.courses?.id))
  const availableCourses = allCourses.filter(c => !contractedIds.has(c.id))

  if (loading) return <p>Carregando...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Contratos de Cursos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Cursos Contratados ({tenantCourses.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {tenantCourses.map(tc => (
              <div key={tc.id} className="flex items-center justify-between p-2 border rounded">
                <span>{tc.courses?.title}</span>
                <Badge variant={tc.active ? 'default' : 'secondary'}>{tc.active ? 'Ativo' : 'Inativo'}</Badge>
              </div>
            ))}
            {tenantCourses.length === 0 && <p className="text-gray-500">Nenhum curso contratado.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Cursos Disponíveis ({availableCourses.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {availableCourses.map(c => (
              <div key={c.id} className="flex items-center justify-between p-2 border rounded">
                <span>{c.title}</span>
                <Button size="sm" onClick={() => addCourse(c.id)}>Adicionar</Button>
              </div>
            ))}
            {availableCourses.length === 0 && <p className="text-gray-500">Todos os cursos já foram adicionados.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
