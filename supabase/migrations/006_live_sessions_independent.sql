-- ============================================================
-- Migration 006: Live Sessions independentes (sem obrigatoriedade de curso)
-- ============================================================

-- Tornar course_id opcional
ALTER TABLE ead.live_sessions ALTER COLUMN course_id DROP NOT NULL;

-- Adicionar organization_id para lives independentes
ALTER TABLE ead.live_sessions ADD COLUMN organization_id uuid REFERENCES ead.organizations(id);

-- Preencher organization_id para sessoes existentes
UPDATE ead.live_sessions ls
SET organization_id = c.organization_id
FROM ead.courses c
WHERE ls.course_id = c.id AND ls.organization_id IS NULL;

-- Imagem de capa da live
ALTER TABLE ead.live_sessions ADD COLUMN cover_image_url text;

-- Instrutor/palestrante
ALTER TABLE ead.live_sessions ADD COLUMN instructor_name text;

-- Indice para busca por organizacao
CREATE INDEX idx_live_sessions_org ON ead.live_sessions(organization_id);

-- Policy atualizada: leitura publica para lives da org (com ou sem curso)
DROP POLICY IF EXISTS "ead: live_sessions public read" ON ead.live_sessions;
CREATE POLICY "ead: live_sessions public read"
  ON ead.live_sessions FOR SELECT
  USING (
    -- Live de curso publicado
    (course_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM ead.courses c
      WHERE c.id = live_sessions.course_id
        AND c.status = 'published' AND c.active = true
    ))
    OR
    -- Live independente (sem curso)
    (course_id IS NULL AND organization_id IS NOT NULL)
  );

-- Policy atualizada: admin da org gerencia
DROP POLICY IF EXISTS "ead: live_sessions org admin manage" ON ead.live_sessions;
CREATE POLICY "ead: live_sessions org admin manage"
  ON ead.live_sessions FOR ALL
  USING (
    (organization_id IS NOT NULL AND ead.is_org_admin(organization_id))
    OR
    (course_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM ead.courses c
      WHERE c.id = live_sessions.course_id
        AND ead.is_org_admin(c.organization_id)
    ))
  );
