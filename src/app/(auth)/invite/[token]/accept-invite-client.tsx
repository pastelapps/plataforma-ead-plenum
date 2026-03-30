'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface Props {
  token: string
  tenantName: string
  tenantSlug: string
  isLoggedIn: boolean
  userId?: string
}

export function AcceptInviteClient({ token, tenantName, tenantSlug, isLoggedIn, userId }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'accepted'>('form')

  const acceptInvite = async (uid: string) => {
    const res = await fetch('/api/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId: uid }),
    })
    const data = await res.json()
    if (data.success) {
      setStep('accepted')
      setTimeout(() => { window.location.href = '/' }, 1500)
    } else {
      setError(data.error || 'Erro ao aceitar convite')
    }
  }

  const handleAcceptLoggedIn = async () => {
    setLoading(true)
    await acceptInvite(userId!)
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    // Tentar criar conta
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (signUpError) {
      // Se já existe, tentar login
      if (signUpError.message.includes('already registered')) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) {
          setError('Email já cadastrado. Senha incorreta.')
          setLoading(false)
          return
        }
        await acceptInvite(loginData.user!.id)
        setLoading(false)
        return
      }
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (signUpData.user) {
      await acceptInvite(signUpData.user.id)
    }
    setLoading(false)
  }

  if (step === 'accepted') {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader><CardTitle>Convite aceito!</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Redirecionando para a plataforma...</p></CardContent>
      </Card>
    )
  }

  if (isLoggedIn) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Aceitar convite</CardTitle>
          <CardDescription>Você foi convidado para <strong>{tenantName}</strong></CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
          <Button onClick={handleAcceptLoggedIn} className="w-full" disabled={loading}>
            {loading ? 'Aceitando...' : 'Aceitar convite e acessar'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Aceitar convite</CardTitle>
        <CardDescription>Você foi convidado para <strong>{tenantName}</strong>. Crie sua conta para acessar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Nome completo</Label>
            <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta e aceitar convite'}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Já tem conta? <button type="button" className="underline" onClick={() => { /* poderia abrir modal de login */ }}>Faça login primeiro</button>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
