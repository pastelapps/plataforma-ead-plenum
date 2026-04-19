import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Radio, Clock, Video } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props { params: Promise<{ courseId: string }> }

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  scheduled: { label: 'Agendada', variant: 'outline' },
  live: { label: 'Ao Vivo', variant: 'destructive' },
  ended: { label: 'Encerrada', variant: 'secondary' },
  cancelled: { label: 'Cancelada', variant: 'secondary' },
}

export default async function SessoesPage({ params }: Props) {
  const { courseId } = await params
  await requireOrgAdmin()
  const supabase = await createServerComponentClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, modality')
    .eq('id', courseId)
    .single()

  if (!course || course.modality !== 'live') notFound()

  const { data: sessions } = await (supabase
    .from('live_sessions') as any)
    .select('*')
    .eq('course_id', courseId)
    .order('scheduled_start', { ascending: true })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-gray-500">Sessões ao vivo</p>
        </div>
        <Link href={`/admin/cursos/${courseId}/sessoes/nova`}>
          <Button><Plus className="h-4 w-4 mr-2" />Nova Sessão</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {sessions?.map(session => {
          const statusInfo = STATUS_LABELS[session.status] ?? STATUS_LABELS.scheduled
          return (
            <Card key={session.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    {session.status === 'live' ? (
                      <Radio className="h-5 w-5 text-red-500 animate-pulse" />
                    ) : (
                      <Video className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{session.title}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(session.scheduled_start), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {session.recording_available && (
                    <Badge variant="outline" className="text-green-600 border-green-200">Gravação</Badge>
                  )}
                  {session.mux_recording_playback_id && !session.recording_available && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-200">Gravação pendente</Badge>
                  )}
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  {session.mux_stream_key && session.status === 'scheduled' && (
                    <div className="text-xs text-gray-400">
                      Key: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{session.mux_stream_key}</code>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {(!sessions || sessions.length === 0) && (
          <div className="text-center py-12 text-gray-400">
            <Radio className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Nenhuma sessão ao vivo</p>
            <p className="text-sm">Crie uma sessão para começar</p>
          </div>
        )}
      </div>
    </div>
  )
}
