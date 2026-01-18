'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Logo } from '@/components/shared/logo'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })

      if (resetError) {
        console.error('[ForgotPassword] Error:', resetError)

        // Handle specific errors
        if (resetError.message?.toLowerCase().includes('rate limit')) {
          setError('Too many requests. Please wait a few minutes before trying again.')
        } else {
          setError(resetError.message || 'Failed to send reset email. Please try again.')
        }
        setIsLoading(false)
        return
      }

      // Success - show confirmation
      console.log('[ForgotPassword] Reset email sent to:', email)
      setEmailSent(true)
      setIsLoading(false)
    } catch (err) {
      console.error('[ForgotPassword] Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  // Success state - email sent
  if (emailSent) {
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

          <h1 className="text-2xl font-semibold font-body text-[#1a1a1a] mb-2">
            Check your email
          </h1>
          <p className="text-[#666] font-body mb-2">
            We sent a password reset link to
          </p>
          <p className="text-[#1a1a1a] font-semibold font-body mb-6">
            {email}
          </p>

          <div className="bg-[#faf8f6] rounded-xl p-4 mb-6 border border-[#e5e0db]">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#BD6750' }} />
              <p className="text-sm text-[#666] font-body text-left">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
            </div>
          </div>

          <p className="text-sm text-[#888] font-body mb-6">
            Didn&apos;t receive the email? Check your spam folder or{' '}
            <button
              onClick={() => {
                setEmailSent(false)
                setEmail('')
              }}
              className="font-semibold hover:underline"
              style={{ color: '#BD6750' }}
            >
              try again
            </button>
          </p>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:shadow-lg hover:opacity-90 font-body"
            style={{ backgroundColor: '#BD6750' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
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
      {/* Back link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm text-[#666] hover:text-[#1a1a1a] transition-colors font-body mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>

      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>
        <h1 className="text-2xl font-semibold font-body text-[#1a1a1a] mb-2">
          Forgot your password?
        </h1>
        <p className="text-[#666] font-body">
          No worries, we&apos;ll send you reset instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[#1a1a1a] font-medium font-body">
            Email address
          </Label>
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
          disabled={isLoading || !email}
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-[#666] mt-8 font-body">
        Remember your password?{' '}
        <Link href="/login" className="hover:underline font-semibold" style={{ color: '#BD6750' }}>
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
