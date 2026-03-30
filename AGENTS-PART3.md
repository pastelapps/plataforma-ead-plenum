# AGENTS-PART3.md — Admin Tenant e Plataforma do Aluno

> **Continuação de AGENTS-PART2.md** — Leia PART1 e PART2 primeiro.

---

## 10. AGENTE 6 — ADMIN PANEL (TENANT)

**Responsabilidade:** Criar o painel administrativo do Tenant. Este é o painel onde o admin da prefeitura personaliza o Design System, gerencia alunos, envia convites, vê progresso e faz anúncios.

### Estrutura de rotas:

```
src/app/tenant-admin/
├── layout.tsx                  # Layout com sidebar + guard requireRole('admin_tenant')
├── page.tsx                    # Dashboard do tenant
├── design-system/
│   ├── page.tsx                # Editor visual de cores
│   ├── assets/page.tsx         # Upload de logos e banners
│   └── preview/page.tsx        # Preview ao vivo da plataforma
├── alunos/
│   ├── page.tsx                # Lista de alunos (profiles) com filtros
│   ├── convidar/page.tsx       # Formulário de convite (individual ou CSV)
│   └── [profileId]/page.tsx    # Detalhes do aluno (cursos, progresso, certificados)
├── cursos/
│   ├── page.tsx                # Cursos contratados pelo tenant
│   └── [courseId]/
│       ├── page.tsx            # Detalhes do curso no contexto do tenant
│       └── matriculas/page.tsx # Gerenciar matrículas de alunos neste curso
├── anuncios/
│   ├── page.tsx                # Lista de anúncios
│   └── novo/page.tsx           # Criar anúncio
├── comunidade/
│   └── page.tsx                # Moderação de posts do fórum
└── relatorios/
    └── page.tsx                # Analytics do tenant
```

### Dashboard do Tenant (`/tenant-admin/page.tsx`):

