'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LiveChat } from '@/components/live/LiveChat'
import { Radio, Play, Square, Copy, CheckCircle, Monitor } from 'lucide-react'

interface AdminStudioViewerProps {
  sessionId: string
  title: string
  instructorName: string
  initialStatus: string
  playbackId: string | null
  streamKey: string | null
  adminName: string
}

export function AdminStudioViewer({
  sessionId,
  title,
  instructorName,
  initialStatus,
  playbackId,
  streamKey,
  adminName,
}: AdminStudioViewerProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

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
        if (newStatus === 'ended') {
          router.refresh()
        }
      } else {
        const err = await res.json().catch(() => ({}))
        alert(`Erro: ${err.error || 'Falha ao alterar status'}`)
      }
    } finally {
      setLoading(null)
      setConfirmEnd(false)
    }
  }

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const statusBadge = () => {
    switch (status) {
      case 'live':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Radio className="h-3 w-3 animate-pulse" /> AO VIVO
          </Badge>
        )
      case 'scheduled':
        return <Badge variant="secondary">Agendada</Badge>
      case 'ended':
        return <Badge variant="outline">Encerrada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const rtmpUrl = 'rtmps://global-live.mux.com:443/app'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{title}</h1>
            {statusBadge()}
          </div>
          <p className="text-gray-500">{instructorName}</p>
        </div>
      </div>

      {/* Controls bar */}
      {status !== 'ended' && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Monitor className="h-4 w-4" />
                {status === 'live'
                  ? 'Live aberta - chat ativo. OBS pode desconectar e reconectar livremente.'
                  : 'Configure o OBS abaixo e clique em Iniciar Live para abrir a transmissao.'}
              </div>

              <div className="flex items-center gap-2">
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
                      className="border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Encerrar Live
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-red-600 font-medium">Confirmar? O chat sera desativado.</span>
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main content: Player + Chat */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: Player / OBS config */}
        <div className="lg:w-[65%] space-y-4">
          {/* Player preview */}
          {playbackId && status === 'live' ? (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Radio className="h-4 w-4 text-red-500" />
                  Preview do stream
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-b-lg overflow-hidden">
                  <iframe
                    src={`https://stream.mux.com/${playbackId}`}
                    className="w-full h-full"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>
          ) : status === 'scheduled' ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Radio className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg">Aguardando inicio da transmissao</p>
                <p className="text-gray-400 text-sm mt-1">
                  Configure o OBS com os dados abaixo e clique em &quot;Iniciar Live&quot;
                </p>
              </CardContent>
            </Card>
          ) : status === 'ended' ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Square className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg">Sessao encerrada</p>
              </CardContent>
            </Card>
          ) : null}

          {/* OBS config (show when not ended) */}
          {status !== 'ended' && streamKey && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Dados do OBS Studio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Servidor RTMP</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono">{rtmpUrl}</code>
                    <Button variant="outline" size="icon" onClick={() => copy(rtmpUrl, 'rtmp')}>
                      {copied === 'rtmp' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Stream Key</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono break-all">{streamKey}</code>
                    <Button variant="outline" size="icon" onClick={() => copy(streamKey, 'key')}>
                      {copied === 'key' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 pt-1">
                  Conecte e desconecte o OBS quantas vezes quiser - a live so encerra quando voce clicar em Encerrar Live.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Chat */}
        <div className="lg:w-[35%] h-[500px] lg:h-[600px]">
          {status === 'ended' ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <p className="text-gray-400">Chat encerrado</p>
              </CardContent>
            </Card>
          ) : status === 'scheduled' ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <p className="text-gray-400 text-sm">O chat sera aberto quando voce iniciar a live.</p>
              </CardContent>
            </Card>
          ) : (
            <LiveChat
              sessionId={sessionId}
              profileId={null}
              profileName={adminName}
              isInstructor
            />
          )}
        </div>
      </div>
    </div>
  )
}
