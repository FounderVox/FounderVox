'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pause, Square, Trash2 } from 'lucide-react'
import { useRecording } from '@/hooks/useRecording'
import { Button } from '@/components/ui/button'
import { VoicePoweredOrb } from '@/components/ui/voice-powered-orb'

interface RecordingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RecordingModal({ isOpen, onClose }: RecordingModalProps) {
  const {
    isRecording,
    isPaused,
    isProcessing,
    isComplete,
    duration,
    error,
    extractedData,
    startRecording,
    pauseRecording,
    stopRecording,
    cancelRecording,
    uploadAndProcess,
    getAnalyserData,
    reset
  } = useRecording()

  // Start recording when modal opens
  useEffect(() => {
    if (isOpen && !isRecording && !isProcessing && !isComplete) {
      startRecording()
    }
  }, [isOpen, isRecording, isProcessing, isComplete, startRecording])

  // Handle modal close
  const handleClose = () => {
    if (isRecording) {
      cancelRecording()
    } else {
      reset()
    }
    onClose()
  }

  // Handle stop recording
  const handleStop = async () => {
    stopRecording()
    // Wait a bit for the blob to be created
    setTimeout(() => {
      uploadAndProcess()
    }, 500)
  }

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get analyser data for the orb
  const { analyser, dataArray } = getAnalyserData()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>

            {/* Recording State */}
            {isRecording && (
              <div className="space-y-8">
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 rounded-full mb-4"
                  >
                    <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-red-700">
                      {isPaused ? 'Paused' : 'Recording'}
                    </span>
                  </motion.div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {formatDuration(duration)}
                  </h2>
                  <p className="text-gray-600">
                    Speak naturally, we'll extract the insights
                  </p>
                </div>

                {/* Voice Powered Orb Visualization */}
                <div className="relative h-64 rounded-xl overflow-hidden">
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
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={pauseRecording}
                    variant="outline"
                    size="lg"
                    className="rounded-full h-14 w-14 p-0"
                  >
                    <Pause className="h-6 w-6" />
                  </Button>

                  <Button
                    onClick={handleStop}
                    size="lg"
                    className="rounded-full h-16 w-16 p-0 bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Square className="h-6 w-6" fill="currentColor" />
                  </Button>

                  <Button
                    onClick={cancelRecording}
                    variant="outline"
                    size="lg"
                    className="rounded-full h-14 w-14 p-0"
                  >
                    <Trash2 className="h-6 w-6" />
                  </Button>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <div className="space-y-6 text-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="inline-block h-16 w-16 border-4 border-gray-200 border-t-black rounded-full"
                />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Processing your recording
                  </h3>
                  <p className="text-gray-600">
                    Transcribing audio and extracting insights...
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Complete State */}
            {isComplete && extractedData && (
              <div className="space-y-6 text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="inline-flex items-center justify-center h-16 w-16 bg-green-100 rounded-full mb-4"
                >
                  <svg
                    className="h-8 w-8 text-green-600"
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    ✅ Processed your {formatDuration(duration)} update
                  </h3>
                  <p className="text-gray-600 mb-6">
                    We found:
                  </p>

                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    {extractedData.actionItems > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700">
                          {extractedData.actionItems}
                        </div>
                        <div className="text-sm text-blue-600">Action items</div>
                      </div>
                    )}

                    {extractedData.investorUpdates > 0 && (
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-700">
                          {extractedData.investorUpdates}
                        </div>
                        <div className="text-sm text-purple-600">Investor update</div>
                      </div>
                    )}

                    {extractedData.progressLogs > 0 && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">
                          {extractedData.progressLogs}
                        </div>
                        <div className="text-sm text-green-600">Progress log</div>
                      </div>
                    )}

                    {extractedData.productIdeas > 0 && (
                      <div className="p-4 bg-amber-50 rounded-lg">
                        <div className="text-2xl font-bold text-amber-700">
                          {extractedData.productIdeas}
                        </div>
                        <div className="text-sm text-amber-600">Product ideas</div>
                      </div>
                    )}

                    {extractedData.brainDump > 0 && (
                      <div className="p-4 bg-pink-50 rounded-lg">
                        <div className="text-2xl font-bold text-pink-700">
                          {extractedData.brainDump}
                        </div>
                        <div className="text-sm text-pink-600">Brain dump notes</div>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleClose}
                  size="lg"
                  className="mt-6"
                >
                  View Insights
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
