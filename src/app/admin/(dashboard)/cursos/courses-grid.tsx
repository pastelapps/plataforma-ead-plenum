'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Pencil, Trash2, BookOpen, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface CourseWithRelations {
  id: string
  title: string
  slug: string
  category: string | null
  level: string | null
  status: string
  instructor_name: string | null
  banner_vertical_url: string | null
  fallback_color: string | null
  created_at: string
  modules?: { id: string; lessons: { id: string }[] }[]
}

export function CoursesGrid({ courses }: { courses: CourseWithRelations[] }) {
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.category && c.category.toLowerCase().includes(search.toLowerCase())) ||
    (c.instructor_name && c.instructor_name.toLowerCase().includes(search.toLowerCase()))
  )

  const handleDelete = async (e: React.MouseEvent, courseId: string, courseTitle: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Tem certeza que deseja excluir "${courseTitle}"?`)) return

    setDeletingId(courseId)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('courses').delete().eq('id', courseId)
      if (error) throw error
      toast.success('Curso excluido')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir curso')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar cursos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* "+" New course card */}
        <Link
          href="/admin/cursos/novo"
          className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all"
          style={{ aspectRatio: '230 / 400' }}
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors mb-3">
            <Plus className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <span className="text-sm font-medium text-gray-400 group-hover:text-blue-500 transition-colors">
            Novo curso
          </span>
        </Link>

        {/* Course cards */}
        {filtered.map((course) => {
          const moduleCount = course.modules?.length ?? 0
          const lessonCount = course.modules?.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0) ?? 0
          const hasBanner = !!course.banner_vertical_url
          const bgFallback = course.fallback_color
            ? `linear-gradient(160deg, ${course.fallback_color} 0%, #0a0a0a 100%)`
            : 'linear-gradient(160deg, #6b7280 0%, #1f2937 100%)'

          return (
            <Link
              key={course.id}
              href={`/admin/cursos/${course.id}`}
              className="group relative overflow-hidden rounded-2xl block"
              style={{ aspectRatio: '230 / 400' }}
            >
              {/* Background */}
              {hasBanner ? (
                <Image
                  src={course.banner_vertical_url!}
                  alt={course.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              ) : (
                <div
                  className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
                  style={{ background: bgFallback }}
                />
              )}

              {/* Dark overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.15) 100%)',
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />

              {/* Status badge */}
              <div className="absolute top-3 left-3 z-10">
                <Badge
                  variant={course.status === 'published' ? 'default' : 'secondary'}
                  className={
                    course.status === 'published'
                      ? 'bg-green-500/90 text-white border-0'
                      : 'bg-gray-500/80 text-white border-0'
                  }
                >
                  {course.status === 'published' ? 'Publicado' : 'Rascunho'}
                </Badge>
              </div>

              {/* Hover action buttons */}
              <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    router.push(`/admin/cursos/${course.id}`)
                  }}
                  className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors shadow-sm"
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5 text-gray-700" />
                </button>
                <button
                  onClick={(e) => handleDelete(e, course.id, course.title)}
                  disabled={deletingId === course.id}
                  className="w-8 h-8 rounded-full bg-white/90 hover:bg-red-50 flex items-center justify-center transition-colors shadow-sm"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </button>
              </div>

              {/* Bottom content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-10 flex flex-col gap-2">
                {/* Module/lesson counts */}
                <div className="flex items-center gap-3 text-[11px] text-white/60">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {moduleCount} {moduleCount === 1 ? 'modulo' : 'modulos'}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {lessonCount} {lessonCount === 1 ? 'aula' : 'aulas'}
                  </span>
                </div>

                {/* Instructor badge */}
                {course.instructor_name && (
                  <span
                    className="self-start px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
                    style={{ backgroundColor: '#00e676', color: '#ffffff' }}
                  >
                    {course.instructor_name}
                  </span>
                )}

                {/* Title */}
                <h3 className="text-[14px] font-bold uppercase leading-tight text-white line-clamp-3">
                  {course.title}
                </h3>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && courses.length > 0 && (
        <p className="text-center text-gray-500 py-8">
          Nenhum curso encontrado para &quot;{search}&quot;
        </p>
      )}
      {courses.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          Nenhum curso criado ainda. Clique em &quot;Criar curso&quot; para comecar.
        </p>
      )}
    </div>
  )
}
