'use client'

import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  variant?: 'dark' | 'light'
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

const textSizes = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
}

export function Logo({ size = 'md', showText = true, variant = 'dark' }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={`${sizes[size]} rounded-md flex items-center justify-center shadow-md`}
        style={{ backgroundColor: '#BD6750' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Mic className="h-1/2 w-1/2 text-white" strokeWidth={2.5} />
      </motion.div>
      {showText && (
        <span className={`${textSizes[size]} font-bold tracking-tight`}>
          <span className="text-black">Founder</span><span className="text-gray-500">Note</span>
        </span>
      )}
    </div>
  )
}
