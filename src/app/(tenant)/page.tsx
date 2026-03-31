import { requireProfile } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { getDesignAssets } from '@/lib/design-system/tokens'
import { CourseCard } from '@/components/course/CourseCard'
import { CourseCarousel } from '@/components/course/CourseCarousel'

export default async function StudentHomePage() {
  const { profile, tenant } = await requireProfile()
  const supabase = await createServerComponentClient()
  const assets = await getDesignAssets(tenant.id)

  // Fetch enrollments with progress and course data (including new fields)
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      tenant_courses (
        id,
        courses (
          id, title, slug, thumbnail_transparent_url, thumbnail_url,
          short_description, banner_vertical_url, fallback_color,
          instructor_name, category
        )
      )
    `)
    .eq('profile_id', profile.id)
    .eq('status', 'active')
    .order('last_accessed_at', { ascending: false })

  // Fetch ALL active tenant courses (for category carousels)
  const { data: allTenantCourses } = await supabase
    .from('tenant_courses')
    .select(`
      id,
      courses (
        id, title, slug, thumbnail_transparent_url, thumbnail_url,
        short_description, banner_vertical_url, fallback_color,
        instructor_name, category
      )
    `)
    .eq('tenant_id', tenant.id)
    .eq('active', true)

  // Build "Continue Assistindo" list: in-progress enrollments with 0 < progress < 100
  const continueWatching = (enrollments ?? []).filter(
    (e: any) => e.progress !== undefined && e.progress > 0 && e.progress < 100
  )

  // Build unique course list from all tenant courses for category grouping
  const allCourses = (allTenantCourses ?? [])
    .map((tc: any) => ({
      ...tc.courses,
      tenant_course_id: tc.id,
    }))
    .filter((c: any) => c && c.id)

  // Group courses by category
  const coursesByCategory: Record<string, typeof allCourses> = {}
  for (const course of allCourses) {
    const cat = course.category || 'Geral'
    if (!coursesByCategory[cat]) coursesByCategory[cat] = []
    coursesByCategory[cat].push(course)
  }

  const categoryEntries = Object.entries(coursesByCategory)

  // Hero background
  const heroHasImage = !!assets?.homepageHeroUrl
  const heroStyle: React.CSSProperties = heroHasImage
    ? {
        backgroundImage: `url(${assets!.homepageHeroUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: 'linear-gradient(135deg, var(--color-primary-500, #1ed6e4) 0%, #0a0a0a 100%)',
      }

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      {/* ============================================================ */}
      {/* Hero Section                                                  */}
      {/* ============================================================ */}
      <section
        className="relative w-full flex items-end"
        style={{
          ...heroStyle,
          minHeight: '80vh',
        }}
      >
        {/* Dark gradient overlay at bottom */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
          }}
        />

        {/* Hero text content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pb-16">
          <h1 className="text-[40px] font-bold text-white leading-tight mb-3">
            Bem-vindo, {profile.full_name}!
          </h1>
          <p className="text-lg text-white/70 max-w-xl">
            Explore nossos cursos e transforme sua carreira
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Continue Assistindo Section                                   */}
      {/* ============================================================ */}
      {continueWatching.length > 0 && (
        <div className="mt-10">
          <CourseCarousel title="Continue Assistindo">
            {continueWatching.map((enrollment: any) => {
              const course = enrollment.tenant_courses?.courses
              if (!course) return null
              return (
                <CourseCard
                  key={course.id}
                  variant="vertical"
                  course={course}
                  progress={enrollment.progress}
                  bannerVerticalUrl={course.banner_vertical_url}
                  fallbackColor={course.fallback_color}
                  instructorName={course.instructor_name}
                />
              )
            })}
          </CourseCarousel>
        </div>
      )}

      {/* ============================================================ */}
      {/* Course Sections by Category                                   */}
      {/* ============================================================ */}
      <div className={continueWatching.length > 0 ? 'mt-4' : 'mt-10'}>
        {categoryEntries.map(([category, courses]) => (
          <CourseCarousel key={category} title={category}>
            {courses.map((course: any) => (
              <CourseCard
                key={course.id}
                variant="vertical"
                course={course}
                bannerVerticalUrl={course.banner_vertical_url}
                fallbackColor={course.fallback_color}
                instructorName={course.instructor_name}
              />
            ))}
          </CourseCarousel>
        ))}
      </div>

      {/* Empty state if no courses at all */}
      {categoryEntries.length === 0 && continueWatching.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 px-4">
          <p className="text-2xl font-semibold text-white/60 mb-2">
            Nenhum curso disponivel ainda
          </p>
          <p className="text-base text-white/40">
            Em breve novos cursos serao adicionados.
          </p>
        </div>
      )}
    </main>
  )
}
