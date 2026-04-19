# AGENTS-PART1.md — Contexto, Infraestrutura e Banco de Dados

## Plataforma EAD Multi-Tenant White-Label

### Sistema Multi-Agente com Orquestrador Central

> **INSTRUÇÃO PARA O CLAUDE CODE:** Leia TODOS os arquivos AGENTS-PART1 a PART4 completamente antes de qualquer ação.
> Você é o AGENTE ORQUESTRADOR. Siga rigorosamente o lineup de agentes, a ordem de execução
> e as responsabilidades de cada agente. Nunca pule etapas. Confirme cada fase antes de avançar.

---

## 1. CONTEXTO DO PROJETO

Plataforma EAD multi-tenant white-label com 3 camadas hierárquicas:

- **Organization (Master)** — ex: Plenum — cria e gerencia cursos, módulos e aulas
- **Tenant** — ex: Prefeitura de Guaxupé — contrata cursos do master, tem identidade visual 100% própria
- **Profile (Aluno)** — acessa pela plataforma do tenant, identidade desvinculada entre tenants

### Modelo de negócio (fase 1)

- **Sem pagamentos online.** O tenant contrata a organization por contrato externo.
- **Alunos são convidados por email.** O admin do tenant envia convites. Receber o convite = acesso garantido.
- **Sem quizzes/avaliações.** Certificado é liberado quando o aluno completa X% das aulas obrigatórias.

### Diferenciais obrigatórios

1. **Design System 100% dinâmico via banco de dados** — alterar uma cor na tabela `design_tokens` reflete em toda a UI instantaneamente via CSS Variables
2. **Paletas completas light/dark mode** por tenant — todas as cores semânticas (primárias, secundárias, terciárias, neutras, sucesso, erro, warning, info, backgrounds, textos, bordas, componentes)
3. **Artes de fundo transparentes** — thumbnails de cursos são PNG transparente; o card preenche o fundo com a identidade visual do tenant (gradiente, padrão ou cor sólida)
4. **Profiles desvinculados** — um `auth.user` pode ter múltiplos `profiles`, um por tenant, sem compartilhamento de dados pessoais entre tenants
5. **Convite por email** — admin do tenant convida alunos via Resend; o aluno recebe magic link, cria conta (ou usa existente) e ganha profile automático no tenant
6. **Certificado PDF dinâmico** — gerado com `@react-pdf/renderer`, usando logo/cores do tenant + dados do aluno/curso
7. **Fórum simples por curso** — posts e comentários vinculados ao curso, moderação pelo admin do tenant
8. **Tracking de progresso via webhook Panda Video** — progresso real baseado em quanto o aluno assistiu

---

## 2. VARIÁVEIS DE AMBIENTE

Todas as chaves já estão configuradas no ambiente. Use-as diretamente via `process.env`:

```env
# ========================
# SUPABASE
# ========================
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ACCESS_TOKEN=
SUPABASE_PROJECT_REF=

# ========================
# VERCEL
# ========================
VERCEL_TOKEN=

# ========================
# GITHUB
# ========================
GITHUB_TOKEN=

# ========================
# PANDA VIDEO
# ========================
PANDA_API_KEY=
PANDA_API_URL=https://api-v2.pandavideo.com.br
PANDA_FOLDER_ID=
PANDA_WEBHOOK_SECRET=

# ========================
# RESEND (emails transacionais)
# ========================
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@suaplataforma.com.br

# ========================
# UPSTASH REDIS (cache de design tokens)
# ========================
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ========================
# APP
# ========================
NEXT_PUBLIC_APP_URL=https://suaplataforma.com.br
NEXT_PUBLIC_ROOT_DOMAIN=suaplataforma.com.br

# ========================
# POSTHOG (analytics)
# ========================
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

> **Nota:** Stripe foi removido desta fase. Será adicionado em fase futura quando pagamentos online forem necessários.

---

## 3. LINEUP DE AGENTES

```
AGENTE 0  — Orquestrador (coordena tudo)
AGENTE 1  — Infra & Setup (projeto, dependências, deploy config)
AGENTE 2  — Banco de Dados (schema completo, migrations, RLS, triggers)
AGENTE 3  — Design System Engine (motor de tokens → CSS Variables)
AGENTE 4  — Auth & Tenant Resolver (middleware, magic link, convites, guards)
AGENTE 5  — Admin Panel: Organization (CRUD cursos/módulos/aulas, upload Panda, gestão tenants)
AGENTE 6  — Admin Panel: Tenant (editor Design System, gestão alunos, convites, progresso, anúncios)
AGENTE 7  — Plataforma do Aluno (dashboard, catálogo, player, certificados, fórum, perfil)
AGENTE 8  — Integrações (Panda webhook, Resend emails, PostHog analytics, Supabase Storage)
AGENTE 9  — Deploy, Seeds & QA (seed data, testes, domínios, CI/CD)
```

**Ordem de execução obrigatória:**
```
AGENTE 1 → AGENTE 2 → AGENTE 3 → AGENTE 4 → AGENTE 5 → AGENTE 6 → AGENTE 7 → AGENTE 8 → AGENTE 9
```

---

## 4. AGENTE 0 — ORQUESTRADOR

**Responsabilidade:** Coordenar todos os agentes, verificar pré-requisitos, sequenciar execução, validar entregas de cada agente antes de acionar o próximo, reportar progresso ao usuário.

**Regras do Orquestrador:**

1. Nunca execute código de outro agente diretamente — sempre delegue
2. Antes de acionar cada agente, verifique se o agente anterior completou com sucesso
3. Se um agente falhar, tente 2x antes de reportar ao usuário
4. Mantenha um log de status para cada agente:

```
AGENTE 1: [ PENDENTE | EM PROGRESSO | CONCLUÍDO | FALHOU ]
AGENTE 2: [ PENDENTE | EM PROGRESSO | CONCLUÍDO | FALHOU ]
...
AGENTE 9: [ PENDENTE | EM PROGRESSO | CONCLUÍDO | FALHOU ]
```

5. Ao final de cada agente, liste as entregas esperadas vs. entregas realizadas
6. Confirme com o usuário antes de avançar para o próximo agente
7. Se um agente criar arquivos, verifique que os arquivos existem e não estão vazios
8. Se um agente rodar migrations, verifique que as tabelas foram criadas no banco

---

## 5. AGENTE 1 — INFRA & SETUP

**Responsabilidade:** Configurar toda a infraestrutura do zero via CLI

**Passo a passo:**

```bash
# ============================================================
# PASSO 1: Projeto Next.js
# ============================================================
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git

