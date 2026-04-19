'use client'

import Link from 'next/link'
import { Radio, GraduationCap, BookOpen } from 'lucide-react'

interface QuickAccessCardsProps {
  nextLiveTitle?: string | null
  nextLiveDate?: string | null
  liveCount: number
  alumniCount: number
  coursesCount: number
}

export function QuickAccessCards({
  nextLiveTitle,
  nextLiveDate,
  liveCount,
  alumniCount,
  coursesCount,
}: QuickAccessCardsProps) {
  const cards = [
    {
      href: '/ao-vivo',
      icon: Radio,
      title: 'Aulas ao Vivo',
      subtitle: nextLiveTitle
        ? `Proxima: ${nextLiveTitle}`
        : 'Assista aulas ao vivo e gravacoes',
      detail: nextLiveDate ?? `${liveCount} sessoes`,
      gradient: 'linear-gradient(170deg, #ef4444 0%, #991b1b 50%, #450a0a 100%)',
      iconBg: 'rgba(255,255,255,0.15)',
      accentDot: '#ef4444',
    },
    {
      href: '/alumni',
      icon: GraduationCap,
      title: 'Alumni',
      subtitle: 'Conexoes, eventos e comunidade',
      detail: `${alumniCount} membros`,
      gradient: 'linear-gradient(170deg, #3b82f6 0%, #1e3a8a 50%, #172554 100%)',
      iconBg: 'rgba(255,255,255,0.15)',
      accentDot: '#3b82f6',
    },
    {
      href: '/cursos',
      icon: BookOpen,
      title: 'Cursos',
      subtitle: 'Trilhas e cursos disponiveis',
      detail: `${coursesCount} cursos`,
      gradient: 'linear-gradient(170deg, var(--color-primary-500, #8b5cf6) 0%, var(--color-primary-800, #3b0764) 50%, #1a0533 100%)',
      iconBg: 'rgba(255,255,255,0.15)',
      accentDot: 'var(--color-primary-500, #8b5cf6)',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-4" style={{ height: 420 }}>
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Link key={card.href} href={card.href} className="group block h-full">
            <div
              className="relative overflow-hidden rounded-2xl h-full flex flex-col justify-between p-6 transition-transform duration-300 group-hover:scale-[1.03]"
              style={{ background: card.gradient }}
            >
              {/* Decorative circles */}
              <div
                className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-10"
                style={{ backgroundColor: '#ffffff' }}
              />
              <div
                className="absolute -left-6 bottom-20 w-24 h-24 rounded-full opacity-5"
                style={{ backgroundColor: '#ffffff' }}
              />
              <div
                className="absolute right-4 bottom-4 w-16 h-16 rounded-full opacity-5"
                style={{ backgroundColor: '#ffffff' }}
              />

              {/* Top: Icon */}
              <div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: card.iconBg }}
                >
                  <Icon className="h-7 w-7 text-white" />
                </div>
              </div>

              {/* Bottom: Text */}
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                  {card.title}
                </h3>
                <p className="text-white/50 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {card.subtitle}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: card.accentDot }}
                  />
                  <span className="text-white/70 text-xs font-medium uppercase tracking-wider">
                    {card.detail}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
