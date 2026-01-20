-- ============================================
-- FOUNDERVOX BETA METRICS ANALYSIS QUERIES
-- ============================================
-- Run these queries directly in Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- ============================================

-- ============================================
-- 1. OVERVIEW DASHBOARD
-- ============================================

-- Total users and key counts
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
  (SELECT COUNT(*) FROM public.profiles WHERE onboarding_completed = true) as onboarded_users,
  (SELECT COUNT(*) FROM public.user_sessions WHERE started_at > NOW() - INTERVAL '7 days') as sessions_last_7_days,
  (SELECT COUNT(*) FROM public.user_events WHERE created_at > NOW() - INTERVAL '7 days') as events_last_7_days;

-- Daily active users (DAU)
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as daily_active_users
FROM public.user_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Weekly active users (WAU)
SELECT
  DATE_TRUNC('week', created_at) as week_start,
  COUNT(DISTINCT user_id) as weekly_active_users
FROM public.user_events
WHERE created_at > NOW() - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week_start DESC;

-- Monthly active users (MAU)
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(DISTINCT user_id) as monthly_active_users
FROM public.user_events
WHERE created_at > NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ============================================
-- 2. ACQUISITION FUNNEL
-- ============================================

-- Signup to activation funnel
WITH signup_events AS (
  SELECT user_id, MIN(created_at) as signup_date
  FROM public.user_events
  WHERE event_name = 'signup_completed'
  GROUP BY user_id
),
activation_milestones AS (
  SELECT
    p.user_id,
    p.onboarding_completed,
    p.first_recording_at IS NOT NULL as has_recorded,
    p.first_smartify_at IS NOT NULL as has_smartified,
    p.first_ask_query_at IS NOT NULL as has_asked,
    p.first_action_item_completed_at IS NOT NULL as has_completed_action
  FROM public.user_properties p
)
SELECT
  COUNT(*) as total_signups,
  COUNT(*) FILTER (WHERE a.onboarding_completed) as completed_onboarding,
  COUNT(*) FILTER (WHERE a.has_recorded) as made_first_recording,
  COUNT(*) FILTER (WHERE a.has_smartified) as used_smartify,
  COUNT(*) FILTER (WHERE a.has_asked) as used_ask,
  COUNT(*) FILTER (WHERE a.has_completed_action) as completed_action_item,
  -- Conversion rates
  ROUND(100.0 * COUNT(*) FILTER (WHERE a.onboarding_completed) / NULLIF(COUNT(*), 0), 2) as pct_onboarded,
  ROUND(100.0 * COUNT(*) FILTER (WHERE a.has_recorded) / NULLIF(COUNT(*), 0), 2) as pct_recorded,
  ROUND(100.0 * COUNT(*) FILTER (WHERE a.has_smartified) / NULLIF(COUNT(*) FILTER (WHERE a.has_recorded), 0), 2) as pct_recorded_to_smartify
FROM signup_events s
LEFT JOIN activation_milestones a ON s.user_id = a.user_id;

-- Time to first recording (distribution)
SELECT
  CASE
    WHEN time_to_first_minutes < 5 THEN '< 5 min'
    WHEN time_to_first_minutes < 15 THEN '5-15 min'
    WHEN time_to_first_minutes < 60 THEN '15-60 min'
    WHEN time_to_first_minutes < 1440 THEN '1-24 hours'
    ELSE '> 24 hours'
  END as time_bucket,
  COUNT(*) as users
FROM (
  SELECT
    p.user_id,
    EXTRACT(EPOCH FROM (p.first_recording_at - u.created_at)) / 60 as time_to_first_minutes
  FROM public.user_properties p
  JOIN auth.users u ON p.user_id = u.id
  WHERE p.first_recording_at IS NOT NULL
) t
GROUP BY 1
ORDER BY 1;

-- Signup source breakdown
SELECT
  COALESCE(signup_source, 'direct') as source,
  signup_utm_source,
  signup_utm_medium,
  signup_utm_campaign,
  COUNT(*) as signups
FROM public.user_properties
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY 1, 2, 3, 4
ORDER BY signups DESC;

-- ============================================
-- 3. FEATURE USAGE (PRICING-CRITICAL)
-- ============================================

