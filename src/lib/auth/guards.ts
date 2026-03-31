import { createServerComponentClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTenantFromHeaders } from '@/lib/tenant/resolver'

// Auth guard for student/tenant pages → redirects to /login
export async function requireAuth() {
  const supabase = await createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
}

// Auth guard for admin pages → redirects to /admin/login
export async function requireAdminAuth() {
  const supabase = await createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  return user
}

// Student profile guard - requires profile in current tenant
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

// Admin profile guard - requires admin_tenant/manager profile, resolves tenant from profile
export async function requireAdminProfile() {
  const user = await requireAdminAuth()
  const supabase = createServiceRoleClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, tenants(*)')
    .eq('user_id', user.id)
    .in('role', ['admin_tenant', 'manager'])
    .eq('active', true)
    .limit(1)
    .single()

  if (!profile) redirect('/admin/login?error=no-admin-profile')

  const tenant = {
    id: profile.tenants.id,
    organizationId: profile.tenants.organization_id,
    name: profile.tenants.name,
    slug: profile.tenants.slug,
    customDomain: profile.tenants.custom_domain,
    active: profile.tenants.active,
    completionThreshold: profile.tenants.completion_threshold ?? 80,
    allowSelfRegistration: profile.tenants.allow_self_registration ?? false,
  }

  return { user, profile, tenant }
}

// Student role guard
export async function requireRole(requiredRole: 'student' | 'manager' | 'admin_tenant') {
  const { user, profile, tenant } = await requireProfile()
  const roleHierarchy: Record<string, number> = { student: 1, manager: 2, admin_tenant: 3 }
  if (roleHierarchy[profile.role] < roleHierarchy[requiredRole]) redirect('/unauthorized')
  return { user, profile, tenant }
}

// Org admin guard
export async function requireOrgAdmin() {
  const user = await requireAdminAuth()
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
