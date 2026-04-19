'use client'

import MuxPlayer from '@mux/mux-player-react'

interface MuxLivePlayerProps {
  playbackId: string
  streamType?: 'live' | 'on-demand'
  title?: string
}

export function MuxLivePlayer({ playbackId, streamType = 'live', title }: MuxLivePlayerProps) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      streamType={streamType}
      metadata={{
        video_title: title ?? 'Live Session',
      }}
      autoPlay="muted"
      style={{
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    />
  )
}
