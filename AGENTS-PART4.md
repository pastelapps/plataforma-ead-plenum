# AGENTS-PART4.md — Integrações, Deploy & QA, Árvore de Arquivos

> **Continuação de AGENTS-PART3.md** — Leia PART1, PART2 e PART3 primeiro.

---

## 12. AGENTE 8 — INTEGRAÇÕES

**Responsabilidade:** Implementar todas as integrações externas: webhook do Panda Video (tracking de progresso), Resend (emails transacionais), PostHog (analytics), Supabase Storage (uploads), e API de geração de certificados PDF.

### 8.1 — Webhook do Panda Video (Tracking de Progresso)

**Rota:** `src/app/api/webhooks/panda/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

const WEBHOOK_SECRET = process.env.PANDA_WEBHOOK_SECRET!

/**
 * Webhook recebido do Panda Video quando o aluno assiste um vídeo.
 *
 * Eventos relevantes:
 * - video.played: aluno iniciou o vídeo
 * - video.progress: aluno atingiu X% do vídeo (configurável no Panda)
 * - video.completed: aluno assistiu 100% do vídeo
 *
 * O Panda envia o panda_video_id no payload.
 * Precisamos cruzar com a tabela lessons para encontrar a aula.
 * Depois cruzar com enrollments para encontrar a matrícula.
 *
 * PROBLEMA: O Panda não sabe qual aluno assistiu (não temos ID do user no player).
 * SOLUÇÃO: Usar o campo "metadata" do embed do Panda para enviar enrollment_id + lesson_id.
 * Configurar no embed: ?metadata={"enrollment_id":"xxx","lesson_id":"yyy"}
 */
export async function POST(request: NextRequest) {
  const body = await request.text()

  // 1. Verificar assinatura do webhook
  const signature = request.headers.get('x-panda-signature')
  if (!verifyPandaSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  const supabase = createServiceRoleClient()

  // 2. Extrair dados do evento
  const {
    event: eventType,
    payload: {
      video_id: pandaVideoId,
      metadata,           // { enrollment_id, lesson_id } — enviado via embed
      progress_percent,   // 0-100 — para eventos de progress
      watched_seconds,
    },
  } = event

  // 3. Validar metadata
  if (!metadata?.enrollment_id || !metadata?.lesson_id) {
    console.warn('Panda webhook: missing metadata', { pandaVideoId, eventType })
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
  }

  const { enrollment_id, lesson_id } = metadata

  // 4. Buscar a aula para obter duração total
  const { data: lesson } = await supabase
    .from('lessons')
    .select('video_duration_sec')
    .eq('id', lesson_id)
    .single()

  // 5. Atualizar lesson_progress
  switch (eventType) {
    case 'video.played':
    case 'video.progress': {
      const isCompleted = (progress_percent ?? 0) >= 90 // Considerar completo com 90%+

      await supabase
        .from('lesson_progress')
        .upsert({
          enrollment_id,
          lesson_id,
          watched_seconds: watched_seconds ?? 0,
          total_seconds: lesson?.video_duration_sec ?? 0,
          percentage: progress_percent ?? 0,
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          last_watched_at: new Date().toISOString(),
        }, {
          onConflict: 'enrollment_id,lesson_id',
        })

      // O trigger recalculate_enrollment_progress() no banco
      // será acionado automaticamente e atualizará o enrollment.progress
      break
    }

    case 'video.completed': {
      await supabase
        .from('lesson_progress')
        .upsert({
          enrollment_id,
          lesson_id,
          watched_seconds: lesson?.video_duration_sec ?? watched_seconds ?? 0,
          total_seconds: lesson?.video_duration_sec ?? 0,
          percentage: 100,
          completed: true,
          completed_at: new Date().toISOString(),
          last_watched_at: new Date().toISOString(),
        }, {
          onConflict: 'enrollment_id,lesson_id',
        })
      break
    }
  }

  return NextResponse.json({ received: true })
}

function verifyPandaSignature(body: string, signature: string | null): boolean {
  if (!signature || !WEBHOOK_SECRET) return false
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}
```

