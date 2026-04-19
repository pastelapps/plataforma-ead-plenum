'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  department: string | null
  role: string
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#10b981',
]

function getColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function NetworkGrid({ profiles, currentProfileId }: { profiles: Profile[], currentProfileId: string }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return profiles
    const q = search.toLowerCase()
    return profiles.filter(p =>
      p.full_name?.toLowerCase().includes(q) ||
      p.department?.toLowerCase().includes(q)
    )
  }, [profiles, search])

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/30" />
        <input
          type="text"
          placeholder="Buscar por nome ou departamento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-96 pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1"
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filtered.map((p) => {
          const isMe = p.id === currentProfileId
          return (
            <div
              key={p.id}
              className="flex flex-col items-center p-4 rounded-2xl transition-colors"
              style={{
                backgroundColor: isMe ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                border: isMe ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3"
                style={{ backgroundColor: getColor(p.id) }}
              >
                {getInitials(p.full_name)}
              </div>

              {/* Name */}
              <p className="text-sm font-medium text-white text-center line-clamp-2">
                {p.full_name ?? 'Sem nome'}
                {isMe && <span className="text-white/40 text-xs ml-1">(voce)</span>}
              </p>

              {/* Department */}
              {p.department && (
                <p className="text-xs text-white/40 mt-1 text-center line-clamp-1">
                  {p.department}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-white/40 text-lg">Nenhum aluno encontrado</p>
        </div>
      )}
    </div>
  )
}
