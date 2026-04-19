/**
 * Cria: Organização, Tenant, Usuário Master (org admin), Usuário Aluno (student)
 * Uso: npx tsx scripts/create-users.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jyackmnjhsdllfqqxund.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5YWNrbW5qaHNkbGxmcXF4dW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUwMDQwOCwiZXhwIjoyMDg4MDc2NDA4fQ.SSOZDWCt7DG-JaeODA423YL-s4C79eM1mZqANXTOxkw'

// Client para schema ead (dados)
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: 'ead' },
  auth: { autoRefreshToken: false, persistSession: false },
})

// Client para auth (criar users)
const auth = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ORG_ID = '11111111-1111-1111-1111-111111111111'
const TENANT_ID = '22222222-2222-2222-2222-222222222222'

async function createAuthUser(email: string, password: string, fullName: string): Promise<string> {
  const { data, error } = await auth.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error) throw new Error(`Auth error for ${email}: ${error.message}`)
  return data.user.id
}

async function main() {
  console.log('=== Setup Supabase ===\n')

  // 1. Organização
  console.log('1. Organizacao...')
  const { data: org } = await db.from('organizations').select('id').eq('id', ORG_ID).single()
  if (!org) {
    await db.from('organizations').insert({
      id: ORG_ID, name: 'Plenum - Educação Corporativa', slug: 'plenum', email: 'admin@plenum.com.br',
    })
    console.log('   Criada: Plenum')
  } else {
    console.log('   Ja existe')
  }

  // 2. Tenant
  console.log('2. Tenant...')
  const { data: tenant } = await db.from('tenants').select('id').eq('id', TENANT_ID).single()
  if (!tenant) {
    await db.from('tenants').insert({
      id: TENANT_ID, organization_id: ORG_ID, name: 'Prefeitura de Guaxupé',
      slug: 'prefeitura-guaxupe', completion_threshold: 80, allow_self_registration: false,
    })
    await db.from('design_tokens').insert({ tenant_id: TENANT_ID, mode: 'light', color_primary_500: '#1a5276', color_primary_600: '#154360' })
    await db.from('design_tokens').insert({ tenant_id: TENANT_ID, mode: 'dark', color_primary_500: '#1a5276', color_primary_600: '#154360' })
    await db.from('design_assets').insert({ tenant_id: TENANT_ID })
    console.log('   Criado: Prefeitura de Guaxupe + tokens + assets')
  } else {
    console.log('   Ja existe')
  }

  // 3. Master
  console.log('\n3. Usuario MASTER...')
  const masterEmail = 'master@plenum.com.br'
  const masterPass = 'Master@123'
  try {
    const masterUid = await createAuthUser(masterEmail, masterPass, 'Administrador Master')
    console.log(`   Auth criado: ${masterUid}`)

    // Profile admin_tenant
    const { error: pErr } = await db.from('profiles').insert({
      user_id: masterUid, tenant_id: TENANT_ID, full_name: 'Administrador Master', role: 'admin_tenant', active: true,
    })
    if (pErr) console.log(`   Profile: ${pErr.message}`)
    else console.log('   Profile admin_tenant criado')

    // Org admin
    const { error: oErr } = await db.from('organization_admins').insert({
      user_id: masterUid, organization_id: ORG_ID, role: 'owner', active: true,
    })
    if (oErr) console.log(`   Org admin: ${oErr.message}`)
    else console.log('   Organization admin (owner) criado')
  } catch (e: any) {
    console.error(`   ${e.message}`)
  }

  // 4. Aluno
  console.log('\n4. Usuario ALUNO...')
  const studentEmail = 'aluno@teste.com'
  const studentPass = 'Aluno@123'
  try {
    const studentUid = await createAuthUser(studentEmail, studentPass, 'Joao Aluno Silva')
    console.log(`   Auth criado: ${studentUid}`)

    const { error: pErr } = await db.from('profiles').insert({
      user_id: studentUid, tenant_id: TENANT_ID, full_name: 'Joao Aluno Silva', role: 'student', department: 'Secretaria de Educacao', active: true,
    })
    if (pErr) console.log(`   Profile: ${pErr.message}`)
    else console.log('   Profile student criado')
  } catch (e: any) {
    console.error(`   ${e.message}`)
  }

  // Resumo
  console.log('\n========================================')
  console.log('ACESSOS CRIADOS:')
  console.log('========================================')
  console.log('')
  console.log('MASTER (Admin):')
  console.log(`  Email: ${masterEmail}`)
  console.log(`  Senha: ${masterPass}`)
  console.log(`  URL:   /admin/login`)
  console.log('')
  console.log('ALUNO:')
  console.log(`  Email: ${studentEmail}`)
  console.log(`  Senha: ${studentPass}`)
  console.log(`  URL:   /login`)
  console.log('')
  console.log('TENANT: Prefeitura de Guaxupe')
  console.log('  Slug:  prefeitura-guaxupe')
  console.log('========================================')
}

main().catch(console.error)
