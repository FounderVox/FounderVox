import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max execution time

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return openaiClient
}

// This endpoint extracts data but DOES NOT save it - returns preview only
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

    // Get note ID from request
    const { noteId } = await request.json()

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID required' },
        { status: 400 }
      )
    }

    // Get note from database
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single()

    if (noteError || !note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }

    // Check if note was already smartified and hasn't been edited since
    if (note.smartified_at) {
      const smartifiedAt = new Date(note.smartified_at)
      const updatedAt = new Date(note.updated_at)
      
      // If note wasn't edited after smartify, prevent re-smartifying
      if (updatedAt <= smartifiedAt) {
        return NextResponse.json(
          { 
            error: 'Note already smartified',
            message: 'This note has already been smartified. Edit the note to smartify again.',
            canSmartify: false
          },
          { status: 400 }
        )
      }
    }

    // Get transcript from note
    const transcript = note.raw_transcript || note.content || note.formatted_content

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note has no transcript content' },
        { status: 400 }
      )
    }

    console.log('[Smartify:Preview] Extracting preview for note:', noteId)

    // Run extraction in preview mode (don't save, just return counts)
    const preview = await extractPreview(transcript)

    return NextResponse.json({
      success: true,
      preview: preview,
      noteId: noteId
    })

  } catch (error) {
    console.error('[Smartify:Preview] Error:', error)

    return NextResponse.json(
      { error: 'Preview extraction failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function extractPreview(transcript: string) {
  // Use a single prompt to get counts of what would be extracted
  const prompt = `Analyze this transcript and estimate what structured data could be extracted.

Return a JSON object with estimated counts for:
- actionItems: number of action items/tasks/todos
- investorUpdates: 1 if investor update content found, 0 otherwise
- progressLogs: 1 if progress log content found, 0 otherwise  
- productIdeas: number of product ideas/features
- brainDump: number of brain dump items/thoughts

Transcript:
${transcript.substring(0, 4000)}${transcript.length > 4000 ? '...' : ''}

Return format:
{
  "actionItems": 3,
  "investorUpdates": 1,
  "progressLogs": 0,
  "productIdeas": 2,
  "brainDump": 1
}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert at analyzing transcripts and estimating what structured data can be extracted. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return {
        actionItems: 0,
        investorUpdates: 0,
        progressLogs: 0,
        productIdeas: 0,
        brainDump: 0
      }
    }

    const parsed = JSON.parse(content)
    return {
      actionItems: parsed.actionItems || 0,
      investorUpdates: parsed.investorUpdates || 0,
      progressLogs: parsed.progressLogs || 0,
      productIdeas: parsed.productIdeas || 0,
      brainDump: parsed.brainDump || 0
    }
  } catch (error) {
    console.error('[Smartify:Preview] Error extracting preview:', error)
    return {
      actionItems: 0,
      investorUpdates: 0,
      progressLogs: 0,
      productIdeas: 0,
      brainDump: 0
    }
  }
}

