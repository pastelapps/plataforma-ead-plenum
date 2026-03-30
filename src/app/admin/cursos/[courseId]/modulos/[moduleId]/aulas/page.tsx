import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Video, FileText, File } from 'lucide-react'

interface Props { params: Promise<{ courseId: string; moduleId: string }> }

export default async function AulasPage({ params }: Props) {
  const { courseId, moduleId } = await params
  await requireOrgAdmin()
  const supabase = await createServerComponentClient()

  const { data: module } = await supabase
    .from('modules')
    .select('id, title, course_id, lessons(id, title, slug, position, content_type, video_status, is_free_preview, is_required)')
    .eq('id', moduleId)
    .single()

  if (!module) notFound()

  const lessons = (module.lessons ?? []).sort((a: any, b: any) => a.position - b.position)
  const iconMap: Record<string, any> = { video: Video, text: FileText, pdf: File }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/admin/cursos/${courseId}/modulos`} className="text-sm text-blue-600 hover:underline">← Módulos</Link>
          <h1 className="text-2xl font-bold mt-1">Aulas - {module.title}</h1>
        </div>
        <Link href={`/admin/cursos/${courseId}/modulos/${moduleId}/aulas/nova`}>
          <Button><Plus className="h-4 w-4 mr-2" />Nova Aula</Button>
        </Link>
      </div>

      {lessons.length === 0 ? (
        <p className="text-gray-500">Nenhuma aula criada.</p>
      ) : (
        <div className="bg-white rounded-lg border divide-y">
          {lessons.map((lesson: any, index: number) => {
            const Icon = iconMap[lesson.content_type] ?? FileText
            return (
              <div key={lesson.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-6">{index + 1}</span>
                  <Icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <div className="flex gap-2 mt-1">
                      {lesson.is_free_preview && <Badge variant="outline" className="text-xs">Preview</Badge>}
                      {!lesson.is_required && <Badge variant="secondary" className="text-xs">Opcional</Badge>}
                      {lesson.content_type === 'video' && lesson.video_status && (
                        <Badge variant={lesson.video_status === 'ready' ? 'default' : 'secondary'} className="text-xs">{lesson.video_status}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
