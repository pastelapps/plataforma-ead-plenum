-- ============================================================
-- Migration 002: Adequação TheMembers
-- Adiciona campos de banners em cursos, campos extras em aulas,
-- tabela de reações (likes/dislikes) em aulas
-- ============================================================

-- ============================================================
-- COURSES: novos campos de banner e configuração
-- ============================================================
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS banner_vertical_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_horizontal_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_square_url TEXT,
  ADD COLUMN IF NOT EXISTS fallback_color TEXT DEFAULT '#1e40af',
  ADD COLUMN IF NOT EXISTS sequential_journey BOOLEAN DEFAULT false;

COMMENT ON COLUMN courses.banner_vertical_url IS 'Banner vertical 2:3 (~340x510px) para cards na homepage';
COMMENT ON COLUMN courses.banner_horizontal_url IS 'Banner horizontal 16:9 (~1920x600px) para fundo da página do curso';
COMMENT ON COLUMN courses.banner_square_url IS 'Banner quadrado 400x400px (opcional)';
COMMENT ON COLUMN courses.fallback_color IS 'Cor HEX de fallback quando não há banner vertical';
COMMENT ON COLUMN courses.sequential_journey IS 'Quando true, aluno deve concluir aulas na ordem';

-- ============================================================
-- LESSONS: novos campos para URL Panda, duração e materiais
-- ============================================================
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS panda_video_url TEXT,
  ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS supplementary_materials JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN lessons.panda_video_url IS 'URL direta do Panda Video (alternativa ao panda_video_id)';
COMMENT ON COLUMN lessons.estimated_duration_minutes IS 'Duração estimada em minutos (entrada manual)';
COMMENT ON COLUMN lessons.supplementary_materials IS 'Array JSON de materiais: [{name, url, type}]';

-- ============================================================
-- LESSON_REACTIONS: likes/dislikes em aulas
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lesson_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_reactions_lesson ON lesson_reactions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_reactions_profile ON lesson_reactions(profile_id);

-- RLS
ALTER TABLE lesson_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read reactions" ON lesson_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own reactions" ON lesson_reactions
  FOR ALL USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- ============================================================
-- FORUM_POSTS: garantir que pode ser usado para dúvidas nas aulas
-- Adicionar lesson_id para vincular dúvidas a aulas específicas
-- ============================================================
ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'question', 'comment'));

CREATE INDEX IF NOT EXISTS idx_forum_posts_lesson ON forum_posts(lesson_id);
