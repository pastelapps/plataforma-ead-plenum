import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient, createServiceRoleClient } from '@/lib/supabase/server'

// Check if user is org admin for this session
async function isOrgAdminForSession(userId: string, sessionId: string) {
  const supabase = createServiceRoleClient()

  const { data: session } = await (supabase
    .from('live_sessions') as any)
    .select('organization_id')
    .eq('id', sessionId)
    .single()

  if (!session) return false

  const { data: orgAdmin } = await supabase
    .from('organization_admins')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', (session as any).organization_id)
    .eq('active', true)
    .limit(1)
    .single()

  return !!orgAdmin
}

export async function GET(request: NextRequest) {
  const supabase = await createServerComponentClient()
  const serviceClient = createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  // Check access: enrolled student OR org admin
  const isAdmin = await isOrgAdminForSession(user.id, sessionId)

  if (!isAdmin) {
    // Check enrollment for students
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    const profile = profileData as any
    if (!profile) {
      return NextResponse.json({ error: 'No profile' }, { status: 403 })
    }

    const { data: enrollment } = await (serviceClient
      .from('live_enrollments') as any)
      .select('id')
      .eq('live_session_id', sessionId)
      .eq('profile_id', profile.id)
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })
    }
  }

  // Fetch messages - simple query without joins (use sender_name directly)
  const { data: messages, error } = await (serviceClient
    .from('live_chat_messages') as any)
    .select('id, message, created_at, sender_name, is_instructor, profile_id')
    .eq('live_session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Chat GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Build profile map for messages that have profile_id
  const profileIds = [...new Set((messages ?? []).filter((m: any) => m.profile_id).map((m: any) => m.profile_id))]
  let profileMap: Record<string, any> = {}

  if (profileIds.length > 0) {
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', profileIds)

    if (profiles) {
      for (const p of profiles as any[]) {
        profileMap[p.id] = p
      }
    }
  }

  // Normalize response
  const normalized = (messages ?? []).map((m: any) => {
    const prof = m.profile_id ? profileMap[m.profile_id] : null
    return {
      id: m.id,
      message: m.message,
      created_at: m.created_at,
      is_instructor: m.is_instructor ?? false,
      sender_name: m.sender_name,
      profile: prof
        ? { id: prof.id, full_name: prof.full_name, avatar_url: prof.avatar_url }
        : null,
    }
  })

  return NextResponse.json(normalized)
}

export async function POST(request: NextRequest) {
  const supabase = await createServerComponentClient()
  const serviceClient = createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { session_id, profile_id, message } = body

  if (!session_id || !message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (typeof message !== 'string' || message.trim().length === 0 || message.length > 500) {
    return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
  }

  // Check if org admin
  const isAdmin = await isOrgAdminForSession(user.id, session_id)

  if (isAdmin) {
    // Admin: get their name
    const { data: userData } = await serviceClient
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const adminName = (userData as any)?.full_name || user.email || 'Instrutor'

    const { data, error } = await (serviceClient
      .from('live_chat_messages') as any)
      .insert({
        live_session_id: session_id,
        profile_id: null,
        message: message.trim(),
        sender_name: adminName,
        is_instructor: true,
      })
      .select('id, message, created_at, sender_name, is_instructor')
      .single()

    if (error) {
      console.error('Chat POST admin error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  }

  // Student flow
  if (!profile_id) {
    return NextResponse.json({ error: 'Missing profile_id' }, { status: 400 })
  }

  // Verify profile belongs to user
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, user_id, full_name')
    .eq('id', profile_id)
    .eq('user_id', user.id)
    .single()

  const profile = profileData as any
  if (!profile) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Verify enrollment
  const { data: enrollment } = await (serviceClient
    .from('live_enrollments') as any)
    .select('id')
    .eq('live_session_id', session_id)
    .eq('profile_id', profile_id)
    .single()

  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })
  }

  // Insert message
  const { data, error } = await (serviceClient
    .from('live_chat_messages') as any)
    .insert({
      live_session_id: session_id,
      profile_id,
      message: message.trim(),
      sender_name: profile.full_name,
      is_instructor: false,
    })
    .select('id, message, created_at, sender_name, is_instructor')
    .single()

  if (error) {
    console.error('Chat POST student error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
