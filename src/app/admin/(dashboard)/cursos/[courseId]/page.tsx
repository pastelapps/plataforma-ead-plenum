import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props { params: Promise<{ courseId: string }> }

export default async function CourseDetailPage({ params }: Props) {
  const { courseId } = await params
  await requireOrgAdmin()
  const supabase = await createServerComponentClient()

  const { data: course } = await supabase
    .from('courses')
    .select('*, modules(id, title, position, lessons(id, title, position))')
    .eq('id', courseId)
    .single()

  if (!course) notFound()

  const sortedModules = (course.modules ?? []).sort((a: any, b: any) => a.position - b.position)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-gray-500">Status: {course.status}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/cursos/${courseId}/modulos`}><Button variant="outline">Módulos</Button></Link>
          {course.status === 'draft' && <Link href={`/admin/cursos/${courseId}/publicar`}><Button>Publicar</Button></Link>}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Módulos ({sortedModules.length})</CardTitle></CardHeader>
        <CardContent>
          {sortedModules.length === 0 ? (
            <p className="text-gray-500">Nenhum módulo. <Link href={`/admin/cursos/${courseId}/modulos`} className="underline text-blue-600">Adicionar módulos</Link></p>
          ) : (
            <div className="space-y-2">
              {sortedModules.map((mod: any) => (
                <div key={mod.id} className="p-3 border rounded-lg">
                  <p className="font-semibold">{mod.title}</p>
                  <p className="text-sm text-gray-500">{(mod.lessons ?? []).length} aulas</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
