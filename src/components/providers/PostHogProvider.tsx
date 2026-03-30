'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, posthog } from '@/lib/posthog/client'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => { initPostHog() }, [])

  useEffect(() => {
    if (pathname) posthog.capture('$pageview', { url: pathname + (searchParams?.toString() ?? '') })
  }, [pathname, searchParams])

  return <>{children}</>
}
