'use client'

import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'

export function AnimatedMic() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse ring - grey */}
      <motion.div
        className="absolute h-32 w-32 rounded-full border border-gray-300/30"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Inner pulse ring - grey */}
      <motion.div
        className="absolute h-24 w-24 rounded-full border border-gray-400/20"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.05, 0.2],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />

      {/* Main mic container - black background block */}
      <motion.div
        className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-black shadow-xl"
        animate={{
          y: [0, -4, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* White mic icon */}
        <Mic className="h-9 w-9 text-white relative z-10" strokeWidth={2} />
      </motion.div>
    </div>
  )
}
