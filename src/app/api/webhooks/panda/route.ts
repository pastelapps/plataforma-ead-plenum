import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

const WEBHOOK_SECRET = process.env.PANDA_WEBHOOK_SECRET ?? ''

export async function POST(request: NextRequest) {
  const body = await request.text()

  if (WEBHOOK_SECRET) {
    const signature = request.headers.get('x-panda-signature')
    if (!verifyPandaSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const event = JSON.parse(body)
  const supabase = createServiceRoleClient()

  const {
    event: eventType,
    payload: {
      video_id: pandaVideoId,
      metadata,
      progress_percent,
      watched_seconds,
    },
  } = event

  if (!metadata?.enrollment_id || !metadata?.lesson_id) {
    console.warn('Panda webhook: missing metadata', { pandaVideoId, eventType })
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
  }

  const { enrollment_id, lesson_id } = metadata

  const { data: lesson } = await supabase
    .from('lessons')
    .select('video_duration_sec')
    .eq('id', lesson_id)
    .single()

  switch (eventType) {
    case 'video.played':
    case 'video.progress': {
      const isCompleted = (progress_percent ?? 0) >= 90

      await supabase
        .from('lesson_progress')
        .upsert({
          enrollment_id,
          lesson_id,
          watched_seconds: watched_seconds ?? 0,
          total_seconds: lesson?.video_duration_sec ?? 0,
          percentage: progress_percent ?? 0,
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          last_watched_at: new Date().toISOString(),
        }, { onConflict: 'enrollment_id,lesson_id' })
      break
    }
    case 'video.completed': {
      await supabase
        .from('lesson_progress')
        .upsert({
          enrollment_id,
          lesson_id,
          watched_seconds: lesson?.video_duration_sec ?? watched_seconds ?? 0,
          total_seconds: lesson?.video_duration_sec ?? 0,
          percentage: 100,
          completed: true,
          completed_at: new Date().toISOString(),
          last_watched_at: new Date().toISOString(),
        }, { onConflict: 'enrollment_id,lesson_id' })
      break
    }
  }

  return NextResponse.json({ received: true })
}

function verifyPandaSignature(body: string, signature: string | null): boolean {
  if (!signature || !WEBHOOK_SECRET) return false
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
