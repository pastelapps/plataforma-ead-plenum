import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AdminStudioViewer } from './AdminStudioViewer'

interface Props { params: Promise<{ sessionId: string }> }

export default async function StudioPage({ params }: Props) {
  const { sessionId } = await params
  const { user, organization } = await requireOrgAdmin()
  const supabase = createServiceRoleClient()

  const { data: session } = await (supabase
    .from('live_sessions') as any)
    .select('*')
    .eq('id', sessionId)
    .eq('organization_id', organization.id)
    .single()

  if (!session) notFound()
  const s = session as any

  // Get admin display name
  const { data: userData } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const adminName = (userData as any)?.full_name || user.email || 'Instrutor'

  return (
    <div>
      <Link
        href={`/admin/ao-vivo/${sessionId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar aos detalhes
      </Link>

      <AdminStudioViewer
        sessionId={s.id}
        title={s.title}
        instructorName={s.instructor_name ?? adminName}
        initialStatus={s.status}
        playbackId={s.mux_playback_id}
        streamKey={s.mux_stream_key}
        adminName={adminName}
      />
    </div>
  )
}
