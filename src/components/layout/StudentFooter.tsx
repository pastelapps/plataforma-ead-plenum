'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTenant } from '@/lib/tenant/context'

export function StudentFooter() {
  const { tenant, assets } = useTenant()

  return (
    <footer
      className="border-t"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
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
              <span className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{tenant.name}</span>
            )}
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              &copy; 2026 {tenant.name} &mdash; Todos os direitos reservados
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Navegue</h3>
            {[
              { label: 'Inicio', href: '/' },
              { label: 'Meus Cursos', href: '/cursos' },
              { label: 'Certificados', href: '/certificados' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Termos e ajuda</h3>
            <Link href="#" className="text-sm transition-colors" style={{ color: 'var(--color-text-muted)' }}>
              Termos de uso
            </Link>
            <Link href="#" className="text-sm transition-colors" style={{ color: 'var(--color-text-muted)' }}>
              Politicas de privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
