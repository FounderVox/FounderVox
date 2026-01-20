/**
 * Beta Metrics Tracking - Type Definitions
 *
 * Comprehensive types for user metrics tracking system
 * for beta launch econometrics and pricing analysis.
 */

// ============================================
// EVENT TYPES
// ============================================

export type EventCategory =
  | 'acquisition'   // Signup, first visit
  | 'activation'    // Onboarding, first actions
  | 'engagement'    // Feature usage, interactions
  | 'retention'     // Return visits, continued usage
  | 'feature'       // Specific feature events
  | 'error';        // Errors and failures

export type Platform = 'web' | 'ios' | 'android';
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

// Core event names - keep these consistent across platforms
export type CoreEventName =
  // Acquisition
  | 'signup_started'
  | 'signup_completed'
  | 'email_confirmed'
  | 'login'
  | 'logout'
  | 'oauth_started'
  | 'oauth_completed'
  // Onboarding
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'use_case_selected'
  | 'demo_started'
  | 'demo_completed'
  | 'demo_skipped'
  // Recording
  | 'recording_started'
  | 'recording_paused'
  | 'recording_resumed'
  | 'recording_stopped'
  | 'recording_uploaded'
  | 'recording_transcribed'
  | 'recording_failed'
  // Notes
  | 'note_created'
  | 'note_viewed'
  | 'note_edited'
  | 'note_deleted'
  | 'note_starred'
  | 'note_unstarred'
  | 'note_tag_added'
  | 'note_tag_removed'
  // Smartify
  | 'smartify_started'
  | 'smartify_completed'
  | 'smartify_failed'
  | 'smartify_preview_viewed'
  // Action Items
  | 'action_item_created'
  | 'action_item_viewed'
  | 'action_item_status_changed'
  | 'action_item_completed'
  | 'action_item_edited'
  | 'action_item_deleted'
  // Brain Dump
  | 'brain_dump_viewed'
  | 'brain_dump_item_created'
  | 'brain_dump_item_category_changed'
  | 'brain_dump_item_deleted'
  // Investor Updates
  | 'investor_update_viewed'
  | 'investor_update_edited'
  | 'investor_update_copied'
  | 'investor_update_sent'
  | 'investor_update_deleted'
  // Ask (RAG)
  | 'ask_query_submitted'
  | 'ask_response_received'
  | 'ask_citation_clicked'
  | 'ask_filter_changed'
  | 'ask_followup_submitted'
  // Navigation
  | 'page_viewed'
  | 'navigation_clicked'
  | 'sidebar_toggled'
  | 'filter_applied'
  | 'sort_applied'
  // Session
  | 'session_started'
  | 'session_ended'
  | 'session_resumed'
  // Errors
  | 'error_occurred'
  | 'api_error'
  | 'upload_error'
  // Settings
  | 'settings_opened'
  | 'settings_updated'
  | 'metrics_consent_changed';

export interface EventProperties {
  // Common properties
  [key: string]: unknown;
}

// Specific event property interfaces
export interface RecordingEventProperties extends EventProperties {
  duration_seconds?: number;
  file_size_bytes?: number;
  has_transcript?: boolean;
}

export interface NoteEventProperties extends EventProperties {
  note_id?: string;
  template_type?: string;
  word_count?: number;
  has_audio?: boolean;
  source?: 'recording' | 'manual';
}

export interface SmartifyEventProperties extends EventProperties {
  note_id?: string;
  action_items_count?: number;
  brain_dump_count?: number;
  investor_updates_count?: number;
  extraction_time_ms?: number;
}

export interface ActionItemEventProperties extends EventProperties {
  item_id?: string;
  priority?: 'high' | 'medium' | 'low';
  old_status?: string;
  new_status?: string;
  has_deadline?: boolean;
  days_to_complete?: number;
}

export interface AskEventProperties extends EventProperties {
  query_length?: number;
  time_filter?: string;
  response_time_ms?: number;
  citations_count?: number;
  is_followup?: boolean;
}

export interface ErrorEventProperties extends EventProperties {
  error_type?: string;
  error_message?: string;
  error_stack?: string;
  context?: string;
}

// ============================================
// SESSION TYPES
// ============================================

export interface SessionData {
  id: string;
  userId?: string;
  anonymousId: string;
  platform: Platform;
  appVersion?: string;
  entryPage?: string;
  entryReferrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  timezone?: string;
  deviceType?: DeviceType;
  browser?: string;
  os?: string;
  startedAt: Date;
  lastActivityAt: Date;
  pageViews: number;
  eventsCount: number;
  hadRecording: boolean;
  hadSmartify: boolean;
  hadAskQuery: boolean;
}

// ============================================
// USER PROPERTIES TYPES
// ============================================

export interface UserProperties {
  userId: string;
  signupPlatform?: Platform;
  signupSource?: string;
  signupUtmSource?: string;
  signupUtmMedium?: string;
  signupUtmCampaign?: string;
  firstRecordingAt?: Date;
  firstSmartifyAt?: Date;
  firstAskQueryAt?: Date;
  firstActionItemCompletedAt?: Date;
  totalRecordings: number;
  totalNotes: number;
  totalSmartifyRuns: number;
  totalAskQueries: number;
  totalActionItemsCreated: number;
  totalActionItemsCompleted: number;
  totalBrainDumpItems: number;
  totalInvestorUpdatesSent: number;
  totalSessions: number;
  totalRecordingMinutes: number;
  lastRecordingAt?: Date;
  lastSmartifyAt?: Date;
  lastActiveAt?: Date;
  metricsConsent: boolean;
  currentMonthRecordings: number;
  currentMonthRecordingMinutes: number;
  currentMonthSmartifyRuns: number;
  currentMonthAskQueries: number;
  currentMonthStorageMb: number;
}

// ============================================
// API USAGE TYPES
// ============================================

export type OperationType =
  | 'transcription'
  | 'extraction'
  | 'embedding'
  | 'ask_query'
  | 'title_generation';

export type AIProvider = 'deepgram' | 'openai';

export interface APIUsageData {
  userId: string;
  operationType: OperationType;
  provider: AIProvider;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  audioSeconds?: number;
  estimatedCostCents?: number;
  sourceType?: 'recording' | 'note' | 'query';
  sourceId?: string;
  status: 'success' | 'error' | 'timeout';
  errorMessage?: string;
  durationMs?: number;
}

// ============================================
// TRACKING CONFIG
// ============================================

export interface MetricsConfig {
  enabled: boolean;
  platform: Platform;
  appVersion?: string;
  batchSize: number;
  flushIntervalMs: number;
  sessionTimeoutMs: number;
  debug: boolean;
}

// ============================================
// EVENT PAYLOAD
// ============================================

export interface TrackEventPayload {
  userId?: string;
  anonymousId?: string;
  sessionId?: string;
  eventName: CoreEventName | string;
  eventCategory: EventCategory;
  eventProperties?: EventProperties;
  platform: Platform;
  appVersion?: string;
  pagePath?: string;
  referrer?: string;
  timezone?: string;
  deviceType?: DeviceType;
  browser?: string;
  os?: string;
  screenWidth?: number;
  screenHeight?: number;
  clientTimestamp: Date;
}

// ============================================
// BATCH PAYLOAD
// ============================================

export interface BatchPayload {
  events: TrackEventPayload[];
  session?: Partial<SessionData>;
  apiUsage?: APIUsageData[];
}
