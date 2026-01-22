'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { Mic, Folder, Share2, Zap, Search, Mail, FileText, ListTodo, MessageSquare } from 'lucide-react'

// Typing animation component for Ask Feature
function TypingQuery({ queries, isInView }: { queries: string[]; isInView: boolean }) {
  const [currentQueryIndex, setCurrentQueryIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    if (!isInView) return

    const currentQuery = queries[currentQueryIndex]
    let timeout: NodeJS.Timeout

    if (isTyping) {
      if (displayText.length < currentQuery.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentQuery.slice(0, displayText.length + 1))
        }, 60)
      } else {
        timeout = setTimeout(() => {
          setIsTyping(false)
        }, 2000)
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1))
        }, 30)
      } else {
        setCurrentQueryIndex((prev) => (prev + 1) % queries.length)
        setIsTyping(true)
      }
    }

    return () => clearTimeout(timeout)
  }, [displayText, isTyping, currentQueryIndex, queries, isInView])

  return (
    <span className="text-white/70 text-sm font-body">
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className="inline-block w-0.5 h-4 bg-white/60 ml-0.5 align-middle"
      />
    </span>
  )
}

export default function FeaturesSection() {
  const askSectionRef = useRef(null)
  const isAskInView = useInView(askSectionRef, { once: true, margin: '-100px' })

  const askQueries = [
    "What's my plan for today?",
    "When is our investor pitch?",
    "Show tasks assigned to John",
    "Summarize last week's meetings"
  ]

  const features = [
    {
      icon: <Mic className="w-6 h-6" />,
      title: 'Voice Capture',
      description: 'Industry-leading transcription with 95%+ accuracy in 31+ languages. Under 300ms response time.',
      span: 1,
      illustration: (
        <div className="relative h-32 flex items-center justify-center">
          <div className="absolute w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(189, 103, 80, 0.2)' }}>
            <Mic className="w-7 h-7" style={{ color: '#BD6750' }} />
          </div>
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute w-24 h-24 border-2 rounded-full"
            style={{ borderColor: 'rgba(189, 103, 80, 0.3)' }}
          />
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.05, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            className="absolute w-36 h-36 border-2 rounded-full"
            style={{ borderColor: 'rgba(189, 103, 80, 0.2)' }}
          />
        </div>
      )
    },
    {
      icon: <Folder className="w-6 h-6" />,
      title: 'Smart Organization',
      description: 'AI auto-categorizes into meetings, ideas, and tasks. Never manually sort again.',
      span: 1,
      illustration: (
        <div className="relative h-32 flex items-center justify-center">
          <div className="space-y-2">
            {[
              { label: 'Meeting Notes', color: '#BD6750', delay: 0 },
              { label: 'Tasks', color: '#10b981', delay: 0.15 },
              { label: 'Ideas', color: '#8b5cf6', delay: 0.3 }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                whileInView={{
                  x: [0, i === 1 ? 20 : 8, i === 1 ? 16 : 0],
                  opacity: 1
                }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{
                  x: {
                    duration: 3,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                    delay: item.delay
                  },
                  opacity: { delay: 0.2 + i * 0.15, duration: 0.4 }
                }}
                className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 flex items-center gap-2"
              >
                <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: item.color }} />
                <span className="text-white/90 text-sm font-body">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'AI Analysis',
      description: 'Extracts key insights, action items, and summaries from every note automatically.',
      span: 1,
      illustration: (
        <div className="relative h-32 flex items-center justify-center overflow-visible">
          {/* Central Zap icon with pulse glow - positioned to align with middle connection */}
          <motion.div
            className="absolute left-5 top-[44px] z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{ backgroundColor: 'rgba(189, 103, 80, 0.3)' }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(189, 103, 80, 0.2)' }}>
                <Zap className="w-5 h-5" style={{ color: '#BD6750' }} />
              </div>
            </div>
          </motion.div>

          {/* Animated connection lines - positioned between icon and cards */}
          <div className="absolute left-[60px] right-[130px] top-0 bottom-0 z-0">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 128"
              preserveAspectRatio="none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                {/* Terracotta gradient for top line */}
                <linearGradient id="aiLineGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#BD6750" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#BD6750" stopOpacity="0.4" />
                </linearGradient>
                {/* Green gradient for middle line */}
                <linearGradient id="aiLineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
                </linearGradient>
                {/* Purple gradient for bottom line */}
                <linearGradient id="aiLineGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Line to Key Insight (top card) - curves up from center */}
              <motion.path
                d="M 0 64 C 35 64, 65 28, 100 28"
                fill="none"
                stroke="url(#aiLineGradient1)"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
              />

              {/* Line to Action Item (middle card) - slight curve for visual interest */}
              <motion.path
                d="M 0 64 C 25 64, 75 64, 100 64"
                fill="none"
                stroke="url(#aiLineGradient2)"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ delay: 0.65, duration: 0.6, ease: 'easeOut' }}
              />

              {/* Line to Summary (bottom card) - curves down from center */}
              <motion.path
                d="M 0 64 C 35 64, 65 100, 100 100"
                fill="none"
                stroke="url(#aiLineGradient3)"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
              />

              {/* Flowing dot - top path (terracotta) */}
              <motion.circle
                r="3"
                fill="#BD6750"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ delay: 1.2 }}
              >
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path="M 0 64 C 35 64, 65 28, 100 28"
                  keyPoints="0;1;1"
                  keyTimes="0;0.7;1"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1;0 0 0 0"
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.1;0.6;0.7"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </motion.circle>

              {/* Flowing dot - middle path (green) */}
              <motion.circle
                r="3"
                fill="#10b981"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ delay: 1.4 }}
              >
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  begin="0.3s"
                  path="M 0 64 C 25 64, 75 64, 100 64"
                  keyPoints="0;1;1"
                  keyTimes="0;0.7;1"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1;0 0 0 0"
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.1;0.6;0.7"
                  dur="2s"
                  repeatCount="indefinite"
                  begin="0.3s"
                />
              </motion.circle>

              {/* Flowing dot - bottom path (purple) */}
              <motion.circle
                r="3"
                fill="#8b5cf6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ delay: 1.6 }}
              >
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  begin="0.6s"
                  path="M 0 64 C 35 64, 65 100, 100 100"
                  keyPoints="0;1;1"
                  keyTimes="0;0.7;1"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1;0 0 0 0"
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.1;0.6;0.7"
                  dur="2s"
                  repeatCount="indefinite"
                  begin="0.6s"
                />
              </motion.circle>
            </svg>
          </div>

          {/* Insight cards with stagger - positioned to align with line endpoints */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 space-y-2 z-10">
            {[
              { label: 'Key Insight', color: '#BD6750', textWidth: 'w-12' },
              { label: 'Action Item', color: '#10b981', textWidth: 'w-10' },
              { label: 'Summary', color: '#8b5cf6', textWidth: 'w-11' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ delay: 0.4 + i * 0.15, duration: 0.4 }}
                className="bg-white/10 backdrop-blur rounded-lg px-2 py-1.5 flex items-center gap-1.5"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: item.color,
                    boxShadow: `0 0 8px ${item.color}60`
                  }}
                />
                <div className={`h-1.5 rounded bg-white/30 ${item.textWidth}`} />
                <span className="text-white/60 text-[9px] font-body px-1 py-0.5 rounded bg-white/5 whitespace-nowrap">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: 'Multi-Format Export',
      description: 'One recording becomes emails, docs, social posts, or action items. Choose your format.',
      span: 1,
      illustration: (
        <div className="relative h-32 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <Mail className="w-4 h-4" />, label: 'Email', yOffset: 0, delay: 0 },
              { icon: <FileText className="w-4 h-4" />, label: 'Doc', yOffset: 2, delay: 0.5 },
              { icon: <ListTodo className="w-4 h-4" />, label: 'Tasks', yOffset: 1, delay: 1 },
              { icon: <MessageSquare className="w-4 h-4" />, label: 'Post', yOffset: 3, delay: 1.5 }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{
                  scale: 1,
                  opacity: 1,
                  y: [0, -4, 0]
                }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{
                  scale: { delay: 0.3 + i * 0.1, type: 'spring', stiffness: 200 },
                  opacity: { delay: 0.3 + i * 0.1 },
                  y: {
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: item.delay
                  }
                }}
                className="bg-white/10 backdrop-blur rounded-xl p-3 flex flex-col items-center gap-1"
              >
                <div className="text-white/80">{item.icon}</div>
                <span className="text-white/70 text-xs font-body">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: 'Ask Feature',
      description: 'Semantic search across all your notes. Ask questions, get instant answers from your knowledge base.',
      span: 2,
      illustration: (
        <div ref={askSectionRef} className="relative h-32 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ delay: 0.5 }}
            className="bg-white/10 backdrop-blur rounded-xl p-4 w-full max-w-md"
          >
            <div className="flex items-center gap-3 mb-3">
              <Search className="w-4 h-4 text-white/60 flex-shrink-0" />
              <TypingQuery queries={askQueries} isInView={isAskInView} />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ delay: 1.2 }}
              className="bg-white/5 rounded-lg p-3 space-y-2"
            >
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ delay: 1.4 }}
                className="flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#BD6750' }} />
                <p className="text-white/70 text-xs font-body">Found 3 relevant notes...</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ delay: 1.6 }}
                className="flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-white/60 text-xs font-body">Analyzing context...</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      )
    }
  ]

  return (
    <section id="features" className="py-24 px-6 warm-charcoal">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-display text-white mb-4">
            Everything you need to capture ideas
          </h2>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto font-body">
            Powerful features designed for founders who move fast.
          </p>
        </motion.div>

        {/* Symmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className={`bento-card bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden group hover:bg-white/[0.05] transition-all duration-300 ${
                feature.span === 2 ? 'md:col-span-2 lg:col-span-2' : ''
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: 0.08 * index }}
            >
              {/* Illustration Area */}
              <div className="p-6 pb-2">
                {feature.illustration}
              </div>

              {/* Content Area */}
              <div className="p-6 pt-2">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(189, 103, 80, 0.15)' }}
                  >
                    <div style={{ color: '#BD6750' }}>{feature.icon}</div>
                  </div>
                  <h3 className="text-lg font-display text-white">{feature.title}</h3>
                </div>
                <p className="text-white/60 leading-relaxed font-body text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
