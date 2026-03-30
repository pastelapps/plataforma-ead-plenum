import { requireProfile } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { StudentHeader } from '@/components/layout/StudentHeader'
import { PandaVideoPlayer } from '@/components/player/PandaVideoPlayer'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface Props {
  params: Promise<{ courseSlug: string; lessonSlug: string }>
}

export default async function LessonPage({ params }: Props) {
  const { courseSlug, lessonSlug } = await params
  const { profile } = await requireProfile()
  const supabase = await createServerComponentClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, modules(id, title, position, lessons(id, title, slug, position, panda_video_id, content_type, content_body, attachment_url, description))')
    .eq('slug', courseSlug)
    .single()

  if (!course) notFound()

  const allLessons = (course.modules ?? [])
    .sort((a: any, b: any) => a.position - b.position)
    .flatMap((m: any) => (m.lessons ?? []).sort((a: any, b: any) => a.position - b.position).map((l: any) => ({ ...l, moduleName: m.title })))

  const currentIndex = allLessons.findIndex((l: any) => l.slug === lessonSlug)
  const lesson = allLessons[currentIndex]
  if (!lesson) notFound()

  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('profile_id', profile.id)
    .single()

  return (
    <>
      <StudentHeader />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Link href={`/cursos/${courseSlug}`} className="inline-flex items-center gap-1 text-sm mb-4 hover:underline" style={{ color: 'var(--color-text-link)' }}>
          <ArrowLeft className="h-4 w-4" /> Voltar ao curso
        </Link>

        <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>{lesson.moduleName}</p>

        {lesson.content_type === 'video' && lesson.panda_video_id && enrollment && (
          <PandaVideoPlayer pandaVideoId={lesson.panda_video_id} enrollmentId={enrollment.id} lessonId={lesson.id} />
        )}

        {lesson.content_type === 'text' && lesson.content_body && (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content_body }} />
        )}

        {lesson.content_type === 'pdf' && lesson.attachment_url && (
          <div className="p-4 border rounded-lg">
            <a href={lesson.attachment_url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--color-text-link)' }}>
              Baixar material (PDF)
            </a>
          </div>
        )}

        {lesson.description && (
          <div className="mt-6">
            <h2 className="font-semibold mb-2">Sobre esta aula</h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>{lesson.description}</p>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
          {prevLesson ? (
            <Link href={`/cursos/${courseSlug}/aula/${prevLesson.slug}`} className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-link)' }}>
              <ArrowLeft className="h-4 w-4" /> {prevLesson.title}
            </Link>
          ) : <div />}
          {nextLesson && (
            <Link href={`/cursos/${courseSlug}/aula/${nextLesson.slug}`} className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-link)' }}>
              {nextLesson.title} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </main>
    </>
  )
}
