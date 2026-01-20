/**
 * React Hooks for Metrics Tracking
 *
 * Convenience hooks for tracking events in React components.
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getMetricsTracker } from './tracker';
import {
  CoreEventName,
  EventCategory,
  EventProperties,
  RecordingEventProperties,
  NoteEventProperties,
  SmartifyEventProperties,
  ActionItemEventProperties,
  AskEventProperties,
  ErrorEventProperties,
  APIUsageData,
} from './types';

/**
 * Initialize metrics tracking for the app
 * Call this once in your root layout
 */
export function useMetricsInit(userId?: string) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const tracker = getMetricsTracker();
    tracker.initialize(userId);

    return () => {
      // Don't destroy on unmount - keep tracking across navigations
    };
  }, [userId]);
}

/**
 * Update user ID when auth state changes
 */
export function useMetricsUser(userId: string | null | undefined) {
  useEffect(() => {
    const tracker = getMetricsTracker();
    if (userId) {
      tracker.setUserId(userId);
    } else {
      tracker.clearUserId();
    }
  }, [userId]);
}

/**
 * Automatic page view tracking
 */
export function usePageViewTracking() {
  const pathname = usePathname();

  useEffect(() => {
    const tracker = getMetricsTracker();
    tracker.trackPageView(pathname);
  }, [pathname]);
}

/**
 * Generic event tracking hook
 */
export function useTrackEvent() {
  const track = useCallback(
    (
      eventName: CoreEventName | string,
      category: EventCategory,
      properties?: EventProperties
    ) => {
      const tracker = getMetricsTracker();
      tracker.track(eventName, category, properties);
    },
    []
  );

  return track;
}

// ============================================
// Feature-specific tracking hooks
// ============================================

/**
 * Recording event tracking
 */
export function useTrackRecording() {
  const track = useTrackEvent();

  return {
    trackStarted: useCallback(
      () => {
        const tracker = getMetricsTracker();
        track('recording_started', 'feature');
        tracker.setUserMilestone('first_recording_at');
      },
      [track]
    ),

    trackPaused: useCallback(
      (durationSeconds: number) => {
        track('recording_paused', 'feature', { duration_seconds: durationSeconds });
      },
      [track]
    ),

    trackResumed: useCallback(
      () => {
        track('recording_resumed', 'feature');
      },
      [track]
    ),

    trackStopped: useCallback(
      (props: RecordingEventProperties) => {
        track('recording_stopped', 'feature', props);
      },
      [track]
    ),

    trackUploaded: useCallback(
      (props: RecordingEventProperties) => {
        const tracker = getMetricsTracker();
        track('recording_uploaded', 'feature', props);
        tracker.incrementUserProperty('total_recordings');
        tracker.incrementUserProperty('current_month_recordings');
        if (props.duration_seconds) {
          const minutes = props.duration_seconds / 60;
          tracker.incrementUserProperty('total_recording_minutes', minutes);
          tracker.incrementUserProperty('current_month_recording_minutes', minutes);
        }
      },
      [track]
    ),

    trackTranscribed: useCallback(
      (props: RecordingEventProperties) => {
        track('recording_transcribed', 'feature', props);
      },
      [track]
    ),

    trackFailed: useCallback(
      (error: string) => {
        track('recording_failed', 'error', { error_message: error });
      },
      [track]
    ),
  };
}

/**
 * Note event tracking
 */
export function useTrackNote() {
  const track = useTrackEvent();

  return {
    trackCreated: useCallback(
      (props: NoteEventProperties) => {
        const tracker = getMetricsTracker();
        track('note_created', 'feature', props);
        tracker.incrementUserProperty('total_notes');
      },
      [track]
    ),

    trackViewed: useCallback(
      (props: NoteEventProperties) => {
        track('note_viewed', 'engagement', props);
      },
      [track]
    ),

    trackEdited: useCallback(
      (props: NoteEventProperties) => {
        track('note_edited', 'engagement', props);
      },
      [track]
    ),

    trackDeleted: useCallback(
      (noteId: string) => {
        track('note_deleted', 'feature', { note_id: noteId });
      },
      [track]
    ),

    trackStarred: useCallback(
      (noteId: string) => {
        track('note_starred', 'engagement', { note_id: noteId });
      },
      [track]
    ),

    trackUnstarred: useCallback(
      (noteId: string) => {
        track('note_unstarred', 'engagement', { note_id: noteId });
      },
      [track]
    ),

    trackTagAdded: useCallback(
      (noteId: string, tag: string) => {
        track('note_tag_added', 'engagement', { note_id: noteId, tag });
      },
      [track]
    ),

    trackTagRemoved: useCallback(
      (noteId: string, tag: string) => {
        track('note_tag_removed', 'engagement', { note_id: noteId, tag });
      },
      [track]
    ),
  };
}

