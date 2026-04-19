-- ============================================================
-- Migration 003: Schema EAD separado
-- Cria schema 'ead' com todas as tabelas do EAD para coexistir
-- com as tabelas existentes no schema 'public' (landing pages,
-- leads, instructors etc.) sem conflitos.
-- ============================================================

-- ============================================================
-- SCHEMA + GRANTS
-- ============================================================
CREATE SCHEMA IF NOT EXISTS ead;

GRANT USAGE ON SCHEMA ead TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA ead TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ead GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ead GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ead GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- ============================================================
-- EXTENSOES (ficam em public, ok)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE ead.organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  email       text NOT NULL UNIQUE,
  logo_url    text,
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ============================================================
-- ORGANIZATION ADMINS
-- ============================================================
CREATE TABLE ead.organization_admins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES ead.organizations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'admin',
  active          boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- ============================================================
-- TENANTS
-- ============================================================
CREATE TABLE ead.tenants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES ead.organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  slug            text NOT NULL UNIQUE,
  custom_domain   text UNIQUE,
  active          boolean DEFAULT true,
  contract_start  date,
  contract_end    date,
  allow_self_registration boolean DEFAULT false,
  completion_threshold    numeric(5,2) DEFAULT 80.00,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================
-- DESIGN TOKENS
-- ============================================================
CREATE TABLE ead.design_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES ead.tenants(id) ON DELETE CASCADE,
  mode        text NOT NULL DEFAULT 'light' CHECK (mode IN ('light', 'dark')),
  color_primary_50    text DEFAULT '#eff6ff',
  color_primary_100   text DEFAULT '#dbeafe',
  color_primary_200   text DEFAULT '#bfdbfe',
  color_primary_300   text DEFAULT '#93c5fd',
  color_primary_400   text DEFAULT '#60a5fa',
  color_primary_500   text DEFAULT '#3b82f6',
  color_primary_600   text DEFAULT '#2563eb',
  color_primary_700   text DEFAULT '#1d4ed8',
  color_primary_800   text DEFAULT '#1e40af',
  color_primary_900   text DEFAULT '#1e3a8a',
  color_secondary_50  text DEFAULT '#f0fdf4',
  color_secondary_100 text DEFAULT '#dcfce7',
  color_secondary_200 text DEFAULT '#bbf7d0',
  color_secondary_300 text DEFAULT '#86efac',
  color_secondary_400 text DEFAULT '#4ade80',
  color_secondary_500 text DEFAULT '#22c55e',
  color_secondary_600 text DEFAULT '#16a34a',
  color_secondary_700 text DEFAULT '#15803d',
  color_secondary_800 text DEFAULT '#166534',
  color_secondary_900 text DEFAULT '#14532d',
  color_tertiary_50   text DEFAULT '#fdf4ff',
  color_tertiary_100  text DEFAULT '#fae8ff',
  color_tertiary_200  text DEFAULT '#f5d0fe',
  color_tertiary_300  text DEFAULT '#f0abfc',
  color_tertiary_400  text DEFAULT '#e879f9',
  color_tertiary_500  text DEFAULT '#d946ef',
  color_tertiary_600  text DEFAULT '#c026d3',
  color_tertiary_700  text DEFAULT '#a21caf',
  color_tertiary_800  text DEFAULT '#86198f',
  color_tertiary_900  text DEFAULT '#701a75',
  color_neutral_50    text DEFAULT '#f9fafb',
  color_neutral_100   text DEFAULT '#f3f4f6',
  color_neutral_200   text DEFAULT '#e5e7eb',
  color_neutral_300   text DEFAULT '#d1d5db',
  color_neutral_400   text DEFAULT '#9ca3af',
  color_neutral_500   text DEFAULT '#6b7280',
  color_neutral_600   text DEFAULT '#4b5563',
  color_neutral_700   text DEFAULT '#374151',
  color_neutral_800   text DEFAULT '#1f2937',
  color_neutral_900   text DEFAULT '#111827',
  color_success       text DEFAULT '#22c55e',
  color_success_light text DEFAULT '#dcfce7',
  color_success_dark  text DEFAULT '#15803d',
  color_warning       text DEFAULT '#f59e0b',
  color_warning_light text DEFAULT '#fef3c7',
  color_warning_dark  text DEFAULT '#b45309',
  color_error         text DEFAULT '#ef4444',
  color_error_light   text DEFAULT '#fee2e2',
  color_error_dark    text DEFAULT '#b91c1c',
  color_info          text DEFAULT '#3b82f6',
  color_info_light    text DEFAULT '#dbeafe',
  color_info_dark     text DEFAULT '#1d4ed8',
  color_bg_page       text DEFAULT '#ffffff',
  color_bg_surface    text DEFAULT '#f9fafb',
  color_bg_elevated   text DEFAULT '#ffffff',
  color_bg_overlay    text DEFAULT 'rgba(0,0,0,0.5)',
  color_text_primary    text DEFAULT '#111827',
  color_text_secondary  text DEFAULT '#6b7280',
  color_text_disabled   text DEFAULT '#d1d5db',
  color_text_inverse    text DEFAULT '#ffffff',
  color_text_link       text DEFAULT '#3b82f6',
  color_text_link_hover text DEFAULT '#1d4ed8',
  color_border_default  text DEFAULT '#e5e7eb',
  color_border_strong   text DEFAULT '#d1d5db',
  color_border_focus    text DEFAULT '#3b82f6',
  color_header_bg       text DEFAULT '#ffffff',
  color_header_text     text DEFAULT '#111827',
  color_sidebar_bg      text DEFAULT '#1f2937',
  color_sidebar_text    text DEFAULT '#f9fafb',
  color_sidebar_active  text DEFAULT '#3b82f6',
  color_footer_bg       text DEFAULT '#111827',
  color_footer_text     text DEFAULT '#f9fafb',
  color_btn_primary_bg      text DEFAULT '#3b82f6',
  color_btn_primary_text    text DEFAULT '#ffffff',
  color_btn_primary_hover   text DEFAULT '#2563eb',
  color_btn_secondary_bg    text DEFAULT '#f3f4f6',
  color_btn_secondary_text  text DEFAULT '#111827',
  color_btn_secondary_hover text DEFAULT '#e5e7eb',
  color_btn_danger_bg       text DEFAULT '#ef4444',
  color_btn_danger_text     text DEFAULT '#ffffff',
  color_btn_danger_hover    text DEFAULT '#dc2626',
  color_card_bg             text DEFAULT '#ffffff',
  color_card_border         text DEFAULT '#e5e7eb',
  color_card_shadow         text DEFAULT 'rgba(0,0,0,0.08)',
  color_progress_track      text DEFAULT '#e5e7eb',
  color_progress_fill       text DEFAULT '#3b82f6',
  color_badge_default_bg    text DEFAULT '#f3f4f6',
  color_badge_default_text  text DEFAULT '#374151',
  color_input_bg            text DEFAULT '#ffffff',
  color_input_border        text DEFAULT '#d1d5db',
  color_input_focus_ring    text DEFAULT '#3b82f6',
  color_input_placeholder   text DEFAULT '#9ca3af',
  font_family_heading  text DEFAULT '"Inter", system-ui, sans-serif',
  font_family_body     text DEFAULT '"Inter", system-ui, sans-serif',
  font_size_xs         text DEFAULT '0.75rem',
  font_size_sm         text DEFAULT '0.875rem',
  font_size_base       text DEFAULT '1rem',
  font_size_lg         text DEFAULT '1.125rem',
  font_size_xl         text DEFAULT '1.25rem',
  font_size_2xl        text DEFAULT '1.5rem',
  font_size_3xl        text DEFAULT '1.875rem',
  radius_sm    text DEFAULT '0.25rem',
  radius_md    text DEFAULT '0.375rem',
  radius_lg    text DEFAULT '0.5rem',
  radius_xl    text DEFAULT '0.75rem',
  radius_full  text DEFAULT '9999px',
  shadow_sm    text DEFAULT '0 1px 2px rgba(0,0,0,0.05)',
  shadow_md    text DEFAULT '0 4px 6px rgba(0,0,0,0.07)',
  shadow_lg    text DEFAULT '0 10px 15px rgba(0,0,0,0.1)',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(tenant_id, mode)
);

