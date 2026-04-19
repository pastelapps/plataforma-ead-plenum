'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PlayCircle, CheckCircle, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface LessonItem {
  id: string
  title: string
  slug: string
  thumbnail_url: string | null
  video_duration_sec: number | null
  estimated_duration_minutes: number | null
  isCompleted: boolean
  watchPercentage?: number
}

interface SupplementaryMaterial {
  name: string
  url: string
  type: string
}

interface LessonSidebarProps {
  courseSlug: string
  moduleName: string
  lessonCount: number
  lessons: LessonItem[]
  currentLessonId: string
  supplementaryMaterials: SupplementaryMaterial[]
}

function formatDuration(seconds: number | null, minutes: number | null): string | null {
  if (seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }
  if (minutes) {
    return `${minutes} min`
  }
  return null
}

export function LessonSidebar({
  courseSlug,
  moduleName,
  lessonCount,
  lessons,
  currentLessonId,
  supplementaryMaterials,
}: LessonSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <aside className="w-full lg:w-[30%] lg:min-w-[320px] bg-[#111] lg:border-l border-[#222] flex flex-col">
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden flex items-center justify-between w-full p-4 border-b border-[#222] text-left"
      >
        <div>
          <h3 className="font-bold text-white text-sm">{moduleName}</h3>
          <p className="text-xs text-[#9ca3af]">Aulas &bull; {lessonCount} conteúdos</p>
        </div>
        {mobileOpen ? (
          <ChevronUp className="size-5 text-[#9ca3af]" />
        ) : (
          <ChevronDown className="size-5 text-[#9ca3af]" />
        )}
      </button>

      {/* Desktop header */}
      <div className="hidden lg:block p-4 border-b border-[#222]">
        <h3 className="font-bold text-white text-base">{moduleName}</h3>
        <p className="text-xs text-[#9ca3af] mt-1">Aulas &bull; {lessonCount} conteúdos</p>
      </div>

      {/* Lesson list */}
      <div className={`${mobileOpen ? 'block' : 'hidden'} lg:block flex-1 overflow-hidden`}>
        <ScrollArea className="lg:max-h-[calc(100vh-200px)]">
          <div className="divide-y divide-[#1a1a1a]">
            {lessons.map((lesson) => {
              const isCurrent = lesson.id === currentLessonId
              const duration = formatDuration(lesson.video_duration_sec, lesson.estimated_duration_minutes)

              return (
                <Link
                  key={lesson.id}
                  href={`/cursos/${courseSlug}/aula/${lesson.slug}`}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#1a1a1a] ${
                    isCurrent
                      ? 'bg-[#1a1a1a] border-l-2 border-l-[var(--color-primary-500,#1ed6e4)]'
                      : 'border-l-2 border-l-transparent'
                  }`}
                >
                  {/* Thumbnail or icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded bg-[#222] flex items-center justify-center overflow-hidden">
                    {lesson.thumbnail_url ? (
                      <img
                        src={lesson.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PlayCircle
                        className={`size-5 ${
                          isCurrent
                            ? 'text-[var(--color-primary-500,#1ed6e4)]'
                            : 'text-[#666]'
                        }`}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm truncate ${
                        isCurrent ? 'text-white font-medium' : 'text-[#ccc]'
                      }`}
                    >
                      {lesson.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {duration && (
                        <span className="text-xs text-[#666]">{duration}</span>
                      )}
                      {lesson.isCompleted && (
                        <span className="inline-flex items-center gap-1 text-xs text-[#22c55e]">
                          <CheckCircle className="size-3" />
                          Concluída
                        </span>
                      )}
                    </div>
                    {!lesson.isCompleted &&
                      lesson.watchPercentage != null &&
                      lesson.watchPercentage > 0 && (
                        <div className="mt-1 h-0.5 w-full rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-[var(--color-primary-500,#1ed6e4)] transition-all duration-300"
                            style={{
                              width: `${Math.min(lesson.watchPercentage, 100)}%`,
                            }}
                          />
                        </div>
                      )}
                  </div>
                </Link>
              )
            })}
          </div>
        </ScrollArea>

        {/* Supplementary materials */}
        {supplementaryMaterials.length > 0 && (
          <div className="border-t border-[#222] p-4">
            <h4 className="text-sm font-semibold text-white mb-3">
              Material complementar
            </h4>
            <div className="space-y-2">
              {supplementaryMaterials.map((mat, idx) => (
                <a
                  key={idx}
                  href={mat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors group"
                >
                  <FileText className="size-4 text-[#9ca3af] flex-shrink-0" />
                  <span className="flex-1 text-sm text-[#ccc] truncate">
                    {mat.name}
                  </span>
                  <Download className="size-4 text-[#666] group-hover:text-[var(--color-primary-500,#1ed6e4)] transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
