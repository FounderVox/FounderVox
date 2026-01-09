'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Type, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ManualNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManualNoteDialog({ open, onOpenChange }: ManualNoteDialogProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'audio'>('text')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleSaveTextNote = async () => {
    if (!noteContent.trim()) return

    try {
      setIsSaving(true)
      console.log('[FounderNote:ManualNote] Saving text note:', { noteTitle, noteContent })

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('[FounderNote:ManualNote] Error getting user:', userError)
        setIsSaving(false)
        return
      }

      // Insert note into Supabase
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: noteTitle || 'Untitled Note',
          content: noteContent,
          formatted_content: noteContent,
          raw_transcript: noteContent,
          template_type: 'none',
          duration_seconds: 0,
        })
        .select()

      if (error) {
        console.error('[FounderNote:ManualNote] Error saving note:', error)
        setIsSaving(false)
        return
      }

      console.log('[FounderNote:ManualNote] Note saved successfully:', data)

      // Reset form
      setNoteTitle('')
      setNoteContent('')
      setIsSaving(false)
      onOpenChange(false)

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('noteCreated'))

      // Reload the page to show the new note
      window.location.reload()
    } catch (error) {
      console.error('[FounderNote:ManualNote] Unexpected error:', error)
      setIsSaving(false)
    }
  }

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('[FounderNote:ManualNote] Audio file selected:', file.name)
      setAudioFile(file)
    }
  }

  const handleUploadAudio = async () => {
    if (!audioFile) return

    try {
      setIsSaving(true)
      console.log('[FounderNote:ManualNote] Uploading audio file:', audioFile.name)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('[FounderNote:ManualNote] Error getting user:', userError)
        setIsSaving(false)
        return
      }

      // Upload audio file to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-${audioFile.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-recordings')
        .upload(fileName, audioFile)

      if (uploadError) {
        console.error('[FounderNote:ManualNote] Error uploading audio:', uploadError)
        setIsSaving(false)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio-recordings')
        .getPublicUrl(fileName)

      // Create note with audio URL
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: audioFile.name.replace(/\.[^/.]+$/, ''), // Remove extension
          content: 'Audio recording - transcription pending',
          formatted_content: 'Audio recording - transcription pending',
          raw_transcript: '',
          audio_url: publicUrl,
          template_type: 'none',
          duration_seconds: 0,
        })
        .select()

      if (error) {
        console.error('[FounderNote:ManualNote] Error creating note:', error)
        setIsSaving(false)
        return
      }

      console.log('[FounderNote:ManualNote] Audio note created successfully:', data)

      // Reset form
      setAudioFile(null)
      setIsSaving(false)
      onOpenChange(false)

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('noteCreated'))

      // Reload the page to show the new note
      window.location.reload()
    } catch (error) {
      console.error('[FounderNote:ManualNote] Unexpected error:', error)
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create Note</DialogTitle>
          <DialogDescription>
            Type a note manually or upload an audio file to transcribe
          </DialogDescription>
        </DialogHeader>

        {/* Tab Selector */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === 'text'
                ? 'text-black'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Type className="h-4 w-4" />
            Type Note
            {activeTab === 'text' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === 'audio'
                ? 'text-black'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload Audio
            {activeTab === 'audio' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="py-4">
          {activeTab === 'text' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note-title">Title (Optional)</Label>
                <Input
                  id="note-title"
                  placeholder="Enter note title..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-content">Note Content</Label>
                <Textarea
                  id="note-content"
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
                  onClick={handleSaveTextNote}
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
                      Save Note
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleAudioFileChange}
                />
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">
                  {audioFile ? audioFile.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  MP3, WAV, M4A, or OGG (max 50MB)
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadAudio}
                  disabled={!audioFile || isSaving}
                  className="bg-black hover:bg-gray-900 text-white"
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload & Transcribe
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
