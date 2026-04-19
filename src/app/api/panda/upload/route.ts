import { NextResponse } from 'next/server'

const PANDA_API_URL = process.env.PANDA_API_URL ?? 'https://api-v2.pandavideo.com.br'

// Returns Panda Video credentials + upload server for direct TUS upload from the browser.
export async function GET() {
  const PANDA_API_KEY = process.env.PANDA_API_KEY
  const PANDA_FOLDER_ID = process.env.PANDA_FOLDER_ID

  if (!PANDA_API_KEY) {
    return NextResponse.json({ error: 'Panda Video não configurado.' }, { status: 500 })
  }

  // Fetch available upload servers from Panda
  let uploadEndpoint = 'https://uploader-us01.pandavideo.com.br/files'
  try {
    const res = await fetch(`${PANDA_API_URL}/hosts/uploader`, {
      headers: { Authorization: PANDA_API_KEY },
    })
    if (res.ok) {
      const data = await res.json()
      const allHosts = Object.values(data.hosts as Record<string, string[]>)
        .reduce<string[]>((acc, curr) => [...acc, ...curr], [])
      if (allHosts.length > 0) {
        const host = allHosts[Math.floor(Math.random() * allHosts.length)]
        uploadEndpoint = `https://${host}.pandavideo.com.br/files`
      }
    }
  } catch {
    // fallback to default endpoint
  }

  return NextResponse.json({
    authorization: PANDA_API_KEY,
    folderId: PANDA_FOLDER_ID || null,
    uploadEndpoint,
  })
}
