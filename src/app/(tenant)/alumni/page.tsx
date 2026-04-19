import { requireProfile } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { AlumniTabs } from './AlumniTabs'

export default async function AlumniPage() {
  const { profile, tenant } = await requireProfile()
  const supabase = await createServerComponentClient()
  const profileId = profile.id

  // Fetch all students in the tenant
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, department, job_title, created_at')
    .eq('tenant_id', tenant.id)
    .eq('role', 'student')
    .eq('active', true)
    .order('full_name', { ascending: true })

  // Fetch past live sessions the user attended (enrolled)
  const { data: pastLiveEnrollments } = await (supabase
    .from('live_enrollments') as any)
    .select('id, enrolled_at, live_sessions ( id, title, scheduled_start, scheduled_end, status, courses ( title ) )')
    .eq('profile_id', profileId)

  // Upcoming live sessions user is enrolled in
  const { data: upcomingEnrolled } = await (supabase
    .from('live_enrollments') as any)
    .select('id, live_sessions ( id, title, scheduled_start, status, courses ( title ) )')
    .eq('profile_id', profileId)

  const events = (pastLiveEnrollments ?? [])
    .map((le: any) => le.live_sessions)
    .filter((s: any) => s && s.status === 'ended')
    .sort((a: any, b: any) => new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime())

  const upcoming = (upcomingEnrolled ?? [])
    .map((le: any) => le.live_sessions)
    .filter((s: any) => s && (s.status === 'scheduled' || s.status === 'live'))
    .sort((a: any, b: any) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Alumni</h1>
          <p className="text-white/50 mt-1">Sua comunidade de aprendizado</p>
        </div>

        <AlumniTabs
          members={(members ?? []) as any[]}
          events={events}
          upcoming={upcoming}
          currentProfileId={profileId}
        />
      </div>
    </main>
  )
}
