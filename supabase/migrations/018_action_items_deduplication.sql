-- ============================================
-- MIGRATION 018: Action Items Deduplication
-- Purpose: Prevent duplicate action items from smartify
-- ============================================

-- Add unique constraint to prevent exact duplicates
-- Using NULLS NOT DISTINCT to treat NULL recording_id values as equal
-- This prevents the same task from being created multiple times for the same user
ALTER TABLE action_items
ADD CONSTRAINT unique_action_item_task
UNIQUE NULLS NOT DISTINCT (user_id, recording_id, task);

-- Add index on note_id for recordings to speed up lookups
CREATE INDEX IF NOT EXISTS idx_recordings_note_id ON recordings(note_id);

-- Comment for documentation
COMMENT ON CONSTRAINT unique_action_item_task ON action_items IS 'Prevents duplicate tasks for the same user and recording';
