'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Logo } from '@/components/shared/logo'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      // Sign up user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        console.error('[Signup] Error:', signUpError)
        setError(signUpError.message)
        setIsLoading(false)
        return
      }

      if (!data.user) {
        setError('Failed to create account. Please try again.')
        setIsLoading(false)
        return
      }

      console.log('[Signup] User created:', data.user.id)

      // The trigger should automatically create the profile
      // Wait and check multiple times to give the trigger time to execute
      let profileExists = false
      let attempts = 0
      const maxAttempts = 5

      while (!profileExists && attempts < maxAttempts) {
        // Wait before checking (longer wait on first attempt)
        await new Promise(resolve => setTimeout(resolve, attempts === 0 ? 1000 : 500))

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (profile && !profileError) {
          profileExists = true
          console.log(`[Signup] Profile found (created by trigger) on attempt ${attempts + 1}`)
          break
        }

        attempts++
        console.log(`[Signup] Profile not found yet, attempt ${attempts}/${maxAttempts}`)
      }

      // If profile still doesn't exist after all attempts, the trigger might have failed
      // But that's okay - the user can still log in and we'll handle profile creation then
      // OR the profile might exist but we couldn't read it due to RLS (unlikely but possible)
      if (!profileExists) {
        console.warn('[Signup] Profile not found after all attempts - trigger may have failed')
        console.warn('[Signup] User can still log in - profile will be created on login if needed')
        // Don't show error - just proceed to login
        // The login page will handle profile creation if needed
      }

      console.log('[Signup] Success! Auto-logging in and redirecting to welcome...')
      setSuccess(true)

      // Auto-login is already done by signUp (user is authenticated)
      // Redirect to welcome page after 1.5 seconds
      // Use window.location.href to ensure cookies are set before redirect
      setTimeout(() => {
        window.location.href = '/welcome'
      }, 1500)
    } catch (err) {
      console.error('[Signup] Unexpected error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card-light p-8 md:p-10 shadow-xl w-full"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex justify-center mb-6"
          >
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold text-black mb-2">Welcome to FounderNote!</h1>
          <p className="text-gray-600">Taking you to onboarding...</p>
        </div>
      </motion.div>
    )
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
        <h1 className="text-2xl font-bold text-black mb-2">
          Create your account
        </h1>
        <p className="text-gray-600">
          Transform your voice into actionable content
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-5">
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
          <Label htmlFor="password" className="text-black font-medium">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={isLoading}
            className="h-12 bg-white/60 border-gray-300 text-black placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-300 focus:ring-offset-0"
          />
        </div>

        <div className="flex items-start space-x-3 pt-2">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            disabled={isLoading}
            className="mt-0.5"
          />
          <Label htmlFor="terms" className="text-sm font-normal text-black leading-tight cursor-pointer">
            I agree to the{' '}
            <a href="/terms" className="text-black hover:underline font-medium">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-black hover:underline font-medium">Privacy Policy</a>
          </Label>
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
          disabled={isLoading || !email || !password || !agreedToTerms}
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-8">
        Already have an account?{' '}
        <a href="/login" className="text-black hover:underline font-semibold">Sign in</a>
      </p>
    </motion.div>
  )
}
