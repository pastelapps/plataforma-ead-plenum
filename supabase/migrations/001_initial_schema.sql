-- ============================================================
-- EXTENSÕES
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  email       text not null unique,
  logo_url    text,
  active      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- ORGANIZATION ADMINS
-- ============================================================
create table organization_admins (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'admin',
  active          boolean default true,
  created_at      timestamptz default now(),
  unique(organization_id, user_id)
);

-- ============================================================
-- TENANTS
-- ============================================================
create table tenants (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  slug            text not null unique,
  custom_domain   text unique,
  active          boolean default true,
  contract_start  date,
  contract_end    date,
  allow_self_registration boolean default false,
  completion_threshold    numeric(5,2) default 80.00,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- DESIGN TOKENS
-- ============================================================
create table design_tokens (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  mode        text not null default 'light' check (mode in ('light', 'dark')),
  color_primary_50    text default '#eff6ff',
  color_primary_100   text default '#dbeafe',
  color_primary_200   text default '#bfdbfe',
  color_primary_300   text default '#93c5fd',
  color_primary_400   text default '#60a5fa',
  color_primary_500   text default '#3b82f6',
  color_primary_600   text default '#2563eb',
  color_primary_700   text default '#1d4ed8',
  color_primary_800   text default '#1e40af',
  color_primary_900   text default '#1e3a8a',
  color_secondary_50  text default '#f0fdf4',
  color_secondary_100 text default '#dcfce7',
  color_secondary_200 text default '#bbf7d0',
  color_secondary_300 text default '#86efac',
  color_secondary_400 text default '#4ade80',
  color_secondary_500 text default '#22c55e',
  color_secondary_600 text default '#16a34a',
  color_secondary_700 text default '#15803d',
  color_secondary_800 text default '#166534',
  color_secondary_900 text default '#14532d',
  color_tertiary_50   text default '#fdf4ff',
  color_tertiary_100  text default '#fae8ff',
  color_tertiary_200  text default '#f5d0fe',
  color_tertiary_300  text default '#f0abfc',
  color_tertiary_400  text default '#e879f9',
  color_tertiary_500  text default '#d946ef',
  color_tertiary_600  text default '#c026d3',
  color_tertiary_700  text default '#a21caf',
  color_tertiary_800  text default '#86198f',
  color_tertiary_900  text default '#701a75',
  color_neutral_50    text default '#f9fafb',
  color_neutral_100   text default '#f3f4f6',
  color_neutral_200   text default '#e5e7eb',
  color_neutral_300   text default '#d1d5db',
  color_neutral_400   text default '#9ca3af',
  color_neutral_500   text default '#6b7280',
  color_neutral_600   text default '#4b5563',
  color_neutral_700   text default '#374151',
  color_neutral_800   text default '#1f2937',
  color_neutral_900   text default '#111827',
  color_success       text default '#22c55e',
  color_success_light text default '#dcfce7',
  color_success_dark  text default '#15803d',
  color_warning       text default '#f59e0b',
  color_warning_light text default '#fef3c7',
  color_warning_dark  text default '#b45309',
  color_error         text default '#ef4444',
  color_error_light   text default '#fee2e2',
  color_error_dark    text default '#b91c1c',
  color_info          text default '#3b82f6',
  color_info_light    text default '#dbeafe',
  color_info_dark     text default '#1d4ed8',
  color_bg_page       text default '#ffffff',
  color_bg_surface    text default '#f9fafb',
  color_bg_elevated   text default '#ffffff',
  color_bg_overlay    text default 'rgba(0,0,0,0.5)',
  color_text_primary    text default '#111827',
  color_text_secondary  text default '#6b7280',
  color_text_disabled   text default '#d1d5db',
  color_text_inverse    text default '#ffffff',
  color_text_link       text default '#3b82f6',
  color_text_link_hover text default '#1d4ed8',
  color_border_default  text default '#e5e7eb',
  color_border_strong   text default '#d1d5db',
  color_border_focus    text default '#3b82f6',
  color_header_bg       text default '#ffffff',
  color_header_text     text default '#111827',
  color_sidebar_bg      text default '#1f2937',
  color_sidebar_text    text default '#f9fafb',
  color_sidebar_active  text default '#3b82f6',
  color_footer_bg       text default '#111827',
  color_footer_text     text default '#f9fafb',
  color_btn_primary_bg      text default '#3b82f6',
  color_btn_primary_text    text default '#ffffff',
  color_btn_primary_hover   text default '#2563eb',
  color_btn_secondary_bg    text default '#f3f4f6',
  color_btn_secondary_text  text default '#111827',
  color_btn_secondary_hover text default '#e5e7eb',
  color_btn_danger_bg       text default '#ef4444',
  color_btn_danger_text     text default '#ffffff',
  color_btn_danger_hover    text default '#dc2626',
  color_card_bg             text default '#ffffff',
  color_card_border         text default '#e5e7eb',
  color_card_shadow         text default 'rgba(0,0,0,0.08)',
  color_progress_track      text default '#e5e7eb',
  color_progress_fill       text default '#3b82f6',
  color_badge_default_bg    text default '#f3f4f6',
  color_badge_default_text  text default '#374151',
  color_input_bg            text default '#ffffff',
  color_input_border        text default '#d1d5db',
  color_input_focus_ring    text default '#3b82f6',
  color_input_placeholder   text default '#9ca3af',
  font_family_heading  text default '"Inter", system-ui, sans-serif',
  font_family_body     text default '"Inter", system-ui, sans-serif',
  font_size_xs         text default '0.75rem',
  font_size_sm         text default '0.875rem',
  font_size_base       text default '1rem',
  font_size_lg         text default '1.125rem',
  font_size_xl         text default '1.25rem',
  font_size_2xl        text default '1.5rem',
  font_size_3xl        text default '1.875rem',
  radius_sm    text default '0.25rem',
  radius_md    text default '0.375rem',
  radius_lg    text default '0.5rem',
  radius_xl    text default '0.75rem',
  radius_full  text default '9999px',
  shadow_sm    text default '0 1px 2px rgba(0,0,0,0.05)',
  shadow_md    text default '0 4px 6px rgba(0,0,0,0.07)',
  shadow_lg    text default '0 10px 15px rgba(0,0,0,0.1)',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(tenant_id, mode)
);

-- ============================================================
-- DESIGN ASSETS
-- ============================================================
create table design_assets (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
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
  card_overlay_color     text default 'rgba(0,0,0,0.3)',
  platform_bg_url        text,
  certificate_bg_url     text,
  certificate_logo_url   text,
  certificate_signature_url text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(tenant_id)
);

-- ============================================================
-- DESIGN PRESETS
-- ============================================================
create table design_presets (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  thumbnail_url text,
  tokens_snapshot jsonb not null,
  is_default  boolean default false,
  created_at  timestamptz default now()
);

-- ============================================================
-- USERS (mirror of auth.users)
-- ============================================================
create table users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- PROFILES (per tenant identity)
-- ============================================================
create table profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  full_name   text not null,
  cpf         text,
  phone       text,
  department  text,
  job_title   text,
  avatar_url  text,
  role        text not null default 'student'
              check (role in ('student', 'manager', 'admin_tenant')),
  active      boolean default true,
  last_login_at timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(user_id, tenant_id)
);

