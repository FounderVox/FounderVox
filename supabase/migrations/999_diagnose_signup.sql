-- ============================================
-- DIAGNOSTIC SCRIPT FOR SIGNUP ISSUES
-- ============================================
-- Run this to check if everything is set up correctly
-- ============================================

-- 1. Check if tables exist
SELECT 
  'Tables Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
    THEN '✓ profiles table exists'
    ELSE '✗ profiles table MISSING'
  END as status
UNION ALL
SELECT 
  'Tables Check',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notes')
    THEN '✓ notes table exists'
    ELSE '✗ notes table MISSING'
  END;

-- 2. Check if RLS is enabled
SELECT 
  'RLS Check' as check_type,
  CASE 
    WHEN rowsecurity = true THEN '✓ RLS enabled on ' || tablename
    ELSE '✗ RLS NOT enabled on ' || tablename
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'notes');

-- 3. Check if function exists
SELECT 
  'Function Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
    )
    THEN '✓ handle_new_user function exists'
    ELSE '✗ handle_new_user function MISSING'
  END as status
UNION ALL
SELECT 
  'Function Check',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'handle_updated_at'
    )
    THEN '✓ handle_updated_at function exists'
    ELSE '✗ handle_updated_at function MISSING'
  END;

-- 4. Check if trigger exists
SELECT 
  'Trigger Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_name = 'on_auth_user_created'
      AND event_object_table = 'users'
      AND event_object_schema = 'auth'
    )
    THEN '✓ on_auth_user_created trigger exists on auth.users'
    ELSE '✗ on_auth_user_created trigger MISSING on auth.users'
  END as status;

-- 5. Check RLS policies
SELECT 
  'Policy Check' as check_type,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✓ ' || COUNT(*) || ' policies exist on profiles'
    ELSE '✗ Only ' || COUNT(*) || ' policies exist on profiles (expected 4)'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
UNION ALL
SELECT 
  'Policy Check',
  CASE 
    WHEN COUNT(*) >= 4 THEN '✓ ' || COUNT(*) || ' policies exist on notes'
    ELSE '✗ Only ' || COUNT(*) || ' policies exist on notes (expected 4)'
  END
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'notes';

-- 6. Check recent users and profiles
SELECT 
  'Data Check' as check_type,
  'Recent users in auth.users: ' || COUNT(*)::text as status
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
  'Data Check',
  'Recent profiles: ' || COUNT(*)::text
FROM public.profiles
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 7. Check for users without profiles (orphaned)
SELECT 
  'Orphan Check' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✗ Found ' || COUNT(*) || ' users without profiles'
    ELSE '✓ All users have profiles'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
AND u.created_at > NOW() - INTERVAL '24 hours';

-- 8. Show recent signups (last hour)
SELECT 
  'Recent Signups' as check_type,
  u.id::text || ' - ' || u.email || ' - Created: ' || u.created_at::text as status
FROM auth.users u
WHERE u.created_at > NOW() - INTERVAL '1 hour'
ORDER BY u.created_at DESC
LIMIT 5;

-- 9. Show recent profiles (last hour)
SELECT 
  'Recent Profiles' as check_type,
  p.id::text || ' - ' || COALESCE(p.email, 'no email') || ' - Created: ' || p.created_at::text as status
FROM public.profiles p
WHERE p.created_at > NOW() - INTERVAL '1 hour'
ORDER BY p.created_at DESC
LIMIT 5;

-- ============================================
-- FIX: Create missing profiles for existing users
-- ============================================
-- Uncomment and run this if you have users without profiles:

/*
INSERT INTO public.profiles (
  id,
  email,
  display_name,
  onboarding_completed,
  onboarding_step,
  recordings_count,
  demo_completed,
  created_at,
  updated_at,
  last_active_at
)
SELECT 
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  false,
  0,
  0,
  false,
  u.created_at,
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
*/



