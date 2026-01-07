'use client'

import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'

export function AnimatedMic() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings */}
      <motion.div
        className="absolute h-24 w-24 rounded-full bg-primary/20"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute h-24 w-24 rounded-full bg-primary/20"
        animate={{
          scale: [1, 1.8, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />

      {/* Main mic icon container */}
      <motion.div
        className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-lg"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <motion.div
          animate={{
            y: [0, -2, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Mic className="h-10 w-10 text-primary-foreground" />
        </motion.div>
      </motion.div>
    </div>
  )
}
