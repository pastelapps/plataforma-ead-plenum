# PROMPT — Adequação Visual e Funcional da Plataforma EAD Multi-Tenant

**Repositório:** https://github.com/plenum/plataforma-ead-multitenant  
**Stack:** Next.js + Supabase + Tailwind CSS + Vercel  
**Referência visual:** TheMembers (licitoguruedu.themembers.com.br)  
**Player de vídeo:** Panda Video (único provider suportado)  
**Cobrança:** NÃO implementar — sem checkout, sem produtos/planos, sem assinaturas  
**Data:** 31/03/2026

---

## CONTEXTO GERAL

Você é um desenvolvedor full-stack sênior trabalhando numa plataforma EAD multi-tenant (B2G — prefeituras como tenants). A plataforma foi criada como uma réplica inspirada no TheMembers e precisa ser alinhada visualmente e funcionalmente com ele.

### Arquitetura

- **Admin central** em `/admin` — gerencia cursos, módulos, aulas e tenants
- **Área do aluno** em `/[tenant-slug]/` — cada prefeitura tem sua própria área
- O admin cadastra cursos no catálogo central; cada tenant ativa quais cursos quer exibir
- Tenants têm branding próprio (logo, cores, banners) configurado no Design System

### Modelo de Negócio

| Aspecto | TheMembers | Nossa Plataforma |
|---------|------------|------------------|
| Criação de cursos | Cada tenant cria os seus | Admin central cria e distribui |
| Distribuição | 1 tenant = 1 plataforma isolada | 1 tenant = seleção do catálogo central |
| Modelo | B2C / B2B | B2G (prefeituras e órgãos públicos) |
| Branding | Por tenant | Por tenant + marca da empresa central |
| Cobrança | Checkout, assinaturas, co-produtores | **NÃO TEM** — acesso direto sem cobrança |
| Player de vídeo | Vimeo | **Panda Video** (único) |

### Estrutura de Tenants

- **Admin Master** → cria cursos, gerencia catálogo, gerencia todos os tenants
- **Tenant (Prefeitura A)** → acessa cursos selecionados pela central, com sua marca
- **Tenant (Prefeitura B)** → acessa cursos diferentes, com sua marca
- **Alunos** → vinculados a um tenant específico

---

## ESTADO ATUAL DA PLATAFORMA

### O que já existe no Admin

- Dashboard com 4 cards de métricas simples (cursos, tenants, alunos, certificados) — sem gráficos, sem saudação, sem banners
- Listagem de cursos como tabela/lista simples (nome + categoria + nível + badge "published") — sem cards visuais, sem thumbnails, sem busca
- Formulário "Novo Curso" com apenas 5 campos: Título, Descrição curta, Descrição completa, Categoria (texto livre), Nível, Instrutor — sem upload de banners, sem foto do professor, sem palette de fallback, sem preview
- Módulos listados em cards simples, aulas listadas em lista simples com badge de status
- Formulário de aula: Título, Descrição, Tipo (Vídeo/Texto/PDF), Upload de vídeo, Posição, Preview gratuito, Obrigatória — sem campo URL Panda Video, sem thumbnail, sem material complementar
- Tenants com 4 abas: Informações, Design System (presets de cores + preview ao vivo), Marca & Assets (upload de logos/banners), Cursos (ativar/remover cursos por tenant)
- Design System bem estruturado: presets, cores customizáveis, preview ao vivo com cards — mas o preview mostra cards horizontais simples, não os cards verticais do TheMembers

### O que NÃO existe (Área do Aluno)

- A rota `/[tenant-slug]` retorna 404 — a área do aluno **não está implementada**
- Não existe: login, header, homepage, hero, carrosséis, página do curso, página do módulo, player de aula, footer — **nada do front-end do aluno existe**

---

## TEMA VISUAL PADRÃO DA ÁREA DO ALUNO

O tema padrão é **dark mode** com cor primária variável por tenant.

