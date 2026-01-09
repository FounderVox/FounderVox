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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

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
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      streamRef.current = stream

      // Set up Web Audio API for waveform visualization
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 2048
      const bufferLength = analyserRef.current.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLength)
      source.connect(analyserRef.current)

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      })
      mediaRecorderRef.current = mediaRecorder

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        setState(prev => ({ ...prev, audioBlob, isRecording: false }))
      }

      mediaRecorder.start(1000) // Collect data every second

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
    if (mediaRecorderRef.current && state.isRecording) {
      if (state.isPaused) {
        mediaRecorderRef.current.resume()
        setState(prev => ({ ...prev, isPaused: false }))
      } else {
        mediaRecorderRef.current.pause()
        setState(prev => ({ ...prev, isPaused: true }))
      }
    }
  }, [state.isRecording, state.isPaused])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop()

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [state.isRecording])

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

  const uploadAndProcess = useCallback(async () => {
    if (!state.audioBlob) {
      setState(prev => ({ ...prev, error: 'No audio to upload' }))
      return
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }))

    try {
      // Step 1: Upload audio
      const formData = new FormData()
      formData.append('audio', state.audioBlob, `recording-${Date.now()}.webm`)

      const uploadResponse = await fetch('/api/recordings/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const uploadData = await uploadResponse.json()
      const recordingId = uploadData.recording.id

      setState(prev => ({ ...prev, recordingId }))

      // Step 2: Process recording
      const processResponse = await fetch('/api/recordings/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingId })
      })

      if (!processResponse.ok) {
        const errorData = await processResponse.json()
        throw new Error(errorData.error || 'Processing failed')
      }

      const processData = await processResponse.json()

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
  }, [state.audioBlob])

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
