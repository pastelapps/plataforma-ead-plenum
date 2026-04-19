import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { mux } from '@/lib/mux/client'

interface Props { params: Promise<{ sessionId: string }> }

export async function GET(_request: NextRequest, { params }: Props) {
  const { sessionId } = await params
  const supabase = createServiceRoleClient()

  const { data: session } = await supabase
    .from('live_sessions' as any)
    .select('*')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
  }

  return NextResponse.json({ session })
}

export async function PATCH(request: NextRequest, { params }: Props) {
  const { sessionId } = await params
  const supabase = createServiceRoleClient()
  const body = await request.json()

  const { data: session, error } = await supabase
    .from('live_sessions' as any)
    .update(body)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ session })
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  const { sessionId } = await params
  const supabase = createServiceRoleClient()

  // Get session to find Mux stream ID
  const { data: session } = await supabase
    .from('live_sessions' as any)
    .select('mux_live_stream_id')
    .eq('id', sessionId)
    .single()

  if (session?.mux_live_stream_id) {
    try {
      await mux.video.liveStreams.delete(session.mux_live_stream_id)
    } catch {
      // Stream may already be deleted
    }
  }

  await supabase.from('live_sessions' as any).delete().eq('id', sessionId)

  return NextResponse.json({ success: true })
}
