-- ============================================
-- MIGRATION 009: Remove unused tables
-- Purpose: Clean up product_ideas and progress_logs
-- ============================================

-- Drop RLS policies first
DROP POLICY IF EXISTS "Users can view their product ideas" ON product_ideas;
DROP POLICY IF EXISTS "Users can insert their product ideas" ON product_ideas;
DROP POLICY IF EXISTS "Users can update their product ideas" ON product_ideas;
DROP POLICY IF EXISTS "Users can delete their product ideas" ON product_ideas;

DROP POLICY IF EXISTS "Users can view their progress logs" ON progress_logs;
DROP POLICY IF EXISTS "Users can insert their progress logs" ON progress_logs;
DROP POLICY IF EXISTS "Users can update their progress logs" ON progress_logs;
DROP POLICY IF EXISTS "Users can delete their progress logs" ON progress_logs;

-- Drop indexes
DROP INDEX IF EXISTS product_ideas_status_idx;
DROP INDEX IF EXISTS product_ideas_recording_id_idx;
DROP INDEX IF EXISTS progress_logs_week_of_idx;
DROP INDEX IF EXISTS progress_logs_recording_id_idx;

-- Drop tables
DROP TABLE IF EXISTS product_ideas CASCADE;
DROP TABLE IF EXISTS progress_logs CASCADE;
