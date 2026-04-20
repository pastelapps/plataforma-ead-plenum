'use client'

import Link from 'next/link'
import { Radio } from 'lucide-react'

interface LiveNowBannerProps {
  sessionId: string
  title: string
  instructorName?: string | null
}

export function LiveNowBanner({ sessionId, title, instructorName }: LiveNowBannerProps) {
  return (
    <Link href={`/ao-vivo/${sessionId}`} className="block">
      <div className="relative overflow-hidden rounded-xl animate-in slide-in-from-top-4 duration-500">
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-transparent" />

        <div className="relative flex items-center justify-between p-5">
          <div className="flex items-center gap-4">
            {/* Pulsing radio icon */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                <Radio className="h-5 w-5 text-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-red-100 bg-white/20 px-2 py-0.5 rounded">
                  AO VIVO AGORA
                </span>
              </div>
              <p className="text-white font-semibold text-lg">{title}</p>
              {instructorName && (
                <p className="text-red-100 text-sm">{instructorName}</p>
              )}
            </div>
          </div>

          <span className="shrink-0 bg-white text-red-600 font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-red-50 transition-colors">
            Assistir agora
          </span>
        </div>
      </div>
    </Link>
  )
}
