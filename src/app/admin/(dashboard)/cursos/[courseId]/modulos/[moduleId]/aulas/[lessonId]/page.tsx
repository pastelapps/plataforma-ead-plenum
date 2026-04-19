'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Upload, CheckCircle, AlertCircle, Loader2, Video, FileText, File, X, Plus, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import * as tus from 'tus-js-client'

type VideoStatus = 'idle' | 'creating' | 'uploading' | 'processing' | 'ready' | 'error'

interface SupplementaryMaterial {
  name: string
  url: string
  type: string
}

interface LessonData {
  id: string
  title: string
  slug: string
  description: string | null
  content_type: string
  content_body: string | null
  panda_video_id: string | null
  panda_video_url: string | null
  video_status: string | null
  is_free_preview: boolean | null
  is_required: boolean | null
  position: number
  thumbnail_url: string | null
  estimated_duration_minutes: number | null
  supplementary_materials: SupplementaryMaterial[] | null
  attachment_url: string | null
  active: boolean | null
}

export default function EditAulaPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const moduleId = params.moduleId as string
  const lessonId = params.lessonId as string
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const materialInputRef = useRef<HTMLInputElement>(null)

  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [lesson, setLesson] = useState<LessonData | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contentType, setContentType] = useState('video')
  const [contentBody, setContentBody] = useState('')
  const [position, setPosition] = useState(0)
  const [isFreePreview, setIsFreePreview] = useState(false)
  const [isRequired, setIsRequired] = useState(true)
  const [estimatedDuration, setEstimatedDuration] = useState('')
  const [active, setActive] = useState(true)

  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [pandaVideoId, setPandaVideoId] = useState('')
  const [pandaVideoUrl, setPandaVideoUrl] = useState('')
  const [videoStatus, setVideoStatus] = useState<VideoStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoError, setVideoError] = useState('')

  // Thumbnail state
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [thumbnailUploading, setThumbnailUploading] = useState(false)

  // Materials state
  const [supplementaryMaterials, setSupplementaryMaterials] = useState<SupplementaryMaterial[]>([])
  const [materialUploading, setMaterialUploading] = useState(false)

  // PDF state
  const [pdfUrl, setPdfUrl] = useState('')
  const [pdfUploading, setPdfUploading] = useState(false)
  const [pdfFileName, setPdfFileName] = useState('')

  // Load lesson data
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()

      if (error || !data) {
        toast.error('Aula não encontrada')
        router.push(`/admin/cursos/${courseId}/modulos/${moduleId}/aulas`)
        return
      }

      setLesson(data)
      setTitle(data.title)
      setDescription(data.description ?? '')
      setContentType(data.content_type)
      setContentBody(data.content_body ?? '')
      setPosition(data.position)
      setIsFreePreview(data.is_free_preview ?? false)
      setIsRequired(data.is_required ?? true)
      setEstimatedDuration(data.estimated_duration_minutes?.toString() ?? '')
      setActive(data.active ?? true)
      setPandaVideoId(data.panda_video_id ?? '')
      setPandaVideoUrl(data.panda_video_url ?? '')
      setThumbnailUrl(data.thumbnail_url ?? '')
      setThumbnailPreview(data.thumbnail_url ?? null)
      setSupplementaryMaterials(data.supplementary_materials ?? [])
      setPdfUrl(data.attachment_url ?? '')
      if (data.attachment_url) setPdfFileName('Arquivo PDF atual')

      if (data.panda_video_id && data.video_status === 'ready') {
        setVideoStatus('ready')
      }

      setLoadingData(false)
    }
    load()
  }, [lessonId, courseId, moduleId, router])

  const uploadVideo = async (): Promise<string | null> => {
    if (!videoFile) return null

    setVideoStatus('creating')
    const res = await fetch('/api/panda/upload')
    const creds = await res.json()

    if (!creds.authorization) {
      setVideoStatus('error')
      setVideoError('Panda Video não configurado')
      return null
    }

    const videoUuid = crypto.randomUUID()
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
          setVideoStatus('error')
          setVideoError('Falha no upload: ' + error.message)
          reject(error)
        },
        onProgress(bytesUploaded, bytesTotal) {
          setUploadProgress(Math.round((bytesUploaded / bytesTotal) * 100))
        },
        onSuccess() {
          setPandaVideoId(videoUuid)
          setVideoStatus('processing')
          setUploadProgress(100)
          toast.success('Vídeo enviado! Processando...')
          resolve(videoUuid)
        },
      })
      upload.start()
    })
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) { toast.error('Imagem muito grande. Máximo 10MB.'); return }

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
      if (data.error) { toast.error('Erro ao enviar thumbnail'); setThumbnailPreview(thumbnailUrl || null); return }
      setThumbnailUrl(data.url)
      toast.success('Thumbnail atualizada!')
    } catch {
      toast.error('Erro ao enviar thumbnail.')
      setThumbnailPreview(thumbnailUrl || null)
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
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (!validTypes.includes(file.type)) { toast.error(`Formato inválido: ${file.name}`); continue }
        if (file.size > 10 * 1024 * 1024) { toast.error(`Arquivo grande demais: ${file.name}`); continue }

        const slug = Date.now().toString() + '-' + i
        const ext = file.name.split('.').pop() || 'pdf'
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', 'course-assets')
        formData.append('path', `lessons/materials/${slug}.${ext}`)

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (data.error) { toast.error(`Erro ao enviar ${file.name}`); continue }

        setSupplementaryMaterials(prev => [...prev, { name: file.name, url: data.url, type: ext === 'pdf' ? 'pdf' : 'doc' }])
      }
      toast.success('Material(is) enviado(s)!')
    } catch { toast.error('Erro ao enviar material.') }
    finally {
      setMaterialUploading(false)
      if (materialInputRef.current) materialInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    let newVideoId = pandaVideoId
    const usingPandaUrl = contentType === 'video' && pandaVideoUrl.trim().length > 0

    // Upload new video if selected
    if (contentType === 'video' && videoFile && !usingPandaUrl) {
      const result = await uploadVideo()
      if (!result) { setSaving(false); return }
      newVideoId = result
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const supabase = createClient()
    const { error } = await supabase
      .from('lessons')
      .update({
        title,
        slug,
        description: description || null,
        content_type: contentType,
        content_body: contentType === 'text' ? contentBody : null,
        attachment_url: contentType === 'pdf' ? pdfUrl || null : null,
        panda_video_id: contentType === 'video' && !usingPandaUrl ? newVideoId || null : lesson?.panda_video_id || null,
        panda_video_url: contentType === 'video' && usingPandaUrl ? pandaVideoUrl.trim() : null,
        video_status: contentType === 'video'
          ? (usingPandaUrl ? 'ready' : (videoFile ? 'processing' : lesson?.video_status))
          : null,
        is_free_preview: isFreePreview,
        is_required: isRequired,
        position,
        thumbnail_url: thumbnailUrl || null,
        estimated_duration_minutes: estimatedDuration ? parseInt(estimatedDuration) : null,
        supplementary_materials: supplementaryMaterials.length > 0 ? supplementaryMaterials : null,
        active,
      })
      .eq('id', lessonId)

    if (error) {
      toast.error('Erro ao salvar: ' + error.message)
      setSaving(false)
      return
    }

    toast.success('Aula atualizada com sucesso!')
    router.push(`/admin/cursos/${courseId}/modulos/${moduleId}/aulas`)
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.')) return
    setDeleting(true)

    const supabase = createClient()
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId)

    if (error) {
      toast.error('Erro ao excluir: ' + error.message)
      setDeleting(false)
      return
    }

    toast.success('Aula excluída!')
    router.push(`/admin/cursos/${courseId}/modulos/${moduleId}/aulas`)
  }

  const statusLabels: Record<VideoStatus, { label: string; color: string }> = {
    idle: { label: '', color: '' },
    creating: { label: 'Criando vídeo no Panda...', color: 'text-blue-500' },
    uploading: { label: `Enviando vídeo... ${uploadProgress}%`, color: 'text-blue-500' },
    processing: { label: 'Processando no Panda Video...', color: 'text-amber-500' },
    ready: { label: 'Vídeo pronto!', color: 'text-green-500' },
    error: { label: videoError || 'Erro no upload', color: 'text-red-500' },
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/admin/cursos/${courseId}/modulos/${moduleId}/aulas`}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Editar Aula</h1>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
          {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
          Excluir
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div>
              <Label>Título da Aula</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required />
            </div>

            {/* Descrição */}
            <div>
              <Label>Descrição</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
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

            {/* Thumbnail */}
            <div>
              <Label>Thumbnail da aula (16:9)</Label>
              <div className="mt-2">
                {thumbnailPreview ? (
                  <div className="relative">
                    <img src={thumbnailPreview} alt="Thumbnail" className="w-full aspect-video object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => { setThumbnailPreview(null); setThumbnailUrl(''); if (thumbnailInputRef.current) thumbnailInputRef.current.value = '' }}
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
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Clique para selecionar uma imagem</p>
                  </div>
                )}
                <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
              </div>
            </div>

            {/* Vídeo */}
            {contentType === 'video' && (
              <Card className="border-2 border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Vídeo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current video info */}
                  {pandaVideoId && !videoFile && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Vídeo atual configurado</p>
                        <p className="text-xs text-green-600">ID: {pandaVideoId}</p>
                      </div>
                    </div>
                  )}

                  {/* Replace video button */}
                  {!videoFile && (
                    <div
                      className="flex flex-col items-center justify-center p-6 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors border-2 border-dashed"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="font-medium text-gray-600 text-sm">
                        {pandaVideoId ? 'Clique para substituir o vídeo' : 'Clique para selecionar o vídeo'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">MP4, WebM, MOV, AVI ou MKV - Máx 5GB</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
                          if (!validTypes.includes(file.type)) { toast.error('Formato inválido.'); return }
                          if (file.size > 5 * 1024 * 1024 * 1024) { toast.error('Arquivo muito grande.'); return }
                          setVideoFile(file)
                          setPandaVideoUrl('')
                        }}
                        className="hidden"
                      />
                    </div>
                  )}

                  {/* New file selected */}
                  {videoFile && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Video className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium text-sm">{videoFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {videoFile.size < 1024 * 1024
                                ? `${(videoFile.size / 1024).toFixed(1)} KB`
                                : `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB`}
                            </p>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => { setVideoFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                          Cancelar
                        </Button>
                      </div>
                      {(videoStatus === 'uploading' || videoStatus === 'creating') && <Progress value={uploadProgress} className="h-3" />}
                      {videoStatus !== 'idle' && (
                        <div className={`flex items-center gap-2 text-sm ${statusLabels[videoStatus].color}`}>
                          {['creating', 'uploading', 'processing'].includes(videoStatus)
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : videoStatus === 'ready' ? <CheckCircle className="h-4 w-4" />
                            : videoStatus === 'error' ? <AlertCircle className="h-4 w-4" /> : null}
                          <span>{statusLabels[videoStatus].label}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* OU URL do Panda */}
                  {!videoFile && !pandaVideoId && (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 border-t" />
                        <span className="text-sm text-gray-400">OU cole a URL do Panda Video</span>
                        <div className="flex-1 border-t" />
                      </div>
                      <div>
                        <Input
                          value={pandaVideoUrl}
                          onChange={e => setPandaVideoUrl(e.target.value)}
                          placeholder="https://player-vz-xxx.tv.pandavideo.com.br/embed/?v=..."
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Texto */}
            {contentType === 'text' && (
              <div>
                <Label>Conteúdo da aula</Label>
                <Textarea value={contentBody} onChange={e => setContentBody(e.target.value)} rows={10} />
              </div>
            )}

            {/* PDF */}
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
                          <p className="text-sm font-medium text-green-800">PDF configurado</p>
                          <p className="text-xs text-green-600">{pdfFileName}</p>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setPdfUrl(''); setPdfFileName('') }}>
                        Trocar
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center p-8 cursor-pointer rounded-lg hover:bg-gray-50"
                      onClick={() => document.getElementById('pdf-input-edit')?.click()}
                    >
                      {pdfUploading ? (
                        <><Loader2 className="h-10 w-10 text-gray-400 mb-3 animate-spin" /><p className="text-sm text-gray-500">Enviando PDF...</p></>
                      ) : (
                        <><Upload className="h-10 w-10 text-gray-400 mb-3" /><p className="font-medium text-gray-600">Clique para selecionar o PDF</p></>
                      )}
                    </div>
                  )}
                  <input
                    id="pdf-input-edit"
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
                        if (data.error) { toast.error('Erro: ' + data.error); return }
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label>Posição</Label>
                <Input type="number" value={position} onChange={e => setPosition(parseInt(e.target.value) || 0)} min={0} />
              </div>
              <div className="flex items-end gap-2">
                <input type="checkbox" id="preview" checked={isFreePreview} onChange={e => setIsFreePreview(e.target.checked)} className="rounded" />
                <Label htmlFor="preview" className="text-sm">Preview gratuito</Label>
              </div>
              <div className="flex items-end gap-2">
                <input type="checkbox" id="required" checked={isRequired} onChange={e => setIsRequired(e.target.checked)} className="rounded" />
                <Label htmlFor="required" className="text-sm">Obrigatória</Label>
              </div>
              <div className="flex items-end gap-2">
                <input type="checkbox" id="active" checked={active} onChange={e => setActive(e.target.checked)} className="rounded" />
                <Label htmlFor="active" className="text-sm">Ativa</Label>
              </div>
            </div>

            {/* Duração */}
            <div>
              <Label>Duração estimada (minutos)</Label>
              <Input type="number" min={0} value={estimatedDuration} onChange={e => setEstimatedDuration(e.target.value)} placeholder="Ex: 15" />
            </div>

            {/* Material complementar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Material Complementar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplementaryMaterials.length > 0 && (
                  <div className="space-y-2">
                    {supplementaryMaterials.map((mat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <File className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{mat.name}</p>
                            <p className="text-xs text-gray-500 uppercase">{mat.type}</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setSupplementaryMaterials(prev => prev.filter((_, i) => i !== index))} className="p-1 hover:bg-gray-200 rounded">
                          <X className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => materialInputRef.current?.click()}
                >
                  {materialUploading ? (
                    <><Loader2 className="h-5 w-5 text-gray-400 animate-spin" /><span className="text-sm text-gray-500">Enviando...</span></>
                  ) : (
                    <><Plus className="h-5 w-5 text-gray-400" /><span className="text-sm text-gray-500">Adicionar arquivo (PDF, DOC, DOCX)</span></>
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
            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={saving || videoStatus === 'uploading' || videoStatus === 'creating'}
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
                ) : videoStatus === 'uploading' ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando vídeo ({uploadProgress}%)...</>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
              <Link href={`/admin/cursos/${courseId}/modulos/${moduleId}/aulas`}>
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
