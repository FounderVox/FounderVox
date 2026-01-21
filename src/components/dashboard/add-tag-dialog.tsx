'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tag, X, Check, Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { getTagColor } from '@/lib/tag-colors'

interface AddTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  noteId: string
  existingTags?: string[]
}

export function AddTagDialog({ open, onOpenChange, noteId, existingTags = [] }: AddTagDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const hasUserInteracted = useRef(false)
  const selectedTagsRef = useRef<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Keep ref in sync with state
  useEffect(() => {
    selectedTagsRef.current = selectedTags
  }, [selectedTags])

  // Load all existing tags from all notes and current note tags
  useEffect(() => {
    const loadAllTags = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get the current note's tags
        const { data: currentNote } = await supabase
          .from('notes')
          .select('tags')
          .eq('id', noteId)
          .eq('user_id', user.id)
          .single()

        const currentTags = currentNote?.tags
          ? (Array.isArray(currentNote.tags) ? currentNote.tags : [])
          : (Array.isArray(existingTags) ? existingTags : [])

        if (!hasUserInteracted.current) {
          setSelectedTags(currentTags)
        }

        // Load all tags from all notes
        const { data, error } = await supabase
          .from('notes')
          .select('tags')
          .eq('user_id', user.id)

        if (error) {
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
        setIsInitialized(true)
      } catch (error) {
        console.error('[AddTag] Error loading tags:', error)
        setAllTags([])
        setSelectedTags(Array.isArray(existingTags) ? existingTags : [])
        setIsInitialized(true)
      }
    }

    if (open && !isInitialized) {
      hasUserInteracted.current = false
      loadAllTags()
      setSearchQuery('')
    } else if (!open && isInitialized) {
      setIsInitialized(false)
      hasUserInteracted.current = false
      setSelectedTags([])
      setSearchQuery('')
    }
  }, [open, noteId, supabase, existingTags])

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleToggleTag = (tag: string) => {
    hasUserInteracted.current = true

    setSelectedTags(prevTags => {
      const currentTags = Array.isArray(prevTags) ? [...prevTags] : []
      const tagIndex = currentTags.indexOf(tag)

      if (tagIndex > -1) {
        const newTags = currentTags.filter(t => t !== tag)
        selectedTagsRef.current = newTags
        return newTags
      } else {
        const newTags = [...currentTags, tag]
        selectedTagsRef.current = newTags
        return newTags
      }
    })
  }

  const handleCreateTag = () => {
    const trimmedTag = searchQuery.trim()
    if (!trimmedTag) return

    hasUserInteracted.current = true

    setSelectedTags(prevTags => {
      const currentTags = Array.isArray(prevTags) ? [...prevTags] : []

      if (currentTags.includes(trimmedTag)) {
        setSearchQuery('')
        return prevTags
      }

      const newTags = [...currentTags, trimmedTag]
      selectedTagsRef.current = newTags

      if (!allTags.includes(trimmedTag)) {
        setAllTags(prev => [...prev, trimmedTag].sort())
      }

      setSearchQuery('')
      return newTags
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreateTag()
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const tagsToSave = selectedTagsRef.current.length > 0
        ? selectedTagsRef.current
        : selectedTags

      if (tagsToSave.length === 0 && !hasUserInteracted.current) {
        setIsSaving(false)
        onOpenChange(false)
        return
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('[AddTag] Error getting user:', userError)
        setIsSaving(false)
        return
      }

      const { error } = await supabase
        .from('notes')
        .update({ tags: tagsToSave })
        .eq('id', noteId)
        .eq('user_id', user.id)

      if (error) {
        console.error('[AddTag] Error saving tags:', error)
        setIsSaving(false)
        return
      }

      window.dispatchEvent(new CustomEvent('noteUpdated', {
        detail: { noteId, tags: tagsToSave }
      }))

      setIsSaving(false)
      onOpenChange(false)
    } catch (error) {
      console.error('[AddTag] Unexpected error:', error)
      setIsSaving(false)
    }
  }

  // Filter tags based on search query
  const filteredTags = allTags.filter(tag =>
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Check if search query matches an existing tag exactly
  const queryMatchesExisting = allTags.some(
    tag => tag.toLowerCase() === searchQuery.trim().toLowerCase()
  )

  // Show create option if there's a query and it doesn't exactly match existing
  const showCreateOption = searchQuery.trim() && !queryMatchesExisting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="text-base font-medium">Manage Tags</DialogTitle>
        </DialogHeader>

        {/* Search/Create Input */}
        <div className="px-4 py-3 border-b bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              placeholder="Search or create tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 h-9 bg-white"
            />
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {/* Create New Tag Option */}
          {showCreateOption && (
            <button
              onClick={handleCreateTag}
              className="w-full px-4 py-2.5 flex items-center gap-2 text-left hover:bg-gray-50 transition-colors border-b"
            >
              <div className="flex items-center justify-center w-5 h-5 rounded bg-gray-900 text-white">
                <Plus className="h-3 w-3" />
              </div>
              <span className="text-sm">
                Create "<span className="font-medium">{searchQuery.trim()}</span>"
              </span>
            </button>
          )}

          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="px-4 py-3 border-b">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Selected ({selectedTags.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map((tag) => {
                  const tagColor = getTagColor(tag)
                  return (
                    <span
                      key={tag}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full",
                        tagColor.bg,
                        tagColor.text,
                        tagColor.border,
                        "border"
                      )}
                    >
                      {tag}
                      <button
                        onClick={() => handleToggleTag(tag)}
                        className="hover:opacity-70 ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Available Tags List */}
          {filteredTags.length > 0 ? (
            <div className="py-1">
              {filteredTags.map((tag) => {
                const isSelected = selectedTags.includes(tag)
                const tagColor = getTagColor(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className={cn(
                      "w-full px-4 py-2 flex items-center justify-between text-left transition-colors",
                      isSelected ? "bg-gray-50" : "hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          tagColor.bg,
                          tagColor.border,
                          "border"
                        )}
                      />
                      <span className="text-sm text-gray-700">{tag}</span>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-gray-900" />
                    )}
                  </button>
                )
              })}
            </div>
          ) : !showCreateOption ? (
            <div className="px-4 py-8 text-center">
              <Tag className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {searchQuery ? 'No matching tags' : 'No tags yet'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Type to create your first tag
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gray-900 hover:bg-gray-800 text-white min-w-[80px]"
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
