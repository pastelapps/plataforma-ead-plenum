'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, SkipForward, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VideoCompletionOverlayProps {
  courseSlug: string
  nextLessonSlug: string | null
  onReplay: () => void
}

export function VideoCompletionOverlay({
  courseSlug,
  nextLessonSlug,
  onReplay,
}: VideoCompletionOverlayProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(nextLessonSlug ? 5 : null)

  useEffect(() => {
    if (countdown === null || countdown <= 0) return

    const timer = setTimeout(() => {
      setCountdown((c) => (c !== null ? c - 1 : null))
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown])

  useEffect(() => {
    if (countdown === 0 && nextLessonSlug) {
      router.push(`/cursos/${courseSlug}/aula/${nextLessonSlug}`)
    }
  }, [countdown, nextLessonSlug, courseSlug, router])

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
      <CheckCircle className="size-12 text-[#22c55e]" />
      <h3 className="text-xl font-bold text-white">Aula concluída!</h3>

      {nextLessonSlug ? (
        <>
          <p className="text-sm text-white/60">
            Próxima aula em {countdown}s...
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onReplay}
              className="border-[#333] text-[#ccc] hover:text-white hover:border-[#555]"
            >
              <RotateCcw className="size-4 mr-1" />
              Assistir novamente
            </Button>
            <Button
              size="sm"
              onClick={() =>
                router.push(`/cursos/${courseSlug}/aula/${nextLessonSlug}`)
              }
              className="bg-[var(--color-primary-500,#1ed6e4)] text-black hover:opacity-90"
            >
              <SkipForward className="size-4 mr-1" />
              Próxima aula
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-white/60">
            Parabéns! Você concluiu o módulo.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onReplay}
            className="border-[#333] text-[#ccc] hover:text-white hover:border-[#555]"
          >
            <RotateCcw className="size-4 mr-1" />
            Assistir novamente
          </Button>
        </>
      )}
    </div>
  )
}
