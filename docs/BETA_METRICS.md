# FounderVox Beta Metrics System

Comprehensive user metrics tracking system for beta launch econometrics and pricing analysis.

## Design Decisions

- **Consent**: Default ON for beta users (opt-out model)
- **Location**: Timezone only (no IP-based geolocation)
- **Dashboard**: Direct SQL queries in Supabase (no admin UI)

## Architecture

### Database Tables

| Table | Purpose |
|-------|---------|
| `user_events` | Core event tracking (all user interactions) |
| `user_sessions` | Session tracking (start, end, activity) |
| `user_properties` | User-level metrics for segmentation & pricing |
| `api_usage` | AI/API cost tracking (Deepgram, OpenAI) |
| `feature_flags` | Feature rollout & A/B testing |

### Key Metrics Tracked

#### 1. Acquisition Funnel
- `signup_started` / `signup_completed`
- `email_confirmed`
- `onboarding_started` / `onboarding_completed`
- `use_case_selected`
- `demo_started` / `demo_completed` / `demo_skipped`

#### 2. Feature Usage (Critical for Pricing)
- **Recordings**: `recording_started`, `recording_stopped`, `recording_uploaded`, `recording_transcribed`
- **Notes**: `note_created`, `note_viewed`, `note_edited`, `note_deleted`, `note_starred`
- **Smartify**: `smartify_started`, `smartify_completed` (includes extraction counts)
- **Action Items**: `action_item_status_changed`, `action_item_completed`
- **Brain Dump**: `brain_dump_item_category_changed`
- **Ask (RAG)**: `ask_query_submitted`, `ask_response_received`, `ask_citation_clicked`

#### 3. Engagement Metrics
- Session duration & page views
- Feature engagement flags per session
- Time on page tracking

#### 4. Retention Indicators
- DAU/WAU/MAU
- Cohort retention (D1, D7, D30)
- Last activity tracking

#### 5. Cost Metrics (for Pricing)
- API calls per operation type
- Audio seconds transcribed
- Token usage (input/output)
- Estimated costs in cents

## Integration Points

### Client-Side (React)

```tsx
// In root layout - initialize tracking
import { MetricsProvider } from '@/components/providers/metrics-provider';

// Wrap your app
<AuthProvider>
  <MetricsProvider>
    <YourApp />
  </MetricsProvider>
</AuthProvider>

// In components - use tracking hooks
import { useTrackRecording, useTrackNote, useTrackSmartify } from '@/lib/metrics';

const { trackStarted, trackStopped, trackUploaded } = useTrackRecording();
trackStarted();
trackStopped({ duration_seconds: 120 });
```

### Server-Side (API Routes)

```typescript
// Import helper functions
import { createServiceRoleClient } from '@/lib/supabase/server';

// Track event from server
async function trackServerEvent(userId, eventName, category, properties) {
  const serviceClient = createServiceRoleClient();
  await serviceClient.from('user_events').insert({
    user_id: userId,
    event_name: eventName,
    event_category: category,
    event_properties: properties,
    platform: 'web',
  });
}

// Track API usage
await serviceClient.from('api_usage').insert({
  user_id: userId,
  operation_type: 'transcription',
  provider: 'deepgram',
  audio_seconds: 120,
  status: 'success',
});
```

## Setup Instructions

### 1. Run Database Migration

In Supabase SQL Editor, run:
```sql
-- Run the migration file
\i supabase/migrations/008_beta_metrics_tracking.sql
```

Or copy the contents of `supabase/migrations/008_beta_metrics_tracking.sql` and execute.

### 2. Verify Tables

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_events', 'user_sessions', 'user_properties', 'api_usage');
```

### 3. Test Tracking

Visit your app and perform some actions. Then verify:

```sql
SELECT * FROM user_events ORDER BY created_at DESC LIMIT 10;
SELECT * FROM user_sessions ORDER BY started_at DESC LIMIT 5;
```

## Analysis Queries

All analysis queries are in `supabase/analysis/beta_metrics_queries.sql`.

Key query categories:
1. **Overview Dashboard** - DAU/WAU/MAU, total users
2. **Acquisition Funnel** - Signup to activation conversion
3. **Feature Usage** - Adoption rates, usage frequency
4. **Engagement Metrics** - Session depth, feature engagement
5. **Retention Metrics** - D1/D7/D30, cohort analysis
6. **API/AI Cost Analysis** - Cost per user, operation costs
7. **Platform Breakdown** - Device, browser, OS
8. **Error Analysis** - Error frequency, affected users
9. **Power User Identification** - Top users by activity

## Pricing Analysis

Key metrics for pricing tier decisions:

### Usage Distribution
```sql
SELECT
  CASE
    WHEN current_month_recordings = 0 THEN '0 recordings'
    WHEN current_month_recordings <= 5 THEN '1-5 recordings'
    WHEN current_month_recordings <= 20 THEN '6-20 recordings'
    ELSE '20+ recordings'
  END as tier,
  COUNT(*) as users
FROM user_properties
GROUP BY 1;
```

### Cost Per User
```sql
SELECT
  percentile_cont(0.5) WITHIN GROUP (ORDER BY user_cost) as median_cost,
  percentile_cont(0.9) WITHIN GROUP (ORDER BY user_cost) as p90_cost
FROM (
  SELECT user_id, SUM(estimated_cost_cents)/100.0 as user_cost
  FROM api_usage
  GROUP BY user_id
) costs;
```

## Consent Management

Users can opt-out via settings:

```typescript
import { getMetricsTracker } from '@/lib/metrics';

// Opt out
const tracker = getMetricsTracker();
tracker.setConsent(false);

// Check consent
const isEnabled = tracker.isEnabled();
```

## iOS App Integration

The metrics system is designed to work with iOS. Use the same event names and properties:

```swift
// iOS tracking should use the same event_name values
// Platform should be "ios"
// Events can be batched and sent to /api/metrics/track
```

Ensure iOS sends:
- `platform: "ios"`
- `app_version: "1.0.0"` (actual version)
- Same `event_name` values as web
- Same `event_properties` structure

## Monthly Usage Reset

Set up a Supabase scheduled function to reset monthly counters:

```sql
-- Call on the 1st of each month
SELECT reset_monthly_usage();
```

## Files Created

```
src/lib/metrics/
├── index.ts          # Public exports
├── types.ts          # TypeScript types
├── tracker.ts        # Core MetricsTracker class
├── hooks.ts          # React hooks for tracking
└── device.ts         # Device detection utilities

src/components/providers/
└── metrics-provider.tsx   # React provider component

src/app/api/metrics/track/
└── route.ts               # API endpoint for sendBeacon

supabase/migrations/
└── 008_beta_metrics_tracking.sql   # Database schema

supabase/analysis/
└── beta_metrics_queries.sql        # Analysis queries

docs/
└── BETA_METRICS.md                 # This documentation
```
