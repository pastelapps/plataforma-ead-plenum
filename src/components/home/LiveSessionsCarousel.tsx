'use client'

import { useRef, useState, useEffect } from 'react'
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

interface LiveSession {
  id: string
  title: string
  description: string | null
  scheduled_start: string
  scheduled_end: string
  status: string
  instructor_name: string | null
  enrollment_count: number
  max_viewers: number | null
  is_enrolled: boolean
}

interface LiveSessionsCarouselProps {
  sessions: LiveSession[]
  profileId: string
}

export function LiveSessionsCarousel({ sessions, profileId }: LiveSessionsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(
    new Set(sessions.filter(s => s.is_enrolled).map(s => s.id))
  )
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect() }
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -360 : 360, behavior: 'smooth' })
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
  const fmtTime = (d: string) =>
    new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const handleEnroll = async (sessionId: string) => {
    setEnrolling(true)
    try {
      const res = await fetch('/api/live-enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ live_session_id: sessionId, profile_id: profileId }),
      })
      if (res.ok) {
        setEnrolledIds(prev => new Set([...prev, sessionId]))
        if (selectedSession?.id === sessionId)
          setSelectedSession({ ...selectedSession, is_enrolled: true })
      }
    } finally { setEnrolling(false) }
  }

  const handleUnenroll = async (sessionId: string) => {
    setEnrolling(true)
    try {
      const res = await fetch('/api/live-enrollments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ live_session_id: sessionId, profile_id: profileId }),
      })
      if (res.ok) {
        setEnrolledIds(prev => { const n = new Set(prev); n.delete(sessionId); return n })
        if (selectedSession?.id === sessionId)
          setSelectedSession({ ...selectedSession, is_enrolled: false })
      }
    } finally { setEnrolling(false) }
  }

  if (sessions.length === 0) return null

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between px-4 md:px-8 lg:px-12 mb-4">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Proximas Aulas ao Vivo</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-20"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <ChevronLeft className="h-4 w-4 text-white" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-20"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <ChevronRight className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto px-4 md:px-8 lg:px-12 pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {sessions.map((session) => {
          const isEnrolled = enrolledIds.has(session.id)
          return (
            <button
              key={session.id}
              onClick={() => setSelectedSession({ ...session, is_enrolled: isEnrolled })}
              className="shrink-0 text-left rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.02] focus:outline-none"
              style={{
                width: 340,
                background: 'var(--color-card-bg)',
                border: '1px solid var(--color-card-border)',
              }}
            >
              {/* Top color bar */}
              <div
                className="h-1.5 w-full"
                style={{
                  background: session.status === 'live'
                    ? '#ef4444'
                    : 'linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                }}
              />

              <div className="p-5 space-y-3">
                {/* Status + enrolled */}
                <div className="flex items-center justify-between">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: session.status === 'live' ? '#dc2626' : 'rgba(255,255,255,0.08)',
                      color: session.status === 'live' ? '#fff' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {session.status === 'live' ? 'AO VIVO' : 'AGENDADA'}
                  </span>
                  {isEnrolled && (
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Inscrito</span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-[15px] line-clamp-2 leading-snug">
                  {session.title}
                </h3>

                {/* Instructor */}
                {session.instructor_name && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <User className="h-3 w-3" />
                    <span>{session.instructor_name}</span>
                  </div>
                )}

                {/* Date + Time */}
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {fmtDate(session.scheduled_start)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {fmtTime(session.scheduled_start)} - {fmtTime(session.scheduled_end)}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Drawer */}
      <Sheet open={!!selectedSession} onOpenChange={(open) => { if (!open) setSelectedSession(null) }}>
        <SheetContent
          side="right"
          className="!w-full sm:!max-w-md"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
        >
          {selectedSession && (
            <div className="flex flex-col h-full">
              <SheetHeader className="pb-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wide"
                    style={{
                      backgroundColor: selectedSession.status === 'live' ? '#dc2626' : 'rgba(255,255,255,0.1)',
                      color: selectedSession.status === 'live' ? '#fff' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {selectedSession.status === 'live' ? 'AO VIVO' : 'AGENDADA'}
                  </span>
                </div>
                <SheetTitle className="text-xl">{selectedSession.title}</SheetTitle>
                {selectedSession.instructor_name && (
                  <SheetDescription className="text-[var(--color-text-muted)] flex items-center gap-1.5 mt-1">
                    <User className="h-3.5 w-3.5" /> {selectedSession.instructor_name}
                  </SheetDescription>
                )}
              </SheetHeader>

              <div className="flex-1 overflow-y-auto py-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                    <Calendar className="h-5 w-5 text-white/40" />
                    <div>
                      <p className="text-sm font-medium">{fmtDate(selectedSession.scheduled_start)}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {fmtTime(selectedSession.scheduled_start)} - {fmtTime(selectedSession.scheduled_end)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                    <Users className="h-5 w-5 text-white/40" />
                    <p className="text-sm font-medium">
                      {selectedSession.enrollment_count} inscritos
                      {selectedSession.max_viewers && ` / ${selectedSession.max_viewers} vagas`}
                    </p>
                  </div>
                </div>

                {selectedSession.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">Sobre esta aula</h4>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                      {selectedSession.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[var(--color-border)]">
                {enrolledIds.has(selectedSession.id) ? (
                  <div className="space-y-2">
                    <div className="text-center text-emerald-400 text-sm font-medium py-2">
                      Voce esta inscrito nesta aula!
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white"
                      onClick={() => handleUnenroll(selectedSession.id)}
                      disabled={enrolling}
                    >
                      {enrolling ? 'Cancelando...' : 'Cancelar inscricao'}
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full h-12 text-base font-semibold"
                    style={{ backgroundColor: '#dc2626', color: '#fff' }}
                    onClick={() => handleEnroll(selectedSession.id)}
                    disabled={enrolling}
                  >
                    {enrolling ? 'Inscrevendo...' : 'Quero participar'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <style>{`div[class*="overflow-x-auto"]::-webkit-scrollbar { display: none; }`}</style>
    </section>
  )
}
