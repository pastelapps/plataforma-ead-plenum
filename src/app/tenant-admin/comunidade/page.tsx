import { requireAdminProfile } from '@/lib/auth/guards'
import { createServiceRoleClient } from '@/lib/supabase/server'

export default async function TenantComunidadePage() {
  const { tenant } = await requireAdminProfile()
  const supabase = createServiceRoleClient()

  const { data: posts } = await supabase
    .from('forum_posts')
    .select('*, profiles(full_name), courses(title)')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Moderação da Comunidade</h1>
      <div className="bg-white rounded-lg border divide-y">
        {posts?.map((post: any) => (
          <div key={post.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{post.title ?? 'Sem título'}</p>
                <p className="text-sm text-gray-500">{post.profiles?.full_name} · {post.courses?.title} · {new Date(post.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${post.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {post.approved ? 'Aprovado' : 'Pendente'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.content}</p>
          </div>
        ))}
        {(!posts || posts.length === 0) && <p className="p-4 text-gray-500">Nenhuma postagem para moderar.</p>}
      </div>
    </div>
  )
}
