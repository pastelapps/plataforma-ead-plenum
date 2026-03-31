import { requireProfile } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { PandaVideoPlayer } from '@/components/player/PandaVideoPlayer'
import { LessonControls } from '@/components/player/LessonControls'
import { LessonTabs } from '@/components/player/LessonTabs'
import { LessonSidebar } from '@/components/player/LessonSidebar'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Props {
  params: Promise<{ courseSlug: string; lessonSlug: string }>
}

export default async function LessonPage({ params }: Props) {
  const { courseSlug, lessonSlug } = await params
  const { profile, tenant } = await requireProfile()
  const supabase = await createServerComponentClient()

  // Fetch course with modules and lessons (including new fields)
  const { data: course } = await supabase
    .from('courses')
    .select(
      `id, title, slug,
       modules(
         id, title, slug, position,
         lessons(
           id, title, slug, position,
           panda_video_id, panda_video_url,
           content_type, content_body, attachment_url, description,
           thumbnail_url, video_duration_sec, estimated_duration_minutes,
           supplementary_materials
         )
       )`
    )
    .eq('slug', courseSlug)
    .single()

  if (!course) notFound()

  // Sort modules and flatten lessons
  const sortedModules = (course.modules ?? []).sort(
    (a: any, b: any) => a.position - b.position
  )

  const allLessons = sortedModules.flatMap((m: any) =>
    (m.lessons ?? [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((l: any) => ({
        ...l,
        moduleName: m.title,
        moduleSlug: m.slug,
        moduleId: m.id,
      }))
  )

  const currentIndex = allLessons.findIndex((l: any) => l.slug === lessonSlug)
  const lesson = allLessons[currentIndex]
  if (!lesson) notFound()

  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  // Find current module's lessons for the sidebar
  const currentModuleLessons = allLessons.filter(
    (l: any) => l.moduleId === lesson.moduleId
  )

  // Fetch enrollment and lesson progress
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, lesson_progress(id, lesson_id, completed)')
    .eq('profile_id', profile.id)
    .eq('course_id', course.id)
    .single()

  const completedSet = new Set(
    enrollment?.lesson_progress
      ?.filter((lp: any) => lp.completed)
      .map((lp: any) => lp.lesson_id) ?? []
  )

  const currentProgress = enrollment?.lesson_progress?.find(
    (lp: any) => lp.lesson_id === lesson.id
  )

  // Fetch reaction counts for current lesson
  const [{ count: likesCount }, { count: dislikesCount }] = await Promise.all([
    supabase
      .from('lesson_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('lesson_id', lesson.id)
      .eq('reaction_type', 'like'),
    supabase
      .from('lesson_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('lesson_id', lesson.id)
      .eq('reaction_type', 'dislike'),
  ])

  // Fetch user's own reaction
  const { data: userReaction } = await supabase
    .from('lesson_reactions')
    .select('reaction_type')
    .eq('lesson_id', lesson.id)
    .eq('profile_id', profile.id)
    .maybeSingle()

  // Fetch favorite status for this course
  const { data: favorite } = await supabase
    .from('favorites')
    .select('id')
    .eq('course_id', course.id)
    .eq('profile_id', profile.id)
    .maybeSingle()

  // Fetch forum posts for this lesson (comments and questions)
  const { data: forumPosts } = await supabase
    .from('forum_posts')
    .select('id, title, content, post_type, created_at, profile_id, profiles(full_name, avatar_url)')
    .eq('lesson_id', lesson.id)
    .eq('tenant_id', tenant.id)
    .in('post_type', ['comment', 'question'])
    .order('created_at', { ascending: false })
    .limit(100)

  // Parse supplementary materials
  const supplementaryMaterials: { name: string; url: string; type: string }[] =
    Array.isArray(lesson.supplementary_materials)
      ? lesson.supplementary_materials
      : []

  // Build sidebar lesson list
  const sidebarLessons = currentModuleLessons.map((l: any) => ({
    id: l.id,
    title: l.title,
    slug: l.slug,
    thumbnail_url: l.thumbnail_url,
    video_duration_sec: l.video_duration_sec,
    estimated_duration_minutes: l.estimated_duration_minutes,
    isCompleted: completedSet.has(l.id),
  }))

  // Breadcrumb link
  const backHref = lesson.moduleSlug
    ? `/cursos/${courseSlug}/modulos/${lesson.moduleSlug}`
    : `/cursos/${courseSlug}`

  return (
    <main className="flex flex-col lg:flex-row min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Main Column - 70% */}
      <div className="flex-1 lg:w-[70%] flex flex-col">
        {/* Breadcrumb */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#222]">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-[#9ca3af] hover:text-white transition-colors"
          >
            <ChevronLeft className="size-4" />
            Voltar para {lesson.moduleName}
          </Link>
        </div>

        {/* Video Player */}
        <div className="w-full">
          {lesson.panda_video_url ? (
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={lesson.panda_video_url}
                style={{ border: 'none', width: '100%', height: '100%' }}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : lesson.content_type === 'video' && lesson.panda_video_id && enrollment ? (
            <PandaVideoPlayer
              pandaVideoId={lesson.panda_video_id}
              enrollmentId={enrollment.id}
              lessonId={lesson.id}
            />
          ) : lesson.content_type === 'text' && lesson.content_body ? (
            <div className="px-4 sm:px-6 py-6">
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: lesson.content_body }}
              />
            </div>
          ) : lesson.content_type === 'pdf' && lesson.attachment_url ? (
            <div className="px-4 sm:px-6 py-6">
              <div className="p-6 rounded-lg bg-[#111] border border-[#222]">
                <a
                  href={lesson.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-primary-500,#1ed6e4)] underline hover:opacity-80"
                >
                  Baixar material (PDF)
                </a>
              </div>
            </div>
          ) : null}
        </div>

        {/* Content area below player */}
        <div className="px-4 sm:px-6 flex-1">
          {/* Lesson title */}
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-4">
            {lesson.title}
          </h1>

          {lesson.description && (
            <p className="text-sm text-[#9ca3af] mt-2 leading-relaxed">
              {lesson.description}
            </p>
          )}

          {/* Control bar */}
          {enrollment && (
            <LessonControls
              lessonId={lesson.id}
              enrollmentId={enrollment.id}
              courseSlug={courseSlug}
              profileId={profile.id}
              courseId={course.id}
              isCompleted={!!currentProgress?.completed}
              isFavorited={!!favorite}
              favoriteId={favorite?.id ?? null}
              prevLessonSlug={prevLesson?.slug ?? null}
              nextLessonSlug={nextLesson?.slug ?? null}
              prevLessonTitle={prevLesson?.title ?? null}
              nextLessonTitle={nextLesson?.title ?? null}
              likesCount={likesCount ?? 0}
              dislikesCount={dislikesCount ?? 0}
              userReaction={
                (userReaction?.reaction_type as 'like' | 'dislike') ?? null
              }
              progressId={currentProgress?.id ?? null}
            />
          )}

          {/* Tabs: Comments & Questions */}
          <LessonTabs
            lessonId={lesson.id}
            courseId={course.id}
            profileId={profile.id}
            tenantId={tenant.id}
            profileName={profile.full_name ?? ''}
            posts={(forumPosts as any[]) ?? []}
          />
        </div>
      </div>

      {/* Sidebar - 30% */}
      <LessonSidebar
        courseSlug={courseSlug}
        moduleName={lesson.moduleName}
        lessonCount={currentModuleLessons.length}
        lessons={sidebarLessons}
        currentLessonId={lesson.id}
        supplementaryMaterials={supplementaryMaterials}
      />
    </main>
  )
}
