import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createDeepgramClient, DeepgramClient } from '@deepgram/sdk'
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

// Lazy initialization to avoid build-time errors
let deepgramClient: DeepgramClient | null = null

function getDeepgram(): DeepgramClient {
  if (!deepgramClient) {
    deepgramClient = createDeepgramClient(process.env.DEEPGRAM_API_KEY!)
  }
  return deepgramClient
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user and session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (authError || !user) {
      console.error('[Process] Auth error:', {
        error: authError,
        message: authError?.message,
        hasSession: !!session
      })
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      )
    }

    if (!session) {
      console.error('[Process] No session found')
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 401 }
      )
    }

    console.log('[Process] User authenticated:', user.id)

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
    const { result, error: deepgramError } = await getDeepgram().listen.prerecorded.transcribeFile(
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

      // Generate embedding for semantic search (fire and forget)
      generateEmbeddingAsync(note.id).catch(err =>
        console.error('[Process] Embedding generation failed:', err)
      )
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

// Generate embedding for semantic search (async, non-blocking)
async function generateEmbeddingAsync(noteId: string): Promise<void> {
  try {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const { createServiceRoleClient } = await import('@/lib/supabase/server')

    // Get the note content
    const dbClient = createServiceRoleClient()
    const { data: note, error: fetchError } = await dbClient
      .from('notes')
      .select('id, title, formatted_content, raw_transcript')
      .eq('id', noteId)
      .single()

    if (fetchError || !note) {
      console.error('[Embedding] Note not found:', noteId)
      return
    }

    // Combine text for embedding
    const textForEmbedding = [
      note.title || '',
      note.formatted_content || note.raw_transcript || ''
    ].filter(Boolean).join('\n\n')

    if (!textForEmbedding.trim()) {
      console.log('[Embedding] No content to embed for note:', noteId)
      return
    }

    // Generate embedding
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: textForEmbedding.substring(0, 8000),
    })

    const embedding = embeddingResponse.data[0].embedding
    const embeddingString = `[${embedding.join(',')}]`

    // Save embedding
    const { error: updateError } = await dbClient
      .from('notes')
      .update({ embedding: embeddingString })
      .eq('id', noteId)

    if (updateError) {
      console.error('[Embedding] Failed to save embedding:', updateError)
    } else {
      console.log('[Embedding] Successfully generated embedding for note:', noteId)
    }
  } catch (error) {
    console.error('[Embedding] Error generating embedding:', error)
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

