import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { mux } from '@/lib/mux/client'
import { z } from 'zod'

const CreateSessionSchema = z.object({
  courseId: z.string().min(1).optional().nullable(),
  organizationId: z.string().min(1),
  title: z.string().min(1, 'Titulo e obrigatorio'),
  description: z.string().optional(),
  instructorName: z.string().optional(),
  scheduledStart: z.string(),
  scheduledEnd: z.string(),
  maxViewers: z.number().optional().nullable(),
})

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient()
  const body = await request.json()
  const parsed = CreateSessionSchema.safeParse(body)

  if (!parsed.success) {
    const msgs = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
    return NextResponse.json({ error: msgs }, { status: 400 })
  }

  const { courseId, organizationId, title, description, instructorName, scheduledStart, scheduledEnd, maxViewers } = parsed.data

  // Create Mux live stream
  let liveStream
  try {
    liveStream = await mux.video.liveStreams.create({
      playback_policy: ['public'],
      new_asset_settings: { playback_policy: ['public'] },
      latency_mode: 'low',
    })
  } catch (muxErr: any) {
    const msg = muxErr?.message ?? 'Erro ao criar stream no Mux'
    if (msg.includes('free plan') || msg.includes('unavailable')) {
      return NextResponse.json(
        { error: 'Live streams nao disponiveis no plano gratuito do Mux. Faca upgrade em dashboard.mux.com.' },
        { status: 402 }
      )
    }
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  // Insert session into database
  const { data: session, error } = await (supabase
    .from('live_sessions') as any)
    .insert({
      course_id: courseId ?? null,
      organization_id: organizationId,
      title,
      description: description ?? null,
      instructor_name: instructorName ?? null,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      max_viewers: maxViewers ?? null,
      status: 'scheduled',
      mux_live_stream_id: liveStream.id,
      mux_stream_key: liveStream.stream_key ?? null,
      mux_playback_id: liveStream.playback_ids?.[0]?.id ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ session })
}
