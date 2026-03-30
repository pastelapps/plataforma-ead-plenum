'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { DEFAULT_PRESETS, generatePaletteFromBase } from '@/lib/design-system/presets'
import {
  Building2, Palette, ImageIcon, BookOpen, Users, Settings,
  Save, Loader2, CheckCircle, Upload, X, Eye, ChevronLeft,
  Globe, Calendar, Shield, Percent, ToggleLeft
} from 'lucide-react'
import Link from 'next/link'

// ============================================================
// NAVIGATION SECTIONS
// ============================================================
const SECTIONS = [
  { id: 'info', label: 'Informacoes', icon: Building2 },
  { id: 'design', label: 'Design System', icon: Palette },
  { id: 'assets', label: 'Marca & Assets', icon: ImageIcon },
  { id: 'cursos', label: 'Cursos', icon: BookOpen },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

// ============================================================
// ASSET CONFIG
// ============================================================
const ASSET_GROUPS = [
  {
    title: 'Identidade da Marca',
    description: 'Logos e favicon que representam a identidade visual do tenant',
    items: [
      { key: 'logo_square_url', label: 'Logo Quadrado', hint: '512x512px, PNG com fundo transparente' },
      { key: 'logo_horizontal_url', label: 'Logo Horizontal', hint: '300x80px, PNG/SVG' },
      { key: 'logo_dark_url', label: 'Logo (Dark Mode)', hint: 'Versao para fundos escuros' },
      { key: 'favicon_url', label: 'Favicon', hint: '32x32px ou 64x64px, ICO/PNG' },
    ],
  },
  {
    title: 'Paginas & Banners',
    description: 'Imagens usadas nas paginas de login e homepage',
    items: [
      { key: 'login_banner_url', label: 'Banner Login', hint: '1920x1080px, JPG/PNG' },
      { key: 'homepage_hero_url', label: 'Hero Homepage', hint: '1920x600px' },
      { key: 'homepage_hero_mobile_url', label: 'Hero Mobile', hint: '768x400px' },
    ],
  },
  {
    title: 'Cards de Cursos',
    description: 'Padroes e texturas de fundo para os cards de curso',
    items: [
      { key: 'card_bg_pattern_1_url', label: 'Padrao 1', hint: 'Textura/padrao PNG' },
      { key: 'card_bg_pattern_2_url', label: 'Padrao 2', hint: 'Textura alternativa' },
    ],
  },
  {
    title: 'Certificado',
    description: 'Elementos visuais do certificado PDF gerado',
    items: [
      { key: 'certificate_bg_url', label: 'Fundo Certificado', hint: 'A4 landscape, PNG/JPG' },
      { key: 'certificate_logo_url', label: 'Logo Certificado', hint: 'Logo que aparece no PDF' },
      { key: 'certificate_signature_url', label: 'Assinatura', hint: 'PNG com fundo transparente' },
    ],
  },
]

// ============================================================
// ASSET UPLOAD CARD COMPONENT
// ============================================================
function AssetUploadCard({
  assetKey, label, hint, currentUrl, onUpload, uploading,
}: {
  assetKey: string; label: string; hint: string;
  currentUrl: string | null; onUpload: (key: string, file: File) => void; uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) onUpload(assetKey, file)
  }, [assetKey, onUpload])

  return (
    <div
      className={`group relative rounded-xl border-2 border-dashed transition-all ${
        dragOver ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
      } ${currentUrl ? 'bg-white' : 'bg-gray-50/50'}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Preview area */}
      <div className="p-4">
        {currentUrl ? (
          <div className="relative">
            <div className="h-28 rounded-lg bg-[repeating-conic-gradient(#f3f4f6_0%_25%,#fff_0%_50%)] bg-[length:16px_16px] flex items-center justify-center overflow-hidden">
              <img src={currentUrl} alt={label} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <a href={currentUrl} target="_blank" rel="noopener noreferrer"
                className="p-1.5 rounded-md bg-white/90 shadow-sm hover:bg-white">
                <Eye className="h-3.5 w-3.5 text-gray-600" />
              </a>
              <button onClick={() => inputRef.current?.click()}
                className="p-1.5 rounded-md bg-white/90 shadow-sm hover:bg-white">
                <Upload className="h-3.5 w-3.5 text-gray-600" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full h-28 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-100/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Upload className="h-5 w-5 text-gray-400" />
            </div>
            <span className="text-xs text-gray-400">Clique ou arraste</span>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pb-3">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>
        {uploading && (
          <div className="flex items-center gap-1.5 mt-2">
            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
            <span className="text-xs text-blue-500">Enviando...</span>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(assetKey, f) }} />
    </div>
  )
}

// ============================================================
// COLOR PICKER ROW
// ============================================================
function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-sm text-gray-600 whitespace-nowrap min-w-[120px]">{label}</Label>
      <div className="flex items-center gap-2 flex-1 max-w-[200px]">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
          />
        </div>
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="font-mono text-xs h-9"
        />
      </div>
    </div>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function TenantDetailPage() {
  const { tenantId } = useParams()
  const id = tenantId as string

  const [activeSection, setActiveSection] = useState<SectionId>('info')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState<any>(null)
  const [assets, setAssets] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [tenantCourses, setTenantCourses] = useState<any[]>([])
  const [stats, setStats] = useState({ profiles: 0 })
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)

  // Design System
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [secondaryColor, setSecondaryColor] = useState('#22c55e')
  const [tertiaryColor, setTertiaryColor] = useState('#d946ef')
  const [sidebarBg, setSidebarBg] = useState('#1f2937')
  const [headerBg, setHeaderBg] = useState('#ffffff')
  const [headerText, setHeaderText] = useState('#111827')
  const [bgPage, setBgPage] = useState('#ffffff')
  const [bgSurface, setBgSurface] = useState('#f9fafb')
  const [successColor, setSuccessColor] = useState('#22c55e')
  const [warningColor, setWarningColor] = useState('#f59e0b')
  const [errorColor, setErrorColor] = useState('#ef4444')
  const [cardGradient, setCardGradient] = useState('')
  const [cardOverlay, setCardOverlay] = useState('rgba(0,0,0,0.3)')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  useEffect(() => { loadAll() }, [id])

  const loadAll = async () => {
    setLoading(true)
    const supabase = createClient()
    const [tR, tkR, aR, cR, tcR, pR] = await Promise.all([
      supabase.from('tenants').select('*').eq('id', id).single(),
      supabase.from('design_tokens').select('*').eq('tenant_id', id).eq('mode', 'light').single(),
      supabase.from('design_assets').select('*').eq('tenant_id', id).single(),
      supabase.from('courses').select('id, title, status, category').eq('status', 'published'),
      supabase.from('tenant_courses').select('*, courses(id, title)').eq('tenant_id', id),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', id),
    ])
    setTenant(tR.data); setAssets(aR.data); setCourses(cR.data ?? [])
    setTenantCourses(tcR.data ?? []); setStats({ profiles: pR.count ?? 0 })
    if (tkR.data) {
      const t = tkR.data
      setPrimaryColor(t.color_primary_500 ?? '#3b82f6')
      setSecondaryColor(t.color_secondary_500 ?? '#22c55e')
      setTertiaryColor(t.color_tertiary_500 ?? '#d946ef')
      setSidebarBg(t.color_sidebar_bg ?? '#1f2937')
      setHeaderBg(t.color_header_bg ?? '#ffffff')
      setHeaderText(t.color_header_text ?? '#111827')
      setBgPage(t.color_bg_page ?? '#ffffff')
      setBgSurface(t.color_bg_surface ?? '#f9fafb')
      setSuccessColor(t.color_success ?? '#22c55e')
      setWarningColor(t.color_warning ?? '#f59e0b')
      setErrorColor(t.color_error ?? '#ef4444')
    }
    if (aR.data) {
      setCardGradient(aR.data.card_bg_gradient_css ?? '')
      setCardOverlay(aR.data.card_overlay_color ?? 'rgba(0,0,0,0.3)')
    }
    setLoading(false)
  }

  const saveTenantInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)
    const supabase = createClient()
    const { error } = await supabase.from('tenants').update({
      name: form.get('name') as string,
      slug: form.get('slug') as string,
      custom_domain: (form.get('custom_domain') as string) || null,
      allow_self_registration: form.get('allow_self_registration') === 'on',
      completion_threshold: parseFloat(form.get('completion_threshold') as string) || 80,
      contract_start: (form.get('contract_start') as string) || null,
      contract_end: (form.get('contract_end') as string) || null,
    }).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Dados salvos!'); loadAll() }
    setSaving(false)
  }

  const saveDesignSystem = async () => {
    setSaving(true)
    const supabase = createClient()
    const pp = generatePaletteFromBase(primaryColor)
    const sp = generatePaletteFromBase(secondaryColor)
    const tp = generatePaletteFromBase(tertiaryColor)
    const { error } = await supabase.from('design_tokens').upsert({
      tenant_id: id, mode: 'light',
      color_primary_50: pp['50'], color_primary_100: pp['100'], color_primary_200: pp['200'],
      color_primary_300: pp['300'], color_primary_400: pp['400'], color_primary_500: pp['500'],
      color_primary_600: pp['600'], color_primary_700: pp['700'], color_primary_800: pp['800'], color_primary_900: pp['900'],
      color_secondary_50: sp['50'], color_secondary_100: sp['100'], color_secondary_200: sp['200'],
      color_secondary_300: sp['300'], color_secondary_400: sp['400'], color_secondary_500: sp['500'],
      color_secondary_600: sp['600'], color_secondary_700: sp['700'], color_secondary_800: sp['800'], color_secondary_900: sp['900'],
      color_tertiary_50: tp['50'], color_tertiary_500: tp['500'],
      color_sidebar_bg: sidebarBg, color_sidebar_text: '#f9fafb', color_sidebar_active: primaryColor,
      color_header_bg: headerBg, color_header_text: headerText,
      color_bg_page: bgPage, color_bg_surface: bgSurface,
      color_success: successColor, color_warning: warningColor, color_error: errorColor,
      color_btn_primary_bg: primaryColor, color_btn_primary_hover: pp['600'], color_btn_primary_text: '#fff',
      color_progress_fill: primaryColor, color_text_link: primaryColor,
      color_border_focus: primaryColor, color_input_focus_ring: primaryColor,
    }, { onConflict: 'tenant_id,mode' })
    await supabase.from('design_assets').update({
      card_bg_gradient_css: cardGradient || null, card_overlay_color: cardOverlay,
    }).eq('tenant_id', id)
    if (error) toast.error(error.message)
    else toast.success('Design System salvo!')
    setSaving(false)
  }

  const handleAssetUpload = useCallback(async (key: string, file: File) => {
    setUploadingKey(key)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('bucket', 'tenant-assets')
    fd.append('path', `${id}/${key.replace('_url', '')}-${Date.now()}.${file.name.split('.').pop()}`)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) {
      const supabase = createClient()
      await supabase.from('design_assets').update({ [key]: data.url }).eq('tenant_id', id)
      toast.success(`${key.replace(/_url$/, '').replace(/_/g, ' ')} atualizado!`)
      loadAll()
    } else {
      toast.error(data.error ?? 'Erro no upload')
    }
    setUploadingKey(null)
  }, [id])

  const toggleCourse = async (courseId: string, isActive: boolean) => {
    const supabase = createClient()
    if (isActive) await supabase.from('tenant_courses').delete().eq('tenant_id', id).eq('course_id', courseId)
    else await supabase.from('tenant_courses').insert({ tenant_id: id, course_id: courseId })
    toast.success(isActive ? 'Curso removido' : 'Curso adicionado')
    loadAll()
  }

  const applyPreset = (p: typeof DEFAULT_PRESETS[0]) => {
    setPrimaryColor(p.colors.primary500); setSecondaryColor(p.colors.secondary500)
    setSidebarBg(p.colors.sidebarBg); setBgPage(p.colors.bgPage); setBgSurface(p.colors.bgSurface)
    setSelectedPreset(p.name)
  }

  const primaryPalette = generatePaletteFromBase(primaryColor)

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (!tenant) return <p className="text-gray-500 p-8">Tenant nao encontrado</p>

  const contractedIds = new Set(tenantCourses.map((tc: any) => tc.courses?.id))

  return (
    <div className="min-h-screen">
      {/* HEADER */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/admin/tenants" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-400" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900">{tenant.name}</h1>
                <Badge variant={tenant.active ? 'default' : 'secondary'}>{tenant.active ? 'Ativo' : 'Inativo'}</Badge>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{tenant.slug}</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{stats.profiles} alunos</span>
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{tenantCourses.length} cursos</span>
              </div>
            </div>
          </div>

          {/* Section Navigation */}
          <nav className="flex gap-1">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeSection === s.id
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6 max-w-6xl">

        {/* ============ INFORMACOES ============ */}
        {activeSection === 'info' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Dados da Empresa</h2>
              <p className="text-sm text-gray-500 mt-1">Informacoes gerais, contrato e configuracoes do tenant</p>
            </div>

            <form onSubmit={saveTenantInfo} className="space-y-8">
              {/* Dados basicos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-gray-400" />Dados Basicos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da empresa</Label>
                      <Input name="name" defaultValue={tenant.name} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug (subdominio)</Label>
                      <div className="flex items-center">
                        <Input name="slug" defaultValue={tenant.slug} required className="rounded-r-none" />
                        <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-md text-sm text-gray-500">.plataforma.com.br</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-gray-400" />Dominio customizado</Label>
                    <Input name="custom_domain" defaultValue={tenant.custom_domain ?? ''} placeholder="ead.empresa.com.br" />
                    <p className="text-xs text-gray-400">Configure um CNAME apontando para cname.vercel-dns.com</p>
                  </div>
                </CardContent>
              </Card>

              {/* Contrato */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" />Contrato</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Inicio do contrato</Label>
                      <Input name="contract_start" type="date" defaultValue={tenant.contract_start ?? ''} />
                    </div>
                    <div className="space-y-2">
                      <Label>Fim do contrato</Label>
                      <Input name="contract_end" type="date" defaultValue={tenant.contract_end ?? ''} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configuracoes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4 text-gray-400" />Configuracoes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-medium">Auto-registro de alunos</p>
                      <p className="text-xs text-gray-500">Permite que alunos se cadastrem sem convite</p>
                    </div>
                    <input type="checkbox" name="allow_self_registration" defaultChecked={tenant.allow_self_registration}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Percent className="h-3.5 w-3.5 text-gray-400" />Threshold para certificado</Label>
                    <div className="flex items-center gap-2">
                      <Input name="completion_threshold" type="number" min={0} max={100}
                        defaultValue={tenant.completion_threshold ?? 80} className="max-w-[100px]" />
                      <span className="text-sm text-gray-500">% de aulas obrigatorias</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" disabled={saving} size="lg">
                <Save className="h-4 w-4 mr-2" />{saving ? 'Salvando...' : 'Salvar Informacoes'}
              </Button>
            </form>
          </div>
        )}

        {/* ============ DESIGN SYSTEM ============ */}
        {activeSection === 'design' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Design System</h2>
                <p className="text-sm text-gray-500 mt-1">Personalize cores, layout e identidade visual da plataforma</p>
              </div>
              <Button onClick={saveDesignSystem} disabled={saving} size="lg">
                <Save className="h-4 w-4 mr-2" />{saving ? 'Salvando...' : 'Salvar Design System'}
              </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Left: Controls */}
              <div className="xl:col-span-4 space-y-5">
                {/* Presets */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Presets</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-2">
                    {DEFAULT_PRESETS.map(p => (
                      <button key={p.name} onClick={() => applyPreset(p)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          selectedPreset === p.name ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-transparent bg-gray-50 hover:bg-gray-100'
                        }`}>
                        <div className="flex -space-x-1">
                          <div className="w-7 h-7 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: p.colors.primary500 }} />
                          <div className="w-7 h-7 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: p.colors.secondary500 }} />
                          <div className="w-7 h-7 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: p.colors.sidebarBg }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{p.description}</p>
                        </div>
                        {selectedPreset === p.name && <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />}
                      </button>
                    ))}
                  </CardContent>
                </Card>

                {/* Cores */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Cores Principais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ColorRow label="Primaria" value={primaryColor} onChange={v => { setPrimaryColor(v); setSelectedPreset(null) }} />
                    <ColorRow label="Secundaria" value={secondaryColor} onChange={v => { setSecondaryColor(v); setSelectedPreset(null) }} />
                    <ColorRow label="Terciaria" value={tertiaryColor} onChange={v => { setTertiaryColor(v); setSelectedPreset(null) }} />
                    <Separator />
                    <ColorRow label="Header fundo" value={headerBg} onChange={setHeaderBg} />
                    <ColorRow label="Header texto" value={headerText} onChange={setHeaderText} />
                    <ColorRow label="Sidebar" value={sidebarBg} onChange={setSidebarBg} />
                    <Separator />
                    <ColorRow label="Fundo pagina" value={bgPage} onChange={setBgPage} />
                    <ColorRow label="Fundo cards" value={bgSurface} onChange={setBgSurface} />
                    <Separator />
                    <ColorRow label="Sucesso" value={successColor} onChange={setSuccessColor} />
                    <ColorRow label="Alerta" value={warningColor} onChange={setWarningColor} />
                    <ColorRow label="Erro" value={errorColor} onChange={setErrorColor} />
                  </CardContent>
                </Card>

                {/* Cards */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Cards de Curso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">Gradiente CSS</Label>
                      <Input value={cardGradient} onChange={e => setCardGradient(e.target.value)}
                        placeholder="linear-gradient(135deg, #1a5276, #2e86c1)" className="text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">Overlay</Label>
                      <Input value={cardOverlay} onChange={e => setCardOverlay(e.target.value)}
                        placeholder="rgba(0,0,0,0.3)" className="text-xs" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Preview */}
              <div className="xl:col-span-8 space-y-4">
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Preview ao vivo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl overflow-hidden shadow-lg border">
                      {/* Header */}
                      <div className="h-14 flex items-center justify-between px-5" style={{ backgroundColor: headerBg, color: headerText, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                        {assets?.logo_horizontal_url
                          ? <img src={assets.logo_horizontal_url} alt="" className="h-7 object-contain" />
                          : <span className="font-bold">{tenant.name}</span>
                        }
                        <div className="flex gap-5 text-sm opacity-80"><span>Cursos</span><span>Certificados</span><span>Comunidade</span></div>
                      </div>
                      <div className="flex">
                        {/* Sidebar */}
                        <div className="w-48 p-4 min-h-[380px] text-sm" style={{ backgroundColor: sidebarBg, color: '#f9fafb' }}>
                          <p className="text-[10px] uppercase tracking-widest opacity-40 mb-4">Navegacao</p>
                          {['Dashboard', 'Meus Cursos', 'Certificados', 'Comunidade', 'Perfil'].map((item, i) => (
                            <p key={item} className={`py-2 px-3 rounded-lg mb-1 text-sm transition-all ${
                              i === 0 ? 'text-white font-medium' : 'opacity-50'
                            }`} style={i === 0 ? { backgroundColor: primaryColor } : {}}>
                              {item}
                            </p>
                          ))}
                        </div>
                        {/* Content */}
                        <div className="flex-1 p-5" style={{ backgroundColor: bgPage }}>
                          <p className="text-lg font-bold mb-1" style={{ color: headerText }}>Ola, Admin!</p>
                          <p className="text-sm opacity-60 mb-5" style={{ color: headerText }}>Continue seus estudos</p>
                          <div className="grid grid-cols-2 gap-4 mb-5">
                            {['Gestao Publica', 'Atendimento'].map((name, i) => (
                              <div key={i} className="rounded-xl overflow-hidden shadow-sm border" style={{ backgroundColor: bgSurface }}>
                                <div className="h-24 relative" style={{ background: cardGradient || `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                                  <div className="absolute inset-0" style={{ backgroundColor: cardOverlay }} />
                                  <div className="absolute bottom-2 left-3 right-3">
                                    <div className="h-1.5 rounded-full bg-white/30">
                                      <div className="h-1.5 rounded-full bg-white" style={{ width: `${50 + i * 25}%` }} />
                                    </div>
                                  </div>
                                </div>
                                <div className="p-3">
                                  <p className="font-semibold text-sm" style={{ color: headerText }}>{name}</p>
                                  <p className="text-xs opacity-50 mt-0.5">{50 + i * 25}% concluido</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button className="px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm" style={{ backgroundColor: primaryColor }}>Botao Primario</button>
                            <button className="px-4 py-2 rounded-lg text-sm font-medium border-2" style={{ color: primaryColor, borderColor: primaryColor }}>Secundario</button>
                            <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: errorColor }}>Danger</button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: successColor }}>Concluido</span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: warningColor }}>Em progresso</span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: errorColor }}>Atrasado</span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: tertiaryColor }}>Novo</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Palette Strip */}
                    <div className="mt-5">
                      <p className="text-xs font-medium text-gray-400 mb-2">Paleta gerada automaticamente</p>
                      <div className="flex rounded-xl overflow-hidden shadow-sm">
                        {Object.entries(primaryPalette).map(([shade, color]) => (
                          <div key={shade} className="flex-1 group relative">
                            <div className="h-12 transition-transform group-hover:scale-y-125 origin-bottom" style={{ backgroundColor: color }} />
                            <p className="text-center text-[9px] text-gray-400 mt-1">{shade}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ============ ASSETS ============ */}
        {activeSection === 'assets' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Marca & Assets</h2>
              <p className="text-sm text-gray-500 mt-1">Faca upload de logos, banners e elementos visuais. Arraste ou clique para enviar.</p>
            </div>

            {ASSET_GROUPS.map(group => (
              <div key={group.title}>
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-800">{group.title}</h3>
                  <p className="text-sm text-gray-400">{group.description}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {group.items.map(item => (
                    <AssetUploadCard
                      key={item.key}
                      assetKey={item.key}
                      label={item.label}
                      hint={item.hint}
                      currentUrl={assets?.[item.key] ?? null}
                      onUpload={handleAssetUpload}
                      uploading={uploadingKey === item.key}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ============ CURSOS ============ */}
        {activeSection === 'cursos' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Cursos Contratados</h2>
              <p className="text-sm text-gray-500 mt-1">Ative ou desative cursos disponiveis para este tenant</p>
            </div>

            <div className="space-y-3">
              {courses.map((course: any) => {
                const isActive = contractedIds.has(course.id)
                return (
                  <div key={course.id} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    isActive ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <BookOpen className={`h-5 w-5 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{course.title}</p>
                        <p className="text-xs text-gray-400">{course.category ?? 'Sem categoria'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isActive && <Badge className="bg-green-100 text-green-700 border-0">Ativo</Badge>}
                      <Button
                        variant={isActive ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => toggleCourse(course.id, isActive)}
                        className={isActive ? 'text-red-500 border-red-200 hover:bg-red-50' : ''}
                      >
                        {isActive ? 'Remover' : 'Adicionar'}
                      </Button>
                    </div>
                  </div>
                )
              })}
              {courses.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>Nenhum curso publicado disponivel</p>
                  <p className="text-sm">Publique cursos no painel de cursos primeiro</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
