'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pause, Square, Trash2, Mic, Circle } from 'lucide-react'
import { useRecordingContext } from '@/contexts/recording-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RecordingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RecordingModal({ isOpen, onClose, onStop }: RecordingModalProps & { onStop?: () => void }) {
  const recordingContext = useRecordingContext()
  const hasStartedRef = useRef(false)
  const [waveform, setWaveform] = useState<number[]>([])

  const isRecording = recordingContext?.isRecording ?? false
  const isPaused = recordingContext?.isPaused ?? false
  const isProcessing = recordingContext?.isProcessing ?? false
  const isComplete = recordingContext?.isComplete ?? false
  const duration = recordingContext?.duration ?? 0
  const error = recordingContext?.error ?? null
  const extractedData = recordingContext?.extractedData ?? null
  const startRecording = recordingContext?.startRecording
  const pauseRecording = recordingContext?.pauseRecording
  const stopRecording = recordingContext?.stopRecording
  const cancelRecording = recordingContext?.cancelRecording
  const uploadAndProcess = recordingContext?.uploadAndProcess
  const getAnalyserData = recordingContext?.getAnalyserData

  // Simple waveform visualization
  useEffect(() => {
    if (!isRecording || isPaused) {
      setWaveform([])
      return
    }

    const interval = setInterval(() => {
      const analyserData = getAnalyserData?.()
      if (analyserData?.analyser && analyserData?.dataArray) {
        analyserData.analyser.getByteFrequencyData(analyserData.dataArray as Uint8Array<ArrayBuffer>)
        const data = Array.from(analyserData.dataArray.slice(0, 20))
        const normalized = data.map(val => Math.min(val / 255, 1))
        setWaveform(normalized)
      } else {
        // Fallback: random waveform for visual feedback
        setWaveform(Array(20).fill(0).map(() => Math.random() * 0.5 + 0.3))
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isRecording, isPaused, getAnalyserData])

  useEffect(() => {
    if (!recordingContext || !startRecording) return
    if (isOpen && !hasStartedRef.current) {
      hasStartedRef.current = true
      startRecording()
    }
    if (!isOpen) {
      hasStartedRef.current = false
    }
  }, [isOpen, recordingContext, startRecording])

  useEffect(() => {
    if (!recordingContext || !recordingContext.reset) return
    if (!isOpen && !isProcessing && !isComplete) {
      recordingContext.reset()
    }
  }, [isOpen, isProcessing, isComplete, recordingContext])

  const handleClose = () => {
    if (isRecording) {
      cancelRecording?.()
    } else {
      recordingContext?.reset?.()
    }
    onClose()
  }

  const handleStop = async () => {
    if (!stopRecording || !uploadAndProcess) return

    const blob = await stopRecording()
    if (!blob || blob.size === 0) {
      onClose()
      onStop?.()
      setTimeout(() => uploadAndProcess(blob || undefined), 200)
      return
    }

    onClose()
    onStop?.()
    setTimeout(() => uploadAndProcess(blob), 300)
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!recordingContext) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Record Voice Note</h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-black transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Loading State */}
            {!isRecording && !isProcessing && !isComplete && !error && (
              <div className="space-y-6 p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 mx-auto">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black mb-2">Preparing to record</h3>
                  <p className="text-gray-600 text-sm">Requesting microphone access...</p>
                </div>
              </div>
            )}

            {/* Recording State */}
            {isRecording && (
              <div className="p-8">
                {/* Status Badge */}
                <div className="flex items-center justify-center mb-8">
                  <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
                    isPaused 
                      ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  )}>
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"
                    )} />
                    <span>{isPaused ? 'Paused' : 'Recording'}</span>
                  </div>
                </div>

                {/* Timer */}
                <div className="text-center mb-12">
                  <h2 className="text-6xl font-bold text-black mb-3 font-mono tracking-tight">
                    {formatDuration(duration)}
                  </h2>
                  <p className="text-gray-500 text-sm">Speak naturally</p>
                </div>

                {/* Simple Waveform Visualization */}
                <div className="flex items-center justify-center gap-1 h-24 mb-12">
                  {waveform.length > 0 ? (
                    waveform.map((height, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: `${height * 100}%` }}
                        transition={{ duration: 0.1 }}
                        className="w-1.5 bg-[#BD6750] rounded-full"
                        style={{ minHeight: '8px', maxHeight: '80px' }}
                      />
                    ))
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <Circle className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={pauseRecording}
                    className="h-14 w-14 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-black transition-all flex items-center justify-center border border-gray-200"
                  >
                    <Pause className="h-5 w-5" />
                  </button>

                  <button
                    onClick={handleStop}
                    className="h-20 w-20 rounded-full bg-[#BD6750] hover:bg-[#a55a45] text-white transition-all flex items-center justify-center shadow-lg"
                  >
                    <Square className="h-8 w-8" fill="currentColor" />
                  </button>

                  <button
                    onClick={cancelRecording}
                    className="h-14 w-14 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-black transition-all flex items-center justify-center border border-gray-200"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                {error && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 text-center">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <div className="space-y-6 text-center py-12 px-8">
                <div className="inline-flex items-center justify-center w-20 h-20 mx-auto">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black mb-2">Processing your recording</h3>
                  <p className="text-gray-600 text-sm">Transcribing audio and creating your note...</p>
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
              <div className="space-y-6 text-center py-12 px-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="inline-flex items-center justify-center h-16 w-16 bg-green-50 border-2 border-green-200 rounded-full mb-4"
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
                  <h3 className="text-lg font-semibold text-black mb-2">
                    Note created successfully!
                  </h3>
                  <p className="text-gray-600 text-sm mb-6">
                    Your {formatDuration(duration)} recording has been transcribed and saved.
                  </p>
                </div>
                <Button
                  onClick={handleClose}
                  className="bg-black text-white hover:bg-gray-900"
                >
                  View Note
                </Button>
              </div>
            )}

            {/* Error State */}
            {error && !isRecording && !isProcessing && !isComplete && (
              <div className="space-y-6 text-center py-12 px-8">
                <div className="inline-flex items-center justify-center h-16 w-16 bg-red-50 border-2 border-red-200 rounded-full mb-4">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black mb-2">Recording Error</h3>
                  <p className="text-gray-600 text-sm mb-6">{error}</p>
                </div>
                <Button
                  onClick={handleClose}
                  className="bg-black text-white hover:bg-gray-900"
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
