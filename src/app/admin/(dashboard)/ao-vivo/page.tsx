import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServiceRoleClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Radio, Calendar, Clock, Copy, Video } from 'lucide-react'

export default async function AdminLiveDashboardPage() {
  const { organization } = await requireOrgAdmin()
  const supabase = createServiceRoleClient()

  // Fetch all live sessions for this org (both independent and course-linked)
  const { data: sessions } = await (supabase
    .from('live_sessions') as any)
    .select('*, courses ( id, title )')
    .eq('organization_id', organization.id)
    .order('scheduled_start', { ascending: false })

  const orgSessions = sessions ?? []

  const liveSessions = orgSessions.filter((s: any) => s.status === 'live')
  const scheduledSessions = orgSessions.filter((s: any) => s.status === 'scheduled')
  const endedSessions = orgSessions.filter((s: any) => s.status === 'ended')

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const statusBadge = (status: string) => {
    switch (status) {
      case 'live': return <Badge variant="destructive">AO VIVO</Badge>
      case 'scheduled': return <Badge variant="secondary">Agendada</Badge>
      case 'ended': return <Badge variant="outline">Encerrada</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Aulas ao Vivo</h1>
          <p className="text-gray-500">Dashboard de transmissoes ao vivo</p>
        </div>
        <Link href="/admin/ao-vivo/nova">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Sessao ao Vivo
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Radio className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{liveSessions.length}</p>
                <p className="text-sm text-gray-500">Ao vivo agora</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduledSessions.length}</p>
                <p className="text-sm text-gray-500">Agendadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Video className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{endedSessions.filter((s: any) => s.recording_available).length}</p>
                <p className="text-sm text-gray-500">Com gravacao</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{endedSessions.length}</p>
                <p className="text-sm text-gray-500">Encerradas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ao vivo agora */}
      {liveSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Ao Vivo Agora
          </h2>
          <div className="space-y-3">
            {liveSessions.map((s: any) => (
              <Card key={s.id} className="border-red-200 bg-red-50/50">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {statusBadge(s.status)}
                        <span className="font-semibold">{s.title}</span>
                      </div>
                      {s.courses?.title && <p className="text-sm text-gray-500">{s.courses.title}</p>}
                      {s.instructor_name && <p className="text-sm text-gray-500">{s.instructor_name}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        Inicio: {formatTime(s.actual_start || s.scheduled_start)}
                      </p>
                    </div>
                    <Link href={`/admin/ao-vivo/${s.id}`}>
                      <Button variant="outline" size="sm">Gerenciar</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Agendadas */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Proximas Sessoes</h2>
        {scheduledSessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Nenhuma sessao agendada
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {scheduledSessions.map((s: any) => (
              <Card key={s.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {statusBadge(s.status)}
                        <span className="font-semibold">{s.title}</span>
                      </div>
                      {(s.courses?.title || s.instructor_name) && (
                        <p className="text-sm text-gray-500">{s.courses?.title || s.instructor_name}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(s.scheduled_start)} as {formatTime(s.scheduled_start)} - {formatTime(s.scheduled_end)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.mux_stream_key && (
                        <div className="text-right mr-3">
                          <p className="text-[10px] text-gray-400 uppercase">Stream Key (OBS)</p>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {s.mux_stream_key.slice(0, 12)}...
                          </code>
                        </div>
                      )}
                      <Link href={`/admin/ao-vivo/${s.id}`}>
                        <Button variant="outline" size="sm">Detalhes</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Encerradas */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Sessoes Encerradas</h2>
        {endedSessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Nenhuma sessao encerrada
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {endedSessions.slice(0, 20).map((s: any) => (
              <Card key={s.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{s.title}</span>
                        {s.recording_available && (
                          <Badge variant="secondary" className="text-[10px]">Gravacao</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {formatDate(s.scheduled_start)}{s.courses?.title ? ` | ${s.courses.title}` : ''}{s.instructor_name ? ` | ${s.instructor_name}` : ''}
                      </p>
                    </div>
                    <Link href={`/admin/ao-vivo/${s.id}`}>
                      <Button variant="ghost" size="sm">Ver</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
