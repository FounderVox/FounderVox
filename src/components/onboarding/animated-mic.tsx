'use client'

import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'

export function AnimatedMic() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <motion.div
        className="absolute h-32 w-32 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.2, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Inner pulse ring */}
      <motion.div
        className="absolute h-24 w-24 rounded-full border border-violet-400/30"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.1, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />

      {/* Main mic container */}
      <motion.div
        className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl shadow-violet-500/30"
        animate={{
          y: [0, -4, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Inner highlight */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />

        <Mic className="h-9 w-9 text-white relative z-10" strokeWidth={1.5} />
      </motion.div>
    </div>
  )
}
