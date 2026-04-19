# Resumo da Reunião — André Azevedo × Geraldo Neto
**Data:** 08/04/2026 | **Duração:** 102 minutos

---

## 1. Contexto do negócio do André

- André vende cursos online ao vivo para o setor público (pregoeiros, servidores)
- Realiza de 5 a 8 lives por mês, turmas de 16 a 32 alunos, ~16h de carga horária cada
- Já tem receita recorrente — o objetivo é profissionalizar a entrega com plataforma própria
- Usou o portal do **G4 Educação** como referência visual, mas criticou a navegação com muitos cliques

---

## 2. Stack de streaming (aulas ao vivo)

**O que foi decidido:**
- **Mepray Streaming** — escolhido como ferramenta de live. Melhor custo-benefício, plano gratuito com 100 mil minutos/mês suficiente para o volume atual (~31 USD/mês no máximo)
- **OBS Studio** — integra com Mepray via RTMP para captura e transmissão
- **Panda Vídeo** — armazenamento das aulas gravadas após cada live

**Pontos de implementação:**
- Criar rotina automática (n8n) para mover a gravação do Mepray → Panda Vídeo ao fim de cada live
- Deletar o vídeo temporário do Mepray após a migração para evitar custo
- Panda Vídeo aplica marca d'água do aluno em caso de download indevido

**Observações:**
- Nenhuma proteção é 100% inviolável, mas o nível oferecido é suficiente para o público-alvo (servidores públicos sem perfil técnico avançado)

---

## 3. Plataforma LMS (área do aluno)

**O que foi decidido:**
- Next.js + Supabase (já no stack do Neto)
- Player do Panda Vídeo embutido na área do aluno
- Login por **e-mail e senha** para o público-alvo atual
- Alternativa de login por **CPF + data de nascimento** levantada para públicos menos digitais (vereadores, servidores de interior) — André já usou isso e funcionou por 4-5 anos

**Pontos de implementação:**
- Controle de acesso via Supabase RLS — cada aluno vê só o que tem direito
- Salvar progresso do vídeo (onde o aluno parou) — Panda Vídeo já oferece isso nativamente

---

## 4. Organização dos conteúdos

**O que foi decidido:**
- Sistema de **trilhas (Skills/Esquilos)** para agrupar cursos por tema
- Lives aparecem num **carrossel separado** com data e botão de matrícula
- Dois planos de acesso:
  - **Primo (Premium):** acessa todas as trilhas e pode se matricular nas lives do mês. Não é matriculado automaticamente em tudo — ele escolhe para não poluir o painel
  - **Aluno por curso:** acessa só o conteúdo do curso específico comprado
- Aluno tem **30 dias** para assistir as aulas gravadas de cada turma
- Ao concluir o curso, o aluno pode **baixar o certificado em PDF** direto da área do aluno

**Pontos de implementação:**
- Card de cada curso com data, botão "Assistir ao vivo" e acesso à gravação pós-live
- Painel mostra: cursos em andamento e cursos concluídos (com botão de certificado)
- Botão **"Quero participar"** em cursos futuros — dispara lead para o time de vendas via WhatsApp

---

## 5. Gestão e métricas

**O que foi decidido:**
- **Ranking de alunos** — cursos concluídos e iniciados, visível para admin e aluno
- Painel admin para criar cursos, trilhas, turmas e gerenciar matrículas

**Pontos de implementação:**
- Relatório por aluno: quantos cursos começou, quantos terminou
- Ranking pode virar motivador de engajamento (ex: "Top aluno do mês")

---

## 6. Fora do MVP (ideias para fases futuras)

- **Quizzes automáticos por IA** — perguntas geradas ao fim de cada módulo para avaliar o aluno. André já tentou algo parecido e enfrentou resistência de professores que substituíam aulas por provas
- **Gamificação** — selos, conquistas e certificados premium (ex: "Aluno Exemplar", "Fera do Fera")
- **Prêmio anual** — Neto sugeriu criar um prêmio de melhores práticas em gestão pública para ranquear alunos/prefeituras. André achou interessante mas não vai assumir agora
- **Rede de ex-alunos (Alumni)** — conectar alunos da mesma turma, estilo LinkedIn interno. André ficou interessado mas é fase bem posterior

---

## 7. Próximos passos

| Ação | Responsável | Prazo |
|---|---|---|
| Finalizar design e arquitetura da área do aluno | Neto | Até segunda-feira 13/04 |
| Compartilhar acesso ao G4 como referência visual | André | — |
| Definir identidade visual final do Pleno Brasil | André | — |
| Configurar contas no Mepray e Panda Vídeo | A definir | — |
| Validar fluxo de matrícula e planos de acesso | Neto + André | — |

---

*Gerado a partir da transcrição da reunião — Ajudei Serviços Digitais*
