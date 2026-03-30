import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

export default async function CoursesListPage() {
  const { organization } = await requireOrgAdmin()
  const supabase = await createServerComponentClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cursos</h1>
        <Link href="/admin/cursos/novo"><Button><Plus className="h-4 w-4 mr-2" />Novo Curso</Button></Link>
      </div>
      <div className="bg-white rounded-lg border divide-y">
        {courses?.map(course => (
          <Link key={course.id} href={`/admin/cursos/${course.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
            <div>
              <p className="font-semibold">{course.title}</p>
              <p className="text-sm text-gray-500">{course.category} · {course.level}</p>
            </div>
            <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>{course.status}</Badge>
          </Link>
        ))}
        {(!courses || courses.length === 0) && <p className="p-4 text-gray-500">Nenhum curso criado ainda.</p>}
      </div>
    </div>
  )
}
