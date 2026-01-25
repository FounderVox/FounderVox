'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Logo } from '@/components/shared/logo'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Eye, EyeOff, CheckCircle2, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        console.log('[ResetPassword] Valid session found')
        setIsValidSession(true)
      } else {
        console.log('[ResetPassword] No valid session')
        setIsValidSession(false)
      }
    }

    // Listen for auth state changes (recovery link will trigger this)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[ResetPassword] Auth event:', event)
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[ResetPassword] Password recovery event received')
        setIsValidSession(true)
      } else if (event === 'SIGNED_IN' && session) {
        setIsValidSession(true)
      }
    })

    checkSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        console.error('[ResetPassword] Error:', updateError)

        if (updateError.message?.toLowerCase().includes('same password')) {
          setError('New password must be different from your current password.')
        } else if (updateError.message?.toLowerCase().includes('weak password')) {
          setError('Please choose a stronger password with at least 8 characters.')
        } else {
          setError(updateError.message || 'Failed to reset password. Please try again.')
        }
        setIsLoading(false)
        return
      }

      console.log('[ResetPassword] Password updated successfully')
      setSuccess(true)
      setIsLoading(false)

      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } catch (err) {
      console.error('[ResetPassword] Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  // Loading state
  if (isValidSession === null) {
    return (
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-[#f0ebe6] w-full">
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#BD6750] border-t-transparent" />
        </div>
      </div>
    )
  }

  // Invalid/expired session
  if (!isValidSession) {
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
            <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
          </motion.div>

          <h1 className="text-2xl font-semibold font-body text-[#1a1a1a] mb-2">
            Link Expired
          </h1>
          <p className="text-[#666] font-body mb-6">
            This password reset link has expired or is invalid. Please request a new one.
          </p>

          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-lg hover:opacity-90 font-body"
            style={{ backgroundColor: '#BD6750' }}
          >
            Request New Link
            <ArrowRight className="h-4 w-4" />
          </Link>

          <p className="text-sm text-[#888] font-body mt-6">
            Or{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: '#BD6750' }}>
              sign in
            </Link>
            {' '}if you remember your password
          </p>
        </div>
      </motion.div>
    )
  }

  // Success state
  if (success) {
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
            <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
          </motion.div>

          <h1 className="text-2xl font-semibold font-body text-[#1a1a1a] mb-2">
            Password Reset!
          </h1>
          <p className="text-[#666] font-body mb-2">
            Your password has been successfully updated.
          </p>
          <p className="text-sm text-[#888] font-body mb-6">
            Redirecting you to the dashboard...
          </p>

          <div className="flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-[#BD6750] border-t-transparent" />
          </div>
        </div>
      </motion.div>
    )
  }

  // Reset password form
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
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="flex justify-center mb-4"
        >
          <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(189, 103, 80, 0.1)' }}>
            <Lock className="h-8 w-8" style={{ color: '#BD6750' }} />
          </div>
        </motion.div>
        <h1 className="text-2xl font-semibold font-body text-[#1a1a1a] mb-2">
          Set new password
        </h1>
        <p className="text-[#666] font-body">
          Your new password must be at least 8 characters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-[#1a1a1a] font-medium font-body">
            New password
          </Label>
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
              className="h-12 bg-[#faf8f6] border-[#e5e0db] text-[#1a1a1a] placeholder:text-[#999] focus:border-[#BD6750] focus:ring-2 focus:ring-[#BD6750]/20 focus:ring-offset-0 rounded-xl font-body pr-12 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
              autoFocus
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-[#1a1a1a] font-medium font-body">
            Confirm new password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              disabled={isLoading}
              className="h-12 bg-[#faf8f6] border-[#e5e0db] text-[#1a1a1a] placeholder:text-[#999] focus:border-[#BD6750] focus:ring-2 focus:ring-[#BD6750]/20 focus:ring-offset-0 rounded-xl font-body pr-12 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#1a1a1a] transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Password match indicator */}
        {confirmPassword && (
          <div className="flex items-center gap-2">
            {password === confirmPassword ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-emerald-600 font-body">Passwords match</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-600 font-body">Passwords do not match</span>
              </>
            )}
          </div>
        )}

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
          disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            'Reset Password'
          )}
        </Button>
      </form>
    </motion.div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-[#f0ebe6] w-full">
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#BD6750] border-t-transparent" />
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
