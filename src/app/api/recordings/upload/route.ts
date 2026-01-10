import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload] Starting upload process...')
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[Upload] Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Upload] User authenticated:', user.id)

    // Parse form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      console.error('[Upload] No audio file in form data')
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    console.log('[Upload] Audio file received:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type
    })

    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = audioFile.name.split('.').pop() || 'webm'
    const fileName = `${user.id}/${timestamp}.${fileExt}`

    console.log('[Upload] Generated filename:', fileName)

    // Convert File to ArrayBuffer then to Buffer for Supabase
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('[Upload] Converted to buffer:', {
      bufferSize: buffer.length,
      arrayBufferSize: arrayBuffer.byteLength
    })

    // Upload to Supabase Storage
    console.log('[Upload] Attempting to upload to storage bucket "audio-recordings"...')
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('audio-recordings')
      .upload(fileName, buffer, {
        contentType: audioFile.type,
        upsert: false
      })

    if (uploadError) {
      console.error('[Upload] Storage error:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError.error,
        name: uploadError.name
      })
      return NextResponse.json(
        { error: 'Failed to upload audio file', details: uploadError.message },
        { status: 500 }
      )
    }

    console.log('[Upload] File uploaded successfully:', uploadData?.path)

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase
      .storage
      .from('audio-recordings')
      .getPublicUrl(fileName)

    // Calculate duration (approximate from file size - actual duration will be calculated during processing)
    const durationSeconds = Math.floor(audioFile.size / 16000) // Rough estimate: 16KB per second for typical audio

    // Create recording record in database
    const { data: recording, error: dbError } = await supabase
      .from('recordings')
      .insert({
        user_id: user.id,
        audio_url: publicUrl,
        duration_seconds: durationSeconds,
        processing_status: 'pending'
      })
      .select()
      .single()

    if (dbError) {
      console.error('[Upload] Database error:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
        fullError: dbError
      })
      // Try to clean up the uploaded file
      try {
        await supabase.storage.from('audio-recordings').remove([fileName])
        console.log('[Upload] Cleaned up uploaded file after DB error')
      } catch (cleanupError) {
        console.error('[Upload] Failed to clean up file:', cleanupError)
      }
      return NextResponse.json(
        { 
          error: 'Failed to create recording record', 
          details: dbError.message,
          code: dbError.code,
          hint: dbError.hint
        },
        { status: 500 }
      )
    }

    console.log('[Upload] Success:', recording.id)

    return NextResponse.json({
      success: true,
      recording: {
        id: recording.id,
        audio_url: recording.audio_url,
        status: recording.processing_status
      }
    })

  } catch (error) {
    console.error('[Upload] Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    )
  }
}
