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
import { AlertCircle, Mail, Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-[#f0ebe6] w-full"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex justify-center mb-6"
          >
            <div className="h-20 w-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(189, 103, 80, 0.1)' }}>
              <Mail className="h-10 w-10" style={{ color: '#BD6750' }} />
            </div>
          </motion.div>
          <h1 className="text-2xl font-display text-[#1a1a1a] mb-2">Check your email</h1>
          <p className="text-[#666] font-body mb-4">
            We sent a confirmation link to <strong className="text-[#1a1a1a]">{email}</strong>
          </p>
          <p className="text-sm text-[#888] font-body mb-6">
            Click the link in the email to activate your account, then come back to sign in.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-lg font-body"
            style={{ backgroundColor: '#BD6750' }}
          >
            Go to Sign In
          </a>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-[#f0ebe6] w-full"
    >
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>
        <h1 className="text-2xl font-semibold font-body text-[#1a1a1a] mb-2">
          Create your account
        </h1>
        <p className="text-[#666] font-body">
          Transform your voice into actionable content
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[#1a1a1a] font-medium font-body">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="h-12 bg-[#faf8f6] border-[#e5e0db] text-[#1a1a1a] placeholder:text-[#999] focus:border-[#BD6750] focus:ring-2 focus:ring-[#BD6750]/20 focus:ring-offset-0 rounded-xl font-body"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[#1a1a1a] font-medium font-body">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={isLoading}
              className="h-12 bg-[#faf8f6] border-[#e5e0db] text-[#1a1a1a] placeholder:text-[#999] focus:border-[#BD6750] focus:ring-2 focus:ring-[#BD6750]/20 focus:ring-offset-0 rounded-xl font-body pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#1a1a1a] transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-start space-x-3 pt-2">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            disabled={isLoading}
            className="mt-0.5 border-[#d4cfc9] data-[state=checked]:bg-[#BD6750] data-[state=checked]:border-[#BD6750]"
          />
          <Label htmlFor="terms" className="text-sm font-normal text-[#444] leading-tight cursor-pointer font-body">
            I agree to the{' '}
            <a href="/terms" className="text-[#BD6750] hover:underline font-medium">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-[#BD6750] hover:underline font-medium">Privacy Policy</a>
          </Label>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2"
          >
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 font-body">{error}</p>
          </motion.div>
        )}

        <Button
          type="submit"
          size="xl"
          className="w-full rounded-xl font-semibold transition-all duration-300 hover:shadow-lg font-body"
          style={{ backgroundColor: '#BD6750', color: 'white' }}
          disabled={isLoading || !email || !password || !agreedToTerms}
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-[#666] mt-8 font-body">
        Already have an account?{' '}
        <a href="/login" className="hover:underline font-semibold" style={{ color: '#BD6750' }}>Sign in</a>
      </p>
    </motion.div>
  )
}
