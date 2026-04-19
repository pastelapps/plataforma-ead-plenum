-- ============================================================
-- Migration 005: Trilhas (Tracks), Live Enrollments & Rankings
-- ============================================================

-- ============================================================
-- TRILHAS (agrupam cursos por tema)
-- ============================================================
CREATE TABLE ead.tracks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES ead.organizations(id),
  title            text NOT NULL,
  slug             text NOT NULL,
  description      text,
  icon_url         text,
  position         integer DEFAULT 0,
  active           boolean DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE INDEX idx_tracks_org ON ead.tracks(organization_id);

CREATE TRIGGER trg_ead_tracks_updated
  BEFORE UPDATE ON ead.tracks
  FOR EACH ROW EXECUTE FUNCTION ead.update_updated_at();

ALTER TABLE ead.tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ead: tracks public read"
  ON ead.tracks FOR SELECT
  USING (active = true);

CREATE POLICY "ead: tracks org admin manage"
  ON ead.tracks FOR ALL
  USING (ead.is_org_admin(organization_id));

-- ============================================================
-- TRACK_COURSES (associa cursos a trilhas)
-- ============================================================
CREATE TABLE ead.track_courses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id    uuid NOT NULL REFERENCES ead.tracks(id) ON DELETE CASCADE,
  course_id   uuid NOT NULL REFERENCES ead.courses(id) ON DELETE CASCADE,
  position    integer DEFAULT 0,
  UNIQUE(track_id, course_id)
);

CREATE INDEX idx_track_courses_track ON ead.track_courses(track_id);
CREATE INDEX idx_track_courses_course ON ead.track_courses(course_id);

ALTER TABLE ead.track_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ead: track_courses public read"
  ON ead.track_courses FOR SELECT
  USING (true);

CREATE POLICY "ead: track_courses org admin manage"
  ON ead.track_courses FOR ALL
  USING (EXISTS (
    SELECT 1 FROM ead.tracks t
    WHERE t.id = track_courses.track_id
      AND ead.is_org_admin(t.organization_id)
  ));

-- ============================================================
-- LIVE_ENROLLMENTS (matrícula em lives)
-- ============================================================
CREATE TABLE ead.live_enrollments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_session_id  uuid NOT NULL REFERENCES ead.live_sessions(id) ON DELETE CASCADE,
  profile_id       uuid NOT NULL REFERENCES ead.profiles(id) ON DELETE CASCADE,
  enrolled_at      timestamptz DEFAULT now(),
  UNIQUE(live_session_id, profile_id)
);

CREATE INDEX idx_live_enrollments_session ON ead.live_enrollments(live_session_id);
CREATE INDEX idx_live_enrollments_profile ON ead.live_enrollments(profile_id);

ALTER TABLE ead.live_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ead: live_enrollments own read"
  ON ead.live_enrollments FOR SELECT
  USING (profile_id = auth.uid() OR EXISTS (
    SELECT 1 FROM ead.profiles p
    WHERE p.id = live_enrollments.profile_id
      AND p.user_id = auth.uid()
  ));

CREATE POLICY "ead: live_enrollments own insert"
  ON ead.live_enrollments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM ead.profiles p
    WHERE p.id = live_enrollments.profile_id
      AND p.user_id = auth.uid()
  ));

CREATE POLICY "ead: live_enrollments own delete"
  ON ead.live_enrollments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM ead.profiles p
    WHERE p.id = live_enrollments.profile_id
      AND p.user_id = auth.uid()
  ));

CREATE POLICY "ead: live_enrollments service role"
  ON ead.live_enrollments FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- RECORDING EXPIRATION
-- ============================================================
ALTER TABLE ead.live_sessions ADD COLUMN recording_expires_at timestamptz;

-- ============================================================
-- STUDENT RANKINGS VIEW
-- ============================================================
CREATE OR REPLACE VIEW ead.student_rankings AS
SELECT
  p.id as profile_id,
  p.tenant_id,
  p.full_name,
  p.avatar_url,
  p.department,
  COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) as courses_completed,
  COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) as courses_in_progress,
  COUNT(DISTINCT e.id) as total_enrollments
FROM ead.profiles p
LEFT JOIN ead.enrollments e ON e.profile_id = p.id
WHERE p.role = 'student' AND p.active = true
GROUP BY p.id, p.tenant_id, p.full_name, p.avatar_url, p.department;

-- ============================================================
-- GRANTS
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ead.tracks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ead.track_courses TO authenticated;
GRANT SELECT, INSERT, DELETE ON ead.live_enrollments TO authenticated;
GRANT SELECT ON ead.student_rankings TO authenticated;

GRANT ALL ON ead.tracks TO service_role;
GRANT ALL ON ead.track_courses TO service_role;
GRANT ALL ON ead.live_enrollments TO service_role;
GRANT SELECT ON ead.student_rankings TO service_role;
