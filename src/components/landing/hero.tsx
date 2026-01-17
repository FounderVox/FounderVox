'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { MoveRight, Play, Mic, Calendar, ListTodo, Send, Mail, Check, Languages, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function Hero() {
  const [titleNumber, setTitleNumber] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const supabase = createClient()
  const titles = useMemo(
    () => ['instantly', 'automatically', 'perfectly', 'effortlessly', 'intelligently'],
    []
  )

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0)
      } else {
        setTitleNumber(titleNumber + 1)
      }
    }, 2500)
    return () => clearTimeout(timeoutId)
  }, [titleNumber, titles])

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
    <div className="w-full landing-hero-bg">
      <div className="container mx-auto px-6">
        <div className="flex gap-8 py-24 lg:py-36 items-center justify-center flex-col">
          {/* Badge with warm glow and capability stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="badge-warm-glow px-4 py-2 rounded-full flex items-center gap-3">
              <Zap className="w-4 h-4" style={{ color: '#BD6750' }} />
              <span className="text-sm font-medium font-body" style={{ color: '#BD6750' }}>
                31+ languages • &lt;300ms • 95%+ accuracy
              </span>
            </div>
          </motion.div>

          {/* Headline with Instrument Serif */}
          <motion.div
            className="flex gap-4 flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl max-w-4xl tracking-tight text-center font-display">
              <span className="text-gray-900">Speak your ideas.</span>
              <br />
              <span className="text-gray-900">We&apos;ll organize them </span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1 mt-2">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-display italic text-glow-terracotta"
                    style={{ color: '#BD6750' }}
                    initial={{ opacity: 0, y: 100 }}
                    transition={{
                      type: 'spring',
                      stiffness: 100,
                      damping: 20,
                      mass: 1
                    }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -100 : 100,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-normal text-gray-500 max-w-2xl text-center mx-auto font-body mt-2">
              Transform voice into organized notes, actionable tasks, and ready-to-send emails.
              Built for founders who think faster than they type.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            className="flex flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="gap-3 px-8 py-6 text-base font-medium rounded-xl terracotta-glow-sm transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: '#BD6750', color: 'white' }}
                >
                  Go to Dashboard <MoveRight className="w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    size="lg"
                    className="gap-3 px-8 py-6 text-base font-medium rounded-xl terracotta-glow-sm transition-all duration-300 hover:scale-105"
                    style={{ backgroundColor: '#BD6750', color: 'white' }}
                  >
                    Try It Free <MoveRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  className="gap-3 px-8 py-6 text-base font-medium rounded-xl glass-button-dark transition-all duration-300"
                  variant="outline"
                >
                  <Play className="w-4 h-4" /> Watch Demo
                </Button>
              </>
            )}
          </motion.div>

          {/* Demo Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative w-full max-w-5xl mx-auto mt-12"
          >
            {/* Main Demo Container */}
            <div className="relative bg-gradient-to-br from-gray-900 via-[#1a1816] to-black rounded-3xl p-1.5 shadow-2xl">
              <div className="bg-gradient-to-br from-[#1f1d1b] to-[#141210] rounded-2xl p-6 md:p-8 overflow-hidden">
                {/* Window Controls */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-4 text-gray-500 text-sm font-body">FounderNote</span>
                </div>

                {/* Demo Content Grid */}
                <div className="grid md:grid-cols-5 gap-4 md:gap-6">
                  {/* Voice Input Panel */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-5">
                        <motion.div
                          animate={{ scale: [1, 1.08, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: '#BD6750' }}
                        >
                          <Mic className="w-5 h-5 text-white" />
                        </motion.div>
                        <div>
                          <p className="text-white font-medium text-sm font-body">Recording</p>
                          <p className="text-gray-500 text-xs font-body">Speak naturally...</p>
                        </div>
                      </div>

                      {/* Waveform with terracotta gradient */}
                      <div className="flex items-center gap-0.5 h-12 mb-5">
                        {[...Array(24)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{
                              height: [6, Math.random() * 32 + 6, 6],
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.04,
                              ease: 'easeInOut'
                            }}
                            className="w-1 rounded-full"
                            style={{
                              background: `linear-gradient(to top, #BD6750, #d4897a)`,
                              opacity: 0.8
                            }}
                          />
                        ))}
                      </div>

                      <p className="text-gray-400 text-sm leading-relaxed font-body">
                        &quot;Schedule investor call for Tuesday, prepare pitch deck by Monday, and send roadmap update to the team...&quot;
                      </p>
                    </div>
                  </div>

                  {/* AI Output Panel */}
                  <div className="md:col-span-3 space-y-3">
                    {/* Connection flow indicator */}
                    <div className="hidden md:flex items-center gap-2 mb-2 ml-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#BD6750' }} />
                      <div className="h-px w-8 bg-gradient-to-r from-[#BD6750] to-transparent" />
                      <span className="text-xs text-gray-500 font-body">Processing</span>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-medium text-blue-400 uppercase tracking-wide font-body">Meeting</span>
                      </div>
                      <p className="text-white text-sm font-medium font-body">Investor call scheduled</p>
                      <p className="text-gray-500 text-xs mt-1 font-body">Tuesday, 2:00 PM</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ListTodo className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide font-body">Task</span>
                      </div>
                      <p className="text-white text-sm font-medium font-body">Prepare pitch deck</p>
                      <p className="text-gray-500 text-xs mt-1 font-body">Due: Monday</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 }}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Send className="w-4 h-4" style={{ color: '#BD6750' }} />
                        <span className="text-xs font-medium uppercase tracking-wide font-body" style={{ color: '#BD6750' }}>Email</span>
                      </div>
                      <p className="text-white text-sm font-medium font-body">Roadmap update to team</p>
                      <p className="text-gray-500 text-xs mt-1 font-body">Draft ready to send</p>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Cards with subtle hover effects */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-4 lg:-left-12 top-1/4 hidden md:block"
            >
              <div className="bg-white rounded-2xl p-4 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(189, 103, 80, 0.1)' }}>
                    <Mail className="w-5 h-5" style={{ color: '#BD6750' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 font-body">Email drafted</p>
                    <p className="text-xs text-gray-500 font-body">Ready to send</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -right-4 lg:-right-12 top-1/3 hidden md:block"
            >
              <div className="bg-white rounded-2xl p-4 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 font-body">3 tasks created</p>
                    <p className="text-xs text-gray-500 font-body">Auto-organized</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute left-12 -bottom-4 hidden lg:block"
            >
              <div className="bg-white rounded-2xl p-4 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Languages className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 font-body">31+ languages</p>
                    <p className="text-xs text-gray-500 font-body">Auto-detected</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
