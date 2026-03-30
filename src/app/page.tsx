import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar se é admin de org
  const { data: orgAdmin } = await supabase
    .from('organization_admins')
    .select('id')
    .eq('user_id', user.id)
    .eq('active', true)
    .limit(1)
    .single()

  if (orgAdmin) {
    redirect('/admin')
  }

  // Verificar se é admin de tenant
  const { data: tenantAdmin } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .eq('role', 'admin_tenant')
    .eq('active', true)
    .limit(1)
    .single()

  if (tenantAdmin) {
    redirect('/tenant-admin')
  }

  // Aluno comum - vai para homepage do tenant
  redirect('/cursos')
}
