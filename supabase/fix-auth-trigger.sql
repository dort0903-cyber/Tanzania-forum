-- ============================================================
-- FIX: "Database error saving new user"
-- Paste ALL of this into Supabase SQL Editor and RUN once.
-- ============================================================

-- 1) Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2) Ensure enums exist (ignore if already created)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'fact_checker', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE language_code AS ENUM ('en', 'sw');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Ensure profiles table exists (minimal if schema was partial)
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- 4) Ensure audit_logs exists (trigger may write to it)
CREATE TABLE IF NOT EXISTS public.audit_logs (
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

-- 5) SAFE handle generator (no infinite loop risk)
CREATE OR REPLACE FUNCTION public.generate_handle()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  candidate TEXT;
  n INT := 0;
BEGIN
  LOOP
    n := n + 1;
    candidate := 'user' || floor(random() * 900000 + 100000)::int::text;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE handle = candidate);
    EXIT WHEN n > 20; -- safety
  END LOOP;
  -- final uniqueness fallback
  IF EXISTS (SELECT 1 FROM public.profiles WHERE handle = candidate) THEN
    candidate := 'user' || replace(gen_random_uuid()::text, '-', '');
  END IF;
  RETURN candidate;
END;
$$;

-- 6) SAFE trigger — MUST NOT raise errors that abort auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  new_role user_role;
  new_handle TEXT;
  full_name TEXT;
BEGIN
  BEGIN
    SELECT COUNT(*) INTO user_count FROM public.profiles;

    IF user_count = 0 THEN
      new_role := 'admin';
    ELSE
      new_role := 'member';
    END IF;

    new_handle := public.generate_handle();
    full_name := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, 'user'), '@', 1),
      new_handle
    );

    INSERT INTO public.profiles (
      id,
      handle,
      role,
      google_email,
      display_name,
      status
    )
    VALUES (
      NEW.id,
      new_handle,
      new_role,
      NEW.email,
      full_name,
      'active'
    )
    ON CONFLICT (id) DO NOTHING;

    IF new_role = 'admin' THEN
      BEGIN
        INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (
          NEW.id,
          'bootstrap_admin',
          'profile',
          NEW.id,
          jsonb_build_object('note', 'First user automatically promoted to admin')
        );
      EXCEPTION WHEN OTHERS THEN
        -- never fail signup because of audit log
        NULL;
      END;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    -- CRITICAL: never block user creation in auth.users
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- 7) Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8) RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Done. Try Google sign-in again.
