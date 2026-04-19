import { NextRequest, NextResponse } from 'next/server'

const PANDA_API_URL = process.env.PANDA_API_URL ?? 'https://api-v2.pandavideo.com.br'
const PANDA_API_KEY = process.env.PANDA_API_KEY ?? ''

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId')
  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId' }, { status: 400 })
  }

  if (!PANDA_API_KEY) {
    return NextResponse.json({ error: 'Panda Video não configurado' }, { status: 500 })
  }

  const response = await fetch(`${PANDA_API_URL}/videos/${videoId}`, {
    headers: { Authorization: PANDA_API_KEY },
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'Video not found', status: 'ERROR' }, { status: 404 })
  }

  const video = await response.json()

  return NextResponse.json({
    id: video.id,
    status: video.status,
    video_external_id: video.video_external_id,
    video_player: video.video_player,
    playable: video.status === 'CONVERTED',
  })
}
