'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tag, X, Check, Palette } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { tagColors, getTagColor } from '@/lib/tag-colors'

interface AddTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  noteId: string
  existingTags?: string[]
}

export function AddTagDialog({ open, onOpenChange, noteId, existingTags = [] }: AddTagDialogProps) {
  const [newTag, setNewTag] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [selectedColor, setSelectedColor] = useState(tagColors[0])
  const [showColorDropdown, setShowColorDropdown] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const hasUserInteracted = useRef(false)
  const selectedTagsRef = useRef<string[]>([])
  const colorDropdownRef = useRef<HTMLDivElement>(null)
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

        // First, get the current note's tags to ensure we have the latest
        const { data: currentNote, error: noteError } = await supabase
          .from('notes')
          .select('tags')
          .eq('id', noteId)
          .eq('user_id', user.id)
          .single()

        if (noteError) {
          console.error('[FounderNote:AddTag] Error loading current note:', noteError)
        }

        // Set selected tags from current note or existingTags prop
        // Only set if user hasn't interacted yet (to prevent resetting user selections)
        const currentTags = currentNote?.tags 
          ? (Array.isArray(currentNote.tags) ? currentNote.tags : [])
          : (Array.isArray(existingTags) ? existingTags : [])
        
        console.log('[FounderNote:AddTag] Loading tags for note:', { 
          noteId, 
          currentTags, 
          existingTags,
          hasUserInteracted: hasUserInteracted.current,
          currentSelectedTags: selectedTags
        })
        
        // Only update selectedTags if user hasn't made any changes yet
        if (!hasUserInteracted.current) {
          setSelectedTags(currentTags)
        } else {
          console.log('[FounderNote:AddTag] Skipping selectedTags update - user has interacted')
        }

        // Load all tags from all notes
        const { data, error } = await supabase
          .from('notes')
          .select('tags')
          .eq('user_id', user.id)

        if (error) {
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
        setIsInitialized(true)
      } catch (error) {
        console.error('[FounderNote:AddTag] Unexpected error loading tags:', error)
        setAllTags([])
        setSelectedTags(Array.isArray(existingTags) ? existingTags : [])
        setIsInitialized(true)
      }
    }

    if (open && !isInitialized) {
      hasUserInteracted.current = false
      loadAllTags()
      setNewTag('')
      setSelectedColor(tagColors[0])
    } else if (!open && isInitialized) {
      // Reset when dialog closes
      setIsInitialized(false)
      hasUserInteracted.current = false
      setSelectedTags([])
      setNewTag('')
    }
  }, [open, noteId, supabase])

  // Close color dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
        setShowColorDropdown(false)
      }
    }

    if (showColorDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColorDropdown])

  const handleToggleTag = (tag: string) => {
    console.log('[FounderNote:AddTag] handleToggleTag called:', { tag, currentSelectedTags: selectedTags })
    hasUserInteracted.current = true
    
    setSelectedTags(prevTags => {
      const currentTags = Array.isArray(prevTags) ? [...prevTags] : []
      const tagIndex = currentTags.indexOf(tag)
      
      if (tagIndex > -1) {
        // Remove tag
        const newTags = currentTags.filter(t => t !== tag)
        console.log('[FounderNote:AddTag] Removing tag:', { tag, before: currentTags, after: newTags, tagIndex })
        selectedTagsRef.current = newTags
        return newTags
      } else {
        // Add tag
        const newTags = [...currentTags, tag]
        console.log('[FounderNote:AddTag] Adding tag:', { tag, before: currentTags, after: newTags })
        selectedTagsRef.current = newTags
        return newTags
      }
    })
  }

  const handleAddNewTag = () => {
    const trimmedTag = newTag.trim()
    if (!trimmedTag) {
      console.log('[FounderNote:AddTag] handleAddNewTag called but tag is empty')
      return
    }
    
    console.log('[FounderNote:AddTag] handleAddNewTag called:', { trimmedTag, currentSelectedTags: selectedTags, allTags })
    hasUserInteracted.current = true
    
    setSelectedTags(prevTags => {
      const currentTags = Array.isArray(prevTags) ? [...prevTags] : []
      
      if (currentTags.includes(trimmedTag)) {
        console.log('[FounderNote:AddTag] Tag already selected, clearing input')
        setNewTag('')
        return prevTags
      }
      
      const newTags = [...currentTags, trimmedTag]
      console.log('[FounderNote:AddTag] Adding new tag:', { tag: trimmedTag, before: currentTags, after: newTags })
      selectedTagsRef.current = newTags
      
      if (!allTags.includes(trimmedTag)) {
        // New tag, add to all tags list
        setAllTags(prev => {
          const updated = [...prev, trimmedTag].sort()
          console.log('[FounderNote:AddTag] Updated allTags:', updated)
          return updated
        })
      }
      
      setNewTag('')
      return newTags
    })
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
      
      // Get tags from ref (always has latest value) and state
      const tagsFromRef = Array.isArray(selectedTagsRef.current) ? [...selectedTagsRef.current] : []
      const tagsFromState = Array.isArray(selectedTags) ? [...selectedTags] : []
      const tagsToSave = tagsFromRef.length > 0 ? tagsFromRef : tagsFromState
      
      console.log('[FounderNote:AddTag] Saving tags:', { 
        noteId, 
        tags: tagsToSave, 
        tagsLength: tagsToSave.length,
        tagsFromRef,
        tagsFromState,
        selectedTagsState: selectedTags,
        hasUserInteracted: hasUserInteracted.current
      })
      
      if (tagsToSave.length === 0 && hasUserInteracted.current) {
        console.warn('[FounderNote:AddTag] Warning: User interacted but tags array is empty. This might be intentional if removing all tags.')
      } else if (tagsToSave.length === 0 && !hasUserInteracted.current) {
        console.log('[FounderNote:AddTag] No changes made. Closing dialog without saving.')
        setIsSaving(false)
        onOpenChange(false)
        return
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('[FounderNote:AddTag] Error getting user:', userError)
        setIsSaving(false)
        return
      }

      console.log('[FounderNote:AddTag] About to save to database:', { noteId, tags: tagsToSave })

      // Update note with new tags - ensure it's an array
      const { error, data } = await supabase
        .from('notes')
        .update({ tags: tagsToSave })
        .eq('id', noteId)
        .eq('user_id', user.id)
        .select('tags')

      if (error) {
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

      console.log('[FounderNote:AddTag] Tags saved successfully:', { 
        saved: tagsToSave, 
        returned: data?.[0]?.tags,
        noteId 
      })

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('tagsUpdated', { 
        detail: { noteId, tags: tagsToSave } 
      }))
      window.dispatchEvent(new CustomEvent('noteUpdated', { 
        detail: { noteId } 
      }))

      setIsSaving(false)
      onOpenChange(false)
      
      // Force a small delay to ensure events are processed
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('tagsUpdated', { 
          detail: { noteId, tags: tagsToSave } 
        }))
      }, 100)
    } catch (error) {
      console.error('[FounderNote:AddTag] Unexpected error:', error)
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="pb-4 border-b border-gray-200 mb-0">
          <DialogTitle className="text-xl font-semibold">Manage Tags</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Organize your note with tags and colors
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-6 px-1">
          {/* Debug Info - Remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs bg-gray-100 p-2 rounded mb-2">
              <div>Selected Tags: {JSON.stringify(selectedTags)}</div>
              <div>Has Interacted: {hasUserInteracted.current ? 'Yes' : 'No'}</div>
              <div>All Tags Count: {allTags.length}</div>
            </div>
          )}
          
          {/* Create New Tag Section */}
          <div className="space-y-3">
            <Label htmlFor="tag-input" className="text-sm font-medium text-gray-900">
              Create New Tag
            </Label>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">
                <Input
                  id="tag-input"
                  placeholder="Enter tag name..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-10"
                />
              </div>
              
              {/* Color Picker Button */}
              <div className="relative flex-shrink-0" ref={colorDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowColorDropdown(!showColorDropdown)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 h-10 px-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md",
                    selectedColor.border,
                    selectedColor.bg,
                    selectedColor.text
                  )}
                  title="Select tag color"
                >
                  <Palette className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium hidden sm:inline">{selectedColor.name}</span>
                </button>
                
                {/* Color Dropdown */}
                {showColorDropdown && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 w-[200px]">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Choose Color
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {tagColors.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => {
                            setSelectedColor(color)
                            setShowColorDropdown(false)
                          }}
                          className={cn(
                            "relative aspect-square rounded-md border-2 transition-all duration-200 hover:scale-110",
                            selectedColor.value === color.value
                              ? color.border + " ring-2 ring-black ring-offset-1"
                              : "border-gray-200 hover:" + color.border
                          )}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        >
                          {selectedColor.value === color.value && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check className="h-4 w-4 text-black" strokeWidth={2.5} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="button"
                onClick={handleAddNewTag}
                disabled={!newTag.trim()}
                className="h-10 px-3 bg-black hover:bg-gray-900 text-white flex-shrink-0"
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Preview of new tag */}
            {newTag.trim() && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Preview:</span>
                <span className={cn(
                  "inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full border",
                  selectedColor.bg,
                  selectedColor.text,
                  selectedColor.border
                )}>
                  {newTag}
                </span>
              </div>
            )}
          </div>

          {/* Selected Tags Section */}
          {selectedTags.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900">
                Tags on This Note ({selectedTags.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => {
                  const tagColor = getTagColor(tag)
                  return (
                    <div
                      key={tag}
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full border",
                        tagColor.bg,
                        tagColor.text,
                        tagColor.border
                      )}
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => handleToggleTag(tag)}
                        className="hover:opacity-70 rounded-full p-0.5 transition-opacity ml-1"
                        title="Remove tag"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Available Tags Section */}
          {allTags.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900">
                Available Tags ({allTags.length})
              </Label>
              <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1">
                {allTags.map((tag) => {
                  const isSelected = Array.isArray(selectedTags) && selectedTags.includes(tag)
                  const tagColor = getTagColor(tag)
                  return (
                    <button
                      key={`tag-${tag}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('[FounderNote:AddTag] Tag button clicked:', { 
                          tag, 
                          isSelected, 
                          currentTags: selectedTags,
                          allTags: allTags
                        })
                        handleToggleTag(tag)
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('[FounderNote:AddTag] Tag button touched:', { tag })
                        handleToggleTag(tag)
                      }}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 cursor-pointer select-none',
                        isSelected
                          ? tagColor.bg + ' ' + tagColor.text + ' ' + tagColor.border + ' hover:opacity-90'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                      )}
                      style={{ pointerEvents: 'auto', zIndex: 10 }}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                      <span>{tag}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Show message if no tags available */}
          {allTags.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No tags available. Create your first tag above.
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('[FounderNote:AddTag] Save button clicked:', { 
                selectedTags, 
                selectedTagsRef: selectedTagsRef.current,
                hasUserInteracted: hasUserInteracted.current 
              })
              handleDone()
            }}
            disabled={isSaving}
            className="px-6 bg-black hover:bg-gray-900 text-white min-w-[100px]"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              'Save Tags'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
