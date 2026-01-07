-- ============================================
-- CLEANUP AND FIX ALL SIGNUP ISSUES
-- ============================================
-- Run this script to:
-- 1. Fix orphaned users (create missing profiles)
-- 2. Verify and fix the trigger
-- 3. Ensure everything is working correctly
-- ============================================

-- ============================================
-- PART 1: FIX ORPHANED USERS
-- ============================================

-- Create profiles for any users without profiles
INSERT INTO public.profiles (
  id,
  email,
  display_name,
  avatar_url,
  onboarding_completed,
  onboarding_step,
  recordings_count,
  demo_completed,
  use_cases,
  subscription_tier,
  created_at,
  updated_at,
  last_active_at,
  first_login_at
)
SELECT 
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ) as display_name,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  false as onboarding_completed,
  0 as onboarding_step,
  0 as recordings_count,
  false as demo_completed,
  '{}'::text[] as use_cases,
  'free' as subscription_tier,
  COALESCE(u.created_at, NOW()) as created_at,
  NOW() as updated_at,
  COALESCE(u.last_sign_in_at, NOW()) as last_active_at,
  u.created_at as first_login_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PART 2: FIX THE TRIGGER
-- ============================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with all columns
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
    demo_completed,
    use_cases,
    subscription_tier,
    created_at,
    updated_at,
    last_active_at,
    first_login_at
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
    false,
    '{}'::text[],
    'free',
    COALESCE(NEW.created_at, NOW()),
    NOW(),
    COALESCE(NEW.last_sign_in_at, NOW()),
    NEW.created_at
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PART 3: VERIFICATION
-- ============================================

-- Check for orphaned users
DO $$
DECLARE
  orphan_count integer;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE p.id IS NULL;
  
  IF orphan_count = 0 THEN
    RAISE NOTICE '✓ SUCCESS: No orphaned users found';
  ELSE
    RAISE WARNING '✗ WARNING: Still % orphaned user(s) found', orphan_count;
  END IF;
END $$;

-- Verify trigger exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_created'
    AND event_object_table = 'users'
    AND event_object_schema = 'auth'
  ) THEN
    RAISE NOTICE '✓ Trigger on_auth_user_created is active';
  ELSE
    RAISE EXCEPTION '✗ Trigger on_auth_user_created is MISSING';
  END IF;
END $$;

-- Verify function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
  ) THEN
    RAISE NOTICE '✓ Function handle_new_user() exists';
  ELSE
    RAISE EXCEPTION '✗ Function handle_new_user() is MISSING';
  END IF;
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'CLEANUP COMPLETE!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '1. Fixed orphaned users (created missing profiles)';
  RAISE NOTICE '2. Verified and fixed trigger';
  RAISE NOTICE '3. All users should now have profiles';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '- Try signing up a new user';
  RAISE NOTICE '- Check that profile is created automatically';
  RAISE NOTICE '- Check browser console for detailed logs';
  RAISE NOTICE '============================================';
END $$;

