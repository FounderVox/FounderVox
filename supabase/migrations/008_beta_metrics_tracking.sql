-- ============================================
-- FOUNDERVOX BETA METRICS TRACKING SYSTEM
-- ============================================
-- Comprehensive metrics for beta launch econometrics and pricing analysis
--
-- Design decisions:
-- - Consent: Default ON for beta users (opt-out model)
-- - Location: Timezone only (no IP-based geolocation)
-- - Dashboard: Direct SQL queries in Supabase (no admin UI)
-- ============================================

-- ============================================
-- PART 1: USER EVENTS TABLE
-- ============================================
-- Core event tracking table - captures all user interactions

CREATE TABLE IF NOT EXISTS public.user_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User identification
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  anonymous_id text, -- For pre-auth tracking (device fingerprint)
  session_id uuid,

  -- Event details
  event_name text NOT NULL,
  event_category text NOT NULL, -- 'acquisition', 'activation', 'engagement', 'retention', 'feature', 'error'
  event_properties jsonb DEFAULT '{}', -- Flexible properties for each event type

  -- Context
  platform text NOT NULL DEFAULT 'web', -- 'web', 'ios', 'android'
  app_version text,
  page_path text,
  referrer text,

  -- Location (timezone only - no IP geolocation per design decision)
  timezone text,

  -- Device info (non-PII)
  device_type text, -- 'desktop', 'tablet', 'mobile'
  browser text,
  os text,
  screen_width integer,
  screen_height integer,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  client_timestamp timestamptz -- When the event occurred on client
);

-- Add comment for documentation
COMMENT ON TABLE public.user_events IS 'Core event tracking for beta metrics and pricing analysis';

-- ============================================
-- PART 2: USER SESSIONS TABLE
-- ============================================
-- Track user sessions for engagement metrics

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User identification
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  anonymous_id text,

  -- Session details
  platform text NOT NULL DEFAULT 'web',
  app_version text,

  -- Entry point
  entry_page text,
  entry_referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,

  -- Location
  timezone text,

  -- Device info
  device_type text,
  browser text,
  os text,

  -- Session metrics
  started_at timestamptz DEFAULT now() NOT NULL,
  ended_at timestamptz,
  last_activity_at timestamptz DEFAULT now(),
  page_views integer DEFAULT 0,
  events_count integer DEFAULT 0,

  -- Engagement flags (set during session)
  had_recording boolean DEFAULT false,
  had_smartify boolean DEFAULT false,
  had_ask_query boolean DEFAULT false
);

COMMENT ON TABLE public.user_sessions IS 'Session tracking for engagement and retention analysis';

-- ============================================
-- PART 3: USER PROPERTIES TABLE
-- ============================================
-- User-level properties for segmentation and cohort analysis

