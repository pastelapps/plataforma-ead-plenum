'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Palette, Users, BookOpen, Megaphone, MessageSquare, BarChart3, LayoutDashboard, User, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/tenant-admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tenant-admin/design-system', label: 'Design System', icon: Palette },
  { href: '/tenant-admin/alunos', label: 'Alunos', icon: Users },
  { href: '/tenant-admin/cursos', label: 'Cursos', icon: BookOpen },
  { href: '/tenant-admin/anuncios', label: 'Anúncios', icon: Megaphone },
  { href: '/tenant-admin/comunidade', label: 'Comunidade', icon: MessageSquare },
  { href: '/tenant-admin/relatorios', label: 'Relatórios', icon: BarChart3 },
]

export function TenantAdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <aside className="w-64 min-h-screen p-4 flex flex-col" style={{ backgroundColor: 'var(--color-sidebar-bg)', color: 'var(--color-sidebar-text)' }}>
      <div className="mb-8">
        <h1 className="text-xl font-bold">Painel Admin</h1>
        <p className="text-sm opacity-70">Tenant Admin</p>
      </div>
      <nav className="space-y-1 flex-1">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/tenant-admin' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors', isActive ? 'opacity-100 font-semibold' : 'opacity-70 hover:opacity-100')} style={isActive ? { backgroundColor: 'var(--color-sidebar-active)', color: '#fff' } : {}}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-white/10 pt-4 mt-4 space-y-1">
        <Link href="/perfil" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors opacity-70 hover:opacity-100">
          <User className="h-5 w-5" />
          Meu Perfil
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-red-400 hover:text-red-300 w-full text-left">
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  )
}
