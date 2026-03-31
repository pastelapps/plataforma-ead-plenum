import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CoursesGrid } from './courses-grid'

export default async function CoursesListPage() {
  const { organization } = await requireOrgAdmin()
  const supabase = await createServerComponentClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('*, modules(id, lessons(id))')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cursos</h1>
        <Link href="/admin/cursos/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Criar curso
          </Button>
        </Link>
      </div>
      <CoursesGrid courses={courses ?? []} />
    </div>
  )
}
