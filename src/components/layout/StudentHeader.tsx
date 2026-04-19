'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTenant } from '@/lib/tenant/context'
import { useTheme } from '@/lib/theme/context'
import { createClient } from '@/lib/supabase/client'
import { Bell, User, Search, LogOut, Menu, X, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Image from 'next/image'

const NAV_ITEMS = [
  { label: 'Inicio', href: '/' },
  { label: 'Meus Cursos', href: '/cursos' },
  { label: 'Ao Vivo', href: '/ao-vivo' },
  { label: 'Alumni', href: '/alumni' },
  { label: 'Ranking', href: '/ranking' },
  { label: 'Certificados', href: '/certificados' },
]

export function StudentHeader() {
  const { tenant, assets } = useTenant()
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const isDark = theme === 'dark'

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300 backdrop-blur-md"
      style={{
        backgroundColor: scrolled ? 'var(--color-header-bg)' : 'transparent',
        color: 'var(--color-header-text)',
        borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center shrink-0">
          {assets?.logoHorizontalUrl ? (
            <Link href="/">
              <Image
                src={assets.logoHorizontalUrl}
                alt={tenant.name}
                width={140}
                height={40}
                className="h-8 w-auto object-contain"
                style={{ filter: isDark ? 'none' : 'none' }}
              />
            </Link>
          ) : (
            <Link href="/" className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              {tenant.name}
            </Link>
          )}
        </div>

        {/* Center nav - desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative px-4 py-2 text-sm font-medium transition-colors group"
              style={{ color: isActive(item.href) ? 'var(--color-text)' : 'var(--color-text-secondary)' }}
            >
              {item.label}
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 transition-all duration-300"
                style={{
                  width: isActive(item.href) ? '60%' : '0%',
                  backgroundColor: 'var(--color-primary)',
                }}
              />
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 group-hover:w-[60%] transition-all duration-300"
                style={{ backgroundColor: 'var(--color-primary)' }}
              />
            </Link>
          ))}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            title={isDark ? 'Modo claro' : 'Modo escuro'}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Search */}
          <Button
            variant="ghost"
            size="icon"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <Link
            href="/notificacoes"
            className="relative inline-flex items-center justify-center h-9 w-9 rounded-md transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </Link>

          {/* Avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none inline-flex items-center justify-center h-9 w-9 rounded-md transition-colors" style={{ color: 'var(--color-text-secondary)' }}>
              <Avatar className="h-8 w-8" style={{ borderColor: 'var(--color-border)' }}>
                <AvatarFallback style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>
              <DropdownMenuItem onSelect={() => (window.location.href = '/perfil')}>
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => (window.location.href = '/favoritos')}>
                Favoritos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden ml-1"
            style={{ color: 'var(--color-text-secondary)' }}
            onClick={() => setMobileMenuOpen(prev => !prev)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300"
        style={{
          maxHeight: mobileMenuOpen ? '320px' : '0px',
          backgroundColor: 'var(--color-bg-secondary)',
        }}
      >
        <nav className="flex flex-col px-4 py-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
              style={{
                color: isActive(item.href) ? 'var(--color-text)' : 'var(--color-text-secondary)',
                backgroundColor: isActive(item.href) ? 'var(--color-bg-tertiary)' : 'transparent',
              }}
            >
              {isActive(item.href) && (
                <span
                  className="w-1 h-4 rounded-full mr-3"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                />
              )}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
