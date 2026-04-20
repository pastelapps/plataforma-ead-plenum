import { requireProfile } from '@/lib/auth/guards'
import { createServiceRoleClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Radio, Clock, Calendar, Video, User } from 'lucide-react'
import { format, isFuture, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LiveNowBanner } from '@/components/live/LiveNowBanner'

export default async function AoVivoPage() {
  const { profile } = await requireProfile()
  const supabase = createServiceRoleClient()

  // Get sessions where student is enrolled
  const { data: enrollments } = await (supabase
    .from('live_enrollments') as any)
    .select('live_session_id')
    .eq('profile_id', profile.id)

  const enrolledSessionIds = (enrollments ?? []).map((e: any) => e.live_session_id)

  if (enrolledSessionIds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--color-text)' }}>Ao Vivo</h1>
        <div className="text-center py-16">
          <Radio className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>Nenhuma sessao ao vivo disponivel</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Inscreva-se em uma live na pagina inicial para vê-la aqui.
          </p>
        </div>
      </div>
    )
  }

  // Fetch enrolled sessions (scheduled, live, or ended within last 30 days)
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString()

  const { data: sessions } = await (supabase
    .from('live_sessions') as any)
    .select('*')
    .in('id', enrolledSessionIds)
    .in('status', ['scheduled', 'live', 'ended'])
    .order('scheduled_start', { ascending: true })

  // Filter: exclude ended sessions older than 30 days
  const filteredSessions = (sessions ?? []).filter((s: any) => {
    if (s.status === 'ended') {
      return s.scheduled_end >= thirtyDaysAgo
    }
    return true
  })

  const liveSessions = filteredSessions.filter((s: any) => s.status === 'live')
  const upcomingSessions = filteredSessions.filter(
    (s: any) => s.status === 'scheduled' && isFuture(new Date(s.scheduled_end))
  )
  const pastSessions = filteredSessions.filter(
    (s: any) => s.status === 'ended'
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--color-text)' }}>Ao Vivo</h1>

      {/* Live Now Banner */}
      {liveSessions.length > 0 && (
        <section className="mb-8 space-y-3">
          {liveSessions.map((session: any) => (
            <LiveNowBanner
              key={session.id}
              sessionId={session.id}
              title={session.title}
              instructorName={session.instructor_name}
            />
          ))}
        </section>
      )}

      {/* Upcoming */}
      {upcomingSessions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Calendar className="h-5 w-5 text-blue-400" /> Proximas aulas
          </h2>
          <div className="space-y-3">
            {upcomingSessions.map((session: any) => (
              <Link key={session.id} href={`/ao-vivo/${session.id}`}>
                <Card
                  className="hover:opacity-80 transition-colors"
                  style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{session.title}</p>
                      {session.instructor_name && (
                        <p className="text-sm flex items-center gap-1 mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                          <User className="h-3 w-3" /> {session.instructor_name}
                        </p>
                      )}
                      <p className="text-sm flex items-center gap-1 mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(session.scheduled_start), "EEEE, dd/MM 'as' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-blue-400 border-blue-400/30">Agendada</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Past sessions */}
      {pastSessions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Video className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} /> Aulas anteriores
          </h2>
          <div className="space-y-3">
            {pastSessions.map((session: any) => (
              <Link key={session.id} href={`/ao-vivo/${session.id}`}>
                <Card
                  className="hover:opacity-80 transition-colors"
                  style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{session.title}</p>
                      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {format(new Date(session.scheduled_start), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    {session.recording_available ? (
                      <Badge variant="outline" className="text-green-400 border-green-400/30">Gravacao disponivel</Badge>
                    ) : (
                      <Badge variant="secondary">Encerrada</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {filteredSessions.length === 0 && (
        <div className="text-center py-16">
          <Radio className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>Nenhuma sessao ao vivo disponivel</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Inscreva-se em uma live na pagina inicial para vê-la aqui.
          </p>
        </div>
      )}
    </div>
  )
}
