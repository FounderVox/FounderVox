'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Users, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { startOnboardingCheckout } from '../../../../features/account/server'

const BETA_PRICE = '29.99'

export default function BetaSupportPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router, supabase])

  const handleSupport = async () => {
    setIsLoading(true)
    try {
      // Don't mark onboarding as complete here - the webhook will do that
      // after successful payment. This prevents users from bypassing payment.
      const checkoutUrl = await startOnboardingCheckout()
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        // If checkout fails, show error but stay on page
        console.error('Failed to get checkout URL')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error starting checkout:', error)
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h1
          className="text-3xl md:text-4xl font-bold mb-2 text-black font-display"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Help us build the future of
        </motion.h1>
        <motion.h2
          className="text-3xl md:text-4xl font-bold font-display italic"
          style={{ color: '#BD6750' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Founder Notes
        </motion.h2>
        <motion.p
          className="text-gray-600 mt-4 max-w-md mx-auto font-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Join the exclusive beta cohort and secure lifetime perks while
          supporting independent development.
        </motion.p>
      </div>

      {/* Main Card */}
      <motion.div
        className="glass-card-light rounded-2xl shadow-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {/* Price Section */}
        <div className="p-6 text-center border-b border-gray-200/50">
          <div className="text-sm text-gray-500 uppercase tracking-wide mb-2 font-body">Beta Access</div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-bold text-black">{BETA_PRICE}</span>
            <span className="text-xl text-gray-500">QAR</span>
          </div>
          <div className="text-sm text-gray-500 mt-2 font-body">One-time payment</div>
        </div>

        {/* Perks Section */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Direct Feedback Channel */}
            <div className="bg-white/60 rounded-xl p-5 border border-gray-200/50">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(189, 103, 80, 0.1)' }}
              >
                <Users className="w-6 h-6" style={{ color: '#BD6750' }} />
              </div>
              <h4 className="font-semibold text-black mb-2">Direct Feedback Channel</h4>
              <p className="text-sm text-gray-600 font-body">
                Shape the product with direct access to our founding team.
              </p>
            </div>

            {/* Exclusive Perks */}
            <div className="bg-white/60 rounded-xl p-5 border border-gray-200/50">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(189, 103, 80, 0.1)' }}
              >
                <Gift className="w-6 h-6" style={{ color: '#BD6750' }} />
              </div>
              <h4 className="font-semibold text-black mb-2">Exclusive Perks</h4>
              <p className="text-sm text-gray-600 font-body">
                Beta members get early access to all upcoming features and integrations.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleSupport}
            disabled={isLoading}
            size="xl"
            className="w-full bg-black hover:bg-black text-white shadow-lg"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Continue to Payment
                <span className="ml-2">→</span>
              </>
            )}
          </Button>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-400 font-body">
            <Lock className="h-4 w-4" />
            Secure SSL Transaction
          </div>
        </div>
      </motion.div>

      {/* Why Support Section */}
      <motion.div
        className="mt-12 pt-8 border-t border-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-xl font-bold mb-6 text-black">Why we need your support</h3>
        <p className="text-gray-600 mb-8 font-body">
          We are a small team of three independent developers. We don&apos;t have VC funding,
          which means we answer only to our users. Your support helps us fund our developers
          and cover operational costs.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/60 rounded-xl p-5 border border-gray-200/50">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: 'rgba(189, 103, 80, 0.1)' }}
            >
              <svg className="w-5 h-5" style={{ color: '#BD6750' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <h4 className="font-semibold mb-2 text-black">Infrastructure</h4>
            <p className="text-sm text-gray-600 font-body">
              Your funds directly support our database systems and ensure fast, reliable service for all beta users.
            </p>
          </div>
          
          <div className="bg-white/60 rounded-xl p-5 border border-gray-200/50">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: 'rgba(189, 103, 80, 0.1)' }}
            >
              <svg className="w-5 h-5" style={{ color: '#BD6750' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h4 className="font-semibold mb-2 text-black">Feature Development</h4>
            <p className="text-sm text-gray-600 font-body">
              Support allows us to dedicate time specifically to building and refining features based on your feedback.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500 font-body"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <p>© 2026 Founder Notes. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="/privacy" className="hover:text-gray-700">Privacy Policy</a>
          <a href="/terms" className="hover:text-gray-700">Terms of Service</a>
        </div>
      </motion.footer>
    </motion.div>
  )
}
