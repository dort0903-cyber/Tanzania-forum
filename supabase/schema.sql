-- ============================================================
-- Tanzania Forums - Full PostgreSQL Schema for Supabase
-- Paste this entire file into the Supabase SQL Editor and run it.
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'fact_checker', 'member');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE content_status AS ENUM ('published', 'hidden', 'deleted', 'pending');
CREATE TYPE report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');
CREATE TYPE verdict_type AS ENUM ('true', 'false', 'misleading', 'unverified', 'satire');
CREATE TYPE language_code AS ENUM ('en', 'sw');
CREATE TYPE reaction_type AS ENUM ('like', 'insightful', 'disagree', 'funny');

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'member',
  status user_status NOT NULL DEFAULT 'active',
  reputation INTEGER NOT NULL DEFAULT 0,
  language_pref language_code NOT NULL DEFAULT 'en',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  google_email TEXT,
  notification_email BOOLEAN DEFAULT TRUE,
  notification_whatsapp BOOLEAN DEFAULT FALSE,
  notification_sms BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_handle ON public.profiles(handle);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_reputation ON public.profiles(reputation DESC);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_sw TEXT NOT NULL,
  description_en TEXT,
  description_sw TEXT,
  icon TEXT,
  color TEXT DEFAULT '#0D9488',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  rules_en TEXT,
  rules_sw TEXT,
  ai_sensitivity NUMERIC(3,2) DEFAULT 0.70,
  thread_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_sort ON public.categories(sort_order);

-- ============================================================
-- THREADS
-- ============================================================
CREATE TABLE public.threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  language language_code NOT NULL DEFAULT 'en',
  status content_status NOT NULL DEFAULT 'published',
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  view_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  reaction_count INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ai_summary TEXT,
  ai_summary_generated_at TIMESTAMPTZ,
  has_verified_sources BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

CREATE INDEX idx_threads_category ON public.threads(category_id);
CREATE INDEX idx_threads_author ON public.threads(author_id);
CREATE INDEX idx_threads_status ON public.threads(status);
CREATE INDEX idx_threads_last_activity ON public.threads(last_activity_at DESC);
CREATE INDEX idx_threads_language ON public.threads(language);
CREATE INDEX idx_threads_slug ON public.threads(slug);

-- ============================================================
-- POSTS (replies)
-- ============================================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  language language_code NOT NULL DEFAULT 'en',
  status content_status NOT NULL DEFAULT 'published',
  is_ai_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  ai_flag_reason TEXT,
  ai_confidence NUMERIC(4,3),
  reaction_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_thread ON public.posts(thread_id);
CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_posts_parent ON public.posts(parent_id);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_ai_flagged ON public.posts(is_ai_flagged) WHERE is_ai_flagged = TRUE;

-- ============================================================
-- REACTIONS
-- ============================================================
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE,
  type reaction_type NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reaction_target CHECK (
    (post_id IS NOT NULL AND thread_id IS NULL) OR
    (post_id IS NULL AND thread_id IS NOT NULL)
  ),
  UNIQUE(user_id, post_id, type),
  UNIQUE(user_id, thread_id, type)
);

CREATE INDEX idx_reactions_post ON public.reactions(post_id);
CREATE INDEX idx_reactions_thread ON public.reactions(thread_id);
CREATE INDEX idx_reactions_user ON public.reactions(user_id);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status report_status NOT NULL DEFAULT 'open',
  priority INTEGER NOT NULL DEFAULT 0,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT report_target CHECK (
    (post_id IS NOT NULL AND thread_id IS NULL) OR
    (post_id IS NULL AND thread_id IS NOT NULL)
  )
);

CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_priority ON public.reports(priority DESC);

-- ============================================================
-- FOLLOWS
-- ============================================================
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT follow_target CHECK (
    (following_user_id IS NOT NULL AND following_category_id IS NULL) OR
    (following_user_id IS NULL AND following_category_id IS NOT NULL)
  ),
  UNIQUE(follower_id, following_user_id),
  UNIQUE(follower_id, following_category_id)
);

-- ============================================================
-- BOOKMARKS
-- ============================================================
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, thread_id)
);

-- ============================================================
-- JAMIICHECK (Fact Checks)
-- ============================================================
CREATE TABLE public.fact_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim TEXT NOT NULL,
  verdict verdict_type NOT NULL,
  explanation_en TEXT NOT NULL,
  explanation_sw TEXT,
  sources JSONB DEFAULT '[]'::jsonb,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  linked_thread_ids UUID[] DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fact_checks_published ON public.fact_checks(is_published, published_at DESC);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_hash TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ============================================================
