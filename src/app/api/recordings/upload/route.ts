import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload] Starting upload process...')
    const supabase = await createClient()

    // Get authenticated user and session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (authError || !user) {
      console.error('[Upload] Auth error:', {
        error: authError,
        message: authError?.message,
        code: authError?.code,
        hasSession: !!session,
        sessionUserId: session?.user?.id
      })
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      )
    }

    if (!session) {
      console.error('[Upload] No session found despite user being authenticated')
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 401 }
      )
    }

    console.log('[Upload] User authenticated:', {
      userId: user.id,
      sessionUserId: session.user.id,
      sessionAccessToken: session.access_token ? 'present' : 'missing'
    })

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
      sizeKB: (audioFile.size / 1024).toFixed(2) + ' KB',
      type: audioFile.type,
      lastModified: audioFile.lastModified
    })

    if (audioFile.size === 0) {
      console.error('[Upload] Audio file is empty!')
      return NextResponse.json(
        { error: 'Audio file is empty', details: 'No audio data was recorded' },
        { status: 400 }
      )
    }

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

    // Use service role client for storage upload (bypasses RLS on storage bucket)
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceClient = createServiceRoleClient()

    // Upload to Supabase Storage using service role client
    console.log('[Upload] Attempting to upload to storage bucket "audio-recordings" (using service role)...')
    const { data: uploadData, error: uploadError } = await serviceClient
      .storage
      .from('audio-recordings')
      .upload(fileName, buffer, {
        contentType: audioFile.type,
        upsert: false
      })

    if (uploadError) {
      console.error('[Upload] Storage error:', {
        message: uploadError.message,
        name: uploadError.name,
        cause: uploadError.cause
      })
      return NextResponse.json(
        { error: 'Failed to upload audio file', details: uploadError.message },
        { status: 500 }
      )
    }

    console.log('[Upload] File uploaded successfully:', uploadData?.path)

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = serviceClient
      .storage
      .from('audio-recordings')
      .getPublicUrl(fileName)

    // Calculate duration (approximate from file size - actual duration will be calculated during processing)
    const durationSeconds = Math.floor(audioFile.size / 16000) // Rough estimate: 16KB per second for typical audio

    // Create recording record in database using the same service role client
    const insertData = {
      user_id: user.id,
      audio_url: publicUrl,
      duration_seconds: durationSeconds,
      processing_status: 'pending' as const
    }

    console.log('[Upload] Inserting recording with data:', {
      ...insertData,
      audio_url: publicUrl.substring(0, 50) + '...'
    })

    const { data: recording, error: dbError } = await serviceClient
      .from('recordings')
      .insert(insertData)
      .select()
      .single()

    if (recording) {
      console.log('[Upload] Successfully inserted recording:', recording.id)
    }

    if (dbError) {
      console.error('[Upload] Database error:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
        userId: user.id,
        sessionUserId: session.user.id,
        insertData: insertData,
        fullError: dbError
      })
      // Try to clean up the uploaded file
      try {
        await serviceClient.storage.from('audio-recordings').remove([fileName])
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
