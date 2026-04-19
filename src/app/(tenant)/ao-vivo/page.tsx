import { requireProfile } from '@/lib/auth/guards'
import { createServiceRoleClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Radio, Clock, Calendar, Video, User } from 'lucide-react'
import { format, isPast, isFuture } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function AoVivoPage() {
  const { profile, tenant } = await requireProfile()
  const supabase = createServiceRoleClient()

  // Get tenant's org to find org-level sessions
  const { data: tenantData } = await supabase
    .from('tenants')
    .select('organization_id')
    .eq('id', tenant.id)
    .single()

  const orgId = (tenantData as any)?.organization_id

  // Get course-linked sessions (via tenant_courses)
  const { data: tenantCourses } = await supabase
    .from('tenant_courses')
    .select('course_id')
    .eq('tenant_id', tenant.id)

  const courseIds = (tenantCourses ?? []).map((tc: any) => tc.course_id)

  // Fetch both: org-level independent sessions + course-linked sessions
  let sessions: any[] = []

  // Org-level sessions (independent, no course_id)
  if (orgId) {
    const { data: orgSessions } = await (supabase
      .from('live_sessions') as any)
      .select('*')
      .eq('organization_id', orgId)
      .is('course_id', null)
      .in('status', ['scheduled', 'live', 'ended'])
      .order('scheduled_start', { ascending: true })

    sessions = orgSessions ?? []
  }

  // Course-linked sessions
  if (courseIds.length > 0) {
    const { data: courseSessions } = await (supabase
      .from('live_sessions') as any)
      .select('*, courses(title)')
      .in('course_id', courseIds)
      .in('status', ['scheduled', 'live', 'ended'])
      .order('scheduled_start', { ascending: true })

    sessions = [...sessions, ...(courseSessions ?? [])]
  }

  // Sort by scheduled_start
  sessions.sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())

  const liveSessions = sessions.filter(s => s.status === 'live')
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled' && isFuture(new Date(s.scheduled_end)))
  const pastSessions = sessions.filter(s => s.status === 'ended' || (s.status === 'scheduled' && isPast(new Date(s.scheduled_end))))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--color-text)' }}>Ao Vivo</h1>

      {/* Live Now */}
      {liveSessions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Radio className="h-5 w-5 text-red-500 animate-pulse" /> Acontecendo agora
          </h2>
          <div className="space-y-3">
            {liveSessions.map(session => (
              <Link key={session.id} href={`/ao-vivo/${session.id}`}>
                <Card className="border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{session.title}</p>
                      {session.instructor_name && (
                        <p className="text-sm flex items-center gap-1 mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          <User className="h-3 w-3" /> {session.instructor_name}
                        </p>
                      )}
                    </div>
                    <Badge variant="destructive">AO VIVO</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcomingSessions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Calendar className="h-5 w-5 text-blue-400" /> Proximas sessoes
          </h2>
          <div className="space-y-3">
            {upcomingSessions.map(session => (
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

      {/* Past */}
      {pastSessions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Video className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} /> Sessoes anteriores
          </h2>
          <div className="space-y-3">
            {pastSessions.map(session => (
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

      {sessions.length === 0 && (
        <div className="text-center py-16">
          <Radio className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>Nenhuma sessao ao vivo disponivel</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Quando houver sessoes agendadas, elas aparecerao aqui.</p>
        </div>
      )}
    </div>
  )
}
