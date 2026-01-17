import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup', '/auth/callback', '/pricing', '/download']

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/welcome', '/use-cases', '/demo']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('[FounderNote:Middleware] Processing:', pathname)

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const { user, supabaseResponse, supabase } = await updateSession(request)

  // If Supabase is not configured, allow access to public routes only
  if (!supabase) {
    console.warn('[FounderNote:Middleware] Supabase not configured, allowing public access')
    return supabaseResponse
  }

  // Allow landing page at root - no redirect needed
  if (pathname === '/') {
    console.log('[FounderNote:Middleware] Landing page at root, allowing access')
    return supabaseResponse
  }

  // Check if trying to access protected route without auth
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    console.log('[FounderNote:Middleware] Protected route without auth, redirecting to login')
    // Only redirect if not already on login page to prevent loops
    if (pathname !== '/login') {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Block users with unconfirmed emails from protected routes
  if (isProtectedRoute && user && !user.email_confirmed_at) {
    console.log('[FounderNote:Middleware] User email not confirmed, redirecting to login')
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('message', 'email_not_confirmed')
    return NextResponse.redirect(redirectUrl)
  }

  // Check if authenticated user is trying to access auth pages (but not landing/pricing/download)
  const isAuthRoute = ['/login', '/signup'].some((route) =>
    pathname.startsWith(route)
  )

  // OPTIMIZATION: Fetch profile data ONCE if user is authenticated and needs routing decisions
  // This replaces 4 separate queries with 1 query
  const needsProfileCheck = user && (
    isAuthRoute ||
    pathname === '/welcome' ||
    pathname === '/use-cases' ||
    pathname === '/demo'
  )

  let profile: { onboarding_completed: boolean; demo_completed: boolean } | null = null
  if (needsProfileCheck) {
    const { data } = await supabase
      .from('profiles')
      .select('onboarding_completed, demo_completed')
      .eq('id', user.id)
      .single()
    profile = data
  }

  if (isAuthRoute && user) {
    console.log('[FounderNote:Middleware] Authenticated user on auth page, redirecting')
    if (profile?.onboarding_completed) {
      if (profile.demo_completed) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/demo', request.url))
      }
    }
    return NextResponse.redirect(new URL('/welcome', request.url))
  }

  // For onboarding routes, ensure user hasn't completed onboarding
  if (user && (pathname === '/welcome' || pathname === '/use-cases')) {
    if (profile?.onboarding_completed) {
      console.log('[FounderNote:Middleware] Onboarding completed, redirecting to demo or dashboard')
      if (profile.demo_completed) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/demo', request.url))
      }
    }
  }

  // For demo route, check if user has completed onboarding
  if (user && pathname === '/demo') {
    if (!profile?.onboarding_completed) {
      console.log('[FounderNote:Middleware] Onboarding not completed, redirecting to welcome')
      return NextResponse.redirect(new URL('/welcome', request.url))
    }

    if (profile?.demo_completed) {
      console.log('[FounderNote:Middleware] Demo already completed, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
