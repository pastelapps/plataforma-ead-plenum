'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, Loader2, Shield } from 'lucide-react'

export function AdminLoginForm() {
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

    // Check if user is org admin
    const { data: orgAdmin } = await supabase
      .from('organization_admins')
      .select('id')
      .eq('user_id', data.user.id)
      .eq('active', true)
      .limit(1)
      .maybeSingle()

    if (orgAdmin) {
      window.location.href = '/admin'
      return
    }

    // Check if user is tenant admin/manager
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tenant_id')
      .eq('user_id', data.user.id)
      .in('role', ['admin_tenant', 'manager'])
      .limit(1)
      .maybeSingle()

    if (profile) {
      // Set dev tenant cookie so middleware resolves the correct tenant
      if (profile.tenant_id) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('slug')
          .eq('id', profile.tenant_id)
          .single()
        if (tenant?.slug) {
          document.cookie = `dev-tenant-slug=${tenant.slug}; path=/; max-age=86400`
        }
      }
      window.location.href = '/tenant-admin'
      return
    }

    // Not an admin - sign out and show error
    await supabase.auth.signOut()
    setError('Acesso restrito a administradores.')
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#0f1117' }}>
      <div className="w-full max-w-[420px] px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: '#1e293b' }}>
            <Shield className="h-7 w-7 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
          <p className="mt-2 text-sm text-gray-400">
            Acesso para administradores e gestores
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="admin-email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-4 w-4 text-gray-500" />
              </div>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@empresa.com"
                required
                className="h-11 w-full rounded-lg border pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3a' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-300">
              Senha
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-4 w-4 text-gray-500" />
              </div>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 w-full rounded-lg border pl-10 pr-11 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                style={{ backgroundColor: '#1a1d27', borderColor: '#2a2d3a' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
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

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-gray-600" />
          <span className="text-xs text-gray-600">Acesso restrito</span>
        </div>
      </div>
    </div>
  )
}
