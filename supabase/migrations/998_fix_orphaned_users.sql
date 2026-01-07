-- ============================================
-- FIX ORPHANED USERS - Create profiles for users without profiles
-- ============================================
-- This script creates profiles for any users that exist in auth.users
-- but don't have a corresponding profile in public.profiles
-- ============================================

-- Step 1: Create profiles for all orphaned users
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

-- Step 2: Show what was fixed
SELECT 
  'Fixed' as status,
  COUNT(*)::text || ' orphaned user(s) now have profiles' as message
FROM auth.users u
INNER JOIN public.profiles p ON u.id = p.id
WHERE u.created_at > NOW() - INTERVAL '24 hours';

-- Step 3: Verify no more orphans
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ SUCCESS: No orphaned users found'
    ELSE '✗ WARNING: Still ' || COUNT(*) || ' orphaned user(s)'
  END as verification
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Step 4: Show all users and their profile status
SELECT 
  u.id,
  u.email,
  u.created_at as user_created_at,
  CASE 
    WHEN p.id IS NOT NULL THEN '✓ Has profile'
    ELSE '✗ Missing profile'
  END as profile_status,
  p.display_name,
  p.onboarding_completed
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

