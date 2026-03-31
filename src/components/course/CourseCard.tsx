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
  variant?: 'default' | 'vertical'
  bannerVerticalUrl?: string | null
  fallbackColor?: string | null
  instructorName?: string | null
}

export function CourseCard({
  course,
  progress,
  isFavorite,
  showCertBadge,
  showEnrollButton,
  variant = 'default',
  bannerVerticalUrl,
  fallbackColor,
  instructorName,
}: CourseCardProps) {
  const { assets } = useTenant()

  if (variant === 'vertical') {
    return <VerticalCard
      course={course}
      bannerVerticalUrl={bannerVerticalUrl}
      fallbackColor={fallbackColor}
      instructorName={instructorName}
      logoUrl={assets?.logoSquareUrl ?? null}
      progress={progress}
    />
  }

  // Default variant (original design)
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
            <div className="absolute top-2 right-2 z-20 px-2 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: 'var(--color-success)' }}>Concluido</div>
          )}
          <button className="absolute top-2 left-2 z-20 text-white text-lg">{isFavorite ? '\u2665' : '\u2661'}</button>
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

/* ------------------------------------------------------------------ */
/* Vertical 2:3 Card - TheMembers style                               */
/* ------------------------------------------------------------------ */

interface VerticalCardProps {
  course: {
    slug: string
    title: string
    thumbnail_transparent_url: string | null
    thumbnail_url: string | null
    short_description: string | null
  }
  bannerVerticalUrl?: string | null
  fallbackColor?: string | null
  instructorName?: string | null
  logoUrl: string | null
  progress?: number
}

function VerticalCard({
  course,
  bannerVerticalUrl,
  fallbackColor,
  instructorName,
  logoUrl,
  progress,
}: VerticalCardProps) {
  const hasBanner = !!bannerVerticalUrl
  const bgFallback = fallbackColor
    ? `linear-gradient(160deg, ${fallbackColor} 0%, #0a0a0a 100%)`
    : 'linear-gradient(160deg, var(--color-primary-500, #1ed6e4) 0%, #0a0a0a 100%)'

  return (
    <Link
      href={`/cursos/${course.slug}`}
      className="shrink-0 block"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div
        className="relative overflow-hidden cursor-pointer group"
        style={{
          width: 230,
          height: 400,
          borderRadius: 16,
        }}
      >
        {/* Background image or fallback gradient */}
        {hasBanner ? (
          <Image
            src={bannerVerticalUrl!}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="230px"
          />
        ) : (
          <div
            className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
            style={{ background: bgFallback }}
          />
        )}

        {/* Dark overlay - darkens on hover */}
        <div
          className="absolute inset-0 transition-all duration-300"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.15) 100%)',
          }}
        />
        <div
          className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"
        />

        {/* Progress bar at top if in progress */}
        {progress !== undefined && progress > 0 && progress < 100 && (
          <div className="absolute top-0 left-0 right-0 z-20 h-1">
            <div
              className="h-full"
              style={{
                width: `${progress}%`,
                backgroundColor: 'var(--color-primary-500, #1ed6e4)',
              }}
            />
          </div>
        )}

        {/* Bottom content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10 flex flex-col gap-2">
          {/* Instructor badge */}
          {instructorName && (
            <span
              className="self-start px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
              style={{
                backgroundColor: '#00e676',
                color: '#ffffff',
              }}
            >
              {instructorName}
            </span>
          )}

          {/* Course title */}
          <h3
            className="text-[14px] font-bold uppercase leading-tight text-white line-clamp-3"
          >
            {course.title}
          </h3>

          {/* Progress text */}
          {progress !== undefined && progress > 0 && progress < 100 && (
            <span className="text-[11px] text-white/60 font-medium">
              {progress}% concluido
            </span>
          )}
        </div>

        {/* Tenant logo at bottom right */}
        {logoUrl && (
          <div className="absolute bottom-3 right-3 z-10">
            <Image
              src={logoUrl}
              alt="Logo"
              width={28}
              height={28}
              className="rounded opacity-60 group-hover:opacity-80 transition-opacity duration-300"
            />
          </div>
        )}
      </div>
    </Link>
  )
}
