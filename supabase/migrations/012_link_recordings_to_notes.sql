-- ============================================
-- MIGRATION 012: Add note_id FK to recordings
-- Purpose: Clear relationship between notes and recordings
-- ============================================

-- Add note_id to recordings for direct lookup
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS note_id uuid REFERENCES notes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS recordings_note_id_idx ON recordings(note_id);

-- Comment for documentation
COMMENT ON COLUMN recordings.note_id IS 'Direct reference to the note this recording belongs to';