```
╔══════════════════════════════════════════════════════════════╗
║  [Logo do Tenant]  Painel Administrativo - Prefeitura de G. ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    ║
║  │ 245      │  │ 12       │  │ 67%      │  │ 34       │    ║
║  │ Alunos   │  │ Cursos   │  │ Conclusão│  │ Certif.  │    ║
║  └──────────┘  └──────────┘  └──────────┘  └──────────┘    ║
║                                                              ║
║  [Gráfico: Matrículas nos últimos 30 dias]                  ║
║                                                              ║
║  Convites pendentes: 5                                       ║
║  Posts aguardando moderação: 2                               ║
║                                                              ║
║  Cursos mais acessados:                                      ║
║  1. Gestão Pública Moderna - 89 alunos - 72% conclusão      ║
║  2. Atendimento ao Cidadão - 67 alunos - 58% conclusão      ║
║  3. Segurança no Trabalho - 45 alunos - 81% conclusão       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### Editor Visual do Design System (CRÍTICO — especificação completa):

**Rota:** `/tenant-admin/design-system/page.tsx`

**Interface:**

```
╔══════════════════════════════════════════════════════════════════╗
║  Editor de Identidade Visual                    [Salvar] [Reset]║
╠═══════════════════════╦══════════════════════════════════════════╣
║  PALETAS PRÉ-DEFINIDAS║  PREVIEW AO VIVO                        ║
║  ○ Azul Institucional  ║  ┌──────────────────────────────────┐  ║
║  ○ Verde Natureza      ║  │  [Header com logo e menu]        │  ║
║  ○ Roxo Educação       ║  │                                  │  ║
║  ○ Terracota Cultura   ║  │  ┌─────────┐  ┌─────────┐       │  ║
║  ○ Escuro Elegante     ║  │  │ Card    │  │ Card    │       │  ║
║  ● Customizado ▼       ║  │  │ curso 1 │  │ curso 2 │       │  ║
║                        ║  │  └─────────┘  └─────────┘       │  ║
║  CORES PRIMÁRIAS       ║  │                                  │  ║
║  Base: [#3b82f6] 🎨    ║  │  [Botão primário] [Secundário]  │  ║
║  Gera paleta 50→900    ║  │                                  │  ║
║  automaticamente       ║  │  [Progress bar 67%]              │  ║
║                        ║  │                                  │  ║
║  CORES SECUNDÁRIAS     ║  │  ┌─ Badge ─┐ ┌─ Badge ─┐        │  ║
║  Base: [#22c55e] 🎨    ║  │  │ Sucesso │ │ Alerta  │        │  ║
║                        ║  │  └─────────┘ └─────────┘        │  ║
║  CORES SEMÂNTICAS      ║  │                                  │  ║
║  Sucesso: [#22c55e]    ║  │  [Sidebar com cores]             │  ║
║  Warning: [#f59e0b]    ║  │                                  │  ║
║  Erro:    [#ef4444]    ║  └──────────────────────────────────┘  ║
║  Info:    [#3b82f6]    ║                                        ║
║                        ║  ┌─ Toggle ────────────────────────┐  ║
║  BACKGROUNDS           ║  │  ☀ Light mode  │  🌙 Dark mode  │  ║
║  Página: [#ffffff]     ║  └──────────────────────────────────┘  ║
║  Surface: [#f9fafb]    ║                                        ║
║  Sidebar: [#1f2937]    ║                                        ║
║                        ║                                        ║
║  TIPOGRAFIA            ║                                        ║
║  Heading: Inter ▼      ║                                        ║
║  Body:    Inter ▼      ║                                        ║
║                        ║                                        ║
║  BORDER RADIUS         ║                                        ║
║  ──○──── 0.375rem      ║                                        ║
╚═══════════════════════╩══════════════════════════════════════════╝
```

**Comportamento do editor:**

```typescript
// Componente principal: src/components/design-system/DesignSystemEditor.tsx

// 1. Ao carregar a página:
//    - Buscar design_tokens atuais do tenant (light + dark)
//    - Buscar design_presets disponíveis
//    - Popular o formulário com os valores atuais

// 2. Ao selecionar um preset:
//    - Preencher TODOS os campos do formulário com os valores do preset
//    - Atualizar o preview instantaneamente (state local, sem salvar no banco)

// 3. Ao alterar uma cor base (ex: primary-500):
//    - Gerar automaticamente a paleta 50→900 usando generatePaletteFromBase()
//    - Atualizar o preview instantaneamente

// 4. Ao alterar qualquer campo:
//    - Atualizar o preview instantaneamente (CSS Variables locais)
//    - Marcar como "Alterações não salvas"

// 5. Ao clicar "Salvar":
//    - PUT /api/design-system/tokens
//    - Salvar no banco (upsert design_tokens para light E dark)
//    - Chamar invalidateDesignCache(tenantId)
//    - Mostrar toast de sucesso
//    - Revalidar a página para que o SSR pegue os novos tokens

// 6. Preview ao vivo:
//    - Componente <ThemePreview> que renderiza uma mini-plataforma
//    - Usa as CSS Variables do state local (não do banco)
//    - Mostra: header, sidebar, cards, botões, badges, progress bar
//    - Toggle light/dark mode no preview
```

**API do Design System:**

```typescript
// src/app/api/design-system/tokens/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { invalidateDesignCache } from '@/lib/design-system/tokens'

// GET: buscar tokens atuais do tenant
export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 })

  const supabase = createServiceRoleClient()
  const { data: light } = await supabase
    .from('design_tokens')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('mode', 'light')
    .single()

  const { data: dark } = await supabase
    .from('design_tokens')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('mode', 'dark')
    .single()

  const { data: assets } = await supabase
    .from('design_assets')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  return NextResponse.json({ light, dark, assets })
}

// PUT: atualizar tokens (light + dark) e invalidar cache
export async function PUT(request: NextRequest) {
  // Verificar que o chamador é admin_tenant
  // ...

  const { tenantId, light, dark } = await request.json()
  const supabase = createServiceRoleClient()

  // Upsert light tokens
  await supabase
    .from('design_tokens')
    .upsert({ ...light, tenant_id: tenantId, mode: 'light' }, {
      onConflict: 'tenant_id,mode',
    })

  // Upsert dark tokens
  await supabase
    .from('design_tokens')
    .upsert({ ...dark, tenant_id: tenantId, mode: 'dark' }, {
      onConflict: 'tenant_id,mode',
    })

  // Invalidar cache Redis
  await invalidateDesignCache(tenantId)

  return NextResponse.json({ success: true })
}
```

### Upload de Assets (logos, banners):

**Rota:** `/tenant-admin/design-system/assets/page.tsx`

```
Funcionalidades:
1. Upload de logo quadrado (recomendação: 512x512, PNG)
2. Upload de logo horizontal (recomendação: 1200x300, PNG com fundo transparente)
3. Upload de logo para fundo escuro (opcional)
4. Upload de favicon (32x32 ou 64x64)
5. Upload de banner de login (horizontal: 1920x400, vertical: 600x800)
6. Upload de hero da homepage (1920x600, mobile: 600x400)
7. Upload de backgrounds de cards (padrões/texturas, PNG)
8. Editor de gradiente CSS para cards (input de cores + preview)
9. Upload de assets de certificado (background, logo, assinatura)

Cada upload:
- Vai para Supabase Storage no bucket 'tenant-assets/{tenantId}/'
- Retorna URL pública
- Salva na tabela design_assets
- Invalida cache Redis
```

### Gestão de Alunos:

**Rota:** `/tenant-admin/alunos/page.tsx`

```
Tabela com colunas:
  - Nome | Email | Departamento | Cargo | Cursos matriculados | Progresso médio | Status | Ações

Filtros:
  - Por departamento
  - Por status (ativo/inativo)
  - Por curso matriculado
  - Busca por nome/email

Ações:
  - Ver detalhes do aluno → /tenant-admin/alunos/[profileId]
  - Desativar/reativar aluno
  - Editar dados (departamento, cargo, role)

Detalhes do aluno (/tenant-admin/alunos/[profileId]):
  - Dados pessoais
  - Lista de cursos com progresso individual
  - Aulas assistidas por curso
  - Certificados emitidos
  - Último acesso
  - Histórico de atividade
```

### Convidar Alunos:

**Rota:** `/tenant-admin/alunos/convidar/page.tsx`

```
Duas opções:
1. Individual: campo de email + nome + departamento + cargo
2. Em lote: upload de CSV com colunas: email, nome, departamento, cargo
   - Preview da tabela antes de enviar
   - Validação de emails
   - Mostrar quantos são novos vs. já cadastrados

Ao enviar:
  - POST /api/invitations/send com array de emails
  - Mostrar resultado: enviados, falhas, duplicados
  - Lista de convites pendentes com opção de reenviar ou cancelar
```

### Matrículas em cursos:

**Rota:** `/tenant-admin/cursos/[courseId]/matriculas/page.tsx`

```
Funcionalidades:
1. Ver lista de alunos matriculados neste curso
2. Matricular alunos individualmente (select de alunos do tenant)
3. Matricular em lote (todos os alunos do tenant, ou por departamento)
4. Desmatricular aluno
5. Ver progresso de cada aluno no curso
6. Exportar relatório de progresso (CSV)
```

### Anúncios:

```
Criar anúncio:
  - Título
  - Corpo (markdown)
  - Prioridade (low, normal, high, urgent)
  - Escopo: todos os alunos OU apenas alunos de um curso específico
  - Data de início e expiração (opcional)
  - Fixar no topo (toggle)

Ao publicar:
  - Criar notificação para cada aluno no escopo
  - Anúncio aparece na homepage do aluno e na central de notificações
```

**Entrega esperada do Agente 6:**

- [ ] Layout do tenant-admin com sidebar + guard requireRole('admin_tenant')
- [ ] Dashboard com stats do tenant
- [ ] **Editor visual do Design System COMPLETO:**
  - [ ] Seleção de presets
  - [ ] Color pickers para todas as categorias de cores
  - [ ] Geração automática de paleta 50→900 a partir de cor base
  - [ ] Preview ao vivo com toggle light/dark
  - [ ] Componente `<ThemePreview>` com header, sidebar, cards, botões, badges, progress bar
  - [ ] Salvar → PUT API → invalidar cache Redis
- [ ] Upload de assets (logos, banners, certificado) para Supabase Storage
- [ ] Lista de alunos com filtros e busca
- [ ] Detalhes do aluno com progresso por curso
- [ ] Convite individual e em lote (CSV)
- [ ] Gestão de matrículas por curso
- [ ] CRUD de anúncios com notificação automática
- [ ] Moderação do fórum (aprovar/reprovar posts)
- [ ] Relatório básico do tenant

---

## 11. AGENTE 7 — PLATAFORMA DO ALUNO

**Responsabilidade:** Criar toda a experiência do aluno: homepage, catálogo, player de vídeo, certificados, fórum, perfil, notificações. Tudo usando o Design System do tenant via CSS Variables.

### Estrutura de rotas:

```
src/app/(tenant)/
├── layout.tsx                  # Layout com header + CSS Variables do tenant
├── page.tsx                    # Homepage do aluno
├── cursos/
│   ├── page.tsx                # Catálogo de cursos do tenant
│   └── [courseSlug]/
│       ├── page.tsx            # Página do curso (módulos, detalhes, matrícula)
│       └── aula/
│           └── [lessonSlug]/page.tsx  # Player de vídeo + conteúdo
├── certificados/
│   ├── page.tsx                # Lista de certificados do aluno
│   └── [certificateId]/page.tsx # Visualizar/baixar certificado PDF
├── comunidade/
│   ├── page.tsx                # Lista de fóruns por curso
│   └── [courseSlug]/
│       ├── page.tsx            # Posts do fórum do curso
│       └── [postId]/page.tsx   # Post + comentários
├── perfil/
│   └── page.tsx                # Editar perfil do aluno
├── notificacoes/
│   └── page.tsx                # Central de notificações
└── favoritos/
    └── page.tsx                # Cursos favoritados
```

### Homepage do Aluno (`/page.tsx`):

```
╔══════════════════════════════════════════════════════════════════╗
║  [Logo Tenant]    Cursos  Certificados  Comunidade     [Avatar] ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Olá, Maria! 👋                                                 ║
║                                                                  ║
║  ┌─ CONTINUAR ASSISTINDO ────────────────────────────────────┐  ║
║  │                                                            │  ║
║  │  ┌──────────────────┐    Gestão Pública Moderna            │  ║
║  │  │ [Thumbnail curso │    Módulo 2: Planejamento            │  ║
║  │  │  com overlay do  │    Aula 3: Orçamento Público         │  ║
║  │  │  tenant]         │    ██████████░░░ 67%                 │  ║
║  │  └──────────────────┘    [▶ Continuar assistindo]          │  ║
║  │                                                            │  ║
║  └────────────────────────────────────────────────────────────┘  ║
║                                                                  ║
║  📢 Aviso: Nova turma de Atendimento ao Cidadão disponível!     ║
║                                                                  ║
║  ─── Meus Cursos ────────────────────────────────────────────   ║
║                                                                  ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       ║
║  │[Thumb +  │  │[Thumb +  │  │[Thumb +  │  │[Thumb +  │       ║
║  │ bg do    │  │ bg do    │  │ bg do    │  │ bg do    │       ║
║  │ tenant]  │  │ tenant]  │  │ tenant]  │  │ tenant]  │       ║
║  │          │  │          │  │          │  │          │       ║
║  │ Gestão   │  │ Atend.   │  │ Segur.   │  │ Saúde    │       ║
║  │ Pública  │  │ Cidadão  │  │ Trabalho │  │ Básica   │       ║
║  │ ████░ 67%│  │ ██░░ 30% │  │ Concluído│  │ Novo     │       ║
║  │ ♥        │  │ ♡        │  │ 📜       │  │ ♡        │       ║
║  └──────────┘  └──────────┘  └──────────┘  └──────────┘       ║
║                                                                  ║
║  ─── Cursos Disponíveis ─────────────────────────────────────   ║
║  (cursos do tenant que o aluno ainda não está matriculado)       ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

**Lógica da homepage:**

```typescript
// src/app/(tenant)/page.tsx

export default async function StudentHomePage() {
  const { profile, tenant } = await requireProfile()
  const supabase = createServerComponentClient()

  // 1. Buscar cursos em progresso do aluno (com última aula assistida)
  const { data: inProgress } = await supabase
    .from('enrollments')
    .select(`
      *,
      tenant_courses (
        courses (
          id, title, slug, thumbnail_transparent_url, thumbnail_url,
          modules (
            lessons ( id, title, slug, position )
          )
        )
      ),
      lesson_progress (
        lesson_id, completed, last_watched_at
      )
    `)
    .eq('profile_id', profile.id)
    .eq('status', 'active')
    .order('last_accessed_at', { ascending: false })

  // 2. Buscar o "continuar assistindo" (enrollment mais recente + última aula)
  const continueWatching = inProgress?.[0] ?? null

  // 3. Buscar cursos completados (para mostrar badge de certificado)
  const { data: completed } = await supabase
    .from('enrollments')
    .select('*, tenant_courses(courses(id, title, slug, thumbnail_transparent_url))')
    .eq('profile_id', profile.id)
    .eq('status', 'completed')

  // 4. Buscar cursos disponíveis no tenant (que o aluno NÃO está matriculado)
  const { data: available } = await supabase
    .from('tenant_courses')
    .select('courses(*)')
    .eq('tenant_id', tenant.id)
    .eq('active', true)
    .not('id', 'in', `(${enrolledTenantCourseIds.join(',')})`)

  // 5. Buscar anúncios ativos
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('published', true)
    .lte('starts_at', new Date().toISOString())
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(3)

  // 6. Buscar favoritos do aluno
  const { data: favorites } = await supabase
    .from('favorites')
    .select('course_id')
    .eq('profile_id', profile.id)

  return (
    <>
      <StudentHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <WelcomeSection profileName={profile.full_name} />
        {continueWatching && <ContinueWatchingCard enrollment={continueWatching} />}
        {announcements?.length > 0 && <AnnouncementsBanner announcements={announcements} />}
        <CourseGrid title="Meus Cursos" courses={inProgress} favorites={favorites} />
        {completed?.length > 0 && <CourseGrid title="Concluídos" courses={completed} showCertBadge />}
        {available?.length > 0 && <CourseGrid title="Disponíveis" courses={available} showEnrollButton />}
      </main>
    </>
  )
}
```

### Componente CourseCard — Thumbnail transparente com fundo do tenant:

```typescript
// src/components/course/CourseCard.tsx
'use client'

import { useTenant } from '@/lib/tenant/context'
import Image from 'next/image'

interface CourseCardProps {
  course: {
    title: string
    slug: string
    thumbnail_transparent_url: string | null
    thumbnail_url: string | null
    short_description: string | null
  }
  progress?: number        // 0-100
  isFavorite?: boolean
  showCertBadge?: boolean
  showEnrollButton?: boolean
}

export function CourseCard({ course, progress, isFavorite, showCertBadge }: CourseCardProps) {
  const { assets } = useTenant()

  // O fundo do card usa o gradiente/padrão do tenant
  // A thumbnail do curso é PNG transparente, sobreposta ao fundo
  const bgStyle = assets?.cardBgGradientCss
    ? { background: assets.cardBgGradientCss }
    : assets?.cardBgPattern1Url
    ? { backgroundImage: `url(${assets.cardBgPattern1Url})`, backgroundSize: 'cover' }
    : { background: 'var(--color-primary-500)' }

  return (
    <div className="card-tenant overflow-hidden group cursor-pointer hover:shadow-ds-md transition-shadow">
      {/* Área visual: fundo do tenant + thumbnail transparente */}
      <div className="relative h-48 overflow-hidden" style={bgStyle}>
        {/* Overlay sutil */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: assets?.cardOverlayColor ?? 'rgba(0,0,0,0.2)' }}
        />

        {/* Thumbnail do curso (PNG transparente) sobre o fundo do tenant */}
        {course.thumbnail_transparent_url && (
          <Image
            src={course.thumbnail_transparent_url}
            alt={course.title}
            fill
            className="object-contain p-4 relative z-10"
          />
        )}

        {/* Fallback: thumbnail com fundo próprio */}
        {!course.thumbnail_transparent_url && course.thumbnail_url && (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover"
          />
        )}

        {/* Badge de certificado */}
        {showCertBadge && (
          <div className="absolute top-2 right-2 z-20 bg-ds-success text-white px-2 py-1 rounded-ds text-xs font-bold">
            Concluído
          </div>
        )}

        {/* Botão de favoritar */}
        <button className="absolute top-2 left-2 z-20">
          {isFavorite ? '♥' : '♡'}
        </button>
      </div>

      {/* Informações do curso */}
      <div className="p-4">
        <h3 className="font-heading font-semibold text-ds-text-primary line-clamp-2">
          {course.title}
        </h3>
        {course.short_description && (
          <p className="text-sm text-ds-text-secondary mt-1 line-clamp-2">
            {course.short_description}
          </p>
        )}

        {/* Barra de progresso */}
        {progress !== undefined && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-ds-text-secondary mb-1">
              <span>Progresso</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar-track h-2">
              <div className="progress-bar-fill h-2" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

### Página do Curso (`/cursos/[courseSlug]/page.tsx`):

```
╔══════════════════════════════════════════════════════════════════╗
║  [← Voltar]              Gestão Pública Moderna          [♥ ♡] ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │  [Hero do curso: thumbnail + fundo do tenant]            │   ║
║  │  Gestão Pública Moderna                                  │   ║
║  │  Instrutor: Prof. Carlos Silva                           │   ║
║  │  Nível: Intermediário | 12h de conteúdo | 24 aulas       │   ║
║  │  ████████████░░░░ 67%                                    │   ║
║  └──────────────────────────────────────────────────────────┘   ║
║                                                                  ║
║  [Sobre o curso] [Conteúdo] [Fórum] [Instrutor]                ║
║                                                                  ║
║  ▼ Módulo 1: Fundamentos da Gestão Pública (4 aulas)           ║
║    ✅ Aula 1: Introdução à Administração Pública    12:34       ║
║    ✅ Aula 2: Princípios Constitucionais            15:20       ║
║    ✅ Aula 3: Estrutura do Estado Brasileiro         18:45       ║
║    ✅ Aula 4: Poderes da República                  10:12       ║
║                                                                  ║
║  ▼ Módulo 2: Planejamento Público (6 aulas)                    ║
║    ✅ Aula 1: PPA - Plano Plurianual                14:30       ║
║    ✅ Aula 2: LDO - Lei de Diretrizes               11:20       ║
║    ▶ Aula 3: Orçamento Público ← ATUAL             16:45       ║
║    ○ Aula 4: Execução Orçamentária                  13:00       ║
║    ○ Aula 5: Controle Interno                       09:30       ║
║    ○ Aula 6: Transparência e LAI                    12:15       ║
║                                                                  ║
║  ▶ Módulo 3: Gestão de Pessoas no Setor Público (8 aulas)      ║
║  ▶ Módulo 4: Licitações e Contratos (6 aulas)                  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

Legenda:
  ✅ = aula completa (lesson_progress.completed = true)
  ▶  = aula atual (última aula com progresso mas não completa)
  ○  = aula não iniciada
  🔒 = aula bloqueada (se implementar locking sequencial — FUTURO)
```

### Player de Vídeo (`/cursos/[courseSlug]/aula/[lessonSlug]/page.tsx`):

```typescript
// Componente: src/components/player/PandaVideoPlayer.tsx
'use client'

import { useEffect, useRef } from 'react'

interface PandaVideoPlayerProps {
  pandaVideoId: string
  enrollmentId: string
  lessonId: string
  onProgress?: (seconds: number) => void
  onComplete?: () => void
}

/**
 * Player embed do Panda Video.
 * O tracking de progresso é feito via WEBHOOK do Panda (Agente 8).
 * Este componente apenas renderiza o iframe do player.
 * O Panda Video envia webhooks para /api/webhooks/panda quando o aluno assiste.
 */
export function PandaVideoPlayer({
  pandaVideoId,
  enrollmentId,
  lessonId,
}: PandaVideoPlayerProps) {
  return (
    <div className="relative w-full aspect-video bg-black rounded-ds-lg overflow-hidden">
      <iframe
        id={`panda-player-${pandaVideoId}`}
        src={`https://player-vz-*.tv.pandavideo.com.br/embed/?v=${pandaVideoId}`}
        style={{ border: 'none', width: '100%', height: '100%' }}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
```

**Layout da página de aula:**

```
╔══════════════════════════════════════════════════════════════════╗
║  [← Voltar ao curso]     Aula 3: Orçamento Público             ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │                                                          │   ║
║  │            [PANDA VIDEO PLAYER - 16:9]                   │   ║
║  │                                                          │   ║
║  └──────────────────────────────────────────────────────────┘   ║
║                                                                  ║
║  ┌─ Navegação ──────────────────────────────────────────────┐   ║
║  │  [← Aula anterior]                    [Próxima aula →]  │   ║
║  └──────────────────────────────────────────────────────────┘   ║
║                                                                  ║
║  [Descrição] [Anexos] [Fórum]                                   ║
║                                                                  ║
║  Sobre esta aula:                                                ║
║  Nesta aula você aprenderá sobre o processo orçamentário...      ║
║                                                                  ║
║  📎 Material complementar: orcamento_publico.pdf [Baixar]       ║
║                                                                  ║
║  ─── Lista de aulas do módulo ──────────────────────────────    ║
║  ✅ Aula 1: PPA - Plano Plurianual                              ║
║  ✅ Aula 2: LDO - Lei de Diretrizes                             ║
║  ▶ Aula 3: Orçamento Público ← VOCÊ ESTÁ AQUI                  ║
║  ○ Aula 4: Execução Orçamentária                                ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

### Certificados (`/certificados/page.tsx`):

```
Funcionalidades:
1. Listar todos os certificados do aluno
   - Card com: nome do curso, data de emissão, código de verificação
   - Botão [Baixar PDF] → download do PDF já gerado (pdf_url)
   - Botão [Verificar] → abre /verify/[code] em nova aba

2. Se o PDF ainda não foi gerado (pdf_url = null):
   - Botão [Gerar certificado] → POST /api/certificates/generate
   - Mostra loading enquanto gera
   - Quando pronto, mostra botão de download

3. Página de verificação pública (/verify/[code]):
   - Não requer login
   - Busca certificado pelo verification_code
   - Mostra: nome do aluno, curso, tenant, data de emissão
   - Badge "Certificado Válido" ou "Certificado não encontrado"
```

### Template do Certificado PDF:

```typescript
// src/components/certificate/CertificateTemplate.tsx

import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'

interface CertificateData {
  studentName: string
  courseName: string
  tenantName: string
  durationHours: number
  issuedAt: string
  verificationCode: string
  // Assets do tenant
  tenantLogoUrl: string | null
  certificateBgUrl: string | null
  signatureUrl: string | null
  // Cores do tenant (para usar no PDF)
  primaryColor: string
  secondaryColor: string
}

export function CertificateTemplate({ data }: { data: CertificateData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Background do certificado (se houver) */}
        {data.certificateBgUrl && (
          <Image src={data.certificateBgUrl} style={styles.background} />
        )}

        <View style={styles.content}>
          {/* Logo do tenant */}
          {data.tenantLogoUrl && (
            <Image src={data.tenantLogoUrl} style={styles.logo} />
          )}

          <Text style={[styles.title, { color: data.primaryColor }]}>
            CERTIFICADO DE CONCLUSÃO
          </Text>

          <Text style={styles.body}>
            Certificamos que
          </Text>

          <Text style={[styles.studentName, { color: data.primaryColor }]}>
            {data.studentName}
          </Text>

          <Text style={styles.body}>
            concluiu com aproveitamento o curso
          </Text>

          <Text style={styles.courseName}>
            {data.courseName}
          </Text>

          <Text style={styles.body}>
            com carga horária de {data.durationHours} horas,
            oferecido por {data.tenantName}.
          </Text>

          <Text style={styles.date}>
            Emitido em {new Date(data.issuedAt).toLocaleDateString('pt-BR')}
          </Text>

          {/* Assinatura */}
          {data.signatureUrl && (
            <Image src={data.signatureUrl} style={styles.signature} />
          )}

          {/* Código de verificação */}
          <Text style={styles.verification}>
            Código de verificação: {data.verificationCode}
          </Text>
          <Text style={styles.verificationUrl}>
            Verificar em: {process.env.NEXT_PUBLIC_APP_URL}/verify/{data.verificationCode}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

// Styles do PDF (o agente deve definir completos)
const styles = StyleSheet.create({
  page: { position: 'relative', padding: 60 },
  background: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  content: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  logo: { width: 150, height: 60, objectFit: 'contain', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, letterSpacing: 2 },
  body: { fontSize: 14, textAlign: 'center', marginBottom: 10, color: '#374151' },
  studentName: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  courseName: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#111827' },
  date: { fontSize: 12, color: '#6b7280', marginTop: 20 },
  signature: { width: 150, height: 60, objectFit: 'contain', marginTop: 20 },
  verification: { fontSize: 10, color: '#9ca3af', marginTop: 30 },
  verificationUrl: { fontSize: 9, color: '#9ca3af' },
})
```

### Fórum simples por curso:

```
/comunidade/page.tsx
  - Lista de cursos que o aluno está matriculado
  - Cada curso mostra: nome, quantidade de posts, último post

/comunidade/[courseSlug]/page.tsx
  - Lista de posts do fórum do curso
  - Posts fixados no topo
  - Botão "Novo post"
  - Cada post mostra: título, autor, data, preview do conteúdo, qtd comentários

/comunidade/[courseSlug]/[postId]/page.tsx
  - Post completo
  - Lista de comentários
  - Formulário para novo comentário
  - Botões de editar/deletar (se autor)
```

### Notificações:

```
/notificacoes/page.tsx
  - Lista de notificações do aluno
  - Tipos: info, success, warning, course, certificate, announcement, community
  - Marcar como lida ao clicar
  - Marcar todas como lidas
  - Badge no header com contagem de não lidas

Componente: src/components/layout/NotificationBell.tsx
  - Ícone de sino no header
  - Badge com contagem
  - Dropdown com últimas 5 notificações
  - Link "Ver todas" → /notificacoes
```

### Header do aluno (componente de layout):

```typescript
// src/components/layout/StudentHeader.tsx
// Usa CSS Variables do Design System

// Elementos:
// - Logo horizontal do tenant (design_assets.logo_horizontal_url)
// - Menu de navegação: Cursos | Certificados | Comunidade | Favoritos
// - Sino de notificações com badge
// - Avatar do aluno com dropdown (Perfil, Dark/Light mode, Sair)
// - Background: var(--color-header-bg)
// - Texto: var(--color-header-text)
```

**Entrega esperada do Agente 7:**

- [ ] Homepage do aluno com: "Continuar assistindo", cursos em progresso, concluídos, disponíveis, anúncios
- [ ] Componente `<CourseCard>` com thumbnail transparente sobre fundo do tenant
- [ ] Catálogo de cursos com filtros (categoria, nível, busca)
- [ ] Página do curso com módulos em accordion, lista de aulas com status (✅ ▶ ○)
- [ ] Player de vídeo com embed do Panda Video
- [ ] Navegação entre aulas (anterior/próxima)
- [ ] Lista de certificados com download de PDF
- [ ] Geração de certificado PDF via `@react-pdf/renderer` com dados do tenant
- [ ] Página pública de verificação de certificado (/verify/[code])
- [ ] Fórum simples por curso (posts + comentários)
- [ ] Perfil do aluno (editar nome, avatar, dados pessoais)
- [ ] Central de notificações + sino com badge no header
- [ ] Toggle dark/light mode (usando next-themes + CSS Variables)
- [ ] Favoritar/desfavoritar cursos
- [ ] Auto-matrícula (se tenant permitir) ou mostrar "Solicite matrícula ao administrador"
- [ ] Header e layout 100% usando CSS Variables do Design System
- [ ] Responsivo (mobile-first)
