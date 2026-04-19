import { requireProfile } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

interface Props { params: Promise<{ courseSlug: string }> }

export default async function CourseForumPage({ params }: Props) {
  const { courseSlug } = await params
  const { profile, tenant } = await requireProfile()
  const supabase = await createServerComponentClient()

  const { data: course } = await supabase.from('courses').select('id, title').eq('slug', courseSlug).single() as any
  if (!course) return <p>Curso não encontrado</p>

  const { data: posts } = await (supabase
    .from('forum_posts') as any)
    .select('*, profiles(full_name, avatar_url)')
    .eq('course_id', course.id)
    .eq('tenant_id', tenant.id)
    .eq('approved', true)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Fórum - {course.title}</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>Tire dúvidas e interaja com outros alunos</p>
        <div className="space-y-3">
          {posts?.map((post: any) => (
            <Link key={post.id} href={`/comunidade/${courseSlug}/${post.id}`} className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--color-border-default)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{post.profiles?.full_name ?? 'Anônimo'}</span>
                <span className="text-xs" style={{ color: 'var(--color-text-disabled)' }}>{new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
                {post.pinned && <span className="text-xs px-1 bg-yellow-100 rounded">Fixado</span>}
              </div>
              {post.title && <p className="font-semibold">{post.title}</p>}
              <p className="text-sm line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{post.content}</p>
            </Link>
          ))}
          {(!posts || posts.length === 0) && <p style={{ color: 'var(--color-text-secondary)' }}>Nenhuma postagem ainda. Seja o primeiro!</p>}
        </div>
    </div>
  )
}
