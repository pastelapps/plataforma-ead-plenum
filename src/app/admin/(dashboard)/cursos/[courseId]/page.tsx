import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

  const isLive = course.modality === 'live'
  const sortedModules = (course.modules ?? []).sort((a: any, b: any) => a.position - b.position)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <Badge variant={isLive ? 'destructive' : 'secondary'}>
              {isLive ? 'Ao Vivo' : 'Gravado'}
            </Badge>
          </div>
          <p className="text-gray-500">Status: {course.status}</p>
        </div>
        <div className="flex gap-2">
          {isLive ? (
            <Link href={`/admin/cursos/${courseId}/sessoes`}><Button variant="outline">Sessões</Button></Link>
          ) : (
            <Link href={`/admin/cursos/${courseId}/modulos`}><Button variant="outline">Módulos</Button></Link>
          )}
          {course.status === 'draft' && <Link href={`/admin/cursos/${courseId}/publicar`}><Button>Publicar</Button></Link>}
        </div>
      </div>

      {isLive ? (
        <Card>
          <CardHeader><CardTitle>Sessões ao Vivo</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-500">
              Gerencie as sessões ao vivo deste curso.{' '}
              <Link href={`/admin/cursos/${courseId}/sessoes`} className="underline text-blue-600">
                Ver sessões
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  )
}
