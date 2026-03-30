import { headers } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase/server'
import { redis } from '@/lib/redis/client'
import { redirect } from 'next/navigation'

export interface TenantInfo {
  id: string
  organizationId: string
  name: string
  slug: string
  customDomain: string | null
  active: boolean
  completionThreshold: number
  allowSelfRegistration: boolean
}

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN!

export async function getTenantFromHeaders(): Promise<TenantInfo> {
  const headersList = await headers()
  const hostname = headersList.get('host') ?? ''

  if (hostname.includes('localhost')) {
    const devSlug = headersList.get('x-tenant-slug')
    if (devSlug) return resolveTenantBySlug(devSlug)
    const supabase = await createServerComponentClient()
    const { data } = await supabase.from('tenants').select('*').eq('active', true).limit(1).single()
    if (data) return mapTenant(data)
    throw new Error('No active tenant found for development')
  }

  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    redirect('/landing')
  }

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const slug = hostname.replace(`.${ROOT_DOMAIN}`, '')
    if (['admin', 'api', 'www'].includes(slug)) redirect(`https://${ROOT_DOMAIN}/${slug}`)
    return resolveTenantBySlug(slug)
  }

  return resolveTenantByDomain(hostname)
}

async function resolveTenantBySlug(slug: string): Promise<TenantInfo> {
  const cacheKey = `tenant-slug:${slug}`
  try {
    const cached = await redis.get<TenantInfo>(cacheKey)
    if (cached) return cached
  } catch {}
  const supabase = await createServerComponentClient()
  const { data, error } = await supabase.from('tenants').select('*').eq('slug', slug).eq('active', true).single()
  if (error || !data) redirect('/404?reason=tenant-not-found')
  const tenant = mapTenant(data)
  try { await redis.set(cacheKey, tenant, { ex: 3600 }) } catch {}
  return tenant
}

async function resolveTenantByDomain(domain: string): Promise<TenantInfo> {
  const cacheKey = `tenant-domain:${domain}`
  try {
    const cached = await redis.get<TenantInfo>(cacheKey)
    if (cached) return cached
  } catch {}
  const supabase = await createServerComponentClient()
  const { data, error } = await supabase.from('tenants').select('*').eq('custom_domain', domain).eq('active', true).single()
  if (error || !data) redirect('/404?reason=domain-not-found')
  const tenant = mapTenant(data)
  try { await redis.set(cacheKey, tenant, { ex: 3600 }) } catch {}
  return tenant
}

function mapTenant(data: any): TenantInfo {
  return {
    id: data.id,
    organizationId: data.organization_id,
    name: data.name,
    slug: data.slug,
    customDomain: data.custom_domain,
    active: data.active,
    completionThreshold: data.completion_threshold ?? 80,
    allowSelfRegistration: data.allow_self_registration ?? false,
  }
}

export async function invalidateTenantCache(slug: string, domain?: string | null) {
  await redis.del(`tenant-slug:${slug}`)
  if (domain) await redis.del(`tenant-domain:${domain}`)
}
