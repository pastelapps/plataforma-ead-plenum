import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient, createServiceRoleClient } from '@/lib/supabase/server'
import { mux } from '@/lib/mux/client'

const VALID_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['live'],
  live: ['ended'],
}

async function teardownMuxLiveStream(liveStreamId: string) {
  // 1) Complete: encerra a transmissao ativa (se houver) e finaliza o asset
  // 2) Disable: impede que o OBS volte a conectar com a mesma stream key
  // Falhas nao devem bloquear o encerramento no banco - apenas logamos.
  try {
    await mux.video.liveStreams.complete(liveStreamId)
  } catch (e: any) {
    console.warn('[mux.complete] falhou:', e?.message ?? e)
  }
  try {
    await mux.video.liveStreams.disable(liveStreamId)
  } catch (e: any) {
    console.warn('[mux.disable] falhou:', e?.message ?? e)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  const supabase = await createServerComponentClient()
  const serviceClient = createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: session } = await (serviceClient
    .from('live_sessions') as any)
    .select('id, status, organization_id, mux_live_stream_id')
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

  const allowed = VALID_TRANSITIONS[s.status] ?? []
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from '${s.status}' to '${newStatus}'` },
      { status: 400 }
    )
  }

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

  // Apos marcar como encerrada no banco, fecha o stream no Mux
  // (complete finaliza broadcast ativo e gera asset; disable bloqueia novas conexoes)
  if (newStatus === 'ended' && s.mux_live_stream_id) {
    await teardownMuxLiveStream(s.mux_live_stream_id)
  }

  return NextResponse.json(updated)
}
