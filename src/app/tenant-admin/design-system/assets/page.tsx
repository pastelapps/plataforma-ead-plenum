'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'

const ASSET_FIELDS = [
  { key: 'logo_square', label: 'Logo Quadrado', desc: '512x512px, PNG/SVG' },
  { key: 'logo_horizontal', label: 'Logo Horizontal', desc: '300x80px, PNG/SVG' },
  { key: 'logo_dark', label: 'Logo (Dark)', desc: 'Versão para fundo escuro' },
  { key: 'favicon', label: 'Favicon', desc: '32x32px, ICO/PNG' },
  { key: 'login_banner', label: 'Banner Login', desc: '1920x1080px' },
  { key: 'login_banner_vertical', label: 'Banner Login Vertical', desc: '800x1200px' },
  { key: 'homepage_hero', label: 'Hero Homepage', desc: '1920x600px' },
  { key: 'homepage_hero_mobile', label: 'Hero Mobile', desc: '768x400px' },
  { key: 'certificate_bg', label: 'Fundo Certificado', desc: 'A4 landscape' },
  { key: 'certificate_logo', label: 'Logo Certificado', desc: 'Logo para o certificado' },
  { key: 'certificate_signature', label: 'Assinatura', desc: 'PNG transparente' },
]

export default function AssetsPage() {
  const [uploading, setUploading] = useState<string | null>(null)

  const handleUpload = async (key: string, file: File) => {
    setUploading(key)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'tenant-assets')
    formData.append('path', `assets/${key}-${Date.now()}.${file.name.split('.').pop()}`)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.error) { toast.error(data.error) } else { toast.success(`${key} enviado!`) }
    setUploading(null)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Assets da Marca</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ASSET_FIELDS.map(field => (
          <Card key={field.key}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{field.label}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500 mb-2">{field.desc}</p>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(field.key, f) }}
                  disabled={uploading === field.key}
                />
                {uploading === field.key && <span className="text-xs text-gray-500">Enviando...</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
