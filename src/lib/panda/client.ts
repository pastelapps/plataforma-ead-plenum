const PANDA_API_URL = process.env.PANDA_API_URL!
const PANDA_API_KEY = process.env.PANDA_API_KEY!

interface PandaVideoResponse {
  id: string
  title: string
  status: string
  folder_id: string
  video_player: string
}

export async function createPandaVideo(params: {
  title: string
  folderId: string
  description?: string
}): Promise<{ videoId: string; uploadUrl: string }> {
  const response = await fetch(`${PANDA_API_URL}/videos`, {
    method: 'POST',
    headers: {
      Authorization: PANDA_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: params.title,
      folder_id: params.folderId,
      description: params.description,
    }),
  })
  const data = await response.json()
  return { videoId: data.id, uploadUrl: data.upload_url }
}

export async function getPandaVideo(videoId: string): Promise<PandaVideoResponse> {
  const response = await fetch(`${PANDA_API_URL}/videos/${videoId}`, {
    headers: { Authorization: PANDA_API_KEY },
  })
  return response.json()
}

export async function createPandaFolder(name: string, parentId?: string): Promise<string> {
  const response = await fetch(`${PANDA_API_URL}/folders`, {
    method: 'POST',
    headers: {
      Authorization: PANDA_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      parent_folder_id: parentId ?? process.env.PANDA_FOLDER_ID,
    }),
  })
  const data = await response.json()
  return data.id
}

export async function deletePandaVideo(videoId: string): Promise<void> {
  await fetch(`${PANDA_API_URL}/videos/${videoId}`, {
    method: 'DELETE',
    headers: { Authorization: PANDA_API_KEY },
  })
}
