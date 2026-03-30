import { NextRequest, NextResponse } from 'next/server'
import { getPandaVideo } from '@/lib/panda/client'

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId')
  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId' }, { status: 400 })
  }

  const video = await getPandaVideo(videoId)
  return NextResponse.json(video)
}
