import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.text()

  // Verify webhook signature if secret is configured
  const webhookSecret = process.env.MUX_WEBHOOK_SECRET
  if (webhookSecret) {
    const signature = request.headers.get('mux-signature')
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }
    // For production, use proper HMAC verification
    // For now, basic presence check
  }

  const event = JSON.parse(body)
  const supabase = createServiceRoleClient()

  switch (event.type) {
    case 'video.live_stream.active': {
      // Stream went live
      const streamId = event.data.id
      await supabase
        .from('live_sessions' as any)
        .update({
          status: 'live',
          actual_start: new Date().toISOString(),
        })
        .eq('mux_live_stream_id', streamId)
      break
    }

    case 'video.live_stream.idle': {
      // Stream ended
      const streamId = event.data.id
      await supabase
        .from('live_sessions' as any)
        .update({
          status: 'ended',
          actual_end: new Date().toISOString(),
        })
        .eq('mux_live_stream_id', streamId)
      break
    }

    case 'video.asset.ready': {
      // Recording is ready
      const asset = event.data
      const playbackId = asset.playback_ids?.[0]?.id
      const liveStreamId = asset.live_stream_id

      if (liveStreamId && playbackId) {
        await supabase
          .from('live_sessions' as any)
          .update({
            mux_asset_id: asset.id,
            mux_recording_playback_id: playbackId,
            recording_available: false, // admin must enable manually
            recording_duration_sec: Math.round(asset.duration ?? 0),
          })
          .eq('mux_live_stream_id', liveStreamId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
