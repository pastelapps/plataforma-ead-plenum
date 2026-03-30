import { requireProfile } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { StudentHeader } from '@/components/layout/StudentHeader'
import { CourseGrid } from '@/components/course/CourseGrid'

export default async function StudentHomePage() {
  const { profile, tenant } = await requireProfile()
  const supabase = await createServerComponentClient()

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      tenant_courses (
        courses (
          id, title, slug, thumbnail_transparent_url, thumbnail_url, short_description
        )
      )
    `)
    .eq('profile_id', profile.id)
    .eq('status', 'active')
    .order('last_accessed_at', { ascending: false })

  const { data: completed } = await supabase
    .from('enrollments')
    .select(`*, tenant_courses(courses(id, title, slug, thumbnail_transparent_url, thumbnail_url, short_description))`)
    .eq('profile_id', profile.id)
    .eq('status', 'completed')

  const enrolledTcIds = new Set([
    ...(enrollments?.map(e => e.tenant_course_id) ?? []),
    ...(completed?.map(e => e.tenant_course_id) ?? []),
  ])

  const { data: available } = await supabase
    .from('tenant_courses')
    .select('id, courses(id, title, slug, thumbnail_transparent_url, thumbnail_url, short_description)')
    .eq('tenant_id', tenant.id)
    .eq('active', true)

  const availableFiltered = available?.filter(tc => !enrolledTcIds.has(tc.id)) ?? []

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('published', true)
    .lte('starts_at', new Date().toISOString())
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(3)

  const { data: favorites } = await supabase
    .from('favorites')
    .select('course_id')
    .eq('profile_id', profile.id)

  return (
    <>
      <StudentHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>
          Olá, {profile.full_name}!
        </h1>

        {announcements && announcements.length > 0 && (
          <div className="mb-6 space-y-2">
            {announcements.map((a: any) => (
              <div key={a.id} className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-default)' }}>
                <p className="font-semibold">{a.title}</p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{a.body}</p>
              </div>
            ))}
          </div>
        )}

        <CourseGrid title="Meus Cursos" courses={enrollments ?? []} favorites={favorites ?? []} />
        <CourseGrid title="Concluídos" courses={completed ?? []} showCertBadge />
        <CourseGrid title="Disponíveis" courses={availableFiltered} showEnrollButton />
      </main>
    </>
  )
}
