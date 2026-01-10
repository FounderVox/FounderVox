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
        'relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-200 text-center min-h-[140px] group shadow-sm',
        isSelected
          ? 'bg-black border-black text-white shadow-lg'
          : 'bg-white/60 border-gray-200 text-black hover:bg-white/90 hover:border-gray-300 hover:shadow-md'
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
        'mb-3 p-3 rounded-xl transition-all duration-200',
        isSelected ? 'bg-white/20' : 'bg-gray-100/80 group-hover:bg-gray-200/80'
      )}>
        <Icon className={cn(
          'h-6 w-6 transition-colors duration-200',
          isSelected ? 'text-white' : 'text-black'
        )} strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className={cn(
        'font-semibold text-sm mb-1 transition-colors duration-200',
        isSelected ? 'text-white' : 'text-black'
      )}>
        {useCase.title}
      </h3>

      {/* Description */}
      <p className={cn(
        'text-xs line-clamp-2 transition-colors duration-200',
        isSelected ? 'text-white/80' : 'text-gray-600'
      )}>
        {useCase.description}
      </p>

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          className="absolute top-3 left-3 h-5 w-5 rounded-full bg-white text-black flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </motion.div>
      )}
    </motion.button>
  )
}
