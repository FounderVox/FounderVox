'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToastProps {
  open: boolean
  onClose: () => void
  message: string
  description?: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center'
}

export function Toast({
  open,
  onClose,
  message,
  description,
  variant = 'success',
  duration = 3000,
  position = 'bottom-right'
}: ToastProps) {
  useEffect(() => {
    if (open && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [open, duration, onClose])

  const variantConfig = {
    success: {
      icon: Check,
      iconBg: 'bg-emerald-500',
      iconColor: 'text-white',
      border: 'border-emerald-200',
      progressBg: 'bg-emerald-500'
    },
    error: {
      icon: X,
      iconBg: 'bg-red-500',
      iconColor: 'text-white',
      border: 'border-red-200',
      progressBg: 'bg-red-500'
    },
    warning: {
      icon: AlertCircle,
      iconBg: 'bg-amber-500',
      iconColor: 'text-white',
      border: 'border-amber-200',
      progressBg: 'bg-amber-500'
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-500',
      iconColor: 'text-white',
      border: 'border-blue-200',
      progressBg: 'bg-blue-500'
    }
  }

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2'
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "fixed z-[100] min-w-[320px] max-w-md",
            positionClasses[position]
          )}
        >
          <div className={cn(
            "bg-white rounded-xl shadow-lg border overflow-hidden",
            config.border
          )}>
            <div className="p-4 flex items-start gap-3">
              {/* Icon */}
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                config.iconBg
              )}>
                <Icon className={cn("h-4 w-4", config.iconColor)} strokeWidth={2.5} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-gray-900">{message}</p>
                {description && (
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress Bar */}
            {duration > 0 && (
              <div className="h-1 bg-gray-100">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: duration / 1000, ease: 'linear' }}
                  className={cn("h-full", config.progressBg)}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
