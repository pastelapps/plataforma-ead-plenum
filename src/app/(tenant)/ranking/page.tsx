import { requireProfile } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { Trophy } from 'lucide-react'

export default async function RankingPage() {
  const { profile, tenant } = await requireProfile()
  const supabase = await createServerComponentClient()

  const { data: rankings } = await supabase
    .from('student_rankings' as any)
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('courses_completed', { ascending: false })

  const sortedRankings = (rankings ?? []).map((r: any, idx: number) => ({
    ...r,
    position: idx + 1,
  }))

  const getPositionStyle = (pos: number) => {
    if (pos === 1) return { bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.3)', icon: '#eab308' }
    if (pos === 2) return { bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', icon: '#94a3b8' }
    if (pos === 3) return { bg: 'rgba(180,83,9,0.1)', border: 'rgba(180,83,9,0.2)', icon: '#b45309' }
    return { bg: 'transparent', border: 'rgba(255,255,255,0.06)', icon: '' }
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="h-7 w-7 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold text-white">Ranking</h1>
            <p className="text-white/50 mt-1">Classificacao por cursos concluidos</p>
          </div>
        </div>

        {/* Table */}
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[60px_1fr_100px_100px] md:grid-cols-[60px_1fr_120px_120px_120px] gap-2 px-4 py-2 text-xs font-medium text-white/40 uppercase tracking-wide">
            <span>#</span>
            <span>Aluno</span>
            <span className="text-center">Concluidos</span>
            <span className="text-center hidden md:block">Em andamento</span>
            <span className="text-center">Total</span>
          </div>

          {sortedRankings.map((r: any) => {
            const isMe = r.profile_id === profile.id
            const ps = getPositionStyle(r.position)
            return (
              <div
                key={r.profile_id}
                className="grid grid-cols-[60px_1fr_100px_100px] md:grid-cols-[60px_1fr_120px_120px_120px] gap-2 px-4 py-3 rounded-xl items-center transition-colors"
                style={{
                  backgroundColor: isMe ? 'rgba(99,102,241,0.1)' : ps.bg,
                  border: `1px solid ${isMe ? 'rgba(99,102,241,0.3)' : ps.border}`,
                }}
              >
                {/* Position */}
                <div className="flex items-center justify-center">
                  {r.position <= 3 ? (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: ps.icon + '22', color: ps.icon }}
                    >
                      {r.position}
                    </div>
                  ) : (
                    <span className="text-white/50 text-sm font-medium">{r.position}</span>
                  )}
                </div>

                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    {(r.full_name ?? '?')[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {r.full_name ?? 'Sem nome'}
                      {isMe && <span className="text-primary-400 text-xs ml-1">(voce)</span>}
                    </p>
                    {r.department && (
                      <p className="text-xs text-white/30 truncate">{r.department}</p>
                    )}
                  </div>
                </div>

                {/* Completed */}
                <div className="text-center">
                  <span className="text-lg font-bold text-green-400">{r.courses_completed}</span>
                </div>

                {/* In progress */}
                <div className="text-center hidden md:block">
                  <span className="text-sm text-white/50">{r.courses_in_progress}</span>
                </div>

                {/* Total */}
                <div className="text-center">
                  <span className="text-sm text-white/50">{r.total_enrollments}</span>
                </div>
              </div>
            )
          })}
        </div>

        {sortedRankings.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/40 text-lg">Nenhum aluno no ranking ainda</p>
          </div>
        )}
      </div>
    </main>
  )
}
