/**
 * Cria um curso de modalidade 'live' e testa credenciais Mux
 * Uso: npx tsx scripts/setup-live-course.ts
 */

import { createClient } from '@supabase/supabase-js'
import Mux from '@mux/mux-node'

const SUPABASE_URL = 'https://jyackmnjhsdllfqqxund.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5YWNrbW5qaHNkbGxmcXF4dW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUwMDQwOCwiZXhwIjoyMDg4MDc2NDA4fQ.SSOZDWCt7DG-JaeODA423YL-s4C79eM1mZqANXTOxkw'

const ORG_ID = '11111111-1111-1111-1111-111111111111'
const PLENUM_TENANT_ID = '44444444-4444-4444-4444-444444444444'

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: 'ead' },
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log('=== Setup Curso ao Vivo + Teste Mux ===\n')

  // 1. Criar curso com modality='live'
  console.log('1. Criando curso ao vivo...')

  // Check if there's already a live course
  const { data: existingLive } = await db
    .from('courses')
    .select('id, title')
    .eq('organization_id', ORG_ID)
    .eq('modality', 'live')
    .limit(1)
    .single()

  let courseId: string

  if (existingLive) {
    console.log(`   Ja existe: "${existingLive.title}" (${existingLive.id})`)
    courseId = existingLive.id
  } else {
    const { data: newCourse, error } = await db.from('courses').insert({
      organization_id: ORG_ID,
      title: 'Aulas ao Vivo - Licitacoes e Contratos',
      slug: 'aulas-ao-vivo-licitacoes',
      description: 'Sessoes ao vivo sobre licitacoes, pregao eletronico e contratos administrativos.',
      modality: 'live',
      active: true,
    }).select().single()

    if (error) {
      console.error('   Erro ao criar curso:', error.message)
      return
    }
    console.log(`   Criado: "${newCourse.title}" (${newCourse.id})`)
    courseId = newCourse.id

    // Associate with Plenum tenant
    await db.from('tenant_courses').insert({
      tenant_id: PLENUM_TENANT_ID,
      course_id: courseId,
    })
    console.log('   Associado ao tenant Plenum')
  }

  // 2. Test Mux credentials
  console.log('\n2. Testando credenciais Mux...')

  const tokenId = process.env.MUX_TOKEN_ID
  const tokenSecret = process.env.MUX_TOKEN_SECRET

  if (!tokenId || !tokenSecret) {
    console.error('   MUX_TOKEN_ID ou MUX_TOKEN_SECRET nao configurados em .env.local')
    console.log('   Pulando teste Mux.')
    return
  }

  try {
    const mux = new Mux({ tokenId, tokenSecret })

    // List live streams to verify credentials
    const streams = await mux.video.liveStreams.list({ limit: 1 })
    console.log(`   Credenciais OK! (${streams.data?.length ?? 0} streams existentes)`)

    // 3. Create a test live stream
    console.log('\n3. Criando live stream de teste no Mux...')
    const liveStream = await mux.video.liveStreams.create({
      playback_policy: ['public'],
      new_asset_settings: {
        playback_policy: ['public'],
      },
      latency_mode: 'low',
    })

    const playbackId = liveStream.playback_ids?.[0]?.id ?? null
    console.log(`   Stream ID: ${liveStream.id}`)
    console.log(`   Stream Key: ${liveStream.stream_key}`)
    console.log(`   Playback ID: ${playbackId}`)

    // 4. Save as live_session in DB
    console.log('\n4. Salvando sessao no banco...')
    const now = new Date()
    const scheduledStart = new Date(now.getTime() + 24 * 60 * 60 * 1000) // tomorrow
    const scheduledEnd = new Date(scheduledStart.getTime() + 2 * 60 * 60 * 1000) // +2h

    const { data: session, error: dbErr } = await db.from('live_sessions').insert({
      course_id: courseId,
      title: 'Aula Teste - Pregao Eletronico (Demo)',
      description: 'Sessao de teste para validar integracao OBS → Mux → Plataforma.',
      scheduled_start: scheduledStart.toISOString(),
      scheduled_end: scheduledEnd.toISOString(),
      mux_live_stream_id: liveStream.id,
      mux_stream_key: liveStream.stream_key ?? null,
      mux_playback_id: playbackId,
      status: 'scheduled',
    }).select().single()

    if (dbErr) {
      console.error('   Erro ao salvar sessao:', dbErr.message)
      // Cleanup Mux stream
      await mux.video.liveStreams.delete(liveStream.id)
      console.log('   Stream Mux deletado (cleanup)')
      return
    }

    console.log(`   Sessao salva: ${session.id}`)

    // Summary
    console.log('\n========================================')
    console.log('TUDO PRONTO!')
    console.log('========================================')
    console.log('')
    console.log('Curso ao vivo:')
    console.log(`  Titulo: Aulas ao Vivo - Licitacoes e Contratos`)
    console.log(`  ID: ${courseId}`)
    console.log('')
    console.log('Sessao de teste:')
    console.log(`  Titulo: Aula Teste - Pregao Eletronico (Demo)`)
    console.log(`  Data: ${scheduledStart.toLocaleDateString('pt-BR')} ${scheduledStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${scheduledEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`)
    console.log(`  ID: ${session.id}`)
    console.log('')
    console.log('Conexao OBS:')
    console.log('  Servidor: rtmps://global-live.mux.com:443/app')
    console.log(`  Stream Key: ${liveStream.stream_key}`)
    console.log('')
    console.log('Admin:')
    console.log('  Dashboard: http://localhost:3000/admin/ao-vivo')
    console.log(`  Detalhes: http://localhost:3000/admin/ao-vivo/${session.id}`)
    console.log('')
    console.log('Aluno:')
    console.log('  Lives: http://localhost:3000/ao-vivo')
    console.log('========================================')

  } catch (err: any) {
    console.error('   Erro Mux:', err.message)
    if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
      console.log('   → Verifique MUX_TOKEN_ID e MUX_TOKEN_SECRET no .env.local')
    }
  }
}

main().catch(console.error)
