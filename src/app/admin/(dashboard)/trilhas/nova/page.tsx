import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { TrackForm } from './TrackForm'

export default async function NewTrackPage() {
  const { organization } = await requireOrgAdmin()
  const supabase = await createServerComponentClient()

  // Fetch all courses for this organization to allow association
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, category, status')
    .eq('organization_id', organization.id)
    .eq('active', true)
    .order('title', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Nova Trilha</h1>
      <TrackForm organizationId={organization.id} courses={courses ?? []} />
    </div>
  )
}
