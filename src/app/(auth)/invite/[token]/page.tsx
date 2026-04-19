import { createServerComponentClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AcceptInviteClient } from './accept-invite-client'

interface Props {
  params: Promise<{ token: string }>
}

export default async function AcceptInvitePage({ params }: Props) {
  const { token } = await params
  const supabase = await createServerComponentClient()

  const { data: invitation } = await (supabase
    .from('invitations') as any)
    .select('*, tenants(name, slug)')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader><CardTitle>Convite inválido ou expirado</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Este convite não é mais válido. Solicite um novo convite ao administrador.</p></CardContent>
        </Card>
      </div>
    )
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader><CardTitle>Convite expirado</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Este convite expirou. Solicite um novo ao administrador.</p></CardContent>
        </Card>
      </div>
    )
  }

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <AcceptInviteClient
        token={token}
        tenantName={(invitation.tenants as any)?.name ?? ''}
        tenantSlug={(invitation.tenants as any)?.slug ?? ''}
        isLoggedIn={!!user}
        userId={user?.id}
      />
    </div>
  )
}
