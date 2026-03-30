import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const { token, userId } = await request.json()
  const supabase = createServiceRoleClient()

  const { data: invitation, error } = await supabase
    .from('invitations')
    .select('*, tenants(name)')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (error || !invitation) {
    return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 })
  }

  if (new Date(invitation.expires_at) < new Date()) {
    await supabase.from('invitations').update({ status: 'expired' }).eq('id', invitation.id)
    return NextResponse.json({ error: 'Invitation expired' }, { status: 400 })
  }

  const { data: user } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .single()

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      tenant_id: invitation.tenant_id,
      full_name: invitation.full_name ?? user?.full_name ?? invitation.email.split('@')[0],
      role: invitation.role,
      active: true,
    }, { onConflict: 'user_id,tenant_id' })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  await supabase
    .from('invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  return NextResponse.json({ success: true, tenantSlug: invitation.tenants?.slug })
}
