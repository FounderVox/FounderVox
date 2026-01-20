-- ============================================
-- MIGRATION 014: Add data integrity constraints
-- ============================================

-- Ensure updated_at >= created_at (use DO block for conditional constraint creation)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notes_timestamp_order') THEN
    ALTER TABLE notes ADD CONSTRAINT notes_timestamp_order CHECK (updated_at >= created_at);
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add notes_timestamp_order constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recordings_timestamp_order') THEN
    ALTER TABLE recordings ADD CONSTRAINT recordings_timestamp_order CHECK (updated_at >= created_at);
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add recordings_timestamp_order constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_timestamp_order') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_timestamp_order CHECK (updated_at >= created_at);
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add profiles_timestamp_order constraint: %', SQLERRM;
END $$;

-- Ensure session end is after start
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_time_order') THEN
    ALTER TABLE user_sessions ADD CONSTRAINT sessions_time_order CHECK (ended_at IS NULL OR ended_at >= started_at);
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add sessions_time_order constraint: %', SQLERRM;
END $$;

-- Ensure deadline is reasonable (not in distant past)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'action_items_deadline_reasonable') THEN
    ALTER TABLE action_items ADD CONSTRAINT action_items_deadline_reasonable CHECK (deadline IS NULL OR deadline >= created_at - INTERVAL '1 year');
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add action_items_deadline_reasonable constraint: %', SQLERRM;
END $$;
