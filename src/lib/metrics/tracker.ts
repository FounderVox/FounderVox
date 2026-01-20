/**
 * Beta Metrics Tracker
 *
 * Core tracking service for FounderVox beta metrics.
 * Handles event tracking, session management, and batched persistence.
 */

import { createClient } from '@/lib/supabase/client';
import {
  CoreEventName,
  EventCategory,
  EventProperties,
  MetricsConfig,
  Platform,
  SessionData,
  TrackEventPayload,
  APIUsageData,
} from './types';
import {
  getDeviceInfo,
  getOrCreateAnonymousId,
  getUTMParams,
} from './device';

// Default configuration
const DEFAULT_CONFIG: MetricsConfig = {
  enabled: true,
  platform: 'web',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  batchSize: 10,
  flushIntervalMs: 30000, // 30 seconds
  sessionTimeoutMs: 30 * 60 * 1000, // 30 minutes
  debug: process.env.NODE_ENV === 'development',
};

// Storage keys
const STORAGE_KEYS = {
  SESSION: 'fv_metrics_session',
  EVENT_QUEUE: 'fv_metrics_queue',
  CONSENT: 'fv_metrics_consent',
  USER_ID: 'fv_metrics_user_id',
};

class MetricsTracker {
  private config: MetricsConfig;
  private session: SessionData | null = null;
  private eventQueue: TrackEventPayload[] = [];
  private apiUsageQueue: APIUsageData[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private consent: boolean = true; // Default ON for beta
  private initialized: boolean = false;
  private supabase: ReturnType<typeof createClient> | null = null;

  constructor(config: Partial<MetricsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the tracker
   * Call this once when the app loads
   */
  async initialize(userId?: string): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.initialized) return;

    try {
      // Create Supabase client
      this.supabase = createClient();

      // Load consent preference
      const savedConsent = localStorage.getItem(STORAGE_KEYS.CONSENT);
      this.consent = savedConsent !== null ? savedConsent === 'true' : true;

      // Set user ID if provided
      if (userId) {
        this.setUserId(userId);
      } else {
        const savedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
        if (savedUserId) this.userId = savedUserId;
      }

      // Load or create session
      await this.initializeSession();

      // Load any queued events from storage
      this.loadQueueFromStorage();

      // Start flush timer
      this.startFlushTimer();

      // Handle page visibility changes
      this.setupVisibilityHandler();

      // Handle beforeunload
      this.setupBeforeUnload();

      this.initialized = true;
      this.log('Metrics tracker initialized');
    } catch (error) {
      console.error('[Metrics] Failed to initialize:', error);
    }
  }

  /**
   * Set the user ID (call after login)
   */
  setUserId(userId: string): void {
    this.userId = userId;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    }

    // Update session with user ID
    if (this.session) {
      this.session.userId = userId;
      this.saveSessionToStorage();
    }

