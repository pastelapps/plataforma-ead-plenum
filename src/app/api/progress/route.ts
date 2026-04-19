import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createServerComponentClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { enrollmentId, lessonId, watchedSeconds, totalSeconds, percentage } = body

  if (!enrollmentId || !lessonId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const completed = percentage >= 90
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('lesson_progress')
    .upsert(
      {
        enrollment_id: enrollmentId,
        lesson_id: lessonId,
        watched_seconds: Math.floor(watchedSeconds || 0),
        total_seconds: Math.floor(totalSeconds || 0),
        percentage: Math.min(Math.floor(percentage || 0), 100),
        completed,
        completed_at: completed ? now : null,
        last_watched_at: now,
      },
      { onConflict: 'enrollment_id,lesson_id' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, completed })
}
