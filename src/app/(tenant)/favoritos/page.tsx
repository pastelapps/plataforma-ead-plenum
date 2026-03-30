import { requireProfile } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { StudentHeader } from '@/components/layout/StudentHeader'
import { CourseGrid } from '@/components/course/CourseGrid'

export default async function FavoritosPage() {
  const { profile } = await requireProfile()
  const supabase = await createServerComponentClient()

  const { data: favorites } = await supabase
    .from('favorites')
    .select('course_id, courses(id, title, slug, thumbnail_transparent_url, thumbnail_url, short_description)')
    .eq('profile_id', profile.id)

  const courses = favorites?.map((f: any) => f.courses).filter(Boolean) ?? []

  return (
    <>
      <StudentHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Meus Favoritos</h1>
        {courses.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>Você não tem cursos favoritos ainda. Clique no coração nos cards de cursos para adicionar.</p>
        ) : (
          <CourseGrid title="" courses={courses} favorites={favorites ?? []} />
        )}
      </main>
    </>
  )
}
