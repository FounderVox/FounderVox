import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup', '/auth/callback', '/pricing', '/download']

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/welcome', '/use-cases', '/support']

// Routes that require payment (subset of protected routes)
const paidRoutes = ['/dashboard']

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

  // Check if route requires payment
  const isPaidRoute = paidRoutes.some((route) => pathname.startsWith(route))

  // OPTIMIZATION: Fetch profile data ONCE if user is authenticated and needs routing decisions
  const isOnboardingRoute = pathname === '/welcome' || pathname === '/use-cases' || pathname === '/support'
  const needsProfileCheck = user && (isAuthRoute || isOnboardingRoute || isPaidRoute)

  let profile: { onboarding_completed: boolean; is_paid_beta: boolean } | null = null
  if (needsProfileCheck) {
    const { data } = await supabase
      .from('profiles')
      .select('onboarding_completed, is_paid_beta')
      .eq('id', user.id)
      .single()
    profile = data
  }

  if (isAuthRoute && user) {
    console.log('[FounderNote:Middleware] Authenticated user on auth page, redirecting')
    // If user has paid, go to dashboard
    if (profile?.is_paid_beta) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // If onboarding completed but not paid, go to support/payment page
    if (profile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/support', request.url))
    }
    // Otherwise, start onboarding
    return NextResponse.redirect(new URL('/welcome', request.url))
  }

  // For paid routes (dashboard), require is_paid_beta
  if (user && isPaidRoute) {
    if (!profile?.is_paid_beta) {
      console.log('[FounderNote:Middleware] User has not paid, redirecting to support page')
      // If onboarding not completed, go to welcome first
      if (!profile?.onboarding_completed) {
        return NextResponse.redirect(new URL('/welcome', request.url))
      }
      // Otherwise, go to support/payment page
      return NextResponse.redirect(new URL('/support', request.url))
    }
  }

  // For onboarding routes (welcome, use-cases), ensure user hasn't completed onboarding
  if (user && (pathname === '/welcome' || pathname === '/use-cases')) {
    if (profile?.onboarding_completed) {
      // If paid, go to dashboard; otherwise go to support
      if (profile?.is_paid_beta) {
        console.log('[FounderNote:Middleware] Onboarding completed and paid, redirecting to dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        console.log('[FounderNote:Middleware] Onboarding completed but not paid, redirecting to support')
        return NextResponse.redirect(new URL('/support', request.url))
      }
    }
  }

  // For support page, if user has already paid, redirect to dashboard
  if (user && pathname === '/support') {
    if (profile?.is_paid_beta) {
      console.log('[FounderNote:Middleware] User already paid, redirecting to dashboard')
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