-- Feature adoption rates
SELECT
  'Recording' as feature,
  COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'recording_uploaded') as users_used,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  ROUND(100.0 * COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'recording_uploaded') / (SELECT COUNT(*) FROM auth.users), 2) as adoption_pct
FROM public.user_events
UNION ALL
SELECT
  'Smartify',
  COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'smartify_completed'),
  (SELECT COUNT(*) FROM auth.users),
  ROUND(100.0 * COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'smartify_completed') / (SELECT COUNT(*) FROM auth.users), 2)
FROM public.user_events
UNION ALL
SELECT
  'Ask (RAG)',
  COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'ask_response_received'),
  (SELECT COUNT(*) FROM auth.users),
  ROUND(100.0 * COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'ask_response_received') / (SELECT COUNT(*) FROM auth.users), 2)
FROM public.user_events
UNION ALL
SELECT
  'Action Items',
  COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'action_item_completed'),
  (SELECT COUNT(*) FROM auth.users),
  ROUND(100.0 * COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'action_item_completed') / (SELECT COUNT(*) FROM auth.users), 2)
FROM public.user_events;

-- Feature usage frequency per user (for pricing tiers)
SELECT
  percentile_cont(0.5) WITHIN GROUP (ORDER BY total_recordings) as median_recordings,
  percentile_cont(0.9) WITHIN GROUP (ORDER BY total_recordings) as p90_recordings,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY total_smartify_runs) as median_smartify,
  percentile_cont(0.9) WITHIN GROUP (ORDER BY total_smartify_runs) as p90_smartify,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY total_ask_queries) as median_ask,
  percentile_cont(0.9) WITHIN GROUP (ORDER BY total_ask_queries) as p90_ask,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY total_recording_minutes) as median_recording_minutes,
  percentile_cont(0.9) WITHIN GROUP (ORDER BY total_recording_minutes) as p90_recording_minutes
FROM public.user_properties
WHERE total_recordings > 0;

-- Monthly usage distribution (for tier definition)
SELECT
  CASE
    WHEN current_month_recordings = 0 THEN '0 recordings'
    WHEN current_month_recordings <= 5 THEN '1-5 recordings'
    WHEN current_month_recordings <= 20 THEN '6-20 recordings'
    WHEN current_month_recordings <= 50 THEN '21-50 recordings'
    ELSE '50+ recordings'
  END as usage_tier,
  COUNT(*) as users,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as pct_of_users
FROM public.user_properties
GROUP BY 1
ORDER BY 1;

-- Recording duration distribution
SELECT
  CASE
    WHEN total_recording_minutes = 0 THEN '0 min'
    WHEN total_recording_minutes <= 10 THEN '1-10 min'
    WHEN total_recording_minutes <= 30 THEN '11-30 min'
    WHEN total_recording_minutes <= 60 THEN '31-60 min'
    WHEN total_recording_minutes <= 120 THEN '1-2 hours'
    ELSE '2+ hours'
  END as recording_tier,
  COUNT(*) as users
FROM public.user_properties
GROUP BY 1
ORDER BY 1;

-- ============================================
-- 4. ENGAGEMENT METRICS
-- ============================================

-- Average session duration and depth
SELECT
  DATE(started_at) as date,
  COUNT(*) as sessions,
  ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(ended_at, last_activity_at) - started_at)) / 60), 2) as avg_session_minutes,
  ROUND(AVG(page_views), 2) as avg_page_views,
  ROUND(AVG(events_count), 2) as avg_events
FROM public.user_sessions
WHERE started_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;

-- Session engagement flags (what actions happen in sessions)
SELECT
  DATE(started_at) as date,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE had_recording) as sessions_with_recording,
  COUNT(*) FILTER (WHERE had_smartify) as sessions_with_smartify,
  COUNT(*) FILTER (WHERE had_ask_query) as sessions_with_ask,
  ROUND(100.0 * COUNT(*) FILTER (WHERE had_recording) / COUNT(*), 2) as pct_recording,
  ROUND(100.0 * COUNT(*) FILTER (WHERE had_smartify) / COUNT(*), 2) as pct_smartify,
  ROUND(100.0 * COUNT(*) FILTER (WHERE had_ask_query) / COUNT(*), 2) as pct_ask
