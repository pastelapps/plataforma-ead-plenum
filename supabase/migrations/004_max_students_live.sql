-- ============================================================
-- Migration 004: Max Students + Live Courses (Mux)
-- ============================================================

-- ============================================================
-- FEATURE 2: Limite de vagas por tenant
-- ============================================================
ALTER TABLE ead.tenants ADD COLUMN max_students integer;

-- ============================================================
-- FEATURE 1: Cursos ao vivo
-- ============================================================

-- Modalidade do curso (gravado ou ao vivo)
ALTER TABLE ead.courses ADD COLUMN modality text NOT NULL DEFAULT 'on_demand'
  CHECK (modality IN ('on_demand', 'live'));

-- ============================================================
-- LIVE SESSIONS
-- ============================================================
CREATE TABLE ead.live_sessions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id                uuid NOT NULL REFERENCES ead.courses(id) ON DELETE CASCADE,
  title                    text NOT NULL,
  description              text,
  scheduled_start          timestamptz NOT NULL,
  scheduled_end            timestamptz NOT NULL,
  actual_start             timestamptz,
  actual_end               timestamptz,
  status                   text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  mux_live_stream_id       text,
  mux_stream_key           text,
  mux_playback_id          text,
  mux_asset_id             text,
  mux_recording_playback_id text,
  recording_available      boolean DEFAULT false,
  recording_duration_sec   integer,
  max_viewers              integer,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_live_sessions_course ON ead.live_sessions(course_id);
CREATE INDEX idx_live_sessions_status ON ead.live_sessions(status);
CREATE INDEX idx_live_sessions_scheduled ON ead.live_sessions(scheduled_start);

-- updated_at trigger
CREATE TRIGGER trg_ead_live_sessions_updated
  BEFORE UPDATE ON ead.live_sessions
  FOR EACH ROW EXECUTE FUNCTION ead.update_updated_at();

-- RLS
ALTER TABLE ead.live_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "ead: live_sessions public read"
  ON ead.live_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM ead.courses c
    WHERE c.id = live_sessions.course_id
      AND c.status = 'published' AND c.active = true
  ));

CREATE POLICY "ead: live_sessions org admin manage"
  ON ead.live_sessions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM ead.courses c
    WHERE c.id = live_sessions.course_id
      AND ead.is_org_admin(c.organization_id)
  ));
