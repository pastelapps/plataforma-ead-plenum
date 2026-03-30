import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bucket = formData.get('bucket') as string | null
    const path = formData.get('path') as string | null

    if (!file || !bucket || !path) {
      return NextResponse.json({
        error: `Campos faltando: ${!file ? 'file ' : ''}${!bucket ? 'bucket ' : ''}${!path ? 'path' : ''}`.trim()
      }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande (max 10MB)' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const buffer = Buffer.from(await file.arrayBuffer())

    // Detectar content type - usar o do arquivo ou inferir pela extensao
    let contentType = file.type
    if (!contentType || contentType === 'application/octet-stream') {
      const ext = path.split('.').pop()?.toLowerCase()
      const mimeMap: Record<string, string> = {
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        svg: 'image/svg+xml', ico: 'image/x-icon', webp: 'image/webp',
        gif: 'image/gif', pdf: 'application/pdf',
      }
      contentType = mimeMap[ext ?? ''] ?? 'application/octet-stream'
    }

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType, upsert: true })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path)

    return NextResponse.json({ url: publicUrl.publicUrl })
  } catch (err: any) {
    console.error('Upload route error:', err)
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 })
  }
}
