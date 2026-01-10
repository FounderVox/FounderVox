-- ============================================
-- COMPREHENSIVE MIGRATION VERIFICATION
-- ============================================
-- Run this in Supabase SQL Editor to check what's missing
-- ============================================

-- 1. Check all required tables exist
SELECT 
  CASE 
    WHEN COUNT(*) = 8 THEN '✅ All tables exist'
    ELSE '❌ Missing tables'
  END as table_status,
  COUNT(*) as tables_found,
  string_agg(table_name, ', ' ORDER BY table_name) as existing_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles', 
  'notes', 
  'recordings', 
  'action_items', 
  'investor_updates', 
  'progress_logs', 
  'product_ideas', 
  'brain_dump'  -- Note: singular, not plural
);

-- 2. Check notes table columns
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notes'
AND column_name IN ('tags', 'smartified_at', 'template_type', 'is_starred', 'user_id')
ORDER BY column_name;

-- 3. Check if smartified_at column exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notes' 
      AND column_name = 'smartified_at'
    ) THEN '✅ smartified_at column exists'
    ELSE '❌ smartified_at column MISSING - Run 005_add_smartified_tracking.sql'
  END as smartified_status;

-- 4. Check if tags column exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notes' 
      AND column_name = 'tags'
    ) THEN '✅ tags column exists'
    ELSE '❌ tags column MISSING - Run 003_add_tags_to_notes.sql'
  END as tags_status;

-- 5. Check if brain_dump table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'brain_dump'
    ) THEN '✅ brain_dump table exists'
    ELSE '❌ brain_dump table MISSING - Check 004_recording_notes.sql was fully run'
  END as brain_dump_status;

-- 6. Check RLS is enabled on all tables
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'profiles', 
  'notes', 
  'recordings', 
  'action_items', 
  'investor_updates', 
  'progress_logs', 
  'product_ideas', 
  'brain_dump'
)
ORDER BY tablename;

-- 7. Check key indexes exist
SELECT 
  indexname,
  tablename,
  '✅ Index exists' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname IN (
  'notes_tags_idx',
  'notes_smartified_at_idx',
  'notes_user_id_idx',
  'notes_starred_idx',
  'recordings_user_id_idx'
)
ORDER BY tablename, indexname;