-- ============================================================
-- DESIGN ASSETS
-- ============================================================
CREATE TABLE ead.design_assets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES ead.tenants(id) ON DELETE CASCADE,
  logo_square_url       text,
  logo_horizontal_url   text,
  logo_dark_url         text,
  favicon_url           text,
  login_banner_url          text,
  login_banner_vertical_url text,
  homepage_hero_url         text,
  homepage_hero_mobile_url  text,
  card_bg_pattern_1_url  text,
  card_bg_pattern_2_url  text,
  card_bg_pattern_3_url  text,
  card_bg_gradient_css   text,
  card_overlay_color     text DEFAULT 'rgba(0,0,0,0.3)',
  platform_bg_url        text,
  certificate_bg_url     text,
  certificate_logo_url   text,
  certificate_signature_url text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(tenant_id)
);

-- ============================================================
-- DESIGN PRESETS
-- ============================================================
CREATE TABLE ead.design_presets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  thumbnail_url text,
  tokens_snapshot jsonb NOT NULL,
  is_default  boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- USERS (mirror of auth.users)
-- ============================================================
CREATE TABLE ead.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL UNIQUE,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ============================================================
-- PROFILES (per tenant identity)
-- ============================================================
CREATE TABLE ead.profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES ead.users(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES ead.tenants(id) ON DELETE CASCADE,
  full_name   text NOT NULL,
  cpf         text,
  phone       text,
  department  text,
  job_title   text,
  avatar_url  text,
  role        text NOT NULL DEFAULT 'student'
              CHECK (role IN ('student', 'manager', 'admin_tenant')),
  active      boolean DEFAULT true,
  last_login_at timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

-- ============================================================
-- COURSES (com campos extras da migration 002)
-- ============================================================
CREATE TABLE ead.courses (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES ead.organizations(id) ON DELETE CASCADE,
  title                 text NOT NULL,
  slug                  text NOT NULL,
  description           text,
  short_description     text,
  thumbnail_transparent_url text,
  thumbnail_url         text,
  instructor_name       text,
  instructor_bio        text,
  instructor_photo_url  text,
  duration_minutes      int,
  level                 text DEFAULT 'beginner'
                        CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  category              text,
  tags                  text[],
  status                text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published', 'archived')),
  active                boolean DEFAULT true,
  published_at          timestamptz,
  -- campos da migration 002
  banner_vertical_url   text,
  banner_horizontal_url text,
  banner_square_url     text,
  fallback_color        text DEFAULT '#1e40af',
  sequential_journey    boolean DEFAULT false,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  UNIQUE(organization_id, slug)
);

COMMENT ON COLUMN ead.courses.banner_vertical_url IS 'Banner vertical 2:3 (~340x510px) para cards na homepage';
COMMENT ON COLUMN ead.courses.banner_horizontal_url IS 'Banner horizontal 16:9 (~1920x600px) para fundo da pagina do curso';
COMMENT ON COLUMN ead.courses.banner_square_url IS 'Banner quadrado 400x400px (opcional)';
COMMENT ON COLUMN ead.courses.fallback_color IS 'Cor HEX de fallback quando nao ha banner vertical';
COMMENT ON COLUMN ead.courses.sequential_journey IS 'Quando true, aluno deve concluir aulas na ordem';

-- ============================================================
-- MODULES
-- ============================================================
CREATE TABLE ead.modules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   uuid NOT NULL REFERENCES ead.courses(id) ON DELETE CASCADE,
  title       text NOT NULL,
  slug        text NOT NULL,
  description text,
  position    int NOT NULL DEFAULT 0,
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(course_id, slug)
);

