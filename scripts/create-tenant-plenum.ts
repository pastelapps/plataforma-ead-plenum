/**
 * Cria tenant Plenum + design tokens + assets + aluno teste
 * Uso: npx tsx scripts/create-tenant-plenum.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jyackmnjhsdllfqqxund.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5YWNrbW5qaHNkbGxmcXF4dW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUwMDQwOCwiZXhwIjoyMDg4MDc2NDA4fQ.SSOZDWCt7DG-JaeODA423YL-s4C79eM1mZqANXTOxkw'

const ORG_ID = '11111111-1111-1111-1111-111111111111'
const PLENUM_TENANT_ID = '44444444-4444-4444-4444-444444444444'

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: 'ead' },
  auth: { autoRefreshToken: false, persistSession: false },
})

const auth = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log('=== Criando Tenant Plenum ===\n')

  // 1. Tenant
  console.log('1. Tenant Plenum...')
  const { data: existing } = await db.from('tenants').select('id').eq('id', PLENUM_TENANT_ID).single()
  if (!existing) {
    const { error } = await db.from('tenants').insert({
      id: PLENUM_TENANT_ID,
      organization_id: ORG_ID,
      name: 'Plenum Educação',
      slug: 'plenum',
      completion_threshold: 80,
      allow_self_registration: true,
    })
    if (error) { console.error('   Erro:', error.message); return }
    console.log('   Criado!')
  } else {
    console.log('   Ja existe')
  }

  // 2. Design Tokens
  console.log('2. Design tokens...')
  const { data: existingToken } = await db.from('design_tokens').select('id').eq('tenant_id', PLENUM_TENANT_ID).limit(1).single()
  if (!existingToken) {
    await db.from('design_tokens').insert({
      tenant_id: PLENUM_TENANT_ID,
      mode: 'light',
      color_primary_500: '#6366f1',
      color_primary_600: '#4f46e5',
      color_sidebar_bg: '#1e1b4b',
    })
    await db.from('design_tokens').insert({
      tenant_id: PLENUM_TENANT_ID,
      mode: 'dark',
      color_primary_500: '#818cf8',
      color_primary_600: '#6366f1',
      color_sidebar_bg: '#1e1b4b',
    })
    console.log('   Criados (roxo/indigo)')
  } else {
    console.log('   Ja existem')
  }

  // 3. Design Assets
  console.log('3. Design assets...')
  const { data: existingAsset } = await db.from('design_assets').select('id').eq('tenant_id', PLENUM_TENANT_ID).single()
  if (!existingAsset) {
    await db.from('design_assets').insert({ tenant_id: PLENUM_TENANT_ID })
    console.log('   Criado')
  } else {
    console.log('   Ja existe')
  }

  // 4. Associar cursos existentes ao tenant Plenum
  console.log('4. Associando cursos...')
  const { data: courses } = await db.from('courses').select('id, title').eq('organization_id', ORG_ID).eq('active', true)
  if (courses && courses.length > 0) {
    for (const course of courses) {
      const { data: existingTC } = await db.from('tenant_courses')
        .select('id')
        .eq('tenant_id', PLENUM_TENANT_ID)
        .eq('course_id', course.id)
        .single()
      if (!existingTC) {
        await db.from('tenant_courses').insert({
          tenant_id: PLENUM_TENANT_ID,
          course_id: course.id,
        })
        console.log(`   + ${course.title}`)
      }
    }
  } else {
    console.log('   Nenhum curso encontrado')
  }

  // 5. Master tambem ganha profile no tenant Plenum
  console.log('5. Profile master no Plenum...')
  const { data: masterOrgAdmin } = await db.from('organization_admins')
    .select('user_id')
    .eq('organization_id', ORG_ID)
    .eq('role', 'owner')
    .limit(1)
    .single()

  if (masterOrgAdmin) {
    const { data: existingProfile } = await db.from('profiles')
      .select('id')
      .eq('user_id', masterOrgAdmin.user_id)
      .eq('tenant_id', PLENUM_TENANT_ID)
      .single()
    if (!existingProfile) {
      await db.from('profiles').insert({
        user_id: masterOrgAdmin.user_id,
        tenant_id: PLENUM_TENANT_ID,
        full_name: 'Administrador Master',
        role: 'admin_tenant',
        active: true,
      })
      console.log('   Criado')
    } else {
      console.log('   Ja existe')
    }
  }

  // 6. Aluno teste Plenum
  console.log('\n6. Aluno teste Plenum...')
  const alunoEmail = 'aluno.plenum@teste.com'
  const alunoPass = 'Aluno@123'

  const { data: alunoAuth, error: alunoErr } = await auth.auth.admin.createUser({
    email: alunoEmail,
    password: alunoPass,
    email_confirm: true,
    user_metadata: { full_name: 'Maria Aluna Plenum' },
  })

  if (alunoErr) {
    console.log(`   Auth: ${alunoErr.message}`)
  } else {
    console.log(`   Auth criado: ${alunoAuth.user.id}`)
    const { error: pErr } = await db.from('profiles').insert({
      user_id: alunoAuth.user.id,
      tenant_id: PLENUM_TENANT_ID,
      full_name: 'Maria Aluna Plenum',
      role: 'student',
      department: 'Aluno Direto',
      active: true,
    })
    console.log(`   Profile: ${pErr ? pErr.message : 'OK'}`)
  }

  // Resumo
  console.log('\n========================================')
  console.log('TENANT PLENUM CRIADO')
  console.log('========================================')
  console.log('')
  console.log('Tenant:')
  console.log('  Nome:  Plenum Educacao')
  console.log('  Slug:  plenum')
  console.log('  Self-registration: true')
  console.log('')
  console.log('Aluno teste:')
  console.log(`  Email: ${alunoEmail}`)
  console.log(`  Senha: ${alunoPass}`)
  console.log(`  URL:   http://localhost:3000/?tenant=plenum`)
  console.log('')
  console.log('Admin (mesmo master):')
  console.log('  Email: master@plenum.com.br')
  console.log('  Senha: Master@123')
  console.log('========================================')
}

main().catch(console.error)
