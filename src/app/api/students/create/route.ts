import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const CreateStudentSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient()
  const body = await request.json()
  const parsed = CreateStudentSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { tenantId, email, password, fullName } = parsed.data

  // Verify tenant exists and get max_students
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, max_students')
    .eq('id', tenantId)
    .single()

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })
  }

  // Check vacancy limit
  if (tenant.max_students !== null) {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('role', 'student')

    if ((count ?? 0) >= tenant.max_students) {
      return NextResponse.json(
        { error: 'Limite de vagas atingido para este tenant' },
        { status: 403 }
      )
    }
  }

  // Check if user already exists
  const { data: existingUsers } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)

  let userId: string

  if (existingUsers && existingUsers.length > 0) {
    userId = existingUsers[0].id

    // Check if profile already exists for this tenant
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Este email já possui uma conta neste tenant' },
        { status: 409 }
      )
    }
  } else {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message ?? 'Erro ao criar usuário' },
        { status: 500 }
      )
    }

    userId = authData.user.id
  }

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      full_name: fullName,
      role: 'student',
      active: true,
    })

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, userId })
}
