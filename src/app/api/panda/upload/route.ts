import { NextRequest, NextResponse } from 'next/server'
import { createPandaVideo, createPandaFolder } from '@/lib/panda/client'

export async function POST(request: NextRequest) {
  const { title, courseSlug, description } = await request.json()

  if (!title) {
    return NextResponse.json({ error: 'Missing title' }, { status: 400 })
  }

  const folderId = courseSlug
    ? await createPandaFolder(courseSlug)
    : process.env.PANDA_FOLDER_ID!

  const { videoId, uploadUrl } = await createPandaVideo({
    title,
    folderId,
    description,
  })

  return NextResponse.json({ videoId, uploadUrl, folderId })
}
