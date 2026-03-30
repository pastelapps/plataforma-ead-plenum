import { requireProfile } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { StudentHeader } from '@/components/layout/StudentHeader'
import { CourseGrid } from '@/components/course/CourseGrid'

export default async function CatalogPage() {
  const { profile, tenant } = await requireProfile()
  const supabase = await createServerComponentClient()

  const { data: tenantCourses } = await supabase
    .from('tenant_courses')
    .select('id, courses(id, title, slug, thumbnail_transparent_url, thumbnail_url, short_description, category, level)')
    .eq('tenant_id', tenant.id)
    .eq('active', true)

  const { data: favorites } = await supabase
    .from('favorites')
    .select('course_id')
    .eq('profile_id', profile.id)

  return (
    <>
      <StudentHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Catálogo de Cursos</h1>
        <CourseGrid title="" courses={tenantCourses ?? []} favorites={favorites ?? []} />
      </main>
    </>
  )
}
