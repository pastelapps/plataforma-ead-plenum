'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Upload, X, Check } from 'lucide-react'

const FALLBACK_COLORS = [
  '#1e40af', '#1d4ed8', '#7c3aed', '#9333ea', '#c026d3', '#db2777',
  '#dc2626', '#ea580c', '#d97706', '#16a34a', '#0d9488', '#0891b2',
]

const uploadFile = async (file: File, path: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bucket', 'course-assets')
  formData.append('path', path)
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro no upload')
  return data.url as string
}

export default function NewCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [level, setLevel] = useState('beginner')
  const [instructorName, setInstructorName] = useState('')
  const [fallbackColor, setFallbackColor] = useState('#1e40af')
  const [sequentialJourney, setSequentialJourney] = useState(false)

  // Image previews (local blob URLs)
  const [bannerVerticalPreview, setBannerVerticalPreview] = useState<string | null>(null)
  const [bannerHorizontalPreview, setBannerHorizontalPreview] = useState<string | null>(null)
  const [bannerSquarePreview, setBannerSquarePreview] = useState<string | null>(null)
  const [instructorAvatarPreview, setInstructorAvatarPreview] = useState<string | null>(null)

  // Image files
  const [bannerVerticalFile, setBannerVerticalFile] = useState<File | null>(null)
  const [bannerHorizontalFile, setBannerHorizontalFile] = useState<File | null>(null)
  const [bannerSquareFile, setBannerSquareFile] = useState<File | null>(null)
  const [instructorAvatarFile, setInstructorAvatarFile] = useState<File | null>(null)

  // Category autocomplete
  const [categories, setCategories] = useState<string[]>([])
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  const categoryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('courses')
      .select('category')
      .not('category', 'is', null)
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map((c) => c.category).filter(Boolean))] as string[]
          setCategories(unique)
        }
      })
  }, [])

  // Close category dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategorySuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredCategories = categories.filter(
    (c) => c.toLowerCase().includes(category.toLowerCase()) && c.toLowerCase() !== category.toLowerCase()
  )

  const handleImageSelect = (
    file: File,
    setPreview: (url: string | null) => void,
    setFile: (file: File | null) => void,
  ) => {
    const url = URL.createObjectURL(file)
    setPreview(url)
    setFile(file)
  }

  const clearImage = (
    setPreview: (url: string | null) => void,
    setFile: (file: File | null) => void,
    preview: string | null,
  ) => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setFile(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)

    try {
      const supabase = createClient()
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      const ts = Date.now()

      // Upload images in parallel
      const uploads = await Promise.all([
        bannerVerticalFile
          ? uploadFile(bannerVerticalFile, `${slug}/banner-vertical-${ts}.${bannerVerticalFile.name.split('.').pop()}`)
          : Promise.resolve(null),
        bannerHorizontalFile
          ? uploadFile(bannerHorizontalFile, `${slug}/banner-horizontal-${ts}.${bannerHorizontalFile.name.split('.').pop()}`)
          : Promise.resolve(null),
        bannerSquareFile
          ? uploadFile(bannerSquareFile, `${slug}/banner-square-${ts}.${bannerSquareFile.name.split('.').pop()}`)
          : Promise.resolve(null),
        instructorAvatarFile
          ? uploadFile(instructorAvatarFile, `${slug}/instructor-avatar-${ts}.${instructorAvatarFile.name.split('.').pop()}`)
          : Promise.resolve(null),
      ])

      const [bannerVerticalUrl, bannerHorizontalUrl, bannerSquareUrl, instructorAvatarUrl] = uploads

      const { data: org } = await supabase
        .from('organization_admins')
        .select('organization_id')
        .limit(1)
        .single()

      const { error } = await supabase.from('courses').insert({
        organization_id: org?.organization_id,
        title,
        slug,
        description,
        short_description: shortDescription,
        category: category || null,
        level: level || 'beginner',
        instructor_name: instructorName || null,
        banner_vertical_url: bannerVerticalUrl,
        banner_horizontal_url: bannerHorizontalUrl,
        banner_square_url: bannerSquareUrl,
        instructor_avatar_url: instructorAvatarUrl,
        fallback_color: fallbackColor,
        sequential_journey: sequentialJourney,
      })

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }

      toast.success('Curso criado!')
      router.push('/admin/cursos')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar curso')
      setLoading(false)
    }
  }

  const bgFallback = fallbackColor
    ? `linear-gradient(160deg, ${fallbackColor} 0%, #0a0a0a 100%)`
    : 'linear-gradient(160deg, #1e40af 0%, #0a0a0a 100%)'

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Novo Curso</h1>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT: Form fields */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informacoes Basicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Titulo *</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nome do curso"
                  />
                </div>

                <div>
                  <Label htmlFor="short_description">Descricao curta</Label>
                  <Input
                    id="short_description"
                    name="short_description"
                    maxLength={200}
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Breve descricao do curso (max 200 caracteres)"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descricao completa</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descricao detalhada do curso..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category with autocomplete */}
                  <div ref={categoryRef} className="relative">
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      name="category"
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value)
                        setShowCategorySuggestions(true)
                      }}
                      onFocus={() => setShowCategorySuggestions(true)}
                      placeholder="Ex: Marketing, Vendas..."
                      autoComplete="off"
                    />
                    {showCategorySuggestions && filteredCategories.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {filteredCategories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                            onClick={() => {
                              setCategory(cat)
                              setShowCategorySuggestions(false)
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="level">Nivel</Label>
                    <select
                      id="level"
                      name="level"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full border rounded-md p-2 h-9 text-sm bg-white"
                    >
                      <option value="beginner">Iniciante</option>
                      <option value="intermediate">Intermediario</option>
                      <option value="advanced">Avancado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="instructor_name">Instrutor</Label>
                    <Input
                      id="instructor_name"
                      name="instructor_name"
                      value={instructorName}
                      onChange={(e) => setInstructorName(e.target.value)}
                      placeholder="Nome do instrutor"
                    />
                  </div>

                  <div>
                    <Label>Foto do Instrutor</Label>
                    <ImageUploadField
                      preview={instructorAvatarPreview}
                      onSelect={(file) => handleImageSelect(file, setInstructorAvatarPreview, setInstructorAvatarFile)}
                      onClear={() => clearImage(setInstructorAvatarPreview, setInstructorAvatarFile, instructorAvatarPreview)}
                      hint="Foto quadrada (opcional)"
                      compact
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Images */}
            <Card>
              <CardHeader>
                <CardTitle>Imagens do Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Banner Vertical *</Label>
                    <ImageUploadField
                      preview={bannerVerticalPreview}
                      onSelect={(file) => handleImageSelect(file, setBannerVerticalPreview, setBannerVerticalFile)}
                      onClear={() => clearImage(setBannerVerticalPreview, setBannerVerticalFile, bannerVerticalPreview)}
                      hint="Proporcao 2:3 (~340x510px)"
                      aspectLabel="2:3"
                    />
                  </div>

                  <div>
                    <Label>Banner Horizontal</Label>
                    <ImageUploadField
                      preview={bannerHorizontalPreview}
                      onSelect={(file) => handleImageSelect(file, setBannerHorizontalPreview, setBannerHorizontalFile)}
                      onClear={() => clearImage(setBannerHorizontalPreview, setBannerHorizontalFile, bannerHorizontalPreview)}
                      hint="Proporcao 16:9 (~1920x600px)"
                      aspectLabel="16:9"
                    />
                  </div>
                </div>

                <div className="max-w-[50%]">
                  <Label>Banner Quadrado</Label>
                  <ImageUploadField
                    preview={bannerSquarePreview}
                    onSelect={(file) => handleImageSelect(file, setBannerSquarePreview, setBannerSquareFile)}
                    onClear={() => clearImage(setBannerSquarePreview, setBannerSquareFile, bannerSquarePreview)}
                    hint="400x400px (opcional)"
                    aspectLabel="1:1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Configuracoes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Fallback Color */}
                <div>
                  <Label>Cor de fallback</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Usada quando nao ha banner. Selecione uma cor:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {FALLBACK_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFallbackColor(color)}
                        className="relative w-9 h-9 rounded-lg border-2 transition-all hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor: fallbackColor === color ? '#000' : 'transparent',
                        }}
                        title={color}
                      >
                        {fallbackColor === color && (
                          <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sequential Journey */}
                <div className="flex items-center gap-3">
                  <Switch
                    checked={sequentialJourney}
                    onCheckedChange={(val: boolean) => setSequentialJourney(val)}
                  />
                  <div>
                    <Label className="cursor-pointer" onClick={() => setSequentialJourney(!sequentialJourney)}>
                      Jornada obrigatoria
                    </Label>
                    <p className="text-xs text-gray-500">
                      Aluno deve concluir aulas na ordem
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="min-w-[140px]">
                {loading ? 'Criando...' : 'Criar Curso'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/cursos')}
              >
                Cancelar
              </Button>
            </div>
          </div>

          {/* RIGHT: Live Card Preview */}
          <div className="lg:w-[300px] shrink-0">
            <div className="lg:sticky lg:top-6 space-y-3">
              <Label className="text-sm font-medium text-gray-700">Preview do Card</Label>
              <div
                className="relative overflow-hidden mx-auto"
                style={{
                  width: 230,
                  height: 400,
                  borderRadius: 16,
                }}
              >
                {/* Background image or fallback gradient */}
                {bannerVerticalPreview ? (
                  <img
                    src={bannerVerticalPreview}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: bgFallback }}
                  />
                )}

                {/* Dark overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.15) 100%)',
                  }}
                />

                {/* Bottom content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10 flex flex-col gap-2">
                  {instructorName && (
                    <span
                      className="self-start px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: '#00e676', color: '#ffffff' }}
                    >
                      {instructorName}
                    </span>
                  )}

                  <h3 className="text-[14px] font-bold uppercase leading-tight text-white line-clamp-3">
                    {title || 'Titulo do Curso'}
                  </h3>
                </div>

                {/* Logo placeholder */}
                <div className="absolute bottom-3 right-3 z-10 w-7 h-7 rounded bg-white/20 flex items-center justify-center">
                  <span className="text-[8px] text-white/60 font-bold">LOGO</span>
                </div>
              </div>

              <p className="text-xs text-center text-gray-400">
                Visualizacao do card vertical (230x400px)
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Image Upload Field Component                                        */
/* ------------------------------------------------------------------ */

function ImageUploadField({
  preview,
  onSelect,
  onClear,
  hint,
  aspectLabel,
  compact,
}: {
  preview: string | null
  onSelect: (file: File) => void
  onClear: () => void
  hint: string
  aspectLabel?: string
  compact?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onSelect(file)
          e.target.value = ''
        }}
      />

      {preview ? (
        <div className="relative group mt-1">
          <img
            src={preview}
            alt="Preview"
            className={`rounded-lg border object-cover ${compact ? 'h-20 w-20' : 'h-32 w-full'}`}
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`mt-1 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-gray-400 hover:bg-gray-50 transition-colors ${
            compact ? 'h-20 w-20' : 'h-32 w-full'
          }`}
        >
          <Upload className="h-5 w-5 text-gray-400" />
          {aspectLabel && (
            <span className="text-xs text-gray-400 font-medium">{aspectLabel}</span>
          )}
        </button>
      )}
      <p className="text-xs text-gray-400 mt-1">{hint}</p>
    </div>
  )
}
