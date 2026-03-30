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
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'check-email' | 'accepted'>('form')

  const handleAcceptLoggedIn = async () => {
    setLoading(true)
    await fetch('/api/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId }),
    })
    setStep('accepted')
    setTimeout(() => { window.location.href = '/' }, 2000)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/invite/${token}` },
    })
    setStep('check-email')
  }

  if (step === 'accepted') {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader><CardTitle>Convite aceito!</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Redirecionando para a plataforma...</p></CardContent>
      </Card>
    )
  }

  if (step === 'check-email') {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader><CardTitle>Verifique seu email</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Enviamos um link para <strong>{email}</strong>. Clique nele para aceitar o convite.</p></CardContent>
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
        <CardDescription>Você foi convidado para <strong>{tenantName}</strong>. Informe seu email para começar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required /></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Enviando...' : 'Continuar'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}
