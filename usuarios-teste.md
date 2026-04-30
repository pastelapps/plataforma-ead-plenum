# Usuarios de Teste - Plenum EAD

> Senha unica para todos: **`123456`**
> Fonte de verdade: `auth.users` + `ead.profiles` do projeto Supabase `jyackmnjhsdllfqqxund`
> Ultima atualizacao: 2026-04-23

---

## Master (Administrador da Organizacao)

| Email | Nome | Acesso |
|-------|------|--------|
| `master@plenum.com.br` | Administrador Master | `/admin` - gerencia toda a organizacao |

---

## Prefeitura de Guaxupe

URL dev: `http://localhost:3000/?tenant=prefeitura-guaxupe`
URL prod: `https://projetovideoaulas.vercel.app/?tenant=prefeitura-guaxupe`

| Email | Nome | Role | Departamento |
|-------|------|------|--------------|
| `admin@guaxupe.gov.br` | Admin Guaxupe | admin_tenant | Administracao |
| `aluno1@guaxupe.gov.br` | *(sem nome)* | student | - |
| `aluno2@guaxupe.gov.br` | Carlos Silva | student | Educacao |
| `aluno3@guaxupe.gov.br` | Ana Oliveira | student | Saude |
| `aluno4@guaxupe.gov.br` | Pedro Santos | student | Financas |

---

## Prefeitura de Muzambinho

URL dev: `http://localhost:3000/?tenant=prefeitura-muzambinho`
URL prod: `https://projetovideoaulas.vercel.app/?tenant=prefeitura-muzambinho`

| Email | Nome | Role | Departamento |
|-------|------|------|--------------|
| `admin@muzambinho.gov.br` | Admin Muzambinho | admin_tenant | Administracao |
| `aluno1@muzambinho.gov.br` | *(sem nome)* | student | - |
| `aluno2@muzambinho.gov.br` | Lucas Ferreira | student | Educacao |
| `aluno3@muzambinho.gov.br` | Mariana Lima | student | Saude |
| `aluno4@muzambinho.gov.br` | Rafael Souza | student | Obras |

---

## Plenum Educacao

URL dev: `http://localhost:3000/?tenant=plenum`
URL prod: `https://projetovideoaulas.vercel.app/?tenant=plenum`

| Email | Nome | Role | Departamento |
|-------|------|------|--------------|
| `admin@plenum.edu.br` | Admin Plenum | admin_tenant | Administracao |
| `aluno1@plenum.edu.br` | *(sem nome)* | student | - |
| `aluno2@plenum.edu.br` | Fernanda Rocha | student | Comercial |
| `aluno3@plenum.edu.br` | Gustavo Almeida | student | Tecnologia |
| `aluno4@plenum.edu.br` | Beatriz Martins | student | Marketing |

---

## URLs gerais

| Area | Local | Producao |
|------|-------|----------|
| Login aluno | `http://localhost:3000/login` | `https://projetovideoaulas.vercel.app/login` |
| Home aluno | `http://localhost:3000/` | `https://projetovideoaulas.vercel.app/` |
| Admin organizacao | `http://localhost:3000/admin` | `https://projetovideoaulas.vercel.app/admin` |
| Admin tenant | `http://localhost:3000/tenant-admin` | `https://projetovideoaulas.vercel.app/tenant-admin` |

---

## Truques uteis em dev

- Trocar de tenant sem subdominio: `?tenant=<slug>` - o middleware salva em cookie (`dev-tenant-slug`) e redireciona.
- Trocar de usuario em abas diferentes: usar janelas anonimas separadas (cada uma tem seu cookie de sessao).
- Se der `?error=no-profile`: o usuario logado nao tem perfil no tenant resolvido. Trocar o tenant via `?tenant=slug` correto antes do login.
