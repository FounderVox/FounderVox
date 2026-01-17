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
  const apiKey = process.env.DEEPGRAM_API_KEY
  console.log('[Process:Deepgram] Initializing Deepgram client:', {
    hasApiKey: !!apiKey,
    keyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING'
  })

  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY is not configured. Please add it to your .env.local file.')
  }

  if (!deepgramClient) {
    deepgramClient = createDeepgramClient(apiKey)
  }
  return deepgramClient
}

export async function POST(request: NextRequest) {
  // Parse request body first (can only be read once)
  let recordingId: string | undefined
  try {
    const body = await request.json()
    recordingId = body.recordingId
  } catch (parseError) {
    console.error('[Process] Failed to parse request body:', parseError)
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }

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

    console.log('[Process] Audio downloaded, preparing for Deepgram')

    // Convert Blob to Buffer
    const arrayBuffer = await audioData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('[Process:Deepgram] Buffer prepared:', {
      bufferSize: buffer.length,
      bufferSizeKB: (buffer.length / 1024).toFixed(2) + ' KB',
      isValidBuffer: Buffer.isBuffer(buffer),
      firstBytes: buffer.slice(0, 20).toString('hex')
    })

    if (buffer.length === 0) {
      throw new Error('Audio buffer is empty - no audio data to transcribe')
    }

    // Transcribe with Deepgram
    console.log('[Process:Deepgram] Sending to Deepgram for transcription...')
    let result, deepgramError
    try {
      const response = await getDeepgram().listen.prerecorded.transcribeFile(
        buffer,
        {
          model: 'nova-2',
          smart_format: true,
          filler_words: true,
          paragraphs: true,
          language: 'en',
          punctuate: true,
          diarize: false,
          mimetype: 'audio/webm'
        }
      )
      result = response.result
      deepgramError = response.error
      console.log('[Process:Deepgram] Response received:', {
        hasResult: !!result,
        hasError: !!deepgramError,
        resultKeys: result ? Object.keys(result) : [],
        metadata: result?.metadata
      })
    } catch (dgError: any) {
      console.error('[Process:Deepgram] Exception during transcription:', {
        message: dgError?.message,
        name: dgError?.name,
        code: dgError?.code,
        status: dgError?.status,
        stack: dgError?.stack,
        fullError: JSON.stringify(dgError, null, 2)
      })
      throw new Error(`Deepgram transcription failed: ${dgError?.message || 'Unknown error'}`)
    }

    if (deepgramError) {
      console.error('[Process:Deepgram] Deepgram returned error:', {
        message: deepgramError.message,
        fullError: JSON.stringify(deepgramError, null, 2)
      })
      throw new Error(`Deepgram error: ${deepgramError.message}`)
    }

    if (!result) {
      console.error('[Process:Deepgram] No result returned from Deepgram')
      throw new Error('Deepgram returned no result')
    }

    const rawTranscript = result.results?.channels[0]?.alternatives[0]?.transcript

    if (!rawTranscript || rawTranscript.trim().length === 0) {
      throw new Error('No transcript generated')
    }

    console.log('[Process] Transcription complete, length:', rawTranscript.length)

    // Get actual duration from Deepgram
    const actualDuration = result.metadata?.duration || recording.duration_seconds

    // Generate cleaned transcript using GPT-4o (for display in note)
    console.log('[Process] Cleaning transcript with GPT-4o...')
    const cleanedTranscript = await generateCleanedTranscript(rawTranscript)
    console.log('[Process] Transcript cleaned, length:', cleanedTranscript.length)

    // Use service role client for database operations (bypasses RLS)
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceClient = createServiceRoleClient()

    // Update recording with transcripts and mark as completed
    console.log('[Process] Updating recording with transcripts...')
    const { error: updateError } = await serviceClient
      .from('recordings')
      .update({
        raw_transcript: rawTranscript,
        cleaned_transcript: cleanedTranscript,
        duration_seconds: Math.floor(actualDuration),
        processing_status: 'completed'
      })
      .eq('id', recordingId)

    if (updateError) {
      console.error('[Process] Error updating recording:', updateError)
    } else {
      console.log('[Process] Recording updated successfully')
    }

    console.log('[Process] Creating note from transcript...')

    // Generate a meaningful title using GPT-4o
    console.log('[Process] Generating note title...')
    const noteTitle = await generateNoteTitle(cleanedTranscript)

    // Create a note from the transcript using service role client
    const { data: note, error: noteError } = await serviceClient
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
      console.error('[Process] Error creating note:', {
        message: noteError.message,
        details: noteError.details,
        hint: noteError.hint,
        code: noteError.code
      })
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
    console.error('[Process] Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      recordingId
    })

    // Try to update recording status to failed (using recordingId from outer scope)
    if (recordingId) {
      try {
        const { createServiceRoleClient } = await import('@/lib/supabase/server')
        const serviceClient = createServiceRoleClient()
        await serviceClient
          .from('recordings')
          .update({ processing_status: 'failed' })
          .eq('id', recordingId)
        console.log('[Process] Updated recording status to failed:', recordingId)
      } catch (updateError) {
        console.error('[Process] Failed to update error status:', updateError)
      }
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

async function generateNoteTitle(transcript: string): Promise<string> {
  const fallbackTitle = `Recording ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  // Don't try to generate title for very short transcripts
  if (!transcript || transcript.trim().length < 20) {
    return fallbackTitle
  }

  try {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You generate concise, descriptive titles for voice note transcripts.

RULES:
1. Create a short title (3-7 words max) that captures the main topic
2. Use sentence case (capitalize first word only, unless proper nouns)
3. Do NOT use quotes or punctuation at the end
4. If the content is unclear or gibberish, respond with exactly: UNTITLED
5. Focus on the key topic, decision, or action mentioned
6. Be specific, not generic

Examples of good titles:
- Team sync on Q4 roadmap
- Product pricing discussion
- Bug fix for login flow
- Meeting notes with Sarah
- Ideas for onboarding redesign`
        },
        {
          role: 'user',
          content: `Generate a title for this transcript:\n\n${transcript.substring(0, 1000)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 50
    })

    const generatedTitle = response.choices[0]?.message?.content?.trim()

    // Use fallback if no title generated or marked as untitled
    if (!generatedTitle || generatedTitle === 'UNTITLED' || generatedTitle.length < 3) {
      console.log('[Process] Using fallback title - content unclear')
      return fallbackTitle
    }

    // Remove any quotes that GPT might add
    const cleanTitle = generatedTitle.replace(/^["']|["']$/g, '').trim()

    console.log('[Process] Generated note title:', cleanTitle)
    return cleanTitle
  } catch (error) {
    console.error('[Process] Error generating title:', error)
    return fallbackTitle
  }
}

