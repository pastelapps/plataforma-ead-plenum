'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle, Copy } from 'lucide-react'

interface Course {
  id: string
  title: string
}

export function NewLiveSessionForm({ courses, organizationId }: { courses: Course[]; organizationId: string }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructorName, setInstructorName] = useState('')
  const [courseId, setCourseId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [maxViewers, setMaxViewers] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date || !startTime || !endTime) {
      setError('Preencha titulo, data, horario de inicio e fim')
      return
    }

    setSaving(true)
    setError('')

    const scheduledStart = new Date(`${date}T${startTime}:00`).toISOString()
    const scheduledEnd = new Date(`${date}T${endTime}:00`).toISOString()

    const res = await fetch('/api/mux/live-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId,
        courseId: courseId || null,
        title: title.trim(),
        description: description.trim() || null,
        instructorName: instructorName.trim() || null,
        scheduledStart,
        scheduledEnd,
        maxViewers: maxViewers ? parseInt(maxViewers) : null,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      const errMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
      setError(errMsg)
      return
    }

    setResult(data.session ?? data)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (result) {
    return (
      <div className="max-w-2xl space-y-6">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Sessao criada com sucesso!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-semibold">{result.title}</p>
            <p className="text-sm text-gray-600">
              {result.instructor_name && `Instrutor: ${result.instructor_name} | `}
              {new Date(result.scheduled_start).toLocaleDateString('pt-BR')} as{' '}
              {new Date(result.scheduled_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuracao do OBS Studio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Use esses dados no OBS Studio para transmitir ao vivo:
            </p>

            <div>
              <Label className="text-xs text-gray-500 uppercase">Servidor RTMP</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                  rtmps://global-live.mux.com:443/app
                </code>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard('rtmps://global-live.mux.com:443/app')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-500 uppercase">Stream Key</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono break-all">
                  {result.mux_stream_key}
                </code>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(result.mux_stream_key)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-semibold mb-2">Como conectar o OBS:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Abra o OBS Studio</li>
                <li>Va em Configuracoes &rarr; Transmissao</li>
                <li>Servico: <strong>Personalizado</strong></li>
                <li>Servidor: <strong>rtmps://global-live.mux.com:443/app</strong></li>
                <li>Chave de transmissao: copie a Stream Key acima</li>
                <li>Clique &quot;Iniciar Transmissao&quot; quando estiver pronto</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={() => router.push('/admin/ao-vivo')}>
            Voltar ao Dashboard
          </Button>
          <Button variant="outline" onClick={() => { setResult(null); setTitle(''); setDescription(''); setInstructorName('') }}>
            Criar outra sessao
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados da Sessao</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Titulo da sessao *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aula 1 - Introducao ao Pregao Eletronico"
            />
          </div>

          <div>
            <Label htmlFor="instructor">Instrutor</Label>
            <Input
              id="instructor"
              value={instructorName}
              onChange={(e) => setInstructorName(e.target.value)}
              placeholder="Nome do instrutor"
            />
          </div>

          <div>
            <Label htmlFor="desc">Descricao (opcional)</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descricao da aula..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Data *</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="start">Inicio *</Label>
              <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="end">Fim *</Label>
              <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="maxViewers">Limite de vagas (opcional)</Label>
            <Input
              id="maxViewers"
              type="number"
              value={maxViewers}
              onChange={(e) => setMaxViewers(e.target.value)}
              placeholder="Sem limite"
            />
          </div>

          {courses.length > 0 && (
            <div>
              <Label htmlFor="course">Vincular a um curso (opcional)</Label>
              <select
                id="course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Nenhum - sessao independente</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Criando no Mux...' : 'Criar Sessao ao Vivo'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
