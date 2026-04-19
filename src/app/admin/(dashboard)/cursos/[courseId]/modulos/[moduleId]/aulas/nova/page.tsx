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
import { Upload, CheckCircle, AlertCircle, Loader2, Video, FileText, File, X, Plus } from 'lucide-react'
import * as tus from 'tus-js-client'

type VideoStatus = 'idle' | 'creating' | 'uploading' | 'processing' | 'ready' | 'error'

interface SupplementaryMaterial {
  name: string
  url: string
  type: string
}

export default function NovaAulaPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const moduleId = params.moduleId as string
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const materialInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [contentType, setContentType] = useState('video')

  // Video upload state
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [pandaVideoId, setPandaVideoId] = useState('')
  const [videoStatus, setVideoStatus] = useState<VideoStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoError, setVideoError] = useState('')

  // New fields state
  const [pandaVideoUrl, setPandaVideoUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [thumbnailUploading, setThumbnailUploading] = useState(false)
  const [supplementaryMaterials, setSupplementaryMaterials] = useState<SupplementaryMaterial[]>([])
  const [materialUploading, setMaterialUploading] = useState(false)
  const [pdfUrl, setPdfUrl] = useState('')
  const [pdfUploading, setPdfUploading] = useState(false)
  const [pdfFileName, setPdfFileName] = useState('')

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
    setPandaVideoUrl('') // Clear URL if user selects file

    // Criar preview local
    const url = URL.createObjectURL(file)
    setVideoPreviewUrl(url)
  }, [])

  const uploadVideo = async (title: string): Promise<string | null> => {
    if (!videoFile) {
      toast.error('Selecione um vídeo primeiro')
      return null
    }

    // 1. Get Panda credentials + upload server from our API
    setVideoStatus('creating')
    const res = await fetch('/api/panda/upload')
    const creds = await res.json()

    if (!creds.authorization) {
      setVideoStatus('error')
      setVideoError('Panda Video não configurado')
      return null
    }

    // 2. Generate a UUID for the video so we can track it
    const videoUuid = crypto.randomUUID()

    // 3. Upload via TUS — Panda creates the video with our UUID
    setVideoStatus('uploading')

    const metadata: Record<string, string> = {
      authorization: creds.authorization,
      filename: videoFile.name,
      video_id: videoUuid,
    }
    if (creds.folderId) {
      metadata.folder_id = creds.folderId
    }

    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(videoFile, {
        endpoint: creds.uploadEndpoint || 'https://uploader-us01.pandavideo.com.br/files',
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata,
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
          setPandaVideoId(videoUuid)
          setVideoStatus('processing')
          setUploadProgress(100)
          toast.success('Vídeo enviado! O Panda Video está processando.')
          pollVideoStatus(videoUuid)
          resolve(videoUuid)
        },
      })

      upload.start()
    })
  }

  const pollVideoStatus = async (videoId: string) => {
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

      setTimeout(checkStatus, 5000)
    }

    setTimeout(checkStatus, 5000)
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 10MB.')
      return
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file)
    setThumbnailPreview(localPreview)
    setThumbnailUploading(true)

    try {
      const slug = Date.now().toString()
      const ext = file.name.split('.').pop() || 'jpg'
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'course-assets')
      formData.append('path', `lessons/${slug}/thumbnail.${ext}`)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.error) {
        toast.error('Erro ao enviar thumbnail: ' + data.error)
        setThumbnailPreview(null)
        return
      }

      setThumbnailUrl(data.url)
      toast.success('Thumbnail enviada!')
    } catch {
      toast.error('Erro ao enviar thumbnail.')
      setThumbnailPreview(null)
    } finally {
      setThumbnailUploading(false)
    }
  }

  const handleMaterialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setMaterialUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const validTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]

        if (!validTypes.includes(file.type)) {
          toast.error(`Formato inválido: ${file.name}. Use PDF ou DOC/DOCX.`)
          continue
        }

        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Arquivo muito grande: ${file.name}. Máximo 10MB.`)
          continue
        }

        const slug = Date.now().toString() + '-' + i
        const ext = file.name.split('.').pop() || 'pdf'
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', 'course-assets')
        formData.append('path', `lessons/materials/${slug}.${ext}`)

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()

        if (data.error) {
          toast.error(`Erro ao enviar ${file.name}: ${data.error}`)
          continue
        }

        const fileType = ext === 'pdf' ? 'pdf' : ext === 'doc' || ext === 'docx' ? 'doc' : ext

        setSupplementaryMaterials(prev => [
          ...prev,
          { name: file.name, url: data.url, type: fileType },
        ])
      }

      toast.success('Material(is) complementar(es) enviado(s)!')
    } catch {
      toast.error('Erro ao enviar material complementar.')
    } finally {
      setMaterialUploading(false)
      if (materialInputRef.current) materialInputRef.current.value = ''
    }
  }

  const removeMaterial = (index: number) => {
    setSupplementaryMaterials(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const title = form.get('title') as string
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    let videoId = pandaVideoId
    const usingPandaUrl = contentType === 'video' && pandaVideoUrl.trim().length > 0

    // Se é vídeo e ainda não fez upload
    if (contentType === 'video' && !usingPandaUrl) {
      if (!videoFile && !videoId) {
        toast.error('Selecione um vídeo ou cole a URL do Panda Video')
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

    // Validate PDF
    if (contentType === 'pdf' && !pdfUrl) {
      toast.error('Envie um arquivo PDF')
      setLoading(false)
      return
    }

    // Salvar no banco
    const supabase = createClient()
    const { error } = await supabase.from('lessons').insert({
      module_id: moduleId,
      title,
      slug,
      description: form.get('description') as string,
      content_type: contentType,
      panda_video_id: contentType === 'video' && !usingPandaUrl ? videoId : null,
      video_status: contentType === 'video' ? (usingPandaUrl ? 'ready' : 'processing') : null,
      panda_video_url: contentType === 'video' ? (usingPandaUrl ? pandaVideoUrl.trim() : null) : null,
      content_body: contentType === 'text' ? form.get('content_body') as string : null,
      attachment_url: contentType === 'pdf' ? pdfUrl : null,
      is_free_preview: form.get('is_free_preview') === 'on',
      is_required: form.get('is_required') !== 'off',
      position: parseInt(form.get('position') as string) || 0,
      thumbnail_url: thumbnailUrl || null,
      estimated_duration_minutes: parseInt(form.get('estimated_duration_minutes') as string) || null,
      supplementary_materials: supplementaryMaterials.length > 0 ? supplementaryMaterials : null,
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

            {/* Thumbnail da aula */}
            <div>
              <Label>Thumbnail da aula (16:9)</Label>
              <div className="mt-2">
                {thumbnailPreview ? (
                  <div className="relative">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full aspect-video object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailPreview(null)
                        setThumbnailUrl('')
                        if (thumbnailInputRef.current) thumbnailInputRef.current.value = ''
                      }}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100"
                    >
                      <X className="h-4 w-4 text-gray-600" />
                    </button>
                    {thumbnailUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Clique para selecionar uma imagem</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP - Proporção 16:9 recomendada</p>
                  </div>
                )}
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* UPLOAD DE VÍDEO */}
            {contentType === 'video' && (
              <>
                <Card className="border-2 border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Upload do Vídeo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Área de seleção */}
                    {!videoFile && !pandaVideoUrl && (
                      <div
                        className="flex flex-col items-center justify-center p-8 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-10 w-10 text-gray-400 mb-3" />
                        <p className="font-medium text-gray-600">Clique para selecionar o vídeo</p>
                        <p className="text-sm text-gray-400 mt-1">MP4, WebM, MOV, AVI ou MKV - Máx 5GB</p>
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

                    {/* Separador OU */}
                    {!videoFile && (
                      <div className="flex items-center gap-3 my-2">
                        <div className="flex-1 border-t border-gray-300" />
                        <span className="text-sm text-gray-400 font-medium whitespace-nowrap">
                          OU cole a URL do Panda Video
                        </span>
                        <div className="flex-1 border-t border-gray-300" />
                      </div>
                    )}

                    {/* URL do Panda Video */}
                    {!videoFile && (
                      <div>
                        <Label htmlFor="panda_video_url">URL do Panda Video (alternativa ao upload)</Label>
                        <Input
                          id="panda_video_url"
                          value={pandaVideoUrl}
                          onChange={e => setPandaVideoUrl(e.target.value)}
                          placeholder="https://player-vz-xxx.tv.pandavideo.com.br/embed/?v=..."
                          className="mt-1"
                        />
                        {pandaVideoUrl && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>URL do Panda Video informada. O upload será ignorado.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
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
              <Card className="border-2 border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Arquivo PDF</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pdfUrl ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-green-800">PDF enviado</p>
                          <p className="text-xs text-green-600">{pdfFileName}</p>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setPdfUrl(''); setPdfFileName('') }}>
                        Trocar
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center p-8 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => document.getElementById('pdf-input')?.click()}
                    >
                      {pdfUploading ? (
                        <><Loader2 className="h-10 w-10 text-gray-400 mb-3 animate-spin" /><p className="text-sm text-gray-500">Enviando PDF...</p></>
                      ) : (
                        <><Upload className="h-10 w-10 text-gray-400 mb-3" /><p className="font-medium text-gray-600">Clique para selecionar o PDF</p><p className="text-sm text-gray-400 mt-1">Máximo 10MB</p></>
                      )}
                    </div>
                  )}
                  <input
                    id="pdf-input"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.size > 10 * 1024 * 1024) { toast.error('PDF muito grande. Máximo 10MB.'); return }
                      setPdfUploading(true)
                      try {
                        const slug = Date.now().toString()
                        const formData = new FormData()
                        formData.append('file', file)
                        formData.append('bucket', 'course-assets')
                        formData.append('path', `lessons/pdf/${slug}.pdf`)
                        const res = await fetch('/api/upload', { method: 'POST', body: formData })
                        const data = await res.json()
                        if (data.error) { toast.error('Erro ao enviar PDF: ' + data.error); return }
                        setPdfUrl(data.url)
                        setPdfFileName(file.name)
                        toast.success('PDF enviado!')
                      } catch { toast.error('Erro ao enviar PDF.') }
                      finally { setPdfUploading(false) }
                    }}
                  />
                </CardContent>
              </Card>
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

            {/* Duração estimada */}
            <div>
              <Label htmlFor="estimated_duration_minutes">Duração estimada (minutos)</Label>
              <Input
                id="estimated_duration_minutes"
                name="estimated_duration_minutes"
                type="number"
                min={0}
                placeholder="Ex: 15"
                className="mt-1"
              />
            </div>

            {/* Material complementar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Material Complementar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lista de materiais já enviados */}
                {supplementaryMaterials.length > 0 && (
                  <div className="space-y-2">
                    {supplementaryMaterials.map((mat, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <File className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{mat.name}</p>
                            <p className="text-xs text-gray-500 uppercase">{mat.type}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMaterial(index)}
                          className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                        >
                          <X className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botão de adicionar */}
                <div
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => materialInputRef.current?.click()}
                >
                  {materialUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                      <span className="text-sm text-gray-500">Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-500">Adicionar arquivo (PDF, DOC, DOCX)</span>
                    </>
                  )}
                </div>
                <input
                  ref={materialInputRef}
                  type="file"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleMaterialUpload}
                  multiple
                  className="hidden"
                />
              </CardContent>
            </Card>

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
