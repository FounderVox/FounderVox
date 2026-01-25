-- ============================================
-- MIGRATION 019: Fix match_notes function conflicts
-- Drops all existing versions and creates the correct one
-- ============================================

-- Drop the old function signature from migration 006
DROP FUNCTION IF EXISTS match_notes(vector(1536), int, float, uuid, timestamptz, timestamptz);

-- Drop the function signature from migration 013 (in case it exists with different params)
DROP FUNCTION IF EXISTS match_notes(vector(1536), float, int, uuid, boolean, text, text[], timestamptz, timestamptz);

-- Create the correct match_notes function
CREATE OR REPLACE FUNCTION match_notes(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_user_id uuid DEFAULT NULL,
  filter_starred boolean DEFAULT NULL,
  filter_template text DEFAULT NULL,
  filter_tags text[] DEFAULT NULL,
  filter_date_from timestamptz DEFAULT NULL,
  filter_date_to timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  content text,
  formatted_content text,
  raw_transcript text,
  template_type text,
  template_label text,
  is_starred boolean,
  tags text[],
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY: Enforce that filter_user_id matches authenticated user
  IF filter_user_id IS NULL THEN
    filter_user_id := auth.uid();
  ELSIF filter_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Cannot query other users notes';
  END IF;

  RETURN QUERY
  SELECT
    n.id,
    n.user_id,
    n.title,
    n.content,
    n.formatted_content,
    n.raw_transcript,
    n.template_type,
    n.template_label,
    n.is_starred,
    n.tags,
    n.created_at,
    n.updated_at,
    1 - (n.embedding <=> query_embedding) AS similarity
  FROM notes n
  WHERE
    n.embedding IS NOT NULL
    AND n.user_id = filter_user_id
    AND 1 - (n.embedding <=> query_embedding) > match_threshold
    AND (filter_starred IS NULL OR n.is_starred = filter_starred)
    AND (filter_template IS NULL OR n.template_type = filter_template)
    AND (filter_tags IS NULL OR n.tags && filter_tags)
    AND (filter_date_from IS NULL OR n.created_at >= filter_date_from)
    AND (filter_date_to IS NULL OR n.created_at <= filter_date_to)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION match_notes TO authenticated;
GRANT EXECUTE ON FUNCTION match_notes TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION match_notes IS 'Performs semantic similarity search on notes using pgvector. Secured to only allow querying own notes.';
