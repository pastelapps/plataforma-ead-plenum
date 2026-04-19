'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NovaSessaoPage() {
  const { courseId } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const title = form.get('title') as string
    const description = form.get('description') as string
    const date = form.get('date') as string
    const startTime = form.get('startTime') as string
    const endTime = form.get('endTime') as string

    const scheduledStart = new Date(`${date}T${startTime}`).toISOString()
    const scheduledEnd = new Date(`${date}T${endTime}`).toISOString()

    const res = await fetch('/api/mux/live-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId,
        title,
        description: description || undefined,
        scheduledStart,
        scheduledEnd,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(typeof data.error === 'string' ? data.error : 'Erro ao criar sessão')
      setLoading(false)
      return
    }

    toast.success('Sessão criada! Stream key gerada.')
    router.push(`/admin/cursos/${courseId}/sessoes`)
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link href={`/admin/cursos/${courseId}/sessoes`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar para sessões
      </Link>

      <h1 className="text-2xl font-bold mb-6">Nova Sessão ao Vivo</h1>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Sessão</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" name="title" required placeholder="Ex: Aula 1 - Introdução" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" rows={3} placeholder="Descrição da sessão (opcional)" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input id="date" name="date" type="date" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Início *</Label>
                <Input id="startTime" name="startTime" type="time" required defaultValue="19:00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Término *</Label>
                <Input id="endTime" name="endTime" type="time" required defaultValue="21:00" />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando...</> : 'Criar Sessão'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
