import { requireProfile } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { StudentHeader } from '@/components/layout/StudentHeader'

export default async function NotificacoesPage() {
  const { profile } = await requireProfile()
  const supabase = await createServerComponentClient()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <>
      <StudentHeader />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Notificações</h1>
        <div className="space-y-2">
          {notifications?.map((n: any) => (
            <div key={n.id} className={`p-4 rounded-lg border ${n.read ? 'opacity-60' : ''}`} style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-default)' }}>
              <p className="font-semibold text-sm">{n.title}</p>
              {n.body && <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{n.body}</p>}
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-disabled)' }}>{new Date(n.created_at).toLocaleString('pt-BR')}</p>
            </div>
          ))}
          {(!notifications || notifications.length === 0) && <p style={{ color: 'var(--color-text-secondary)' }}>Nenhuma notificação.</p>}
        </div>
      </main>
    </>
  )
}
