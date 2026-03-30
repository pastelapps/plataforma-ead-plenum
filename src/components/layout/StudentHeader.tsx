'use client'

import Link from 'next/link'
import { useTenant } from '@/lib/tenant/context'
import { Bell, User, Moon, Sun, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import Image from 'next/image'

export function StudentHeader() {
  const { tenant, assets } = useTenant()
  const { theme, setTheme } = useTheme()

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ backgroundColor: 'var(--color-header-bg)', color: 'var(--color-header-text)' }}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {assets?.logoHorizontalUrl ? (
            <Image src={assets.logoHorizontalUrl} alt={tenant.name} width={140} height={40} className="h-8 w-auto object-contain" />
          ) : (
            <span className="text-lg font-bold">{tenant.name}</span>
          )}
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/" className="hover:opacity-80 transition-opacity">Cursos</Link>
            <Link href="/certificados" className="hover:opacity-80 transition-opacity">Certificados</Link>
            <Link href="/comunidade" className="hover:opacity-80 transition-opacity">Comunidade</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/notificacoes">
            <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon"><Avatar className="h-8 w-8"><AvatarFallback><User className="h-4 w-4" /></AvatarFallback></Avatar></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => window.location.href = '/perfil'}>Meu Perfil</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => window.location.href = '/favoritos'}>Favoritos</DropdownMenuItem>
              <DropdownMenuItem className="text-red-500" onSelect={() => window.location.href = '/login'}><LogOut className="h-4 w-4 mr-2" />Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
