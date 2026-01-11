'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRecordingContext } from '@/contexts/recording-context'
import { X, CheckCircle2 } from 'lucide-react'

interface ProcessingModalProps {
  isOpen: boolean
  onComplete: () => void
}

export function ProcessingModal({ isOpen, onComplete }: ProcessingModalProps) {
  const context = useRecordingContext()

  const isProcessing = context?.isProcessing ?? false
  const isComplete = context?.isComplete ?? false
  const error = context?.error ?? null

  useEffect(() => {
    if (isComplete) {
      console.log('[FounderNote:ProcessingModal] Processing complete, closing...')
      const timer = setTimeout(() => {
        onComplete()
        window.dispatchEvent(new CustomEvent('noteCreated'))
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isComplete, onComplete])

  if (!isProcessing && !isComplete && !error) return null

  return (
    <AnimatePresence>
      {(isProcessing || isComplete || error) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center"
          >
            {isProcessing && (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 mx-auto mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full"
                  />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  Processing your recording
                </h3>
                <p className="text-gray-600 text-sm">
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
                  className="inline-flex items-center justify-center h-16 w-16 bg-green-50 border-2 border-green-200 rounded-full mb-4"
                >
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </motion.div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  Note created successfully!
                </h3>
                <p className="text-gray-600 text-sm">
                  Your recording has been transcribed and saved.
                </p>
              </>
            )}

            {error && (
              <>
                <div className="inline-flex items-center justify-center h-16 w-16 bg-red-50 border-2 border-red-200 rounded-full mb-4">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  Processing Error
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  {error}
                </p>
                <button
                  onClick={onComplete}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
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
