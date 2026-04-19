'use client'

import { useState, useEffect } from 'react'
import { MuxLivePlayer } from '@/components/player/MuxLivePlayer'
import { Clock, Radio, Video } from 'lucide-react'

interface SessionViewerProps {
  status: string
  playbackId: string | null
  recordingPlaybackId: string | null
  recordingAvailable: boolean
  scheduledStart: string
  title: string
}

export function SessionViewer({
  status,
  playbackId,
  recordingPlaybackId,
  recordingAvailable,
  scheduledStart,
  title,
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

  // Live - show live player
  if (status === 'live' && playbackId) {
    return (
      <div className="rounded-xl overflow-hidden">
        <MuxLivePlayer playbackId={playbackId} streamType="live" title={title} />
      </div>
    )
  }

  // Ended with recording available
  if (status === 'ended' && recordingAvailable && recordingPlaybackId) {
    return (
      <div>
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
