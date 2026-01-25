import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { extractPreviewCounts } from '@/lib/ai/extraction'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 1 minute is enough for preview

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
    const preview = await extractPreviewCounts(transcript)

    console.log('[Smartify:Preview] Preview counts:', preview)

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

