import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { invalidateDesignCache } from '@/lib/design-system/tokens'

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 })

  const supabase = createServiceRoleClient()

  const [{ data: light }, { data: dark }, { data: assets }] = await Promise.all([
    supabase.from('design_tokens').select('*').eq('tenant_id', tenantId).eq('mode', 'light').single(),
    supabase.from('design_tokens').select('*').eq('tenant_id', tenantId).eq('mode', 'dark').single(),
    supabase.from('design_assets').select('*').eq('tenant_id', tenantId).single(),
  ])

  return NextResponse.json({ light, dark, assets })
}

export async function PUT(request: NextRequest) {
  const { tenantId, light, dark } = await request.json()
  const supabase = createServiceRoleClient()

  await supabase.from('design_tokens').upsert(
    { ...light, tenant_id: tenantId, mode: 'light' },
    { onConflict: 'tenant_id,mode' }
  )

  await supabase.from('design_tokens').upsert(
    { ...dark, tenant_id: tenantId, mode: 'dark' },
    { onConflict: 'tenant_id,mode' }
  )

  await invalidateDesignCache(tenantId)

  return NextResponse.json({ success: true })
}
