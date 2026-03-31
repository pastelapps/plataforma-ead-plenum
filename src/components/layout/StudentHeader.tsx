'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTenant } from '@/lib/tenant/context'
import { createClient } from '@/lib/supabase/client'
import { Bell, User, Search, LogOut, Menu, X } from 'lucide-react'
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
  { label: 'Certificados', href: '/certificados' },
  { label: 'Comunidade', href: '/comunidade' },
]

export function StudentHeader() {
  const { tenant, assets } = useTenant()
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? '#111111' : 'transparent',
        color: '#ffffff',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo - left */}
        <div className="flex items-center shrink-0">
          {assets?.logoHorizontalUrl ? (
            <Link href="/">
              <Image
                src={assets.logoHorizontalUrl}
                alt={tenant.name}
                width={140}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </Link>
          ) : (
            <Link href="/" className="text-lg font-bold text-white">
              {tenant.name}
            </Link>
          )}
        </div>

        {/* Center navigation - desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors group"
            >
              {item.label}
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 transition-all duration-300"
                style={{
                  width: isActive(item.href) ? '60%' : '0%',
                  backgroundColor: 'var(--color-primary-500, #6366f1)',
                }}
              />
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 group-hover:w-[60%] transition-all duration-300"
                style={{
                  backgroundColor: 'var(--color-primary-500, #6366f1)',
                }}
              />
            </Link>
          ))}
        </nav>

        {/* Right side icons */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <Link
            href="/notificacoes"
            className="relative inline-flex items-center justify-center h-9 w-9 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </Link>

          {/* Avatar / user dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none inline-flex items-center justify-center h-9 w-9 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors">
              <Avatar className="h-8 w-8 border border-white/20">
                <AvatarFallback className="bg-white/10 text-white text-xs">
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
              <DropdownMenuItem
                variant="destructive"
                onSelect={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white/80 hover:text-white hover:bg-white/10 ml-1"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile navigation menu */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300"
        style={{
          maxHeight: mobileMenuOpen ? '280px' : '0px',
          backgroundColor: '#111111',
        }}
      >
        <nav className="flex flex-col px-4 py-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
              style={{
                color: isActive(item.href) ? '#ffffff' : 'rgba(255,255,255,0.7)',
                backgroundColor: isActive(item.href) ? 'rgba(255,255,255,0.08)' : 'transparent',
              }}
            >
              {isActive(item.href) && (
                <span
                  className="w-1 h-4 rounded-full mr-3"
                  style={{ backgroundColor: 'var(--color-primary-500, #6366f1)' }}
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
