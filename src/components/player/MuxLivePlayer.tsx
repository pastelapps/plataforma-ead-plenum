'use client'

import MuxPlayer from '@mux/mux-player-react'
import { useState } from 'react'
import { Radio, Loader2 } from 'lucide-react'

interface MuxLivePlayerProps {
  playbackId: string
  streamType?: 'live' | 'on-demand'
  title?: string
}

export function MuxLivePlayer({ playbackId, streamType = 'live', title }: MuxLivePlayerProps) {
  const [waiting, setWaiting] = useState(false)

  const isLive = streamType === 'live'

  return (
    <div
      className="relative w-full bg-black rounded-xl overflow-hidden"
      style={{ aspectRatio: '16/9' }}
    >
      <MuxPlayer
        playbackId={playbackId}
        streamType={streamType}
        metadata={{ video_title: title ?? 'Live Session' }}
        autoPlay="muted"
        style={{ width: '100%', height: '100%' }}
        onError={(evt: unknown) => {
          if (!isLive) return
          const e = evt as { detail?: { code?: number } }
          // Mux/HLS codes ~2xx are network errors (no stream yet)
          const code = e?.detail?.code
          if (code === undefined || code >= 2) setWaiting(true)
        }}
        onPlaying={() => setWaiting(false)}
        onLoadedData={() => setWaiting(false)}
      />

      {waiting && isLive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 text-center p-6 pointer-events-none">
          <div className="relative mb-4">
            <Radio className="h-10 w-10 text-red-500 animate-pulse" />
            <Loader2 className="h-4 w-4 text-white absolute -right-1 -bottom-1 animate-spin" />
          </div>
          <p className="text-white text-lg font-semibold">Aguardando sinal do instrutor</p>
          <p className="text-gray-300 text-sm mt-1">A live esta aberta - o video comeca assim que o instrutor ligar o OBS.</p>
        </div>
      )}
    </div>
  )
}
