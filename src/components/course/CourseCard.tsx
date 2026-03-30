'use client'

import { useTenant } from '@/lib/tenant/context'
import Image from 'next/image'
import Link from 'next/link'

interface CourseCardProps {
  course: {
    slug: string
    title: string
    thumbnail_transparent_url: string | null
    thumbnail_url: string | null
    short_description: string | null
  }
  progress?: number
  isFavorite?: boolean
  showCertBadge?: boolean
  showEnrollButton?: boolean
}

export function CourseCard({ course, progress, isFavorite, showCertBadge, showEnrollButton }: CourseCardProps) {
  const { assets } = useTenant()

  const bgStyle = assets?.cardBgGradientCss
    ? { background: assets.cardBgGradientCss }
    : assets?.cardBgPattern1Url
    ? { backgroundImage: `url(${assets.cardBgPattern1Url})`, backgroundSize: 'cover' }
    : { background: 'var(--color-primary-500)' }

  return (
    <Link href={`/cursos/${course.slug}`}>
      <div className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow rounded-lg border" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
        <div className="relative h-48 overflow-hidden" style={bgStyle}>
          <div className="absolute inset-0" style={{ backgroundColor: assets?.cardOverlayColor ?? 'rgba(0,0,0,0.2)' }} />
          {course.thumbnail_transparent_url && (
            <Image src={course.thumbnail_transparent_url} alt={course.title} fill className="object-contain p-4 relative z-10" />
          )}
          {!course.thumbnail_transparent_url && course.thumbnail_url && (
            <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover" />
          )}
          {showCertBadge && (
            <div className="absolute top-2 right-2 z-20 px-2 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: 'var(--color-success)' }}>Concluído</div>
          )}
          <button className="absolute top-2 left-2 z-20 text-white text-lg">{isFavorite ? '♥' : '♡'}</button>
        </div>
        <div className="p-4">
          <h3 className="font-semibold line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>{course.title}</h3>
          {course.short_description && (
            <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{course.short_description}</p>
          )}
          {progress !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                <span>Progresso</span><span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--color-progress-track)' }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: 'var(--color-progress-fill)' }} />
              </div>
            </div>
          )}
          {showEnrollButton && (
            <button className="mt-3 w-full py-2 rounded text-sm font-medium" style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}>
              Matricular-se
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
