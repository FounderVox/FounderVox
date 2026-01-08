-- ============================================
-- ADD TAGS TO NOTES TABLE
-- ============================================
-- This migration adds a tags column to the notes table
-- ============================================

-- Add tags column (array of text)
ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create index for tags for better search performance
CREATE INDEX IF NOT EXISTS notes_tags_idx ON public.notes USING GIN (tags);

-- Add comment for documentation
COMMENT ON COLUMN public.notes.tags IS 'Array of tags for organizing and filtering notes';
