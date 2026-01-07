'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { UseCase } from '@/lib/constants/use-cases'

interface UseCaseCardProps {
  useCase: UseCase
  isSelected: boolean
  onToggle: () => void
}

export function UseCaseCard({ useCase, isSelected, onToggle }: UseCaseCardProps) {
  return (
    <motion.button
      onClick={onToggle}
      className={cn(
        'relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors text-center min-h-[140px]',
        isSelected
          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
          : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={isSelected ? {
        boxShadow: [
          '0 0 0 0 rgba(var(--primary), 0)',
          '0 0 20px 2px rgba(139, 92, 246, 0.3)',
          '0 0 0 0 rgba(var(--primary), 0)',
        ],
      } : {}}
      transition={isSelected ? {
        boxShadow: {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      } : {}}
    >
      {/* Badge */}
      {useCase.badge && (
        <span
          className={cn(
            'absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase',
            useCase.badge === 'new'
              ? 'bg-green-500 text-white'
              : 'bg-gradient-to-r from-violet-500 to-purple-500 text-white'
          )}
        >
          {useCase.badge === 'new' ? 'New' : 'Founder'}
        </span>
      )}

      {/* Icon */}
      <span className="text-3xl mb-2">{useCase.icon}</span>

      {/* Title */}
      <h3 className="font-semibold text-sm mb-1">{useCase.title}</h3>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2">
        {useCase.description}
      </p>

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          className="absolute top-2 left-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          <svg
            className="h-3 w-3 text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>
      )}
    </motion.button>
  )
}
