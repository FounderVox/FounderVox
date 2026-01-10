'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useRecording } from '@/hooks/useRecording'

interface RecordingContextType {
  isRecording: boolean
  isPaused: boolean
  isProcessing: boolean
  isComplete: boolean
  duration: number
  error: string | null
  extractedData: {
    actionItems: number
    investorUpdates: number
    progressLogs: number
    productIdeas: number
    brainDump: number
  } | null
  audioBlob: Blob | null
  startRecording: () => Promise<void>
  pauseRecording: () => void
  stopRecording: () => Promise<Blob | null>
  cancelRecording: () => void
  uploadAndProcess: (blobOverride?: Blob) => Promise<void>
  getAnalyserData: () => { analyser: AnalyserNode | null; dataArray: Uint8Array | null }
  reset: () => void
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined)

export function RecordingProvider({ children }: { children: ReactNode }) {
  try {
    const recordingHook = useRecording()

    if (!recordingHook) {
      console.error('[FounderNote:RecordingProvider] useRecording returned null')
      // Return children without provider if hook fails
      return <>{children}</>
    }

    return (
      <RecordingContext.Provider value={recordingHook}>
        {children}
      </RecordingContext.Provider>
    )
  } catch (error) {
    console.error('[FounderNote:RecordingProvider] Error initializing recording context:', error)
    // Return children without provider if initialization fails
    return <>{children}</>
  }
}

export function useRecordingContext() {
  const context = useContext(RecordingContext)
  if (!context) {
    throw new Error('useRecordingContext must be used within RecordingProvider')
  }
  return context
}

