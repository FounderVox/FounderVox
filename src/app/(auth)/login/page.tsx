'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Logo } from '@/components/shared/logo'
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Show success message if coming from signup
    if (searchParams.get('signup') === 'success') {
      // Could show a success message here
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('[Login] Error:', signInError)
        console.error('[Login] Error details:', {
          message: signInError.message,
          status: signInError.status,
          name: signInError.name
        })

        // Check if it's an email not confirmed error
        if (signInError.message?.toLowerCase().includes('email not confirmed') ||
            signInError.message?.toLowerCase().includes('email verification')) {
          setError('Please verify your email before logging in. Check your inbox for the verification link.')
        } else if (signInError.message?.toLowerCase().includes('invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else {
          setError(signInError.message || 'Invalid email or password. Please try again.')
        }

        setIsLoading(false)
        return
      }

      if (!data.user) {
        setError('Login failed. Please try again.')
        setIsLoading(false)
        return
      }

      console.log('[Login] Success, checking profile...')

      // Get profile to check onboarding status
      let profile = null
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_completed, demo_completed')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.error('[Login] Profile error:', profileError)
        
        // If profile doesn't exist, create it
        if (profileError.code === 'PGRST116') {
          console.log('[Login] Profile not found, creating it...')
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              display_name: data.user.email?.split('@')[0] || 'User',
              onboarding_completed: false,
              onboarding_step: 0,
              recordings_count: 0,
              demo_completed: false,
              use_cases: [],
              subscription_tier: 'free',
            })

          if (insertError) {
            console.error('[Login] Failed to create profile:', insertError)
            // Continue anyway - user can still proceed
          } else {
            console.log('[Login] Profile created successfully')
            profile = {
              onboarding_completed: false,
              demo_completed: false
            }
          }
        }
      } else {
        profile = profileData
      }

      console.log('[Login] Profile status:', {
        onboarding_completed: profile?.onboarding_completed,
        demo_completed: profile?.demo_completed
      })

      // Refresh session to ensure cookies are set
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        console.error('[Login] Error refreshing session:', refreshError)
      }
      
      // Wait for cookies to be set in the response
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Use window.location for full page reload to ensure cookies are read by middleware
      // But first verify the session is set
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('[Login] No session after login, this should not happen')
        setError('Session not created. Please try again.')
        setIsLoading(false)
        return
      }
      
      // Redirect based on onboarding status
      if (profile?.onboarding_completed) {
        if (profile.demo_completed) {
          console.log('[Login] Redirecting to dashboard')
          window.location.href = '/dashboard'
        } else {
          console.log('[Login] Redirecting to demo')
          window.location.href = '/demo'
        }
      } else {
        console.log('[Login] Redirecting to welcome (onboarding)')
        window.location.href = '/welcome'
      }
    } catch (err) {
      console.error('[Login] Unexpected error:', err)
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="glass-card-light p-8 md:p-10 shadow-xl w-full"
    >
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>
        <h1 className="text-2xl font-bold mb-2">
          Sign in to <span className="text-black">Founder</span> <span className="text-black">Note</span>
        </h1>
        <p className="text-gray-600">
          Enter your email and password to continue
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5 mb-8">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-black font-medium">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="h-12 bg-white/60 border-gray-300 text-black placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-300 focus:ring-offset-0"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-black font-medium">Password</Label>
            <a href="/forgot-password" className="text-sm text-black hover:underline font-medium">
              Forgot password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-12 bg-white/60 border-gray-300 text-black placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-300 focus:ring-offset-0"
          />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-2"
          >
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}

        <Button
          type="submit"
          size="xl"
          className="w-full bg-black hover:bg-black text-white shadow-lg backdrop-blur-sm border border-black/10"
          disabled={isLoading || !email || !password}
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      <div>
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-gray-500 font-medium">
              or continue with
            </span>
          </div>
        </div>
        <SocialAuthButtons mode="login" />
      </div>

      <p className="text-center text-sm text-gray-600 mt-8">
        Don&apos;t have an account?{' '}
        <a href="/signup" className="hover:underline font-semibold" style={{ color: '#BD6750' }}>Sign up</a>
      </p>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="glass-card-light p-8 md:p-10 shadow-xl w-full">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-black border-t-transparent" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
