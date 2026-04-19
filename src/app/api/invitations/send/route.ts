import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { getResend } from '@/lib/resend/client'
import { z } from 'zod'

const SendInvitationSchema = z.object({
  tenantId: z.string().uuid(),
  emails: z.array(z.string().email()).min(1).max(50),
  role: z.enum(['student', 'manager', 'admin_tenant']).default('student'),
})

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient()
  const body = await request.json()
  const parsed = SendInvitationSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { tenantId, emails, role } = parsed.data

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, slug')
    .eq('id', tenantId)
    .single()

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const results = []
  for (const email of emails) {
    const { data: invitation, error } = await supabase
      .from('invitations')
      .upsert({
        tenant_id: tenantId,
        email,
        role,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'tenant_id,email' })
      .select()
      .single()

    if (error) {
      results.push({ email, success: false, error: error.message })
      continue
    }

    const inviteUrl = `https://${tenant.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/invite/${invitation.token}`

    try {
      await getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: `Você foi convidado para ${tenant.name}`,
        html: `
          <h1>Você foi convidado!</h1>
          <p>Você foi convidado para acessar a plataforma de cursos de <strong>${tenant.name}</strong>.</p>
          <p>Clique no botão abaixo para criar sua conta com email e senha:</p>
          <p><a href="${inviteUrl}" style="background-color:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;">Criar conta e acessar</a></p>
          <p style="color:#9ca3af;font-size:12px;">Este convite expira em 7 dias. Você precisará criar uma senha ao aceitar.</p>
        `,
      })
      results.push({ email, success: true })
    } catch {
      results.push({ email, success: false, error: 'Failed to send email' })
    }
  }

  return NextResponse.json({ results })
}
