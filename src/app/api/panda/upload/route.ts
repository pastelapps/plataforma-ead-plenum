import { NextRequest, NextResponse } from 'next/server'

const PANDA_API_URL = process.env.PANDA_API_URL!
const PANDA_API_KEY = process.env.PANDA_API_KEY!
const PANDA_FOLDER_ID = process.env.PANDA_FOLDER_ID!

export async function POST(request: NextRequest) {
  const { title, description } = await request.json()

  if (!title) {
    return NextResponse.json({ error: 'Missing title' }, { status: 400 })
  }

  // 1. Criar vídeo no Panda
  const createRes = await fetch(`${PANDA_API_URL}/videos`, {
    method: 'POST',
    headers: {
      Authorization: PANDA_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      folder_id: PANDA_FOLDER_ID,
      description,
    }),
  })

  const video = await createRes.json()

  if (!video.id) {
    return NextResponse.json({ error: 'Failed to create video', details: video }, { status: 500 })
  }

  return NextResponse.json({
    videoId: video.id,
    libraryId: video.library_id,
    authorization: PANDA_API_KEY,
  })
}