**Configuração do embed do Panda Video com metadata:**

```typescript
// No componente PandaVideoPlayer, a URL do embed deve incluir metadata:

const embedUrl = `https://player-vz-*.tv.pandavideo.com.br/embed/?v=${pandaVideoId}&metadata=${encodeURIComponent(JSON.stringify({
  enrollment_id: enrollmentId,
  lesson_id: lessonId,
}))}`
```

**Configuração no Panda Video (manual — instruir no README):**

```
No painel do Panda Video:
1. Ir em Configurações → Webhooks
2. Adicionar URL: https://suaplataforma.com.br/api/webhooks/panda
3. Eventos: video.played, video.progress, video.completed
4. Configurar threshold de progresso: 25%, 50%, 75%, 90%
5. Salvar webhook secret em PANDA_WEBHOOK_SECRET
```

### 8.2 — Resend (Emails Transacionais)

**Arquivo:** `src/lib/resend/client.ts`

```typescript
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)
```

**Templates de email a criar:**

```
src/lib/resend/templates/
├── magic-link.tsx          # Email de login com magic link
├── invitation.tsx          # Convite para o aluno acessar a plataforma
├── welcome.tsx             # Boas-vindas após aceitar o convite
├── certificate-ready.tsx   # Aviso de que o certificado está disponível
└── course-reminder.tsx     # Lembrete de curso inativo (para agendamento futuro)
```

**Template de convite:**

```typescript
// src/lib/resend/templates/invitation.tsx

import { Html, Head, Body, Container, Text, Button, Heading, Hr } from '@react-email/components'

interface InvitationEmailProps {
  tenantName: string
  inviteUrl: string
  expiresInDays: number
  studentName?: string
}

export function InvitationEmail({
  tenantName,
  inviteUrl,
  expiresInDays,
  studentName,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
          <Heading style={{ fontSize: 24, color: '#111827' }}>
            Você foi convidado! 🎓
          </Heading>

          <Text style={{ fontSize: 16, color: '#374151' }}>
            {studentName ? `Olá, ${studentName}!` : 'Olá!'}
          </Text>

          <Text style={{ fontSize: 16, color: '#374151' }}>
            Você foi convidado para acessar a plataforma de cursos de <strong>{tenantName}</strong>.
            Clique no botão abaixo para aceitar o convite e começar seus estudos.
          </Text>

          <Button
            href={inviteUrl}
            style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'inline-block',
              fontSize: 16,
              fontWeight: 'bold',
            }}
          >
            Aceitar convite e acessar
          </Button>

          <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />

          <Text style={{ fontSize: 12, color: '#9ca3af' }}>
            Este convite expira em {expiresInDays} dias.
            Se você não reconhece esta mensagem, ignore este email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

**Template de magic link:**

```typescript
// src/lib/resend/templates/magic-link.tsx
// Similar ao convite, mas com link de login direto
// Texto: "Clique para acessar sua conta na plataforma de [tenantName]"
// Botão: "Entrar na plataforma"
// Expiração: 1 hora
```

**Template de certificado pronto:**

```typescript
// src/lib/resend/templates/certificate-ready.tsx
// Texto: "Parabéns! Seu certificado do curso [courseName] está disponível."
// Botão: "Ver meu certificado"
// Link: https://[tenant-slug].suaplataforma.com.br/certificados
```

### 8.3 — API de Geração de Certificados PDF

**Rota:** `src/app/api/certificates/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { renderToBuffer } from '@react-pdf/renderer'
import { CertificateTemplate } from '@/components/certificate/CertificateTemplate'