-- SITE SETTINGS
-- ============================================================
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_en TEXT NOT NULL,
  title_sw TEXT,
  body_en TEXT NOT NULL,
  body_sw TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER threads_updated_at BEFORE UPDATE ON public.threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER fact_checks_updated_at BEFORE UPDATE ON public.fact_checks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION generate_handle()
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY['Swift', 'Bright', 'Calm', 'Bold', 'Keen', 'Wise', 'Free', 'True', 'Noble', 'Clear'];
  nouns TEXT[] := ARRAY['Lion', 'Eagle', 'River', 'Mountain', 'Horizon', 'Baobab', 'Kilimanjaro', 'Serengeti', 'Zanzibar', 'Dar'];
  new_handle TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    new_handle := adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
                  || nouns[1 + floor(random() * array_length(nouns, 1))::int]
                  || floor(random() * 9000 + 1000)::text;
    SELECT COUNT(*) INTO exists_count FROM public.profiles WHERE handle = new_handle;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN new_handle;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  new_role user_role;
  new_handle TEXT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  IF user_count = 0 THEN
    new_role := 'admin';
  ELSE
    new_role := 'member';
  END IF;

  new_handle := generate_handle();

  INSERT INTO public.profiles (id, handle, role, google_email, display_name)
  VALUES (
    NEW.id,
    new_handle,
    new_role,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', new_handle)
  );

  IF new_role = 'admin' THEN
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
      NEW.id,
      'bootstrap_admin',
      'profile',
      NEW.id,
      jsonb_build_object('note', 'First user automatically promoted to admin')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION update_thread_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.threads
    SET reply_count = reply_count + 1,
        last_activity_at = NOW()
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.threads
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.thread_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_update_thread_stats
  AFTER INSERT OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_thread_stats();

CREATE OR REPLACE FUNCTION update_category_thread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.categories SET thread_count = thread_count + 1 WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.categories SET thread_count = GREATEST(thread_count - 1, 0) WHERE id = OLD.category_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER threads_update_category_count
  AFTER INSERT OR DELETE ON public.threads
  FOR EACH ROW EXECUTE FUNCTION update_category_thread_count();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Published threads are viewable by everyone"
  ON public.threads FOR SELECT
  USING (status = 'published' OR author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

CREATE POLICY "Authenticated users can create threads"
  ON public.threads FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors and mods can update threads"
  ON public.threads FOR UPDATE
  USING (
    author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "Published posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (status = 'published' OR author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors and mods can update posts"
  ON public.posts FOR UPDATE
  USING (
    author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "Reactions are viewable by everyone"
  ON public.reactions FOR SELECT USING (true);

CREATE POLICY "Users can manage own reactions"
  ON public.reactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports; mods view all"
  ON public.reports FOR SELECT
  USING (
    reporter_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "Users manage own follows"
  ON public.follows FOR ALL
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users manage own bookmarks"
  ON public.bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Published fact checks are public"
  ON public.fact_checks FOR SELECT
  USING (is_published = true OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'fact_checker')));

CREATE POLICY "Fact checkers and admins manage fact checks"
  ON public.fact_checks FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'fact_checker'))
  );

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Settings are readable by everyone"
  ON public.site_settings FOR SELECT USING (true);

CREATE POLICY "Admins manage settings"
  ON public.site_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Active announcements are public"
  ON public.announcements FOR SELECT
  USING (is_active = true AND (ends_at IS NULL OR ends_at > NOW()));

CREATE POLICY "Admins manage announcements"
  ON public.announcements FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO public.categories (slug, name_en, name_sw, description_en, description_sw, icon, color, sort_order) VALUES
  ('siasa', 'Politics', 'Siasa', 'Discussions about Tanzanian and African politics, governance, and policy.', 'Majadiliano kuhusu siasa za Tanzania na Afrika, utawala, na sera.', 'Landmark', '#0F766E', 1),
  ('uhusiano-mapenzi', 'Relationships & Love', 'Uhusiano & Mapenzi', 'Advice, stories, and discussions about relationships, dating, and family.', 'Ushauri, hadithi, na majadiliano kuhusu uhusiano, uchumba, na familia.', 'Heart', '#BE123C', 2),
  ('uchumi-biashara', 'Economy & Business', 'Uchumi na Biashara', 'Business ideas, economic trends, entrepreneurship, and finance in Tanzania.', 'Mawazo ya biashara, mwenendo wa kiuchumi, ujasiriamali, na fedha nchini Tanzania.', 'TrendingUp', '#B45309', 3),
  ('tech-gadgets', 'Tech & Gadgets', 'Teknolojia & Vifaa', 'Technology news, gadgets, software, AI, and digital life.', 'Habari za teknolojia, vifaa, programu, AI, na maisha ya kidijitali.', 'Cpu', '#1D4ED8', 4),
  ('jamiicheck', 'JamiiCheck', 'JamiiCheck', 'Fact-checking claims circulating in Tanzania. Truth over rumors.', 'Ukaguzi wa ukweli wa madai yanayozunguka Tanzania. Ukweli juu ya uvumi.', 'ShieldCheck', '#15803D', 5),
  ('jamii', 'Community', 'Jamii', 'General community discussions, culture, events, and everyday life.', 'Majadiliano ya jumuiya, utamaduni, matukio, na maisha ya kila siku.', 'Users', '#7C3AED', 6);

INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', '"Tanzania Forums"'),
  ('tagline', '"Tanzania''s open forum for ideas, truth, and community."'),
  ('default_language', '"en"'),
  ('ai_moderation_enabled', 'true'),
  ('auto_summary_threshold', '20'),
  ('groq_model', '"openai/gpt-oss-120b"');

-- ============================================================
-- AFTER RUNNING:
-- 1. Authentication > Providers > Enable Google (credentials already connected)
-- 2. Set Site URL + Redirect URLs in Supabase Auth settings
-- ============================================================
