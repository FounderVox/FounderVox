'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { UseCase } from '@/lib/constants/use-cases'
import { Check } from 'lucide-react'

interface UseCaseCardProps {
  useCase: UseCase
  isSelected: boolean
  onToggle: () => void
}

export function UseCaseCard({ useCase, isSelected, onToggle }: UseCaseCardProps) {
  const Icon = useCase.icon

  return (
    <motion.button
      onClick={onToggle}
      className={cn(
        'relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 text-center min-h-[140px] group',
        isSelected
          ? 'bg-violet-500/20 border-violet-500/50 shadow-lg shadow-violet-500/10'
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Badge */}
      {useCase.badge && (
        <span
          className={cn(
            'absolute -top-2 -right-2 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider',
            useCase.badge === 'new'
              ? 'bg-emerald-500 text-white'
              : 'bg-gradient-to-r from-violet-500 to-purple-500 text-white'
          )}
        >
          {useCase.badge === 'new' ? 'New' : 'Founder'}
        </span>
      )}

      {/* Icon */}
      <div className={cn(
        'mb-3 p-3 rounded-xl transition-colors',
        isSelected ? 'bg-violet-500/30' : 'bg-white/10 group-hover:bg-white/15'
      )}>
        <Icon className={cn(
          'h-6 w-6 transition-colors',
          isSelected ? 'text-violet-300' : 'text-gray-400 group-hover:text-gray-300'
        )} strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className={cn(
        'font-semibold text-sm mb-1 transition-colors',
        isSelected ? 'text-white' : 'text-gray-300'
      )}>
        {useCase.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-gray-500 line-clamp-2">
        {useCase.description}
      </p>

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          className="absolute top-3 left-3 h-5 w-5 rounded-full bg-violet-500 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </motion.div>
      )}
    </motion.button>
  )
}
