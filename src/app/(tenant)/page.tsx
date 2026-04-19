import { createServerComponentClient } from '@/lib/supabase/server'
import { getTenantFromHeaders } from '@/lib/tenant/resolver'
import { redirect } from 'next/navigation'
import { QuickAccessCards } from '@/components/home/QuickAccessCards'
import { LiveSessionsCarousel } from '@/components/home/LiveSessionsCarousel'

export default async function StudentHomePage() {
  // Single getUser + tenant resolution (no duplicate calls)
  const [supabase, tenant] = await Promise.all([
    createServerComponentClient(),
    getTenantFromHeaders(),
  ])

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check org admin + get profile in parallel
  const [{ data: orgAdmin }, { data: profile }] = await Promise.all([
    supabase
      .from('organization_admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('active', true)
      .limit(1)
      .single(),
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant.id)
      .eq('active', true)
      .single(),
  ])

  if (orgAdmin) redirect('/admin')
  if (!profile) redirect('/login?error=no-profile')
  const p = profile as any

  // All data queries in parallel
  const [
    { data: liveSessions },
    { data: liveEnrollments },
    { count: alumniCount },
    { count: coursesCount },
  ] = await Promise.all([
    (supabase.from('live_sessions') as any)
      .select('id, title, description, scheduled_start, scheduled_end, status, instructor_name, max_viewers')
      .in('status', ['scheduled', 'live'])
      .gte('scheduled_end', new Date().toISOString())
      .order('scheduled_start', { ascending: true })
      .limit(15),

    (supabase.from('live_enrollments') as any)
      .select('live_session_id')
      .eq('profile_id', p.id),

    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .eq('role', 'student')
      .eq('active', true),

    supabase
      .from('tenant_courses')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .eq('active', true),
  ])

  const enrolledSessionIds = new Set(
    (liveEnrollments ?? []).map((le: any) => le.live_session_id)
  )

  const tenantLiveSessions = (liveSessions ?? []).map((s: any) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    scheduled_start: s.scheduled_start,
    scheduled_end: s.scheduled_end,
    status: s.status,
    instructor_name: s.instructor_name,
    max_viewers: s.max_viewers,
    enrollment_count: 0,
    is_enrolled: enrolledSessionIds.has(s.id),
  }))

  const nextLive = tenantLiveSessions[0] ?? null

  return (
    <main className="min-h-screen">
      <section className="pt-8 pb-6 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
          Ola, {p.full_name}!
        </h1>
        <p className="text-base" style={{ color: 'var(--color-text-muted)' }}>
          Continue sua jornada de aprendizado
        </p>
      </section>

      <section className="px-4 md:px-8 lg:px-12 max-w-7xl mx-auto mb-10">
        <QuickAccessCards
          nextLiveTitle={nextLive?.title}
          nextLiveDate={
            nextLive
              ? new Date(nextLive.scheduled_start).toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : null
          }
          liveCount={tenantLiveSessions.length}
          alumniCount={alumniCount ?? 0}
          coursesCount={coursesCount ?? 0}
        />
      </section>

      <section className="max-w-7xl mx-auto">
        <LiveSessionsCarousel sessions={tenantLiveSessions} profileId={p.id} />
      </section>
    </main>
  )
}
