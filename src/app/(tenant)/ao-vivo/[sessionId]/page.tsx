import { requireProfile } from '@/lib/auth/guards'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Radio, Calendar, User } from 'lucide-react'
import { SessionViewer } from './SessionViewer'

interface Props { params: Promise<{ sessionId: string }> }

export default async function SessionPage({ params }: Props) {
  const { sessionId } = await params
  await requireProfile()
  const supabase = createServiceRoleClient()

  const { data: session } = await (supabase
    .from('live_sessions') as any)
    .select('*, courses(title)')
    .eq('id', sessionId)
    .single()

  if (!session) notFound()
  const s = session as any

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{s.title}</h1>
          {s.status === 'live' && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Radio className="h-3 w-3 animate-pulse" /> AO VIVO
            </Badge>
          )}
        </div>
        {s.instructor_name && (
          <p className="text-sm flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
            <User className="h-3.5 w-3.5" /> {s.instructor_name}
          </p>
        )}
        {s.courses?.title && (
          <p style={{ color: 'var(--color-text-secondary)' }}>{s.courses.title}</p>
        )}
        <p className="text-sm flex items-center gap-1 mt-1" style={{ color: 'var(--color-text-muted)' }}>
          <Calendar className="h-3.5 w-3.5" />
          {format(new Date(s.scheduled_start), "EEEE, dd 'de' MMMM 'as' HH:mm", { locale: ptBR })}
          {' - '}
          {format(new Date(s.scheduled_end), "HH:mm", { locale: ptBR })}
        </p>
        {s.description && (
          <p className="mt-3" style={{ color: 'var(--color-text-secondary)' }}>{s.description}</p>
        )}
      </div>

      <SessionViewer
        status={s.status}
        playbackId={s.mux_playback_id}
        recordingPlaybackId={s.mux_recording_playback_id}
        recordingAvailable={s.recording_available ?? false}
        scheduledStart={s.scheduled_start}
        title={s.title}
      />
    </div>
  )
}
