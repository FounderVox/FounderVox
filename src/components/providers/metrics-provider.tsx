'use client';

/**
 * Metrics Provider Component
 *
 * Initializes metrics tracking and provides automatic:
 * - Session management
 * - Page view tracking
 * - User ID syncing with auth
 *
 * Add this to your root layout to enable metrics tracking.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
  useMetricsInit,
  useMetricsUser,
  getMetricsTracker,
} from '@/lib/metrics';

interface MetricsProviderProps {
  children: React.ReactNode;
}

export function MetricsProvider({ children }: MetricsProviderProps) {
  const pathname = usePathname();
  const { user, profile } = useAuth();

  // Initialize metrics tracking
  useMetricsInit(user?.id);

  // Sync user ID with auth state
  useMetricsUser(user?.id);

  // Track page views
  useEffect(() => {
    const tracker = getMetricsTracker();
    tracker.trackPageView(pathname);
  }, [pathname]);

  // Update session with user properties when profile changes
  useEffect(() => {
    if (!user?.id || !profile) return;

    const tracker = getMetricsTracker();

    // Check for milestone achievements based on profile
    if (profile.onboarding_completed) {
      tracker.track('onboarding_completed', 'activation');
    }

    if (profile.demo_completed) {
      tracker.track('demo_completed', 'activation');
    }
  }, [user?.id, profile]);

  return <>{children}</>;
}
