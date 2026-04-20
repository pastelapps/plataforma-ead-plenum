import { requireAuth } from '@/lib/auth/guards'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, Phone, Building2, Briefcase, ArrowLeft, MessageCircle } from 'lucide-react'

interface Props { params: Promise<{ profileId: string }> }

const AVATAR_COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#10b981',
]

function getColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Link wa.me. Assume Brasil se nao tiver DDI.
function waLink(phone: string | null) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  const withCountry = digits.startsWith('55') ? digits : '55' + digits
  return `https://wa.me/${withCountry}`
}

export default async function AlunoProfilePage({ params }: Props) {
  const { profileId } = await params
  const user = await requireAuth()
  const supabase = createServiceRoleClient()

  // Busca o perfil alvo (sem RLS)
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id, tenant_id, user_id, full_name, avatar_url, department, job_title, phone, role')
    .eq('id', profileId)
    .single()

  if (!targetProfile) notFound()
  const target = targetProfile as any

  // Descobre a organizacao do tenant do target (para checar org admin)
  const { data: tenantData } = await supabase
    .from('tenants')
    .select('id, organization_id')
    .eq('id', target.tenant_id)
    .single()

  // Regras de acesso:
  // 1) Viewer tem perfil no mesmo tenant (aluno ve outro aluno)
  // 2) Viewer e org admin da organizacao do target (admin ve aluno)
  const [{ data: viewerProfile }, { data: viewerOrgAdmin }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('tenant_id', target.tenant_id)
      .eq('active', true)
      .limit(1)
      .maybeSingle(),
    tenantData
      ? supabase
          .from('organization_admins')
          .select('id')
          .eq('user_id', user.id)
          .eq('organization_id', (tenantData as any).organization_id)
          .eq('active', true)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const viewerIsSameTenant = !!viewerProfile
  const viewerIsOrgAdmin = !!viewerOrgAdmin

  if (!viewerIsSameTenant && !viewerIsOrgAdmin) {
    redirect('/unauthorized')
  }

  // Email via auth admin
  let email: string | null = null
  try {
    const { data } = await supabase.auth.admin.getUserById(target.user_id)
    email = data.user?.email ?? null
  } catch {
    // ignore
  }

  const isMe = viewerProfile && (viewerProfile as any).id === target.id
  const wa = waLink(target.phone)
  const roleLabel = target.role === 'admin_tenant' ? 'Administrador' : target.role === 'manager' ? 'Gerente' : 'Aluno'

  // Back link: admin vai pro dashboard, aluno vai pro network
  const backHref = viewerIsOrgAdmin && !viewerIsSameTenant ? '/admin' : '/network'
  const backLabel = viewerIsOrgAdmin && !viewerIsSameTenant ? 'Voltar ao admin' : 'Voltar'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm mb-6 opacity-70 hover:opacity-100 transition-opacity"
        style={{ color: 'var(--color-text-secondary, #9ca3af)' }}
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <Card style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div
              className="shrink-0 w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white overflow-hidden"
              style={{ backgroundColor: getColor(target.id) }}
            >
              {target.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={target.avatar_url} alt={target.full_name ?? ''} className="w-full h-full object-cover" />
              ) : (
                getInitials(target.full_name)
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {target.full_name ?? 'Sem nome'}
                </h1>
                {isMe && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">voce</span>
                )}
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted, #9ca3af)' }}>
                {roleLabel}
              </p>

              <div className="grid gap-3">
                {target.department && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary, #6b7280)' }}>
                    <Building2 className="h-4 w-4 opacity-60" />
                    <span>{target.department}</span>
                  </div>
                )}
                {target.job_title && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary, #6b7280)' }}>
                    <Briefcase className="h-4 w-4 opacity-60" />
                    <span>{target.job_title}</span>
                  </div>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-2 text-sm hover:underline"
                    style={{ color: 'var(--color-text-secondary, #6b7280)' }}
                  >
                    <Mail className="h-4 w-4 opacity-60" />
                    <span>{email}</span>
                  </a>
                )}
                {target.phone && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary, #6b7280)' }}>
                    <Phone className="h-4 w-4 opacity-60" />
                    <span>{target.phone}</span>
                  </div>
                )}
              </div>

              {!isMe && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Conversar no WhatsApp
                    </a>
                  )}
                  {email && (
                    <a
                      href={`mailto:${email}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
                      style={{
                        borderColor: 'var(--color-card-border)',
                        color: 'var(--color-text-secondary, #6b7280)',
                      }}
                    >
                      <Mail className="h-4 w-4" />
                      Enviar email
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
