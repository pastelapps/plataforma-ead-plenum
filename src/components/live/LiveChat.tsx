'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, AlertCircle } from 'lucide-react'

interface ChatMessage {
  id: string
  message: string
  created_at: string | null
  is_instructor: boolean
  sender_name: string | null
  profile: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface LiveChatProps {
  sessionId: string
  profileId?: string | null
  profileName: string
  isInstructor?: boolean
}

function getInitials(name: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function LiveChat({ sessionId, profileId, profileName, isInstructor = false }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastSentAt = useRef(0)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const realtimeConnected = useRef(false)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }, [])

  // Merge messages by ID (keeps optimistic, adds new from server)
  const mergeMessages = useCallback((serverMsgs: ChatMessage[]) => {
    setMessages(prev => {
      const byId = new Map<string, ChatMessage>()
      // Add existing (including optimistic)
      for (const m of prev) byId.set(m.id, m)
      // Server messages override (except temp ones not yet confirmed)
      for (const m of serverMsgs) byId.set(m.id, m)
      // Sort by created_at
      return Array.from(byId.values()).sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : Date.now()
        const tb = b.created_at ? new Date(b.created_at).getTime() : Date.now()
        return ta - tb
      })
    })
  }, [])

  // Fetch messages from API
  const fetchMessages = useCallback(async (replace = false) => {
    try {
      const res = await fetch(`/api/live-chat?session_id=${sessionId}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        if (replace) {
          setMessages(data)
        } else {
          mergeMessages(data)
        }
        setError(null)
        return true
      } else {
        const err = await res.json().catch(() => ({}))
        console.error('Chat GET error:', res.status, err)
        if (res.status === 403) {
          setError(err.error === 'Not enrolled' ? 'Voce nao esta inscrito nesta sessao' : 'Sem acesso ao chat')
        }
        return false
      }
    } catch (e) {
      console.error('Chat fetch error:', e)
      return false
    }
  }, [sessionId, mergeMessages])

  // Load initial messages
  useEffect(() => {
    async function init() {
      await fetchMessages(true)
      setLoading(false)
    }
    init()
  }, [fetchMessages])

  // Realtime via Broadcast (disparado por trigger no banco)
  // Fallback para polling caso o websocket nao conecte
  useEffect(() => {
    const supabase = createClient()

    const handleNewMessage = (newMsg: any) => {
      realtimeConnected.current = true
      const chatMsg: ChatMessage = {
        id: newMsg.id,
        message: newMsg.message,
        created_at: newMsg.created_at,
        is_instructor: newMsg.is_instructor ?? false,
        sender_name: newMsg.sender_name,
        profile: newMsg.profile_id
          ? { id: newMsg.profile_id, full_name: newMsg.sender_name, avatar_url: null }
          : null,
      }

      setMessages(prev => {
        const withoutOptimistic = prev.filter(m => {
          if (!m.id.startsWith('temp-')) return true
          return m.message !== chatMsg.message
        })
        if (withoutOptimistic.some(m => m.id === chatMsg.id)) return withoutOptimistic
        return [...withoutOptimistic, chatMsg]
      })
    }

    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        handleNewMessage(payload.payload)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          realtimeConnected.current = true
        }
      })

    // Fallback polling a cada 4s se websocket nao conectou em 2.5s
    const fallbackTimeout = setTimeout(() => {
      if (!realtimeConnected.current) {
        pollingRef.current = setInterval(() => {
          if (!realtimeConnected.current) {
            fetchMessages(false)
          }
        }, 4000)
      }
    }, 2500)

    return () => {
      clearTimeout(fallbackTimeout)
      if (pollingRef.current) clearInterval(pollingRef.current)
      supabase.removeChannel(channel)
    }
  }, [sessionId, fetchMessages])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || sending) return

    // Debounce
    const now = Date.now()
    if (now - lastSentAt.current < 1000) return
    lastSentAt.current = now

    setSending(true)
    setSendError(null)

    // Optimistic update
    const optimisticId = `temp-${Date.now()}`
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      message: trimmed,
      created_at: new Date().toISOString(),
      is_instructor: isInstructor,
      sender_name: profileName,
      profile: profileId ? { id: profileId, full_name: profileName, avatar_url: null } : null,
    }
    setMessages(prev => [...prev, optimisticMsg])
    setInput('') // Clear input immediately

    try {
      const payload: Record<string, string> = {
        session_id: sessionId,
        message: trimmed,
      }
      if (profileId) {
        payload.profile_id = profileId
      }

      const res = await fetch('/api/live-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        // Replace optimistic with real data
        setMessages(prev =>
          prev.map(m => m.id === optimisticId
            ? { ...optimisticMsg, id: data.id, created_at: data.created_at }
            : m
          )
        )
      } else {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.error('Chat POST error:', res.status, err)
        // Keep the optimistic message but mark error
        setSendError(err.error || `Erro ${res.status}`)
        // Remove optimistic message after showing error briefly
        setTimeout(() => {
          setMessages(prev => prev.filter(m => m.id !== optimisticId))
        }, 2000)
      }
    } catch (e) {
      console.error('Chat POST catch:', e)
      setSendError('Erro de conexao')
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== optimisticId))
      }, 2000)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function getDisplayName(msg: ChatMessage) {
    if (msg.is_instructor) return msg.sender_name ?? 'Instrutor'
    if (msg.profile?.full_name) return msg.profile.full_name
    return msg.sender_name ?? 'Aluno'
  }

  function isOwnMessage(msg: ChatMessage) {
    if (isInstructor && msg.is_instructor) return true
    if (profileId && msg.profile?.id === profileId) return true
    if (msg.id.startsWith('temp-')) return true
    return false
  }

  if (error) {
    return (
      <div
        className="flex flex-col h-full rounded-xl border overflow-hidden items-center justify-center p-6"
        style={{
          backgroundColor: 'var(--color-card-bg, #ffffff)',
          borderColor: 'var(--color-card-border, #e5e7eb)',
        }}
      >
        <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
        <p className="text-sm text-center" style={{ color: 'var(--color-text-muted, #9ca3af)' }}>{error}</p>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full rounded-xl border overflow-hidden"
      style={{
        backgroundColor: 'var(--color-card-bg, #ffffff)',
        borderColor: 'var(--color-card-border, #e5e7eb)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b font-semibold text-sm flex items-center gap-2"
        style={{
          borderColor: 'var(--color-card-border, #e5e7eb)',
          color: 'var(--color-text, #111827)',
        }}
      >
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        Chat ao vivo
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 min-h-0">
        {loading && (
          <p className="text-center text-sm py-4" style={{ color: 'var(--color-text-muted, #9ca3af)' }}>
            Carregando mensagens...
          </p>
        )}

        {!loading && messages.length === 0 && (
          <p className="text-center text-sm py-4" style={{ color: 'var(--color-text-muted, #9ca3af)' }}>
            Nenhuma mensagem ainda. Seja o primeiro!
          </p>
        )}

        {messages.map((msg) => {
          const isOwn = isOwnMessage(msg)
          const displayName = getDisplayName(msg)
          const isTemp = msg.id.startsWith('temp-')
          return (
            <div key={msg.id} className={`flex items-start gap-2 ${isTemp ? 'opacity-60' : ''}`}>
              <div
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{
                  backgroundColor: msg.is_instructor
                    ? '#dc2626'
                    : isOwn
                    ? 'var(--color-primary, #3b82f6)'
                    : 'var(--color-card-border, #e5e7eb)',
                  color: msg.is_instructor || isOwn ? 'white' : 'var(--color-text-secondary, #6b7280)',
                }}
              >
                {msg.is_instructor ? 'P' : getInitials(displayName)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className="text-xs font-semibold truncate"
                    style={{
                      color: msg.is_instructor
                        ? '#dc2626'
                        : isOwn
                        ? 'var(--color-primary, #3b82f6)'
                        : 'var(--color-text-secondary, #6b7280)',
                    }}
                  >
                    {displayName}
                  </span>
                  {msg.is_instructor && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-600">
                      Professor
                    </span>
                  )}
                  <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted, #9ca3af)' }}>
                    {isTemp ? 'enviando...' : formatTime(msg.created_at)}
                  </span>
                </div>
                <p
                  className="text-sm break-words"
                  style={{ color: 'var(--color-text, #111827)' }}
                >
                  {msg.message}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Send error */}
      {sendError && (
        <div className="px-3 py-1.5 bg-red-50 border-t border-red-100">
          <p className="text-xs text-red-600">Erro ao enviar: {sendError}</p>
        </div>
      )}

      {/* Input */}
      <div
        className="border-t px-3 py-2 flex items-center gap-2"
        style={{ borderColor: 'var(--color-card-border, #e5e7eb)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value.slice(0, 500)); setSendError(null) }}
          onKeyDown={handleKeyDown}
          placeholder={isInstructor ? 'Mensagem como professor...' : 'Digite sua mensagem...'}
          maxLength={500}
          disabled={sending}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-500"
          style={{ color: 'var(--color-text, #111827)' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="shrink-0 p-2 rounded-lg transition-colors disabled:opacity-30"
          style={{ backgroundColor: isInstructor ? '#dc2626' : 'var(--color-primary, #3b82f6)', color: 'white' }}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {input.length > 400 && (
        <div className="px-3 pb-1">
          <span className="text-xs" style={{ color: input.length >= 500 ? '#ef4444' : 'var(--color-text-muted, #9ca3af)' }}>
            {input.length}/500
          </span>
        </div>
      )}
    </div>
  )
}
