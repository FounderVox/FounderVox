-- ============================================
-- MIGRATION 015: Secure RPC Functions
-- ============================================
-- Adds search_path and parameter validation to SECURITY DEFINER functions

-- Fix increment_user_property - add search_path and whitelist validation
CREATE OR REPLACE FUNCTION public.increment_user_property(
  p_user_id uuid,
  p_property text,
  p_increment integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate property name (whitelist)
  IF p_property NOT IN (
    'total_recordings', 'total_notes', 'total_smartify_runs',
    'total_ask_queries', 'total_action_items_created',
    'total_action_items_completed', 'total_brain_dump_items',
    'total_investor_updates_sent', 'total_sessions',
    'current_month_recordings', 'current_month_recording_minutes',
    'current_month_smartify_runs', 'current_month_ask_queries'
  ) THEN
    RAISE EXCEPTION 'Invalid property name: %', p_property;
  END IF;

  EXECUTE format(
    'UPDATE public.user_properties SET %I = COALESCE(%I, 0) + $1, updated_at = now() WHERE user_id = $2',
    p_property, p_property
  ) USING p_increment, p_user_id;
END;
$$;

-- Fix set_user_milestone - add search_path and whitelist validation
CREATE OR REPLACE FUNCTION public.set_user_milestone(
  p_user_id uuid,
  p_milestone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate milestone name (whitelist)
  IF p_milestone NOT IN (
    'first_recording_at', 'first_smartify_at',
    'first_ask_query_at', 'first_action_item_completed_at'
  ) THEN
    RAISE EXCEPTION 'Invalid milestone name: %', p_milestone;
  END IF;

  EXECUTE format(
    'UPDATE public.user_properties SET %I = COALESCE(%I, now()), updated_at = now() WHERE user_id = $1',
    p_milestone, p_milestone
  ) USING p_user_id;
END;
$$;

-- Fix update_session_activity - add search_path
CREATE OR REPLACE FUNCTION public.update_session_activity(
  p_session_id uuid,
  p_page_view boolean DEFAULT false,
  p_event boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix reset_monthly_usage - add search_path
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'RPC functions secured with search_path and parameter validation';
END $$;
