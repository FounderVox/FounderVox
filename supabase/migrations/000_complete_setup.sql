-- ============================================
-- FOUNDERVOX COMPLETE DATABASE SETUP
-- ============================================
-- This script completely cleans up and recreates the entire database schema
-- Run this ENTIRE script in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- Paste this entire file and click "Run"
-- ============================================

-- ============================================
-- PART 1: CLEANUP - Remove everything that exists
-- ============================================

-- Drop all triggers first (they depend on functions)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS handle_notes_updated_at ON public.notes;
DROP TRIGGER IF EXISTS update_recordings_count_on_note_change ON public.notes;

-- Drop all policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_note_last_accessed() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_recordings_count() CASCADE;

-- Drop all indexes
DROP INDEX IF EXISTS public.profiles_email_idx;
DROP INDEX IF EXISTS public.profiles_onboarding_idx;
DROP INDEX IF EXISTS public.profiles_created_at_idx;
DROP INDEX IF EXISTS public.notes_user_id_idx;
DROP INDEX IF EXISTS public.notes_starred_idx;
DROP INDEX IF EXISTS public.notes_created_at_idx;
DROP INDEX IF EXISTS public.notes_template_idx;
DROP INDEX IF EXISTS public.notes_last_accessed_idx;

-- Drop tables (notes first due to foreign key, then profiles)
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================
-- PART 2: CREATE PROFILES TABLE
-- ============================================

CREATE TABLE public.profiles (
  -- Primary key matches auth.users.id
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,

  -- User display information
  display_name text,
  avatar_url text,
  email text,

  -- Onboarding data
  use_cases text[] DEFAULT '{}',
  onboarding_completed boolean DEFAULT false,
  onboarding_step integer DEFAULT 0,

  -- Subscription/usage tracking
  subscription_tier text DEFAULT 'free',
  recordings_count integer DEFAULT 0,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now(),
  first_login_at timestamptz DEFAULT null,
  demo_completed boolean DEFAULT false
);

-- Add comment for documentation
COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users with onboarding and usage data';

-- ============================================
-- PART 3: CREATE NOTES TABLE
-- ============================================

CREATE TABLE public.notes (
  -- Primary key
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User reference
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,

  -- Note content
  title text NOT NULL,
  content text,
  formatted_content text,
  raw_transcript text,

  -- Template/type information
  template_type text DEFAULT 'none',
  template_label text,

  -- Metadata
  duration_seconds integer DEFAULT 0,
  audio_url text,
  is_starred boolean DEFAULT false,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_accessed_at timestamptz DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE public.notes IS 'Voice notes and recordings for users';

-- ============================================
-- PART 4: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 5: CREATE FUNCTIONS
-- ============================================

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    display_name,
    avatar_url,
    email,
    onboarding_completed,
    onboarding_step,
    recordings_count,
    demo_completed
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    false,
    0,
    0,
    false
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Function to update recordings count when notes are added/deleted
CREATE OR REPLACE FUNCTION public.update_user_recordings_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET recordings_count = recordings_count + 1
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET recordings_count = GREATEST(recordings_count - 1, 0)
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Function to update last_accessed_at (for future use in application code)
CREATE OR REPLACE FUNCTION public.update_note_last_accessed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_accessed_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- PART 6: CREATE TRIGGERS
-- ============================================

-- Trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at on profiles
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to update updated_at on notes
CREATE TRIGGER handle_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to update recordings count when notes change
CREATE TRIGGER update_recordings_count_on_note_change
  AFTER INSERT OR DELETE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_recordings_count();

-- ============================================
-- PART 7: CREATE RLS POLICIES
-- ============================================

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- Notes policies
CREATE POLICY "Users can view own notes"
  ON public.notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON public.notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PART 8: CREATE INDEXES
-- ============================================

-- Profiles indexes
CREATE INDEX profiles_email_idx ON public.profiles (email);
CREATE INDEX profiles_onboarding_idx ON public.profiles (onboarding_completed);
CREATE INDEX profiles_created_at_idx ON public.profiles (created_at DESC);

-- Notes indexes
CREATE INDEX notes_user_id_idx ON public.notes (user_id);
CREATE INDEX notes_starred_idx ON public.notes (user_id, is_starred) WHERE is_starred = true;
CREATE INDEX notes_created_at_idx ON public.notes (user_id, created_at DESC);
CREATE INDEX notes_template_idx ON public.notes (user_id, template_type);
CREATE INDEX notes_last_accessed_idx ON public.notes (user_id, last_accessed_at DESC);

-- ============================================
-- PART 9: VERIFICATION
-- ============================================

-- Verify tables exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE EXCEPTION 'profiles table was not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notes'
  ) THEN
    RAISE EXCEPTION 'notes table was not created';
  END IF;

  RAISE NOTICE 'All tables created successfully';
END $$;

-- Verify RLS is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on profiles table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'notes' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on notes table';
  END IF;

  RAISE NOTICE 'RLS enabled on all tables';
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'FOUNDERVOX DATABASE SETUP COMPLETE!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables created: profiles, notes';
  RAISE NOTICE 'Functions created: handle_new_user, handle_updated_at, update_user_recordings_count, update_note_last_accessed';
  RAISE NOTICE 'Triggers created: on_auth_user_created, handle_profiles_updated_at, handle_notes_updated_at, update_recordings_count_on_note_change';
  RAISE NOTICE 'RLS policies: 8 policies created (4 for profiles, 4 for notes)';
  RAISE NOTICE 'Indexes: 8 indexes created';
  RAISE NOTICE '============================================';
END $$;

