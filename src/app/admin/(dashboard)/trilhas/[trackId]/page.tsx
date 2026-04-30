import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TrackForm } from '../nova/TrackForm'

interface Props { params: Promise<{ trackId: string }> }

export default async function EditTrackPage({ params }: Props) {
  const { trackId } = await params
  const { organization } = await requireOrgAdmin()
  const supabase = await createServerComponentClient()

  const { data: track } = await (supabase
    .from('tracks') as any)
    .select('*, track_courses(course_id, position)')
    .eq('id', trackId)
    .eq('organization_id', organization.id)
    .single()

  if (!track) notFound()
  const t = track as any

  // Cursos disponiveis para associar
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, category, status')
    .eq('organization_id', organization.id)
    .eq('active', true)
    .order('title', { ascending: true })

  const selectedCourseIds: string[] = ((t.track_courses ?? []) as any[])
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((tc: any) => tc.course_id)

  return (
    <div>
      <Link
        href="/admin/trilhas"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <h1 className="text-2xl font-bold mb-6">Editar Trilha</h1>

      <TrackForm
        organizationId={organization.id}
        courses={(courses ?? []) as any[]}
        existing={{
          id: t.id,
          title: t.title,
          description: t.description,
          active: t.active ?? true,
          selectedCourseIds,
        }}
      />
    </div>
  )
}
