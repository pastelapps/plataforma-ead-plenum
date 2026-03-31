import { requireProfile } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  PlayCircle,
  Clock,
  ChevronRight,
} from 'lucide-react'

interface Props {
  params: Promise<{ courseSlug: string; moduleSlug: string }>
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export default async function ModulePage({ params }: Props) {
  const { courseSlug, moduleSlug } = await params
  const { profile, tenant } = await requireProfile()
  const supabase = await createServerComponentClient()

  // Fetch course by slug
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, banner_horizontal_url, fallback_color')
    .eq('slug', courseSlug)
    .eq('status', 'published')
    .single()

  if (!course) notFound()

  // Fetch the specific module with its lessons
  const { data: moduleData } = await supabase
    .from('modules')
    .select(
      `
      id, title, slug, description, position,
      lessons(
        id, title, slug, position, content_type,
        video_duration_sec, is_free_preview, estimated_duration_minutes,
        thumbnail_url
      )
    `
    )
    .eq('course_id', course.id)
    .eq('slug', moduleSlug)
    .eq('active', true)
    .single()

  if (!moduleData) notFound()

  // Fetch enrollment via tenant_courses
  const { data: tenantCourse } = await supabase
    .from('tenant_courses')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('course_id', course.id)
    .single()

  const { data: enrollment } = tenantCourse
    ? await supabase
        .from('enrollments')
        .select('id, progress, lesson_progress(lesson_id, completed)')
        .eq('profile_id', profile.id)
        .eq('tenant_course_id', tenantCourse.id)
        .single()
    : { data: null }

  const completedLessons = new Set<string>(
    enrollment?.lesson_progress
      ?.filter((lp: any) => lp.completed)
      .map((lp: any) => lp.lesson_id) ?? []
  )

  const sortedLessons = (moduleData.lessons ?? []).sort(
    (a: any, b: any) => a.position - b.position
  )

  const completedCount = sortedLessons.filter((l: any) =>
    completedLessons.has(l.id)
  ).length
  const hasStarted = completedCount > 0
  const allCompleted = completedCount === sortedLessons.length && sortedLessons.length > 0

  // Find the first uncompleted lesson, or fallback to the first lesson
  const firstUncompletedLesson = sortedLessons.find(
    (l: any) => !completedLessons.has(l.id)
  )
  const targetLesson = firstUncompletedLesson || sortedLessons[0]

  const headerBackground = course.banner_horizontal_url
    ? `linear-gradient(to bottom, rgba(0,0,0,0.7), #0a0a0a), url(${course.banner_horizontal_url})`
    : `linear-gradient(135deg, ${course.fallback_color || '#1e40af'} 0%, #0a0a0a 70%)`

  return (
    <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
      {/* ============================================================ */}
      {/* HEADER AREA */}
      {/* ============================================================ */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          background: headerBackground,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '48px 24px 56px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Back link */}
          <Link
            href={`/cursos/${courseSlug}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              textDecoration: 'none',
              marginBottom: '24px',
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Voltar ao curso
          </Link>

          {/* Badge */}
          <div style={{ marginBottom: '12px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 14px',
                border: '1px solid rgba(255,255,255,0.5)',
                borderRadius: '9999px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Modulo
            </span>
          </div>

          {/* Module title */}
          <h1
            style={{
              color: '#ffffff',
              fontSize: '32px',
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: '12px',
              maxWidth: '800px',
            }}
          >
            {moduleData.title}
          </h1>

          {/* Module description */}
          {moduleData.description && (
            <p
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '16px',
                lineHeight: 1.5,
                marginBottom: '24px',
                maxWidth: '700px',
              }}
            >
              {moduleData.description}
            </p>
          )}

          {/* Progress info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ color: '#9ca3af', fontSize: '14px' }}>
              {sortedLessons.length} aula{sortedLessons.length !== 1 ? 's' : ''}
            </span>
            {enrollment && (
              <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                {completedCount}/{sortedLessons.length} concluida{completedCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* CTA button */}
          {targetLesson && (
            <Link
              href={`/cursos/${courseSlug}/aula/${targetLesson.slug}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                backgroundColor: 'var(--color-btn-primary-bg, #1ed6e4)',
                color: '#000000',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                textDecoration: 'none',
                border: 'none',
                transition: 'opacity 0.2s',
              }}
            >
              <PlayCircle style={{ width: 18, height: 18 }} />
              {allCompleted
                ? 'Rever aulas'
                : hasStarted
                  ? 'Continuar'
                  : 'Comecar'}
            </Link>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* LESSON TIMELINE */}
      {/* ============================================================ */}
      <section
        style={{
          backgroundColor: '#0a0a0a',
          padding: '48px 24px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            style={{
              color: '#ffffff',
              fontSize: '20px',
              fontWeight: 700,
              marginBottom: '28px',
            }}
          >
            Aulas do Modulo
          </h2>

          {/* Timeline */}
          <div style={{ position: 'relative' }}>
            {sortedLessons.map((lesson: any, index: number) => {
              const isCompleted = completedLessons.has(lesson.id)
              const isCurrentTarget = targetLesson?.id === lesson.id && !allCompleted
              const isLast = index === sortedLessons.length - 1

              const durationText = lesson.video_duration_sec
                ? formatDuration(lesson.video_duration_sec)
                : lesson.estimated_duration_minutes
                  ? `${lesson.estimated_duration_minutes} min`
                  : null

              return (
                <div
                  key={lesson.id}
                  style={{
                    position: 'relative',
                    paddingLeft: '48px',
                    paddingBottom: isLast ? '0' : '8px',
                  }}
                >
                  {/* Vertical timeline line */}
                  {!isLast && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '15px',
                        top: '36px',
                        bottom: '0',
                        width: '2px',
                        backgroundColor: isCompleted ? '#166534' : '#1f2937',
                      }}
                    />
                  )}

                  {/* Timeline dot / icon */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '4px',
                      top: '12px',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle
                        style={{ width: 22, height: 22, color: '#22c55e' }}
                      />
                    ) : isCurrentTarget ? (
                      <PlayCircle
                        style={{
                          width: 22,
                          height: 22,
                          color: 'var(--color-primary-500, #1ed6e4)',
                        }}
                      />
                    ) : (
                      <Circle
                        style={{ width: 22, height: 22, color: '#4b5563' }}
                      />
                    )}
                  </div>

                  {/* Lesson card */}
                  <Link
                    href={`/cursos/${courseSlug}/aula/${lesson.slug}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        backgroundColor: '#111111',
                        borderRadius: '10px',
                        padding: '16px 20px',
                        border: isCurrentTarget
                          ? '1px solid var(--color-primary-500, #1ed6e4)'
                          : '1px solid #1f2937',
                        transition: 'background-color 0.2s',
                        marginBottom: '4px',
                      }}
                      className="lesson-card-hover"
                    >
                      {/* Play icon / thumbnail */}
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          backgroundColor: isCurrentTarget
                            ? 'rgba(30,214,228,0.1)'
                            : '#1a1a1a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <PlayCircle
                          style={{
                            width: 22,
                            height: 22,
                            color: isCurrentTarget
                              ? 'var(--color-primary-500, #1ed6e4)'
                              : isCompleted
                                ? '#22c55e'
                                : '#6b7280',
                          }}
                        />
                      </div>

                      {/* Lesson info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            color: isCompleted
                              ? 'rgba(255,255,255,0.5)'
                              : '#e5e7eb',
                            fontSize: '15px',
                            fontWeight: isCurrentTarget ? 600 : 400,
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {lesson.title}
                        </p>
                        {durationText && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#6b7280',
                              fontSize: '12px',
                              marginTop: '4px',
                            }}
                          >
                            <Clock style={{ width: 12, height: 12 }} />
                            {durationText}
                          </span>
                        )}
                      </div>

                      {/* Status icon */}
                      <div style={{ flexShrink: 0 }}>
                        {isCompleted ? (
                          <CheckCircle
                            style={{ width: 20, height: 20, color: '#22c55e' }}
                          />
                        ) : (
                          <Circle
                            style={{ width: 20, height: 20, color: '#374151' }}
                          />
                        )}
                      </div>

                      {/* Chevron */}
                      <ChevronRight
                        style={{
                          width: 18,
                          height: 18,
                          color: '#4b5563',
                          flexShrink: 0,
                        }}
                      />
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Hover styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .lesson-card-hover:hover {
              background-color: #1a1a1a !important;
            }
          `,
        }}
      />
    </main>
  )
}