FROM public.user_sessions
WHERE started_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;

-- Event frequency by category
SELECT
  event_category,
  event_name,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM public.user_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY event_category, event_name
ORDER BY count DESC;

-- Action item completion rate
SELECT
  COUNT(*) as total_created,
  COUNT(*) FILTER (WHERE new_status = 'done') as completed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE new_status = 'done') / NULLIF(COUNT(*), 0), 2) as completion_rate
FROM public.user_events
WHERE event_name = 'action_item_status_changed'
  AND event_properties->>'old_status' = 'open'
  AND created_at > NOW() - INTERVAL '30 days';

-- ============================================
-- 5. RETENTION METRICS
-- ============================================

-- Day 1, Day 7, Day 30 retention
WITH user_cohorts AS (
  SELECT
    u.id as user_id,
    DATE(u.created_at) as signup_date
  FROM auth.users u
),
user_activity AS (
  SELECT
    user_id,
    DATE(created_at) as activity_date
  FROM public.user_events
  WHERE user_id IS NOT NULL
  GROUP BY user_id, DATE(created_at)
)
SELECT
  c.signup_date as cohort_date,
  COUNT(DISTINCT c.user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + INTERVAL '1 day' THEN c.user_id END) as d1_retained,
  COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + INTERVAL '7 days' THEN c.user_id END) as d7_retained,
  COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + INTERVAL '30 days' THEN c.user_id END) as d30_retained,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + INTERVAL '1 day' THEN c.user_id END) / COUNT(DISTINCT c.user_id), 2) as d1_retention_pct,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + INTERVAL '7 days' THEN c.user_id END) / COUNT(DISTINCT c.user_id), 2) as d7_retention_pct,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN a.activity_date = c.signup_date + INTERVAL '30 days' THEN c.user_id END) / COUNT(DISTINCT c.user_id), 2) as d30_retention_pct
FROM user_cohorts c
LEFT JOIN user_activity a ON c.user_id = a.user_id
WHERE c.signup_date >= NOW() - INTERVAL '60 days'
  AND c.signup_date < NOW() - INTERVAL '30 days' -- Only cohorts with enough time for D30
GROUP BY c.signup_date
ORDER BY c.signup_date DESC;

-- Weekly retention cohorts
WITH weekly_cohorts AS (
  SELECT
    u.id as user_id,
    DATE_TRUNC('week', u.created_at) as cohort_week
  FROM auth.users u
),
weekly_activity AS (
  SELECT
    user_id,
    DATE_TRUNC('week', created_at) as activity_week
  FROM public.user_events
  WHERE user_id IS NOT NULL
  GROUP BY user_id, DATE_TRUNC('week', created_at)
)
SELECT
  c.cohort_week,
  COUNT(DISTINCT c.user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week THEN c.user_id END) as week_0,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + INTERVAL '1 week' THEN c.user_id END) as week_1,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + INTERVAL '2 weeks' THEN c.user_id END) as week_2,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + INTERVAL '3 weeks' THEN c.user_id END) as week_3,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + INTERVAL '4 weeks' THEN c.user_id END) as week_4
FROM weekly_cohorts c
LEFT JOIN weekly_activity a ON c.user_id = a.user_id
WHERE c.cohort_week >= NOW() - INTERVAL '8 weeks'
GROUP BY c.cohort_week
ORDER BY c.cohort_week DESC;

-- ============================================
-- 6. API/AI COST ANALYSIS (PRICING)
-- ============================================

-- Daily API usage costs
SELECT
  DATE(created_at) as date,
  operation_type,
  provider,
  COUNT(*) as calls,
  SUM(estimated_cost_cents) / 100.0 as total_cost_usd,
  SUM(audio_seconds) as total_audio_seconds,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens
FROM public.api_usage
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), operation_type, provider
ORDER BY date DESC, total_cost_usd DESC;

-- Per-user API costs (for pricing model)
SELECT
  user_id,
  operation_type,
  COUNT(*) as calls,
  SUM(estimated_cost_cents) / 100.0 as total_cost_usd,
  SUM(audio_seconds) as total_audio_seconds
FROM public.api_usage
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id, operation_type
ORDER BY total_cost_usd DESC
LIMIT 50;

