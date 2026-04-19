'use client'

import { useState, useMemo } from 'react'
import { Search, Calendar, Users, Clock, Radio } from 'lucide-react'
import Link from 'next/link'

interface Member {
  id: string
  full_name: string | null
  avatar_url: string | null
  department: string | null
  job_title: string | null
  created_at: string | null
}

interface LiveEvent {
  id: string
  title: string
  scheduled_start: string
  scheduled_end?: string
  status: string
  courses?: { title: string } | null
}

const AVATAR_COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#10b981',
]

function getColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function getInitials(name: string | null) {
  if (!name) return '?'
  const p = name.trim().split(/\s+/)
  return p.length === 1 ? p[0][0]?.toUpperCase() ?? '?' : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

type Tab = 'conexoes' | 'eventos' | 'agenda'

export function AlumniTabs({
  members,
  events,
  upcoming,
  currentProfileId,
}: {
  members: Member[]
  events: LiveEvent[]
  upcoming: LiveEvent[]
  currentProfileId: string
}) {
  const [tab, setTab] = useState<Tab>('conexoes')
  const [search, setSearch] = useState('')

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members
    const q = search.toLowerCase()
    return members.filter(m =>
      m.full_name?.toLowerCase().includes(q) ||
      m.department?.toLowerCase().includes(q) ||
      m.job_title?.toLowerCase().includes(q)
    )
  }, [members, search])

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'conexoes', label: 'Conexoes', count: members.length },
    { key: 'eventos', label: 'Eventos passados', count: events.length },
    { key: 'agenda', label: 'Minha agenda', count: upcoming.length },
  ]

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10 pb-0">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-medium transition-colors relative"
            style={{
              color: tab === t.key ? '#ffffff' : 'rgba(255,255,255,0.4)',
            }}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-white/30">({t.count})</span>
            {tab === t.key && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: 'var(--color-primary-500, #6366f1)' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab: Conexoes */}
      {tab === 'conexoes' && (
        <div>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Buscar por nome, departamento ou cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-96 pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredMembers.map(m => {
              const isMe = m.id === currentProfileId
              return (
                <div
                  key={m.id}
                  className="flex flex-col items-center p-4 rounded-2xl"
                  style={{
                    backgroundColor: isMe ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                    border: isMe ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white mb-2"
                    style={{ backgroundColor: getColor(m.id) }}
                  >
                    {getInitials(m.full_name)}
                  </div>
                  <p className="text-sm font-medium text-white text-center line-clamp-2">
                    {m.full_name ?? 'Sem nome'}
                    {isMe && <span className="text-white/30 text-xs ml-1">(voce)</span>}
                  </p>
                  {m.department && <p className="text-xs text-white/40 mt-0.5 text-center line-clamp-1">{m.department}</p>}
                  {m.job_title && <p className="text-xs text-white/30 text-center line-clamp-1">{m.job_title}</p>}
                </div>
              )
            })}
          </div>
          {filteredMembers.length === 0 && (
            <p className="text-center py-12 text-white/30">Nenhum membro encontrado</p>
          )}
        </div>
      )}

      {/* Tab: Eventos passados */}
      {tab === 'eventos' && (
        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="text-center py-12 text-white/30">Nenhum evento passado</p>
          ) : (
            events.map((ev: any) => (
              <Link
                key={ev.id}
                href={`/ao-vivo/${ev.id}`}
                className="flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-white/5"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                  <Radio className="h-5 w-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{ev.title}</p>
                  {ev.courses?.title && <p className="text-xs text-white/40 truncate">{ev.courses.title}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-white/40">
                    {new Date(ev.scheduled_start).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                  <p className="text-xs text-white/30">
                    {new Date(ev.scheduled_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Tab: Minha agenda */}
      {tab === 'agenda' && (
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-center py-12 text-white/30">Nenhum evento agendado</p>
          ) : (
            upcoming.map((ev: any) => (
              <Link
                key={ev.id}
                href={`/ao-vivo/${ev.id}`}
                className="flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-white/5"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{ev.title}</p>
                  {ev.courses?.title && <p className="text-xs text-white/40 truncate">{ev.courses.title}</p>}
                </div>
                <div className="text-right shrink-0">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    style={{
                      backgroundColor: ev.status === 'live' ? '#dc2626' : 'rgba(255,255,255,0.1)',
                      color: ev.status === 'live' ? '#fff' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {ev.status === 'live' ? 'AO VIVO' : 'AGENDADA'}
                  </span>
                  <p className="text-xs text-white/40 mt-1">
                    {new Date(ev.scheduled_start).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
