/**
 * Metrics Track API Route
 *
 * Receives batched events from the client-side tracker.
 * Used primarily via sendBeacon for reliable event delivery on page close.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, sessionId } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ success: true, message: 'No events to track' });
    }

    // Get authenticated user (if any)
    const userClient = await createClient();
    const { data: { user } } = await userClient.auth.getUser();

    // Validate that authenticated events have matching user_id
    for (const event of events) {
      if (event.userId && user && event.userId !== user.id) {
        console.error('[Metrics API] User ID mismatch:', { eventUserId: event.userId, authUserId: user.id });
        return NextResponse.json(
          { success: false, error: 'User ID mismatch' },
          { status: 403 }
        );
      }
    }

    const supabase = createServiceRoleClient();

    // Transform and insert events
    const dbEvents = events.map((e: Record<string, unknown>) => ({
      user_id: e.userId || null,
      anonymous_id: e.anonymousId,
      session_id: e.sessionId || sessionId,
      event_name: e.eventName,
      event_category: e.eventCategory,
      event_properties: e.eventProperties || {},
      platform: e.platform || 'web',
      app_version: e.appVersion,
      page_path: e.pagePath,
      referrer: e.referrer,
      timezone: e.timezone,
      device_type: e.deviceType,
      browser: e.browser,
      os: e.os,
      screen_width: e.screenWidth,
      screen_height: e.screenHeight,
      client_timestamp: e.clientTimestamp,
    }));

    const { error } = await supabase.from('user_events').insert(dbEvents);

    if (error) {
      console.error('[Metrics API] Failed to insert events:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: events.length });
  } catch (error) {
    console.error('[Metrics API] Error processing request:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Support for sendBeacon (which sends with text/plain content type)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
