'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function CTASection() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const supabase = createClient()

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
    <section className="py-24 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-black mb-6">
          Ready to think out loud?
        </h2>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          {isAuthenticated 
            ? 'Continue capturing your ideas and staying productive.'
            : 'Join thousands of founders who\'ve switched to voice-first productivity.'}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="text-white px-10 py-4 rounded-xl text-lg font-medium flex items-center gap-3 transition-all duration-300"
              style={{ backgroundColor: '#BD6750' }}
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-white px-10 py-4 rounded-xl text-lg font-medium flex items-center gap-3 transition-all duration-300"
                style={{ backgroundColor: '#BD6750' }}
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="bg-gray-100 text-black hover:bg-gray-200 px-8 py-4 rounded-xl text-lg font-medium"
              >
                View Pricing
              </Link>
            </>
          )}
        </div>
        {!isAuthenticated && (
          <p className="text-sm text-gray-500 mt-6">
            No credit card required • Start your free trial today
          </p>
        )}
      </div>
    </section>
  )
}


