'use client'

import { useTenant } from '@/lib/tenant/context'

export function useDesignTokens() {
  const { tenant, assets } = useTenant()
  return { tenantId: tenant.id, assets }
}