# ============================================================
# PASSO 2: Supabase CLI
# ============================================================
npm install -g supabase
supabase login --token $SUPABASE_ACCESS_TOKEN
supabase init
supabase link --project-ref $SUPABASE_PROJECT_REF

# ============================================================
# PASSO 3: Dependências do projeto
# ============================================================
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  @upstash/redis \
  resend \
  react-hook-form \
  @hookform/resolvers \
  zod \
  lucide-react \
  class-variance-authority \
  clsx \
  tailwind-merge \
  next-themes \
  @react-pdf/renderer \
  posthog-js \
  sonner \
  @tanstack/react-query \
  @dnd-kit/core \
  @dnd-kit/sortable \
  @dnd-kit/utilities \
  date-fns

# ============================================================
# PASSO 4: shadcn/ui
# ============================================================
npx shadcn@latest init --defaults

npx shadcn@latest add \
  button card input label select \
  dialog sheet tabs progress badge \
  avatar dropdown-menu separator \
  skeleton toast textarea switch \
  accordion table popover command \
  alert-dialog tooltip checkbox \
  scroll-area collapsible

# ============================================================
# PASSO 5: GitHub
# ============================================================
gh auth login --with-token <<< $GITHUB_TOKEN
git init
git add -A
git commit -m "chore: initial setup"
gh repo create plataforma-ead-multitenant --private --source=. --remote=origin --push

# ============================================================
# PASSO 6: Vercel
# ============================================================
npx vercel login --token $VERCEL_TOKEN
npx vercel link --yes --token $VERCEL_TOKEN

# Configurar todas as env vars
declare -A ENV_VARS=(
  ["NEXT_PUBLIC_SUPABASE_URL"]="$NEXT_PUBLIC_SUPABASE_URL"
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="$NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ["SUPABASE_SERVICE_ROLE_KEY"]="$SUPABASE_SERVICE_ROLE_KEY"
  ["PANDA_API_KEY"]="$PANDA_API_KEY"
  ["PANDA_API_URL"]="$PANDA_API_URL"
  ["PANDA_FOLDER_ID"]="$PANDA_FOLDER_ID"
  ["PANDA_WEBHOOK_SECRET"]="$PANDA_WEBHOOK_SECRET"
  ["RESEND_API_KEY"]="$RESEND_API_KEY"
  ["RESEND_FROM_EMAIL"]="$RESEND_FROM_EMAIL"
  ["UPSTASH_REDIS_REST_URL"]="$UPSTASH_REDIS_REST_URL"
  ["UPSTASH_REDIS_REST_TOKEN"]="$UPSTASH_REDIS_REST_TOKEN"
  ["NEXT_PUBLIC_APP_URL"]="$NEXT_PUBLIC_APP_URL"
  ["NEXT_PUBLIC_ROOT_DOMAIN"]="$NEXT_PUBLIC_ROOT_DOMAIN"
  ["NEXT_PUBLIC_POSTHOG_KEY"]="$NEXT_PUBLIC_POSTHOG_KEY"
  ["NEXT_PUBLIC_POSTHOG_HOST"]="$NEXT_PUBLIC_POSTHOG_HOST"
)

for key in "${!ENV_VARS[@]}"; do
  echo "${ENV_VARS[$key]}" | npx vercel env add "$key" production --token $VERCEL_TOKEN
