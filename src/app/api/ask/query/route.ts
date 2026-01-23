import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 1 minute max for complex queries

// Server-side metrics tracking
async function trackAskMetrics(userId: string, data: {
  queryLength: number
  timeFilter: string
  citationsCount: number
  responseTimeMs: number
  isFollowup: boolean
  status: 'success' | 'error'
  errorMessage?: string
}) {
  try {
    const serviceClient = createServiceRoleClient()

    // Track event
    await serviceClient.from('user_events').insert({
      user_id: userId,
      event_name: data.status === 'success' ? 'ask_response_received' : 'api_error',
      event_category: data.status === 'success' ? 'feature' : 'error',
      event_properties: {
        query_length: data.queryLength,
        time_filter: data.timeFilter,
        citations_count: data.citationsCount,
        response_time_ms: data.responseTimeMs,
        is_followup: data.isFollowup,
        error_message: data.errorMessage,
      },
      platform: 'web',
    })

    // Track API usage
    await serviceClient.from('api_usage').insert([
      {
        user_id: userId,
        operation_type: 'embedding',
        provider: 'openai',
        model: 'text-embedding-3-small',
        status: data.status,
        duration_ms: data.responseTimeMs,
      },
      {
        user_id: userId,
        operation_type: 'ask_query',
        provider: 'openai',
        model: 'gpt-4o',
        status: data.status,
        duration_ms: data.responseTimeMs,
      },
    ])

    // Update user properties
    if (data.status === 'success') {
      await serviceClient.rpc('increment_user_property', {
        p_user_id: userId,
        p_property: 'total_ask_queries',
        p_increment: 1,
      })
      await serviceClient.rpc('increment_user_property', {
        p_user_id: userId,
        p_property: 'current_month_ask_queries',
        p_increment: 1,
      })
      await serviceClient.rpc('set_user_milestone', {
        p_user_id: userId,
        p_milestone: 'first_ask_query_at',
      })
    }
  } catch (error) {
    console.error('[Ask Metrics] Failed to track:', error)
  }
}

// Types
interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Citation {
  id: string
  noteId: string
  noteTitle: string
  snippet: string
  createdAt: string
  templateLabel: string | null
}

interface QueryRequest {
  query: string
  conversationHistory: Message[]
  timeFilter: 'week' | 'month' | '3months' | 'all'
}

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

