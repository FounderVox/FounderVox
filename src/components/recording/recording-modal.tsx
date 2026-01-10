'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pause, Square, Trash2 } from 'lucide-react'
import { useRecordingContext } from '@/contexts/recording-context'
import { Button } from '@/components/ui/button'
import { VoicePoweredOrb } from '@/components/ui/voice-powered-orb'

interface RecordingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RecordingModal({ isOpen, onClose, onStop }: RecordingModalProps) {
  // Use context with error handling
  let recordingContext
  
  try {
    recordingContext = useRecordingContext()
    if (!recordingContext) {
      console.error('[FounderNote:RecordingModal] RecordingContext is null')
      return null
    }
  } catch (err) {
    // Context not available
    console.error('[FounderNote:RecordingModal] RecordingContext not available:', err)
    return null
  }
  
  const {
    isRecording,
    isPaused,
    isProcessing,
    isComplete,
    duration,
    error,
    extractedData,
    audioBlob,
    startRecording,
    pauseRecording,
    stopRecording,
    cancelRecording,
    uploadAndProcess,
    getAnalyserData,
    reset
  } = recordingContext

  // Start recording when modal opens
  useEffect(() => {
    if (isOpen && !isRecording && !isProcessing && !isComplete) {
      console.log('[FounderNote:RecordingModal] Modal opened, starting recording...')
      startRecording()
    }
  }, [isOpen, isRecording, isProcessing, isComplete, startRecording])
  
  // Reset when modal closes
  useEffect(() => {
    if (!isOpen && !isProcessing && !isComplete) {
      // Only reset if we're not processing
      if (!isProcessing) {
        reset()
      }
    }
  }, [isOpen, isProcessing, isComplete, reset])

  // Handle modal close
  const handleClose = () => {
    if (isRecording) {
      cancelRecording()
    } else {
      reset()
    }
    onClose()
  }

