'use client'

import React, { createContext, useContext, ReactNode, useMemo } from 'react'
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
  const recordingHook = useRecording()

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<RecordingContextType | null>(() => {
    if (!recordingHook) {
      console.error('[FounderNote:RecordingProvider] useRecording returned null')
      return null
    }
    return {
      isRecording: recordingHook.isRecording,
      isPaused: recordingHook.isPaused,
      isProcessing: recordingHook.isProcessing,
      isComplete: recordingHook.isComplete,
      duration: recordingHook.duration,
      error: recordingHook.error,
      extractedData: recordingHook.extractedData,
      audioBlob: recordingHook.audioBlob,
      startRecording: recordingHook.startRecording,
      pauseRecording: recordingHook.pauseRecording,
      stopRecording: recordingHook.stopRecording,
      cancelRecording: recordingHook.cancelRecording,
      uploadAndProcess: recordingHook.uploadAndProcess,
      getAnalyserData: recordingHook.getAnalyserData,
      reset: recordingHook.reset
    }
  }, [
    recordingHook.isRecording,
    recordingHook.isPaused,
    recordingHook.isProcessing,
    recordingHook.isComplete,
    recordingHook.duration,
    recordingHook.error,
    recordingHook.extractedData,
    recordingHook.audioBlob,
    recordingHook.startRecording,
    recordingHook.pauseRecording,
    recordingHook.stopRecording,
    recordingHook.cancelRecording,
    recordingHook.uploadAndProcess,
    recordingHook.getAnalyserData,
    recordingHook.reset
  ])

  if (!contextValue) {
    return <>{children}</>
  }

  return (
    <RecordingContext.Provider value={contextValue}>
      {children}
    </RecordingContext.Provider>
  )
}

export function useRecordingContext() {
  const context = useContext(RecordingContext)
  if (!context) {
    throw new Error('useRecordingContext must be used within RecordingProvider')
  }
  return context
}