export async function POST(request: NextRequest) {
  const { certificateId } = await request.json()
  const supabase = createServiceRoleClient()

  // 1. Buscar certificado com todos os dados relacionados
  const { data: cert } = await supabase
    .from('certificates')
    .select(`
      *,
      profiles!certificates_profile_id_fkey (full_name),
      courses!certificates_course_id_fkey (title, duration_minutes),
      tenants!certificates_tenant_id_fkey (
        name,
        design_assets (
          logo_horizontal_url,
          certificate_bg_url,
          certificate_logo_url,
          certificate_signature_url
        )
      )
    `)
    .eq('id', certificateId)
    .single()

  if (!cert) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  // 2. Buscar cores primárias do tenant para o PDF
  const { data: tokens } = await supabase
    .from('design_tokens')
    .select('color_primary_500, color_secondary_500')
    .eq('tenant_id', cert.tenant_id)
    .eq('mode', 'light')
    .single()

  // 3. Gerar PDF
  const pdfBuffer = await renderToBuffer(
    CertificateTemplate({
      data: {
        studentName: cert.student_name,
        courseName: cert.course_title,
        tenantName: cert.tenant_name,
        durationHours: cert.duration_hours ?? 0,
        issuedAt: cert.issued_at,
        verificationCode: cert.verification_code,
        tenantLogoUrl: cert.tenants?.design_assets?.certificate_logo_url
                    ?? cert.tenants?.design_assets?.logo_horizontal_url
                    ?? null,
        certificateBgUrl: cert.tenants?.design_assets?.certificate_bg_url ?? null,
        signatureUrl: cert.tenants?.design_assets?.certificate_signature_url ?? null,
        primaryColor: tokens?.color_primary_500 ?? '#3b82f6',
        secondaryColor: tokens?.color_secondary_500 ?? '#22c55e',
      },
    })
  )

  // 4. Upload para Supabase Storage
  const fileName = `certificates/${cert.tenant_id}/${cert.id}.pdf`
  const { data: uploaded, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 })
  }

  // 5. Obter URL pública
  const { data: publicUrl } = supabase.storage
    .from('documents')
    .getPublicUrl(fileName)

  // 6. Atualizar certificado com a URL do PDF
  await supabase
    .from('certificates')
    .update({ pdf_url: publicUrl.publicUrl })
    .eq('id', cert.id)

  return NextResponse.json({
    success: true,
    pdfUrl: publicUrl.publicUrl,
  })
}
```

### 8.4 — PostHog (Analytics de Produto)

**Arquivo:** `src/lib/posthog/client.ts`

```typescript
import posthog from 'posthog-js'

export function initPostHog() {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
  })
}

export { posthog }
```

**Arquivo:** `src/components/providers/PostHogProvider.tsx`

```typescript
'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, posthog } from '@/lib/posthog/client'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    initPostHog()
  }, [])

  useEffect(() => {
    if (pathname) {
      posthog.capture('$pageview', { url: pathname + (searchParams?.toString() ?? '') })
    }
  }, [pathname, searchParams])

  return <>{children}</>
}
```

**Eventos customizados a rastrear:**

```typescript
// Usar em componentes e APIs:

// Aluno
posthog.capture('course_viewed', { courseId, courseTitle })
posthog.capture('lesson_started', { lessonId, courseId })
posthog.capture('lesson_completed', { lessonId, courseId })
posthog.capture('course_completed', { courseId })
posthog.capture('certificate_downloaded', { certificateId })
posthog.capture('forum_post_created', { courseId })

// Admin
posthog.capture('course_created', { courseId })
posthog.capture('course_published', { courseId })
posthog.capture('invitation_sent', { tenantId, count })
posthog.capture('design_system_updated', { tenantId })
```

### 8.5 — Supabase Storage (Upload de assets)

**Rota:** `src/app/api/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