  // Handle stop recording - close modal immediately and process in background
  const handleStop = async () => {
    console.log('[FounderNote:RecordingModal] Stopping recording...')
    
    // Stop recording and get blob FIRST, before closing modal
    const blob = await stopRecording()
    
    if (!blob) {
      console.error('[FounderNote:RecordingModal] No blob received from stopRecording')
      // Still close modal and show error via processing modal
      onClose()
      onStop?.()
      setTimeout(() => {
        uploadAndProcess() // This will show "No audio to upload" error
      }, 200)
      return
    }
    
    if (blob.size === 0) {
      console.error('[FounderNote:RecordingModal] Blob is empty', {
        size: blob.size,
        type: blob.type
      })
      // Still close modal and show error via processing modal  
      onClose()
      onStop?.()
      setTimeout(() => {
        uploadAndProcess(blob) // This will show error
      }, 200)
      return
    }
    
    console.log('[FounderNote:RecordingModal] Blob ready, starting upload...', {
      size: blob.size,
      type: blob.type
    })
    
    // Close the recording modal and show processing modal
    onClose()
    onStop?.() // Notify parent to show processing modal
    
    // Start processing with the blob directly (don't wait for state update)
    setTimeout(() => {
      uploadAndProcess(blob)
    }, 300) // Small delay to ensure modal transition and state update
  }

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get analyser data for the orb
  const { analyser, dataArray } = getAnalyserData()
  
  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('[FounderNote:RecordingModal] Modal state:', {
        isRecording,
        isPaused,
        isProcessing,
        isComplete,
        hasAnalyser: !!analyser,
        hasDataArray: !!dataArray,
        error
      })
    }
  }, [isOpen, isRecording, isPaused, isProcessing, isComplete, analyser, dataArray, error])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-4xl bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl shadow-2xl p-0 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 z-10 p-2 rounded-full hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* Loading State - Before recording starts */}
            {!isRecording && !isProcessing && !isComplete && !error && (
              <div className="space-y-8 p-12 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-flex items-center justify-center w-32 h-32 mx-auto"
                >
                  <div className="absolute w-full h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-20 blur-2xl" />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full"
                    />
                  </div>
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Preparing to record
                  </h3>
                  <p className="text-gray-400">
                    Requesting microphone access...
                  </p>
                </div>
              </div>
            )}

            {/* Recording State */}
            {isRecording && (
              <div className="relative min-h-[600px] flex flex-col">
                {/* Voice Powered Orb Visualization - Main Character */}
                <div className="relative flex-1 min-h-[500px] w-full overflow-hidden">
                  <VoicePoweredOrb
                    enableVoiceControl={isRecording && !isPaused}
                    analyser={analyser}
                    dataArray={dataArray}
                    className="w-full h-full"
                    hue={120}
                    voiceSensitivity={2.0}
                    maxRotationSpeed={1.5}
                    maxHoverIntensity={1.0}
                  />
                  
                  {/* Overlay with timer and status */}
                  <div className="absolute inset-0 flex flex-col items-center justify-between p-8 pointer-events-none">
                    {/* Top: Status badge */}
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full"
                    >
                      <div className={`h-2 w-2 rounded-full ${isPaused ? 'bg-yellow-400' : 'bg-red-500 animate-pulse'}`} />
                      <span className="text-sm font-medium text-white">
                        {isPaused ? 'Paused' : 'Recording'}
                      </span>
                    </motion.div>

                    {/* Center: Timer */}
                    <div className="text-center">
                      <h2 className="text-7xl font-bold text-white mb-2 font-mono tracking-tight drop-shadow-2xl">
                        {formatDuration(duration)}
                      </h2>
                      <p className="text-gray-300 text-sm">
                        Speak naturally
                      </p>
                    </div>

                    {/* Bottom: Controls */}
                    <div className="flex items-center justify-center gap-4 pointer-events-auto">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={pauseRecording}
                        className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center"
                      >
                        <Pause className="h-6 w-6 text-white" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStop}
                        className="h-20 w-20 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-2xl shadow-red-500/50 transition-all flex items-center justify-center ring-4 ring-red-500/30"
                      >
                        <Square className="h-8 w-8" fill="currentColor" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={cancelRecording}
                        className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center"
                      >
                        <Trash2 className="h-6 w-6 text-white" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm mx-8 mb-8">
                    <p className="text-sm text-red-300 text-center">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <div className="space-y-6 text-center py-12 px-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="inline-flex items-center justify-center w-24 h-24 mx-auto"
                >
                  <div className="absolute w-full h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-20 blur-2xl" />
                  <div className="relative w-20 h-20 border-4 border-white/20 border-t-white rounded-full" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Processing your recording
                  </h3>
                  <p className="text-gray-400">
                    Transcribing audio and extracting insights...
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Complete State */}
            {isComplete && extractedData && (
              <div className="space-y-6 text-center py-12 px-8">
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

                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    ✅ Processed your {formatDuration(duration)} update
                  </h3>
                  <p className="text-gray-400 mb-6">
                    We found:
                  </p>

                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    {extractedData.actionItems > 0 && (
                      <div className="p-4 bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-lg">
                        <div className="text-2xl font-bold text-blue-300">
                          {extractedData.actionItems}
                        </div>
                        <div className="text-sm text-blue-400">Action items</div>
                      </div>
                    )}

                    {extractedData.investorUpdates > 0 && (
                      <div className="p-4 bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 rounded-lg">
                        <div className="text-2xl font-bold text-purple-300">
                          {extractedData.investorUpdates}
                        </div>
                        <div className="text-sm text-purple-400">Investor update</div>
                      </div>
                    )}

                    {extractedData.progressLogs > 0 && (
                      <div className="p-4 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-lg">
                        <div className="text-2xl font-bold text-green-300">
                          {extractedData.progressLogs}
                        </div>
                        <div className="text-sm text-green-400">Progress log</div>
                      </div>
                    )}

                    {extractedData.productIdeas > 0 && (
                      <div className="p-4 bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded-lg">
                        <div className="text-2xl font-bold text-amber-300">
                          {extractedData.productIdeas}
                        </div>
                        <div className="text-sm text-amber-400">Product ideas</div>
                      </div>
                    )}

                    {extractedData.brainDump > 0 && (
                      <div className="p-4 bg-pink-500/20 backdrop-blur-sm border border-pink-500/30 rounded-lg">
                        <div className="text-2xl font-bold text-pink-300">
                          {extractedData.brainDump}
                        </div>
                        <div className="text-sm text-pink-400">Brain dump notes</div>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleClose}
                  size="lg"
                  className="mt-6 bg-white text-black hover:bg-gray-100"
                >
                  View Insights
                </Button>
              </div>
            )}

            {/* Error State */}
            {error && !isRecording && !isProcessing && !isComplete && (
              <div className="space-y-6 text-center py-12 px-8">
                <div className="inline-flex items-center justify-center h-20 w-20 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-full mb-4">
                  <X className="h-10 w-10 text-red-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Recording Error
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {error}
                  </p>
                </div>
                <Button
                  onClick={handleClose}
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100"
                >
                  Close
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
