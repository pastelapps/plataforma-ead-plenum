import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = [
  '/login',
  '/admin/login',
  '/invite',
  '/verify',
  '/api/',
  '/_next',
  '/favicon.ico',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Support ?tenant=slug to switch tenants via cookie (works in all environments)
  const tenantParam = request.nextUrl.searchParams.get('tenant')
  if (tenantParam) {
    const url = new URL(request.url)
    url.searchParams.delete('tenant')
    const response = NextResponse.redirect(url)
    response.cookies.set('dev-tenant-slug', tenantParam, { path: '/', maxAge: 86400 })
    return response
  }

  // Helper: forward tenant cookie as x-tenant-slug header
  function forwardTenantHeader(res: NextResponse): NextResponse {
    const devTenant = request.cookies.get('dev-tenant-slug')?.value
    if (devTenant) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-tenant-slug', devTenant)
      const newResponse = NextResponse.next({ request: { headers: requestHeaders } })
      res.cookies.getAll().forEach(c => newResponse.cookies.set(c.name, c.value))
      return newResponse
    }
    return res
  }

  // Public paths - no auth required
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return forwardTenantHeader(NextResponse.next())
  }

  // Create supabase client and get session
  const { supabase, response } = createMiddlewareClient(request)
  const { data: { session } } = await supabase.auth.getSession()

  // ── ADMIN ROUTES (org admin) ──
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return response
  }

  // ── TENANT ADMIN ROUTES ──
  if (pathname.startsWith('/tenant-admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return forwardTenantHeader(response)
  }

  // ── STUDENT / TENANT ROUTES ──
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return forwardTenantHeader(response)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
