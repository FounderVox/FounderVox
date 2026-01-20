-- ============================================
-- FIX PROFILE SCHEMA - Ensure all columns exist
-- ============================================
-- Run this if you're getting 400 errors on profile queries
-- This ensures all columns referenced in the app exist

-- Add recordings_count if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'recordings_count'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN recordings_count integer DEFAULT 0;
    RAISE NOTICE 'Added recordings_count column';
  ELSE
    RAISE NOTICE 'recordings_count column already exists';
  END IF;
END $$;

-- Ensure all other columns exist with correct types
DO $$ 
BEGIN
  -- display_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'display_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN display_name text;
  END IF;

  -- avatar_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url text;
  END IF;

  -- email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email text;
  END IF;

  -- onboarding_completed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;

  -- demo_completed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'demo_completed'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN demo_completed boolean DEFAULT false;
  END IF;

  -- use_cases
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'use_cases'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN use_cases text[] DEFAULT '{}';
  END IF;
END $$;

-- Update existing profiles to have default values if null
UPDATE public.profiles 
SET 
  recordings_count = COALESCE(recordings_count, 0),
  onboarding_completed = COALESCE(onboarding_completed, false),
  demo_completed = COALESCE(demo_completed, false),
  use_cases = COALESCE(use_cases, '{}')
WHERE 
  recordings_count IS NULL 
  OR onboarding_completed IS NULL 
  OR demo_completed IS NULL 
  OR use_cases IS NULL;

-- Verify the schema
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;



