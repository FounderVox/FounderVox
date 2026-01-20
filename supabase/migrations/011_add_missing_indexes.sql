-- ============================================
-- MIGRATION 011: Add missing performance indexes
-- ============================================

-- Recording-related indexes
CREATE INDEX IF NOT EXISTS recordings_processing_status_idx ON recordings(processing_status);
CREATE INDEX IF NOT EXISTS recordings_user_created_idx ON recordings(user_id, created_at DESC);

-- Investor updates (was missing recording_id index)
CREATE INDEX IF NOT EXISTS investor_updates_recording_id_idx ON investor_updates(recording_id);

-- Metrics indexes for analytics queries
CREATE INDEX IF NOT EXISTS api_usage_provider_operation_idx ON api_usage(provider, operation_type);
CREATE INDEX IF NOT EXISTS user_events_user_event_idx ON user_events(user_id, event_name);
CREATE INDEX IF NOT EXISTS user_sessions_timezone_idx ON user_sessions(timezone);
CREATE INDEX IF NOT EXISTS user_properties_signup_source_idx ON user_properties(signup_source);

-- Optimize embedding index to exclude NULLs (only if embedding column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notes'
    AND column_name = 'embedding'
  ) THEN
    DROP INDEX IF EXISTS notes_embedding_idx;
    CREATE INDEX notes_embedding_idx ON notes USING hnsw (embedding vector_cosine_ops) WHERE embedding IS NOT NULL;
  END IF;
END $$;
