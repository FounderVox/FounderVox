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
  const textColor = variant === 'light' ? 'text-white' : ''
  const accentColor = variant === 'light' ? 'text-violet-300' : 'text-primary'

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={`${sizes[size]} rounded-xl bg-primary flex items-center justify-center`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Mic className="h-1/2 w-1/2 text-primary-foreground" />
      </motion.div>
      {showText && (
        <span className={`${textSizes[size]} font-bold tracking-tight ${textColor}`}>
          Founder<span className={accentColor}>Vox</span>
        </span>
      )}
    </div>
  )
}
