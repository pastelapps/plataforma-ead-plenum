import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'

interface Props { params: Promise<{ courseId: string }> }

export default async function ModulosPage({ params }: Props) {
  const { courseId } = await params
  await requireOrgAdmin()
  const supabase = await createServerComponentClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, modules(id, title, slug, position, lessons(id, title, position))')
    .eq('id', courseId)
    .single()

  if (!course) notFound()

  const modules = (course.modules ?? []).sort((a: any, b: any) => a.position - b.position)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/admin/cursos/${courseId}`} className="text-sm text-blue-600 hover:underline">← Voltar</Link>
          <h1 className="text-2xl font-bold mt-1">Módulos - {course.title}</h1>
        </div>
        <AddModuleButton courseId={courseId} nextPosition={modules.length} />
      </div>

      {modules.length === 0 ? (
        <p className="text-gray-500">Nenhum módulo criado. Clique em &quot;Novo Módulo&quot; para começar.</p>
      ) : (
        <div className="space-y-4">
          {modules.map((mod: any, index: number) => (
            <Card key={mod.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    <span className="text-gray-400 mr-2">{index + 1}.</span>
                    {mod.title}
                  </CardTitle>
                  <Link href={`/admin/cursos/${courseId}/modulos/${mod.id}/aulas`}>
                    <Button variant="outline" size="sm">Gerenciar Aulas</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  {(mod.lessons ?? []).length} aulas
                </p>
                <div className="mt-2 space-y-1">
                  {(mod.lessons ?? []).sort((a: any, b: any) => a.position - b.position).map((lesson: any) => (
                    <p key={lesson.id} className="text-sm text-gray-600 pl-4">• {lesson.title}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function AddModuleButton({ courseId, nextPosition }: { courseId: string; nextPosition: number }) {
  return (
    <form action={async (formData: FormData) => {
      'use server'
      const { createServiceRoleClient } = await import('@/lib/supabase/admin')
      const supabase = createServiceRoleClient()
      const title = formData.get('title') as string
      if (!title) return
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      await supabase.from('modules').insert({ course_id: courseId, title, slug, position: nextPosition })
    }}>
      <div className="flex gap-2">
        <input name="title" placeholder="Nome do módulo" className="border rounded px-3 py-2 text-sm" required />
        <Button type="submit" size="sm"><Plus className="h-4 w-4 mr-1" />Novo Módulo</Button>
      </div>
    </form>
  )
}
