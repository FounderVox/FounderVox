/**
 * Device Detection Utilities
 *
 * Detect device type, browser, OS without using IP-based geolocation.
 * Only captures timezone for location context.
 */

import { DeviceType } from './types';

export interface DeviceInfo {
  deviceType: DeviceType;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenWidth: number;
  screenHeight: number;
  timezone: string;
  language: string;
}

/**
 * Detect device type based on user agent and screen size
 */
export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';

  const ua = navigator.userAgent.toLowerCase();
  const screenWidth = window.screen.width;

  // Check for tablet indicators
  const isTablet =
    /ipad|tablet|playbook|silk/i.test(ua) ||
    (!/mobile/i.test(ua) && /android/i.test(ua)) ||
    (screenWidth >= 768 && screenWidth <= 1024 && 'ontouchstart' in window);

  // Check for mobile indicators
  const isMobile =
    /mobile|iphone|ipod|android.*mobile|blackberry|opera mini|iemobile/i.test(ua) ||
    (screenWidth < 768 && 'ontouchstart' in window);

  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
}

/**
 * Detect browser name and version
 */
export function detectBrowser(): { name: string; version: string } {
  if (typeof window === 'undefined') {
    return { name: 'unknown', version: 'unknown' };
  }

  const ua = navigator.userAgent;
  let name = 'unknown';
  let version = 'unknown';

  // Order matters - more specific patterns first
  if (/Edg/i.test(ua)) {
    name = 'Edge';
    version = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || 'unknown';
  } else if (/OPR|Opera/i.test(ua)) {
    name = 'Opera';
    version = ua.match(/(?:OPR|Opera)\/(\d+\.\d+)/)?.[1] || 'unknown';
  } else if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) {
    name = 'Chrome';
    version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'unknown';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    name = 'Safari';
    version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'unknown';
  } else if (/Firefox/i.test(ua)) {
    name = 'Firefox';
    version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'unknown';
  } else if (/MSIE|Trident/i.test(ua)) {
    name = 'IE';
    version = ua.match(/(?:MSIE |rv:)(\d+\.\d+)/)?.[1] || 'unknown';
  }

  return { name, version };
}

/**
 * Detect operating system and version
 */
export function detectOS(): { name: string; version: string } {
  if (typeof window === 'undefined') {
    return { name: 'unknown', version: 'unknown' };
  }

  const ua = navigator.userAgent;
  let name = 'unknown';
  let version = 'unknown';

  if (/Windows NT/i.test(ua)) {
    name = 'Windows';
    const ntVersion = ua.match(/Windows NT (\d+\.\d+)/)?.[1];
    // Map NT versions to Windows versions
    const versionMap: Record<string, string> = {
      '10.0': '10/11',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
      '6.0': 'Vista',
      '5.1': 'XP',
    };
    version = ntVersion ? versionMap[ntVersion] || ntVersion : 'unknown';
  } else if (/Mac OS X/i.test(ua)) {
    name = 'macOS';
    version = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || 'unknown';
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    name = 'iOS';
    version = ua.match(/OS (\d+[._]\d+)/)?.[1]?.replace('_', '.') || 'unknown';
  } else if (/Android/i.test(ua)) {
    name = 'Android';
    version = ua.match(/Android (\d+\.?\d*)/)?.[1] || 'unknown';
  } else if (/Linux/i.test(ua)) {
    name = 'Linux';
    version = 'unknown';
  } else if (/CrOS/i.test(ua)) {
    name = 'ChromeOS';
    version = ua.match(/CrOS \w+ (\d+\.\d+)/)?.[1] || 'unknown';
  }

  return { name, version };
}

/**
 * Get user's timezone (IANA timezone identifier)
 */
export function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'unknown';
  }
}

/**
 * Get user's preferred language
 */
export function getLanguage(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  return navigator.language || 'unknown';
}

/**
 * Get screen dimensions
 */
export function getScreenSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  return {
    width: window.screen.width,
    height: window.screen.height,
  };
}

/**
 * Get all device info
 */
export function getDeviceInfo(): DeviceInfo {
  const browser = detectBrowser();
  const os = detectOS();
  const screen = getScreenSize();

  return {
    deviceType: detectDeviceType(),
    browser: browser.name,
    browserVersion: browser.version,
    os: os.name,
    osVersion: os.version,
    screenWidth: screen.width,
    screenHeight: screen.height,
    timezone: getTimezone(),
    language: getLanguage(),
  };
}

/**
 * Generate a stable anonymous ID for the device
 * Uses localStorage to persist across sessions
 */
export function getOrCreateAnonymousId(): string {
  if (typeof window === 'undefined') {
    return `server-${Date.now()}`;
  }

  const storageKey = 'fv_anonymous_id';
  let anonymousId = localStorage.getItem(storageKey);

  if (!anonymousId) {
    // Generate a UUID-like ID
    anonymousId = 'anon-' + crypto.randomUUID();
    localStorage.setItem(storageKey, anonymousId);
  }

  return anonymousId;
}

/**
 * Parse UTM parameters from URL
 */
export function getUTMParams(): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
} {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);

  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
    utmTerm: params.get('utm_term') || undefined,
    utmContent: params.get('utm_content') || undefined,
  };
}
