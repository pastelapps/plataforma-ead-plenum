/**
 * Seed de aulas ao vivo ficticias para testar a homepage
 * Uso: npx tsx scripts/seed-live-sessions.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jyackmnjhsdllfqqxund.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5YWNrbW5qaHNkbGxmcXF4dW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUwMDQwOCwiZXhwIjoyMDg4MDc2NDA4fQ.SSOZDWCt7DG-JaeODA423YL-s4C79eM1mZqANXTOxkw'

const ORG_ID = '11111111-1111-1111-1111-111111111111'

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: 'ead' },
  auth: { autoRefreshToken: false, persistSession: false },
})

function daysFromNow(days: number, hour = 19, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

async function main() {
  console.log('=== Seed Aulas ao Vivo ===\n')

  // Limpar sessoes demo antigas
  console.log('Limpando sessoes anteriores...')
  await db.from('live_sessions').delete().eq('organization_id', ORG_ID)
  // Also delete ones with demo stream keys
  await db.from('live_sessions').delete().like('mux_stream_key', 'demo-%')

  const sessions = [
    // === PROXIMAS (scheduled) ===
    {
      title: 'Pregao Eletronico na Pratica',
      description: 'Simulacao completa de um pregao eletronico no ComprasNet. Vamos passar por todas as etapas: cadastro, proposta, lances, habilitacao e adjudicacao.',
      instructor_name: 'Prof. Carlos Mendes',
      scheduled_start: daysFromNow(1, 19, 0),
      scheduled_end: daysFromNow(1, 21, 0),
      status: 'scheduled',
      organization_id: ORG_ID,
    },
    {
      title: 'Nova Lei de Licitacoes - O que mudou?',
      description: 'Analise das principais mudancas da Lei 14.133/2021 e como ela impacta o dia a dia do pregoeiro e da comissao de licitacao.',
      instructor_name: 'Dra. Ana Paula Oliveira',
      scheduled_start: daysFromNow(2, 20, 0),
      scheduled_end: daysFromNow(2, 22, 0),
      status: 'scheduled',
      organization_id: ORG_ID,
    },
    {
      title: 'Contratos Administrativos - Gestao e Fiscalizacao',
      description: 'Como fazer a gestao eficiente de contratos administrativos, incluindo aditivos, reequilibrio e penalidades.',
      instructor_name: 'Prof. Roberto Almeida',
      scheduled_start: daysFromNow(3, 14, 0),
      scheduled_end: daysFromNow(3, 16, 30),
      status: 'scheduled',
      organization_id: ORG_ID,
    },
    {
      title: 'Dispensa e Inexigibilidade de Licitacao',
      description: 'Hipoteses legais, fundamentacao e cuidados na contratacao direta. Jurisprudencia do TCU.',
      instructor_name: 'Dr. Marcos Tavares',
      scheduled_start: daysFromNow(5, 19, 30),
      scheduled_end: daysFromNow(5, 21, 30),
      status: 'scheduled',
      organization_id: ORG_ID,
    },
    {
      title: 'Elaboracao de Termos de Referencia',
      description: 'Passo a passo para elaborar TR completos e bem fundamentados. Modelos praticos e erros comuns.',
      instructor_name: 'Prof. Carlos Mendes',
      scheduled_start: daysFromNow(7, 19, 0),
      scheduled_end: daysFromNow(7, 21, 0),
      status: 'scheduled',
      organization_id: ORG_ID,
    },
    {
      title: 'Registro de Precos - Sistema e Ata',
      description: 'Como funciona o SRP, adesao a ata (carona), e boas praticas na gestao de atas de registro de precos.',
      instructor_name: 'Dra. Ana Paula Oliveira',
      scheduled_start: daysFromNow(10, 20, 0),
      scheduled_end: daysFromNow(10, 22, 0),
      status: 'scheduled',
      organization_id: ORG_ID,
    },
    {
      title: 'Pregao Presencial vs Eletronico',
      description: 'Comparativo, vantagens e quando utilizar cada modalidade. Cases reais.',
      instructor_name: 'Prof. Roberto Almeida',
      scheduled_start: daysFromNow(14, 19, 0),
      scheduled_end: daysFromNow(14, 21, 0),
      status: 'scheduled',
      organization_id: ORG_ID,
    },

    // === PASSADAS (ended) ===
    {
      title: 'Aula Inaugural - Boas-vindas ao Programa',
      description: 'Apresentacao do programa, metodologia e cronograma das aulas ao vivo.',
      instructor_name: 'Prof. Carlos Mendes',
      scheduled_start: daysFromNow(-14, 19, 0),
      scheduled_end: daysFromNow(-14, 20, 30),
      actual_start: daysFromNow(-14, 19, 5),
      actual_end: daysFromNow(-14, 20, 35),
      status: 'ended',
      recording_available: true,
      recording_duration_sec: 5400,
      organization_id: ORG_ID,
    },
    {
      title: 'Fundamentos da Lei 8.666/93',
      description: 'Revisao dos conceitos fundamentais da antiga lei de licitacoes e sua relacao com a nova lei.',
      instructor_name: 'Dr. Marcos Tavares',
      scheduled_start: daysFromNow(-10, 20, 0),
      scheduled_end: daysFromNow(-10, 22, 0),
      actual_start: daysFromNow(-10, 20, 3),
      actual_end: daysFromNow(-10, 21, 55),
      status: 'ended',
      recording_available: true,
      recording_duration_sec: 6720,
      organization_id: ORG_ID,
    },
    {
      title: 'Planejamento de Contratacoes Publicas',
      description: 'ETP, mapa de riscos e como planejar contratacoes de forma estrategica.',
      instructor_name: 'Dra. Ana Paula Oliveira',
      scheduled_start: daysFromNow(-7, 19, 0),
      scheduled_end: daysFromNow(-7, 21, 0),
      actual_start: daysFromNow(-7, 19, 2),
      actual_end: daysFromNow(-7, 20, 58),
      status: 'ended',
      recording_available: true,
      recording_duration_sec: 7080,
      organization_id: ORG_ID,
    },
    {
      title: 'Pesquisa de Precos - Metodologia IN 73/2020',
      description: 'Como realizar pesquisa de precos conforme a instrucao normativa. Fontes, parametros e relatorio.',
      instructor_name: 'Prof. Carlos Mendes',
      scheduled_start: daysFromNow(-3, 19, 0),
      scheduled_end: daysFromNow(-3, 21, 0),
      actual_start: daysFromNow(-3, 19, 8),
      actual_end: daysFromNow(-3, 21, 5),
      status: 'ended',
      recording_available: false,
      organization_id: ORG_ID,
    },
  ]

  for (const s of sessions) {
    const { data, error } = await db.from('live_sessions').insert(s as any).select('id, title, status').single()
    if (error) {
      console.error(`ERRO: ${s.title} - ${error.message}`)
    } else {
      const icon = s.status === 'scheduled' ? '📅' : s.status === 'ended' ? '✅' : '🔴'
      console.log(`${icon} [${s.status}] ${data.title}`)
    }
  }

  console.log(`\n${sessions.length} sessoes criadas!`)
  console.log('Acesse: http://localhost:3000')
}

main().catch(console.error)