/**
 * Smartify event tracking
 */
export function useTrackSmartify() {
  const track = useTrackEvent();

  return {
    trackStarted: useCallback(
      (noteId: string) => {
        const tracker = getMetricsTracker();
        track('smartify_started', 'feature', { note_id: noteId });
        tracker.setUserMilestone('first_smartify_at');
      },
      [track]
    ),

    trackCompleted: useCallback(
      (props: SmartifyEventProperties) => {
        const tracker = getMetricsTracker();
        track('smartify_completed', 'feature', props);
        tracker.incrementUserProperty('total_smartify_runs');
        tracker.incrementUserProperty('current_month_smartify_runs');

        if (props.action_items_count) {
          tracker.incrementUserProperty('total_action_items_created', props.action_items_count);
        }
        if (props.brain_dump_count) {
          tracker.incrementUserProperty('total_brain_dump_items', props.brain_dump_count);
        }
      },
      [track]
    ),

    trackFailed: useCallback(
      (noteId: string, error: string) => {
        track('smartify_failed', 'error', { note_id: noteId, error_message: error });
      },
      [track]
    ),

    trackPreviewViewed: useCallback(
      (noteId: string) => {
        track('smartify_preview_viewed', 'engagement', { note_id: noteId });
      },
      [track]
    ),
  };
}

/**
 * Action item event tracking
 */
export function useTrackActionItem() {
  const track = useTrackEvent();

  return {
    trackViewed: useCallback(
      (itemId: string) => {
        track('action_item_viewed', 'engagement', { item_id: itemId });
      },
      [track]
    ),

    trackStatusChanged: useCallback(
      (props: ActionItemEventProperties) => {
        const tracker = getMetricsTracker();
        track('action_item_status_changed', 'feature', props);

        if (props.new_status === 'done') {
          track('action_item_completed', 'activation', props);
          tracker.incrementUserProperty('total_action_items_completed');
          tracker.setUserMilestone('first_action_item_completed_at');
        }
      },
      [track]
    ),

    trackEdited: useCallback(
      (props: ActionItemEventProperties) => {
        track('action_item_edited', 'engagement', props);
      },
      [track]
    ),

    trackDeleted: useCallback(
      (itemId: string) => {
        track('action_item_deleted', 'feature', { item_id: itemId });
      },
      [track]
    ),
  };
}

/**
 * Brain dump event tracking
 */
export function useTrackBrainDump() {
  const track = useTrackEvent();

  return {
    trackViewed: useCallback(
      () => {
        track('brain_dump_viewed', 'engagement');
      },
      [track]
    ),

    trackCategoryChanged: useCallback(
      (itemId: string, oldCategory: string, newCategory: string) => {
        track('brain_dump_item_category_changed', 'feature', {
          item_id: itemId,
          old_category: oldCategory,
          new_category: newCategory,
        });
      },
      [track]
    ),

    trackDeleted: useCallback(
      (itemId: string) => {
        track('brain_dump_item_deleted', 'feature', { item_id: itemId });
      },
      [track]
    ),
  };
}

/**
 * Ask (RAG) event tracking
 */
export function useTrackAsk() {
  const track = useTrackEvent();

  return {
    trackQuerySubmitted: useCallback(
      (props: AskEventProperties) => {
        const tracker = getMetricsTracker();
        track('ask_query_submitted', 'feature', props);
        tracker.setUserMilestone('first_ask_query_at');
        tracker.incrementUserProperty('total_ask_queries');
        tracker.incrementUserProperty('current_month_ask_queries');
      },
      [track]
    ),

    trackResponseReceived: useCallback(
      (props: AskEventProperties) => {
        track('ask_response_received', 'feature', props);
      },
      [track]
    ),

    trackCitationClicked: useCallback(
      (noteId: string) => {
        track('ask_citation_clicked', 'engagement', { note_id: noteId });
      },
      [track]
    ),

    trackFilterChanged: useCallback(
      (filter: string) => {
        track('ask_filter_changed', 'engagement', { filter });
      },
      [track]
    ),

    trackFollowupSubmitted: useCallback(
      (props: AskEventProperties) => {
        track('ask_followup_submitted', 'feature', { ...props, is_followup: true });
      },
      [track]
    ),
  };
}

/**
 * Investor update event tracking
 */
