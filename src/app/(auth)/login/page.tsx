'use client'

import { useState } from 'react'

export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/shared/logo'
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react'

type ViewState = 'main' | 'email-form'

export default function LoginPage() {
  const [view, setView] = useState<ViewState>('main')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  console.log('[FounderVox:Auth] Login page rendered, current view:', view)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    console.log('[FounderVox:Auth] Starting email login for:', email)
    setIsLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('[FounderVox:Auth] Login error:', signInError.message)
        throw signInError
      }

      console.log('[FounderVox:Auth] Login successful, redirecting...')
      router.push('/welcome')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      if (errorMessage.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.')
      } else {
        setError(errorMessage)
      }
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
        {/* Main Login View */}
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
                Welcome back
              </h1>
              <p className="text-gray-500">
                Sign in to your account to continue
              </p>
            </div>

            <div className="space-y-4">
              <SocialAuthButtons mode="login" />

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
                Sign in with Email
              </Button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-8">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign up
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
                Sign in with email
              </h1>
              <p className="text-gray-500">
                Enter your credentials to continue
              </p>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-5">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 border-gray-200 focus:border-primary focus:ring-primary"
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
                className="w-full"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
