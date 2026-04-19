import { requireProfile } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { NetworkGrid } from './NetworkGrid'

export default async function NetworkPage() {
  const { profile, tenant } = await requireProfile()
  const supabase = await createServerComponentClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, department, role')
    .eq('tenant_id', tenant.id)
    .eq('role', 'student')
    .eq('active', true)
    .order('full_name', { ascending: true })

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Network</h1>
            <p className="text-white/50 mt-1">{(profiles ?? []).length} alunos conectados</p>
          </div>
        </div>

        <NetworkGrid profiles={(profiles ?? []) as any[]} currentProfileId={profile.id} />
      </div>
    </main>
  )
}
