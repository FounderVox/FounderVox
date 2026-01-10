'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRecordingContext } from '@/contexts/recording-context'

interface ProcessingModalProps {
  isOpen: boolean
  onComplete: () => void
}

export function ProcessingModal({ isOpen, onComplete }: ProcessingModalProps) {
  // Use context with error handling
  let isProcessing = false
  let isComplete = false
  let error: string | null = null
  
  try {
    const context = useRecordingContext()
    if (context) {
      isProcessing = context.isProcessing
      isComplete = context.isComplete
      error = context.error
    }
  } catch (err) {
    // Context not available, don't show modal
    console.warn('[FounderNote:ProcessingModal] Context not available:', err)
    return null
  }

  // Auto-close when complete
  useEffect(() => {
    if (isComplete) {
      console.log('[FounderNote:ProcessingModal] Processing complete, closing...')
      const timer = setTimeout(() => {
        onComplete()
        // Reload dashboard to show new note
        window.dispatchEvent(new CustomEvent('noteCreated'))
        window.location.reload()
      }, 1500) // Show success briefly
      
      return () => clearTimeout(timer)
    }
  }, [isComplete, onComplete])

  // Always show when processing or complete, regardless of isOpen prop
  // This allows the modal to appear even if the recording modal closed
  if (!isProcessing && !isComplete && !error) return null

  return (
    <AnimatePresence>
      {(isProcessing || isComplete || error) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl shadow-2xl p-8 text-center"
          >
            {isProcessing && (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="inline-flex items-center justify-center w-24 h-24 mx-auto mb-6"
                >
                  <div className="absolute w-full h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-20 blur-2xl" />
                  <div className="relative w-20 h-20 border-4 border-white/20 border-t-white rounded-full" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Processing your recording
                </h3>
                <p className="text-gray-400">
                  Transcribing audio and creating your note...
                </p>
              </>
            )}

            {isComplete && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="inline-flex items-center justify-center h-20 w-20 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-full mb-4"
                >
                  <svg
                    className="h-10 w-10 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  ✅ Note created successfully!
                </h3>
                <p className="text-gray-400">
                  Your recording has been transcribed and saved.
                </p>
              </>
            )}

            {error && (
              <>
                <div className="inline-flex items-center justify-center h-20 w-20 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-full mb-4">
                  <svg
                    className="h-10 w-10 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Processing Error
                </h3>
                <p className="text-gray-400 mb-4">
                  {error}
                </p>
                <button
                  onClick={onComplete}
                  className="px-6 py-2 bg-white text-black rounded-full hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