-- ============================================================
-- LESSONS (com campos extras da migration 002)
-- ============================================================
CREATE TABLE ead.lessons (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id           uuid NOT NULL REFERENCES ead.modules(id) ON DELETE CASCADE,
  title               text NOT NULL,
  slug                text NOT NULL,
  description         text,
  position            int NOT NULL DEFAULT 0,
  content_type        text NOT NULL DEFAULT 'video'
                      CHECK (content_type IN ('video', 'text', 'pdf')),
  panda_video_id      text,
  panda_folder_id     text,
  video_duration_sec  int,
  video_status        text DEFAULT 'pending'
                      CHECK (video_status IN ('pending', 'processing', 'ready', 'error')),
  content_body        text,
  attachment_url      text,
  thumbnail_url       text,
  is_free_preview     boolean DEFAULT false,
  is_required         boolean DEFAULT true,
  active              boolean DEFAULT true,
  -- campos da migration 002
  panda_video_url     text,
  estimated_duration_minutes integer,
  supplementary_materials jsonb DEFAULT '[]'::jsonb,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE(module_id, slug)
);

COMMENT ON COLUMN ead.lessons.panda_video_url IS 'URL direta do Panda Video (alternativa ao panda_video_id)';
COMMENT ON COLUMN ead.lessons.estimated_duration_minutes IS 'Duracao estimada em minutos (entrada manual)';
COMMENT ON COLUMN ead.lessons.supplementary_materials IS 'Array JSON de materiais: [{name, url, type}]';

-- ============================================================
-- TENANT_COURSES
-- ============================================================
CREATE TABLE ead.tenant_courses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES ead.tenants(id) ON DELETE CASCADE,
  course_id       uuid NOT NULL REFERENCES ead.courses(id) ON DELETE CASCADE,
  contracted_at   timestamptz DEFAULT now(),
  expires_at      timestamptz,
  max_enrollments int,
  active          boolean DEFAULT true,
  UNIQUE(tenant_id, course_id)
);

-- ============================================================
-- ENROLLMENTS
-- ============================================================
CREATE TABLE ead.enrollments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       uuid NOT NULL REFERENCES ead.profiles(id) ON DELETE CASCADE,
  tenant_course_id uuid NOT NULL REFERENCES ead.tenant_courses(id) ON DELETE CASCADE,
  status           text DEFAULT 'active'
                   CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
  progress         numeric(5,2) DEFAULT 0,
  enrolled_at      timestamptz DEFAULT now(),
  completed_at     timestamptz,
  last_accessed_at timestamptz,
  UNIQUE(profile_id, tenant_course_id)
);

-- ============================================================
-- LESSON_PROGRESS
-- ============================================================
CREATE TABLE ead.lesson_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   uuid NOT NULL REFERENCES ead.enrollments(id) ON DELETE CASCADE,
  lesson_id       uuid NOT NULL REFERENCES ead.lessons(id) ON DELETE CASCADE,
  watched_seconds int DEFAULT 0,
  total_seconds   int DEFAULT 0,
  percentage      numeric(5,2) DEFAULT 0,
  completed       boolean DEFAULT false,
  completed_at    timestamptz,
  last_watched_at timestamptz DEFAULT now(),
  UNIQUE(enrollment_id, lesson_id)
);

