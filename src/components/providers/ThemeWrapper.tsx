'use client'

import { ReactNode } from 'react'
import { ThemeProvider, useTheme } from '@/lib/theme/context'

function ThemeShell({ children }: { children: ReactNode }) {
  const { theme } = useTheme()

  return (
    <div
      className={`min-h-screen flex flex-col ${theme}`}
      style={{
        backgroundColor: theme === 'dark' ? 'var(--color-bg, #0a0a0a)' : 'var(--color-bg, #f5f5f5)',
        color: theme === 'dark' ? 'var(--color-text, #ffffff)' : 'var(--color-text, #111111)',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {children}
    </div>
  )
}

export function ThemeWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ThemeShell>{children}</ThemeShell>
    </ThemeProvider>
  )
}
