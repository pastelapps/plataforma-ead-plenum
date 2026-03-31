import { requireProfile } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

export default async function CommunityPage() {
  const { profile, tenant } = await requireProfile()
  const supabase = await createServerComponentClient()

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('tenant_courses(courses(id, title, slug))')
    .eq('profile_id', profile.id)
    .eq('status', 'active')

  const courses = enrollments?.map((e: any) => e.tenant_courses?.courses).filter(Boolean) ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Comunidade</h1>
        <div className="space-y-3">
          {courses.map((course: any) => (
            <Link key={course.id} href={`/comunidade/${course.slug}`} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--color-border-default)' }}>
              <MessageSquare className="h-6 w-6" style={{ color: 'var(--color-primary-500)' }} />
              <div><p className="font-semibold">{course.title}</p><p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Fórum do curso</p></div>
            </Link>
          ))}
          {courses.length === 0 && <p style={{ color: 'var(--color-text-secondary)' }}>Matricule-se em um curso para acessar a comunidade.</p>}
        </div>
    </div>
  )
}
