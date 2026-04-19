import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerComponentClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { live_session_id, profile_id } = body

  if (!live_session_id || !profile_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Verify the profile belongs to the authenticated user
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, user_id')
    .eq('id', profile_id)
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await (supabase
    .from('live_enrollments') as any)
    .insert({ live_session_id, profile_id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ message: 'Already enrolled' }, { status: 200 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerComponentClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { live_session_id, profile_id } = body

  if (!live_session_id || !profile_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Verify the profile belongs to the authenticated user
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, user_id')
    .eq('id', profile_id)
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await (supabase
    .from('live_enrollments') as any)
    .delete()
    .eq('live_session_id', live_session_id)
    .eq('profile_id', profile_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
