'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface LoginFormProps {
  bannerUrl: string | null
  logoUrl: string | null
  tenantName: string
}

export function LoginForm({ bannerUrl, logoUrl, tenantName }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { error, data } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    // Set tenant cookie based on user's profile so middleware resolves correctly
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', data.user.id)
      .limit(1)
      .maybeSingle()

    if (profile?.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('slug')
        .eq('id', profile.tenant_id)
        .single()
      if (tenant?.slug) {
        document.cookie = `dev-tenant-slug=${tenant.slug}; path=/; max-age=86400`
      }
    }

    window.location.href = '/'
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Banner (hidden on mobile) */}
      <div className="relative hidden w-1/2 lg:block">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt="Banner"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary-500, #1ed6e4) 0%, var(--color-primary-800, #0a8a93) 50%, #0a0a0a 100%)',
            }}
          />
        )}
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        {/* Motivational text at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-10">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Transforme sua carreira<br />com cursos online
          </h2>
          <p className="mt-3 text-base text-white/70">
            Acesse conteudos exclusivos e aprenda no seu ritmo.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div
        className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2"
        style={{ backgroundColor: '#0a0a0a' }}
      >
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="mb-10 flex justify-center">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={tenantName}
                width={180}
                height={60}
                className="h-14 w-auto object-contain"
                priority
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {tenantName}
              </span>
            )}
          </div>

          {/* Title & Subtitle */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white">
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-sm" style={{ color: '#9ca3af' }}>
              Faca login para acessar seus cursos
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4" style={{ color: '#9ca3af' }} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="h-11 w-full rounded-lg border pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-neutral-500 focus:ring-2"
                  style={{
                    backgroundColor: '#111111',
                    borderColor: '#333333',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--color-primary-500, #1ed6e4)'
                    e.target.style.boxShadow = '0 0 0 2px rgba(30, 214, 228, 0.2)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#333333'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Senha
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4" style={{ color: '#9ca3af' }} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 w-full rounded-lg border pl-10 pr-11 text-sm text-white outline-none transition-colors placeholder:text-neutral-500"
                  style={{
                    backgroundColor: '#111111',
                    borderColor: '#333333',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--color-primary-500, #1ed6e4)'
                    e.target.style.boxShadow = '0 0 0 2px rgba(30, 214, 228, 0.2)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#333333'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 transition-colors hover:opacity-80"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" style={{ color: '#9ca3af' }} />
                  ) : (
                    <Eye className="h-4 w-4" style={{ color: '#9ca3af' }} />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-btn-primary-bg, #1ed6e4)',
                color: 'var(--color-btn-primary-text, #0a0a0a)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-5 text-center">
            <Link
              href="/forgot-password"
              className="text-sm transition-colors"
              style={{ color: '#9ca3af' }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.color = 'var(--color-primary-500, #1ed6e4)'
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.color = '#9ca3af'
              }}
            >
              Esqueceu sua senha?
            </Link>
          </div>

          {/* Footer - Security text */}
          <div className="mt-10 flex items-center justify-center gap-1.5">
            <Lock className="h-3.5 w-3.5" style={{ color: '#4b5563' }} />
            <span className="text-xs" style={{ color: '#4b5563' }}>
              Seus dados estao protegidos
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
