'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Users } from 'lucide-react'
import Link from 'next/link'

export default function NovoAlunoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [maxStudents, setMaxStudents] = useState<number | null>(null)
  const [currentStudents, setCurrentStudents] = useState(0)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    loadTenantInfo()
  }, [])

  const loadTenantInfo = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, tenants(id, max_students)')
      .eq('user_id', user.id)
      .in('role', ['admin_tenant', 'manager'])
      .limit(1)
      .single()

    if (!profile) return

    const tid = profile.tenant_id
    setTenantId(tid)
    setMaxStudents((profile.tenants as any)?.max_students ?? null)

    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tid)
      .eq('role', 'student')

    setCurrentStudents(count ?? 0)
    setStatsLoading(false)
  }

  const limitReached = maxStudents !== null && currentStudents >= maxStudents

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!tenantId || limitReached) return

    setLoading(true)
    const form = new FormData(e.currentTarget)

    const res = await fetch('/api/students/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        email: form.get('email'),
        password: form.get('password'),
        fullName: form.get('fullName'),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(typeof data.error === 'string' ? data.error : 'Erro ao criar aluno')
      setLoading(false)
      return
    }

    toast.success('Aluno criado com sucesso!')
    router.push('/tenant-admin/alunos')
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link href="/tenant-admin/alunos" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar para alunos
      </Link>

      <h1 className="text-2xl font-bold mb-6">Criar Aluno</h1>

      {!statsLoading && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-lg bg-gray-50 border">
          <Users className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium">
              {currentStudents}{maxStudents !== null ? ` de ${maxStudents}` : ''} vagas utilizadas
            </p>
            {limitReached && (
              <p className="text-xs text-red-500 font-medium">Limite de vagas atingido</p>
            )}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados do Aluno</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo *</Label>
              <Input id="fullName" name="fullName" required placeholder="Nome do aluno" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required placeholder="aluno@email.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input id="password" name="password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres" />
            </div>

            <Button type="submit" disabled={loading || limitReached} className="w-full">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando...</> : 'Criar Aluno'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
