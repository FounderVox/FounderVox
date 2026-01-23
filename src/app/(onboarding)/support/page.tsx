'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Lock,
  Users,
  Sparkles,
  Server,
  Lightbulb,
  Check,
  ArrowRight,
  Star,
  Gift,
  Shield,
  MessageSquare,
  Zap
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { startOnboardingCheckout } from '../../../../features/account/server'

const BETA_PRICE = '9.99'

const features = [
  { text: 'Lifetime beta pricing locked in', icon: <Star className="w-4 h-4" /> },
  { text: 'Direct access to founding team', icon: <MessageSquare className="w-4 h-4" /> },
  { text: 'Priority feature requests', icon: <Zap className="w-4 h-4" /> },
  { text: 'Early access to all updates', icon: <Gift className="w-4 h-4" /> },
  { text: 'Shape the product roadmap', icon: <Lightbulb className="w-4 h-4" /> },
  { text: 'Exclusive beta community', icon: <Users className="w-4 h-4" /> },
]

const supportReasons = [
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Small Team',
    description: "We're three independent developers with no VC funding. We answer only to our users."
  },
  {
    icon: <Server className="w-6 h-6" />,
    title: 'Infrastructure',
    description: 'Your support directly funds our servers and ensures fast, reliable service.'
  },
  {
    icon: <Lightbulb className="w-6 h-6" />,
    title: 'Your Features',
    description: 'Beta supporters shape the roadmap. Your feedback becomes our priority.'
  }
]

export default function BetaSupportPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
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
      const checkoutUrl = await startOnboardingCheckout()
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
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
      className="w-full max-w-5xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header - Matching beta page typography */}
      <div className="text-center mb-12">
        <motion.h1
          className="text-4xl md:text-6xl font-display text-[#1a1a1a] mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Help us build the future of
          <br />
          <span className="text-[#BD6750]">Founder Note</span>
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl text-[#666] font-body max-w-2xl mx-auto mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Join the exclusive beta cohort and secure lifetime perks while
          supporting independent development.
        </motion.p>
      </div>

      {/* Main Pricing Card - Dark design matching beta page */}
      <motion.div
        className="max-w-lg mx-auto mb-20"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div
          className="relative rounded-[2rem] overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Card background with gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#BD6750] via-[#c97a5d] to-[#a85842] rounded-[2rem]" />
          <div className="absolute inset-[1px] bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-[2rem]" />

          {/* Animated glow on hover */}
          <motion.div
            className="absolute inset-0 rounded-[2rem] opacity-0"
            animate={{ opacity: isHovered ? 0.3 : 0 }}
            style={{
              background: 'radial-gradient(circle at 50% 50%, #BD6750, transparent 70%)',
            }}
          />

          <div className="relative p-10">
            {/* Beta tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BD6750]/20 border border-[#BD6750]/30 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#BD6750]" />
              <span className="text-xs font-semibold text-[#BD6750] font-body uppercase tracking-wider">
                Beta Supporter
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-display text-white">${BETA_PRICE}</span>
                <span className="text-lg text-white/60 font-body">USD</span>
              </div>
              <p className="text-white/50 font-body mt-2 text-sm">
                One-time payment
              </p>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleSupport}
              disabled={isLoading}
              className="group w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 font-body bg-gradient-to-r from-[#BD6750] to-[#c97a5d] text-white hover:shadow-lg hover:shadow-[#BD6750]/30 mb-8 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            {/* Features List */}
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#BD6750]/20 text-[#BD6750]">
                    {feature.icon}
                  </div>
                  <span className="text-sm font-body text-white font-medium">
                    {feature.text}
                  </span>
                  <Check className="w-4 h-4 text-[#BD6750] ml-auto" />
                </motion.li>
              ))}
            </ul>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-white/10 text-sm text-white/40 font-body">
              <Lock className="h-4 w-4" />
              Secure payment via Lemon Squeezy
            </div>
          </div>
        </div>
      </motion.div>

      {/* Why Support Section - Larger heading matching beta page */}
      <motion.div
        className="mb-16"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-3xl md:text-5xl font-display text-[#1a1a1a] text-center mb-12">
          Why we need your support
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {supportReasons.map((reason, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-[#f0ebe6] shadow-sm hover:shadow-lg hover:border-[#BD6750]/20 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#BD6750]/10 to-[#BD6750]/5 flex items-center justify-center text-[#BD6750] mb-4">
                {reason.icon}
              </div>
              <h3 className="text-lg font-display text-[#1a1a1a] mb-2">{reason.title}</h3>
              <p className="text-[#666] font-body text-sm leading-relaxed">{reason.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Trust Indicators */}
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="inline-flex items-center gap-6 px-8 py-4 rounded-2xl bg-white/50 border border-[#f0ebe6]">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#BD6750]" />
            <span className="text-sm font-body text-[#666]">Secure checkout</span>
          </div>
          <div className="w-px h-4 bg-[#e5e5e5]" />
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#BD6750]" />
            <span className="text-sm font-body text-[#666]">Instant access</span>
          </div>
          <div className="w-px h-4 bg-[#e5e5e5]" />
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#BD6750]" />
            <span className="text-sm font-body text-[#666]">Join 50+ founders</span>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="pt-8 border-t border-[#f0ebe6] text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <p className="text-sm text-[#888] font-body">© 2025 Founder Notes. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-3">
          <a href="/privacy" className="text-sm text-[#888] hover:text-[#BD6750] font-body transition-colors">
            Privacy Policy
          </a>
          <a href="/terms" className="text-sm text-[#888] hover:text-[#BD6750] font-body transition-colors">
            Terms of Service
          </a>
        </div>
      </motion.footer>
    </motion.div>
  )
}
