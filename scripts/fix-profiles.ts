import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jyackmnjhsdllfqqxund.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5YWNrbW5qaHNkbGxmcXF4dW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUwMDQwOCwiZXhwIjoyMDg4MDc2NDA4fQ.SSOZDWCt7DG-JaeODA423YL-s4C79eM1mZqANXTOxkw'

const ORG_ID = '11111111-1111-1111-1111-111111111111'
const TENANT_ID = '22222222-2222-2222-2222-222222222222'

const auth = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: 'ead' },
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  // List all users
  console.log('Listando auth users...')
  const { data, error } = await auth.auth.admin.listUsers({ page: 1, perPage: 50 })
  if (error) {
    console.error('listUsers error:', error.message)
    console.log('\nTentando abordagem alternativa: deletar e recriar...')

    // Se listUsers falha, deletamos pelo ID que ja temos e recriamos
    // Vamos tentar usar getUserById com IDs conhecidos da execucao anterior
    const knownIds = [
      '102c548b-5743-41fd-8a6a-9615c8eb732a', // master
      '0fe62ba3-6a66-47a3-87b7-0a0c72c9f5d6', // aluno
    ]

    for (const id of knownIds) {
      console.log(`Deletando user ${id}...`)
      const { error: delErr } = await auth.auth.admin.deleteUser(id)
      if (delErr) console.log(`  Erro: ${delErr.message}`)
      else console.log(`  Deletado`)
    }

    console.log('\nRecriando users...')

    // Master
    const { data: master, error: mErr } = await auth.auth.admin.createUser({
      email: 'master@plenum.com.br',
      password: 'Master@123',
      email_confirm: true,
      user_metadata: { full_name: 'Administrador Master' },
    })
    if (mErr) { console.error('Master create:', mErr.message); return }
    console.log(`Master criado: ${master.user.id}`)

    // Master profile
    const { error: mpErr } = await db.from('profiles').insert({
      user_id: master.user.id, tenant_id: TENANT_ID, full_name: 'Administrador Master', role: 'admin_tenant', active: true,
    })
    console.log(`Master profile: ${mpErr ? mpErr.message : 'OK'}`)

    // Master org admin
    const { error: moErr } = await db.from('organization_admins').insert({
      user_id: master.user.id, organization_id: ORG_ID, role: 'owner', active: true,
    })
    console.log(`Master org admin: ${moErr ? moErr.message : 'OK'}`)

    // Student
    const { data: student, error: sErr } = await auth.auth.admin.createUser({
      email: 'aluno@teste.com',
      password: 'Aluno@123',
      email_confirm: true,
      user_metadata: { full_name: 'Joao Aluno Silva' },
    })
    if (sErr) { console.error('Student create:', sErr.message); return }
    console.log(`\nAluno criado: ${student.user.id}`)

    const { error: spErr } = await db.from('profiles').insert({
      user_id: student.user.id, tenant_id: TENANT_ID, full_name: 'Joao Aluno Silva', role: 'student', department: 'Secretaria de Educacao', active: true,
    })
    console.log(`Aluno profile: ${spErr ? spErr.message : 'OK'}`)

  } else {
    console.log(`Encontrados ${data.users.length} users`)

    for (const user of data.users) {
      console.log(`\n  User: ${user.email} (${user.id})`)

      if (user.email === 'master@plenum.com.br') {
        // Check/create profile
        const { data: p } = await db.from('profiles').select('id').eq('user_id', user.id).eq('tenant_id', TENANT_ID).single()
        if (!p) {
          const { error } = await db.from('profiles').insert({
            user_id: user.id, tenant_id: TENANT_ID, full_name: 'Administrador Master', role: 'admin_tenant', active: true,
          })
          console.log(`    Profile: ${error ? error.message : 'Criado!'}`)
        } else {
          console.log(`    Profile ja existe`)
        }

        const { data: oa } = await db.from('organization_admins').select('id').eq('user_id', user.id).eq('organization_id', ORG_ID).single()
        if (!oa) {
          const { error } = await db.from('organization_admins').insert({
            user_id: user.id, organization_id: ORG_ID, role: 'owner', active: true,
          })
          console.log(`    Org admin: ${error ? error.message : 'Criado!'}`)
        } else {
          console.log(`    Org admin ja existe`)
        }
      }

      if (user.email === 'aluno@teste.com') {
        const { data: p } = await db.from('profiles').select('id').eq('user_id', user.id).eq('tenant_id', TENANT_ID).single()
        if (!p) {
          const { error } = await db.from('profiles').insert({
            user_id: user.id, tenant_id: TENANT_ID, full_name: 'Joao Aluno Silva', role: 'student', department: 'Secretaria de Educacao', active: true,
          })
          console.log(`    Profile: ${error ? error.message : 'Criado!'}`)
        } else {
          console.log(`    Profile ja existe`)
        }
      }
    }
  }

  console.log('\n========================================')
  console.log('ACESSOS:')
  console.log('========================================')
  console.log('MASTER:  master@plenum.com.br / Master@123  (/admin/login)')
  console.log('ALUNO:   aluno@teste.com / Aluno@123  (/login)')
  console.log('TENANT:  prefeitura-guaxupe')
  console.log('========================================')
}

main().catch(console.error)
