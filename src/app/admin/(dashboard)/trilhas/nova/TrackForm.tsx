'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Trash2 } from 'lucide-react'

interface Course {
  id: string
  title: string
  category: string | null
  status: string
}

interface ExistingTrack {
  id: string
  title: string
  description: string | null
  active: boolean
  selectedCourseIds: string[]
}

interface TrackFormProps {
  organizationId: string
  courses: Course[]
  existing?: ExistingTrack
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function TrackForm({ organizationId, courses, existing }: TrackFormProps) {
  const router = useRouter()
  const isEdit = !!existing
  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [active, setActive] = useState(existing?.active ?? true)
  const [selectedCourses, setSelectedCourses] = useState<string[]>(existing?.selectedCourseIds ?? [])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
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

    let trackId: string

    if (isEdit) {
      const { error: updateError } = await (supabase
        .from('tracks') as any)
        .update({
          title: title.trim(),
          slug,
          description: description.trim() || null,
          active,
        })
        .eq('id', existing!.id)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
      trackId = existing!.id

      // Resync track_courses: delete all then insert selected
      const { error: delAssocErr } = await (supabase
        .from('track_courses') as any)
        .delete()
        .eq('track_id', trackId)

      if (delAssocErr) {
        setError(delAssocErr.message)
        setSaving(false)
        return
      }
    } else {
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
      trackId = (track as any).id
    }

    if (selectedCourses.length > 0) {
      const trackCourses = selectedCourses.map((courseId, idx) => ({
        track_id: trackId,
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

  const handleDelete = async () => {
    if (!isEdit) return
    setDeleting(true)
    setError('')

    const supabase = createClient()
    // track_courses tem ON DELETE CASCADE? caso nao, deletar antes
    await (supabase.from('track_courses') as any).delete().eq('track_id', existing!.id)

    const { error: delError } = await (supabase
      .from('tracks') as any)
      .delete()
      .eq('id', existing!.id)

    if (delError) {
      setError(delError.message)
      setDeleting(false)
      return
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
          {isEdit && (
            <div className="flex items-center gap-3 pt-2">
              <Switch checked={active} onCheckedChange={setActive} />
              <div>
                <Label className="cursor-pointer" onClick={() => setActive(!active)}>
                  Ativa
                </Label>
                <p className="text-xs text-gray-500">
                  Trilhas inativas nao aparecem para os alunos
                </p>
              </div>
            </div>
          )}
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

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving || deleting}>
          {saving ? 'Salvando...' : isEdit ? 'Salvar alteracoes' : 'Criar Trilha'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>

        {isEdit && (
          <div className="ml-auto">
            {!confirmDelete ? (
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setConfirmDelete(true)}
                disabled={saving || deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir trilha
              </Button>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <span className="text-sm text-red-600 font-medium">Confirmar exclusao?</span>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Excluindo...' : 'Sim, excluir'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  )
}
