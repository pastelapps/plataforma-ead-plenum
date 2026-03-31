'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Phone, Building2, Briefcase, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminPerfilPage() {
  const [profile, setProfile] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
      setProfile(data)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      full_name: form.get('full_name') as string,
      phone: form.get('phone') as string,
      department: form.get('department') as string,
      job_title: form.get('job_title') as string,
    }).eq('id', profile.id)

    if (error) {
      toast.error('Erro ao salvar perfil')
    } else {
      toast.success('Perfil atualizado!')
    }
    setLoading(false)
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-white mb-8">Meu Perfil</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Email (read-only) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Email</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-4 w-4 text-gray-500" />
            </div>
            <input
              type="email"
              value={email}
              readOnly
              className="h-11 w-full rounded-lg border border-gray-700 bg-gray-800/50 pl-10 pr-4 text-sm text-gray-400 outline-none cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-gray-500">O email não pode ser alterado.</p>
        </div>

        {/* Nome */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Nome completo</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-4 w-4 text-gray-500" />
            </div>
            <input
              name="full_name"
              defaultValue={profile.full_name ?? ''}
              className="h-11 w-full rounded-lg border border-gray-700 bg-gray-800 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Telefone</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Phone className="h-4 w-4 text-gray-500" />
            </div>
            <input
              name="phone"
              defaultValue={profile.phone ?? ''}
              className="h-11 w-full rounded-lg border border-gray-700 bg-gray-800 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>
        </div>

        {/* Departamento */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Departamento</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Building2 className="h-4 w-4 text-gray-500" />
            </div>
            <input
              name="department"
              defaultValue={profile.department ?? ''}
              className="h-11 w-full rounded-lg border border-gray-700 bg-gray-800 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>
        </div>

        {/* Cargo */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Cargo</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Briefcase className="h-4 w-4 text-gray-500" />
            </div>
            <input
              name="job_title"
              defaultValue={profile.job_title ?? ''}
              className="h-11 w-full rounded-lg border border-gray-700 bg-gray-800 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </button>
      </form>
    </div>
  )
}
