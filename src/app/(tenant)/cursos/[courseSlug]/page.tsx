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
  Download,
  Award,
} from 'lucide-react'

interface Props {
  params: Promise<{ courseSlug: string }>
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function getModuleStatus(
  lessons: any[],
  completedLessons: Set<string>
): 'completed' | 'in_progress' | 'not_started' {
  if (lessons.length === 0) return 'not_started'
  const completedCount = lessons.filter((l) => completedLessons.has(l.id)).length
  if (completedCount === lessons.length) return 'completed'
  if (completedCount > 0) return 'in_progress'
  return 'not_started'
}

const statusConfig = {
  completed: { label: 'Concluido', bg: '#166534', text: '#22c55e' },
  in_progress: { label: 'Em andamento', bg: '#78350f', text: '#f59e0b' },
  not_started: { label: 'Nao iniciado', bg: '#374151', text: '#9ca3af' },
}

export default async function CoursePage({ params }: Props) {
  const { courseSlug } = await params
  const { profile, tenant } = await requireProfile()
  const supabase = await createServerComponentClient()

  // Fetch course with modules and lessons
  const { data: course } = await supabase
    .from('courses')
    .select(
      `
      *,
      banner_horizontal_url,
      fallback_color,
      short_description,
      modules(
        id, title, slug, position, description,
        lessons(
          id, title, slug, position, content_type,
          video_duration_sec, is_free_preview, estimated_duration_minutes
        )
      )
    `
    )
    .eq('slug', courseSlug)
    .eq('status', 'published')
    .single()

  if (!course) notFound()

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

  // Fetch certificate
  const { data: certificate } = await supabase
    .from('certificates')
    .select('id, pdf_url, verification_code')
    .eq('course_id', course.id)
    .eq('profile_id', profile.id)
    .maybeSingle()

  const completedLessons = new Set<string>(
    enrollment?.lesson_progress
      ?.filter((lp: any) => lp.completed)
      .map((lp: any) => lp.lesson_id) ?? []
  )

  const sortedModules = (course.modules ?? []).sort(
    (a: any, b: any) => a.position - b.position
  )

  const totalLessons = sortedModules.reduce(
    (sum: number, m: any) => sum + (m.lessons?.length ?? 0),
    0
  )
  const totalCompleted = sortedModules.reduce(
    (sum: number, m: any) =>
      sum + (m.lessons ?? []).filter((l: any) => completedLessons.has(l.id)).length,
    0
  )
  const progressPercent = enrollment
    ? Number(enrollment.progress)
    : totalLessons > 0
      ? Math.round((totalCompleted / totalLessons) * 100)
      : 0

  const heroBackground = course.banner_horizontal_url
    ? `url(${course.banner_horizontal_url})`
    : `linear-gradient(135deg, ${course.fallback_color || '#1e40af'} 0%, #0a0a0a 100%)`

  return (
    <main style={{ backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
      {/* ============================================================ */}
      {/* HERO BANNER SECTION */}
      {/* ============================================================ */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '400px',
          background: heroBackground,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        {/* Dark overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
          }}
        />

        {/* Content overlay */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '48px 24px',
            zIndex: 1,
          }}
        >
          {/* Breadcrumb */}
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              textDecoration: 'none',
              marginBottom: '16px',
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Voltar ao inicio
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
              Curso
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              color: '#ffffff',
              fontSize: '40px',
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: '12px',
              maxWidth: '800px',
            }}
          >
            {course.title}
          </h1>

          {/* Short description */}
          {(course.short_description || course.description) && (
            <p
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '16px',
                lineHeight: 1.5,
                marginBottom: '24px',
                maxWidth: '700px',
              }}
            >
              {course.short_description || course.description}
            </p>
          )}

