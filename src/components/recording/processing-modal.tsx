'use client'

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRecordingContext } from '@/contexts/recording-context'
import { X, CheckCircle2, Sparkles, FileText } from 'lucide-react'

interface ProcessingModalProps {
  isOpen: boolean
  onComplete: () => void
}

export function ProcessingModal({ isOpen, onComplete }: ProcessingModalProps) {
  const context = useRecordingContext()

  const isProcessing = context?.isProcessing ?? false
  const isComplete = context?.isComplete ?? false
  const error = context?.error ?? null
  const reset = context?.reset

  const handleClose = useCallback(() => {
    console.log('[FounderNote:ProcessingModal] Closing and resetting...')
    onComplete()
    window.dispatchEvent(new CustomEvent('noteCreated'))
    // Reset the recording context to clear the state
    reset?.()
  }, [onComplete, reset])

  // Auto-close after success
  useEffect(() => {
    if (isComplete) {
      console.log('[FounderNote:ProcessingModal] Processing complete, will close in 2.5s...')
      const timer = setTimeout(() => {
        handleClose()
      }, 2500)

      return () => clearTimeout(timer)
    }
  }, [isComplete, handleClose])

  // Don't render if nothing to show
  if (!isProcessing && !isComplete && !error) return null

  return (
    <AnimatePresence>
      {(isProcessing || isComplete || error) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={isComplete || error ? handleClose : undefined}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
            className="relative w-full max-w-sm mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Processing State */}
            {isProcessing && (
              <div className="p-8 text-center">
                <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto mb-6">
                  {/* Outer spinning ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="absolute inset-0 w-20 h-20 border-4 border-gray-100 border-t-[#BD6750] rounded-full"
                  />
                  {/* Inner icon */}
                  <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-[#BD6750] to-[#a55a45] rounded-full flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Creating your note
                </h3>
                <p className="text-gray-500 text-sm">
                  Transcribing audio with AI...
                </p>
                {/* Progress indicator */}
                <div className="mt-6 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#BD6750] to-transparent"
                  />
                </div>
              </div>
            )}

            {/* Success State */}
            {isComplete && (
              <div className="p-8 text-center">
                {/* Success animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5, delay: 0.1 }}
                  className="relative inline-flex items-center justify-center w-20 h-20 mx-auto mb-6"
                >
                  <div className="absolute inset-0 bg-green-100 rounded-full" />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.4, delay: 0.2 }}
                    className="relative z-10"
                  >
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </motion.div>
                  {/* Celebration particles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, x: 0, y: 0 }}
                      animate={{
                        scale: [0, 1, 0],
                        x: Math.cos((i * 60) * Math.PI / 180) * 40,
                        y: Math.sin((i * 60) * Math.PI / 180) * 40
                      }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="absolute w-2 h-2 bg-green-400 rounded-full"
                    />
                  ))}
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-semibold text-gray-900 mb-2"
                >
                  Note created!
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-500 text-sm mb-6"
                >
                  Your recording has been transcribed and saved.
                </motion.p>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={handleClose}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <FileText className="h-4 w-4" />
                  View Note
                </motion.button>
                {/* Auto-close indicator */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-xs text-gray-400 mt-4"
                >
                  Closing automatically...
                </motion.p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-red-50 rounded-full" />
                  <X className="relative z-10 h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Something went wrong
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  {error}
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
