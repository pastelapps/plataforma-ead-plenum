import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN!

const PUBLIC_PATHS = [
  '/login',
  '/invite',
  '/verify',
  '/api/webhooks',
  '/api/auth',
  '/_next',
  '/favicon.ico',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') ?? ''

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const { supabase, response } = createMiddlewareClient(request)
  const { data: { session } } = await supabase.auth.getSession()

  if (hostname.startsWith('admin.')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const { data: orgAdmin } = await supabase
      .from('organization_admins')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('active', true)
      .limit(1)
      .single()

    if (!orgAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    return response
  }

  if (pathname.startsWith('/tenant-admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  if (!session && !pathname.startsWith('/login') && !pathname.startsWith('/invite')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
