-- =============================================
-- 009: Live Chat + controle manual da Live (final/idempotente)
-- Rodar no Supabase SQL Editor. Pode re-executar com seguranca.
-- =============================================

-- 1) Tabela de mensagens do chat (profile_id nullable p/ admin/instrutor)
CREATE TABLE IF NOT EXISTS ead.live_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_session_id uuid NOT NULL REFERENCES ead.live_sessions(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES ead.profiles(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (char_length(message) <= 500),
  sender_name text,
  is_instructor boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2) Caso a tabela ja existisse em versao antiga, garantir colunas/nullability
DO $$
BEGIN
  BEGIN
    ALTER TABLE ead.live_chat_messages ALTER COLUMN profile_id DROP NOT NULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

ALTER TABLE ead.live_chat_messages ADD COLUMN IF NOT EXISTS sender_name text;
ALTER TABLE ead.live_chat_messages ADD COLUMN IF NOT EXISTS is_instructor boolean DEFAULT false;

-- 3) Indexes
CREATE INDEX IF NOT EXISTS idx_live_chat_session ON ead.live_chat_messages(live_session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_live_chat_profile ON ead.live_chat_messages(profile_id);

-- 4) RLS
ALTER TABLE ead.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop + recreate policies para ficarem sempre corretas
DROP POLICY IF EXISTS "Enrolled can read chat" ON ead.live_chat_messages;
DROP POLICY IF EXISTS "Enrolled can send chat" ON ead.live_chat_messages;
DROP POLICY IF EXISTS "Org admin can read chat" ON ead.live_chat_messages;
DROP POLICY IF EXISTS "Org admin can send chat" ON ead.live_chat_messages;

CREATE POLICY "Enrolled can read chat" ON ead.live_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ead.live_enrollments le
      WHERE le.live_session_id = live_chat_messages.live_session_id
        AND le.profile_id = (SELECT id FROM ead.profiles WHERE user_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "Enrolled can send chat" ON ead.live_chat_messages
  FOR INSERT WITH CHECK (
    profile_id = (SELECT id FROM ead.profiles WHERE user_id = auth.uid() LIMIT 1)
    AND EXISTS (
      SELECT 1 FROM ead.live_enrollments le
      WHERE le.live_session_id = live_chat_messages.live_session_id
        AND le.profile_id = live_chat_messages.profile_id
    )
  );

CREATE POLICY "Org admin can read chat" ON ead.live_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ead.organization_admins oa
      JOIN ead.live_sessions ls ON ls.organization_id = oa.organization_id
      WHERE ls.id = live_chat_messages.live_session_id
        AND oa.user_id = auth.uid()
        AND oa.active = true
    )
  );

CREATE POLICY "Org admin can send chat" ON ead.live_chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ead.organization_admins oa
      JOIN ead.live_sessions ls ON ls.organization_id = oa.organization_id
      WHERE ls.id = live_chat_messages.live_session_id
        AND oa.user_id = auth.uid()
        AND oa.active = true
    )
  );

-- 5) Habilitar Realtime para a tabela
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE ead.live_chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
  WHEN OTHERS THEN RAISE NOTICE 'Realtime publication warning: %', SQLERRM;
END $$;

-- =============================================
-- 6) Controle manual da Live: simplificar status para scheduled/live/ended
--    O admin abre e fecha manualmente; OBS conectar/desconectar NAO afeta.
-- =============================================

-- Normalizar qualquer 'paused' existente para 'live' (nao usamos mais)
UPDATE ead.live_sessions SET status = 'live' WHERE status = 'paused';

-- Recriar CHECK constraint (drop qualquer variante existente)
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'ead.live_sessions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE ead.live_sessions DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE ead.live_sessions
  ADD CONSTRAINT live_sessions_status_check
  CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled'));
