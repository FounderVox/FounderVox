'use client'

import { motion } from 'framer-motion'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
      {/* Warm cream gradient background matching landing page */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#FDF8F4] via-[#FAF6F1] to-[#F8F4EE]">
        {/* Subtle grain texture */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Soft terracotta gradient orbs */}
        <motion.div
          className="absolute top-[10%] left-[10%] w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(189, 103, 80, 0.08) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(189, 103, 80, 0.06) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, -25, 0],
            y: [0, 15, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        <motion.div
          className="absolute top-[50%] right-[20%] w-[300px] h-[300px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(189, 103, 80, 0.05) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, 20, 0],
            y: [0, -15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 5,
          }}
        />
      </div>

      {/* Centered Content */}
      <div className="w-full max-w-md relative z-10 mx-auto">
        {children}
      </div>
    </div>
  )
}