    this.log('User ID set:', userId);
  }

  /**
   * Clear user ID (call after logout)
   */
  clearUserId(): void {
    this.userId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
    }

    // Clear session user ID but keep session active
    if (this.session) {
      this.session.userId = undefined;
      this.saveSessionToStorage();
    }

    this.log('User ID cleared');
  }

  /**
   * Set metrics consent
   */
  setConsent(consent: boolean): void {
    this.consent = consent;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CONSENT, String(consent));
    }

    // Track consent change
    if (consent) {
      this.track('metrics_consent_changed', 'engagement', { consent: true });
    }

    // Update user properties in database
    if (this.userId) {
      this.updateUserConsent(consent);
    }

    this.log('Consent set:', consent);
  }

  /**
   * Check if metrics are enabled and consented
   */
  isEnabled(): boolean {
    return this.config.enabled && this.consent;
  }

  /**
   * Track an event
   */
  track(
    eventName: CoreEventName | string,
    category: EventCategory,
    properties?: EventProperties
  ): void {
    if (!this.isEnabled()) return;
    if (typeof window === 'undefined') return;

    const deviceInfo = getDeviceInfo();

    const event: TrackEventPayload = {
      userId: this.userId || undefined,
      anonymousId: getOrCreateAnonymousId(),
      sessionId: this.session?.id,
      eventName,
      eventCategory: category,
      eventProperties: properties,
      platform: this.config.platform,
      appVersion: this.config.appVersion,
      pagePath: window.location.pathname,
      referrer: document.referrer || undefined,
      timezone: deviceInfo.timezone,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      screenWidth: deviceInfo.screenWidth,
      screenHeight: deviceInfo.screenHeight,
      clientTimestamp: new Date(),
    };

    this.eventQueue.push(event);
    this.log('Event tracked:', eventName, properties);

    // Update session activity
    this.updateSessionActivity(eventName);

    // Check if we should flush
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }

    // Save queue to storage (in case of page close)
    this.saveQueueToStorage();
  }

  /**
   * Track a page view
   */
  trackPageView(pagePath?: string): void {
    const path = pagePath || (typeof window !== 'undefined' ? window.location.pathname : '');
    this.track('page_viewed', 'engagement', { page_path: path });

    // Update session page views
    if (this.session) {
      this.session.pageViews++;
      this.saveSessionToStorage();
    }
  }

  /**
   * Track API usage for cost analysis
   */
  trackAPIUsage(usage: Omit<APIUsageData, 'userId'>): void {
    if (!this.isEnabled()) return;
    if (!this.userId) return;

    const usageData: APIUsageData = {
      ...usage,
      userId: this.userId,
    };

    this.apiUsageQueue.push(usageData);
    this.log('API usage tracked:', usage.operationType);

    // Flush immediately for API usage (important for cost tracking)
    this.flushAPIUsage();
  }

  /**
   * Flush all queued events to the database
   */
  async flush(): Promise<void> {
    if (!this.isEnabled()) return;
    if (this.eventQueue.length === 0) return;
    if (!this.supabase) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Transform events for database
      const dbEvents = eventsToFlush.map((e) => ({
        user_id: e.userId,
        anonymous_id: e.anonymousId,
        session_id: e.sessionId,
        event_name: e.eventName,
        event_category: e.eventCategory,
        event_properties: e.eventProperties,
        platform: e.platform,
        app_version: e.appVersion,
        page_path: e.pagePath,
        referrer: e.referrer,
        timezone: e.timezone,
        device_type: e.deviceType,
        browser: e.browser,
        os: e.os,
        screen_width: e.screenWidth,
        screen_height: e.screenHeight,
        client_timestamp: e.clientTimestamp?.toISOString(),
      }));

      const { error } = await this.supabase.from('user_events').insert(dbEvents);

      if (error) {
        console.error('[Metrics] Failed to flush events:', error);
        // Put events back in queue
        this.eventQueue = [...eventsToFlush, ...this.eventQueue];
      } else {
        this.log('Flushed', eventsToFlush.length, 'events');
      }
    } catch (error) {
      console.error('[Metrics] Failed to flush events:', error);
      // Put events back in queue
      this.eventQueue = [...eventsToFlush, ...this.eventQueue];
    }

    // Save remaining queue
    this.saveQueueToStorage();
  }

  /**
   * Flush API usage to database
   */
  private async flushAPIUsage(): Promise<void> {
    if (this.apiUsageQueue.length === 0) return;
    if (!this.supabase) return;

    const usageToFlush = [...this.apiUsageQueue];
    this.apiUsageQueue = [];

    try {
      const dbUsage = usageToFlush.map((u) => ({
        user_id: u.userId,
        operation_type: u.operationType,
        provider: u.provider,
        model: u.model,
        input_tokens: u.inputTokens,
        output_tokens: u.outputTokens,
        audio_seconds: u.audioSeconds,
        estimated_cost_cents: u.estimatedCostCents,
        source_type: u.sourceType,
        source_id: u.sourceId,
        status: u.status,
        error_message: u.errorMessage,
        duration_ms: u.durationMs,
      }));

      const { error } = await this.supabase.from('api_usage').insert(dbUsage);

      if (error) {
        console.error('[Metrics] Failed to flush API usage:', error);
        this.apiUsageQueue = [...usageToFlush, ...this.apiUsageQueue];
      }
    } catch (error) {
      console.error('[Metrics] Failed to flush API usage:', error);
      this.apiUsageQueue = [...usageToFlush, ...this.apiUsageQueue];
    }
  }

  /**
   * Initialize or restore session
   */
  private async initializeSession(): Promise<void> {
    // Try to restore session from storage
    const savedSession = this.loadSessionFromStorage();

    if (savedSession && !this.isSessionExpired(savedSession)) {
      this.session = savedSession;
      this.session.lastActivityAt = new Date();
      this.saveSessionToStorage();
      this.track('session_resumed', 'retention');
      this.log('Session restored:', this.session.id);
      return;
    }

    // Create new session
    await this.createNewSession();
  }

  /**
   * Create a new session
   */
  private async createNewSession(): Promise<void> {
    const deviceInfo = getDeviceInfo();
    const utmParams = getUTMParams();

    this.session = {
      id: crypto.randomUUID(),
      userId: this.userId || undefined,
      anonymousId: getOrCreateAnonymousId(),
      platform: this.config.platform,
      appVersion: this.config.appVersion,
      entryPage: window.location.pathname,
      entryReferrer: document.referrer || undefined,
      utmSource: utmParams.utmSource,
      utmMedium: utmParams.utmMedium,
      utmCampaign: utmParams.utmCampaign,
      timezone: deviceInfo.timezone,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      pageViews: 1,
      eventsCount: 0,
      hadRecording: false,
      hadSmartify: false,
      hadAskQuery: false,
    };

    // Save to storage
    this.saveSessionToStorage();

    // Persist to database
    await this.persistSession();

    // Track session start
    this.track('session_started', 'acquisition', {
      entry_page: this.session.entryPage,
      entry_referrer: this.session.entryReferrer,
      utm_source: this.session.utmSource,
      utm_medium: this.session.utmMedium,
      utm_campaign: this.session.utmCampaign,
    });

    this.log('New session created:', this.session.id);
  }

  /**
   * Update session activity
   */
  private updateSessionActivity(eventName: string): void {
    if (!this.session) return;

    this.session.lastActivityAt = new Date();
    this.session.eventsCount++;

    // Track feature engagement flags
    if (eventName.startsWith('recording_')) {
      this.session.hadRecording = true;
    } else if (eventName.startsWith('smartify_')) {
      this.session.hadSmartify = true;
    } else if (eventName.startsWith('ask_')) {
      this.session.hadAskQuery = true;
    }

    this.saveSessionToStorage();
  }

  /**
   * Persist session to database
   */
  private async persistSession(): Promise<void> {
    if (!this.session || !this.supabase) return;

    try {
      const dbSession = {
        id: this.session.id,
        user_id: this.session.userId,
        anonymous_id: this.session.anonymousId,
        platform: this.session.platform,
        app_version: this.session.appVersion,
        entry_page: this.session.entryPage,
        entry_referrer: this.session.entryReferrer,
        utm_source: this.session.utmSource,
        utm_medium: this.session.utmMedium,
        utm_campaign: this.session.utmCampaign,
        timezone: this.session.timezone,
        device_type: this.session.deviceType,
        browser: this.session.browser,
        os: this.session.os,
        started_at: this.session.startedAt.toISOString(),
        last_activity_at: this.session.lastActivityAt.toISOString(),
        page_views: this.session.pageViews,
        events_count: this.session.eventsCount,
        had_recording: this.session.hadRecording,
        had_smartify: this.session.hadSmartify,
        had_ask_query: this.session.hadAskQuery,
      };

      await this.supabase.from('user_sessions').upsert(dbSession);
    } catch (error) {
      console.error('[Metrics] Failed to persist session:', error);
    }
  }

  /**
   * End the current session
   */
  async endSession(): Promise<void> {
    if (!this.session || !this.supabase) return;

    this.session.lastActivityAt = new Date();

    try {
      await this.supabase
        .from('user_sessions')
        .update({
          ended_at: new Date().toISOString(),
          last_activity_at: this.session.lastActivityAt.toISOString(),
          page_views: this.session.pageViews,
          events_count: this.session.eventsCount,
          had_recording: this.session.hadRecording,
          had_smartify: this.session.hadSmartify,
          had_ask_query: this.session.hadAskQuery,
        })
        .eq('id', this.session.id);
    } catch (error) {
      console.error('[Metrics] Failed to end session:', error);
    }

    // Flush remaining events
    await this.flush();

    this.track('session_ended', 'retention', {
      duration_seconds: Math.floor(
        (new Date().getTime() - this.session.startedAt.getTime()) / 1000
      ),
      page_views: this.session.pageViews,
      events_count: this.session.eventsCount,
    });

    this.log('Session ended:', this.session.id);
  }

  /**
   * Update user consent in database
   */
  private async updateUserConsent(consent: boolean): Promise<void> {
    if (!this.userId || !this.supabase) return;

    try {
      await this.supabase
        .from('user_properties')
        .update({
          metrics_consent: consent,
          consent_updated_at: new Date().toISOString(),
        })
        .eq('user_id', this.userId);
    } catch (error) {
      console.error('[Metrics] Failed to update consent:', error);
    }
  }

  /**
   * Increment a user property counter
   */
  async incrementUserProperty(property: string, increment: number = 1): Promise<void> {
    if (!this.userId || !this.supabase) return;

    try {
      await this.supabase.rpc('increment_user_property', {
        p_user_id: this.userId,
        p_property: property,
        p_increment: increment,
      });
    } catch (error) {
      console.error('[Metrics] Failed to increment property:', error);
    }
  }

  /**
   * Set a user milestone timestamp
   */
  async setUserMilestone(milestone: string): Promise<void> {
    if (!this.userId || !this.supabase) return;

    try {
      await this.supabase.rpc('set_user_milestone', {
        p_user_id: this.userId,
        p_milestone: milestone,
      });
    } catch (error) {
      console.error('[Metrics] Failed to set milestone:', error);
    }
  }

  // ============================================
  // Storage helpers
  // ============================================

  private saveSessionToStorage(): void {
    if (!this.session || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(this.session));
    } catch {
      // Storage full or disabled
    }
  }

  private loadSessionFromStorage(): SessionData | null {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!saved) return null;
      const session = JSON.parse(saved);
      // Restore Date objects
      session.startedAt = new Date(session.startedAt);
      session.lastActivityAt = new Date(session.lastActivityAt);
      return session;
    } catch {
      return null;
    }
  }

  private isSessionExpired(session: SessionData): boolean {
    const now = new Date().getTime();
    const lastActivity = session.lastActivityAt.getTime();
    return now - lastActivity > this.config.sessionTimeoutMs;
  }

  private saveQueueToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.EVENT_QUEUE, JSON.stringify(this.eventQueue));
    } catch {
      // Storage full or disabled
    }
  }

  private loadQueueFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENT_QUEUE);
      if (saved) {
        this.eventQueue = JSON.parse(saved);
        // Restore Date objects
        this.eventQueue.forEach((e) => {
          if (e.clientTimestamp) {
            e.clientTimestamp = new Date(e.clientTimestamp);
          }
        });
      }
    } catch {
      this.eventQueue = [];
    }
  }

  // ============================================
  // Timer and lifecycle handlers
  // ============================================

  private startFlushTimer(): void {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => {
      this.flush();
      this.persistSession();
    }, this.config.flushIntervalMs);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private setupVisibilityHandler(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Flush events when page is hidden
        this.flush();
        this.persistSession();
      } else if (document.visibilityState === 'visible') {
        // Check if session expired while away
        if (this.session && this.isSessionExpired(this.session)) {
          this.createNewSession();
        }
      }
    });
  }

  private setupBeforeUnload(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeunload', () => {
      // Save queue to storage (async flush may not complete)
      this.saveQueueToStorage();

      // Try to send via sendBeacon for reliability
      this.sendBeacon();
    });
  }

  private sendBeacon(): void {
    if (this.eventQueue.length === 0) return;

    try {
      // Use sendBeacon for reliable delivery on page close
      const payload = JSON.stringify({
        events: this.eventQueue,
        sessionId: this.session?.id,
      });

      navigator.sendBeacon('/api/metrics/track', payload);
    } catch {
      // Beacon failed, events are saved to storage
    }
  }

  // ============================================
  // Logging
  // ============================================

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[Metrics]', ...args);
    }
  }

  /**
   * Get current session info (for debugging)
   */
  getSessionInfo(): SessionData | null {
    return this.session;
  }

  /**
   * Destroy tracker instance
   */
  destroy(): void {
    this.stopFlushTimer();
    this.flush();
    this.initialized = false;
  }
}

// ============================================
// Singleton instance
// ============================================

let trackerInstance: MetricsTracker | null = null;

export function getMetricsTracker(config?: Partial<MetricsConfig>): MetricsTracker {
  if (!trackerInstance) {
    trackerInstance = new MetricsTracker(config);
  }
  return trackerInstance;
}

export function resetMetricsTracker(): void {
  if (trackerInstance) {
    trackerInstance.destroy();
    trackerInstance = null;
  }
}

export { MetricsTracker };