-- ============================================================
-- COURSES
-- ============================================================
create table courses (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references organizations(id) on delete cascade,
  title                 text not null,
  slug                  text not null,
  description           text,
  short_description     text,
  thumbnail_transparent_url text,
  thumbnail_url         text,
  instructor_name       text,
  instructor_bio        text,
  instructor_photo_url  text,
  duration_minutes      int,
  level                 text default 'beginner'
                        check (level in ('beginner', 'intermediate', 'advanced')),
  category              text,
  tags                  text[],
  status                text not null default 'draft'
                        check (status in ('draft', 'published', 'archived')),
  active                boolean default true,
  published_at          timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  unique(organization_id, slug)
);

-- ============================================================
-- MODULES
-- ============================================================
create table modules (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses(id) on delete cascade,
  title       text not null,
  slug        text not null,
  description text,
  position    int not null default 0,
  active      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(course_id, slug)
);

-- ============================================================
-- LESSONS
-- ============================================================
create table lessons (
  id                  uuid primary key default gen_random_uuid(),
  module_id           uuid not null references modules(id) on delete cascade,
  title               text not null,
  slug                text not null,
  description         text,
  position            int not null default 0,
  content_type        text not null default 'video'
                      check (content_type in ('video', 'text', 'pdf')),
  panda_video_id      text,
  panda_folder_id     text,
  video_duration_sec  int,
  video_status        text default 'pending'
                      check (video_status in ('pending', 'processing', 'ready', 'error')),
  content_body        text,
  attachment_url      text,
  thumbnail_url       text,
  is_free_preview     boolean default false,
  is_required         boolean default true,
  active              boolean default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  unique(module_id, slug)
);

