import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/auth/callback']

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/welcome', '/use-cases', '/demo']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('[FounderVox:Middleware] Processing:', pathname)

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
    console.warn('[FounderVox:Middleware] Supabase not configured, allowing public access')
    return supabaseResponse
  }

  // Handle root redirect
  if (pathname === '/') {
    if (user) {
      console.log('[FounderVox:Middleware] Authenticated user at root, checking onboarding')
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, demo_completed')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_completed) {
        if (profile.demo_completed) {
          console.log('[FounderVox:Middleware] Redirecting to dashboard')
          return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
          console.log('[FounderVox:Middleware] Redirecting to demo')
          return NextResponse.redirect(new URL('/demo', request.url))
        }
      }
      console.log('[FounderVox:Middleware] Redirecting to welcome (onboarding)')
      return NextResponse.redirect(new URL('/welcome', request.url))
    }
    console.log('[FounderVox:Middleware] Unauthenticated, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check if trying to access protected route without auth
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    console.log('[FounderVox:Middleware] Protected route without auth, redirecting to login')
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check if authenticated user is trying to access auth pages
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isPublicRoute && user) {
    console.log('[FounderVox:Middleware] Authenticated user on auth page, redirecting')
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/welcome', request.url))
  }

  // For onboarding routes, ensure user hasn't completed onboarding
  if (user && (pathname === '/welcome' || pathname === '/use-cases')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile?.onboarding_completed) {
      console.log('[FounderVox:Middleware] Onboarding completed, redirecting to demo or dashboard')
      // Check if demo is completed
      const { data: demoProfile } = await supabase
        .from('profiles')
        .select('demo_completed')
        .eq('id', user.id)
        .single()
      
      if (demoProfile?.demo_completed) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/demo', request.url))
      }
    }
  }

  // For demo route, check if user has completed onboarding
  if (user && pathname === '/demo') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed, demo_completed')
      .eq('id', user.id)
      .single()

    if (!profile?.onboarding_completed) {
      console.log('[FounderVox:Middleware] Onboarding not completed, redirecting to welcome')
      return NextResponse.redirect(new URL('/welcome', request.url))
    }

    if (profile?.demo_completed) {
      console.log('[FounderVox:Middleware] Demo already completed, redirecting to dashboard')
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
