'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SendHorizontal, MessageSquare, HelpCircle } from 'lucide-react'

interface ForumPost {
  id: string
  title: string | null
  content: string
  post_type: string
  created_at: string | null
  profile_id: string
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface LessonTabsProps {
  lessonId: string
  courseId: string
  profileId: string
  tenantId: string
  profileName: string
  posts: ForumPost[]
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min atrás`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h atrás`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d atrás`
  return date.toLocaleDateString('pt-BR')
}

export function LessonTabs({
  lessonId,
  courseId,
  profileId,
  tenantId,
  profileName,
  posts,
}: LessonTabsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'comments' | 'questions'>('comments')

  // Comment state
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // Question state
  const [questionTitle, setQuestionTitle] = useState('')
  const [questionContent, setQuestionContent] = useState('')
  const [submittingQuestion, setSubmittingQuestion] = useState(false)

  const supabase = createClient()

  const comments = posts.filter((p) => p.post_type === 'comment')
  const questions = posts.filter((p) => p.post_type === 'question')

  const submitComment = useCallback(async () => {
    if (!commentText.trim()) return
    setSubmittingComment(true)
    await supabase.from('forum_posts').insert({
      lesson_id: lessonId,
      course_id: courseId,
      profile_id: profileId,
      tenant_id: tenantId,
      content: commentText.trim(),
      post_type: 'comment',
      approved: true,
    })
    setCommentText('')
    setSubmittingComment(false)
    startTransition(() => {
      router.refresh()
    })
  }, [commentText, lessonId, courseId, profileId, tenantId, supabase, router])

  const submitQuestion = useCallback(async () => {
    if (!questionTitle.trim() || !questionContent.trim()) return
    setSubmittingQuestion(true)
    await supabase.from('forum_posts').insert({
      lesson_id: lessonId,
      course_id: courseId,
      profile_id: profileId,
      tenant_id: tenantId,
      title: questionTitle.trim(),
      content: questionContent.trim(),
      post_type: 'question',
      approved: true,
    })
    setQuestionTitle('')
    setQuestionContent('')
    setSubmittingQuestion(false)
    startTransition(() => {
      router.refresh()
    })
  }, [questionTitle, questionContent, lessonId, courseId, profileId, tenantId, supabase, router])

  return (
    <div className="mt-6">
      {/* Tab headers */}
      <div className="flex border-b border-[#222]">
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'comments'
              ? 'border-[var(--color-primary-500,#1ed6e4)] text-white'
              : 'border-transparent text-[#9ca3af] hover:text-white'
          }`}
        >
          <MessageSquare className="size-4" />
          Comentários
          {comments.length > 0 && (
            <span className="ml-1 text-xs bg-[#222] rounded-full px-2 py-0.5">
              {comments.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'questions'
              ? 'border-[var(--color-primary-500,#1ed6e4)] text-white'
              : 'border-transparent text-[#9ca3af] hover:text-white'
          }`}
        >
          <HelpCircle className="size-4" />
          Dúvidas
          {questions.length > 0 && (
            <span className="ml-1 text-xs bg-[#222] rounded-full px-2 py-0.5">
              {questions.length}
            </span>
          )}
        </button>
      </div>

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="py-4 space-y-4">
          {/* Comment input */}
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-xs font-medium text-[#9ca3af]">
              {getInitials(profileName)}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submitComment()
                  }
                }}
                placeholder="Escreva um comentário..."
                className="flex-1 h-9 rounded-lg border-0 bg-[#111] px-3 text-sm text-white placeholder:text-[#666] outline-none focus:ring-1 focus:ring-[var(--color-primary-500,#1ed6e4)]"
              />
              <Button
                size="sm"
                onClick={submitComment}
                disabled={submittingComment || !commentText.trim()}
                className="bg-[var(--color-primary-500,#1ed6e4)] text-black hover:opacity-90"
              >
                <SendHorizontal className="size-4" />
              </Button>
            </div>
          </div>

          {/* Comments list */}
          {comments.length === 0 && (
            <p className="text-sm text-[#666] py-4 text-center">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          )}
          <div className="space-y-4">
            {comments.map((post) => (
              <div key={post.id} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-xs font-medium text-[#9ca3af]">
                  {getInitials(post.profiles?.full_name ?? null)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">
                      {post.profiles?.full_name ?? 'Anônimo'}
                    </span>
                    <span className="text-xs text-[#666]">
                      {relativeTime(post.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-[#ccc] leading-relaxed">
                    {post.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="py-4 space-y-4">
          {/* Question form */}
          <div className="space-y-3 p-4 rounded-lg bg-[#111] border border-[#222]">
            <input
              value={questionTitle}
              onChange={(e) => setQuestionTitle(e.target.value)}
              placeholder="Título da dúvida"
              className="w-full h-9 rounded-lg border-0 bg-[#0a0a0a] px-3 text-sm text-white placeholder:text-[#666] outline-none focus:ring-1 focus:ring-[var(--color-primary-500,#1ed6e4)]"
            />
            <textarea
              value={questionContent}
              onChange={(e) => setQuestionContent(e.target.value)}
              placeholder="Descreva sua dúvida em detalhes..."
              rows={3}
              className="w-full rounded-lg border-0 bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder:text-[#666] outline-none resize-none focus:ring-1 focus:ring-[var(--color-primary-500,#1ed6e4)]"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={submitQuestion}
                disabled={
                  submittingQuestion ||
                  !questionTitle.trim() ||
                  !questionContent.trim()
                }
                className="bg-[var(--color-primary-500,#1ed6e4)] text-black hover:opacity-90"
              >
                Enviar dúvida
              </Button>
            </div>
          </div>

          {/* Questions list */}
          {questions.length === 0 && (
            <p className="text-sm text-[#666] py-4 text-center">
              Nenhuma dúvida ainda. Tem alguma pergunta? Pergunte acima!
            </p>
          )}
          <div className="space-y-4">
            {questions.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-lg bg-[#111] border border-[#222]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#222] flex items-center justify-center text-xs font-medium text-[#9ca3af]">
                    {getInitials(post.profiles?.full_name ?? null)}
                  </div>
                  <span className="text-sm font-medium text-white">
                    {post.profiles?.full_name ?? 'Anônimo'}
                  </span>
                  <span className="text-xs text-[#666]">
                    {relativeTime(post.created_at)}
                  </span>
                </div>
                {post.title && (
                  <h4 className="text-sm font-semibold text-white mb-1">
                    {post.title}
                  </h4>
                )}
                <p className="text-sm text-[#ccc] leading-relaxed">
                  {post.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