-- ============================================================
-- CERTIFICATES
-- ============================================================
CREATE TABLE ead.certificates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id     uuid NOT NULL UNIQUE REFERENCES ead.enrollments(id) ON DELETE CASCADE,
  profile_id        uuid NOT NULL REFERENCES ead.profiles(id),
  course_id         uuid NOT NULL REFERENCES ead.courses(id),
  tenant_id         uuid NOT NULL REFERENCES ead.tenants(id),
  issued_at         timestamptz DEFAULT now(),
  pdf_url           text,
  verification_code text UNIQUE DEFAULT substr(md5(random()::text), 1, 12),
  student_name      text NOT NULL,
  course_title      text NOT NULL,
  tenant_name       text NOT NULL,
  duration_hours    numeric(6,1)
);

-- ============================================================
-- FAVORITES
-- ============================================================
CREATE TABLE ead.favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES ead.profiles(id) ON DELETE CASCADE,
  course_id   uuid NOT NULL REFERENCES ead.courses(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(profile_id, course_id)
);

-- ============================================================
-- INVITATIONS
-- ============================================================
CREATE TABLE ead.invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES ead.tenants(id) ON DELETE CASCADE,
  email       text NOT NULL,
  full_name   text,
  role        text DEFAULT 'student'
              CHECK (role IN ('student', 'manager', 'admin_tenant')),
  token       text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  status      text DEFAULT 'pending'
              CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  invited_by  uuid REFERENCES ead.profiles(id),
  accepted_at timestamptz,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at  timestamptz DEFAULT now(),
  UNIQUE(tenant_id, email)
);

