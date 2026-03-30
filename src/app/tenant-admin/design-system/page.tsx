'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { DEFAULT_PRESETS, generatePaletteFromBase } from '@/lib/design-system/presets'

export default function DesignSystemPage() {
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [secondaryColor, setSecondaryColor] = useState('#22c55e')
  const [sidebarBg, setSidebarBg] = useState('#1f2937')
  const [loading, setLoading] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const applyPreset = (preset: typeof DEFAULT_PRESETS[0]) => {
    setPrimaryColor(preset.colors.primary500)
    setSecondaryColor(preset.colors.secondary500)
    setSidebarBg(preset.colors.sidebarBg)
    setSelectedPreset(preset.name)
  }

  const primaryPalette = generatePaletteFromBase(primaryColor)
  const secondaryPalette = generatePaletteFromBase(secondaryColor)

  const handleSave = async () => {
    setLoading(true)
    // Save via API
    toast.success('Design System salvo!')
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Editor de Identidade Visual</h1>
        <Button onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle>Paletas Pré-definidas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {DEFAULT_PRESETS.map(preset => (
                <button key={preset.name} onClick={() => applyPreset(preset)} className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedPreset === preset.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.colors.primary500 }} />
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.colors.secondary500 }} />
                    <span className="text-sm font-medium">{preset.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{preset.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Cores</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Cor Primária</Label><div className="flex gap-2"><Input type="color" value={primaryColor} onChange={e => { setPrimaryColor(e.target.value); setSelectedPreset(null) }} className="w-12 h-10 p-1" /><Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} /></div></div>
              <div><Label>Cor Secundária</Label><div className="flex gap-2"><Input type="color" value={secondaryColor} onChange={e => { setSecondaryColor(e.target.value); setSelectedPreset(null) }} className="w-12 h-10 p-1" /><Input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} /></div></div>
              <div><Label>Sidebar</Label><div className="flex gap-2"><Input type="color" value={sidebarBg} onChange={e => setSidebarBg(e.target.value)} className="w-12 h-10 p-1" /><Input value={sidebarBg} onChange={e => setSidebarBg(e.target.value)} /></div></div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="h-12 flex items-center px-4 text-white" style={{ backgroundColor: primaryColor }}>
                  <span className="font-bold">Header do Tenant</span>
                </div>
                <div className="flex">
                  <div className="w-48 p-4 min-h-[300px] text-white text-sm" style={{ backgroundColor: sidebarBg }}>
                    <p className="mb-2 opacity-70">Menu</p>
                    <p className="mb-1 py-1 px-2 rounded" style={{ backgroundColor: primaryColor }}>Dashboard</p>
                    <p className="mb-1 py-1 px-2 opacity-70">Cursos</p>
                    <p className="mb-1 py-1 px-2 opacity-70">Certificados</p>
                  </div>
                  <div className="flex-1 p-6 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2].map(i => (
                        <div key={i} className="bg-white rounded-lg border overflow-hidden">
                          <div className="h-24" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} />
                          <div className="p-3">
                            <p className="font-semibold text-sm">Curso exemplo {i}</p>
                            <div className="mt-2 h-2 rounded-full bg-gray-200"><div className="h-2 rounded-full" style={{ width: '60%', backgroundColor: primaryColor }} /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button className="px-4 py-2 rounded text-white text-sm" style={{ backgroundColor: primaryColor }}>Botão Primário</button>
                      <button className="px-4 py-2 rounded text-sm border">Botão Secundário</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Paleta gerada (50-900):</p>
                <div className="flex gap-1">
                  {Object.entries(primaryPalette).map(([shade, color]) => (
                    <div key={shade} className="flex-1 text-center">
                      <div className="h-8 rounded" style={{ backgroundColor: color }} />
                      <p className="text-[10px] mt-1">{shade}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
