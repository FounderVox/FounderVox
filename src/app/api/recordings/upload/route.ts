import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = audioFile.name.split('.').pop() || 'webm'
    const fileName = `${user.id}/${timestamp}.${fileExt}`

    // Convert File to ArrayBuffer then to Buffer for Supabase
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('audio-recordings')
      .upload(fileName, buffer, {
        contentType: audioFile.type,
        upsert: false
      })

    if (uploadError) {
      console.error('[Upload] Storage error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload audio file', details: uploadError.message },
        { status: 500 }
      )
    }

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
      console.error('[Upload] Database error:', dbError)
      // Try to clean up the uploaded file
      await supabase.storage.from('audio-recordings').remove([fileName])
      return NextResponse.json(
        { error: 'Failed to create recording record', details: dbError.message },
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
    console.error('[Upload] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
