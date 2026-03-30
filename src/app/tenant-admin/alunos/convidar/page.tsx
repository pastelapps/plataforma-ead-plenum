'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function ConvidarAlunosPage() {
  const [emails, setEmails] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const emailList = emails.split(/[,;\n]/).map(e => e.trim()).filter(Boolean)

    const res = await fetch('/api/invitations/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails: emailList, tenantId: '' }), // tenantId from context
    })
    const data = await res.json()
    setResults(data.results ?? [])
    setLoading(false)
    toast.success('Convites processados!')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Convidar Alunos</h1>
      <Card>
        <CardHeader><CardTitle>Enviar convites por email</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Emails (separados por vírgula ou linha)</Label>
              <textarea className="w-full border rounded-md p-2 min-h-[100px]" value={emails} onChange={e => setEmails(e.target.value)} placeholder="aluno1@email.com&#10;aluno2@email.com" />
            </div>
            <Button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar Convites'}</Button>
          </form>
          {results.length > 0 && (
            <div className="mt-4 space-y-1">
              {results.map((r, i) => (
                <p key={i} className={`text-sm ${r.success ? 'text-green-600' : 'text-red-600'}`}>
                  {r.email}: {r.success ? 'Enviado' : r.error}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
