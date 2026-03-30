import { createServerComponentClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTenantFromHeaders } from '@/lib/tenant/resolver'

export async function requireAuth() {
  const supabase = await createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
}

export async function requireProfile() {
  const user = await requireAuth()
  const tenant = await getTenantFromHeaders()
  const supabase = await createServerComponentClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('tenant_id', tenant.id)
    .eq('active', true)
    .single()

  if (!profile) redirect('/login?error=no-profile')
  return { user, profile, tenant }
}

export async function requireRole(requiredRole: 'student' | 'manager' | 'admin_tenant') {
  const { user, profile, tenant } = await requireProfile()
  const roleHierarchy: Record<string, number> = { student: 1, manager: 2, admin_tenant: 3 }
  if (roleHierarchy[profile.role] < roleHierarchy[requiredRole]) redirect('/unauthorized')
  return { user, profile, tenant }
}

export async function requireOrgAdmin() {
  const user = await requireAuth()
  const supabase = await createServerComponentClient()
  const { data: orgAdmin } = await supabase
    .from('organization_admins')
    .select('*, organizations(*)')
    .eq('user_id', user.id)
    .eq('active', true)
    .limit(1)
    .single()
  if (!orgAdmin) redirect('/unauthorized')
  return { user, orgAdmin, organization: orgAdmin.organizations }
}
