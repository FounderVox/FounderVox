'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function CTASection() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const supabase = createClient()
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <section ref={sectionRef} className="py-24 md:py-32 px-6 dark-gradient-cta">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-display text-white mb-4">
            Start capturing ideas in seconds
          </h2>
          <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto font-body leading-relaxed">
            {isAuthenticated
              ? 'Continue capturing your ideas and staying productive.'
              : 'No credit card required. No complex setup. Just tap, speak, and watch the magic happen.'}
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="px-10 py-4 rounded-xl text-lg font-medium flex items-center gap-3 transition-all duration-300 terracotta-glow hover:scale-105 font-body"
              style={{ backgroundColor: '#BD6750', color: 'white' }}
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-10 py-4 rounded-xl text-lg font-medium flex items-center gap-3 transition-all duration-300 terracotta-glow hover:scale-105 font-body"
                style={{ backgroundColor: '#BD6750', color: 'white' }}
              >
                Try It Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="glass-button px-8 py-4 rounded-xl text-lg font-medium text-white flex items-center gap-3 transition-all duration-300 font-body">
                <Play className="w-5 h-5" />
                See How It Works
              </button>
            </>
          )}
        </motion.div>

        {!isAuthenticated && (
          <motion.p
            className="text-sm text-white/40 mt-8 font-body"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Free plan available • No credit card required
          </motion.p>
        )}
      </div>
    </section>
  )
}
