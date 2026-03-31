'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  SkipBack,
  SkipForward,
  Heart,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'

interface LessonControlsProps {
  lessonId: string
  enrollmentId: string
  courseSlug: string
  profileId: string
  courseId: string
  isCompleted: boolean
  isFavorited: boolean
  favoriteId: string | null
  prevLessonSlug: string | null
  nextLessonSlug: string | null
  prevLessonTitle: string | null
  nextLessonTitle: string | null
  likesCount: number
  dislikesCount: number
  userReaction: 'like' | 'dislike' | null
  progressId: string | null
}

export function LessonControls({
  lessonId,
  enrollmentId,
  courseSlug,
  profileId,
  courseId,
  isCompleted: initialCompleted,
  isFavorited: initialFavorited,
  favoriteId: initialFavoriteId,
  prevLessonSlug,
  nextLessonSlug,
  prevLessonTitle,
  nextLessonTitle,
  likesCount: initialLikes,
  dislikesCount: initialDislikes,
  userReaction: initialReaction,
  progressId,
}: LessonControlsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [completed, setCompleted] = useState(initialCompleted)
  const [favorited, setFavorited] = useState(initialFavorited)
  const [favId, setFavId] = useState(initialFavoriteId)
  const [likes, setLikes] = useState(initialLikes)
  const [dislikes, setDislikes] = useState(initialDislikes)
  const [reaction, setReaction] = useState(initialReaction)

  const supabase = createClient()

  async function toggleCompleted() {
    const newVal = !completed
    setCompleted(newVal)

    if (progressId) {
      await supabase
        .from('lesson_progress')
        .update({
          completed: newVal,
          completed_at: newVal ? new Date().toISOString() : null,
        })
        .eq('id', progressId)
    } else {
      await supabase.from('lesson_progress').insert({
        enrollment_id: enrollmentId,
        lesson_id: lessonId,
        completed: newVal,
        completed_at: newVal ? new Date().toISOString() : null,
      })
    }

    startTransition(() => {
      router.refresh()
    })
  }

  async function toggleFavorite() {
    if (favorited && favId) {
      setFavorited(false)
      await supabase.from('favorites').delete().eq('id', favId)
      setFavId(null)
    } else {
      setFavorited(true)
      const { data } = await supabase
        .from('favorites')
        .insert({ course_id: courseId, profile_id: profileId })
        .select('id')
        .single()
      if (data) setFavId(data.id)
    }
  }

  async function handleReaction(type: 'like' | 'dislike') {
    if (reaction === type) {
      // Remove reaction
      await supabase
        .from('lesson_reactions')
        .delete()
        .eq('lesson_id', lessonId)
        .eq('profile_id', profileId)
      if (type === 'like') setLikes((v) => v - 1)
      else setDislikes((v) => v - 1)
      setReaction(null)
    } else {
      if (reaction) {
        // Switching reaction
        if (reaction === 'like') setLikes((v) => v - 1)
        else setDislikes((v) => v - 1)
      }
      // Upsert
      await supabase.from('lesson_reactions').upsert(
        {
          lesson_id: lessonId,
          profile_id: profileId,
          reaction_type: type,
        },
        { onConflict: 'lesson_id,profile_id' }
      )
      if (type === 'like') setLikes((v) => v + 1)
      else setDislikes((v) => v + 1)
      setReaction(type)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 py-4 border-b border-[#222]">
      {prevLessonSlug ? (
        <Link href={`/cursos/${courseSlug}/aula/${prevLessonSlug}`}>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#9ca3af] hover:text-white"
          >
            <SkipBack className="size-4" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>
        </Link>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="text-[#9ca3af] opacity-30"
        >
          <SkipBack className="size-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>
      )}

      <Button
        variant={completed ? 'default' : 'outline'}
        size="sm"
        onClick={toggleCompleted}
        className={
          completed
            ? 'bg-[#22c55e] text-white hover:bg-[#16a34a] border-[#22c55e]'
            : 'border-[#333] text-[#9ca3af] hover:text-white hover:border-[#555]'
        }
      >
        <CheckCircle className="size-4" />
        Concluído
      </Button>

      {nextLessonSlug ? (
        <Link href={`/cursos/${courseSlug}/aula/${nextLessonSlug}`}>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#9ca3af] hover:text-white"
          >
            <span className="hidden sm:inline">Próxima</span>
            <SkipForward className="size-4" />
          </Button>
        </Link>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="text-[#9ca3af] opacity-30"
        >
          <span className="hidden sm:inline">Próxima</span>
          <SkipForward className="size-4" />
        </Button>
      )}

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="sm"
        onClick={toggleFavorite}
        className={
          favorited
            ? 'text-red-500 hover:text-red-400'
            : 'text-[#9ca3af] hover:text-white'
        }
      >
        <Heart className={`size-4 ${favorited ? 'fill-current' : ''}`} />
        <span className="hidden sm:inline">Favoritar</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleReaction('like')}
        className={
          reaction === 'like'
            ? 'text-[var(--color-primary-500,#1ed6e4)]'
            : 'text-[#9ca3af] hover:text-white'
        }
      >
        <ThumbsUp
          className={`size-4 ${reaction === 'like' ? 'fill-current' : ''}`}
        />
        {likes > 0 && <span className="text-xs">{likes}</span>}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleReaction('dislike')}
        className={
          reaction === 'dislike'
            ? 'text-red-500'
            : 'text-[#9ca3af] hover:text-white'
        }
      >
        <ThumbsDown
          className={`size-4 ${reaction === 'dislike' ? 'fill-current' : ''}`}
        />
        {dislikes > 0 && <span className="text-xs">{dislikes}</span>}
      </Button>
    </div>
  )
}
