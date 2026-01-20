-- ============================================
-- MIGRATION 016: Storage Bucket RLS Policies
-- ============================================
-- Ensures audio-recordings bucket has proper RLS policies

-- Ensure audio-recordings bucket exists with proper settings
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to recreate cleanly)
DROP POLICY IF EXISTS "Users can upload own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own audio" ON storage.objects;

-- Users can upload to their own folder
CREATE POLICY "Users can upload own audio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-recordings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can read their own audio
CREATE POLICY "Users can read own audio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audio-recordings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own audio
CREATE POLICY "Users can delete own audio"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'audio-recordings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Storage bucket policies created for audio-recordings';
END $$;
