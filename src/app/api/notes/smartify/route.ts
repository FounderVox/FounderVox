import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  extractActionItems,
  extractInvestorUpdate,
  extractBrainDump
} from '@/lib/ai/extraction'

// Server-side metrics tracking helper
async function trackServerEvent(
  userId: string,
  eventName: string,
  eventCategory: string,
  properties?: Record<string, unknown>
) {
  try {
    const serviceClient = createServiceRoleClient()
    await serviceClient.from('user_events').insert({
      user_id: userId,
      event_name: eventName,
      event_category: eventCategory,
      event_properties: properties || {},
      platform: 'web',
    })
  } catch (error) {
    console.error('[Metrics] Failed to track event:', error)
  }
}

async function trackAPIUsage(
  userId: string,
  operationType: string,
  provider: string,
  options: {
    model?: string
    inputTokens?: number
    outputTokens?: number
    sourceId?: string
    status?: string
    durationMs?: number
  }
) {
  try {
    const serviceClient = createServiceRoleClient()
    await serviceClient.from('api_usage').insert({
      user_id: userId,
      operation_type: operationType,
      provider: provider,
      model: options.model,
      input_tokens: options.inputTokens,
      output_tokens: options.outputTokens,
      source_type: 'note',
      source_id: options.sourceId,
      status: options.status || 'success',
      duration_ms: options.durationMs,
    })
  } catch (error) {
    console.error('[Metrics] Failed to track API usage:', error)
  }
}

