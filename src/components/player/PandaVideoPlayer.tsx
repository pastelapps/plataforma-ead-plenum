'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { VideoCompletionOverlay } from './VideoCompletionOverlay'

interface PandaVideoPlayerProps {
  pandaVideoId: string
  enrollmentId: string
  lessonId: string
  courseSlug: string
  nextLessonSlug: string | null
  startPosition?: number
  onCompleted?: () => void
  onProgressUpdate?: (percentage: number) => void
}

export function PandaVideoPlayer({
  pandaVideoId,
  enrollmentId,
  lessonId,
  courseSlug,
  nextLessonSlug,
  startPosition,
  onCompleted,
  onProgressUpdate,
}: PandaVideoPlayerProps) {
  const [playerUrl, setPlayerUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('loading')
  const [progress, setProgress] = useState(0)
  const [showCompletion, setShowCompletion] = useState(false)

  const lastSaveRef = useRef(0)
  const currentTimeRef = useRef(0)
  const durationRef = useRef(0)
  const completedRef = useRef(false)

  const saveProgress = useCallback(
    async (watchedSeconds: number, totalSeconds: number, pct: number) => {
      if (!enrollmentId) return
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enrollmentId,
            lessonId,
            watchedSeconds,
            totalSeconds,
            percentage: pct,
          }),
        })
      } catch {
        // Silently fail — will retry on next interval
      }
    },
    [enrollmentId, lessonId]
  )

  // Listen for Panda player postMessage events
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data || typeof event.data !== 'object') return

      const { type, currentTime, duration } = event.data

      if (type === 'panda_timeupdate') {
        currentTimeRef.current = currentTime || 0
        durationRef.current = duration || 0

        const pct = duration > 0 ? Math.floor((currentTime / duration) * 100) : 0
        setProgress(pct)
        onProgressUpdate?.(pct)

        // Save every ~10s
        const now = Date.now()
        if (now - lastSaveRef.current >= 10000) {
          lastSaveRef.current = now
          saveProgress(currentTime, duration, pct)
        }
      }

      if (type === 'panda_pause') {
        // Save on pause
        const pct =
          durationRef.current > 0
            ? Math.floor((currentTimeRef.current / durationRef.current) * 100)
            : 0
        saveProgress(currentTimeRef.current, durationRef.current, pct)
      }

      if (type === 'panda_ended' && !completedRef.current) {
        completedRef.current = true
        const pct = 100
        setProgress(pct)
        onProgressUpdate?.(pct)
        saveProgress(currentTimeRef.current, durationRef.current, pct)
        setShowCompletion(true)
        onCompleted?.()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [saveProgress, onCompleted, onProgressUpdate])

  // Also check percentage threshold for completion
  useEffect(() => {
    if (progress >= 90 && !completedRef.current && enrollmentId) {
      completedRef.current = true
      saveProgress(currentTimeRef.current, durationRef.current, progress)
      setShowCompletion(true)
      onCompleted?.()
    }
  }, [progress, enrollmentId, saveProgress, onCompleted])

  // Fetch player URL
  useEffect(() => {
    let cancelled = false

    async function fetchPlayerUrl() {
      try {
        const res = await fetch(`/api/panda/status?videoId=${pandaVideoId}`)
        const video = await res.json()

        if (cancelled) return

        if (video.video_player && video.video_external_id) {
          const metadata = encodeURIComponent(
            JSON.stringify({ enrollment_id: enrollmentId, lesson_id: lessonId })
          )
          let url = `${video.video_player}&metadata=${metadata}`
          if (startPosition && startPosition > 0) {
            url += `&t=${Math.floor(startPosition)}`
          }
          setPlayerUrl(url)
          setStatus('ready')
        } else if (video.status === 'CONVERTED') {
          let url = video.video_player
          if (startPosition && startPosition > 0) {
            url += (url.includes('?') ? '&' : '?') + `t=${Math.floor(startPosition)}`
          }
          setPlayerUrl(url)
          setStatus('ready')
        } else if (video.status === 'ERROR' || video.status === 'FAILED') {
          setStatus('error')
        } else {
          setStatus('processing')
          setTimeout(fetchPlayerUrl, 5000)
        }
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    fetchPlayerUrl()
    return () => {
      cancelled = true
    }
  }, [pandaVideoId, enrollmentId, lessonId, startPosition])

  // Save progress on unmount
  useEffect(() => {
    return () => {
      if (currentTimeRef.current > 0 && durationRef.current > 0) {
        const pct = Math.floor(
          (currentTimeRef.current / durationRef.current) * 100
        )
        // Fire-and-forget save on navigation away
        if (enrollmentId) {
          navigator.sendBeacon?.(
            '/api/progress',
            new Blob(
              [
                JSON.stringify({
                  enrollmentId,
                  lessonId,
                  watchedSeconds: currentTimeRef.current,
                  totalSeconds: durationRef.current,
                  percentage: pct,
                }),
              ],
              { type: 'application/json' }
            )
          )
        }
      }
    }
  }, [enrollmentId, lessonId])

  function handleReplay() {
    setShowCompletion(false)
    completedRef.current = false
    // Reload iframe to restart video
    if (playerUrl) {
      const url = new URL(playerUrl, window.location.origin)
      url.searchParams.delete('t')
      setPlayerUrl(url.toString())
    }
  }

  if (status === 'loading' || status === 'processing') {
    return (
      <div className="relative w-full aspect-video bg-black flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
        <p className="text-sm text-white/60">
          {status === 'processing'
            ? 'Vídeo em processamento...'
            : 'Carregando player...'}
        </p>
      </div>
    )
  }

  if (status === 'error' || !playerUrl) {
    return (
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        <p className="text-sm text-white/60">Erro ao carregar o vídeo.</p>
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        id={`panda-player-${pandaVideoId}`}
        src={playerUrl}
        style={{ border: 'none', width: '100%', height: '100%' }}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />

      {/* Progress bar */}
      {progress > 0 && !showCompletion && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-[var(--color-primary-500,#1ed6e4)] transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}

      {/* Completion overlay */}
      {showCompletion && (
        <VideoCompletionOverlay
          courseSlug={courseSlug}
          nextLessonSlug={nextLessonSlug}
          onReplay={handleReplay}
        />
      )}
    </div>
  )
}