/**
 * Proxy seguro de upload para Supabase Storage.
 * Aceita uploads de imagens e PDFs.
 * Organiza em buckets por tipo:
 * - tenant-assets/{tenantId}/logos/
 * - tenant-assets/{tenantId}/banners/
 * - tenant-assets/{tenantId}/certificates/
 * - course-assets/{courseId}/thumbnails/
 * - course-assets/{courseId}/attachments/
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const bucket = formData.get('bucket') as string  // 'tenant-assets' | 'course-assets'
  const path = formData.get('path') as string       // ex: '{tenantId}/logos/logo.png'

  if (!file || !bucket || !path) {
    return NextResponse.json({ error: 'Missing file, bucket, or path' }, { status: 400 })
  }

  // Validar tipo de arquivo
  const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  // Validar tamanho (máx 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const buffer = Buffer.from(await file.arrayBuffer())

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: publicUrl } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl.publicUrl })
}
```

**Buckets a criar no Supabase Storage (via Dashboard ou migration):**

```
1. tenant-assets  — logos, banners, backgrounds, certificados
   - Public: true (as imagens precisam ser acessíveis sem auth)
   - Size limit: 10MB por arquivo

2. course-assets  — thumbnails e attachments de cursos
   - Public: true
   - Size limit: 10MB por arquivo

3. documents      — PDFs gerados (certificados)
   - Public: true
   - Size limit: 5MB por arquivo
```

**Entrega esperada do Agente 8:**

- [ ] `src/app/api/webhooks/panda/route.ts` — webhook de progresso com verificação de assinatura
- [ ] `src/lib/panda/webhook.ts` — helpers de validação
- [ ] Componente PandaVideoPlayer atualizado com metadata no embed
- [ ] `src/lib/resend/client.ts` — instância Resend
- [ ] 5 templates de email: magic-link, invitation, welcome, certificate-ready, course-reminder
- [ ] `src/app/api/certificates/generate/route.ts` — geração de PDF + upload Storage
- [ ] `src/lib/posthog/client.ts` + `PostHogProvider` — analytics
- [ ] `src/app/api/upload/route.ts` — proxy de upload para Supabase Storage
- [ ] Documentação dos buckets de Storage a criar
- [ ] README com instruções de configuração do webhook no Panda Video

---

## 13. AGENTE 9 — DEPLOY, SEEDS & QA

**Responsabilidade:** Seed data para demonstração, testes, configuração de domínios, CI/CD e checklist de lançamento.

### 9.1 — Seed Data

**Arquivo:** `supabase/seed.sql`

```sql
-- ============================================================
-- SEED DATA PARA DEMONSTRAÇÃO
-- ============================================================

-- 1. Organization
insert into organizations (id, name, slug, email) values
  ('11111111-1111-1111-1111-111111111111', 'CEAP - Centro de Ensino', 'ceap', 'admin@ceap.edu.br');

-- 2. Organization Admin (precisa criar o auth.user primeiro via Dashboard ou script)
-- O user_id será o ID do auth.user criado manualmente
-- insert into organization_admins (organization_id, user_id, role) values
--   ('11111111-1111-1111-1111-111111111111', 'AUTH_USER_ID_AQUI', 'owner');

-- 3. Tenants
insert into tenants (id, organization_id, name, slug, custom_domain, completion_threshold) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'Prefeitura de Guaxupé', 'prefeitura-guaxupe', null, 80.00),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
   'Prefeitura de Muzambinho', 'prefeitura-muzambinho', null, 80.00);

-- 4. Design Tokens (light mode — Guaxupé: azul institucional)
insert into design_tokens (tenant_id, mode, color_primary_500, color_primary_600, color_sidebar_bg)
values ('22222222-2222-2222-2222-222222222222', 'light', '#1a5276', '#154360', '#0e2f44');

-- 5. Design Tokens (light mode — Muzambinho: verde natureza)
insert into design_tokens (tenant_id, mode, color_primary_500, color_primary_600, color_sidebar_bg)
values ('33333333-3333-3333-3333-333333333333', 'light', '#16a34a', '#15803d', '#14532d');

-- 6. Design Assets (vazio — admin do tenant preenche)
insert into design_assets (tenant_id) values
  ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333');

-- 7. Design Presets
insert into design_presets (name, description, is_default, tokens_snapshot) values
  ('Azul Institucional', 'Clássico e profissional', true, '{"primary500":"#3b82f6"}'),
  ('Verde Natureza', 'Fresco e acolhedor', false, '{"primary500":"#16a34a"}'),
  ('Roxo Educação', 'Moderno e criativo', false, '{"primary500":"#8b5cf6"}');

-- 8. Cursos de exemplo
insert into courses (id, organization_id, title, slug, description, short_description, status, category, level, instructor_name, duration_minutes) values
  ('aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   'Gestão Pública Moderna', 'gestao-publica-moderna',
   'Curso completo sobre gestão pública, abordando planejamento, orçamento, licitações e controle.',
   'Aprenda os fundamentos da gestão pública moderna.',
   'published', 'gestão', 'intermediate', 'Prof. Carlos Silva', 720),
  ('aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   'Atendimento ao Cidadão', 'atendimento-cidadao',
   'Técnicas de atendimento ao público para servidores municipais.',
   'Melhore a qualidade do atendimento ao cidadão.',
   'published', 'atendimento', 'beginner', 'Profa. Ana Santos', 480);

-- 9. Módulos do curso 1
insert into modules (id, course_id, title, slug, position) values
  ('bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Fundamentos da Gestão Pública', 'fundamentos', 0),
  ('bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Planejamento Público', 'planejamento', 1),
  ('bbbb3333-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Licitações e Contratos', 'licitacoes', 2);

-- 10. Aulas do módulo 1
insert into lessons (module_id, title, slug, position, content_type, video_duration_sec, is_required) values
  ('bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Introdução à Administração Pública', 'introducao', 0, 'video', 754, true),
  ('bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Princípios Constitucionais', 'principios', 1, 'video', 920, true),
  ('bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Estrutura do Estado Brasileiro', 'estrutura-estado', 2, 'video', 1125, true),
  ('bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Material Complementar', 'material-complementar', 3, 'text', null, false);

-- 11. Contratos (tenant Guaxupé contratou ambos os cursos)
insert into tenant_courses (tenant_id, course_id) values
  ('22222222-2222-2222-2222-222222222222', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- 12. Tenant Muzambinho contratou apenas o primeiro
insert into tenant_courses (tenant_id, course_id) values
  ('33333333-3333-3333-3333-333333333333', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
```

### 9.2 — Configuração de Domínios (Vercel)

```bash
# Configurar wildcard DNS na Vercel para subdomínios
npx vercel domains add "*.suaplataforma.com.br" --token $VERCEL_TOKEN

# OU configurar domínio raiz + wildcard:
npx vercel domains add suaplataforma.com.br --token $VERCEL_TOKEN
npx vercel domains add "*.suaplataforma.com.br" --token $VERCEL_TOKEN

# Para domínios customizados de tenants (ex: ead.guaxupe.mg.gov.br):
# O admin da organization precisa adicionar o domínio via painel
# E o tenant precisa configurar CNAME no DNS deles apontando para cname.vercel-dns.com
```

**No arquivo `next.config.js` — configuração de domínios:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },           // Supabase Storage
      { protocol: 'https', hostname: '**.pandavideo.com.br' },     // Thumbnails Panda
      { protocol: 'https', hostname: '**.suaplataforma.com.br' },  // Assets próprios
    ],
  },
  // Permitir que subdomínios e domínios customizados funcionem
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### 9.3 — Supabase Storage Buckets

```sql
-- Executar via Supabase Dashboard → SQL Editor (storage não suporta migration)
-- OU criar via API/Dashboard

-- Bucket para assets de tenants (logos, banners, backgrounds)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tenant-assets',
  'tenant-assets',
  true,
  10485760, -- 10MB
  array['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/webp']
);

-- Bucket para assets de cursos (thumbnails, attachments)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-assets',
  'course-assets',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
);

-- Bucket para documentos gerados (certificados PDF)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  true,
  5242880, -- 5MB
  array['application/pdf']
);

-- Storage policies
create policy "tenant-assets: public read"
  on storage.objects for select
  using (bucket_id = 'tenant-assets');

create policy "tenant-assets: authenticated upload"
  on storage.objects for insert
  with check (bucket_id = 'tenant-assets' and auth.role() = 'authenticated');

create policy "course-assets: public read"
  on storage.objects for select
  using (bucket_id = 'course-assets');

create policy "course-assets: authenticated upload"
  on storage.objects for insert
  with check (bucket_id = 'course-assets' and auth.role() = 'authenticated');

create policy "documents: public read"
  on storage.objects for select
  using (bucket_id = 'documents');

create policy "documents: service role upload"
  on storage.objects for insert
  with check (bucket_id = 'documents');
```

### 9.4 — Checklist de QA

```
PRÉ-DEPLOY:
  [ ] Todas as tabelas criadas no banco
  [ ] Seed data inserido com sucesso
  [ ] Auth: criar pelo menos 1 user admin via Supabase Dashboard
  [ ] Auth: configurar Magic Link no Supabase (Authentication → Email Templates)
  [ ] Storage: 3 buckets criados com policies
  [ ] Panda Video: webhook configurado com URL correta + secret
  [ ] Resend: domínio verificado para envio de email
  [ ] Vercel: todas as env vars configuradas
  [ ] Vercel: domínios configurados (raiz + wildcard)

TESTES FUNCIONAIS:
  [ ] Login via magic link funciona
  [ ] Convite por email: envio + aceite + criação de profile
  [ ] Admin Org: criar curso → módulos → aulas
  [ ] Admin Org: upload de vídeo no Panda Video funciona
  [ ] Admin Org: publicar curso (validações OK)
  [ ] Admin Org: criar tenant + configurar design tokens padrão
  [ ] Admin Org: ativar curso para tenant
  [ ] Admin Tenant: editor de Design System salva e invalida cache
  [ ] Admin Tenant: upload de logos e banners funciona
  [ ] Admin Tenant: convidar aluno funciona (individual + lote)
  [ ] Admin Tenant: matricular aluno em curso funciona
  [ ] Aluno: homepage mostra cursos corretos
  [ ] Aluno: card de curso mostra thumbnail transparente com fundo do tenant
  [ ] Aluno: página de curso mostra módulos e aulas com status correto
  [ ] Aluno: player de vídeo carrega e reproduz
  [ ] Aluno: webhook de progresso atualiza lesson_progress
  [ ] Aluno: progresso do enrollment é recalculado automaticamente
  [ ] Aluno: certificado é gerado automaticamente ao completar curso
  [ ] Aluno: PDF do certificado é gerado com dados corretos
  [ ] Aluno: verificação pública de certificado funciona
  [ ] Aluno: fórum de curso (criar post + comentar)
  [ ] Aluno: notificações aparecem e marcam como lidas
  [ ] Aluno: dark mode funciona com cores corretas
  [ ] Multi-tenant: 2 tenants diferentes mostram identidade visual diferente
  [ ] Multi-tenant: dados de aluno são isolados entre tenants
  [ ] RLS: aluno não acessa dados de outro tenant
  [ ] RLS: admin do tenant não acessa dados de outro tenant
  [ ] Performance: design tokens são cacheados (segundo request vem do Redis)

RESPONSIVIDADE:
  [ ] Homepage mobile (< 640px)
  [ ] Catálogo mobile
  [ ] Player de vídeo mobile (16:9 responsivo)
  [ ] Painel admin tablet (768px)
  [ ] Design System editor funciona em tablet+
```

### 9.5 — CI/CD (GitHub Actions)

**Arquivo:** `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npx vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}
```

**Entrega esperada do Agente 9:**

- [ ] `supabase/seed.sql` com dados de demonstração
- [ ] Domínios configurados na Vercel (raiz + wildcard)
- [ ] `next.config.js` com configuração de imagens e headers
- [ ] Buckets de Storage criados com policies
- [ ] Checklist de QA executada com sucesso
- [ ] CI/CD configurado com GitHub Actions
- [ ] README.md com instruções de setup e configuração
- [ ] `.env.example` com todas as variáveis documentadas

---

## 14. ÁRVORE COMPLETA DE ARQUIVOS

```
plataforma-ead-multitenant/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── public/
│   └── placeholder.svg
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── magic-link/page.tsx
│   │   │   └── invite/[token]/page.tsx
│   │   ├── (tenant)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                      # Homepage aluno
│   │   │   ├── cursos/
│   │   │   │   ├── page.tsx                  # Catálogo
│   │   │   │   └── [courseSlug]/
│   │   │   │       ├── page.tsx              # Página do curso
│   │   │   │       └── aula/
│   │   │   │           └── [lessonSlug]/page.tsx  # Player
│   │   │   ├── certificados/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [certificateId]/page.tsx
│   │   │   ├── comunidade/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [courseSlug]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── [postId]/page.tsx
│   │   │   ├── perfil/page.tsx
│   │   │   ├── notificacoes/page.tsx
│   │   │   └── favoritos/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                      # Dashboard org
│   │   │   ├── cursos/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── novo/page.tsx
│   │   │   │   └── [courseId]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── modulos/
│   │   │   │       │   ├── page.tsx
│   │   │   │       │   └── [moduleId]/aulas/
│   │   │   │       │       ├── page.tsx
│   │   │   │       │       └── nova/page.tsx
│   │   │   │       └── publicar/page.tsx
│   │   │   ├── tenants/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── novo/page.tsx
│   │   │   │   └── [tenantId]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── contratos/page.tsx
│   │   │   └── relatorios/page.tsx
│   │   ├── tenant-admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                      # Dashboard tenant
│   │   │   ├── design-system/
│   │   │   │   ├── page.tsx                  # Editor de cores
│   │   │   │   ├── assets/page.tsx           # Upload logos/banners
│   │   │   │   └── preview/page.tsx
│   │   │   ├── alunos/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── convidar/page.tsx
│   │   │   │   └── [profileId]/page.tsx
│   │   │   ├── cursos/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [courseId]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── matriculas/page.tsx
│   │   │   ├── anuncios/
│   │   │   │   ├── page.tsx
│   │   │   │   └── novo/page.tsx
│   │   │   ├── comunidade/page.tsx
│   │   │   └── relatorios/page.tsx
│   │   ├── api/
│   │   │   ├── auth/callback/route.ts
│   │   │   ├── webhooks/panda/route.ts
│   │   │   ├── invitations/
│   │   │   │   ├── send/route.ts
│   │   │   │   └── accept/route.ts
│   │   │   ├── certificates/generate/route.ts
│   │   │   ├── design-system/
│   │   │   │   ├── tokens/route.ts
│   │   │   │   └── assets/route.ts
│   │   │   ├── upload/route.ts
│   │   │   └── panda/
│   │   │       ├── upload/route.ts
│   │   │       └── status/route.ts
│   │   ├── verify/[code]/page.tsx            # Verificação pública certificado
│   │   ├── layout.tsx                        # Root layout
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                               # shadcn/ui
│   │   ├── layout/
│   │   │   ├── StudentHeader.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── TenantAdminSidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── NotificationBell.tsx
│   │   ├── course/
│   │   │   ├── CourseCard.tsx
│   │   │   ├── CourseGrid.tsx
│   │   │   ├── ModuleAccordion.tsx
│   │   │   ├── LessonItem.tsx
│   │   │   ├── ContinueWatchingCard.tsx
│   │   │   └── CourseForm.tsx
│   │   ├── player/
│   │   │   └── PandaVideoPlayer.tsx
│   │   ├── design-system/
│   │   │   ├── DesignSystemEditor.tsx
│   │   │   ├── ColorPicker.tsx
│   │   │   ├── PaletteSelector.tsx
│   │   │   ├── ThemePreview.tsx
│   │   │   └── AssetUploader.tsx
│   │   ├── admin/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── CourseStatusBadge.tsx
│   │   │   └── DragDropList.tsx
│   │   ├── certificate/
│   │   │   ├── CertificateTemplate.tsx       # @react-pdf/renderer
│   │   │   └── CertificateCard.tsx
│   │   ├── community/
│   │   │   ├── ForumPostCard.tsx
│   │   │   ├── CommentThread.tsx
│   │   │   └── NewPostForm.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── AcceptInviteForm.tsx
│   │   └── providers/
│   │       ├── PostHogProvider.tsx
│   │       └── QueryProvider.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   ├── middleware.ts
│   │   │   └── admin.ts
│   │   ├── design-system/
│   │   │   ├── tokens.ts
│   │   │   ├── css-generator.ts
│   │   │   └── presets.ts
│   │   ├── tenant/
│   │   │   ├── resolver.ts
│   │   │   └── context.tsx
│   │   ├── redis/
│   │   │   └── client.ts
│   │   ├── panda/
│   │   │   ├── client.ts
│   │   │   ├── upload.ts
│   │   │   └── webhook.ts
│   │   ├── resend/
│   │   │   ├── client.ts
│   │   │   └── templates/
│   │   │       ├── magic-link.tsx
│   │   │       ├── invitation.tsx
│   │   │       ├── welcome.tsx
│   │   │       ├── certificate-ready.tsx
│   │   │       └── course-reminder.tsx
│   │   ├── posthog/
│   │   │   └── client.ts
│   │   ├── auth/
│   │   │   ├── guards.ts
│   │   │   └── session.ts
│   │   └── utils/
│   │       ├── cn.ts
│   │       └── constants.ts
│   ├── hooks/
│   │   ├── use-tenant.ts
│   │   ├── use-design-tokens.ts
│   │   ├── use-profile.ts
│   │   └── use-enrollment.ts
│   ├── types/
│   │   ├── database.types.ts                 # Gerado pelo Supabase CLI
│   │   └── app.types.ts
│   ├── styles/
│   │   └── globals.css
│   └── middleware.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── .env.example
├── .env.local
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 15. RESUMO DE CONTAGEM

| Item | Quantidade |
|------|-----------|
| Agentes | 10 (0–9) |
| Tabelas no banco | 24 |
| Triggers | 12 |
| Indexes | 29 |
| RLS Policies | 40+ |
| Helper Functions (SQL) | 3 |
| Rotas de página | ~45 |
| API Routes | ~12 |
| Componentes React | ~35 |
| Lib modules | ~20 |
| Templates de email | 5 |
| Design Presets | 5 |
| Storage Buckets | 3 |

---

## 16. REGRAS FINAIS PARA O ORQUESTRADOR

1. **Leia TODOS os 4 arquivos AGENTS-PART1 a PART4 antes de iniciar qualquer agente.**
2. **Nunca pule um agente.** A ordem é obrigatória.
3. **Cada agente deve completar TODAS as entregas listadas** antes de avançar.
4. **Se um agente falhar em alguma entrega**, tente 2x. Se persistir, pare e reporte.
5. **Ao final de cada agente**, liste o que foi entregue vs. o que era esperado.
6. **Confirme com o usuário** antes de avançar para o próximo agente.
7. **O Design System é o coração da plataforma.** Garanta que as CSS Variables funcionam corretamente em TODOS os componentes.
8. **O thumbnail transparente sobre fundo do tenant** é o diferencial visual. Teste com pelo menos 2 tenants com cores diferentes.
9. **O webhook do Panda Video** é a fonte de verdade para progresso. Garanta que funciona end-to-end.
10. **Certificados** devem ser gerados automaticamente (trigger no banco) e o PDF gerado sob demanda (API).
