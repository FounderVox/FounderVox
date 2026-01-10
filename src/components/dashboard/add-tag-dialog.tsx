'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tag, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface AddTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  noteId: string
  existingTags?: string[]
}

export function AddTagDialog({ open, onOpenChange, noteId, existingTags = [] }: AddTagDialogProps) {
  const [newTag, setNewTag] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>(existingTags)
  const [allTags, setAllTags] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  // Load all existing tags from all notes
  useEffect(() => {
    const loadAllTags = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('notes')
          .select('tags')
          .eq('user_id', user.id)

        if (error) {
          // Check if error is because tags column doesn't exist
          if (error.code === '42703' && error.message?.includes('tags')) {
            console.log('[FounderNote:AddTag] Tags column does not exist, tags feature unavailable')
            setAllTags([])
            return
          }
          console.error('[FounderNote:AddTag] Error loading tags:', error)
          setAllTags([])
          return
        }

        // Extract unique tags from all notes
        const uniqueTags = new Set<string>()
        data?.forEach((note: any) => {
          if (note.tags && Array.isArray(note.tags)) {
            note.tags.forEach((tag: string) => {
              if (tag && typeof tag === 'string' && tag.trim()) {
                uniqueTags.add(tag.trim())
              }
            })
          }
        })

        setAllTags(Array.from(uniqueTags).sort())
      } catch (error) {
        console.error('[FounderNote:AddTag] Unexpected error loading tags:', error)
        setAllTags([])
      }
    }

    if (open) {
      loadAllTags()
      setSelectedTags(existingTags)
    }
  }, [open, existingTags, supabase])

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleAddNewTag = () => {
    const trimmedTag = newTag.trim()
    if (!trimmedTag) return
    if (selectedTags.includes(trimmedTag)) return // Already selected
    if (allTags.includes(trimmedTag)) {
      // Tag exists, just select it
      setSelectedTags([...selectedTags, trimmedTag])
    } else {
      // New tag, add to both lists
      setAllTags([...allTags, trimmedTag].sort())
      setSelectedTags([...selectedTags, trimmedTag])
    }
    setNewTag('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddNewTag()
    }
  }

  const handleDone = async () => {
    try {
      setIsSaving(true)
      console.log('[FounderNote:AddTag] Saving tags:', { noteId, tags: selectedTags })

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('[FounderNote:AddTag] Error getting user:', userError)
        setIsSaving(false)
        return
      }

      // Update note with new tags
      const { error } = await supabase
        .from('notes')
        .update({ tags: selectedTags })
        .eq('id', noteId)
        .eq('user_id', user.id)

      if (error) {
        // Check if error is because tags column doesn't exist
        if (error.code === '42703' && error.message?.includes('tags')) {
          console.error('[FounderNote:AddTag] Tags column does not exist. Please run the migration to add tags support.')
          alert('Tags feature is not available. The tags column needs to be added to the database.')
          setIsSaving(false)
          return
        }
        console.error('[FounderNote:AddTag] Error saving tags:', error)
        setIsSaving(false)
        return
      }

      console.log('[FounderNote:AddTag] Tags saved successfully:', selectedTags)

      // Dispatch event to notify other components (filter bar, etc.)
      window.dispatchEvent(new CustomEvent('tagsUpdated', { 
        detail: { noteId, tags: selectedTags } 
      }))

      setIsSaving(false)
      onOpenChange(false)
      
      // Note: We don't reload the page anymore - components listen to tagsUpdated event
    } catch (error) {
      console.error('[FounderNote:AddTag] Unexpected error:', error)
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>
            Select tags for this note or create new ones
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Add New Tag Section */}
          <div className="space-y-2">
            <Label htmlFor="tag-input">Create New Tag</Label>
            <div className="flex gap-2">
              <Input
                id="tag-input"
                placeholder="Enter tag name..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                type="button"
                onClick={handleAddNewTag}
                disabled={!newTag.trim()}
                className="bg-black hover:bg-gray-900 text-white"
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* All Available Tags */}
          {allTags.length > 0 && (
            <div className="space-y-2">
              <Label>Available Tags</Label>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      onClick={() => handleToggleTag(tag)}
                      aria-pressed={isSelected}
                      aria-label={`${isSelected ? 'Remove' : 'Add'} tag ${tag}`}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2',
                        isSelected
                          ? 'bg-black text-white hover:bg-gray-800'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" aria-hidden="true" />}
                      <span>{tag}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Selected Tags for This Note */}
          {selectedTags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags on This Note</Label>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white text-sm rounded-full"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleToggleTag(tag)}
                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      title="Remove tag"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleDone}
              disabled={isSaving}
              className="bg-black hover:bg-gray-900 text-white min-w-[100px]"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                'Done'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
