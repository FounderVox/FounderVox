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

    // Handle meta-questions directly (before semantic search)
    const lowerQuery = query.toLowerCase().trim()

    // Check for "what are you" type questions
    if (lowerQuery.includes('what are you') || lowerQuery.includes('who are you') ||
        lowerQuery.includes('what can you do') || lowerQuery.includes('help me')) {
      return NextResponse.json({
        answer: `I'm **Recall**, your AI assistant for searching through your voice notes! 🎙️

Here's what I can help you with:
- **Find information** from your past recordings ("What did I say about the product launch?")
- **Summarize topics** across multiple notes ("What are my main concerns this month?")
- **Recall decisions** and action items you've mentioned
- **Search by time** - filter by last week, month, or all time

You currently have **${totalNotes || 0} notes**${notesWithEmbeddings ? ` (${notesWithEmbeddings} indexed for search)` : ''}.

Just ask me anything about what you've recorded!`,
        citations: [],
        noteCount: 0
      })
    }

    // Check for count/stats questions
    if (lowerQuery.includes('how many notes') || lowerQuery.includes('how many recordings') ||
        lowerQuery.match(/count|total|number of.*(notes|recordings)/)) {
      return NextResponse.json({
        answer: `You have **${totalNotes || 0} notes** in total${notesWithEmbeddings ? ` (${notesWithEmbeddings} indexed for AI search)` : ''}.

Want me to help you find something specific in your notes? Try asking about a topic, person, or decision you've mentioned!`,
        citations: [],
        noteCount: totalNotes || 0
      })
    }

    // If user has no notes at all
    if (totalNotes === 0) {
      return NextResponse.json({
        answer: "You haven't recorded any notes yet! Start by creating a voice note, and I'll help you recall information from it later.",
        citations: [],
        noteCount: 0
      })
    }

    // If user has notes but none indexed
    if (notesWithEmbeddings === 0) {
      return NextResponse.json({
        answer: "Your notes are being prepared for AI search. This happens automatically - please wait a moment and try again.",
        citations: [],
        noteCount: 0,
        needsIndexing: true
      })
    }

    // Get date range for filtering
    const { start, end } = getDateRange(timeFilter)
    console.log('[Ask] Date range:', start?.toISOString() || 'null', 'to', end.toISOString())

    let relevantNotes: any[] = []

    // STRATEGY: For small note counts (< 20), fetch ALL notes and let GPT find relevant info
    // This is more reliable than semantic search for small datasets
    const SMALL_DATASET_THRESHOLD = 20

    if ((totalNotes || 0) < SMALL_DATASET_THRESHOLD) {
      console.log('[Ask] Small dataset - fetching all notes directly')

      // Build query with date filters
      let notesQuery = dbClient
        .from('notes')
        .select('id, title, content, formatted_content, raw_transcript, template_type, template_label, is_starred, tags, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (start) {
        notesQuery = notesQuery.gte('created_at', start.toISOString())
      }
      if (end) {
        notesQuery = notesQuery.lte('created_at', end.toISOString())
      }

      const { data: allNotes, error: fetchError } = await notesQuery

      if (fetchError) {
        console.error('[Ask] Error fetching notes:', fetchError)
        throw new Error('Failed to fetch notes')
      }

      relevantNotes = (allNotes || []).map((note: any) => ({
        ...note,
        similarity: 1.0 // All notes included
      }))

      console.log('[Ask] Fetched', relevantNotes.length, 'notes directly')
    } else {
      // For larger datasets, use semantic search
      console.log('[Ask] Large dataset - using semantic search')

      // Generate embedding for the query
      const embeddingResponse = await getOpenAI().embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      })
      const queryEmbedding = embeddingResponse.data[0].embedding
      console.log('[Ask] Query embedding generated')

      // Format embedding for Postgres
      const embeddingString = `[${queryEmbedding.join(',')}]`

      const { data: searchResults, error: searchError } = await dbClient.rpc(
        'match_notes',
        {
          query_embedding: embeddingString,
          match_threshold: 0.3, // Lower threshold for better recall
          match_count: 8,
          filter_user_id: user.id,
          filter_date_from: start?.toISOString() || null,
          filter_date_to: end.toISOString()
        }
      )

      if (searchError) {
        console.error('[Ask] Search error:', searchError)
        // If pgvector isn't set up, fall back to direct fetch
        if (searchError.message?.includes('function') ||
            searchError.message?.includes('does not exist') ||
            searchError.message?.includes('match_notes')) {
          console.log('[Ask] Falling back to direct fetch due to pgvector error')
          const { data: fallbackNotes } = await dbClient
            .from('notes')
            .select('id, title, content, formatted_content, raw_transcript, template_type, template_label, is_starred, tags, created_at, updated_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)

          relevantNotes = (fallbackNotes || []).map((note: any) => ({
            ...note,
            similarity: 1.0
          }))
        } else {
          throw new Error('Failed to search notes')
        }
      } else {
        relevantNotes = searchResults || []
      }

      console.log('[Ask] Found', relevantNotes.length, 'relevant notes via semantic search')
    }

    // Log what we found
    if (relevantNotes.length > 0) {
      relevantNotes.forEach((note: any, i: number) => {
        console.log(`[Ask] Note ${i + 1}:`, {
          id: note.id,
          title: note.title?.substring(0, 50),
          similarity: note.similarity,
          contentPreview: (note.formatted_content || note.raw_transcript || '').substring(0, 100)
        })
      })
    } else {
      console.log('[Ask] No notes found')
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
    const systemPrompt = `You are Recall, a friendly AI assistant that helps founders search and recall information from their voice notes.

YOUR PERSONALITY:
- Warm, supportive, and encouraging
- Like a helpful colleague who knows their context
- Do NOT use emojis in responses

ANSWERING RULES:
1. Search the provided notes thoroughly for ANY relevant information
2. Be generous in finding connections - if a note mentions the topic, use it
3. Use citation markers [1], [2] at the END of sentences that reference specific notes
4. If you genuinely can't find relevant info, say so warmly and suggest recording about it
5. NEVER make up information not in the notes

FORMATTING (use markdown):
- **Bold** for key names, terms, and important points
- Use bullet points for lists
- Keep paragraphs short (2-3 sentences max)
- Be concise - founders are busy

WHEN NO INFO FOUND:
If the notes don't contain relevant information, respond like:
"I looked through your notes but didn't find anything about [topic]. You might want to record a quick note about it!"`

    let userPrompt: string

    if (contextParts.length > 0) {
      userPrompt = `${conversationContext ? `Previous conversation:\n${conversationContext}\n\n---\n\n` : ''}Here are the user's notes to search through:

${contextParts.join('\n\n---\n\n')}

---

User's question: ${query}

Search through these notes and answer the question. Use citation markers [1], [2] when referencing specific notes. If you can't find relevant information, say so warmly.`
    } else {
      // No notes at all (shouldn't happen with new logic, but handle gracefully)
      return NextResponse.json({
        answer: `I don't have any notes to search through yet. Record a voice note and I'll be able to help you recall information from it! 🎙️`,
        citations: [],
        noteCount: 0
      })
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
