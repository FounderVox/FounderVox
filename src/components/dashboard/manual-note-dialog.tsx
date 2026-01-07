'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Type, Save } from 'lucide-react'

interface ManualNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManualNoteDialog({ open, onOpenChange }: ManualNoteDialogProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'audio'>('text')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSaveTextNote = () => {
    console.log('[FounderVox:ManualNote] Saving text note:', { noteTitle, noteContent })
    // TODO: Implement actual save logic to Supabase
    // Reset form
    setNoteTitle('')
    setNoteContent('')
    onOpenChange(false)
  }

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('[FounderVox:ManualNote] Audio file selected:', file.name)
      setAudioFile(file)
    }
  }

  const handleUploadAudio = () => {
    if (audioFile) {
      console.log('[FounderVox:ManualNote] Uploading audio file:', audioFile.name)
      // TODO: Implement actual upload logic
      setAudioFile(null)
      onOpenChange(false)
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
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveTextNote}
                  disabled={!noteContent.trim()}
                  className="bg-black hover:bg-gray-900 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Note
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
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadAudio}
                  disabled={!audioFile}
                  className="bg-black hover:bg-gray-900 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Transcribe
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
