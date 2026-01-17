'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  isProcessing: boolean
  isComplete: boolean
  duration: number
  audioBlob: Blob | null
  recordingId: string | null
  error: string | null
  extractedData: {
    actionItems: number
    investorUpdates: number
    progressLogs: number
    productIdeas: number
    brainDump: number
  } | null
}

interface AudioAnalyserData {
  analyser: AnalyserNode | null
  dataArray: Uint8Array | null
}

export function useRecording() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    isProcessing: false,
    isComplete: false,
    duration: 0,
    audioBlob: null,
    recordingId: null,
    error: null,
    extractedData: null
  })

  // Use refs to access current state in callbacks without causing re-renders
  const stateRef = useRef(state)
  stateRef.current = state

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const mimeTypeRef = useRef<string>('audio/webm')

  // Timer effect
  useEffect(() => {
    if (state.isRecording && !state.isPaused) {
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, duration: prev.duration + 1 }))
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [state.isRecording, state.isPaused])

  const startRecording = useCallback(async () => {
    try {
      console.log('[FounderNote:Recording] Requesting microphone access...')

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      console.log('[FounderNote:Recording] Microphone access granted')
      streamRef.current = stream

      // Set up Web Audio API for waveform visualization
      console.log('[FounderNote:Recording] Setting up Web Audio API...')
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 2048
      const bufferLength = analyserRef.current.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLength)
      source.connect(analyserRef.current)
      console.log('[FounderNote:Recording] Web Audio API ready, analyser connected')

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      })
      mediaRecorderRef.current = mediaRecorder
      
      // Store mimeType in a ref for later use (can't set on MediaRecorder as it's read-only)
      mimeTypeRef.current = mimeType

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log('[FounderNote:Recording] Data chunk received:', {
            size: event.data.size,
            type: event.data.type,
            totalChunks: audioChunksRef.current.length + 1
          })
          audioChunksRef.current.push(event.data)
        } else {
          console.warn('[FounderNote:Recording] Received empty data chunk')
        }
      }
      
      // Also request final data when stopping
      mediaRecorder.onstop = () => {
        console.log('[FounderNote:Recording] MediaRecorder stopped event fired', {
          chunks: audioChunksRef.current.length,
          totalSize: audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0)
        })
      }

      // Note: onstop handler is set dynamically in stopRecording to return a promise
      // This allows us to wait for the blob to be ready

      // Start recording - collect data every 100ms to ensure we get chunks
      // Some browsers need more frequent data collection
      mediaRecorder.start(100)
      console.log('[FounderNote:Recording] Recording started', {
        mimeType,
        state: mediaRecorder.state,
        timeslice: 100
      })

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        error: null,
        duration: 0
      }))

    } catch (error) {
      console.error('Error starting recording:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start recording'
      }))
    }
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && stateRef.current.isRecording) {
      if (stateRef.current.isPaused) {
        mediaRecorderRef.current.resume()
        setState(prev => ({ ...prev, isPaused: false }))
      } else {
        mediaRecorderRef.current.pause()
        setState(prev => ({ ...prev, isPaused: true }))
      }
    }
  }, [])

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        console.warn('[FounderNote:Recording] Cannot stop: MediaRecorder is null')
        resolve(null)
        return
      }

      if (!stateRef.current.isRecording) {
        console.warn('[FounderNote:Recording] Cannot stop: not currently recording')
        resolve(null)
        return
      }
      
      const mimeType = mimeTypeRef.current || 'audio/webm'
      const recorder = mediaRecorderRef.current
      
      console.log('[FounderNote:Recording] Stopping MediaRecorder...', {
        chunks: audioChunksRef.current.length,
        mimeType,
        recorderState: recorder.state
      })
      
      // Request final data before stopping
      if (recorder.state === 'recording' || recorder.state === 'paused') {
        try {
          recorder.requestData()
          console.log('[FounderNote:Recording] Requested final data chunk')
        } catch (e) {
          console.warn('[FounderNote:Recording] Could not request final data:', e)
        }
      }
      
      // Set up a one-time listener for when the blob is ready
      const originalOnStop = recorder.onstop
      recorder.onstop = () => {
        console.log('[FounderNote:Recording] MediaRecorder onstop fired', {
          chunks: audioChunksRef.current.length,
          totalSize: audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0)
        })
        
        // Wait a moment for any final chunks to arrive
        setTimeout(() => {
          if (audioChunksRef.current.length === 0) {
            console.error('[FounderNote:Recording] No audio chunks collected!')
            setState(prev => ({ ...prev, isRecording: false, error: 'No audio data was recorded' }))
            resolve(null)
            return
          }
          
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
          console.log('[FounderNote:Recording] Blob created:', {
            size: audioBlob.size,
            type: audioBlob.type,
            chunks: audioChunksRef.current.length
          })
          
          if (audioBlob.size === 0) {
            console.error('[FounderNote:Recording] Blob is empty!')
            setState(prev => ({ ...prev, isRecording: false, error: 'Recorded audio is empty' }))
            resolve(null)
            return
          }
          
          setState(prev => ({ ...prev, audioBlob, isRecording: false }))
          
          // Call original handler if it exists
          if (originalOnStop) {
            try {
              originalOnStop.call(recorder, new Event('stop'))
            } catch (e) {
              console.warn('[FounderNote:Recording] Error calling original onstop:', e)
            }
          }
          
          resolve(audioBlob)
        }, 150) // Wait for final chunks
      }

      try {
        // Stop the recorder
        if (recorder.state === 'recording') {
          recorder.stop()
        } else if (recorder.state === 'paused') {
          recorder.stop()
        }
        console.log('[FounderNote:Recording] MediaRecorder.stop() called, state:', recorder.state)
      } catch (error) {
        console.error('[FounderNote:Recording] Error stopping MediaRecorder:', error)
        // Try to create blob from existing chunks
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
          setState(prev => ({ ...prev, audioBlob, isRecording: false }))
          resolve(audioBlob)
        } else {
          resolve(null)
        }
        return
      }

      // Stop all tracks AFTER a delay to ensure final data is collected
      setTimeout(() => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop()
            console.log('[FounderNote:Recording] Stopped track:', track.kind)
          })
        }

        // Close audio context
        if (audioContextRef.current) {
          try {
            audioContextRef.current.close()
            console.log('[FounderNote:Recording] AudioContext closed')
          } catch (e) {
            console.warn('[FounderNote:Recording] Error closing AudioContext:', e)
          }
        }
      }, 200) // Delay stopping tracks to allow final data collection
    })
  }, [])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    // Reset state
    audioChunksRef.current = []
    setState({
      isRecording: false,
      isPaused: false,
      isProcessing: false,
      isComplete: false,
      duration: 0,
      audioBlob: null,
      recordingId: null,
      error: null,
      extractedData: null
    })
  }, [])

  const uploadAndProcess = useCallback(async (blobOverride?: Blob) => {
    // Use provided blob or state blob
    const audioBlob = blobOverride || stateRef.current.audioBlob

    if (!audioBlob) {
      console.error('[FounderNote:Recording] No audio blob to upload', {
        hasBlobOverride: !!blobOverride,
        hasStateBlob: !!stateRef.current.audioBlob,
        chunks: audioChunksRef.current.length
      })
      setState(prev => ({ ...prev, error: 'No audio to upload' }))
      return
    }

    console.log('[FounderNote:Recording] Starting upload and processing...', {
      blobSize: audioBlob.size,
      blobType: audioBlob.type,
      chunks: audioChunksRef.current.length
    })
    setState(prev => ({ ...prev, isProcessing: true, error: null, audioBlob: audioBlob }))

    try {
      // Step 1: Upload audio
      console.log('[FounderNote:Recording] Uploading audio...', {
        size: audioBlob.size,
        type: audioBlob.type
      })
      const formData = new FormData()
      formData.append('audio', audioBlob, `recording-${Date.now()}.webm`)

      console.log('[FounderNote:Recording] Sending fetch request to /api/recordings/upload...')
      let uploadResponse: Response
      try {
        uploadResponse = await fetch('/api/recordings/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include' // Ensure cookies are sent
        })
      } catch (fetchError: any) {
        console.error('[FounderNote:Recording] Network error during upload:', {
          message: fetchError?.message,
          name: fetchError?.name,
          stack: fetchError?.stack
        })
        throw new Error(`Network error: ${fetchError?.message || 'Failed to connect to server'}`)
      }

      console.log('[FounderNote:Recording] Upload response received:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        ok: uploadResponse.ok,
        headers: Object.fromEntries(uploadResponse.headers.entries())
      })

      if (!uploadResponse.ok) {
        let errorMessage = 'Upload failed'
        try {
          const errorData = await uploadResponse.json()
          errorMessage = errorData.error || errorData.details || 'Upload failed'
          console.error('[FounderNote:Recording] Upload error details:', {
            status: uploadResponse.status,
            error: errorData.error,
            details: errorData.details,
            code: errorData.code,
            instructions: errorData.instructions,
            fullError: errorData
          })
        } catch (e) {
          const errorText = await uploadResponse.text()
          console.error('[FounderNote:Recording] Upload error (non-JSON):', errorText)
          errorMessage = errorText || 'Upload failed'
        }
        throw new Error(errorMessage)
      }

      const uploadData = await uploadResponse.json()
      const recordingId = uploadData.recording.id
      console.log('[FounderNote:Recording] Upload successful, recording ID:', recordingId)

      setState(prev => ({ ...prev, recordingId }))

      // Step 2: Process recording (transcription with Deepgram)
      console.log('[FounderNote:Recording] Starting AI processing (Deepgram transcription)...')
      let processResponse: Response
      try {
        processResponse = await fetch('/api/recordings/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordingId }),
          credentials: 'include' // Ensure cookies are sent
        })
      } catch (fetchError: any) {
        console.error('[FounderNote:Recording] Network error during processing:', {
          message: fetchError?.message,
          name: fetchError?.name,
          stack: fetchError?.stack
        })
        throw new Error(`Network error during processing: ${fetchError?.message || 'Failed to connect'}`)
      }

      console.log('[FounderNote:Recording] Process response received:', {
        status: processResponse.status,
        statusText: processResponse.statusText,
        ok: processResponse.ok
      })

      if (!processResponse.ok) {
        let errorMessage = 'Processing failed'
        try {
          const errorData = await processResponse.json()
          errorMessage = errorData.error || errorData.details || 'Processing failed'
          console.error('[FounderNote:Recording] Process error details:', {
            status: processResponse.status,
            error: errorData.error,
            details: errorData.details,
            fullError: errorData
          })
        } catch (e) {
          const errorText = await processResponse.text()
          console.error('[FounderNote:Recording] Process error (non-JSON):', errorText)
          errorMessage = errorText || 'Processing failed'
        }
        throw new Error(errorMessage)
      }

      const processData = await processResponse.json()
      console.log('[FounderNote:Recording] Processing complete:', processData.extracted)

      setState(prev => ({
        ...prev,
        isProcessing: false,
        isComplete: true,
        extractedData: processData.extracted
      }))

    } catch (error) {
      console.error('Error uploading/processing:', error)
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to process recording'
      }))
    }
  }, [])

  const getAnalyserData = useCallback((): AudioAnalyserData => {
    return {
      analyser: analyserRef.current,
      dataArray: dataArrayRef.current
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isRecording: false,
      isPaused: false,
      isProcessing: false,
      isComplete: false,
      duration: 0,
      audioBlob: null,
      recordingId: null,
      error: null,
      extractedData: null
    })
    audioChunksRef.current = []
  }, [])

  return {
    ...state,
    startRecording,
    pauseRecording,
    stopRecording,
    cancelRecording,
    uploadAndProcess,
    getAnalyserData,
    reset
  }
}