done
```

**Estrutura de pastas a criar:**

```
src/
├── app/
│   ├── (auth)/                    # Rotas públicas: login, magic-link, convite
│   ├── (tenant)/                  # Rotas do aluno (resolvidas por tenant)
│   │   ├── layout.tsx             # Injeta Design System CSS Variables
│   │   ├── page.tsx               # Homepage do aluno
│   │   ├── cursos/                # Catálogo e detalhe de curso
│   │   ├── aula/                  # Player de vídeo
│   │   ├── certificados/          # Lista e download de certificados
│   │   ├── comunidade/            # Fórum por curso
│   │   ├── perfil/                # Perfil do aluno
│   │   └── notificacoes/          # Central de notificações
│   ├── admin/                     # Painel da Organization (master)
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Dashboard do master
│   │   ├── cursos/                # CRUD cursos/módulos/aulas
│   │   ├── tenants/               # Gestão de tenants
│   │   └── relatorios/            # Analytics
│   ├── tenant-admin/              # Painel do Tenant Admin
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Dashboard do tenant
│   │   ├── design-system/         # Editor visual de cores/logos
│   │   ├── alunos/                # Gestão + convites
│   │   ├── cursos/                # Cursos contratados + matrículas
│   │   ├── anuncios/              # Avisos para alunos
│   │   └── comunidade/            # Moderação
│   ├── api/
│   │   ├── auth/                  # Magic link, callback
│   │   ├── webhooks/
│   │   │   └── panda/             # Webhook Panda Video
│   │   ├── invitations/           # Envio de convites
│   │   ├── certificates/          # Geração de PDF
│   │   ├── design-system/         # CRUD tokens + invalidação cache
│   │   ├── upload/                # Upload de assets (Supabase Storage)
│   │   └── panda/                 # Proxy para Panda Video API
│   └── verify/                    # Verificação pública de certificado
│       └── [code]/page.tsx
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── layout/                    # Header, Sidebar, Footer (usam CSS Vars)
│   ├── course/                    # CourseCard, ModuleAccordion, LessonItem
│   ├── player/                    # PandaVideoPlayer com tracking
│   ├── design-system/             # ColorPicker, ThemePreview, PalettePresets
│   ├── admin/                     # Tabelas, forms, stats cards
│   ├── certificate/               # CertificateTemplate (react-pdf)
│   └── community/                 # ForumPost, Comment, NewPostForm
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # createBrowserClient
│   │   ├── server.ts              # createServerClient
│   │   ├── middleware.ts           # createMiddlewareClient
│   │   └── admin.ts               # createServiceRoleClient
│   ├── design-system/
│   │   ├── tokens.ts              # getDesignTokens, invalidateDesignCache
│   │   ├── css-generator.ts       # tokensToCSS (converte tokens → CSS vars)
│   │   └── presets.ts             # Paletas pré-definidas
│   ├── tenant/
│   │   ├── resolver.ts            # getTenantFromHeaders (subdomínio + domínio custom)
│   │   └── context.tsx            # TenantProvider (React Context)
│   ├── redis/
│   │   └── client.ts              # Instância Upstash Redis
│   ├── panda/
│   │   ├── client.ts              # PandaVideo API client
│   │   ├── upload.ts              # Upload de vídeo
│   │   └── webhook.ts             # Validação e processamento de webhook
│   ├── resend/
│   │   ├── client.ts              # Instância Resend
│   │   └── templates/             # Templates de email (magic-link, convite, certificado, boas-vindas)
│   ├── posthog/
│   │   └── client.ts              # PostHog client
│   ├── auth/
│   │   ├── guards.ts              # requireAuth, requireRole, requireTenant
│   │   └── session.ts             # getCurrentUser, getCurrentProfile
│   └── utils/
│       ├── cn.ts                  # clsx + tailwind-merge
│       └── constants.ts           # Enums, roles, status
├── hooks/
│   ├── use-tenant.ts              # Hook para acessar tenant context
│   ├── use-design-tokens.ts       # Hook para acessar tokens no client
│   ├── use-profile.ts             # Hook para profile do aluno logado
│   └── use-enrollment.ts          # Hook para enrollment + progresso
├── types/
│   ├── database.types.ts          # Gerado pelo Supabase CLI
│   └── app.types.ts               # Types customizados da aplicação
└── middleware.ts                   # Middleware global: resolve tenant + protege rotas
```

**Entrega esperada do Agente 1:**

- [ ] Projeto Next.js criado com todas as dependências instaladas
- [ ] shadcn/ui inicializado com todos os componentes listados
- [ ] Supabase CLI autenticado e linkado ao projeto
- [ ] Estrutura de pastas criada (pode estar com arquivos placeholder)
- [ ] Repositório GitHub criado com primeiro commit
- [ ] Projeto Vercel criado e todas as env vars configuradas
- [ ] Arquivo `src/lib/utils/cn.ts` criado com a utility function

---

## 6. AGENTE 2 — BANCO DE DADOS

**Responsabilidade:** Criar todo o schema do banco de dados atualizado, incluindo tabelas faltantes, campos corrigidos, RLS completo e triggers.

**Criar arquivo:** `supabase/migrations/001_initial_schema.sql`

```sql
-- ============================================================
-- EXTENSÕES
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- ORGANIZATIONS (provedores master: Plenum, etc.)
-- ============================================================
create table organizations (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  email       text not null unique,
  logo_url    text,
  active      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- ORGANIZATION ADMINS (quem administra a organization)
-- Vincula auth.users como admin da organization
-- ============================================================
create table organization_admins (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'admin', -- 'owner' | 'admin' | 'editor'
  active          boolean default true,
  created_at      timestamptz default now(),
  unique(organization_id, user_id)
);

-- ============================================================
-- TENANTS (prefeituras/clientes)
-- ============================================================
create table tenants (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  slug            text not null unique,
  custom_domain   text unique,
  active          boolean default true,
  contract_start  date,
  contract_end    date,
  -- Configurações do tenant
  allow_self_registration boolean default false,  -- se true, aluno pode se cadastrar sozinho
  completion_threshold    numeric(5,2) default 80.00,  -- % mínimo de aulas para certificado
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- DESIGN SYSTEM TOKENS (núcleo do sistema — 100% dinâmico)
-- Cada linha = 1 conjunto completo de tokens para 1 tenant em 1 mode
-- Alterar aqui reflete em toda a UI do tenant via CSS Variables
-- ============================================================
create table design_tokens (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  mode        text not null default 'light' check (mode in ('light', 'dark')),

  -- === CORES PRIMÁRIAS ===
  -- Botões principais, links, CTAs, elementos de destaque
  color_primary_50    text default '#eff6ff',
  color_primary_100   text default '#dbeafe',
  color_primary_200   text default '#bfdbfe',
  color_primary_300   text default '#93c5fd',
  color_primary_400   text default '#60a5fa',
  color_primary_500   text default '#3b82f6',  -- base
  color_primary_600   text default '#2563eb',
  color_primary_700   text default '#1d4ed8',
  color_primary_800   text default '#1e40af',
  color_primary_900   text default '#1e3a8a',

  -- === CORES SECUNDÁRIAS ===
  -- Elementos de apoio, hover states, bordas
  color_secondary_50  text default '#f0fdf4',
  color_secondary_100 text default '#dcfce7',
  color_secondary_200 text default '#bbf7d0',
  color_secondary_300 text default '#86efac',
  color_secondary_400 text default '#4ade80',
  color_secondary_500 text default '#22c55e',  -- base
  color_secondary_600 text default '#16a34a',
  color_secondary_700 text default '#15803d',
  color_secondary_800 text default '#166534',
  color_secondary_900 text default '#14532d',

  -- === CORES TERCIÁRIAS ===
  -- Acentos, tags, badges, highlights
  color_tertiary_50   text default '#fdf4ff',
  color_tertiary_100  text default '#fae8ff',
  color_tertiary_200  text default '#f5d0fe',
  color_tertiary_300  text default '#f0abfc',
  color_tertiary_400  text default '#e879f9',
  color_tertiary_500  text default '#d946ef',  -- base
  color_tertiary_600  text default '#c026d3',
  color_tertiary_700  text default '#a21caf',
  color_tertiary_800  text default '#86198f',
  color_tertiary_900  text default '#701a75',

  -- === CORES NEUTRAS (Grays) ===
  -- Textos, bordas, backgrounds sutis
  color_neutral_50    text default '#f9fafb',
  color_neutral_100   text default '#f3f4f6',
  color_neutral_200   text default '#e5e7eb',
  color_neutral_300   text default '#d1d5db',
  color_neutral_400   text default '#9ca3af',
  color_neutral_500   text default '#6b7280',
  color_neutral_600   text default '#4b5563',
  color_neutral_700   text default '#374151',
  color_neutral_800   text default '#1f2937',
  color_neutral_900   text default '#111827',

  -- === CORES SEMÂNTICAS ===
  -- Feedback visual do sistema
  color_success       text default '#22c55e',
  color_success_light text default '#dcfce7',
  color_success_dark  text default '#15803d',
  color_warning       text default '#f59e0b',
  color_warning_light text default '#fef3c7',
  color_warning_dark  text default '#b45309',
  color_error         text default '#ef4444',
  color_error_light   text default '#fee2e2',
  color_error_dark    text default '#b91c1c',
  color_info          text default '#3b82f6',
  color_info_light    text default '#dbeafe',
  color_info_dark     text default '#1d4ed8',

  -- === BACKGROUNDS ===
  color_bg_page       text default '#ffffff',
  color_bg_surface    text default '#f9fafb',
  color_bg_elevated   text default '#ffffff',
  color_bg_overlay    text default 'rgba(0,0,0,0.5)',

  -- === TEXTOS ===
  color_text_primary    text default '#111827',
  color_text_secondary  text default '#6b7280',
  color_text_disabled   text default '#d1d5db',
  color_text_inverse    text default '#ffffff',
  color_text_link       text default '#3b82f6',
  color_text_link_hover text default '#1d4ed8',

  -- === BORDAS ===
  color_border_default  text default '#e5e7eb',
  color_border_strong   text default '#d1d5db',
  color_border_focus    text default '#3b82f6',

  -- === COMPONENTES ESPECÍFICOS ===
  color_header_bg       text default '#ffffff',
  color_header_text     text default '#111827',
  color_sidebar_bg      text default '#1f2937',
  color_sidebar_text    text default '#f9fafb',
  color_sidebar_active  text default '#3b82f6',
  color_footer_bg       text default '#111827',
  color_footer_text     text default '#f9fafb',

  color_btn_primary_bg      text default '#3b82f6',
  color_btn_primary_text    text default '#ffffff',
  color_btn_primary_hover   text default '#2563eb',
  color_btn_secondary_bg    text default '#f3f4f6',
  color_btn_secondary_text  text default '#111827',
  color_btn_secondary_hover text default '#e5e7eb',
  color_btn_danger_bg       text default '#ef4444',
  color_btn_danger_text     text default '#ffffff',
  color_btn_danger_hover    text default '#dc2626',

  color_card_bg             text default '#ffffff',
  color_card_border         text default '#e5e7eb',
  color_card_shadow         text default 'rgba(0,0,0,0.08)',

  color_progress_track      text default '#e5e7eb',
  color_progress_fill       text default '#3b82f6',

  color_badge_default_bg    text default '#f3f4f6',
  color_badge_default_text  text default '#374151',

  color_input_bg            text default '#ffffff',
  color_input_border        text default '#d1d5db',
  color_input_focus_ring    text default '#3b82f6',
  color_input_placeholder   text default '#9ca3af',

  -- === TIPOGRAFIA (tamanhos em rem) ===
  font_family_heading  text default '"Inter", system-ui, sans-serif',
  font_family_body     text default '"Inter", system-ui, sans-serif',
  font_size_xs         text default '0.75rem',
  font_size_sm         text default '0.875rem',
  font_size_base       text default '1rem',
  font_size_lg         text default '1.125rem',
  font_size_xl         text default '1.25rem',
  font_size_2xl        text default '1.5rem',
  font_size_3xl        text default '1.875rem',

  -- === ESPAÇAMENTO (border-radius) ===
  radius_sm    text default '0.25rem',
  radius_md    text default '0.375rem',
  radius_lg    text default '0.5rem',
  radius_xl    text default '0.75rem',
  radius_full  text default '9999px',

  -- === SOMBRAS ===
  shadow_sm    text default '0 1px 2px rgba(0,0,0,0.05)',
  shadow_md    text default '0 4px 6px rgba(0,0,0,0.07)',
  shadow_lg    text default '0 10px 15px rgba(0,0,0,0.1)',

  -- === METADADOS ===
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(tenant_id, mode)
);

-- ============================================================
-- DESIGN ASSETS (logos, backgrounds, artes por tenant)
-- ============================================================
create table design_assets (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,

  -- Identidade da marca
  logo_square_url       text,   -- logo quadrado (ícone, favicon grande)
  logo_horizontal_url   text,   -- logo horizontal completo
  logo_dark_url         text,   -- logo para fundo escuro
  favicon_url           text,

  -- Imagens de página
  login_banner_url          text,    -- banner horizontal da tela de login
  login_banner_vertical_url text,    -- banner vertical da tela de login (mobile)
  homepage_hero_url         text,    -- hero da homepage
  homepage_hero_mobile_url  text,    -- hero da homepage (mobile)

  -- Backgrounds de cards de cursos
  -- Cursos têm thumbnail PNG COM FUNDO TRANSPARENTE
  -- Estes backgrounds preenchem o card com a identidade visual do tenant
  card_bg_pattern_1_url  text,   -- padrão de fundo 1
  card_bg_pattern_2_url  text,   -- padrão de fundo 2
  card_bg_pattern_3_url  text,   -- padrão de fundo 3
  card_bg_gradient_css   text,   -- gradiente CSS (ex: "linear-gradient(135deg, #1A5276, #2E86C1)")
  card_overlay_color     text default 'rgba(0,0,0,0.3)',

  -- Background geral da plataforma
  platform_bg_url        text,

  -- Certificado
  certificate_bg_url     text,   -- background do template de certificado
  certificate_logo_url   text,   -- logo que aparece no certificado (pode ser diferente)
  certificate_signature_url text, -- imagem da assinatura

  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(tenant_id)
);

-- ============================================================
-- DESIGN PRESETS (paletas pré-definidas para facilitar configuração)
-- ============================================================
create table design_presets (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,               -- "Azul Institucional", "Verde Natureza", etc.
  description text,
  thumbnail_url text,                      -- preview da paleta
  tokens_snapshot jsonb not null,           -- snapshot de TODOS os tokens dessa paleta
  is_default  boolean default false,
  created_at  timestamptz default now()
);

-- ============================================================
-- USERS (espelho do Supabase Auth)
-- ============================================================
create table users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- PROFILES (identidade do aluno POR TENANT — desvinculados)
-- ============================================================
create table profiles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  full_name   text not null,
  cpf         text,
  phone       text,
  department  text,
  job_title   text,
  avatar_url  text,
  role        text not null default 'student'
              check (role in ('student', 'manager', 'admin_tenant')),
  active      boolean default true,
  last_login_at timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(user_id, tenant_id)
);

-- ============================================================
-- COURSES (criados pela organization)
-- thumbnail_transparent_url = PNG com fundo transparente
-- thumbnail_url = fallback para quando não há transparência
-- ============================================================
create table courses (
  id                    uuid primary key default uuid_generate_v4(),
  organization_id       uuid not null references organizations(id) on delete cascade,
  title                 text not null,
  slug                  text not null,
  description           text,
  short_description     text,              -- resumo de 1-2 linhas para cards
  thumbnail_transparent_url text,          -- PNG com fundo transparente (principal)
  thumbnail_url         text,              -- fallback com fundo sólido
  instructor_name       text,
  instructor_bio        text,
  instructor_photo_url  text,
  duration_minutes      int,
  level                 text default 'beginner'
                        check (level in ('beginner', 'intermediate', 'advanced')),
  category              text,
  tags                  text[],
  status                text not null default 'draft'
                        check (status in ('draft', 'published', 'archived')),
  active                boolean default true,
  published_at          timestamptz,       -- data de publicação
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  unique(organization_id, slug)
);

-- ============================================================
-- MODULES (seções do curso)
-- ============================================================
create table modules (
  id          uuid primary key default uuid_generate_v4(),
  course_id   uuid not null references courses(id) on delete cascade,
  title       text not null,
  slug        text not null,
  description text,
  position    int not null default 0,      -- drag-and-drop ordering
  active      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(course_id, slug)
);

-- ============================================================
-- LESSONS (aulas — vídeo, texto ou PDF)
-- ============================================================
create table lessons (
  id                  uuid primary key default uuid_generate_v4(),
  module_id           uuid not null references modules(id) on delete cascade,
  title               text not null,
  slug                text not null,
  description         text,
  position            int not null default 0,  -- drag-and-drop ordering

  -- Conteúdo
  content_type        text not null default 'video'
                      check (content_type in ('video', 'text', 'pdf')),
  -- Se content_type = 'video':
  panda_video_id      text,                -- ID do vídeo no Panda Video
  panda_folder_id     text,                -- Pasta no Panda
  video_duration_sec  int,                 -- duração em segundos
  video_status        text default 'pending'
                      check (video_status in ('pending', 'processing', 'ready', 'error')),
  -- Se content_type = 'text':
  content_body        text,                -- conteúdo HTML/markdown
  -- Se content_type = 'pdf':
  attachment_url      text,                -- URL do PDF no Supabase Storage

  thumbnail_url       text,
  is_free_preview     boolean default false,  -- aula gratuita para preview
  is_required         boolean default true,   -- se conta no cálculo de % para certificado
  active              boolean default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  unique(module_id, slug)
);

-- ============================================================
-- TENANT_COURSES (contrato: tenant X contratou curso Y)
-- ============================================================
create table tenant_courses (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  course_id       uuid not null references courses(id) on delete cascade,
  contracted_at   timestamptz default now(),
  expires_at      timestamptz,
  max_enrollments int,                     -- limite de matrículas (null = ilimitado)
  active          boolean default true,
  unique(tenant_id, course_id)
);

-- ============================================================
-- ENROLLMENTS (matrícula do aluno no curso via tenant)
-- ============================================================
create table enrollments (
  id               uuid primary key default uuid_generate_v4(),
  profile_id       uuid not null references profiles(id) on delete cascade,
  tenant_course_id uuid not null references tenant_courses(id) on delete cascade,
  status           text default 'active'
                   check (status in ('active', 'completed', 'cancelled', 'expired')),
  progress         numeric(5,2) default 0,   -- % de conclusão
  enrolled_at      timestamptz default now(),
  completed_at     timestamptz,
  last_accessed_at timestamptz,
  unique(profile_id, tenant_course_id)
);

-- ============================================================
-- LESSON_PROGRESS (progresso por aula — alimentado pelo webhook Panda)
-- ============================================================
create table lesson_progress (
  id              uuid primary key default uuid_generate_v4(),
  enrollment_id   uuid not null references enrollments(id) on delete cascade,
  lesson_id       uuid not null references lessons(id) on delete cascade,
  watched_seconds int default 0,
  total_seconds   int default 0,           -- duração total da aula
  percentage      numeric(5,2) default 0,  -- % assistido
  completed       boolean default false,
  completed_at    timestamptz,
  last_watched_at timestamptz default now(),
  unique(enrollment_id, lesson_id)
);

-- ============================================================
-- CERTIFICATES (certificado gerado ao completar curso)
-- ============================================================
create table certificates (
  id                uuid primary key default uuid_generate_v4(),
  enrollment_id     uuid not null unique references enrollments(id) on delete cascade,
  profile_id        uuid not null references profiles(id),
  course_id         uuid not null references courses(id),
  tenant_id         uuid not null references tenants(id),
  issued_at         timestamptz default now(),
  pdf_url           text,                  -- URL do PDF no Supabase Storage
  verification_code text unique default substr(md5(random()::text), 1, 12),
  -- Dados "congelados" no momento da emissão (para o PDF não mudar se dados mudarem)
  student_name      text not null,
  course_title      text not null,
  tenant_name       text not null,
  duration_hours    numeric(6,1)
);

-- ============================================================
-- FAVORITES (cursos favoritados pelo aluno)
-- ============================================================
create table favorites (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  course_id   uuid not null references courses(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(profile_id, course_id)
);

-- ============================================================
-- INVITATIONS (convites por email — admin do tenant envia)
-- ============================================================
create table invitations (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  email       text not null,
  full_name   text,                        -- nome sugerido (aluno pode alterar)
  role        text default 'student'
              check (role in ('student', 'manager', 'admin_tenant')),
  token       text not null unique default uuid_generate_v4()::text,
  status      text default 'pending'
              check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  invited_by  uuid references profiles(id),  -- quem convidou
  accepted_at timestamptz,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz default now(),
  unique(tenant_id, email)  -- 1 convite ativo por email por tenant
);

-- ============================================================
-- MAGIC LINKS (login sem senha)
-- ============================================================
create table magic_links (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  user_id     uuid references users(id) on delete cascade,
  token       text not null unique default uuid_generate_v4()::text,
  email       text not null,
  used        boolean default false,
  expires_at  timestamptz not null default (now() + interval '1 hour'),
  created_at  timestamptz default now()
);

-- ============================================================
-- ANNOUNCEMENTS (avisos do admin do tenant para os alunos)
-- ============================================================
create table announcements (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  author_id   uuid not null references profiles(id),
  title       text not null,
  body        text not null,
  priority    text default 'normal'
              check (priority in ('low', 'normal', 'high', 'urgent')),
  pinned      boolean default false,
  published   boolean default true,
  -- Escopo: se course_id = null, é para todos os alunos do tenant
  course_id   uuid references courses(id) on delete set null,
  starts_at   timestamptz default now(),
  expires_at  timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- COURSE FORUM (fórum simples por curso)
-- ============================================================
create table forum_posts (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  course_id   uuid not null references courses(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  title       text,
  content     text not null,
  pinned      boolean default false,
  approved    boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table forum_comments (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references forum_posts(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  content     text not null,
  approved    boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- NOTIFICATIONS (centro de notificações do aluno)
-- ============================================================
create table notifications (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  type        text not null
              check (type in ('info', 'success', 'warning', 'course', 'certificate', 'announcement', 'community')),
  title       text not null,
  body        text,
  link        text,
  read        boolean default false,
  created_at  timestamptz default now()
);

-- ============================================================
-- GOALS (metas pessoais do aluno)
-- ============================================================
create table goals (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  title       text not null,
  target_date date,
  completed   boolean default false,
  completed_at timestamptz,
  created_at  timestamptz default now()
);

-- ============================================================
-- AUDIT LOG (registro de ações para compliance)
-- ============================================================
create table audit_logs (
  id          bigserial primary key,
  tenant_id   uuid references tenants(id),
  user_id     uuid references auth.users(id),
  action      text not null,               -- 'create', 'update', 'delete', 'login', 'invite', etc.
  resource    text,                        -- 'course', 'profile', 'enrollment', etc.
  resource_id text,                        -- ID do recurso afetado
  metadata    jsonb,                       -- dados extras
  ip_address  text,
  created_at  timestamptz default now()
);

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Aplicar trigger em todas as tabelas que têm updated_at
create trigger trg_organizations_updated before update on organizations for each row execute function update_updated_at();
create trigger trg_tenants_updated before update on tenants for each row execute function update_updated_at();
create trigger trg_design_tokens_updated before update on design_tokens for each row execute function update_updated_at();
create trigger trg_design_assets_updated before update on design_assets for each row execute function update_updated_at();
create trigger trg_users_updated before update on users for each row execute function update_updated_at();
create trigger trg_profiles_updated before update on profiles for each row execute function update_updated_at();
create trigger trg_courses_updated before update on courses for each row execute function update_updated_at();
create trigger trg_modules_updated before update on modules for each row execute function update_updated_at();
create trigger trg_lessons_updated before update on lessons for each row execute function update_updated_at();
create trigger trg_forum_posts_updated before update on forum_posts for each row execute function update_updated_at();
create trigger trg_forum_comments_updated before update on forum_comments for each row execute function update_updated_at();
create trigger trg_announcements_updated before update on announcements for each row execute function update_updated_at();

-- ============================================================
-- TRIGGER: criar user público ao registrar no auth.users
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- TRIGGER: recalcular progresso do enrollment quando lesson_progress muda
-- ============================================================
create or replace function recalculate_enrollment_progress()
returns trigger as $$
declare
  v_enrollment_id uuid;
  v_total_required int;
  v_completed int;
  v_new_progress numeric(5,2);
  v_tenant_course_id uuid;
  v_threshold numeric(5,2);
begin
  v_enrollment_id := coalesce(new.enrollment_id, old.enrollment_id);

  -- Contar aulas obrigatórias do curso
  select count(*)
  into v_total_required
  from lessons l
  join modules m on m.id = l.module_id
  join courses c on c.id = m.course_id
  join tenant_courses tc on tc.course_id = c.id
  join enrollments e on e.tenant_course_id = tc.id
  where e.id = v_enrollment_id
    and l.is_required = true
    and l.active = true;

  -- Contar aulas completadas
  select count(*)
  into v_completed
  from lesson_progress lp
  join lessons l on l.id = lp.lesson_id
  where lp.enrollment_id = v_enrollment_id
    and lp.completed = true
    and l.is_required = true;

  -- Calcular porcentagem
  if v_total_required > 0 then
    v_new_progress := round((v_completed::numeric / v_total_required::numeric) * 100, 2);
  else
    v_new_progress := 0;
  end if;

  -- Atualizar enrollment
  update enrollments
  set progress = v_new_progress,
      last_accessed_at = now(),
      status = case
        when v_new_progress >= 100 then 'completed'
        else status
      end,
      completed_at = case
        when v_new_progress >= 100 and completed_at is null then now()
        else completed_at
      end
  where id = v_enrollment_id;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_recalculate_progress
  after insert or update on lesson_progress
  for each row execute function recalculate_enrollment_progress();

-- ============================================================
-- TRIGGER: gerar certificado automaticamente ao completar curso
-- ============================================================
create or replace function auto_generate_certificate()
returns trigger as $$
declare
  v_threshold numeric(5,2);
  v_profile profiles;
  v_course courses;
  v_tenant tenants;
  v_existing_cert uuid;
begin
  -- Só processar se status mudou para 'completed'
  if new.status = 'completed' and (old.status is null or old.status != 'completed') then

    -- Verificar se já existe certificado
    select id into v_existing_cert from certificates where enrollment_id = new.id;
    if v_existing_cert is not null then return new; end if;

    -- Buscar dados
    select p.* into v_profile from profiles p where p.id = new.profile_id;
    select c.* into v_course
    from courses c
    join tenant_courses tc on tc.course_id = c.id
    where tc.id = new.tenant_course_id;
    select t.* into v_tenant
    from tenants t
    join tenant_courses tc on tc.tenant_id = t.id
    where tc.id = new.tenant_course_id;

    -- Criar registro do certificado (PDF será gerado pelo Agente 8)
    insert into certificates (
      enrollment_id, profile_id, course_id, tenant_id,
      student_name, course_title, tenant_name, duration_hours
    ) values (
      new.id, new.profile_id, v_course.id, v_tenant.id,
      v_profile.full_name, v_course.title, v_tenant.name,
      round(coalesce(v_course.duration_minutes, 0) / 60.0, 1)
    );

    -- Criar notificação para o aluno
    insert into notifications (profile_id, type, title, body, link)
    values (
      new.profile_id,
      'certificate',
      'Certificado disponível!',
      'Parabéns! Você concluiu o curso "' || v_course.title || '". Seu certificado está disponível.',
      '/certificados'
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_auto_certificate
  after update on enrollments
  for each row execute function auto_generate_certificate();

-- ============================================================
-- INDEXES para performance
-- ============================================================
create index idx_tenants_slug on tenants(slug);
create index idx_tenants_custom_domain on tenants(custom_domain) where custom_domain is not null;
create index idx_tenants_org on tenants(organization_id);
create index idx_org_admins_user on organization_admins(user_id);
create index idx_org_admins_org on organization_admins(organization_id);
create index idx_profiles_user_tenant on profiles(user_id, tenant_id);
create index idx_profiles_tenant_role on profiles(tenant_id, role);
create index idx_enrollments_profile on enrollments(profile_id);
create index idx_enrollments_tenant_course on enrollments(tenant_course_id);
create index idx_enrollments_status on enrollments(status);
create index idx_lesson_progress_enrollment on lesson_progress(enrollment_id);
create index idx_lesson_progress_lesson on lesson_progress(lesson_id);
create index idx_notifications_profile on notifications(profile_id, read);
create index idx_design_tokens_tenant_mode on design_tokens(tenant_id, mode);
create index idx_courses_org on courses(organization_id);
create index idx_courses_status on courses(status);
create index idx_courses_title_trgm on courses using gin(title gin_trgm_ops);
create index idx_modules_course_position on modules(course_id, position);
create index idx_lessons_module_position on lessons(module_id, position);
create index idx_tenant_courses_tenant on tenant_courses(tenant_id);
create index idx_tenant_courses_course on tenant_courses(course_id);
create index idx_invitations_tenant_email on invitations(tenant_id, email);
create index idx_invitations_token on invitations(token);
create index idx_invitations_status on invitations(status);
create index idx_forum_posts_course on forum_posts(course_id, created_at desc);
create index idx_forum_comments_post on forum_comments(post_id, created_at asc);
create index idx_announcements_tenant on announcements(tenant_id, published, starts_at desc);
create index idx_magic_links_token on magic_links(token);
create index idx_audit_logs_tenant on audit_logs(tenant_id, created_at desc);
create index idx_certificates_verification on certificates(verification_code);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — COMPLETO
-- ============================================================

-- ---- Habilitar RLS em TODAS as tabelas ----
alter table organizations       enable row level security;
alter table organization_admins enable row level security;
alter table tenants             enable row level security;
alter table design_tokens       enable row level security;
alter table design_assets       enable row level security;
alter table design_presets      enable row level security;
alter table users               enable row level security;
alter table profiles            enable row level security;
alter table courses             enable row level security;
alter table modules             enable row level security;
alter table lessons             enable row level security;
alter table tenant_courses      enable row level security;
alter table enrollments         enable row level security;
alter table lesson_progress     enable row level security;
alter table certificates        enable row level security;
alter table favorites           enable row level security;
alter table invitations         enable row level security;
alter table magic_links         enable row level security;
alter table announcements       enable row level security;
alter table forum_posts         enable row level security;
alter table forum_comments      enable row level security;
alter table notifications       enable row level security;
alter table goals               enable row level security;

-- ============================================================
-- HELPER FUNCTIONS para RLS
-- ============================================================

-- Verifica se o user é admin de alguma organization
create or replace function is_org_admin(org_id uuid)
returns boolean as $$
  select exists (
    select 1 from organization_admins
    where organization_id = org_id
      and user_id = auth.uid()
      and active = true
  );
$$ language sql security definer stable;

-- Verifica se o user tem um profile com role específico no tenant
create or replace function has_tenant_role(t_id uuid, required_role text)
returns boolean as $$
  select exists (
    select 1 from profiles
    where tenant_id = t_id
      and user_id = auth.uid()
      and active = true
      and (
        role = required_role
        or role = 'admin_tenant'  -- admin_tenant tem acesso total
      )
  );
$$ language sql security definer stable;

-- Retorna todos os tenant_ids onde o user tem profile
create or replace function user_tenant_ids()
returns setof uuid as $$
  select tenant_id from profiles
  where user_id = auth.uid() and active = true;
$$ language sql security definer stable;

-- ============================================================
-- POLICIES: Organizations
-- ============================================================
create policy "organizations: public read"
  on organizations for select using (true);

create policy "organizations: admin manage"
  on organizations for all
  using (is_org_admin(id));

-- ============================================================
-- POLICIES: Organization Admins
-- ============================================================
create policy "org_admins: org admin manage"
  on organization_admins for all
  using (is_org_admin(organization_id));

create policy "org_admins: self read"
  on organization_admins for select
  using (user_id = auth.uid());

-- ============================================================
-- POLICIES: Tenants
-- ============================================================
create policy "tenants: public read active"
  on tenants for select using (active = true);

create policy "tenants: org admin manage"
  on tenants for all
  using (is_org_admin(organization_id));

create policy "tenants: tenant admin read"
  on tenants for select
  using (has_tenant_role(id, 'admin_tenant'));

-- ============================================================
-- POLICIES: Design Tokens (público para leitura = SSR sem auth)
-- ============================================================
create policy "design_tokens: public read"
  on design_tokens for select using (true);

create policy "design_tokens: tenant admin write"
  on design_tokens for insert
  with check (has_tenant_role(tenant_id, 'admin_tenant'));

create policy "design_tokens: tenant admin update"
  on design_tokens for update
  using (has_tenant_role(tenant_id, 'admin_tenant'));

-- ============================================================
-- POLICIES: Design Assets
-- ============================================================
create policy "design_assets: public read"
  on design_assets for select using (true);

create policy "design_assets: tenant admin write"
  on design_assets for insert
  with check (has_tenant_role(tenant_id, 'admin_tenant'));

create policy "design_assets: tenant admin update"
  on design_assets for update
  using (has_tenant_role(tenant_id, 'admin_tenant'));

-- ============================================================
-- POLICIES: Design Presets (público leitura)
-- ============================================================
create policy "design_presets: public read"
  on design_presets for select using (true);

-- ============================================================
-- POLICIES: Users
-- ============================================================
create policy "users: self read"
  on users for select
  using (id = auth.uid());

create policy "users: self update"
  on users for update
  using (id = auth.uid());

-- ============================================================
-- POLICIES: Profiles
-- ============================================================
create policy "profiles: owner access"
  on profiles for select
  using (user_id = auth.uid());

create policy "profiles: owner update own"
  on profiles for update
  using (user_id = auth.uid());

create policy "profiles: tenant admin manage"
  on profiles for all
  using (has_tenant_role(tenant_id, 'admin_tenant'));

create policy "profiles: manager read tenant"
  on profiles for select
  using (has_tenant_role(tenant_id, 'manager'));

-- ============================================================
-- POLICIES: Courses
-- ============================================================
create policy "courses: public read published"
  on courses for select
  using (status = 'published' and active = true);

create policy "courses: org admin manage"
  on courses for all
  using (is_org_admin(organization_id));

-- ============================================================
-- POLICIES: Modules
-- ============================================================
create policy "modules: public read active"
  on modules for select
  using (
    active = true
    and exists (
      select 1 from courses c
      where c.id = modules.course_id
        and c.status = 'published'
    )
  );

create policy "modules: org admin manage"
  on modules for all
  using (
    exists (
      select 1 from courses c
      where c.id = modules.course_id
        and is_org_admin(c.organization_id)
    )
  );

-- ============================================================
-- POLICIES: Lessons
-- ============================================================
create policy "lessons: read for enrolled or preview"
  on lessons for select
  using (
    active = true
    and (
      is_free_preview = true
      or exists (
        select 1 from enrollments e
        join tenant_courses tc on tc.id = e.tenant_course_id
        join courses c on c.id = tc.course_id
        join modules m on m.course_id = c.id
        join profiles p on p.id = e.profile_id
        where m.id = lessons.module_id
          and p.user_id = auth.uid()
          and e.status = 'active'
      )
    )
  );

create policy "lessons: org admin manage"
  on lessons for all
  using (
    exists (
      select 1 from modules m
      join courses c on c.id = m.course_id
      where m.id = lessons.module_id
        and is_org_admin(c.organization_id)
    )
  );

-- ============================================================
-- POLICIES: Tenant Courses
-- ============================================================
create policy "tenant_courses: tenant members read"
  on tenant_courses for select
  using (tenant_id in (select user_tenant_ids()));

create policy "tenant_courses: org admin manage"
  on tenant_courses for all
  using (
    exists (
      select 1 from tenants t
      where t.id = tenant_courses.tenant_id
        and is_org_admin(t.organization_id)
    )
  );

create policy "tenant_courses: tenant admin read"
  on tenant_courses for select
  using (has_tenant_role(tenant_id, 'admin_tenant'));

-- ============================================================
-- POLICIES: Enrollments
-- ============================================================
create policy "enrollments: owner access"
  on enrollments for select
  using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

create policy "enrollments: tenant admin manage"
  on enrollments for all
  using (
    exists (
      select 1 from tenant_courses tc
      where tc.id = enrollments.tenant_course_id
        and has_tenant_role(tc.tenant_id, 'admin_tenant')
    )
  );

-- ============================================================
-- POLICIES: Lesson Progress
-- ============================================================
create policy "lesson_progress: owner access"
  on lesson_progress for all
  using (
    enrollment_id in (
      select e.id from enrollments e
      join profiles p on p.id = e.profile_id
      where p.user_id = auth.uid()
    )
  );

-- ============================================================
-- POLICIES: Certificates
-- ============================================================
create policy "certificates: owner read"
  on certificates for select
  using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

create policy "certificates: tenant admin read"
  on certificates for select
  using (has_tenant_role(tenant_id, 'admin_tenant'));

-- ============================================================
-- POLICIES: Favorites
-- ============================================================
create policy "favorites: owner access"
  on favorites for all
  using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

-- ============================================================
-- POLICIES: Invitations
-- ============================================================
create policy "invitations: tenant admin manage"
  on invitations for all
  using (has_tenant_role(tenant_id, 'admin_tenant'));

create policy "invitations: invited user read own"
  on invitations for select
  using (email = (select email from auth.users where id = auth.uid()));

-- ============================================================
-- POLICIES: Magic Links
-- ============================================================
create policy "magic_links: service role only"
  on magic_links for all
  using (false);  -- Apenas service_role acessa via API routes

-- ============================================================
-- POLICIES: Announcements
-- ============================================================
create policy "announcements: tenant members read published"
  on announcements for select
  using (
    published = true
    and tenant_id in (select user_tenant_ids())
    and (starts_at is null or starts_at <= now())
    and (expires_at is null or expires_at > now())
  );

create policy "announcements: tenant admin manage"
  on announcements for all
  using (has_tenant_role(tenant_id, 'admin_tenant'));

-- ============================================================
-- POLICIES: Forum Posts
-- ============================================================
create policy "forum_posts: read approved"
  on forum_posts for select
  using (
    approved = true
    and tenant_id in (select user_tenant_ids())
  );

create policy "forum_posts: write own"
  on forum_posts for insert
  with check (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

create policy "forum_posts: update own"
  on forum_posts for update
  using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

create policy "forum_posts: tenant admin moderate"
  on forum_posts for all
  using (has_tenant_role(tenant_id, 'admin_tenant'));

-- ============================================================
-- POLICIES: Forum Comments
-- ============================================================
create policy "forum_comments: read approved"
  on forum_comments for select
  using (
    approved = true
    and exists (
      select 1 from forum_posts fp
      where fp.id = forum_comments.post_id
        and fp.tenant_id in (select user_tenant_ids())
    )
  );

create policy "forum_comments: write own"
  on forum_comments for insert
  with check (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

create policy "forum_comments: tenant admin moderate"
  on forum_comments for all
  using (
    exists (
      select 1 from forum_posts fp
      where fp.id = forum_comments.post_id
        and has_tenant_role(fp.tenant_id, 'admin_tenant')
    )
  );

-- ============================================================
-- POLICIES: Notifications
-- ============================================================
create policy "notifications: owner access"
  on notifications for all
  using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

-- ============================================================
-- POLICIES: Goals
-- ============================================================
create policy "goals: owner access"
  on goals for all
  using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );
```

**Após criar o arquivo, executar:**

```bash
supabase db push
```

**Depois gerar types TypeScript:**

```bash
npx supabase gen types typescript --project-id $SUPABASE_PROJECT_REF > src/types/database.types.ts
```

**Entrega esperada do Agente 2:**

- [ ] Migration criada em `supabase/migrations/001_initial_schema.sql`
- [ ] `supabase db push` executado com sucesso
- [ ] **22 tabelas** criadas no banco remoto:
  1. organizations
  2. organization_admins (NOVA)
  3. tenants
  4. design_tokens
  5. design_assets
  6. design_presets (NOVA)
  7. users
  8. profiles
  9. courses
  10. modules
  11. lessons
  12. tenant_courses
  13. enrollments
  14. lesson_progress
  15. certificates
  16. favorites
  17. invitations (NOVA)
  18. magic_links
  19. announcements (NOVA)
  20. forum_posts (NOVA — substituiu community_groups + community_posts)
  21. forum_comments (NOVA)
  22. notifications
  23. goals
  24. audit_logs
- [ ] 12 triggers criados (updated_at + new_user + recalculate_progress + auto_certificate)
- [ ] 29 indexes criados
- [ ] RLS habilitado em TODAS as tabelas
- [ ] 40+ policies criadas cobrindo todos os roles (student, manager, admin_tenant, org_admin)
- [ ] 3 helper functions criadas (is_org_admin, has_tenant_role, user_tenant_ids)
- [ ] Types TypeScript gerados em `src/types/database.types.ts`
