'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { MoveRight, Play, Mic, Calendar, ListTodo, Send, Mail, Check, Languages } from 'lucide-react'
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
    }, 2000)
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
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-32 items-center justify-center flex-col">
          <div>
            <Button variant="secondary" size="sm" className="gap-4" style={{ color: '#BD6750' }}>
              <span style={{ color: '#BD6750' }}>#1 AI Voice Tool for Founders</span> <MoveRight className="w-4 h-4" style={{ color: '#BD6750' }} />
            </Button>
          </div>
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-normal">
              <span className="text-black">Speak your ideas.</span>
              <br />
              <span className="text-black">We&apos;ll organize them </span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1 mt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold"
                    style={{ color: '#BD6750' }}
                    initial={{ opacity: 0, y: '-100' }}
                    transition={{ type: 'spring', stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-gray-600 max-w-2xl text-center">
              Transform voice into organized notes, tasks, emails, and content. 
              Built for founders who think faster than they type.
            </p>
          </div>
          <div className="flex flex-row gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-4">
                  Go to Dashboard <MoveRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button size="lg" className="gap-4">
                    Get Started <MoveRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button size="lg" className="gap-4" variant="outline">
                  Watch Demo <Play className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
          
          {/* Demo Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative max-w-5xl mx-auto mt-16"
          >
            {/* Main Demo Container */}
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-black rounded-2xl p-1.5 shadow-2xl">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 md:p-8 overflow-hidden">
                {/* Window Controls */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-gray-500 text-sm">Founder Note</span>
                </div>

                {/* Demo Content Grid */}
                <div className="grid md:grid-cols-5 gap-4 md:gap-6">
                  {/* Voice Input Panel */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-4 md:p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <motion.div 
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-11 h-11 bg-white rounded-xl flex items-center justify-center"
                        >
                          <Mic className="w-5 h-5 text-black" />
                        </motion.div>
                        <div>
                          <p className="text-white font-medium text-sm">Recording</p>
                          <p className="text-gray-500 text-xs">Speak naturally...</p>
                        </div>
                      </div>
                      
                      {/* Waveform */}
                      <div className="flex items-center gap-0.5 h-10 mb-4">
                        {[...Array(20)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ 
                              height: [6, Math.random() * 28 + 6, 6],
                            }}
                            transition={{ 
                              duration: 0.8, 
                              repeat: Infinity, 
                              delay: i * 0.05,
                              ease: 'easeInOut'
                            }}
                            className="w-1 bg-gradient-to-t from-violet-600 to-violet-400 rounded-full"
                          />
                        ))}
                      </div>
                      
                      <p className="text-gray-400 text-sm leading-relaxed">
                        &quot;Schedule investor call for Tuesday, prepare pitch deck by Monday, and send roadmap update to the team...&quot;
                      </p>
                    </div>
                  </div>

                  {/* AI Output Panel */}
                  <div className="md:col-span-3 space-y-3">
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">Meeting</span>
                      </div>
                      <p className="text-white text-sm font-medium">Investor call scheduled</p>
                      <p className="text-gray-500 text-xs mt-1">Tuesday, 2:00 PM</p>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ListTodo className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Task</span>
                      </div>
                      <p className="text-white text-sm font-medium">Prepare pitch deck</p>
                      <p className="text-gray-500 text-xs mt-1">Due: Monday</p>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                      className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Send className="w-4 h-4 text-violet-400" />
                        <span className="text-xs font-medium text-violet-400 uppercase tracking-wide">Email</span>
                      </div>
                      <p className="text-white text-sm font-medium">Roadmap update to team</p>
                      <p className="text-gray-500 text-xs mt-1">Draft ready to send</p>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-4 lg:-left-8 top-1/4 hidden md:block"
            >
              <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">Email drafted</p>
                    <p className="text-xs text-gray-500">Ready to send</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -right-4 lg:-right-8 top-1/3 hidden md:block"
            >
              <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">3 tasks created</p>
                    <p className="text-xs text-gray-500">Auto-organized</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute left-8 bottom-4 hidden lg:block"
            >
              <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Languages className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">12+ languages</p>
                    <p className="text-xs text-gray-500">Auto-detected</p>
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


