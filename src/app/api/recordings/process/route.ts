import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createDeepgramClient } from '@deepgram/sdk'
import {
  extractActionItems,
  extractInvestorUpdate,
  extractProgressLog,
  extractProductIdeas,
  extractBrainDump
} from '@/lib/ai/extraction'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max execution time

const deepgram = createDeepgramClient(process.env.DEEPGRAM_API_KEY!)

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

    // Get recording ID from request
    const { recordingId } = await request.json()

    if (!recordingId) {
      return NextResponse.json(
        { error: 'Recording ID required' },
        { status: 400 }
      )
    }

    // Get recording from database
    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', recordingId)
      .eq('user_id', user.id)
      .single()

    if (recordingError || !recording) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      )
    }

    if (recording.processing_status !== 'pending') {
      return NextResponse.json(
        { error: `Recording already ${recording.processing_status}` },
        { status: 400 }
      )
    }

    // Update status to processing
    await supabase
      .from('recordings')
      .update({ processing_status: 'processing' })
      .eq('id', recordingId)

    console.log('[Process] Starting transcription for recording:', recordingId)

    // Download audio from Supabase Storage
    const audioPath = recording.audio_url.split('/audio-recordings/').pop()
    if (!audioPath) {
      throw new Error('Invalid audio URL')
    }

    const { data: audioData, error: downloadError } = await supabase
      .storage
      .from('audio-recordings')
      .download(audioPath)

    if (downloadError || !audioData) {
      throw new Error(`Failed to download audio: ${downloadError?.message}`)
    }

    console.log('[Process] Audio downloaded, sending to Deepgram')

    // Convert Blob to Buffer
    const arrayBuffer = await audioData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Transcribe with Deepgram
    const { result, error: deepgramError } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: 'nova-2',
        smart_format: true,
        filler_words: true,
        paragraphs: true,
        language: 'en',
        punctuate: true,
        diarize: false
      }
    )

    if (deepgramError) {
      throw new Error(`Deepgram error: ${deepgramError.message}`)
    }

    const rawTranscript = result.results?.channels[0]?.alternatives[0]?.transcript

    if (!rawTranscript || rawTranscript.trim().length === 0) {
      throw new Error('No transcript generated')
    }

    console.log('[Process] Transcription complete, length:', rawTranscript.length)

    // Get actual duration from Deepgram
    const actualDuration = result.metadata?.duration || recording.duration_seconds

    // Generate cleaned transcript using GPT-4o (for display in note)
    const cleanedTranscript = await generateCleanedTranscript(rawTranscript)

    // Update recording with transcripts and mark as completed
    await supabase
      .from('recordings')
      .update({
        raw_transcript: rawTranscript,
        cleaned_transcript: cleanedTranscript,
        duration_seconds: Math.floor(actualDuration),
        processing_status: 'completed'
      })
      .eq('id', recordingId)

    console.log('[Process] Creating note from transcript...')

    // Create a note from the transcript
    const noteTitle = `Recording ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: noteTitle,
        content: cleanedTranscript,
        formatted_content: cleanedTranscript,
        raw_transcript: rawTranscript,
        audio_url: recording.audio_url,
        duration_seconds: Math.floor(actualDuration),
        template_type: 'recording',
        template_label: 'Recording'
      })
      .select()
      .single()

    if (noteError) {
      console.error('[Process] Error creating note:', noteError)
      // Continue even if note creation fails
    } else {
      console.log('[Process] Note created successfully:', note.id)
    }

    console.log('[Process] Processing complete for recording:', recordingId)

    return NextResponse.json({
      success: true,
      recording: {
        id: recordingId,
        status: 'completed',
        transcript: cleanedTranscript,
        duration: Math.floor(actualDuration)
      },
      note: note ? { id: note.id } : null,
      extracted: {
        actionItems: 0,
        investorUpdates: 0,
        progressLogs: 0,
        productIdeas: 0,
        brainDump: 0
      }
    })

  } catch (error) {
    console.error('[Process] Error:', error)

    // Try to update recording status to failed
    try {
      const { recordingId } = await request.json()
      if (recordingId) {
        const supabase = await createClient()
        await supabase
          .from('recordings')
          .update({ processing_status: 'failed' })
          .eq('id', recordingId)
      }
    } catch (updateError) {
      console.error('[Process] Failed to update error status:', updateError)
    }

    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function generateCleanedTranscript(rawTranscript: string): Promise<string> {
  try {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert editor. Clean up this transcript by: 1) Removing filler words that slipped through, 2) Fixing obvious errors, 3) Organizing into clear paragraphs, 4) Maintaining the original meaning and tone. Return only the cleaned transcript, no explanations.'
        },
        {
          role: 'user',
          content: rawTranscript
        }
      ],
      temperature: 0.3
    })

    return response.choices[0]?.message?.content || rawTranscript
  } catch (error) {
    console.error('[Process] Error cleaning transcript:', error)
    return rawTranscript // Return raw if cleaning fails
  }
}

