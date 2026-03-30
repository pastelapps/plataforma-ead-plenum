'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function NovaAulaPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const moduleId = params.moduleId as string
  const [loading, setLoading] = useState(false)
  const [contentType, setContentType] = useState('video')
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [pandaVideoId, setPandaVideoId] = useState('')

  const handleCreateVideo = async (title: string) => {
    setUploadingVideo(true)
    const res = await fetch('/api/panda/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, courseSlug: courseId }),
    })
    const data = await res.json()
    setPandaVideoId(data.videoId)
    setUploadingVideo(false)
    if (data.uploadUrl) {
      toast.success('Vídeo criado no Panda. Use a URL de upload para enviar o vídeo.')
    }
    return data
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const supabase = createClient()
    const title = form.get('title') as string
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    let videoId = pandaVideoId
    if (contentType === 'video' && !videoId) {
      const data = await handleCreateVideo(title)
      videoId = data.videoId
    }

    const { error } = await supabase.from('lessons').insert({
      module_id: moduleId,
      title,
      slug,
      description: form.get('description') as string,
      content_type: contentType,
      panda_video_id: contentType === 'video' ? videoId : null,
      content_body: contentType === 'text' ? form.get('content_body') as string : null,
      is_free_preview: form.get('is_free_preview') === 'on',
      is_required: form.get('is_required') !== 'off',
      position: parseInt(form.get('position') as string) || 0,
    })

    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Aula criada!')
    router.push(`/admin/cursos/${courseId}/modulos/${moduleId}/aulas`)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Nova Aula</h1>
      <Card><CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Título</Label><Input name="title" required /></div>
          <div><Label>Descrição</Label><Textarea name="description" rows={3} /></div>
          <div>
            <Label>Tipo de conteúdo</Label>
            <select name="content_type" className="w-full border rounded-md p-2" value={contentType} onChange={e => setContentType(e.target.value)}>
              <option value="video">Vídeo</option>
              <option value="text">Texto</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          {contentType === 'text' && <div><Label>Conteúdo</Label><Textarea name="content_body" rows={8} /></div>}
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Posição</Label><Input name="position" type="number" defaultValue={0} /></div>
            <div className="flex items-end gap-2"><input type="checkbox" name="is_free_preview" id="preview" /><Label htmlFor="preview">Preview gratuito</Label></div>
            <div className="flex items-end gap-2"><input type="checkbox" name="is_required" id="required" defaultChecked /><Label htmlFor="required">Obrigatória</Label></div>
          </div>
          <Button type="submit" disabled={loading || uploadingVideo}>{loading ? 'Criando...' : uploadingVideo ? 'Criando vídeo...' : 'Criar Aula'}</Button>
        </form>
      </CardContent></Card>
    </div>
  )
}
