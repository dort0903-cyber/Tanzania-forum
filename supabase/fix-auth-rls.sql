-- ============================================================
-- FIX: Allow authenticated users to insert their own profile
-- (needed when the auth trigger is delayed or fails)
-- Paste this into Supabase SQL Editor and run it.
-- ============================================================

-- Allow users to create their own profile row
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Ensure the trigger still works (SECURITY DEFINER bypasses RLS)
-- Re-create handle_new_user in case it was missing
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
  )
  ON CONFLICT (id) DO NOTHING;

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

-- Recreate trigger if missing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
