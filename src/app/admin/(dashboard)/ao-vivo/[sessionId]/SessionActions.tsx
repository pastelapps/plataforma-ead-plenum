'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Copy, CheckCircle, Radio, Play, Square, AlertCircle } from 'lucide-react'

interface SessionActionsProps {
  streamKey: string | null
  playbackId: string | null
  status: string
  sessionId: string
}

export function SessionActions({ streamKey, playbackId, status: initialStatus, sessionId }: SessionActionsProps) {
  const router = useRouter()
  const [copied, setCopied] = useState<string | null>(null)
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmEnd, setConfirmEnd] = useState(false)

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const changeStatus = async (newStatus: string) => {
    setLoading(newStatus)
    try {
      const res = await fetch(`/api/admin/live-sessions/${sessionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        const data = await res.json()
        setStatus(data.status)
        setConfirmEnd(false)
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(`Erro: ${err.error || 'Falha ao alterar status'}`)
      }
    } catch {
      alert('Erro de conexao')
    } finally {
      setLoading(null)
    }
  }

  const rtmpUrl = 'rtmps://global-live.mux.com:443/app'

  return (
    <div className="space-y-4">
      {/* Session controls - ALWAYS visible unless ended */}
      <Card className={status === 'live' ? 'border-red-200' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Radio className="h-5 w-5" />
            Controle da Live
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'live' && (
            <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live aberta - chat habilitado (o OBS pode ir e voltar sem fechar a live)
            </div>
          )}
          {status === 'scheduled' && (
            <p className="text-sm text-gray-500">
              Clique em <strong>Iniciar Live</strong> para abrir a sala e o chat - os inscritos ja poderao conversar entre si mesmo antes do video comecar. A live so encerra quando voce clicar em Encerrar.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {status === 'scheduled' && (
              <Button
                onClick={() => changeStatus('live')}
                disabled={loading !== null}
                className="bg-red-600 hover:bg-red-700"
              >
                <Play className="h-4 w-4 mr-2" />
                {loading === 'live' ? 'Iniciando...' : 'Iniciar Live'}
              </Button>
            )}

            {status === 'live' && (
              !confirmEnd ? (
                <Button
                  onClick={() => setConfirmEnd(true)}
                  disabled={loading !== null}
                  variant="outline"
                  className="text-gray-600"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Encerrar Live
                </Button>
              ) : (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-red-600 font-medium">Tem certeza? O chat sera desativado.</span>
                  <Button
                    onClick={() => changeStatus('ended')}
                    disabled={loading !== null}
                    size="sm"
                    variant="destructive"
                  >
                    {loading === 'ended' ? 'Encerrando...' : 'Sim, encerrar'}
                  </Button>
                  <Button
                    onClick={() => setConfirmEnd(false)}
                    size="sm"
                    variant="ghost"
                  >
                    Cancelar
                  </Button>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* OBS config (only if stream key exists) */}
      {streamKey ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados do OBS Studio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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

            {playbackId && status === 'live' && (
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
                <p className="text-xs text-gray-400 mt-1">Se nao estiver transmitindo no OBS, aparece &quot;Aguardando sinal&quot; - isso nao fecha a live.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-medium">Esta sessao nao tem credenciais do Mux.</p>
              <p className="mt-1">Voce ainda pode abrir a live para usar o chat com os inscritos. Para transmitir video, crie uma nova sessao (a criacao gera o stream key automaticamente).</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