async function updateUserProperties(userId: string, updates: Record<string, unknown>) {
  try {
    const serviceClient = createServiceRoleClient()
    await serviceClient
      .from('user_properties')
      .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
  } catch (error) {
    console.error('[Metrics] Failed to update user properties:', error)
  }
}

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

    // Get note ID and categories from request
    const { noteId, categories } = await request.json()

    // Default categories if not provided
    const selectedCategories = categories || {
      actionItems: true,
      investorUpdates: true,
      brainDump: true
    }

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
    const startTime = Date.now()

    // Track smartify started
    await trackServerEvent(user.id, 'smartify_started', 'feature', { note_id: noteId })

    // Find or create a recording record for this note
    // Use note_id for stable lookups to prevent phantom recordings
    let recordingId: string | null = null

    // First, try to find existing recording by note_id (most reliable)
    const { data: existingByNoteId } = await supabase
      .from('recordings')
      .select('id')
      .eq('note_id', noteId)
      .eq('user_id', user.id)
      .single()

    if (existingByNoteId) {
      recordingId = existingByNoteId.id
      console.log('[Smartify] Found existing recording by note_id:', recordingId)
    } else if (note.audio_url) {
      // Fallback: try to find by audio_url
      const { data: existingByAudio } = await supabase
        .from('recordings')
        .select('id')
        .eq('audio_url', note.audio_url)
        .eq('user_id', user.id)
        .single()

      if (existingByAudio) {
        recordingId = existingByAudio.id
        console.log('[Smartify] Found existing recording by audio_url:', recordingId)

        // Update the recording to include note_id for future lookups
        await supabase
          .from('recordings')
          .update({ note_id: noteId })
          .eq('id', recordingId)
      }
    }

    // If no recording found, create a new one with note_id
    if (!recordingId) {
      console.log('[Smartify] Creating new recording record for note:', noteId)
      const { data: newRecording, error: recError } = await supabase
        .from('recordings')
        .insert({
          user_id: user.id,
          note_id: noteId,
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

    // Run extraction functions in parallel (only selected categories)
    if (recordingId) {
      console.log('[Smartify] Running extraction with recording ID:', recordingId)
      console.log('[Smartify] Selected categories:', selectedCategories)

      // Build extraction promises based on selected categories
      const extractionPromises: { name: string; promise: Promise<void> }[] = []

      if (selectedCategories.actionItems) {
        extractionPromises.push({
          name: 'ActionItems',
          promise: extractActionItems(transcript, recordingId, user.id)
        })
      }
      if (selectedCategories.investorUpdates) {
        extractionPromises.push({
          name: 'InvestorUpdate',
          promise: extractInvestorUpdate(transcript, recordingId, user.id)
        })
      }
      if (selectedCategories.brainDump) {
        extractionPromises.push({
          name: 'BrainDump',
          promise: extractBrainDump(transcript, recordingId, user.id)
        })
      }

      if (extractionPromises.length > 0) {
        const results = await Promise.allSettled(extractionPromises.map(e => e.promise))

        // Log any failures
        results.forEach((result, index) => {
          const name = extractionPromises[index].name
          if (result.status === 'rejected') {
            console.error(`[Smartify] ${name} extraction failed:`, result.reason)
          } else {
            console.log(`[Smartify] ${name} extraction completed`)
          }
        })
      } else {
        console.log('[Smartify] No categories selected for extraction')
      }
    } else {
      console.warn('[Smartify] No recording ID available - extraction requires a recording record')
      // Return empty counts if we couldn't create a recording
    }

    // Get counts of extracted items
    const counts = recordingId ? await getExtractionCounts(supabase, recordingId) : {
      actionItems: 0,
      investorUpdates: 0,
      brainDump: 0
    }

    console.log('[Smartify] Extraction complete for note:', noteId)
    const extractionTimeMs = Date.now() - startTime

    // Track smartify completed
    await trackServerEvent(user.id, 'smartify_completed', 'feature', {
      note_id: noteId,
      action_items_count: counts.actionItems,
      brain_dump_count: counts.brainDump,
      investor_updates_count: counts.investorUpdates,
      extraction_time_ms: extractionTimeMs,
    })

    // Track API usage for AI extraction
    await trackAPIUsage(user.id, 'extraction', 'openai', {
      model: 'gpt-4o',
      sourceId: noteId,
      status: 'success',
      durationMs: extractionTimeMs,
    })

    // Update user properties
    await updateUserProperties(user.id, {
      first_smartify_at: new Date().toISOString(),
      last_smartify_at: new Date().toISOString(),
    })

    // Increment counters via RPC
    try {
      const serviceClient = createServiceRoleClient()
      await serviceClient.rpc('increment_user_property', {
        p_user_id: user.id,
        p_property: 'total_smartify_runs',
        p_increment: 1,
      })
      await serviceClient.rpc('increment_user_property', {
        p_user_id: user.id,
        p_property: 'current_month_smartify_runs',
        p_increment: 1,
      })
      if (counts.actionItems > 0) {
        await serviceClient.rpc('increment_user_property', {
          p_user_id: user.id,
          p_property: 'total_action_items_created',
          p_increment: counts.actionItems,
        })
      }
      if (counts.brainDump > 0) {
        await serviceClient.rpc('increment_user_property', {
          p_user_id: user.id,
          p_property: 'total_brain_dump_items',
          p_increment: counts.brainDump,
        })
      }
    } catch (rpcError) {
      console.error('[Smartify] Error updating user properties:', rpcError)
    }

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

    // Track smartify failure (we may not have user.id in all error cases)
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await trackServerEvent(user.id, 'smartify_failed', 'error', {
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    } catch {
      // Ignore tracking errors
    }

    return NextResponse.json(
      { error: 'Smartify failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function getExtractionCounts(supabase: any, recordingId: string) {
  const [actionItems, investorUpdates, brainDump] = await Promise.all([
    supabase.from('action_items').select('id', { count: 'exact', head: true }).eq('recording_id', recordingId),
    supabase.from('investor_updates').select('id', { count: 'exact', head: true }).eq('recording_id', recordingId),
    supabase.from('brain_dump').select('id', { count: 'exact', head: true }).eq('recording_id', recordingId)
  ])

  return {
    actionItems: actionItems.count || 0,
    investorUpdates: investorUpdates.count || 0,
    brainDump: brainDump.count || 0
  }
}

