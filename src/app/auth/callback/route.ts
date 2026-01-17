import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/welcome'

  // Handle OAuth errors from provider
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription || 'Authentication failed')}`
    )
  }

  if (!code) {
    console.error('[Auth Callback] No code provided')
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  try {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[Auth Callback] Code exchange error:', exchangeError)
      return NextResponse.redirect(
        `${origin}/login?error=exchange_failed&message=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // Get user and check onboarding status
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      console.log('[Auth Callback] User authenticated:', user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, demo_completed')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_completed) {
        if (profile.demo_completed) {
          return NextResponse.redirect(`${origin}/dashboard`)
        }
        return NextResponse.redirect(`${origin}/demo`)
      }
    }

    return NextResponse.redirect(`${origin}${next}`)
  } catch (err) {
    console.error('[Auth Callback] Unexpected error:', err)
    return NextResponse.redirect(`${origin}/login?error=callback_error`)
  }
}
