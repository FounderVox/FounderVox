'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Mic, Cpu, Check, Circle } from 'lucide-react'

// Premium sound wave bar component
const SoundWaveBar = ({ delay, isInView }: { delay: number; isInView: boolean }) => (
  <motion.div
    className="w-[3px] rounded-full"
    style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
    initial={{ height: 8 }}
    animate={isInView ? {
      height: [8, 20, 12, 24, 8, 16, 8],
    } : { height: 8 }}
    transition={{
      duration: 1.4,
      repeat: Infinity,
      ease: 'easeInOut',
      delay: delay,
    }}
  />
)

// Premium circular ripple component
const PremiumRipple = ({ delay, isInView, size }: { delay: number; isInView: boolean; size: number }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      width: 80,
      height: 80,
      left: '50%',
      top: '50%',
      marginLeft: -40,
      marginTop: -40,
      border: '1.5px solid rgba(189, 103, 80, 0.4)',
    }}
    initial={{ scale: 1, opacity: 0 }}
    animate={isInView ? {
      scale: [1, size],
      opacity: [0.6, 0],
    } : {}}
    transition={{
      duration: 2.5,
      repeat: Infinity,
      ease: [0.25, 0.1, 0.25, 1],
      delay: delay,
    }}
  />
)

export default function HowItWorksSection() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  const tasks = [
    { text: 'Review pitch deck', completed: true, delay: 0.4 },
    { text: 'Send investor update', completed: true, delay: 0.8 },
    { text: 'Schedule team sync', completed: false, delay: 1.2 }
  ]

  const steps = [
    {
      number: '1',
      title: 'Tap & Speak',
      description: 'Hit record and speak naturally. Share ideas, tasks, or notes as they come to you.',
      illustration: (
        <div className="relative w-full h-44 flex items-center justify-center -mt-4">
          {/* Premium ripple container */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-y-1">
            <PremiumRipple delay={0} isInView={isInView} size={2.2} />
            <PremiumRipple delay={0.8} isInView={isInView} size={2.5} />
            <PremiumRipple delay={1.6} isInView={isInView} size={2.8} />
          </div>

          {/* Mic button with premium styling */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Soft glow behind button */}
            <div
              className="absolute inset-0 rounded-full blur-xl"
              style={{
                background: 'radial-gradient(circle, rgba(189, 103, 80, 0.3) 0%, transparent 70%)',
                transform: 'scale(1.8)',
              }}
            />

            {/* Main mic button */}
            <motion.div
              className="w-20 h-20 rounded-full flex items-center justify-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #c97a5d 0%, #BD6750 50%, #a85842 100%)',
                boxShadow: '0 8px 32px rgba(189, 103, 80, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              }}
              animate={isInView ? {
                boxShadow: [
                  '0 8px 32px rgba(189, 103, 80, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                  '0 12px 40px rgba(189, 103, 80, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                  '0 8px 32px rgba(189, 103, 80, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                ]
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Sound wave visualization inside button */}
              <div className="flex items-center justify-center gap-[3px] h-8">
                <SoundWaveBar delay={0} isInView={isInView} />
                <SoundWaveBar delay={0.15} isInView={isInView} />
                <SoundWaveBar delay={0.3} isInView={isInView} />
                <SoundWaveBar delay={0.45} isInView={isInView} />
                <SoundWaveBar delay={0.6} isInView={isInView} />
              </div>
            </motion.div>

            {/* Recording indicator dot */}
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 15 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#ef4444' }}
                animate={isInView ? { opacity: [1, 0.4, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </motion.div>

        </div>
      )
    },
    {
      number: '2',
      title: 'AI Transforms',
      description: 'Our AI transcribes and categorizes your words into organized, structured content.',
      illustration: (
        <div className="relative w-full h-48 flex items-center justify-center">
          <div className="space-y-2">
            {/* Animated text appearing with category badges */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex items-center gap-2"
            >
              <motion.div
                className="h-1.5 rounded bg-gray-200"
                initial={{ width: 0 }}
                animate={isInView ? { width: 128 } : {}}
                transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
              />
              <span className="px-2 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: '#BD6750' }}>
                Task
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex items-center gap-2"
            >
              <motion.div
                className="h-1.5 rounded bg-gray-200"
                initial={{ width: 0 }}
                animate={isInView ? { width: 112 } : {}}
                transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
              />
              <span className="px-2 py-0.5 rounded text-xs font-medium text-white bg-blue-500">
                Meeting
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="flex items-center gap-2"
            >
              <motion.div
                className="h-1.5 rounded bg-gray-200"
                initial={{ width: 0 }}
                animate={isInView ? { width: 96 } : {}}
                transition={{ delay: 0.8, duration: 0.5, ease: 'easeOut' }}
              />
              <span className="px-2 py-0.5 rounded text-xs font-medium text-white bg-purple-500">
                Idea
              </span>
            </motion.div>
            {/* AI indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 1.0, duration: 0.4 }}
              className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100"
            >
              <motion.div
                animate={isInView ? { rotate: 360 } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Cpu className="w-4 h-4" style={{ color: '#BD6750' }} />
              </motion.div>
              <span className="text-xs text-gray-500 font-body">Processing</span>
            </motion.div>
          </div>
        </div>
      )
    },
    {
      number: '3',
      title: 'Take Action',
      description: 'Export to emails, docs, or social posts. Review tasks and take action instantly.',
      illustration: (
        <div className="relative w-full h-48 flex items-center justify-center">
          {/* Modern Todo List */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white rounded-xl border border-gray-100 shadow-lg p-4 w-full max-w-[220px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-50">
              <span className="text-xs font-medium text-gray-900 font-body">Today&apos;s Tasks</span>
              <motion.span
                className="text-xs font-body px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(189, 103, 80, 0.1)', color: '#BD6750' }}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1.5 }}
              >
                2/3
              </motion.span>
            </div>

            {/* Task Items */}
            <div className="space-y-2.5">
              {tasks.map((task, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: task.delay, duration: 0.4 }}
                  className="flex items-center gap-2.5"
                >
                  <motion.div
                    className="flex-shrink-0"
                    initial={task.completed ? { scale: 0 } : {}}
                    animate={isInView && task.completed ? { scale: 1 } : {}}
                    transition={{ delay: task.delay + 0.2, type: 'spring', stiffness: 300 }}
                  >
                    {task.completed ? (
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#BD6750' }}
                      >
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <motion.div
                        animate={isInView ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ delay: 1.8, duration: 0.3 }}
                      >
                        <Circle className="w-4 h-4 text-gray-300" strokeWidth={2} />
                      </motion.div>
                    )}
                  </motion.div>
                  <span className={`text-xs font-body ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {task.text}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Subtle progress indicator */}
            <motion.div
              className="mt-3 pt-2 border-t border-gray-50"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 1.6 }}
            >
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: '#BD6750' }}
                  initial={{ width: '0%' }}
                  animate={isInView ? { width: '66%' } : {}}
                  transition={{ delay: 1.8, duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      )
    }
  ]

  return (
    <section ref={sectionRef} className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-display text-gray-900 mb-4">
            Voice to action in 3 steps
          </h2>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-body">
            The fastest way to capture and organize your thoughts.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting line - hidden on mobile */}
          <div className="hidden md:block absolute top-32 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15 * index }}
              >
                <div className="bg-gray-50 rounded-3xl p-6 h-full border border-gray-100 hover:border-gray-200 transition-all hover:shadow-lg">
                  {/* Step number */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-display mb-6"
                    style={{ backgroundColor: '#BD6750' }}
                  >
                    {step.number}
                  </div>

                  {/* Illustration */}
                  {step.illustration}

                  {/* Content */}
                  <h3 className="text-xl font-display text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed font-body">{step.description}</p>
                </div>

                {/* Connector dot - hidden on mobile */}
                {index < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-32 -right-3 w-6 h-6 rounded-full border-4 border-white z-10"
                    style={{ backgroundColor: '#BD6750' }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
