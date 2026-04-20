import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient, createServiceRoleClient } from '@/lib/supabase/server'

const VALID_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['live'],
  live: ['ended'],
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  const supabase = await createServerComponentClient()
  const serviceClient = createServiceRoleClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify org admin
  const { data: session } = await (serviceClient
    .from('live_sessions') as any)
    .select('id, status, organization_id')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const s = session as any

  const { data: orgAdmin } = await serviceClient
    .from('organization_admins')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', s.organization_id)
    .eq('active', true)
    .limit(1)
    .single()

  if (!orgAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { status: newStatus } = body

  if (!newStatus) {
    return NextResponse.json({ error: 'Missing status' }, { status: 400 })
  }

  // Validate transition
  const allowed = VALID_TRANSITIONS[s.status] ?? []
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from '${s.status}' to '${newStatus}'` },
      { status: 400 }
    )
  }

  // Build update payload
  const update: Record<string, any> = { status: newStatus }

  if (newStatus === 'live' && s.status === 'scheduled') {
    update.actual_start = new Date().toISOString()
  }

  if (newStatus === 'ended') {
    update.actual_end = new Date().toISOString()
  }

  const { data: updated, error } = await (serviceClient
    .from('live_sessions') as any)
    .update(update)
    .eq('id', sessionId)
    .select('id, status, actual_start, actual_end')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(updated)
}