| Elemento | Valor Padrão |
|----------|-------------|
| Background principal | #0a0a0a |
| Background secundário | #111111 |
| Texto principal | #ffffff |
| Texto secundário | #9ca3af |
| Cor primária / accent | Variável por tenant (padrão: #1ed6e4 cyan) |
| Badge instrutor | #00e676 (verde neon) |
| Barra de progresso | Cor primária do tenant |

### Tipografia

| Elemento | Tamanho | Peso |
|----------|---------|------|
| Título hero | 40-48px | 700 (bold) |
| Título seção/categoria | 28px | 600 (semibold) |
| Título card de curso | 14-16px | 700 (bold, uppercase) |
| Texto corpo | 14-16px | 400 (regular) |
| Badge instrutor | 10-11px | 600 (semibold, uppercase) |
| Título de aula | 24px | 700 (bold) |

### Variáveis CSS Dinâmicas

Gerar no SSR da página do aluno a partir dos valores salvos no banco para cada tenant:

```css
:root {
  --color-primary: ${tenant.primaryColor};
  --color-bg: #0a0a0a;
  --color-bg-secondary: #111111;
  --color-text: #ffffff;
  --color-text-secondary: #9ca3af;
  --color-instructor-badge: #00e676;
}
```

---

## BLOCO 1 — ÁREA DO ALUNO (FRONT-END) — PRIORIDADE CRÍTICA

> Este é o bloco mais importante. A área do aluno inteira precisa ser criada do zero.

### 1.1 — Rotas da Área do Aluno

Implementar as seguintes páginas:

- `/[tenant-slug]` → Redirect para `/[tenant-slug]/home`
- `/[tenant-slug]/home` → Homepage com hero + carrosséis de cursos por categoria
- `/[tenant-slug]/login` → Tela de login com banner configurável
- `/[tenant-slug]/courses/[courseId]` → Página do curso
- `/[tenant-slug]/courses/[courseId]/modules/[moduleId]` → Página do módulo
- `/[tenant-slug]/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]` → Player da aula

Aplicar tema dark mode como padrão global para toda a área do aluno.

---

### 1.2 — Tela de Login

**Estado atual:** retorna 404.

**Implementar:**

- Layout dividido em 2 colunas:
  - **Lado esquerdo:** banner full-height (imagem configurável no campo "Banner Login" do Marca & Assets do tenant; fallback: gradiente da cor primária do tenant). Overlay escuro semitransparente sobre o banner.
  - **Lado direito:** formulário centralizado verticalmente com:
    - Logo do tenant (usar "Logo Horizontal" do Marca & Assets; fallback: nome do tenant em texto)
    - Campo email (ícone de usuário)
    - Campo senha (ícone de cadeado + botão olho mostrar/ocultar)
    - Botão "Entrar" (filled, cor primária do tenant)
    - Link "Esqueci minha senha" (magic link opcional)
    - Rodapé: "🔒 Seus dados estão protegidos"
- Aplicar cor primária do tenant nos elementos interativos (botão, foco dos inputs, links)
- Responsivo: em mobile, banner some e formulário ocupa tela inteira

---

### 1.3 — Header da Área do Aluno

**Estado atual:** não existe.

**Implementar:**

- Header **sticky** (transparente quando no topo da homepage, solid dark #111111 ao rolar)
- Logo do tenant alinhada à esquerda (usar "Logo Horizontal" do Marca & Assets; fallback: nome do tenant)
- Menu de navegação central: **Início | Meus Cursos | Certificados | Comunidade**
- Ícones à direita:
  - 🔍 Busca
  - 🔔 Notificações (com badge numérico)
  - Avatar circular com iniciais do usuário
- Botão "Edição" (outline) visível **apenas para admins**
- Responsivo: menu colapsável em mobile (hamburger)

---

### 1.4 — Homepage — Hero Section

**Estado atual:** não existe.

**Implementar:**

- Banner hero full-width, altura ~100vh
- Usar imagem "Hero Homepage" do Marca & Assets do tenant (fallback: gradiente da cor primária)
- Overlay escuro gradient na parte inferior (rgba(0,0,0,0.5) → transparent)
- Texto sobreposto: "Bem-vindo, [nome do aluno]" ou título configurável pelo tenant
- Responsivo: em mobile usar "Hero Mobile" (768×400px) se disponível

---

### 1.5 — Homepage — Seções de Cursos por Categoria (Carrosséis)

**Estado atual:** não existe.

**Implementar:**

- Buscar todos os cursos ativos do tenant, agrupados pelo campo `categoria` do curso
- Renderizar **uma seção por categoria**, com:
  - Título da categoria: texto branco, 28px, semibold
  - Carrossel horizontal com scroll suave
  - Seta de navegação "›" visível ao hoverar no lado direito da seção
  - 5 cards visíveis em desktop, 3 em tablet, 2 em mobile
- **Seção "Continue assistindo"** no topo: cursos em andamento do aluno (progresso > 0% e < 100%)

#### Card de Curso — Especificações

- **Dimensão:** ~230px × 400px (proporção 2:3 vertical)
- **Border-radius:** 16px
- **Background:** usar "Banner Vertical" do curso como imagem full-cover (fallback: cor de fallback cadastrada no curso, ou gradiente do Design System do tenant)
- **Overlay:** escuro sutil sobre a imagem
- **No rodapé do card:**
  - Badge do instrutor: pill com fundo #00e676 (verde neon), texto branco, uppercase, ~11px — exibir campo `instrutor` do curso
  - Logo do tenant: branca, canto inferior (usar "Logo Quadrado" do Marca & Assets)
  - Título do curso: branco, uppercase, bold, ~14px, acima do badge
- **Hover:** escurecimento do overlay + scale(1.02) com transition suave (300ms)

**Dois tipos de card:**

- **Tipo A** (com instrutor cadastrado): exibir badge do instrutor + logo da empresa + título
- **Tipo B** (sem instrutor): apenas título + logo, título maior e centralizado

---

### 1.6 — Página do Curso

**Estado atual:** retorna 404.

**Implementar:**

- **Background:** "Banner Horizontal" do curso como fundo full-width com overlay dark (rgba(0,0,0,0.6))
- Breadcrumb "← Voltar ao início" no topo
- Badge "Curso" (pill, outline branca)
- Título do curso: branco, ~40px, bold
- Descrição curta do curso
- **Barra de progresso:** linha 4px, cor primária do tenant, com percentual "X% concluído"
- **Botão "Baixar certificado"** (outline branco):
  - Visível quando progresso = 100%
  - Quando < 100%: botão desabilitado com tooltip "Conclua 100% do curso para emitir o certificado"
- **Timeline vertical de módulos** abaixo do hero:
  - Cada módulo: número, título, contagem de aulas
  - Badge de status: "Em andamento" (amarelo) / "Concluído" (verde) / "Não iniciado" (cinza)
  - Clicável → navega para a página do módulo

---

### 1.7 — Página do Módulo

**Estado atual:** retorna 404.

**Implementar:**

- Background: gradiente do curso (replicar cor do banner ou gradiente CSS do tenant)
- Badge "Módulo" (pill, outline)
- Título do módulo (~32px, bold, branco)
- Botão "Começar" ou "Continuar" (filled, cor primária do tenant)
- **Timeline vertical de aulas:**
  - Thumbnail da aula (se disponível; fallback: ícone de play)
  - Título da aula
  - Duração estimada (se disponível)
  - Ícone de status: ✓ verde (concluída) ou círculo vazio (não iniciada)
  - Clicável → navega para o player

---

### 1.8 — Player de Aula

**Estado atual:** retorna 404.

**Implementar layout 2 colunas (70/30):**

#### Coluna Principal (70%)

- Breadcrumb "‹ Voltar para [nome do módulo]"
- **Player de vídeo Panda Video** — usar `<iframe>` com a URL do Panda Video cadastrada na aula. Proporção 16:9, full-width da coluna.
- Título da aula (~24px, branco, bold) abaixo do player
- **Barra de controles** abaixo do título:
  - ⏮ "Anterior" — navega para a aula anterior do módulo
  - ✓ "Concluído" — marca/desmarca a aula como concluída (persistir no backend). Quando marcado: fundo na cor primária do tenant
  - ⏭ "Próxima" — navega para a próxima aula do módulo
  - ♡ "Favoritar" — salva a aula nos favoritos do aluno
  - 👍 Like | 👎 Dislike (com contador visível)
- **Abas abaixo dos controles:**
  - **Aba "Comentários":** campo de texto com suporte a emoji, botão enviar. Listar comentários com avatar + nome + data + texto
  - **Aba "Dúvidas":** formulário separado para perguntas. Listar dúvidas com nome + data + pergunta

#### Sidebar (30%)

- Título do módulo + "Aulas • N conteúdos"
- Lista scrollável de todas as aulas do módulo:
  - Thumbnail (fallback: ícone de play)
  - Título da aula
  - Badge "Concluída" (verde) nas aulas já marcadas
  - Aula atual destacada com borda na cor primária do tenant
- **Seção "Material complementar"** (se houver arquivos PDF vinculados à aula):
  - Ícone de documento + nome do arquivo + botão de download

---

### 1.9 — Footer

**Estado atual:** não existe.

**Implementar:**

- Background dark (#111111)
- Logo do tenant (branca) à esquerda
- "© [ano] [nome do tenant] — Todos os direitos reservados"
- Coluna "Navegue": links Início, Meus Cursos, Certificados
- Coluna "Termos e ajuda": Termos de uso, Políticas de privacidade

---

## BLOCO 2 — ADMIN — Cadastro de Cursos — PRIORIDADE MÉDIA

### 2.1 — Formulário "Novo Curso" / "Editar Curso" — Adicionar campos

**Estado atual:** apenas Título, Descrição curta, Descrição completa, Categoria, Nível, Instrutor.

**Adicionar:**

1. **Banner Vertical** (upload, obrigatório para cards) — proporção 2:3, ~340×510px — exibir preview do card ao fazer upload
2. **Banner Horizontal** (upload, obrigatório) — proporção 16:9, ~1920×600px — usado como fundo da página do curso
3. **Banner Quadrado** (upload, opcional) — 400×400px
4. **Foto do Professor/Instrutor** (upload, opcional) — para card Tipo A
5. **Cor de fallback** — palette de 12 cores pré-definidas para quando não há banner vertical
6. **Jornada obrigatória** — toggle switch: quando ativo, aluno deve concluir aulas na ordem
7. **Preview do card ao vivo** — ao fazer upload do Banner Vertical, exibir preview do card como aparecerá na homepage
8. **Categoria** — transformar em campo com sugestões/autocomplete baseado nas categorias já cadastradas

Manter os campos existentes: Título, Descrição curta, Descrição completa, Categoria, Nível, Instrutor.

---

### 2.2 — Listagem de Cursos no Admin — Transformar em Grid de Cards

**Estado atual:** lista simples com nome, categoria, nível e badge "published".

**Alterar para:**

- Campo de busca no topo
- Botão "Criar curso" (primário, azul)
- Card tracejado "+" no início da grid para criar novo curso
- **Grid de cards verticais** usando Banner Vertical (se disponível) ou gradiente de fallback
- Cada card exibe: thumbnail/banner, título, instrutor, logo, status (badge "Publicado"/"Rascunho"), contagem de módulos e aulas
- **Hover:** aparece ícone de edição (lápis) e exclusão (lixeira)
- Grid responsiva: 5 colunas desktop, 3 tablet, 2 mobile

---

### 2.3 — Formulário "Nova Aula" — Adicionar campos

**Estado atual:** Título, Descrição, Tipo (Vídeo/Texto/PDF), Upload, Posição, Preview gratuito, Obrigatória.

**Adicionar:**

1. **URL do Panda Video** — campo de URL (alternativa ao upload direto). Se preenchido, usar embed do Panda Video no player via `<iframe>`
2. **Thumbnail da aula** — imagem 16:9 exibida na sidebar do player e na timeline do módulo
3. **Material complementar** — seção para upload de arquivos PDF/DOC disponíveis na sidebar do player
4. **Duração estimada** — campo numérico em minutos (exibido na timeline do módulo)

---

## BLOCO 3 — ADMIN — Dashboard — PRIORIDADE BAIXA

### 3.1 — Dashboard Admin — Enriquecer

**Estado atual:** 4 cards simples sem dados reais (Alunos e Certificados mostram "-").

**Melhorar:**

- Saudação "Olá, [nome do admin]!" com data atual
- Preencher cards com dados reais do banco
- Mini-gráfico de linha "Logins nos últimos 30 dias" (usar Recharts)
- Mini-gráfico de pizza "Alunos por tenant"
- Cards de acesso rápido: Criar Curso, Gerenciar Tenants, Ver Relatórios
- Rankings (futuro): Most Popular Courses, Most Engaged Students, Most/Least Liked Lessons

---

## BLOCO 4 — DESIGN SYSTEM — PRIORIDADE BAIXA

### 4.1 — Aplicar variáveis de cor do tenant na área do aluno

O Design System do tenant já tem os campos configurados (primária, sidebar, header fundo, etc.). Garantir que as variáveis CSS sejam geradas dinamicamente no SSR da página do aluno a partir dos valores salvos no banco, usando CSS custom properties.

### 4.2 — Preview do Design System

O preview atual mostra cards horizontais simples. Atualizar o preview para mostrar os **cards verticais 2:3** como eles aparecerão de fato na homepage do aluno.

---

## FUNCIONALIDADES EXCLUÍDAS (NÃO IMPLEMENTAR)

As seguintes funcionalidades do TheMembers **NÃO se aplicam** à nossa plataforma:

- ❌ **Checkout / Vendas / Assinaturas** — modelo B2G sem cobrança direta
- ❌ **Produtos / Planos** — acesso direto, sem planos
- ❌ **Co-produtores** — não aplicável
- ❌ **Refer & Earn** — não aplicável para B2G
- ❌ **Cross-selling Ads** — não aplicável
- ❌ **Wallet / Carteira** — sem transações financeiras
- ❌ **Reembolsos** — sem cobrança, sem reembolso
- ❌ **Vimeo** — usar exclusivamente **Panda Video**
- ❌ **Banner Circular** — apenas Vertical, Horizontal e Quadrado

---

## FUNCIONALIDADES ESPECÍFICAS DO MULTI-TENANT (JÁ EXISTEM — MANTER)

Estas funcionalidades já existem na plataforma e devem ser mantidas:

- ✅ Painel Admin Master com lista de todos os tenants
- ✅ Gestão de tenants: criar, editar, ativar/desativar
- ✅ Catálogo central de cursos com seleção por tenant
- ✅ Design System configurável por tenant (cores, logos, banners)
- ✅ Marca & Assets por tenant (logos horizontal/quadrado, banners hero/login)

---

## RESUMO DE PRIORIDADES — ORDEM DE IMPLEMENTAÇÃO

| # | Item | Impacto | Esforço | Bloco |
|---|------|---------|---------|-------|
| 1 | Criar rotas da área do aluno (1.1) | Crítico | Alto | 1 |
| 2 | Tela de Login (1.2) | Crítico | Médio | 1 |
| 3 | Header sticky (1.3) | Alto | Médio | 1 |
| 4 | Homepage Hero (1.4) | Alto | Baixo | 1 |
| 5 | Carrosséis por categoria + Cards 2:3 (1.5) | Alto | Alto | 1 |
| 6 | Página do Curso com banner horizontal (1.6) | Alto | Médio | 1 |
| 7 | Página do Módulo com timeline (1.7) | Alto | Médio | 1 |
| 8 | Player de Aula Panda Video (1.8) | Alto | Alto | 1 |
| 9 | Footer (1.9) | Baixo | Baixo | 1 |
| 10 | Campos de banner no formulário de curso + preview (2.1) | Médio | Médio | 2 |
| 11 | Grid de cards no admin (2.2) | Médio | Médio | 2 |
| 12 | Campos extras no formulário de aula (2.3) | Médio | Baixo | 2 |
| 13 | Dashboard enriquecido com gráficos (3.1) | Baixo | Médio | 3 |
| 14 | Variáveis CSS dinâmicas do tenant (4.1) | Baixo | Baixo | 4 |

---

## ORDEM DE EXECUÇÃO RECOMENDADA

**Comece pelo Bloco 1, nesta ordem:**

1. **1.1 → 1.2 → 1.3** — Rotas + Login + Header (tornar a área do aluno acessível)
2. **1.4 → 1.5** — Hero + Carrosséis com cards verticais (impacto visual mais forte)
3. **1.6 → 1.7** — Página do curso + Página do módulo (navegação completa)
4. **1.8** — Player de aula com Panda Video (experiência central)
5. **1.9** — Footer

**Depois Bloco 2:**

6. **2.1 → 2.2 → 2.3** — Campos de banner + grid de cards + campos de aula

**Por último Blocos 3 e 4.**

---

## ESPECIFICAÇÕES TÉCNICAS

```
Framework:         Next.js (App Router)
UI/Styling:        Tailwind CSS
Backend:           Supabase (PostgreSQL + Auth + Storage)
Deploy:            Vercel
Tema área aluno:   Dark mode padrão
Player de vídeo:   Panda Video (iframe embed)
Gráficos (admin):  Recharts
Cor primária ref:  #1ed6e4 (variável por tenant)
```

---

## ESTRUTURA DE IMAGENS POR CURSO

| Imagem | Dimensão | Obrigatório | Uso |
|--------|----------|-------------|-----|
| Banner Vertical | ~340×510px (2:3) | Sim (para cards) | Cards na homepage e admin |
| Banner Horizontal | ~1920×600px (16:9) | Sim | Fundo da página do curso |
| Banner Quadrado | 400×400px | Não | Uso secundário |
| Foto do Instrutor | Livre | Não | Card Tipo A |
| Cor de fallback | HEX (palette 12 cores) | Sim | Quando sem banner vertical |

## ESTRUTURA DE IMAGENS POR TENANT (Marca & Assets)

| Imagem | Uso |
|--------|-----|
| Logo Horizontal | Header da área do aluno, tela de login |
| Logo Quadrado | Rodapé dos cards de curso, certificados |
| Hero Homepage | Banner hero da homepage (desktop) |
| Hero Mobile | Banner hero da homepage (mobile, 768×400px) |
| Banner Login | Lado esquerdo da tela de login |

---

*Documento consolidado a partir de 3 análises do TheMembers realizadas em 30-31/03/2026.*  
*Versão 1.0 — Pronto para execução via Claude Code.*
