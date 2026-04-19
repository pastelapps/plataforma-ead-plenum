'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { Check, X } from 'lucide-react'

interface Course {
  id: string
  title: string
  category: string | null
  status: string
}

interface TrackFormProps {
  organizationId: string
  courses: Course[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function TrackForm({ organizationId, courses }: TrackFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Titulo obrigatorio'); return }

    setSaving(true)
    setError('')

    const supabase = createClient()
    const slug = slugify(title)

    // Create track
    const { data: track, error: trackError } = await (supabase
      .from('tracks') as any)
      .insert({
        organization_id: organizationId,
        title: title.trim(),
        slug,
        description: description.trim() || null,
      })
      .select()
      .single()

    if (trackError) {
      setError(trackError.message)
      setSaving(false)
      return
    }

    // Associate courses
    if (selectedCourses.length > 0) {
      const trackCourses = selectedCourses.map((courseId, idx) => ({
        track_id: track.id,
        course_id: courseId,
        position: idx,
      }))

      const { error: assocError } = await (supabase
        .from('track_courses') as any)
        .insert(trackCourses)

      if (assocError) {
        setError(assocError.message)
        setSaving(false)
        return
      }
    }

    router.push('/admin/trilhas')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Informacoes da Trilha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Titulo</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Gestao e Lideranca"
            />
          </div>
          <div>
            <Label htmlFor="description">Descricao (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descricao da trilha..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cursos da Trilha</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum curso disponivel</p>
          ) : (
            <div className="space-y-2">
              {courses.map((course) => {
                const selected = selectedCourses.includes(course.id)
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => toggleCourse(course.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors border"
                    style={{
                      backgroundColor: selected ? 'rgba(99,102,241,0.08)' : 'transparent',
                      borderColor: selected ? 'rgba(99,102,241,0.3)' : 'rgba(0,0,0,0.1)',
                    }}
                  >
                    <div
                      className="shrink-0 w-5 h-5 rounded flex items-center justify-center border"
                      style={{
                        backgroundColor: selected ? '#6366f1' : 'transparent',
                        borderColor: selected ? '#6366f1' : '#d1d5db',
                      }}
                    >
                      {selected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{course.title}</p>
                      {course.category && (
                        <p className="text-xs text-gray-400">{course.category}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
          {selectedCourses.length > 0 && (
            <p className="text-sm text-gray-500 mt-3">
              {selectedCourses.length} curso{selectedCourses.length !== 1 ? 's' : ''} selecionado{selectedCourses.length !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Criar Trilha'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