-- ============================================================
-- TENANT_COURSES
-- ============================================================
create table tenant_courses (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  course_id       uuid not null references courses(id) on delete cascade,
  contracted_at   timestamptz default now(),
  expires_at      timestamptz,
  max_enrollments int,
  active          boolean default true,
  unique(tenant_id, course_id)
);

-- ============================================================
-- ENROLLMENTS
-- ============================================================
create table enrollments (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references profiles(id) on delete cascade,
  tenant_course_id uuid not null references tenant_courses(id) on delete cascade,
  status           text default 'active'
                   check (status in ('active', 'completed', 'cancelled', 'expired')),
  progress         numeric(5,2) default 0,
  enrolled_at      timestamptz default now(),
  completed_at     timestamptz,
  last_accessed_at timestamptz,
  unique(profile_id, tenant_course_id)
);

-- ============================================================
-- LESSON_PROGRESS
-- ============================================================
create table lesson_progress (
  id              uuid primary key default gen_random_uuid(),
  enrollment_id   uuid not null references enrollments(id) on delete cascade,
  lesson_id       uuid not null references lessons(id) on delete cascade,
  watched_seconds int default 0,
  total_seconds   int default 0,
  percentage      numeric(5,2) default 0,
  completed       boolean default false,
  completed_at    timestamptz,
  last_watched_at timestamptz default now(),
  unique(enrollment_id, lesson_id)
);

-- ============================================================
-- CERTIFICATES
-- ============================================================
create table certificates (
  id                uuid primary key default gen_random_uuid(),
  enrollment_id     uuid not null unique references enrollments(id) on delete cascade,
  profile_id        uuid not null references profiles(id),
  course_id         uuid not null references courses(id),
  tenant_id         uuid not null references tenants(id),
  issued_at         timestamptz default now(),
  pdf_url           text,
  verification_code text unique default substr(md5(random()::text), 1, 12),
  student_name      text not null,
  course_title      text not null,
  tenant_name       text not null,
  duration_hours    numeric(6,1)
);

