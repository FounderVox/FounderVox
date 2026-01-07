'use client'

import { useState } from 'react'

export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/shared/logo'
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Mail, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react'

type ViewState = 'main' | 'email-form' | 'verification-sent'

export default function SignupPage() {
  const [view, setView] = useState<ViewState>('main')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  console.log('[FounderVox:Auth] Signup page rendered, current view:', view)

  const handleEmailSignup = async (e: React.FormEvent) => {
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

    console.log('[FounderVox:Auth] Starting email signup for:', email)
    setIsLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        console.error('[FounderVox:Auth] Signup error:', signUpError.message)
        throw signUpError
      }

      console.log('[FounderVox:Auth] Signup successful, showing verification screen')
      setView('verification-sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass-card-light p-8 md:p-10"
    >
      <AnimatePresence mode="wait">
        {/* Main Signup View */}
        {view === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Logo size="lg" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Create your account
              </h1>
              <p className="text-gray-500">
                Transform your voice into actionable content
              </p>
            </div>

            <div className="space-y-4">
              <SocialAuthButtons mode="signup" />

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-gray-400 font-medium">
                    or continue with
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="xl"
                className="w-full border-gray-200 hover:bg-gray-50 text-gray-700"
                onClick={() => setView('email-form')}
              >
                <Mail className="mr-2 h-5 w-5" />
                Sign up with Email
              </Button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-8">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </motion.div>
        )}

        {/* Email Form View */}
        {view === 'email-form' && (
          <motion.div
            key="email-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setView('main')}
              className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>

            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Sign up with email
              </h1>
              <p className="text-gray-500">
                Enter your details to create your account
              </p>
            </div>

            <form onSubmit={handleEmailSignup} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 border-gray-200 focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={isLoading}
                  className="h-12 border-gray-200 focus:border-primary focus:ring-primary"
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
                <Label htmlFor="terms" className="text-sm font-normal text-gray-600 leading-tight cursor-pointer">
                  I agree to the{' '}
                  <a href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </Label>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-red-50 border border-red-100"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              <Button
                type="submit"
                size="xl"
                className="w-full"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </motion.div>
        )}

        {/* Verification Sent View */}
        {view === 'verification-sent' && (
          <motion.div
            key="verification"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Check your inbox
              </h1>
              <p className="text-gray-500 mb-2">
                We&apos;ve sent a verification link to
              </p>
              <p className="font-medium text-gray-900 mb-6">{email}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center justify-center gap-2 text-primary mb-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-medium text-sm">Pro tip</span>
                </div>
                <p className="text-sm text-gray-600">
                  Click the link in your email to verify your account and start capturing voice notes
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setView('main')
                  setEmail('')
                  setPassword('')
                  setAgreedToTerms(false)
                }}
              >
                Back to sign up
              </Button>

              <p className="text-sm text-gray-400">
                Didn&apos;t receive the email? Check your spam folder
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
