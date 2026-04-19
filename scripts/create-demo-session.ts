/**
 * Cria sessão demo para testar a UI sem precisar do Mux pago
 * Uso: npx tsx scripts/create-demo-session.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jyackmnjhsdllfqqxund.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5YWNrbW5qaHNkbGxmcXF4dW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUwMDQwOCwiZXhwIjoyMDg4MDc2NDA4fQ.SSOZDWCt7DG-JaeODA423YL-s4C79eM1mZqANXTOxkw'

const ORG_ID = '11111111-1111-1111-1111-111111111111'

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: 'ead' },
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log('=== Criar Sessao Demo ===\n')

  // Get live course
  const { data: course } = await db
    .from('courses')
    .select('id, title')
    .eq('organization_id', ORG_ID)
    .eq('modality', 'live')
    .limit(1)
    .single()

  if (!course) {
    console.error('Nenhum curso live encontrado')
    return
  }

  console.log(`Curso: ${course.title} (${course.id})`)

  // Create 3 sessions: 1 scheduled, 1 ended, 1 future
  const now = new Date()

  const sessions = [
    {
      title: 'Aula 1 - Introducao ao Pregao Eletronico',
      description: 'Conceitos fundamentais do pregao eletronico e legislacao vigente.',
      scheduled_start: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
      scheduled_end: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      status: 'scheduled',
      mux_stream_key: 'demo-stream-key-aula1',
    },
    {
      title: 'Aula 2 - Elaboracao de Editais',
      description: 'Como elaborar editais de licitacao conforme a Nova Lei de Licitacoes.',
      scheduled_start: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      scheduled_end: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      status: 'scheduled',
      mux_stream_key: 'demo-stream-key-aula2',
    },
    {
      title: 'Aula Inaugural - Apresentacao do Curso',
      description: 'Sessao de abertura e boas-vindas.',
      scheduled_start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      scheduled_end: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
      actual_start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
      actual_end: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 95 * 60 * 1000).toISOString(),
      status: 'ended',
      recording_available: true,
      recording_duration_sec: 5400,
    },
  ]

  for (const s of sessions) {
    const { data, error } = await db.from('live_sessions').insert({
      course_id: course.id,
      ...s,
    }).select('id, title, status').single()

    if (error) {
      console.error(`Erro: ${s.title} - ${error.message}`)
    } else {
      console.log(`OK: [${data.status}] ${data.title} (${data.id})`)
    }
  }

  console.log('\nSessoes demo criadas!')
  console.log('Acesse: http://localhost:3000/admin/ao-vivo')
}

main().catch(console.error)
