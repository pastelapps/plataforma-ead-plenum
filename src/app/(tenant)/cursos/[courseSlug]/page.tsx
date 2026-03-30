import { requireProfile } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { StudentHeader } from '@/components/layout/StudentHeader'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, PlayCircle, Circle } from 'lucide-react'

interface Props {
  params: Promise<{ courseSlug: string }>
}

export default async function CoursePage({ params }: Props) {
  const { courseSlug } = await params
  const { profile } = await requireProfile()
  const supabase = await createServerComponentClient()

  const { data: course } = await supabase
    .from('courses')
    .select(`*, modules(id, title, slug, position, lessons(id, title, slug, position, content_type, video_duration_sec, is_free_preview))`)
    .eq('slug', courseSlug)
    .eq('status', 'published')
    .single()

  if (!course) notFound()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, progress, lesson_progress(lesson_id, completed)')
    .eq('profile_id', profile.id)
    .single()

  const completedLessons = new Set(enrollment?.lesson_progress?.filter((lp: any) => lp.completed).map((lp: any) => lp.lesson_id) ?? [])

  const sortedModules = (course.modules ?? []).sort((a: any, b: any) => a.position - b.position)

  return (
    <>
      <StudentHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
          {course.instructor_name && <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Instrutor: {course.instructor_name}</p>}
          <div className="flex gap-4 mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <span>{course.level}</span>
            {course.duration_minutes && <span>{Math.round(course.duration_minutes / 60)}h de conteúdo</span>}
          </div>
          {enrollment && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1"><span>Progresso</span><span>{enrollment.progress}%</span></div>
              <div className="h-3 rounded-full" style={{ backgroundColor: 'var(--color-progress-track)' }}>
                <div className="h-3 rounded-full" style={{ width: `${enrollment.progress}%`, backgroundColor: 'var(--color-progress-fill)' }} />
              </div>
            </div>
          )}
        </div>

        {course.description && <p className="mb-8" style={{ color: 'var(--color-text-secondary)' }}>{course.description}</p>}

        <div className="space-y-4">
          {sortedModules.map((mod: any) => {
            const lessons = (mod.lessons ?? []).sort((a: any, b: any) => a.position - b.position)
            return (
              <div key={mod.id} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border-default)' }}>
                <div className="p-4 font-semibold" style={{ backgroundColor: 'var(--color-bg-surface)' }}>{mod.title} ({lessons.length} aulas)</div>
                <div className="divide-y" style={{ borderColor: 'var(--color-border-default)' }}>
                  {lessons.map((lesson: any) => {
                    const isCompleted = completedLessons.has(lesson.id)
                    return (
                      <Link key={lesson.id} href={`/cursos/${courseSlug}/aula/${lesson.slug}`} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
                        {isCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5" style={{ color: 'var(--color-text-disabled)' }} />}
                        <span className="flex-1">{lesson.title}</span>
                        {lesson.video_duration_sec && <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{Math.floor(lesson.video_duration_sec / 60)}:{(lesson.video_duration_sec % 60).toString().padStart(2, '0')}</span>}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </>
  )
}