CREATE TABLE IF NOT EXISTS public.user_properties (
  user_id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,

  -- Acquisition
  signup_platform text, -- 'web', 'ios'
  signup_source text, -- Where they came from
  signup_utm_source text,
  signup_utm_medium text,
  signup_utm_campaign text,

  -- Activation milestones
  first_recording_at timestamptz,
  first_smartify_at timestamptz,
  first_ask_query_at timestamptz,
  first_action_item_completed_at timestamptz,

  -- Usage counters (denormalized for fast queries)
  total_recordings integer DEFAULT 0,
  total_notes integer DEFAULT 0,
  total_smartify_runs integer DEFAULT 0,
  total_ask_queries integer DEFAULT 0,
  total_action_items_created integer DEFAULT 0,
  total_action_items_completed integer DEFAULT 0,
  total_brain_dump_items integer DEFAULT 0,
  total_investor_updates_sent integer DEFAULT 0,

  -- Engagement metrics
  total_sessions integer DEFAULT 0,
  total_recording_minutes numeric(10,2) DEFAULT 0,
  last_recording_at timestamptz,
  last_smartify_at timestamptz,
  last_active_at timestamptz,

  -- Consent (opt-out model - default true for beta)
  metrics_consent boolean DEFAULT true,
  consent_updated_at timestamptz DEFAULT now(),

  -- Pricing-relevant metrics
  current_month_recordings integer DEFAULT 0,
  current_month_recording_minutes numeric(10,2) DEFAULT 0,
  current_month_smartify_runs integer DEFAULT 0,
  current_month_ask_queries integer DEFAULT 0,
  current_month_storage_mb numeric(10,2) DEFAULT 0,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.user_properties IS 'User-level metrics for segmentation, cohorts, and pricing analysis';

-- ============================================
-- PART 4: API USAGE TABLE
-- ============================================
-- Track API/AI usage for cost analysis and pricing

CREATE TABLE IF NOT EXISTS public.api_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,

  -- Operation details
  operation_type text NOT NULL, -- 'transcription', 'extraction', 'embedding', 'ask_query', 'title_generation'
  provider text NOT NULL, -- 'deepgram', 'openai'
  model text, -- e.g., 'gpt-4o', 'whisper', 'text-embedding-3-small'

  -- Usage metrics
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  audio_seconds numeric(10,2) DEFAULT 0, -- For transcription

  -- Cost tracking (in USD cents for precision)
  estimated_cost_cents integer DEFAULT 0,

  -- Reference to source
  source_type text, -- 'recording', 'note', 'query'
  source_id uuid,

  -- Status
  status text DEFAULT 'success', -- 'success', 'error', 'timeout'
  error_message text,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  duration_ms integer -- API response time
);

COMMENT ON TABLE public.api_usage IS 'API and AI usage tracking for cost analysis and pricing decisions';

-- ============================================
-- PART 5: FEATURE FLAGS TABLE
-- ============================================
-- Track feature adoption and A/B testing

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Flag details
  flag_name text UNIQUE NOT NULL,
  description text,

  -- Rollout settings
  enabled boolean DEFAULT false,
  rollout_percentage integer DEFAULT 0, -- 0-100

  -- Targeting
  target_platforms text[] DEFAULT '{}', -- Empty means all platforms
  target_user_ids uuid[] DEFAULT '{}', -- Specific users (for beta testing)

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.feature_flags IS 'Feature flags for rollout and A/B testing';

-- ============================================
-- PART 6: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 7: CREATE RLS POLICIES
-- ============================================

-- User events - users can only view their own events
CREATE POLICY "Users can view own events"
  ON public.user_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON public.user_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- User sessions - users can only view their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own sessions"
  ON public.user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- User properties - users can view and update their own properties
CREATE POLICY "Users can view own properties"
  ON public.user_properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
  ON public.user_properties FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties"
  ON public.user_properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- API usage - users can view their own usage
CREATE POLICY "Users can view own api usage"
  ON public.api_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api usage"
  ON public.api_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Feature flags - read-only for all authenticated users
CREATE POLICY "Authenticated users can view feature flags"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- PART 8: CREATE INDEXES
-- ============================================

-- User events indexes
CREATE INDEX IF NOT EXISTS user_events_user_id_idx ON public.user_events (user_id);
CREATE INDEX IF NOT EXISTS user_events_session_id_idx ON public.user_events (session_id);
CREATE INDEX IF NOT EXISTS user_events_event_name_idx ON public.user_events (event_name);
CREATE INDEX IF NOT EXISTS user_events_category_idx ON public.user_events (event_category);
CREATE INDEX IF NOT EXISTS user_events_platform_idx ON public.user_events (platform);
CREATE INDEX IF NOT EXISTS user_events_created_at_idx ON public.user_events (created_at DESC);
CREATE INDEX IF NOT EXISTS user_events_user_time_idx ON public.user_events (user_id, created_at DESC);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON public.user_sessions (user_id);
CREATE INDEX IF NOT EXISTS user_sessions_started_at_idx ON public.user_sessions (started_at DESC);
CREATE INDEX IF NOT EXISTS user_sessions_platform_idx ON public.user_sessions (platform);

