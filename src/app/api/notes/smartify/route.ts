import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
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

    // Get transcript from note (prefer raw_transcript, fallback to content)
    const transcript = note.raw_transcript || note.content || note.formatted_content

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note has no transcript content' },
        { status: 400 }
      )
    }

    console.log('[Smartify] Starting extraction for note:', noteId)

    // Find or create a recording record for this note
    // We'll use the audio_url to find the recording, or create a new one
    let recordingId: string | null = null

    if (note.audio_url) {
      // Try to find existing recording by audio_url
      const { data: existingRecording } = await supabase
        .from('recordings')
        .select('id')
        .eq('audio_url', note.audio_url)
        .eq('user_id', user.id)
        .single()

      if (existingRecording) {
        recordingId = existingRecording.id
      }
    }

    // If no recording found, create a new one (even without audio_url)
    if (!recordingId) {
      console.log('[Smartify] Creating new recording record for note:', noteId)
      const { data: newRecording, error: recError } = await supabase
        .from('recordings')
        .insert({
          user_id: user.id,
          audio_url: note.audio_url || null,
          raw_transcript: transcript,
          cleaned_transcript: note.formatted_content || transcript,
          duration_seconds: note.duration_seconds || 0,
          processing_status: 'completed'
        })
        .select()
        .single()

      if (recError) {
        console.error('[Smartify] Error creating recording:', recError)
        // Continue anyway - we'll try to extract without recordingId
      } else {
        recordingId = newRecording.id
      }
    }

    // Run all extraction functions in parallel
    if (recordingId) {
      console.log('[Smartify] Running extraction with recording ID:', recordingId)
      const results = await Promise.allSettled([
        extractActionItems(transcript, recordingId, user.id),
        extractInvestorUpdate(transcript, recordingId, user.id),
        extractProgressLog(transcript, recordingId, user.id),
        extractProductIdeas(transcript, recordingId, user.id),
        extractBrainDump(transcript, recordingId, user.id)
      ])
      
      // Log any failures
      results.forEach((result, index) => {
        const names = ['ActionItems', 'InvestorUpdate', 'ProgressLog', 'ProductIdeas', 'BrainDump']
        if (result.status === 'rejected') {
          console.error(`[Smartify] ${names[index]} extraction failed:`, result.reason)
        } else {
          console.log(`[Smartify] ${names[index]} extraction completed`)
        }
      })
    } else {
      console.warn('[Smartify] No recording ID available - extraction requires a recording record')
      // Return empty counts if we couldn't create a recording
    }

    // Get counts of extracted items
    const counts = recordingId ? await getExtractionCounts(supabase, recordingId) : {
      actionItems: 0,
      investorUpdates: 0,
      progressLogs: 0,
      productIdeas: 0,
      brainDump: 0
    }

    console.log('[Smartify] Extraction complete for note:', noteId)

    // Update note to mark it as smartified
    await supabase
      .from('notes')
      .update({ smartified_at: new Date().toISOString() })
      .eq('id', noteId)
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      extracted: counts
    })

  } catch (error) {
    console.error('[Smartify] Error:', error)

    return NextResponse.json(
      { error: 'Smartify failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function getExtractionCounts(supabase: any, recordingId: string) {
  const [actionItems, investorUpdates, progressLogs, productIdeas, brainDump] = await Promise.all([
    supabase.from('action_items').select('id', { count: 'exact', head: true }).eq('recording_id', recordingId),
    supabase.from('investor_updates').select('id', { count: 'exact', head: true }).eq('recording_id', recordingId),
    supabase.from('progress_logs').select('id', { count: 'exact', head: true }).eq('recording_id', recordingId),
    supabase.from('product_ideas').select('id', { count: 'exact', head: true }).eq('recording_id', recordingId),
    supabase.from('brain_dump').select('id', { count: 'exact', head: true }).eq('recording_id', recordingId)
  ])

  return {
    actionItems: actionItems.count || 0,
    investorUpdates: investorUpdates.count || 0,
    progressLogs: progressLogs.count || 0,
    productIdeas: productIdeas.count || 0,
    brainDump: brainDump.count || 0
  }
}

