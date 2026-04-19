import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SessionActions } from './SessionActions'
import { ArrowLeft, Calendar, Clock, Radio, Video, Users } from 'lucide-react'

interface Props { params: Promise<{ sessionId: string }> }

export default async function SessionDetailPage({ params }: Props) {
  const { sessionId } = await params
  await requireOrgAdmin()
  const supabase = await createServerComponentClient()

  const { data: session } = await (supabase
    .from('live_sessions') as any)
    .select('*, courses ( id, title )')
    .eq('id', sessionId)
    .single()

  if (!session) notFound()

  const s = session as any
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const statusColor = s.status === 'live' ? 'destructive' : s.status === 'scheduled' ? 'secondary' : 'outline'
  const statusLabel = s.status === 'live' ? 'AO VIVO' : s.status === 'scheduled' ? 'Agendada' : 'Encerrada'

  // Count enrollments
  const { count: enrollmentCount } = await (supabase
    .from('live_enrollments') as any)
    .select('id', { count: 'exact', head: true })
    .eq('live_session_id', sessionId) as any

  return (
    <div>
      <Link href="/admin/ao-vivo" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" />
        Voltar ao dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{s.title}</h1>
            <Badge variant={statusColor as any}>{statusLabel}</Badge>
          </div>
          <p className="text-gray-500">{s.courses?.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informacoes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Data</span>
              <span className="text-sm font-medium">{formatDate(s.scheduled_start)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Horario</span>
              <span className="text-sm font-medium">{formatTime(s.scheduled_start)} - {formatTime(s.scheduled_end)}</span>
            </div>
            {s.actual_start && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Inicio real</span>
                <span className="text-sm font-medium">{formatTime(s.actual_start)}</span>
              </div>
            )}
            {s.actual_end && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Fim real</span>
                <span className="text-sm font-medium">{formatTime(s.actual_end)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Inscritos</span>
              <span className="text-sm font-medium flex items-center gap-1">
                <Users className="h-4 w-4" />
                {enrollmentCount ?? 0}
              </span>
            </div>
            {s.description && (
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">{s.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* OBS Config */}
        {(s.status === 'scheduled' || s.status === 'live') && s.mux_stream_key && (
          <SessionActions
            streamKey={s.mux_stream_key}
            playbackId={s.mux_playback_id}
            status={s.status}
            sessionId={s.id}
          />
        )}

        {/* Recording */}
        {s.status === 'ended' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Gravacao
              </CardTitle>
            </CardHeader>
            <CardContent>
              {s.recording_available ? (
                <div className="space-y-3">
                  <Badge variant="default" className="bg-green-600">Disponivel</Badge>
                  {s.recording_duration_sec && (
                    <p className="text-sm text-gray-500">
                      Duracao: {Math.floor(s.recording_duration_sec / 60)} minutos
                    </p>
                  )}
                  {s.mux_recording_playback_id && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase mb-1">Playback ID</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{s.mux_recording_playback_id}</code>
                    </div>
                  )}
                </div>
              ) : s.mux_asset_id ? (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Gravacao processada mas ainda nao liberada.</p>
                  <Badge variant="secondary">Aguardando liberacao</Badge>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhuma gravacao disponivel</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
