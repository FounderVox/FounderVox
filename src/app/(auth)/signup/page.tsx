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
import { AlertCircle, Mail } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false)
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

        // Handle specific error cases
        if (signUpError.message?.toLowerCase().includes('user already registered')) {
          setError('An account with this email already exists. Please sign in instead.')
        } else {
          setError(signUpError.message)
        }
        setIsLoading(false)
        return
      }

      if (!data.user) {
        setError('Failed to create account. Please try again.')
        setIsLoading(false)
        return
      }

      console.log('[Signup] User created:', data.user.id)

      // Always require email confirmation - never auto-redirect
      // This ensures users verify their email before accessing the app
      console.log('[Signup] User created, requiring email confirmation')
      setNeedsEmailConfirmation(true)
      setIsLoading(false)
      return
    } catch (err) {
      console.error('[Signup] Unexpected error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  // Show email confirmation message
  if (needsEmailConfirmation) {
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
            <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="h-10 w-10 text-blue-600" />
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold text-black mb-2">Check your email</h1>
          <p className="text-gray-600 mb-4">
            We sent a confirmation link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Click the link in the email to activate your account, then come back to sign in.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Go to Sign In
          </a>
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
