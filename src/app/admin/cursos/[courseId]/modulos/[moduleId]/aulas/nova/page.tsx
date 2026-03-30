'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Upload, CheckCircle, AlertCircle, Loader2, Video, FileText, File } from 'lucide-react'
import * as tus from 'tus-js-client'

type VideoStatus = 'idle' | 'creating' | 'uploading' | 'processing' | 'ready' | 'error'

export default function NovaAulaPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const moduleId = params.moduleId as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [contentType, setContentType] = useState('video')

  // Video upload state
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [pandaVideoId, setPandaVideoId] = useState('')
  const [videoStatus, setVideoStatus] = useState<VideoStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoError, setVideoError] = useState('')

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use MP4, WebM, MOV, AVI ou MKV.')
      return
    }

    // Validar tamanho (max 5GB)
    if (file.size > 5 * 1024 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5GB.')
      return
    }

    setVideoFile(file)
    setVideoError('')

    // Criar preview local
    const url = URL.createObjectURL(file)
    setVideoPreviewUrl(url)
  }, [])

  const uploadVideo = async (title: string): Promise<string | null> => {
    if (!videoFile) {
      toast.error('Selecione um vídeo primeiro')
      return null
    }

    // 1. Criar vídeo no Panda
    setVideoStatus('creating')
    const res = await fetch('/api/panda/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    const data = await res.json()

    if (!data.videoId) {
      setVideoStatus('error')
      setVideoError('Falha ao criar vídeo no Panda Video')
      return null
    }

    const videoId = data.videoId
    const libraryId = data.libraryId
    const authorization = data.authorization
    setPandaVideoId(videoId)

    // 2. Upload via TUS
    setVideoStatus('uploading')

    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(videoFile, {
        endpoint: 'https://uploader-us01.pandavideo.com.br/upload',
        retryDelays: [0, 3000, 5000, 10000, 20000],
        chunkSize: 5 * 1024 * 1024, // 5MB chunks
        metadata: {
          video_id: videoId,
          library_id: libraryId,
          filename: videoFile.name,
          filetype: videoFile.type,
        },
        headers: {
          Authorization: authorization,
        },
        onError(error) {
          console.error('Upload error:', error)
          setVideoStatus('error')
          setVideoError('Falha no upload: ' + error.message)
          reject(error)
        },
        onProgress(bytesUploaded, bytesTotal) {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100)
          setUploadProgress(percentage)
        },
        onSuccess() {
          setVideoStatus('processing')
          setUploadProgress(100)
          toast.success('Vídeo enviado! O Panda Video está processando.')

          // Poll status
          pollVideoStatus(videoId, authorization)
          resolve(videoId)
        },
      })

      upload.start()
    })
  }

  const pollVideoStatus = async (videoId: string, _auth: string) => {
    const checkStatus = async () => {
      const res = await fetch(`/api/panda/status?videoId=${videoId}`)
      const video = await res.json()

      if (video.status === 'CONVERTED' || video.playable) {
        setVideoStatus('ready')
        toast.success('Vídeo processado e pronto!')
        return
      }

      if (video.status === 'ERROR' || video.status === 'FAILED') {
        setVideoStatus('error')
        setVideoError('O Panda Video reportou erro no processamento')
        return
      }

      // Continuar polling
      setTimeout(checkStatus, 5000)
    }

    setTimeout(checkStatus, 5000)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const title = form.get('title') as string
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    let videoId = pandaVideoId

    // Se é vídeo e ainda não fez upload
    if (contentType === 'video') {
      if (!videoFile && !videoId) {
        toast.error('Selecione um vídeo para a aula')
        setLoading(false)
        return
      }

      if (!videoId) {
        const result = await uploadVideo(title)
        if (!result) {
          setLoading(false)
          return
        }
        videoId = result
      }
    }

    // Salvar no banco
    const supabase = createClient()
    const { error } = await supabase.from('lessons').insert({
      module_id: moduleId,
      title,
      slug,
      description: form.get('description') as string,
      content_type: contentType,
      panda_video_id: contentType === 'video' ? videoId : null,
      panda_folder_id: contentType === 'video' ? process.env.NEXT_PUBLIC_PANDA_FOLDER_ID : null,
      video_status: contentType === 'video' ? 'processing' : null,
      content_body: contentType === 'text' ? form.get('content_body') as string : null,
      is_free_preview: form.get('is_free_preview') === 'on',
      is_required: form.get('is_required') !== 'off',
      position: parseInt(form.get('position') as string) || 0,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Aula criada com sucesso!')
    router.push(`/admin/cursos/${courseId}/modulos/${moduleId}/aulas`)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const statusLabels: Record<VideoStatus, { label: string; color: string }> = {
    idle: { label: '', color: '' },
    creating: { label: 'Criando vídeo no Panda...', color: 'text-blue-500' },
    uploading: { label: `Enviando vídeo... ${uploadProgress}%`, color: 'text-blue-500' },
    processing: { label: 'Processando no Panda Video (pode levar alguns minutos)...', color: 'text-amber-500' },
    ready: { label: 'Vídeo pronto!', color: 'text-green-500' },
    error: { label: videoError || 'Erro no upload', color: 'text-red-500' },
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Nova Aula</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info básica */}
            <div>
              <Label>Título da Aula</Label>
              <Input name="title" required placeholder="Ex: Introdução ao módulo" />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea name="description" rows={3} placeholder="Descreva o conteúdo desta aula..." />
            </div>

            {/* Tipo de conteúdo */}
            <div>
              <Label>Tipo de conteúdo</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[
                  { value: 'video', icon: Video, label: 'Vídeo' },
                  { value: 'text', icon: FileText, label: 'Texto' },
                  { value: 'pdf', icon: File, label: 'PDF' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setContentType(opt.value)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                      contentType === opt.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <opt.icon className="h-5 w-5" />
                    <span className="font-medium text-sm">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* UPLOAD DE VÍDEO */}
            {contentType === 'video' && (
              <Card className="border-2 border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Upload do Vídeo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Área de seleção */}
                  {!videoFile && (
                    <div
                      className="flex flex-col items-center justify-center p-8 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-10 w-10 text-gray-400 mb-3" />
                      <p className="font-medium text-gray-600">Clique para selecionar o vídeo</p>
                      <p className="text-sm text-gray-400 mt-1">MP4, WebM, MOV, AVI ou MKV · Máx 5GB</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  )}

                  {/* Arquivo selecionado */}
                  {videoFile && (
                    <div className="space-y-4">
                      {/* Info do arquivo */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Video className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium text-sm">{videoFile.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(videoFile.size)}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setVideoFile(null)
                            setVideoPreviewUrl(null)
                            setPandaVideoId('')
                            setVideoStatus('idle')
                            setUploadProgress(0)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          disabled={videoStatus === 'uploading'}
                        >
                          Trocar
                        </Button>
                      </div>

                      {/* Preview do vídeo */}
                      {videoPreviewUrl && (
                        <div className="rounded-lg overflow-hidden bg-black">
                          <video
                            src={videoPreviewUrl}
                            controls
                            className="w-full max-h-[300px]"
                            preload="metadata"
                          />
                        </div>
                      )}

                      {/* Barra de progresso do upload */}
                      {(videoStatus === 'uploading' || videoStatus === 'creating') && (
                        <div className="space-y-2">
                          <Progress value={uploadProgress} className="h-3" />
                        </div>
                      )}

                      {/* Status */}
                      {videoStatus !== 'idle' && (
                        <div className={`flex items-center gap-2 text-sm ${statusLabels[videoStatus].color}`}>
                          {videoStatus === 'creating' || videoStatus === 'uploading' || videoStatus === 'processing' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : videoStatus === 'ready' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : videoStatus === 'error' ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : null}
                          <span>{statusLabels[videoStatus].label}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* CONTEÚDO TEXTO */}
            {contentType === 'text' && (
              <div>
                <Label>Conteúdo da aula</Label>
                <Textarea name="content_body" rows={10} placeholder="Escreva o conteúdo da aula aqui..." />
              </div>
            )}

            {/* UPLOAD PDF */}
            {contentType === 'pdf' && (
              <div>
                <Label>Arquivo PDF</Label>
                <Input type="file" accept="application/pdf" name="pdf_file" />
                <p className="text-xs text-gray-500 mt-1">Máximo 10MB</p>
              </div>
            )}

            {/* Opções */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Posição</Label>
                <Input name="position" type="number" defaultValue={0} min={0} />
              </div>
              <div className="flex items-end gap-2">
                <input type="checkbox" name="is_free_preview" id="preview" className="rounded" />
                <Label htmlFor="preview" className="text-sm">Preview gratuito</Label>
              </div>
              <div className="flex items-end gap-2">
                <input type="checkbox" name="is_required" id="required" defaultChecked className="rounded" />
                <Label htmlFor="required" className="text-sm">Obrigatória</Label>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || videoStatus === 'uploading' || videoStatus === 'creating'}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando aula...</>
              ) : videoStatus === 'uploading' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando vídeo ({uploadProgress}%)...</>
              ) : videoStatus === 'creating' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Preparando upload...</>
              ) : (
                'Criar Aula'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
