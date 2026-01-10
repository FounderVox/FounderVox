'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface EditNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  noteId: string | null
}

export function EditNoteDialog({ open, onOpenChange, noteId }: EditNoteDialogProps) {
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  // Load note data when dialog opens
  useEffect(() => {
    if (open && noteId) {
      loadNote()
    } else {
      // Reset form when dialog closes
      setNoteTitle('')
      setNoteContent('')
    }
  }, [open, noteId])

  const loadNote = async () => {
    if (!noteId) return

    try {
      setIsLoading(true)
      console.log('[FounderNote:EditNote] Loading note:', noteId)

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('[FounderNote:EditNote] Error getting user:', userError)
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('[FounderNote:EditNote] Error loading note:', error)
        setIsLoading(false)
        return
      }

      console.log('[FounderNote:EditNote] Note loaded successfully:', data)

      // Populate form with note data
      setNoteTitle(data.title || '')
      setNoteContent(data.formatted_content || data.content || data.raw_transcript || '')
      setIsLoading(false)
    } catch (error) {
      console.error('[FounderNote:EditNote] Unexpected error loading note:', error)
      setIsLoading(false)
    }
  }

  const handleSaveNote = async () => {
    if (!noteId || !noteContent.trim()) return

    try {
      setIsSaving(true)
      console.log('[FounderNote:EditNote] Saving note:', { noteId, noteTitle, noteContent })

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('[FounderNote:EditNote] Error getting user:', userError)
        setIsSaving(false)
        return
      }

      // Update note in Supabase
      const { data, error } = await supabase
        .from('notes')
        .update({
          title: noteTitle || 'Untitled Note',
          content: noteContent,
          formatted_content: noteContent,
          // Keep raw_transcript if it exists, otherwise update it
          raw_transcript: noteContent,
        })
        .eq('id', noteId)
        .eq('user_id', user.id)
        .select()

      if (error) {
        console.error('[FounderNote:EditNote] Error saving note:', error)
        setIsSaving(false)
        return
      }

      console.log('[FounderNote:EditNote] Note saved successfully:', data)

      setIsSaving(false)
      onOpenChange(false)

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('noteUpdated', { detail: { noteId } }))

      // Reload the page to show the updated note
      window.location.reload()
    } catch (error) {
      console.error('[FounderNote:EditNote] Unexpected error:', error)
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
          <DialogDescription>
            Update your note title and content
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-note-title">Title (Optional)</Label>
                <Input
                  id="edit-note-title"
                  placeholder="Enter note title..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-note-content">Note Content</Label>
                <Textarea
                  id="edit-note-content"
                  placeholder="Start typing your note..."
                  className="min-h-[200px]"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveNote}
                  disabled={!noteContent.trim() || isSaving}
                  className="bg-black hover:bg-gray-900 text-white"
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

