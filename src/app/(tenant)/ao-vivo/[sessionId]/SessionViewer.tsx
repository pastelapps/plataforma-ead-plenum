'use client'

import { useState, useEffect } from 'react'
import { MuxLivePlayer } from '@/components/player/MuxLivePlayer'
import { LiveChat } from '@/components/live/LiveChat'
import { Clock, Radio, Video } from 'lucide-react'

interface SessionViewerProps {
  sessionId: string
  status: string
  playbackId: string | null
  recordingPlaybackId: string | null
  recordingAvailable: boolean
  scheduledStart: string
  title: string
  profileId: string
  profileName: string
}

export function SessionViewer({
  sessionId,
  status,
  playbackId,
  recordingPlaybackId,
  recordingAvailable,
  scheduledStart,
  title,
  profileId,
  profileName,
}: SessionViewerProps) {
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    if (status !== 'scheduled') return

    const update = () => {
      const diff = new Date(scheduledStart).getTime() - Date.now()
      if (diff <= 0) {
        setCountdown('Iniciando...')
        return
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / (1000 * 60)) % 60)
      const seconds = Math.floor((diff / 1000) % 60)

      const parts = []
      if (days > 0) parts.push(`${days}d`)
      parts.push(`${hours.toString().padStart(2, '0')}h`)
      parts.push(`${minutes.toString().padStart(2, '0')}m`)
      parts.push(`${seconds.toString().padStart(2, '0')}s`)
      setCountdown(parts.join(' '))
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [status, scheduledStart])

  // Live - show player (or waiting-for-stream message) + chat side by side
  if (status === 'live') {
    return (
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Player - 70% on desktop */}
        <div className="lg:w-[70%] rounded-xl overflow-hidden">
          {playbackId ? (
            <MuxLivePlayer playbackId={playbackId} streamType="live" title={title} />
          ) : (
            <div className="rounded-xl bg-white/5 border border-white/10 aspect-video flex flex-col items-center justify-center p-8 text-center">
              <Radio className="h-10 w-10 mb-3 text-red-500 animate-pulse" />
              <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Transmissao ainda nao configurada
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Aguarde o instrutor iniciar o video. O chat ja esta aberto!
              </p>
            </div>
          )}
        </div>

        {/* Chat - 30% on desktop, full width on mobile */}
        <div className="lg:w-[30%] h-[400px] lg:h-auto lg:min-h-[500px]">
          <LiveChat
            sessionId={sessionId}
            profileId={profileId}
            profileName={profileName}
          />
        </div>
      </div>
    )
  }

  // Ended with recording available - player only, no chat
  if (status === 'ended' && recordingAvailable && recordingPlaybackId) {
    return (
      <div className="max-w-5xl">
        <div className="flex items-center gap-2 mb-4 text-gray-400">
          <Video className="h-4 w-4" /> Gravação da sessão
        </div>
        <div className="rounded-xl overflow-hidden">
          <MuxLivePlayer playbackId={recordingPlaybackId} streamType="on-demand" title={title} />
        </div>
      </div>
    )
  }

  // Ended without recording
  if (status === 'ended') {
    return (
      <div className="rounded-xl bg-white/5 border border-white/10 p-12 text-center">
        <Video className="h-12 w-12 mx-auto mb-4 text-gray-600" />
        <p className="text-gray-400 text-lg">Sessão encerrada</p>
        <p className="text-gray-500 text-sm mt-1">A gravação ainda não foi disponibilizada pelo administrador.</p>
      </div>
    )
  }

  // Scheduled - show countdown
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-12 text-center">
      <Clock className="h-12 w-12 mx-auto mb-4 text-blue-400" />
      <p className="text-gray-400 text-lg mb-2">A sessão começará em</p>
      <p className="text-4xl font-bold text-white font-mono">{countdown || '...'}</p>
    </div>
  )
}
