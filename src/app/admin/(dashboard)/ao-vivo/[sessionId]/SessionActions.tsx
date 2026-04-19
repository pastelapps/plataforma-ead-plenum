'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Copy, CheckCircle, Radio, ExternalLink } from 'lucide-react'

interface SessionActionsProps {
  streamKey: string
  playbackId: string | null
  status: string
  sessionId: string
}

export function SessionActions({ streamKey, playbackId, status, sessionId }: SessionActionsProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const rtmpUrl = 'rtmps://global-live.mux.com:443/app'

  return (
    <Card className={status === 'live' ? 'border-red-200' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5" />
          {status === 'live' ? 'Transmitindo ao Vivo' : 'Conectar OBS Studio'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'live' && (
          <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Stream ativo — transmitindo agora
          </div>
        )}

        <div>
          <Label className="text-xs text-gray-500 uppercase">Servidor RTMP</Label>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono">{rtmpUrl}</code>
            <Button variant="outline" size="icon" onClick={() => copy(rtmpUrl, 'rtmp')}>
              {copied === 'rtmp' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-xs text-gray-500 uppercase">Stream Key</Label>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono break-all">{streamKey}</code>
            <Button variant="outline" size="icon" onClick={() => copy(streamKey, 'key')}>
              {copied === 'key' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {playbackId && (
          <div>
            <Label className="text-xs text-gray-500 uppercase">Preview do Stream</Label>
            <div className="mt-2 rounded-lg overflow-hidden bg-black aspect-video">
              <iframe
                src={`https://stream.mux.com/${playbackId}`}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        )}

        <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-700">
          <p className="font-semibold mb-2">Passos para transmitir:</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>Abra o <strong>OBS Studio</strong></li>
            <li>Configuracoes → Transmissao → Servico: <strong>Personalizado</strong></li>
            <li>Cole o <strong>Servidor RTMP</strong> e a <strong>Stream Key</strong></li>
            <li>Configure cenas e fontes (webcam, tela, etc)</li>
            <li>Clique <strong>&quot;Iniciar Transmissao&quot;</strong></li>
            <li>A plataforma detecta automaticamente quando voce estiver ao vivo</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
