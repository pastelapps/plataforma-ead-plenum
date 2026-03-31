'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTenant } from '@/lib/tenant/context'

export function StudentFooter() {
  const { tenant, assets } = useTenant()

  return (
    <footer className="border-t border-[#222]" style={{ backgroundColor: '#111111' }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Left column - Logo and copyright */}
          <div className="flex flex-col gap-4">
            {assets?.logoHorizontalUrl ? (
              <Image
                src={assets.logoHorizontalUrl}
                alt={tenant.name}
                width={140}
                height={40}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <span className="text-lg font-bold text-white">{tenant.name}</span>
            )}
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              &copy; 2026 {tenant.name} &mdash; Todos os direitos reservados
            </p>
          </div>

          {/* Center column - Navigation */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white mb-1">Navegue</h3>
            <Link
              href="/"
              className="text-sm transition-colors hover:text-white"
              style={{ color: '#9ca3af' }}
            >
              Inicio
            </Link>
            <Link
              href="/cursos"
              className="text-sm transition-colors hover:text-white"
              style={{ color: '#9ca3af' }}
            >
              Meus Cursos
            </Link>
            <Link
              href="/certificados"
              className="text-sm transition-colors hover:text-white"
              style={{ color: '#9ca3af' }}
            >
              Certificados
            </Link>
          </div>

          {/* Right column - Terms and help */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white mb-1">Termos e ajuda</h3>
            <Link
              href="#"
              className="text-sm transition-colors hover:text-white"
              style={{ color: '#9ca3af' }}
            >
              Termos de uso
            </Link>
            <Link
              href="#"
              className="text-sm transition-colors hover:text-white"
              style={{ color: '#9ca3af' }}
            >
              Politicas de privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
