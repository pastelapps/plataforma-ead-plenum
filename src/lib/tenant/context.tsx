'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { TenantInfo } from './resolver'
import type { DesignAssets } from '@/lib/design-system/tokens'

interface TenantContextType {
  tenant: TenantInfo
  assets: DesignAssets | null
}

const TenantContext = createContext<TenantContextType | null>(null)

export function TenantProvider({
  tenant,
  assets,
  children,
}: {
  tenant: TenantInfo
  assets: DesignAssets | null
  children: ReactNode
}) {
  return (
    <TenantContext.Provider value={{ tenant, assets }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within TenantProvider')
  return ctx
}