-- ============================================================
-- MAGIC LINKS
-- ============================================================
CREATE TABLE ead.magic_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES ead.tenants(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES ead.users(id) ON DELETE CASCADE,
  token       text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  email       text NOT NULL,
  used        boolean DEFAULT false,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE ead.announcements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES ead.tenants(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES ead.profiles(id),
  title       text NOT NULL,
  body        text NOT NULL,
  priority    text DEFAULT 'normal'
              CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  pinned      boolean DEFAULT false,
  published   boolean DEFAULT true,
  course_id   uuid REFERENCES ead.courses(id) ON DELETE SET NULL,
  starts_at   timestamptz DEFAULT now(),
  expires_at  timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ============================================================
-- FORUM POSTS (com campos da migration 002)
-- ============================================================
CREATE TABLE ead.forum_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES ead.tenants(id) ON DELETE CASCADE,
  course_id   uuid NOT NULL REFERENCES ead.courses(id) ON DELETE CASCADE,
  profile_id  uuid NOT NULL REFERENCES ead.profiles(id) ON DELETE CASCADE,
  title       text,
  content     text NOT NULL,
  pinned      boolean DEFAULT false,
  approved    boolean DEFAULT true,
  -- campos da migration 002
  lesson_id   uuid REFERENCES ead.lessons(id) ON DELETE SET NULL,
  post_type   text DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'question', 'comment')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE ead.forum_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES ead.forum_posts(id) ON DELETE CASCADE,
  profile_id  uuid NOT NULL REFERENCES ead.profiles(id) ON DELETE CASCADE,
  content     text NOT NULL,
  approved    boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE ead.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES ead.profiles(id) ON DELETE CASCADE,
  type        text NOT NULL
              CHECK (type IN ('info', 'success', 'warning', 'course', 'certificate', 'announcement', 'community')),
  title       text NOT NULL,
  body        text,
  link        text,
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- GOALS
-- ============================================================
CREATE TABLE ead.goals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES ead.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  target_date date,
  completed   boolean DEFAULT false,
  completed_at timestamptz,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE ead.audit_logs (
  id          bigserial PRIMARY KEY,
  tenant_id   uuid REFERENCES ead.tenants(id),
  user_id     uuid REFERENCES auth.users(id),
  action      text NOT NULL,
  resource    text,
  resource_id text,
  metadata    jsonb,
  ip_address  text,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- LESSON REACTIONS (da migration 002)
-- ============================================================
CREATE TABLE ead.lesson_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES ead.lessons(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES ead.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lesson_id, profile_id)
);

-- ============================================================
-- FUNCOES (com SET search_path = ead)
-- ============================================================

-- updated_at trigger function
CREATE OR REPLACE FUNCTION ead.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = ead;

-- handle_new_ead_user: insere em ead.users quando auth user e criado
CREATE OR REPLACE FUNCTION ead.handle_new_ead_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO ead.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = ead;

-- recalculate enrollment progress
CREATE OR REPLACE FUNCTION ead.recalculate_enrollment_progress()
RETURNS trigger AS $$
DECLARE
  v_enrollment_id uuid;
  v_total_required int;
  v_completed int;
  v_new_progress numeric(5,2);
BEGIN
  v_enrollment_id := coalesce(NEW.enrollment_id, OLD.enrollment_id);

  SELECT count(*) INTO v_total_required
  FROM ead.lessons l
  JOIN ead.modules m ON m.id = l.module_id
  JOIN ead.courses c ON c.id = m.course_id
  JOIN ead.tenant_courses tc ON tc.course_id = c.id
  JOIN ead.enrollments e ON e.tenant_course_id = tc.id
  WHERE e.id = v_enrollment_id AND l.is_required = true AND l.active = true;

  SELECT count(*) INTO v_completed
  FROM ead.lesson_progress lp
  JOIN ead.lessons l ON l.id = lp.lesson_id
  WHERE lp.enrollment_id = v_enrollment_id AND lp.completed = true AND l.is_required = true;

  IF v_total_required > 0 THEN
    v_new_progress := round((v_completed::numeric / v_total_required::numeric) * 100, 2);
  ELSE
    v_new_progress := 0;
  END IF;

  UPDATE ead.enrollments
  SET progress = v_new_progress,
      last_accessed_at = now(),
      status = CASE WHEN v_new_progress >= 100 THEN 'completed' ELSE status END,
      completed_at = CASE WHEN v_new_progress >= 100 AND completed_at IS NULL THEN now() ELSE completed_at END
  WHERE id = v_enrollment_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = ead;

-- auto generate certificate
CREATE OR REPLACE FUNCTION ead.auto_generate_certificate()
RETURNS trigger AS $$
DECLARE
  v_profile ead.profiles;
  v_course ead.courses;
  v_tenant ead.tenants;
  v_existing_cert uuid;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    SELECT id INTO v_existing_cert FROM ead.certificates WHERE enrollment_id = NEW.id;
    IF v_existing_cert IS NOT NULL THEN RETURN NEW; END IF;

    SELECT p.* INTO v_profile FROM ead.profiles p WHERE p.id = NEW.profile_id;
    SELECT c.* INTO v_course FROM ead.courses c JOIN ead.tenant_courses tc ON tc.course_id = c.id WHERE tc.id = NEW.tenant_course_id;
    SELECT t.* INTO v_tenant FROM ead.tenants t JOIN ead.tenant_courses tc ON tc.tenant_id = t.id WHERE tc.id = NEW.tenant_course_id;

    INSERT INTO ead.certificates (enrollment_id, profile_id, course_id, tenant_id, student_name, course_title, tenant_name, duration_hours)
    VALUES (NEW.id, NEW.profile_id, v_course.id, v_tenant.id, v_profile.full_name, v_course.title, v_tenant.name, round(coalesce(v_course.duration_minutes, 0) / 60.0, 1));

    INSERT INTO ead.notifications (profile_id, type, title, body, link)
    VALUES (NEW.profile_id, 'certificate', 'Certificado disponivel!', 'Parabens! Voce concluiu o curso "' || v_course.title || '". Seu certificado esta disponivel.', '/certificados');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = ead;

-- ============================================================
-- HELPER FUNCTIONS for RLS
-- ============================================================
CREATE OR REPLACE FUNCTION ead.is_org_admin(org_id uuid)
RETURNS boolean AS $$
  SELECT exists (
    SELECT 1 FROM ead.organization_admins
    WHERE organization_id = org_id AND user_id = auth.uid() AND active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = ead;

CREATE OR REPLACE FUNCTION ead.has_tenant_role(t_id uuid, required_role text)
RETURNS boolean AS $$
  SELECT exists (
    SELECT 1 FROM ead.profiles
    WHERE tenant_id = t_id AND user_id = auth.uid() AND active = true
      AND (role = required_role OR role = 'admin_tenant')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = ead;

CREATE OR REPLACE FUNCTION ead.user_tenant_ids()
RETURNS setof uuid AS $$
  SELECT tenant_id FROM ead.profiles WHERE user_id = auth.uid() AND active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = ead;

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================
CREATE TRIGGER trg_ead_organizations_updated BEFORE UPDATE ON ead.organizations FOR EACH ROW EXECUTE FUNCTION ead.update_updated_at();
CREATE TRIGGER trg_ead_tenants_updated BEFORE UPDATE ON ead.tenants FOR EACH ROW EXECUTE FUNCTION ead.update_updated_at();
CREATE TRIGGER trg_ead_design_tokens_updated BEFORE UPDATE ON ead.design_tokens FOR EACH ROW EXECUTE FUNCTION ead.update_updated_at();
CREATE TRIGGER trg_ead_design_assets_updated BEFORE UPDATE ON ead.design_assets FOR EACH ROW EXECUTE FUNCTION ead.update_updated_at();
CREATE TRIGGER trg_ead_users_updated BEFORE UPDATE ON ead.users FOR EACH ROW EXECUTE FUNCTION ead.update_updated_at();
CREATE TRIGGER trg_ead_profiles_updated BEFORE UPDATE ON ead.profiles FOR EACH ROW EXECUTE FUNCTION ead.update_updated_at();
CREATE TRIGGER trg_ead_courses_updated BEFORE UPDATE ON ead.courses FOR EACH ROW EXECUTE FUNCTION ead.update_updated_at();
CREATE TRIGGER trg_ead_modules_updated BEFORE UPDATE ON ead.modules FOR EACH ROW EXECUTE FUNCTION ead.update_updated_at();
CREATE TRIGGER trg_ead_lessons_updated BEFORE UPDATE ON ead.lessons FOR EACH ROW EXECUTE FUNCTION ead.update_updated_at();
CREATE TRIGGER trg_ead_forum_posts_updated BEFORE UPDATE ON ead.forum_posts FOR EACH ROW EXECUTE FUNCTION ead.update_updated_at();
CREATE TRIGGER trg_ead_forum_comments_updated BEFORE UPDATE ON ead.forum_comments FOR EACH ROW EXECUTE FUNCTION ead.update_updated_at();
CREATE TRIGGER trg_ead_announcements_updated BEFORE UPDATE ON ead.announcements FOR EACH ROW EXECUTE FUNCTION ead.update_updated_at();

-- ============================================================
-- TRIGGER: new auth user → ead.users
-- Nome diferente para nao conflitar com on_auth_user_created existente
-- ============================================================
CREATE TRIGGER on_auth_user_created_ead
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION ead.handle_new_ead_user();

-- ============================================================
-- TRIGGER: recalculate enrollment progress
-- ============================================================
CREATE TRIGGER trg_ead_recalculate_progress
  AFTER INSERT OR UPDATE ON ead.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION ead.recalculate_enrollment_progress();

-- ============================================================
-- TRIGGER: auto generate certificate
-- ============================================================
CREATE TRIGGER trg_ead_auto_certificate
  AFTER UPDATE ON ead.enrollments
  FOR EACH ROW EXECUTE FUNCTION ead.auto_generate_certificate();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_ead_tenants_slug ON ead.tenants(slug);
CREATE INDEX idx_ead_tenants_custom_domain ON ead.tenants(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_ead_tenants_org ON ead.tenants(organization_id);
CREATE INDEX idx_ead_org_admins_user ON ead.organization_admins(user_id);
CREATE INDEX idx_ead_org_admins_org ON ead.organization_admins(organization_id);
CREATE INDEX idx_ead_profiles_user_tenant ON ead.profiles(user_id, tenant_id);
CREATE INDEX idx_ead_profiles_tenant_role ON ead.profiles(tenant_id, role);
CREATE INDEX idx_ead_enrollments_profile ON ead.enrollments(profile_id);
CREATE INDEX idx_ead_enrollments_tenant_course ON ead.enrollments(tenant_course_id);
CREATE INDEX idx_ead_enrollments_status ON ead.enrollments(status);
CREATE INDEX idx_ead_lesson_progress_enrollment ON ead.lesson_progress(enrollment_id);
CREATE INDEX idx_ead_lesson_progress_lesson ON ead.lesson_progress(lesson_id);
CREATE INDEX idx_ead_notifications_profile ON ead.notifications(profile_id, read);
CREATE INDEX idx_ead_design_tokens_tenant_mode ON ead.design_tokens(tenant_id, mode);
CREATE INDEX idx_ead_courses_org ON ead.courses(organization_id);
CREATE INDEX idx_ead_courses_status ON ead.courses(status);
CREATE INDEX idx_ead_courses_title_trgm ON ead.courses USING gin(title gin_trgm_ops);
CREATE INDEX idx_ead_modules_course_position ON ead.modules(course_id, position);
CREATE INDEX idx_ead_lessons_module_position ON ead.lessons(module_id, position);
CREATE INDEX idx_ead_tenant_courses_tenant ON ead.tenant_courses(tenant_id);
CREATE INDEX idx_ead_tenant_courses_course ON ead.tenant_courses(course_id);
CREATE INDEX idx_ead_invitations_tenant_email ON ead.invitations(tenant_id, email);
CREATE INDEX idx_ead_invitations_token ON ead.invitations(token);
CREATE INDEX idx_ead_invitations_status ON ead.invitations(status);
CREATE INDEX idx_ead_forum_posts_course ON ead.forum_posts(course_id, created_at DESC);
CREATE INDEX idx_ead_forum_posts_lesson ON ead.forum_posts(lesson_id);
CREATE INDEX idx_ead_forum_comments_post ON ead.forum_comments(post_id, created_at ASC);
CREATE INDEX idx_ead_announcements_tenant ON ead.announcements(tenant_id, published, starts_at DESC);
CREATE INDEX idx_ead_magic_links_token ON ead.magic_links(token);
CREATE INDEX idx_ead_audit_logs_tenant ON ead.audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_ead_certificates_verification ON ead.certificates(verification_code);
CREATE INDEX idx_ead_lesson_reactions_lesson ON ead.lesson_reactions(lesson_id);
CREATE INDEX idx_ead_lesson_reactions_profile ON ead.lesson_reactions(profile_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE ead.organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.organization_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.tenants             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.design_tokens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.design_assets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.design_presets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.courses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.modules             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.lessons             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.tenant_courses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.enrollments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.lesson_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.certificates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.favorites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.invitations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.magic_links         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.announcements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.forum_posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.forum_comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.goals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.lesson_reactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ead.audit_logs          ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES
-- ============================================================

-- organizations
CREATE POLICY "ead: organizations public read" ON ead.organizations FOR SELECT USING (true);
CREATE POLICY "ead: organizations admin manage" ON ead.organizations FOR ALL USING (ead.is_org_admin(id));

-- organization_admins
CREATE POLICY "ead: org_admins admin manage" ON ead.organization_admins FOR ALL USING (ead.is_org_admin(organization_id));
CREATE POLICY "ead: org_admins self read" ON ead.organization_admins FOR SELECT USING (user_id = auth.uid());

-- tenants
CREATE POLICY "ead: tenants public read active" ON ead.tenants FOR SELECT USING (active = true);
CREATE POLICY "ead: tenants org admin manage" ON ead.tenants FOR ALL USING (ead.is_org_admin(organization_id));
CREATE POLICY "ead: tenants tenant admin read" ON ead.tenants FOR SELECT USING (ead.has_tenant_role(id, 'admin_tenant'));

-- design_tokens
CREATE POLICY "ead: design_tokens public read" ON ead.design_tokens FOR SELECT USING (true);
CREATE POLICY "ead: design_tokens tenant admin write" ON ead.design_tokens FOR INSERT WITH CHECK (ead.has_tenant_role(tenant_id, 'admin_tenant'));
CREATE POLICY "ead: design_tokens tenant admin update" ON ead.design_tokens FOR UPDATE USING (ead.has_tenant_role(tenant_id, 'admin_tenant'));

-- design_assets
CREATE POLICY "ead: design_assets public read" ON ead.design_assets FOR SELECT USING (true);
CREATE POLICY "ead: design_assets tenant admin write" ON ead.design_assets FOR INSERT WITH CHECK (ead.has_tenant_role(tenant_id, 'admin_tenant'));
CREATE POLICY "ead: design_assets tenant admin update" ON ead.design_assets FOR UPDATE USING (ead.has_tenant_role(tenant_id, 'admin_tenant'));

-- design_presets
CREATE POLICY "ead: design_presets public read" ON ead.design_presets FOR SELECT USING (true);

-- users
CREATE POLICY "ead: users self read" ON ead.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "ead: users self update" ON ead.users FOR UPDATE USING (id = auth.uid());

-- profiles
CREATE POLICY "ead: profiles owner access" ON ead.profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "ead: profiles owner update own" ON ead.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "ead: profiles tenant admin manage" ON ead.profiles FOR ALL USING (ead.has_tenant_role(tenant_id, 'admin_tenant'));
CREATE POLICY "ead: profiles manager read tenant" ON ead.profiles FOR SELECT USING (ead.has_tenant_role(tenant_id, 'manager'));

-- courses
CREATE POLICY "ead: courses public read published" ON ead.courses FOR SELECT USING (status = 'published' AND active = true);
CREATE POLICY "ead: courses org admin manage" ON ead.courses FOR ALL USING (ead.is_org_admin(organization_id));

-- modules
CREATE POLICY "ead: modules public read active" ON ead.modules FOR SELECT USING (active = true AND EXISTS (SELECT 1 FROM ead.courses c WHERE c.id = modules.course_id AND c.status = 'published'));
CREATE POLICY "ead: modules org admin manage" ON ead.modules FOR ALL USING (EXISTS (SELECT 1 FROM ead.courses c WHERE c.id = modules.course_id AND ead.is_org_admin(c.organization_id)));

-- lessons
CREATE POLICY "ead: lessons read for enrolled or preview" ON ead.lessons FOR SELECT USING (active = true AND (is_free_preview = true OR EXISTS (SELECT 1 FROM ead.enrollments e JOIN ead.tenant_courses tc ON tc.id = e.tenant_course_id JOIN ead.courses c ON c.id = tc.course_id JOIN ead.modules m ON m.course_id = c.id JOIN ead.profiles p ON p.id = e.profile_id WHERE m.id = lessons.module_id AND p.user_id = auth.uid() AND e.status = 'active')));
CREATE POLICY "ead: lessons org admin manage" ON ead.lessons FOR ALL USING (EXISTS (SELECT 1 FROM ead.modules m JOIN ead.courses c ON c.id = m.course_id WHERE m.id = lessons.module_id AND ead.is_org_admin(c.organization_id)));

-- tenant_courses
CREATE POLICY "ead: tenant_courses tenant members read" ON ead.tenant_courses FOR SELECT USING (tenant_id IN (SELECT ead.user_tenant_ids()));
CREATE POLICY "ead: tenant_courses org admin manage" ON ead.tenant_courses FOR ALL USING (EXISTS (SELECT 1 FROM ead.tenants t WHERE t.id = tenant_courses.tenant_id AND ead.is_org_admin(t.organization_id)));
CREATE POLICY "ead: tenant_courses tenant admin read" ON ead.tenant_courses FOR SELECT USING (ead.has_tenant_role(tenant_id, 'admin_tenant'));

-- enrollments
CREATE POLICY "ead: enrollments owner access" ON ead.enrollments FOR SELECT USING (profile_id IN (SELECT id FROM ead.profiles WHERE user_id = auth.uid()));
CREATE POLICY "ead: enrollments tenant admin manage" ON ead.enrollments FOR ALL USING (EXISTS (SELECT 1 FROM ead.tenant_courses tc WHERE tc.id = enrollments.tenant_course_id AND ead.has_tenant_role(tc.tenant_id, 'admin_tenant')));

-- lesson_progress
CREATE POLICY "ead: lesson_progress owner access" ON ead.lesson_progress FOR ALL USING (enrollment_id IN (SELECT e.id FROM ead.enrollments e JOIN ead.profiles p ON p.id = e.profile_id WHERE p.user_id = auth.uid()));

-- certificates
CREATE POLICY "ead: certificates owner read" ON ead.certificates FOR SELECT USING (profile_id IN (SELECT id FROM ead.profiles WHERE user_id = auth.uid()));
CREATE POLICY "ead: certificates tenant admin read" ON ead.certificates FOR SELECT USING (ead.has_tenant_role(tenant_id, 'admin_tenant'));

-- favorites
CREATE POLICY "ead: favorites owner access" ON ead.favorites FOR ALL USING (profile_id IN (SELECT id FROM ead.profiles WHERE user_id = auth.uid()));

-- invitations
CREATE POLICY "ead: invitations tenant admin manage" ON ead.invitations FOR ALL USING (ead.has_tenant_role(tenant_id, 'admin_tenant'));
CREATE POLICY "ead: invitations invited user read own" ON ead.invitations FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- magic_links
CREATE POLICY "ead: magic_links service role only" ON ead.magic_links FOR ALL USING (false);

-- announcements
CREATE POLICY "ead: announcements tenant members read published" ON ead.announcements FOR SELECT USING (published = true AND tenant_id IN (SELECT ead.user_tenant_ids()) AND (starts_at IS NULL OR starts_at <= now()) AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "ead: announcements tenant admin manage" ON ead.announcements FOR ALL USING (ead.has_tenant_role(tenant_id, 'admin_tenant'));

-- forum_posts
CREATE POLICY "ead: forum_posts read approved" ON ead.forum_posts FOR SELECT USING (approved = true AND tenant_id IN (SELECT ead.user_tenant_ids()));
CREATE POLICY "ead: forum_posts write own" ON ead.forum_posts FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM ead.profiles WHERE user_id = auth.uid()));
CREATE POLICY "ead: forum_posts update own" ON ead.forum_posts FOR UPDATE USING (profile_id IN (SELECT id FROM ead.profiles WHERE user_id = auth.uid()));
CREATE POLICY "ead: forum_posts tenant admin moderate" ON ead.forum_posts FOR ALL USING (ead.has_tenant_role(tenant_id, 'admin_tenant'));

-- forum_comments
CREATE POLICY "ead: forum_comments read approved" ON ead.forum_comments FOR SELECT USING (approved = true AND EXISTS (SELECT 1 FROM ead.forum_posts fp WHERE fp.id = forum_comments.post_id AND fp.tenant_id IN (SELECT ead.user_tenant_ids())));
CREATE POLICY "ead: forum_comments write own" ON ead.forum_comments FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM ead.profiles WHERE user_id = auth.uid()));
CREATE POLICY "ead: forum_comments tenant admin moderate" ON ead.forum_comments FOR ALL USING (EXISTS (SELECT 1 FROM ead.forum_posts fp WHERE fp.id = forum_comments.post_id AND ead.has_tenant_role(fp.tenant_id, 'admin_tenant')));

-- notifications
CREATE POLICY "ead: notifications owner access" ON ead.notifications FOR ALL USING (profile_id IN (SELECT id FROM ead.profiles WHERE user_id = auth.uid()));

-- goals
CREATE POLICY "ead: goals owner access" ON ead.goals FOR ALL USING (profile_id IN (SELECT id FROM ead.profiles WHERE user_id = auth.uid()));

-- lesson_reactions
CREATE POLICY "ead: lesson_reactions read" ON ead.lesson_reactions FOR SELECT USING (true);
CREATE POLICY "ead: lesson_reactions manage own" ON ead.lesson_reactions FOR ALL USING (profile_id IN (SELECT id FROM ead.profiles WHERE user_id = auth.uid()));

-- audit_logs (somente service_role pode ler/escrever)
CREATE POLICY "ead: audit_logs service role only" ON ead.audit_logs FOR ALL USING (false);
