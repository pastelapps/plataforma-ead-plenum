import { requireAdminProfile } from '@/lib/auth/guards'
import { createServiceRoleClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Eye } from 'lucide-react'

export default async function TenantCursosPage() {
  const { tenant } = await requireAdminProfile()
  const supabase = createServiceRoleClient()

  const { data: tenantCourses } = await supabase
    .from('tenant_courses')
    .select('*, courses(*)')
    .eq('tenant_id', tenant.id)

  const courses = tenantCourses?.map(tc => ({
    ...tc.courses,
    tenantCourseActive: tc.active,
  })) ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cursos</h1>
        <span className="text-sm text-gray-500">{courses.length} curso(s) disponível(is)</span>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nenhum curso atribuído a este tenant.</p>
          <p className="text-sm text-gray-400 mt-1">Solicite ao administrador central para ativar cursos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course: any) => (
            <div key={course.id} className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
              <div
                className="h-36 bg-cover bg-center"
                style={{
                  backgroundColor: course.fallback_color ?? '#1e40af',
                  backgroundImage: course.banner_horizontal_url ? `url(${course.banner_horizontal_url})` : undefined,
                }}
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm line-clamp-2">{course.title}</h3>
                  <Badge variant={course.tenantCourseActive ? 'default' : 'secondary'} className="shrink-0">
                    {course.tenantCourseActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{course.description ?? 'Sem descrição'}</p>
                <Link
                  href={`/tenant-admin/cursos/${course.id}`}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver detalhes
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
