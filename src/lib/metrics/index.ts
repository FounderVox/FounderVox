/**
 * Beta Metrics Tracking Module
 *
 * Comprehensive user metrics tracking for beta launch
 * econometrics and pricing analysis.
 *
 * @example
 * ```tsx
 * // In root layout - initialize tracking
 * import { useMetricsInit, useMetricsUser, usePageViewTracking } from '@/lib/metrics';
 *
 * export default function RootLayout({ children }) {
 *   useMetricsInit();
 *   return <>{children}</>;
 * }
 *
 * // In auth context - update user ID
 * const { user } = useAuth();
 * useMetricsUser(user?.id);
 *
 * // In pages - automatic page view tracking
 * usePageViewTracking();
 *
 * // In components - track specific events
 * const { trackStarted, trackStopped } = useTrackRecording();
 * trackStarted();
 * trackStopped({ duration_seconds: 120 });
 * ```
 */

// Core tracker
export { getMetricsTracker, resetMetricsTracker, MetricsTracker } from './tracker';

// Types
export type {
  CoreEventName,
  EventCategory,
  EventProperties,
  Platform,
  DeviceType,
  SessionData,
  UserProperties,
  APIUsageData,
  OperationType,
  AIProvider,
  MetricsConfig,
  TrackEventPayload,
  RecordingEventProperties,
  NoteEventProperties,
  SmartifyEventProperties,
  ActionItemEventProperties,
  AskEventProperties,
  ErrorEventProperties,
} from './types';

// Hooks
export {
  useMetricsInit,
  useMetricsUser,
  usePageViewTracking,
  useTrackEvent,
  useTrackRecording,
  useTrackNote,
  useTrackSmartify,
  useTrackActionItem,
  useTrackBrainDump,
  useTrackAsk,
  useTrackInvestorUpdate,
  useTrackOnboarding,
  useTrackAuth,
  useTrackError,
  useTrackAPIUsage,
  useTimeOnPage,
} from './hooks';

// Device utilities
export {
  getDeviceInfo,
  detectDeviceType,
  detectBrowser,
  detectOS,
  getTimezone,
  getOrCreateAnonymousId,
  getUTMParams,
} from './device';