export function useTrackInvestorUpdate() {
  const track = useTrackEvent();

  return {
    trackViewed: useCallback(
      (updateId: string) => {
        track('investor_update_viewed', 'engagement', { update_id: updateId });
      },
      [track]
    ),

    trackEdited: useCallback(
      (updateId: string) => {
        track('investor_update_edited', 'engagement', { update_id: updateId });
      },
      [track]
    ),

    trackCopied: useCallback(
      (updateId: string) => {
        track('investor_update_copied', 'engagement', { update_id: updateId });
      },
      [track]
    ),

    trackSent: useCallback(
      (updateId: string) => {
        const tracker = getMetricsTracker();
        track('investor_update_sent', 'feature', { update_id: updateId });
        tracker.incrementUserProperty('total_investor_updates_sent');
      },
      [track]
    ),

    trackDeleted: useCallback(
      (updateId: string) => {
        track('investor_update_deleted', 'feature', { update_id: updateId });
      },
      [track]
    ),
  };
}

/**
 * Onboarding event tracking
 */
export function useTrackOnboarding() {
  const track = useTrackEvent();

  return {
    trackStarted: useCallback(
      () => {
        track('onboarding_started', 'activation');
      },
      [track]
    ),

    trackStepCompleted: useCallback(
      (step: number, stepName: string) => {
        track('onboarding_step_completed', 'activation', { step, step_name: stepName });
      },
      [track]
    ),

    trackCompleted: useCallback(
      () => {
        track('onboarding_completed', 'activation');
      },
      [track]
    ),

    trackUseCaseSelected: useCallback(
      (useCases: string[]) => {
        track('use_case_selected', 'activation', { use_cases: useCases });
      },
      [track]
    ),

    trackDemoStarted: useCallback(
      () => {
        track('demo_started', 'activation');
      },
      [track]
    ),

    trackDemoCompleted: useCallback(
      () => {
        track('demo_completed', 'activation');
      },
      [track]
    ),

    trackDemoSkipped: useCallback(
      () => {
        track('demo_skipped', 'activation');
      },
      [track]
    ),
  };
}

/**
 * Auth event tracking
 */
export function useTrackAuth() {
  const track = useTrackEvent();

  return {
    trackSignupStarted: useCallback(
      (method: 'email' | 'google' | 'apple') => {
        track('signup_started', 'acquisition', { method });
      },
      [track]
    ),

    trackSignupCompleted: useCallback(
      (method: 'email' | 'google' | 'apple') => {
        track('signup_completed', 'acquisition', { method });
      },
      [track]
    ),

    trackEmailConfirmed: useCallback(
      () => {
        track('email_confirmed', 'activation');
      },
      [track]
    ),

    trackLogin: useCallback(
      (method: 'email' | 'google' | 'apple') => {
        const tracker = getMetricsTracker();
        track('login', 'retention', { method });
        tracker.incrementUserProperty('total_sessions');
      },
      [track]
    ),

    trackLogout: useCallback(
      () => {
        track('logout', 'retention');
      },
      [track]
    ),

    trackOAuthStarted: useCallback(
      (provider: 'google' | 'apple') => {
        track('oauth_started', 'acquisition', { provider });
      },
      [track]
    ),

    trackOAuthCompleted: useCallback(
      (provider: 'google' | 'apple') => {
        track('oauth_completed', 'acquisition', { provider });
      },
      [track]
    ),
  };
}

/**
 * Error tracking
 */
export function useTrackError() {
  const track = useTrackEvent();

  return {
    trackError: useCallback(
      (props: ErrorEventProperties) => {
        track('error_occurred', 'error', props);
      },
      [track]
    ),

    trackAPIError: useCallback(
      (endpoint: string, statusCode: number, message: string) => {
        track('api_error', 'error', {
          endpoint,
          status_code: statusCode,
          error_message: message,
        });
      },
      [track]
    ),
  };
}

/**
 * API usage tracking
 */
export function useTrackAPIUsage() {
  const trackUsage = useCallback((usage: Omit<APIUsageData, 'userId'>) => {
    const tracker = getMetricsTracker();
    tracker.trackAPIUsage(usage);
  }, []);

  return trackUsage;
}

/**
 * Time on page tracking
 * Returns time spent when component unmounts
 */
export function useTimeOnPage(pageName: string) {
  const startTime = useRef(Date.now());
  const track = useTrackEvent();

  useEffect(() => {
    startTime.current = Date.now();

    return () => {
      const timeSpentMs = Date.now() - startTime.current;
      track('page_viewed', 'engagement', {
        page_name: pageName,
        time_spent_seconds: Math.floor(timeSpentMs / 1000),
      });
    };
  }, [pageName, track]);
}
