import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { NewLiveSessionForm } from './NewLiveSessionForm'

export default async function NewLiveSessionPage() {
  const { organization } = await requireOrgAdmin()
  const supabase = createServiceRoleClient()

  // Fetch all active courses for optional linking
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .eq('organization_id', organization.id)
    .eq('active', true)
    .order('title', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Nova Sessao ao Vivo</h1>
      <NewLiveSessionForm courses={courses ?? []} organizationId={organization.id} />
    </div>
  )
}
