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
        message: uploadError.message
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
    // Use service role client to bypass RLS (standard and most reliable approach)
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
    
    let recording
    let dbError
    
    // Try service role client first (bypasses RLS completely - recommended for API routes)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (serviceRoleKey) {
      try {
        console.log('[Upload] Using service role client (bypasses RLS)')
        const { createServiceRoleClient } = await import('@/lib/supabase/server')
        const serviceClient = createServiceRoleClient()
        const serviceResult = await serviceClient
          .from('recordings')
          .insert(insertData)
          .select()
          .single()
        
        if (serviceResult.data && !serviceResult.error) {
          recording = serviceResult.data
          console.log('[Upload] Successfully inserted with service role client')
        } else {
          dbError = serviceResult.error
          console.error('[Upload] Service role client failed:', serviceResult.error)
        }
      } catch (serviceError: any) {
        console.error('[Upload] Service role client exception:', serviceError)
        dbError = serviceError
      }
    }
    
    // If service role failed, try regular client with explicit auth header as fallback
    if (!recording) {
      console.log('[Upload] Service role not available or failed, trying regular client with auth header')
      
      // Create a client with explicit Authorization header using session token
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
      const sessionClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            }
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      )
      
      // Set the session explicitly
      await sessionClient.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      })
      
      const insertResult = await sessionClient
        .from('recordings')
        .insert(insertData)
        .select()
        .single()
      
      recording = insertResult.data
      dbError = insertResult.error
      
      if (dbError) {
        console.error('[Upload] Regular client with auth header also failed:', dbError)
        // If RLS error and no service role key, provide clear instructions
        const isRLSError = !serviceRoleKey && (
          dbError.message?.toLowerCase().includes('row-level security') ||
          dbError.message?.toLowerCase().includes('policy') ||
          dbError.details?.toLowerCase().includes('row-level security') ||
          String(dbError).toLowerCase().includes('row-level security') ||
          dbError.code === '42501'
        )
        
        if (isRLSError) {
          return NextResponse.json(
            { 
              error: 'RLS policy violation - Service role key required',
              details: 'Server-side database operations require the SUPABASE_SERVICE_ROLE_KEY to bypass RLS policies. This is the standard and secure approach for API routes.',
              code: 'RLS_VIOLATION',
              instructions: {
                step1: 'Go to: https://supabase.com/dashboard/project/_/settings/api',
                step2: 'Find the "service_role" key (it\'s a secret key, different from anon key)',
                step3: 'Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here',
                step4: 'Restart your dev server'
              },
              note: 'The service role key is safe to use server-side as it only works in API routes (never exposed to client)'
            },
            { status: 500 }
          )
        }
      } else {
        console.log('[Upload] Successfully inserted with regular client (using auth header)')
      }
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
