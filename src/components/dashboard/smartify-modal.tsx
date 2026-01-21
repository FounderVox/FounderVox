'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, CheckCircle2, XCircle, Loader2, CheckCircle, AlertCircle, ClipboardList, Briefcase, Brain } from 'lucide-react'

interface SmartifyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  noteId: string | null
  noteTitle?: string
}

interface ExtractionPreview {
  actionItems: number
  investorUpdates: number
  brainDump: number
  // Legacy fields (ignored but kept for API compatibility)
  progressLogs?: number
  productIdeas?: number
}

export function SmartifyModal({ open, onOpenChange, noteId, noteTitle }: SmartifyModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [preview, setPreview] = useState<ExtractionPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (open && noteId) {
      handlePreview()
    } else {
      // Reset state when modal closes
      setIsProcessing(false)
      setIsSaving(false)
      setPreview(null)
      setError(null)
      setShowPreview(false)
    }
  }, [open, noteId])

  const handlePreview = async () => {
    if (!noteId) return

    try {
      setIsProcessing(true)
      setError(null)
      console.log('[FounderNote:SmartifyModal] Getting preview for note:', noteId)

      const response = await fetch('/api/notes/smartify/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || 'Preview failed')
      }

      const data = await response.json()
      console.log('[FounderNote:SmartifyModal] Preview received:', data.preview)

      setPreview(data.preview)
      setIsProcessing(false)
      setShowPreview(true)
    } catch (error) {
      console.error('[FounderNote:SmartifyModal] Error getting preview:', error)
      setError(error instanceof Error ? error.message : 'Failed to get preview')
      setIsProcessing(false)
    }
  }

  const handleConfirm = async () => {
    if (!noteId) return

    try {
      setIsSaving(true)
      setError(null)
      console.log('[FounderNote:SmartifyModal] Confirming and saving extraction for note:', noteId)

      const response = await fetch('/api/notes/smartify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || 'Smartify failed')
      }

      const data = await response.json()
      console.log('[FounderNote:SmartifyModal] Smartify saved:', data.extracted)

      // Show success briefly, then close
      setTimeout(() => {
        onOpenChange(false)
        // Dispatch event to refresh pages (no reload needed)
        window.dispatchEvent(new CustomEvent('noteUpdated', { detail: { noteId } }))
      }, 1500)
    } catch (error) {
      console.error('[FounderNote:SmartifyModal] Error confirming smartify:', error)
      setError(error instanceof Error ? error.message : 'Failed to save extraction')
      setIsSaving(false)
    }
  }

  const totalExtracted = preview
    ? preview.actionItems + preview.investorUpdates + preview.brainDump
    : 0

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header - Brand themed */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-brand-light rounded-xl border border-brand/20">
              <Wand2 className="h-6 w-6 text-brand" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Smartify Note</h2>
              <p className="text-sm text-gray-600">
                {noteTitle || 'Extracting structured insights from your note...'}
              </p>
            </div>
          </div>

          {/* Processing State - Brand themed spinner */}
          {isProcessing && !showPreview && (
            <div className="py-12 text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto mb-6">
                {/* Outer spinning ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="absolute inset-0 w-20 h-20 border-4 border-brand-light border-t-brand rounded-full"
                />
                {/* Inner icon */}
                <div className="relative z-10 w-12 h-12 bg-brand rounded-full flex items-center justify-center shadow-lg">
                  <Wand2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analyzing your note...
              </h3>
              <p className="text-gray-600">
                Using AI to identify what can be extracted from your note.
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isProcessing && !isSaving && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {error.includes('already smartified') ? 'Already Smartified' : 'Error'}
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => onOpenChange(false)}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          )}

          {/* Preview State - Show what will be extracted */}
          {preview && showPreview && !isSaving && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-light rounded-2xl border border-brand/20 mb-4 shadow-sm">
                  <Wand2 className="h-8 w-8 text-brand" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Preview Extraction
                </h3>
                <p className="text-gray-600">
                  We found <span className="font-semibold text-brand">{totalExtracted}</span> items that can be extracted. Review and confirm to create them.
                </p>
              </div>

              {/* Preview Grid - Brand accented */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {preview.actionItems > 0 && (
                  <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-brand/40 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-brand-light">
                        <ClipboardList className="h-4 w-4 text-brand" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Action Items</span>
                          <span className="text-lg font-bold text-brand">{preview.actionItems}</span>
                        </div>
                        <p className="text-xs text-gray-500">Tasks and todos</p>
                      </div>
                    </div>
                  </div>
                )}

                {preview.investorUpdates > 0 && (
                  <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-brand/40 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-brand-light">
                        <Briefcase className="h-4 w-4 text-brand" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Investor Updates</span>
                          <span className="text-lg font-bold text-brand">{preview.investorUpdates}</span>
                        </div>
                        <p className="text-xs text-gray-500">Update drafts</p>
                      </div>
                    </div>
                  </div>
                )}

                {preview.brainDump > 0 && (
                  <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-brand/40 hover:shadow-sm transition-all duration-200 col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-brand-light">
                        <Brain className="h-4 w-4 text-brand" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Brain Dump Notes</span>
                          <span className="text-lg font-bold text-brand">{preview.brainDump}</span>
                        </div>
                        <p className="text-xs text-gray-500">Thoughts and insights</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {totalExtracted === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    No structured data was found in this note. Try Smartify on a note with more detailed content.
                  </p>
                </div>
              )}

              {/* Actions - Brand primary button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                {totalExtracted > 0 && (
                  <button
                    onClick={handleConfirm}
                    className="px-6 py-2.5 bg-brand text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2 font-medium shadow-sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Create {totalExtracted} Item{totalExtracted !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Saving State - Brand themed spinner */}
          {isSaving && (
            <div className="py-12 text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto mb-6">
                {/* Outer spinning ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="absolute inset-0 w-20 h-20 border-4 border-brand-light border-t-brand rounded-full"
                />
                {/* Inner icon */}
                <div className="relative z-10 w-12 h-12 bg-brand rounded-full flex items-center justify-center shadow-lg">
                  <Wand2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Creating items...
              </h3>
              <p className="text-gray-600">
                Saving extracted data to your dashboard.
              </p>
            </div>
          )}

          {/* Success State (briefly shown before closing) */}
          {!isSaving && !isProcessing && !error && !showPreview && preview && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Items Created Successfully!
              </h3>
              <p className="text-gray-600">
                {totalExtracted} item{totalExtracted !== 1 ? 's' : ''} have been added to your dashboard.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
