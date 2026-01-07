'use client'

import { motion } from 'framer-motion'

export default function CloudBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-pink-50/50 via-rose-50/30 to-pink-50/40">
      {/* Animated cloud layers with light pink colors and doubled opacity */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="cloudBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="60" />
          </filter>
          <filter id="cloudBlurLight">
            <feGaussianBlur in="SourceGraphic" stdDeviation="80" />
          </filter>
        </defs>

        {/* Cloud 1 - Large, slow */}
        <motion.ellipse
          cx="20%"
          cy="15%"
          rx="350"
          ry="150"
          fill="rgba(251, 207, 232, 0.5)"
          filter="url(#cloudBlur)"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Cloud 2 - Medium, moderate speed */}
        <motion.ellipse
          cx="75%"
          cy="25%"
          rx="300"
          ry="130"
          fill="rgba(252, 231, 243, 0.4)"
          filter="url(#cloudBlur)"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />

        {/* Cloud 3 - Small, faster */}
        <motion.ellipse
          cx="85%"
          cy="65%"
          rx="280"
          ry="120"
          fill="rgba(253, 242, 248, 0.44)"
          filter="url(#cloudBlur)"
          animate={{
            x: [0, 30, 0],
            y: [0, -25, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 5,
          }}
        />

        {/* Cloud 4 - Large, central */}
        <motion.ellipse
          cx="50%"
          cy="50%"
          rx="400"
          ry="160"
          fill="rgba(244, 224, 240, 0.36)"
          filter="url(#cloudBlurLight)"
          animate={{
            x: [0, -60, 0],
            y: [0, -35, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 8,
          }}
        />

        {/* Cloud 5 - Bottom left */}
        <motion.ellipse
          cx="10%"
          cy="85%"
          rx="320"
          ry="140"
          fill="rgba(251, 207, 232, 0.4)"
          filter="url(#cloudBlur)"
          animate={{
            x: [0, 45, 0],
            y: [0, 20, 0],
            scale: [1, 1.12, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3,
          }}
        />

        {/* Cloud 6 - Top right accent */}
        <motion.ellipse
          cx="90%"
          cy="8%"
          rx="260"
          ry="110"
          fill="rgba(253, 242, 248, 0.5)"
          filter="url(#cloudBlur)"
          animate={{
            x: [0, -35, 0],
            y: [0, 30, 0],
            scale: [1, 1.18, 1],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />

        {/* Additional accent clouds for more depth */}
        <motion.ellipse
          cx="40%"
          cy="80%"
          rx="240"
          ry="100"
          fill="rgba(249, 168, 212, 0.3)"
          filter="url(#cloudBlurLight)"
          animate={{
            x: [0, 35, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 10,
          }}
        />

        <motion.ellipse
          cx="60%"
          cy="35%"
          rx="220"
          ry="95"
          fill="rgba(252, 231, 243, 0.36)"
          filter="url(#cloudBlur)"
          animate={{
            x: [0, -25, 0],
            y: [0, 35, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 6,
          }}
        />
      </svg>
    </div>
  )
}