          {/* Progress bar */}
          {enrollment && (
            <div style={{ marginBottom: '20px', maxWidth: '500px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                  {progressPercent}% concluido
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                  {totalCompleted}/{totalLessons} aulas
                </span>
              </div>
              <div
                style={{
                  height: '4px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    backgroundColor: 'var(--color-primary-500, #1ed6e4)',
                    borderRadius: '2px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Certificate button */}
          {enrollment && (
            <div>
              {progressPercent >= 100 && certificate?.pdf_url ? (
                <a
                  href={certificate.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    border: '1px solid rgba(255,255,255,0.6)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <Download style={{ width: 16, height: 16 }} />
                  Baixar certificado
                </a>
              ) : (
                <button
                  disabled
                  title={
                    progressPercent < 100
                      ? 'Conclua 100% do curso para emitir o certificado'
                      : 'Certificado sendo gerado...'
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: 'transparent',
                    cursor: 'not-allowed',
                  }}
                >
                  <Award style={{ width: 16, height: 16 }} />
                  Baixar certificado
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* MODULE TIMELINE SECTION */}
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
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '32px',
            }}
          >
            Conteudo do Curso
          </h2>

          {/* Timeline container */}
          <div style={{ position: 'relative' }}>
            {sortedModules.map((mod: any, moduleIndex: number) => {
              const lessons = (mod.lessons ?? []).sort(
                (a: any, b: any) => a.position - b.position
              )
              const status = getModuleStatus(lessons, completedLessons)
              const statusConf = statusConfig[status]
              const isLast = moduleIndex === sortedModules.length - 1

              return (
                <div
                  key={mod.id}
                  style={{
                    position: 'relative',
                    paddingLeft: '48px',
                    paddingBottom: isLast ? '0' : '32px',
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
                        backgroundColor: '#1f2937',
                      }}
                    />
                  )}

                  {/* Module number circle */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '2px',
                      top: '4px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor:
                        status === 'completed'
                          ? '#166534'
                          : status === 'in_progress'
                            ? '#78350f'
                            : '#1f2937',
                      border: `2px solid ${
                        status === 'completed'
                          ? '#22c55e'
                          : status === 'in_progress'
                            ? '#f59e0b'
                            : '#374151'
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      zIndex: 1,
                    }}
                  >
                    {status === 'completed' ? (
                      <CheckCircle
                        style={{ width: 16, height: 16, color: '#22c55e' }}
                      />
                    ) : (
                      moduleIndex + 1
                    )}
                  </div>

                  {/* Module card */}
                  <Link
                    href={`/cursos/${courseSlug}/modulos/${mod.slug}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div
                      style={{
                        backgroundColor: '#111111',
                        borderRadius: '12px',
                        padding: '20px 24px',
                        border: '1px solid #1f2937',
                        transition: 'background-color 0.2s',
                      }}
                      className="module-card-hover"
                    >
                      {/* Module header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '16px',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              marginBottom: '4px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <h3
                              style={{
                                color: '#ffffff',
                                fontSize: '18px',
                                fontWeight: 700,
                                margin: 0,
                              }}
                            >
                              {mod.title}
                            </h3>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 10px',
                                borderRadius: '9999px',
                                backgroundColor: statusConf.bg,
                                color: statusConf.text,
                                fontSize: '11px',
                                fontWeight: 600,
                              }}
                            >
                              {statusConf.label}
                            </span>
                          </div>
                          <span
                            style={{
                              color: '#9ca3af',
                              fontSize: '13px',
                            }}
                          >
                            {lessons.length} aula{lessons.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <ChevronRight
                          style={{ width: 20, height: 20, color: '#6b7280', flexShrink: 0 }}
                        />
                      </div>

                      {/* Lesson list */}
                      <div
                        style={{
                          borderTop: '1px solid #1f2937',
                          paddingTop: '12px',
                        }}
                      >
                        {lessons.map((lesson: any) => {
                          const isCompleted = completedLessons.has(lesson.id)
                          const durationText = lesson.video_duration_sec
                            ? formatDuration(lesson.video_duration_sec)
                            : lesson.estimated_duration_minutes
                              ? `${lesson.estimated_duration_minutes} min`
                              : null

                          return (
                            <div
                              key={lesson.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 0',
                              }}
                            >
                              {isCompleted ? (
                                <CheckCircle
                                  style={{
                                    width: 18,
                                    height: 18,
                                    color: '#22c55e',
                                    flexShrink: 0,
                                  }}
                                />
                              ) : (
                                <Circle
                                  style={{
                                    width: 18,
                                    height: 18,
                                    color: '#4b5563',
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                              <span
                                style={{
                                  color: isCompleted
                                    ? 'rgba(255,255,255,0.5)'
                                    : '#e5e7eb',
                                  fontSize: '14px',
                                  flex: 1,
                                }}
                              >
                                {lesson.title}
                              </span>
                              {durationText && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: '#6b7280',
                                    fontSize: '12px',
                                    flexShrink: 0,
                                  }}
                                >
                                  <Clock style={{ width: 12, height: 12 }} />
                                  {durationText}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
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
            .module-card-hover:hover {
              background-color: #1a1a1a !important;
            }
          `,
        }}
      />
    </main>
  )
}
