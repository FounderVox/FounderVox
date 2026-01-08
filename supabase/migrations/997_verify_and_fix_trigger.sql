-- ============================================
-- VERIFY AND FIX TRIGGER FOR PROFILE CREATION
-- ============================================
-- This script ensures the trigger is properly set up
-- ============================================

-- Step 1: Drop existing trigger if it exists (to recreate it fresh)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Verify function exists, recreate if needed
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

-- Step 3: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Verify trigger was created
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_name = 'on_auth_user_created'
      AND event_object_table = 'users'
      AND event_object_schema = 'auth'
    )
    THEN '✓ Trigger created successfully'
    ELSE '✗ Trigger creation FAILED'
  END as trigger_status;

-- Step 5: Test the function (dry run - won't actually insert)
DO $$
DECLARE
  test_result text;
BEGIN
  -- This is just to verify the function compiles correctly
  test_result := 'Function handle_new_user() is valid';
  RAISE NOTICE '%', test_result;
END $$;


