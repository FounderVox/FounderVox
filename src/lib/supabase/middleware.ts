import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip auth if Supabase not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[FounderNote:Middleware] Supabase credentials not configured')
    return { user: null, supabaseResponse, supabase: null }
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Add 3-second timeout to prevent blocking all page navigation indefinitely
  let user = null
  try {
    const getUserWithTimeout = Promise.race([
      supabase.auth.getUser(),
      new Promise<{ data: { user: null } }>((_, reject) =>
        setTimeout(() => reject(new Error('getUser timeout after 3s')), 3000)
      )
    ])
    const result = await getUserWithTimeout
    user = result.data.user
  } catch (e) {
    console.warn('[FounderNote:Middleware] getUser timed out, treating as unauthenticated:', e)
    // Graceful fallback: treat as unauthenticated, user can retry navigation
  }

  console.log('[FounderNote:Middleware] User:', user ? user.email : 'Not authenticated')

  return { user, supabaseResponse, supabase }
}
