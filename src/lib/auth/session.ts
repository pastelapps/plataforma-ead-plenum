import { createServerComponentClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const supabase = await createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentProfile(tenantId: string) {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createServerComponentClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .eq('active', true)
    .single()
  return profile
}
