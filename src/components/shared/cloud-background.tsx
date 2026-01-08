'use client'

import { motion } from 'framer-motion'

export default function CloudBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-blue-50/50 via-sky-50/30 to-blue-50/40">
      {/* Animated cloud layers with baby blue colors and horizontal motion */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="cloudBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="60" />
          </filter>
          <filter id="cloudBlurLight">
            <feGaussianBlur in="SourceGraphic" stdDeviation="80" />
          </filter>
        </defs>

        {/* Cloud 1 - Large, moving right */}
        <motion.ellipse
          cx="20%"
          cy="15%"
          rx="350"
          ry="150"
          fill="rgba(186, 230, 253, 0.5)"
          filter="url(#cloudBlur)"
          animate={{
            x: [0, 150, 0],
            y: [0, 20, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Cloud 2 - Medium, moving left */}
        <motion.ellipse
          cx="75%"
          cy="25%"
          rx="300"
          ry="130"
          fill="rgba(224, 242, 254, 0.4)"
          filter="url(#cloudBlur)"
          animate={{
            x: [0, -120, 0],
            y: [0, 15, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
            delay: 2,
          }}
        />

        {/* Cloud 3 - Small, moving right faster */}
        <motion.ellipse
          cx="85%"
          cy="65%"
          rx="280"
          ry="120"
          fill="rgba(240, 249, 255, 0.44)"
          filter="url(#cloudBlur)"
          animate={{
            x: [0, 100, 0],
            y: [0, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'linear',
            delay: 5,
          }}
        />

        {/* Cloud 4 - Large, central, moving left slowly */}
        <motion.ellipse
          cx="50%"
          cy="50%"
          rx="400"
          ry="160"
          fill="rgba(191, 219, 254, 0.36)"
          filter="url(#cloudBlurLight)"
          animate={{
            x: [0, -80, 0],
            y: [0, -15, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
            delay: 8,
          }}
        />

        {/* Cloud 5 - Bottom left, moving right */}
        <motion.ellipse
          cx="10%"
          cy="85%"
          rx="320"
          ry="140"
          fill="rgba(186, 230, 253, 0.4)"
          filter="url(#cloudBlur)"
          animate={{
            x: [0, 130, 0],
            y: [0, 10, 0],
            scale: [1, 1.07, 1],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'linear',
            delay: 3,
          }}
        />

        {/* Cloud 6 - Top right, moving left */}
        <motion.ellipse
          cx="90%"
          cy="8%"
          rx="260"
          ry="110"
          fill="rgba(240, 249, 255, 0.5)"
          filter="url(#cloudBlur)"
          animate={{
            x: [0, -110, 0],
            y: [0, 12, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 13,
            repeat: Infinity,
            ease: 'linear',
            delay: 1,
          }}
        />

        {/* Cloud 7 - Accent, moving right */}
        <motion.ellipse
          cx="40%"
          cy="80%"
          rx="240"
          ry="100"
          fill="rgba(165, 213, 253, 0.3)"
          filter="url(#cloudBlurLight)"
          animate={{
            x: [0, 90, 0],
            y: [0, -8, 0],
            scale: [1, 1.06, 1],
          }}
          transition={{
            duration: 19,
            repeat: Infinity,
            ease: 'linear',
            delay: 10,
          }}
        />

        {/* Cloud 8 - Center accent, moving left */}
        <motion.ellipse
          cx="60%"
          cy="35%"
          rx="220"
          ry="95"
          fill="rgba(224, 242, 254, 0.36)"
          filter="url(#cloudBlur)"
          animate={{
            x: [0, -95, 0],
            y: [0, 18, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'linear',
            delay: 6,
          }}
        />
      </svg>
    </div>
  )
}