-- Cost per user percentiles
SELECT
  operation_type,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY user_cost) as median_cost,
  percentile_cont(0.9) WITHIN GROUP (ORDER BY user_cost) as p90_cost,
  percentile_cont(0.99) WITHIN GROUP (ORDER BY user_cost) as p99_cost,
  AVG(user_cost) as avg_cost
FROM (
  SELECT
    user_id,
    operation_type,
    SUM(estimated_cost_cents) / 100.0 as user_cost
  FROM public.api_usage
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY user_id, operation_type
) user_costs
GROUP BY operation_type;

-- ============================================
-- 7. PLATFORM/DEVICE BREAKDOWN
-- ============================================

-- Sessions by platform
SELECT
  platform,
  device_type,
  browser,
  os,
  COUNT(*) as sessions,
  COUNT(DISTINCT user_id) as unique_users
FROM public.user_sessions
WHERE started_at > NOW() - INTERVAL '30 days'
GROUP BY platform, device_type, browser, os
ORDER BY sessions DESC;

-- Events by platform
SELECT
  platform,
  COUNT(*) as events,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as sessions
FROM public.user_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY platform
ORDER BY events DESC;

-- ============================================
-- 8. TIMEZONE/GEOGRAPHY DISTRIBUTION
-- ============================================

-- Users by timezone
SELECT
  timezone,
  COUNT(*) as sessions,
  COUNT(DISTINCT user_id) as unique_users
FROM public.user_sessions
WHERE started_at > NOW() - INTERVAL '30 days'
  AND timezone IS NOT NULL
GROUP BY timezone
ORDER BY unique_users DESC
LIMIT 20;

-- ============================================
-- 9. ERROR ANALYSIS
-- ============================================

-- Error event frequency
SELECT
  event_name,
  event_properties->>'error_type' as error_type,
  event_properties->>'context' as context,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as affected_users
FROM public.user_events
WHERE event_category = 'error'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY event_name, event_properties->>'error_type', event_properties->>'context'
ORDER BY count DESC;

-- API failures
SELECT
  operation_type,
  provider,
  error_message,
  COUNT(*) as failures
FROM public.api_usage
WHERE status = 'error'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY operation_type, provider, error_message
ORDER BY failures DESC;

-- ============================================
-- 10. POWER USER IDENTIFICATION
-- ============================================

-- Top users by activity
SELECT
  up.user_id,
  p.email,
  p.display_name,
  up.total_recordings,
  up.total_smartify_runs,
  up.total_ask_queries,
  up.total_action_items_completed,
  up.total_recording_minutes,
  up.last_active_at
FROM public.user_properties up
JOIN public.profiles p ON up.user_id = p.id
WHERE up.total_recordings > 0
ORDER BY up.total_recordings DESC
LIMIT 50;

-- Users approaching potential tier limits
SELECT
  up.user_id,
  p.email,
  up.current_month_recordings,
  up.current_month_recording_minutes,
  up.current_month_smartify_runs,
  up.current_month_ask_queries
FROM public.user_properties up
JOIN public.profiles p ON up.user_id = p.id
WHERE up.current_month_recordings > 20
   OR up.current_month_recording_minutes > 60
ORDER BY up.current_month_recordings DESC;

-- ============================================
-- 11. CONSENT TRACKING
-- ============================================

-- Users who opted out
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE metrics_consent = true) as opted_in,
  COUNT(*) FILTER (WHERE metrics_consent = false) as opted_out,
  ROUND(100.0 * COUNT(*) FILTER (WHERE metrics_consent = true) / COUNT(*), 2) as opt_in_rate
FROM public.user_properties;

-- ============================================
-- 12. QUICK HEALTH CHECK
-- ============================================

-- System health check - run daily
SELECT
  'Events last hour' as metric,
  COUNT(*) as value
FROM public.user_events
WHERE created_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT
  'Sessions last hour',
  COUNT(*)
FROM public.user_sessions
WHERE started_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT
  'API calls last hour',
  COUNT(*)
FROM public.api_usage
WHERE created_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT
  'Errors last hour',
  COUNT(*)
FROM public.user_events
WHERE event_category = 'error'
  AND created_at > NOW() - INTERVAL '1 hour';