-- ============================================================
-- FAVORITES
-- ============================================================
create table favorites (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  course_id   uuid not null references courses(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(profile_id, course_id)
);

-- ============================================================
-- INVITATIONS
-- ============================================================
create table invitations (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text default 'student'
              check (role in ('student', 'manager', 'admin_tenant')),
  token       text not null unique default gen_random_uuid()::text,
  status      text default 'pending'
              check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  invited_by  uuid references profiles(id),
  accepted_at timestamptz,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz default now(),
  unique(tenant_id, email)
);

-- ============================================================
-- MAGIC LINKS
-- ============================================================
create table magic_links (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  user_id     uuid references users(id) on delete cascade,
  token       text not null unique default gen_random_uuid()::text,
  email       text not null,
  used        boolean default false,
  expires_at  timestamptz not null default (now() + interval '1 hour'),
  created_at  timestamptz default now()
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
create table announcements (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  author_id   uuid not null references profiles(id),
  title       text not null,
  body        text not null,
  priority    text default 'normal'
              check (priority in ('low', 'normal', 'high', 'urgent')),
  pinned      boolean default false,
  published   boolean default true,
  course_id   uuid references courses(id) on delete set null,
  starts_at   timestamptz default now(),
  expires_at  timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- FORUM POSTS
-- ============================================================
create table forum_posts (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  course_id   uuid not null references courses(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  title       text,
  content     text not null,
  pinned      boolean default false,
  approved    boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table forum_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references forum_posts(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  content     text not null,
  approved    boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  type        text not null
              check (type in ('info', 'success', 'warning', 'course', 'certificate', 'announcement', 'community')),
  title       text not null,
  body        text,
  link        text,
  read        boolean default false,
  created_at  timestamptz default now()
);

-- ============================================================
-- GOALS
-- ============================================================
create table goals (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  title       text not null,
  target_date date,
  completed   boolean default false,
  completed_at timestamptz,
  created_at  timestamptz default now()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
create table audit_logs (
  id          bigserial primary key,
  tenant_id   uuid references tenants(id),
  user_id     uuid references auth.users(id),
  action      text not null,
  resource    text,
  resource_id text,
  metadata    jsonb,
  ip_address  text,
  created_at  timestamptz default now()
);

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_organizations_updated before update on organizations for each row execute function update_updated_at();
create trigger trg_tenants_updated before update on tenants for each row execute function update_updated_at();
create trigger trg_design_tokens_updated before update on design_tokens for each row execute function update_updated_at();
create trigger trg_design_assets_updated before update on design_assets for each row execute function update_updated_at();
create trigger trg_users_updated before update on users for each row execute function update_updated_at();
create trigger trg_profiles_updated before update on profiles for each row execute function update_updated_at();
create trigger trg_courses_updated before update on courses for each row execute function update_updated_at();
create trigger trg_modules_updated before update on modules for each row execute function update_updated_at();
create trigger trg_lessons_updated before update on lessons for each row execute function update_updated_at();
create trigger trg_forum_posts_updated before update on forum_posts for each row execute function update_updated_at();
create trigger trg_forum_comments_updated before update on forum_comments for each row execute function update_updated_at();
create trigger trg_announcements_updated before update on announcements for each row execute function update_updated_at();

-- ============================================================
-- TRIGGER: new user → public.users
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- TRIGGER: recalculate enrollment progress
-- ============================================================
create or replace function recalculate_enrollment_progress()
returns trigger as $$
declare
  v_enrollment_id uuid;
  v_total_required int;
  v_completed int;
  v_new_progress numeric(5,2);
begin
  v_enrollment_id := coalesce(new.enrollment_id, old.enrollment_id);

  select count(*) into v_total_required
  from lessons l
  join modules m on m.id = l.module_id
  join courses c on c.id = m.course_id
  join tenant_courses tc on tc.course_id = c.id
  join enrollments e on e.tenant_course_id = tc.id
  where e.id = v_enrollment_id and l.is_required = true and l.active = true;

  select count(*) into v_completed
  from lesson_progress lp
  join lessons l on l.id = lp.lesson_id
  where lp.enrollment_id = v_enrollment_id and lp.completed = true and l.is_required = true;

  if v_total_required > 0 then
    v_new_progress := round((v_completed::numeric / v_total_required::numeric) * 100, 2);
  else
    v_new_progress := 0;
  end if;

  update enrollments
  set progress = v_new_progress,
      last_accessed_at = now(),
      status = case when v_new_progress >= 100 then 'completed' else status end,
      completed_at = case when v_new_progress >= 100 and completed_at is null then now() else completed_at end
  where id = v_enrollment_id;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_recalculate_progress
  after insert or update on lesson_progress
  for each row execute function recalculate_enrollment_progress();

-- ============================================================
-- TRIGGER: auto generate certificate
-- ============================================================
create or replace function auto_generate_certificate()
returns trigger as $$
declare
  v_profile profiles;
  v_course courses;
  v_tenant tenants;
  v_existing_cert uuid;
begin
  if new.status = 'completed' and (old.status is null or old.status != 'completed') then
    select id into v_existing_cert from certificates where enrollment_id = new.id;
    if v_existing_cert is not null then return new; end if;

    select p.* into v_profile from profiles p where p.id = new.profile_id;
    select c.* into v_course from courses c join tenant_courses tc on tc.course_id = c.id where tc.id = new.tenant_course_id;
    select t.* into v_tenant from tenants t join tenant_courses tc on tc.tenant_id = t.id where tc.id = new.tenant_course_id;

    insert into certificates (enrollment_id, profile_id, course_id, tenant_id, student_name, course_title, tenant_name, duration_hours)
    values (new.id, new.profile_id, v_course.id, v_tenant.id, v_profile.full_name, v_course.title, v_tenant.name, round(coalesce(v_course.duration_minutes, 0) / 60.0, 1));

    insert into notifications (profile_id, type, title, body, link)
    values (new.profile_id, 'certificate', 'Certificado disponível!', 'Parabéns! Você concluiu o curso "' || v_course.title || '". Seu certificado está disponível.', '/certificados');
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_auto_certificate
  after update on enrollments
  for each row execute function auto_generate_certificate();

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_tenants_slug on tenants(slug);
create index idx_tenants_custom_domain on tenants(custom_domain) where custom_domain is not null;
create index idx_tenants_org on tenants(organization_id);
create index idx_org_admins_user on organization_admins(user_id);
create index idx_org_admins_org on organization_admins(organization_id);
create index idx_profiles_user_tenant on profiles(user_id, tenant_id);
create index idx_profiles_tenant_role on profiles(tenant_id, role);
create index idx_enrollments_profile on enrollments(profile_id);
create index idx_enrollments_tenant_course on enrollments(tenant_course_id);
create index idx_enrollments_status on enrollments(status);
create index idx_lesson_progress_enrollment on lesson_progress(enrollment_id);
create index idx_lesson_progress_lesson on lesson_progress(lesson_id);
create index idx_notifications_profile on notifications(profile_id, read);
create index idx_design_tokens_tenant_mode on design_tokens(tenant_id, mode);
create index idx_courses_org on courses(organization_id);
create index idx_courses_status on courses(status);
create index idx_courses_title_trgm on courses using gin(title gin_trgm_ops);
create index idx_modules_course_position on modules(course_id, position);
create index idx_lessons_module_position on lessons(module_id, position);
create index idx_tenant_courses_tenant on tenant_courses(tenant_id);
create index idx_tenant_courses_course on tenant_courses(course_id);
create index idx_invitations_tenant_email on invitations(tenant_id, email);
create index idx_invitations_token on invitations(token);
create index idx_invitations_status on invitations(status);
create index idx_forum_posts_course on forum_posts(course_id, created_at desc);
create index idx_forum_comments_post on forum_comments(post_id, created_at asc);
create index idx_announcements_tenant on announcements(tenant_id, published, starts_at desc);
create index idx_magic_links_token on magic_links(token);
create index idx_audit_logs_tenant on audit_logs(tenant_id, created_at desc);
create index idx_certificates_verification on certificates(verification_code);

-- ============================================================
-- RLS
-- ============================================================
alter table organizations       enable row level security;
alter table organization_admins enable row level security;
alter table tenants             enable row level security;
alter table design_tokens       enable row level security;
alter table design_assets       enable row level security;
alter table design_presets      enable row level security;
alter table users               enable row level security;
alter table profiles            enable row level security;
alter table courses             enable row level security;
alter table modules             enable row level security;
alter table lessons             enable row level security;
alter table tenant_courses      enable row level security;
alter table enrollments         enable row level security;
alter table lesson_progress     enable row level security;
alter table certificates        enable row level security;
alter table favorites           enable row level security;
alter table invitations         enable row level security;
alter table magic_links         enable row level security;
alter table announcements       enable row level security;
alter table forum_posts         enable row level security;
alter table forum_comments      enable row level security;
alter table notifications       enable row level security;
alter table goals               enable row level security;

-- ============================================================
-- HELPER FUNCTIONS for RLS
-- ============================================================
create or replace function is_org_admin(org_id uuid)
returns boolean as $$
  select exists (
    select 1 from organization_admins
    where organization_id = org_id and user_id = auth.uid() and active = true
  );
$$ language sql security definer stable;

create or replace function has_tenant_role(t_id uuid, required_role text)
returns boolean as $$
  select exists (
    select 1 from profiles
    where tenant_id = t_id and user_id = auth.uid() and active = true
      and (role = required_role or role = 'admin_tenant')
  );
$$ language sql security definer stable;

create or replace function user_tenant_ids()
returns setof uuid as $$
  select tenant_id from profiles where user_id = auth.uid() and active = true;
$$ language sql security definer stable;

-- ============================================================
-- POLICIES
-- ============================================================
create policy "organizations: public read" on organizations for select using (true);
create policy "organizations: admin manage" on organizations for all using (is_org_admin(id));
create policy "org_admins: org admin manage" on organization_admins for all using (is_org_admin(organization_id));
create policy "org_admins: self read" on organization_admins for select using (user_id = auth.uid());
create policy "tenants: public read active" on tenants for select using (active = true);
create policy "tenants: org admin manage" on tenants for all using (is_org_admin(organization_id));
create policy "tenants: tenant admin read" on tenants for select using (has_tenant_role(id, 'admin_tenant'));
create policy "design_tokens: public read" on design_tokens for select using (true);
create policy "design_tokens: tenant admin write" on design_tokens for insert with check (has_tenant_role(tenant_id, 'admin_tenant'));
create policy "design_tokens: tenant admin update" on design_tokens for update using (has_tenant_role(tenant_id, 'admin_tenant'));
create policy "design_assets: public read" on design_assets for select using (true);
create policy "design_assets: tenant admin write" on design_assets for insert with check (has_tenant_role(tenant_id, 'admin_tenant'));
create policy "design_assets: tenant admin update" on design_assets for update using (has_tenant_role(tenant_id, 'admin_tenant'));
create policy "design_presets: public read" on design_presets for select using (true);
create policy "users: self read" on users for select using (id = auth.uid());
create policy "users: self update" on users for update using (id = auth.uid());
create policy "profiles: owner access" on profiles for select using (user_id = auth.uid());
create policy "profiles: owner update own" on profiles for update using (user_id = auth.uid());
create policy "profiles: tenant admin manage" on profiles for all using (has_tenant_role(tenant_id, 'admin_tenant'));
create policy "profiles: manager read tenant" on profiles for select using (has_tenant_role(tenant_id, 'manager'));
create policy "courses: public read published" on courses for select using (status = 'published' and active = true);
create policy "courses: org admin manage" on courses for all using (is_org_admin(organization_id));
create policy "modules: public read active" on modules for select using (active = true and exists (select 1 from courses c where c.id = modules.course_id and c.status = 'published'));
create policy "modules: org admin manage" on modules for all using (exists (select 1 from courses c where c.id = modules.course_id and is_org_admin(c.organization_id)));
create policy "lessons: read for enrolled or preview" on lessons for select using (active = true and (is_free_preview = true or exists (select 1 from enrollments e join tenant_courses tc on tc.id = e.tenant_course_id join courses c on c.id = tc.course_id join modules m on m.course_id = c.id join profiles p on p.id = e.profile_id where m.id = lessons.module_id and p.user_id = auth.uid() and e.status = 'active')));
create policy "lessons: org admin manage" on lessons for all using (exists (select 1 from modules m join courses c on c.id = m.course_id where m.id = lessons.module_id and is_org_admin(c.organization_id)));
create policy "tenant_courses: tenant members read" on tenant_courses for select using (tenant_id in (select user_tenant_ids()));
create policy "tenant_courses: org admin manage" on tenant_courses for all using (exists (select 1 from tenants t where t.id = tenant_courses.tenant_id and is_org_admin(t.organization_id)));
create policy "tenant_courses: tenant admin read" on tenant_courses for select using (has_tenant_role(tenant_id, 'admin_tenant'));
create policy "enrollments: owner access" on enrollments for select using (profile_id in (select id from profiles where user_id = auth.uid()));
create policy "enrollments: tenant admin manage" on enrollments for all using (exists (select 1 from tenant_courses tc where tc.id = enrollments.tenant_course_id and has_tenant_role(tc.tenant_id, 'admin_tenant')));
create policy "lesson_progress: owner access" on lesson_progress for all using (enrollment_id in (select e.id from enrollments e join profiles p on p.id = e.profile_id where p.user_id = auth.uid()));
create policy "certificates: owner read" on certificates for select using (profile_id in (select id from profiles where user_id = auth.uid()));
create policy "certificates: tenant admin read" on certificates for select using (has_tenant_role(tenant_id, 'admin_tenant'));
create policy "favorites: owner access" on favorites for all using (profile_id in (select id from profiles where user_id = auth.uid()));
create policy "invitations: tenant admin manage" on invitations for all using (has_tenant_role(tenant_id, 'admin_tenant'));
create policy "invitations: invited user read own" on invitations for select using (email = (select email from auth.users where id = auth.uid()));
create policy "magic_links: service role only" on magic_links for all using (false);
create policy "announcements: tenant members read published" on announcements for select using (published = true and tenant_id in (select user_tenant_ids()) and (starts_at is null or starts_at <= now()) and (expires_at is null or expires_at > now()));
create policy "announcements: tenant admin manage" on announcements for all using (has_tenant_role(tenant_id, 'admin_tenant'));
create policy "forum_posts: read approved" on forum_posts for select using (approved = true and tenant_id in (select user_tenant_ids()));
create policy "forum_posts: write own" on forum_posts for insert with check (profile_id in (select id from profiles where user_id = auth.uid()));
create policy "forum_posts: update own" on forum_posts for update using (profile_id in (select id from profiles where user_id = auth.uid()));
create policy "forum_posts: tenant admin moderate" on forum_posts for all using (has_tenant_role(tenant_id, 'admin_tenant'));
create policy "forum_comments: read approved" on forum_comments for select using (approved = true and exists (select 1 from forum_posts fp where fp.id = forum_comments.post_id and fp.tenant_id in (select user_tenant_ids())));
create policy "forum_comments: write own" on forum_comments for insert with check (profile_id in (select id from profiles where user_id = auth.uid()));
create policy "forum_comments: tenant admin moderate" on forum_comments for all using (exists (select 1 from forum_posts fp where fp.id = forum_comments.post_id and has_tenant_role(fp.tenant_id, 'admin_tenant')));
create policy "notifications: owner access" on notifications for all using (profile_id in (select id from profiles where user_id = auth.uid()));
create policy "goals: owner access" on goals for all using (profile_id in (select id from profiles where user_id = auth.uid()));
