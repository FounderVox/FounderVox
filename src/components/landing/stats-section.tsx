'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

function AnimatedNumber({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (isInView) {
      const duration = 1500
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayValue(Math.floor(eased * value))
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      requestAnimationFrame(animate)
    }
  }, [isInView, value])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{displayValue}{suffix}
    </span>
  )
}

export default function StatsSection() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  const stats = [
    {
      value: 300,
      prefix: '<',
      suffix: 'ms',
      label: 'Response',
      description: 'Faster than you can blink'
    },
    {
      value: 31,
      prefix: '',
      suffix: '+',
      label: 'Languages',
      description: 'From English to Japanese'
    },
    {
      value: 95,
      prefix: '',
      suffix: '%+',
      label: 'Accuracy',
      description: 'Industry-leading transcription'
    }
  ]

  return (
    <section ref={sectionRef} className="py-24 md:py-32 px-6 terracotta-gradient-bg">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-display text-white/90 mb-4">
            Built for speed and accuracy
          </h2>
          <p className="text-lg md:text-xl text-white/60 font-body">
            Powered by cutting-edge AI for reliable performance.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 * index }}
            >
              <div className="text-6xl md:text-7xl lg:text-8xl font-display text-white mb-3">
                <AnimatedNumber value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </div>
              <div className="text-xl font-medium text-white/90 mb-2 font-body">{stat.label}</div>
              <p className="text-white/60 font-body">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