// Time filter to date range
function getDateRange(filter: string): { start: Date | null; end: Date } {
  const now = new Date()

  switch (filter) {
    case 'week': {
      const start = new Date(now)
      start.setDate(start.getDate() - 7)
      return { start, end: now }
    }
    case 'month': {
      const start = new Date(now)
      start.setMonth(start.getMonth() - 1)
      return { start, end: now }
    }
    case '3months': {
      const start = new Date(now)
      start.setMonth(start.getMonth() - 3)
      return { start, end: now }
    }
    case 'all':
    default:
      return { start: null, end: now }
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: QueryRequest = await request.json()
    const { query, conversationHistory = [], timeFilter = 'all' } = body

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    console.log('[Ask] ========== NEW QUERY ==========')
    console.log('[Ask] Query:', query)
    console.log('[Ask] Time filter:', timeFilter)
    console.log('[Ask] User ID:', user.id)

    const startTime = Date.now()
    const isFollowup = conversationHistory.length > 0

    // Use service role client for database operations
    let dbClient
    try {
      dbClient = createServiceRoleClient()
      console.log('[Ask] Using service role client')
    } catch (e) {
      console.log('[Ask] Service role not available, using user client. Error:', e)
      dbClient = supabase
    }

    // First, check how many notes this user has with embeddings
    const { count: totalNotes } = await dbClient
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: notesWithEmbeddings } = await dbClient
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('embedding', 'is', null)

    console.log('[Ask] User has', totalNotes, 'total notes,', notesWithEmbeddings, 'with embeddings')

    // Step 1: Generate embedding for the query
    console.log('[Ask] Generating query embedding...')
    const embeddingResponse = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })
    const queryEmbedding = embeddingResponse.data[0].embedding
    console.log('[Ask] Query embedding generated, dimensions:', queryEmbedding.length)

    // Step 2: Search for relevant notes using pgvector
    const { start, end } = getDateRange(timeFilter)
    console.log('[Ask] Date range:', start?.toISOString() || 'null', 'to', end.toISOString())

    // Format embedding for Postgres
    const embeddingString = `[${queryEmbedding.join(',')}]`

    console.log('[Ask] Calling match_notes RPC...')
    const { data: relevantNotes, error: searchError } = await dbClient.rpc(
      'match_notes',
      {
        query_embedding: embeddingString,
        match_count: 5,
        match_threshold: 0.5, // Lower threshold to get more results
        filter_user_id: user.id,
        filter_start_date: start?.toISOString() || null,
        filter_end_date: end.toISOString()
      }
    )

    if (searchError) {
      console.error('[Ask] Search error:', searchError)
      console.error('[Ask] Search error details:', JSON.stringify(searchError, null, 2))
      // If pgvector isn't set up yet, provide helpful message
      if (searchError.message?.includes('function') || searchError.message?.includes('does not exist')) {
        return NextResponse.json({
          answer: "The semantic search feature hasn't been set up yet. Please run the database migration to enable pgvector.",
          citations: [],
          noteCount: 0,
          setupRequired: true
        })
      }
      throw new Error('Failed to search notes')
    }

    console.log('[Ask] Found', relevantNotes?.length || 0, 'relevant notes')
    if (relevantNotes && relevantNotes.length > 0) {
      relevantNotes.forEach((note: any, i: number) => {
        console.log(`[Ask] Note ${i + 1}:`, {
          id: note.id,
          title: note.title?.substring(0, 50),
          similarity: note.similarity,
          contentPreview: (note.formatted_content || note.raw_transcript || '').substring(0, 100)
        })
      })
    } else {
      console.log('[Ask] No notes matched the query with threshold 0.5')
    }

    // Step 3: Build context from relevant notes with citations
    const citations: Citation[] = []
    const contextParts: string[] = []

    if (relevantNotes && relevantNotes.length > 0) {
      relevantNotes.forEach((note: any, index: number) => {
        const citationId = `[${index + 1}]`
        const content = note.formatted_content || note.raw_transcript || note.content || ''
        // Take first 400 chars for snippet
        const snippet = content.substring(0, 400).trim()

        citations.push({
          id: citationId,
          noteId: note.id,
          noteTitle: note.title || 'Untitled Note',
          snippet: snippet,
          createdAt: note.created_at,
          templateLabel: note.template_label
        })

        // Build context for GPT - include more content (up to 2000 chars per note)
        const noteDate = new Date(note.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })

        contextParts.push(
          `${citationId} "${note.title || 'Untitled Note'}" (${noteDate}):\n${content.substring(0, 2000)}`
        )
      })
    }

    // Step 4: Build conversation context for follow-ups (last 3 exchanges = 6 messages)
    const recentConversation = conversationHistory.slice(-6)
    const conversationContext = recentConversation.length > 0
      ? recentConversation
          .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
          .join('\n\n')
      : ''

    // Step 5: Generate answer with GPT-4o
    const systemPrompt = `You are a helpful assistant that answers questions based on the founder's voice notes and recordings.

CRITICAL RULES:
1. ONLY use information from the provided note excerpts to answer questions
2. When citing information, place citation markers like [1], [2] at the END of the relevant sentence or statement
3. If multiple notes support a point, cite all of them together: [1][2]
4. If you cannot find relevant information in the notes, respond warmly: "I don't have information about this in your notes yet. Feel free to record a voice note about it, and I'll be able to help you recall it later!"
5. Be concise but thorough - founders are busy
6. For follow-up questions, use the conversation history for context
7. Format responses with markdown for readability when appropriate
8. Never make up information that isn't in the notes

TONE: Professional, direct, helpful - like a knowledgeable assistant who knows the founder's context.`

    let userPrompt: string

    if (contextParts.length > 0) {
      userPrompt = `${conversationContext ? `Previous conversation:\n${conversationContext}\n\n---\n\n` : ''}Here are relevant excerpts from your notes:

${contextParts.join('\n\n---\n\n')}

---

Question: ${query}

Answer based on the information in these notes, using citation markers [1], [2], etc. when referencing specific notes.`
    } else {
      userPrompt = `${conversationContext ? `Previous conversation:\n${conversationContext}\n\n---\n\n` : ''}Question: ${query}

I searched your notes but couldn't find any relevant content. Provide a helpful, encouraging response that invites the user to add this information via a voice note.`
    }

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 1500
    })

    const answer = completion.choices[0]?.message?.content || 'I was unable to generate a response. Please try again.'

    const responseTimeMs = Date.now() - startTime
    console.log('[Ask] Generated answer with', citations.length, 'citations in', responseTimeMs, 'ms')

    // Track metrics asynchronously (don't block response)
    trackAskMetrics(user.id, {
      queryLength: query.length,
      timeFilter,
      citationsCount: citations.length,
      responseTimeMs,
      isFollowup,
      status: 'success',
    })

    return NextResponse.json({
      answer,
      citations,
      noteCount: relevantNotes?.length || 0
    })

  } catch (error) {
    console.error('[Ask] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Track error (try to get user from a fresh auth check)
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        trackAskMetrics(user.id, {
          queryLength: 0,
          timeFilter: 'unknown',
          citationsCount: 0,
          responseTimeMs: 0,
          isFollowup: false,
          status: 'error',
          errorMessage,
        })
      }
    } catch {
      // Ignore tracking errors
    }

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Rate limited. Please wait a moment and try again.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to process query',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
