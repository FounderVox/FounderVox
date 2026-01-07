'use client'

import { useState } from 'react'

export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/shared/logo'
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons'
import { EmailSignupForm } from '@/components/auth/email-signup-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  const [showEmailForm, setShowEmailForm] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Transform your voice into actionable content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SocialAuthButtons mode="signup" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or sign up with email
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {showEmailForm ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EmailSignupForm />
              </motion.div>
            ) : (
              <motion.button
                key="trigger"
                onClick={() => setShowEmailForm(true)}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Sign up with email instead
              </motion.button>
            )}
          </AnimatePresence>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
