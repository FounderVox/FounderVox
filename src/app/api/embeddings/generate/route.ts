import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Lazy OpenAI initialization
let openaiClient: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return openaiClient
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { noteId } = await request.json()

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    console.log('[Embeddings] Generating embedding for note:', noteId)

    // Use service role client if available, otherwise fall back to user client
    let dbClient
    try {
      dbClient = createServiceRoleClient()
    } catch {
      console.log('[Embeddings] Service role not available, using user client')
      dbClient = supabase
    }

    // Fetch the note
    const { data: note, error: noteError } = await dbClient
      .from('notes')
      .select('id, title, content, formatted_content, raw_transcript, user_id')
      .eq('id', noteId)
      .single()

    if (noteError || !note) {
      console.error('[Embeddings] Note fetch error:', noteError)
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Verify ownership
    if (note.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Combine text for embedding (title + best available content)
    const contentToEmbed = note.formatted_content || note.content || note.raw_transcript || ''
    const textForEmbedding = [
      note.title || '',
      contentToEmbed
    ].filter(Boolean).join('\n\n')

    if (!textForEmbedding.trim()) {
      console.log('[Embeddings] Note has no content to embed:', noteId)
      return NextResponse.json({ error: 'Note has no content to embed' }, { status: 400 })
    }

    // Truncate to avoid token limits (text-embedding-3-small handles up to 8191 tokens)
    const truncatedText = textForEmbedding.substring(0, 8000)

    // Generate embedding using OpenAI
    const embeddingResponse = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: truncatedText,
    })

    const embedding = embeddingResponse.data[0].embedding

    if (!embedding || embedding.length !== 1536) {
      console.error('[Embeddings] Invalid embedding response')
      return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 })
    }

    // Update note with embedding
    // Format embedding as PostgreSQL array string for pgvector
    const embeddingString = `[${embedding.join(',')}]`

    const { error: updateError } = await dbClient
      .from('notes')
      .update({ embedding: embeddingString })
      .eq('id', noteId)

    if (updateError) {
      console.error('[Embeddings] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to save embedding', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('[Embeddings] Successfully generated embedding for note:', noteId)

    return NextResponse.json({
      success: true,
      noteId,
      embeddingDimensions: embedding.length
    })

  } catch (error) {
    console.error('[Embeddings] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate embedding',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
