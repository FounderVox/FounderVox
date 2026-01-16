-- Migration: Enable pgvector and add embeddings support for semantic search
-- Run this in Supabase SQL Editor or via migrations

-- Step 1: Enable pgvector extension (requires superuser or database owner)
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Add embedding column to notes table
-- Using 1536 dimensions for OpenAI text-embedding-3-small model
ALTER TABLE notes ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Step 3: Create HNSW index for fast similarity search
-- HNSW provides better query performance than IVFFlat for most use cases
CREATE INDEX IF NOT EXISTS notes_embedding_idx
ON notes USING hnsw (embedding vector_cosine_ops);

-- Step 4: Create similarity search function with user and time filtering
CREATE OR REPLACE FUNCTION match_notes(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.65,
  filter_user_id uuid DEFAULT NULL,
  filter_start_date timestamptz DEFAULT NULL,
  filter_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  content text,
  formatted_content text,
  raw_transcript text,
  created_at timestamptz,
  updated_at timestamptz,
  template_type text,
  template_label text,
  tags text[],
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.user_id,
    n.title,
    n.content,
    n.formatted_content,
    n.raw_transcript,
    n.created_at,
    n.updated_at,
    n.template_type,
    n.template_label,
    n.tags,
    1 - (n.embedding <=> query_embedding) AS similarity
  FROM notes n
  WHERE
    n.embedding IS NOT NULL
    AND (filter_user_id IS NULL OR n.user_id = filter_user_id)
    AND (filter_start_date IS NULL OR n.created_at >= filter_start_date)
    AND (filter_end_date IS NULL OR n.created_at <= filter_end_date)
    AND 1 - (n.embedding <=> query_embedding) > match_threshold
  ORDER BY n.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Step 5: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION match_notes TO authenticated;
GRANT EXECUTE ON FUNCTION match_notes TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION match_notes IS 'Performs semantic similarity search on notes using pgvector. Returns notes ordered by cosine similarity to the query embedding.';