-- User properties indexes
CREATE INDEX IF NOT EXISTS user_properties_consent_idx ON public.user_properties (metrics_consent);
CREATE INDEX IF NOT EXISTS user_properties_first_recording_idx ON public.user_properties (first_recording_at);
CREATE INDEX IF NOT EXISTS user_properties_last_active_idx ON public.user_properties (last_active_at DESC);

-- API usage indexes
CREATE INDEX IF NOT EXISTS api_usage_user_id_idx ON public.api_usage (user_id);
CREATE INDEX IF NOT EXISTS api_usage_operation_idx ON public.api_usage (operation_type);
CREATE INDEX IF NOT EXISTS api_usage_created_at_idx ON public.api_usage (created_at DESC);
CREATE INDEX IF NOT EXISTS api_usage_user_time_idx ON public.api_usage (user_id, created_at DESC);

-- ============================================
-- PART 9: CREATE FUNCTIONS
-- ============================================

-- Function to update user_properties updated_at
CREATE OR REPLACE FUNCTION public.handle_user_properties_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to auto-create user_properties on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_properties()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_properties (user_id, signup_platform)
  VALUES (NEW.id, 'web')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating user_properties for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Function to increment user property counters
CREATE OR REPLACE FUNCTION public.increment_user_property(
  p_user_id uuid,
  p_property text,
  p_increment integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format(
    'UPDATE public.user_properties SET %I = COALESCE(%I, 0) + $1, updated_at = now() WHERE user_id = $2',
    p_property, p_property
  ) USING p_increment, p_user_id;
END;
$$;

-- Function to set user milestone timestamp (only if not already set)
CREATE OR REPLACE FUNCTION public.set_user_milestone(
  p_user_id uuid,
  p_milestone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format(
    'UPDATE public.user_properties SET %I = COALESCE(%I, now()), updated_at = now() WHERE user_id = $1',
    p_milestone, p_milestone
  ) USING p_user_id;
END;
$$;

-- Function to update session activity
CREATE OR REPLACE FUNCTION public.update_session_activity(
  p_session_id uuid,
  p_page_view boolean DEFAULT false,
  p_event boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_sessions
  SET
    last_activity_at = now(),
    page_views = page_views + CASE WHEN p_page_view THEN 1 ELSE 0 END,
    events_count = events_count + CASE WHEN p_event THEN 1 ELSE 0 END
  WHERE id = p_session_id;
END;
$$;

-- ============================================
-- PART 10: CREATE TRIGGERS
-- ============================================

-- Trigger for user_properties updated_at
DROP TRIGGER IF EXISTS handle_user_properties_updated_at ON public.user_properties;
CREATE TRIGGER handle_user_properties_updated_at
  BEFORE UPDATE ON public.user_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_properties_updated_at();

-- Trigger to auto-create user_properties on user signup
DROP TRIGGER IF EXISTS on_auth_user_created_properties ON auth.users;
CREATE TRIGGER on_auth_user_created_properties
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_properties();

-- ============================================
-- PART 11: MONTHLY USAGE RESET FUNCTION
-- ============================================
-- Call this on the first of each month (via cron or scheduled function)

CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_properties
  SET
    current_month_recordings = 0,
    current_month_recording_minutes = 0,
    current_month_smartify_runs = 0,
    current_month_ask_queries = 0,
    current_month_storage_mb = 0,
    updated_at = now();
END;
$$;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  -- Verify tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_events') THEN
    RAISE EXCEPTION 'user_events table was not created';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_sessions') THEN
    RAISE EXCEPTION 'user_sessions table was not created';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_properties') THEN
    RAISE EXCEPTION 'user_properties table was not created';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_usage') THEN
    RAISE EXCEPTION 'api_usage table was not created';
  END IF;

  RAISE NOTICE 'Beta metrics tables created successfully!';
  RAISE NOTICE 'Tables: user_events, user_sessions, user_properties, api_usage, feature_flags';
END $$;
