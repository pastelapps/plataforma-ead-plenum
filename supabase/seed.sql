-- ============================================================
-- SEED DATA
-- ============================================================

-- 1. Organization
insert into organizations (id, name, slug, email) values
  ('11111111-1111-1111-1111-111111111111', 'Plenum - Educação Corporativa', 'plenum', 'admin@plenum.com.br');

-- 2. Tenants
insert into tenants (id, organization_id, name, slug, completion_threshold) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'Prefeitura de Guaxupé', 'prefeitura-guaxupe', 80.00),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
   'Prefeitura de Muzambinho', 'prefeitura-muzambinho', 80.00);

-- 3. Design Tokens
insert into design_tokens (tenant_id, mode, color_primary_500, color_primary_600, color_sidebar_bg)
values ('22222222-2222-2222-2222-222222222222', 'light', '#1a5276', '#154360', '#0e2f44');

insert into design_tokens (tenant_id, mode, color_primary_500, color_primary_600, color_sidebar_bg)
values ('33333333-3333-3333-3333-333333333333', 'light', '#16a34a', '#15803d', '#14532d');

-- 4. Design Assets
insert into design_assets (tenant_id) values
  ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333');

-- 5. Design Presets
insert into design_presets (name, description, is_default, tokens_snapshot) values
  ('Azul Institucional', 'Clássico e profissional', true, '{"primary500":"#3b82f6"}'),
  ('Verde Natureza', 'Fresco e acolhedor', false, '{"primary500":"#16a34a"}'),
  ('Roxo Educação', 'Moderno e criativo', false, '{"primary500":"#8b5cf6"}');

-- 6. Cursos
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

-- 7. Módulos
insert into modules (id, course_id, title, slug, position) values
  ('bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Fundamentos da Gestão Pública', 'fundamentos', 0),
  ('bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Planejamento Público', 'planejamento', 1),
  ('bbbb3333-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Licitações e Contratos', 'licitacoes', 2);

-- 8. Aulas
insert into lessons (module_id, title, slug, position, content_type, video_duration_sec, is_required) values
  ('bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Introdução à Administração Pública', 'introducao', 0, 'video', 754, true),
  ('bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Princípios Constitucionais', 'principios', 1, 'video', 920, true),
  ('bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Estrutura do Estado Brasileiro', 'estrutura-estado', 2, 'video', 1125, true),
  ('bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Material Complementar', 'material-complementar', 3, 'text', null, false);

-- 9. Contratos
insert into tenant_courses (tenant_id, course_id) values
  ('22222222-2222-2222-2222-222222222222', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('33333333-3333-3333-3333-333333333333', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
