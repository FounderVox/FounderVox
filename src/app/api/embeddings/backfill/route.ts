import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for batch processing

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

    const { batchSize = 10 } = await request.json()

    console.log('[Backfill] Starting backfill for user:', user.id, 'batch size:', batchSize)

    // Use service role client if available
    let dbClient
    try {
      dbClient = createServiceRoleClient()
    } catch {
      console.log('[Backfill] Service role not available, using user client')
      dbClient = supabase
    }

    // Get notes without embeddings for this user
    const { data: notes, error: fetchError } = await dbClient
      .from('notes')
      .select('id, title, content, formatted_content, raw_transcript')
      .eq('user_id', user.id)
      .is('embedding', null)
      .order('created_at', { ascending: false })
      .limit(Math.min(batchSize, 50)) // Cap at 50 per request

    if (fetchError) {
      console.error('[Backfill] Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    if (!notes || notes.length === 0) {
      // Get total count to check if all are processed
      const { count: totalCount } = await dbClient
        .from('notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      return NextResponse.json({
        success: true,
        processed: 0,
        remaining: 0,
        total: totalCount || 0,
        message: 'All notes have embeddings'
      })
    }

    console.log('[Backfill] Processing', notes.length, 'notes')

    // Process notes
    let processed = 0
    const errors: string[] = []

    for (const note of notes) {
      try {
        console.log('[Backfill] Processing note:', note.id, '| Title:', note.title?.substring(0, 50))

        // Combine text for embedding
        const contentToEmbed = note.formatted_content || note.content || note.raw_transcript || ''
        const textForEmbedding = [
          note.title || '',
          contentToEmbed
        ].filter(Boolean).join('\n\n')

        console.log('[Backfill] Content length:', textForEmbedding.length, '| Preview:', textForEmbedding.substring(0, 100))

        if (!textForEmbedding.trim()) {
          console.log('[Backfill] Skipping note with no content:', note.id)
          continue
        }

        // Truncate to avoid token limits
        const truncatedText = textForEmbedding.substring(0, 8000)

        // Generate embedding
        console.log('[Backfill] Generating embedding for note:', note.id)
        const embeddingResponse = await getOpenAI().embeddings.create({
          model: 'text-embedding-3-small',
          input: truncatedText,
        })

        const embedding = embeddingResponse.data[0].embedding
        console.log('[Backfill] Embedding generated, dimensions:', embedding.length)

        // Format and save embedding
        const embeddingString = `[${embedding.join(',')}]`

        const { error: updateError } = await dbClient
          .from('notes')
          .update({ embedding: embeddingString })
          .eq('id', note.id)

        if (updateError) {
          console.error('[Backfill] Update error for note:', note.id, updateError)
          errors.push(note.id)
          continue
        }

        console.log('[Backfill] Successfully saved embedding for note:', note.id)
        processed++

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error('[Backfill] Error processing note:', note.id, error)
        errors.push(note.id)
      }
    }

    // Get remaining count
    const { count: remaining } = await dbClient
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('embedding', null)

    // Get total count
    const { count: total } = await dbClient
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    console.log('[Backfill] Completed. Processed:', processed, 'Remaining:', remaining, 'Errors:', errors.length)

    return NextResponse.json({
      success: true,
      processed,
      errors: errors.length,
      errorIds: errors.length > 0 ? errors : undefined,
      remaining: remaining || 0,
      total: total || 0
    })

  } catch (error) {
    console.error('[Backfill] Error:', error)
    return NextResponse.json(
      {
        error: 'Backfill failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check backfill status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client if available
    let dbClient
    try {
      dbClient = createServiceRoleClient()
    } catch {
      dbClient = supabase
    }

    // Get counts
    const { count: total } = await dbClient
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: withEmbedding } = await dbClient
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('embedding', 'is', null)

    const { count: withoutEmbedding } = await dbClient
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('embedding', null)

    return NextResponse.json({
      total: total || 0,
      indexed: withEmbedding || 0,
      pending: withoutEmbedding || 0,
      percentComplete: total ? Math.round(((withEmbedding || 0) / total) * 100) : 100
    })

  } catch (error) {
    console.error('[Backfill] Status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}
