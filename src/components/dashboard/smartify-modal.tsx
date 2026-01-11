'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, CheckCircle2, XCircle, Loader2, ArrowRight, CheckCircle, AlertCircle, ClipboardList, Briefcase, BarChart3, Rocket, Brain } from 'lucide-react'
import Link from 'next/link'

interface SmartifyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  noteId: string | null
  noteTitle?: string
}

interface ExtractionPreview {
  actionItems: number
  investorUpdates: number
  progressLogs: number
  productIdeas: number
  brainDump: number
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
    ? preview.actionItems + preview.investorUpdates + preview.progressLogs + preview.productIdeas + preview.brainDump
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
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gray-100 rounded-xl">
              <Wand2 className="h-6 w-6 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">Smartify Note</h2>
              <p className="text-sm text-gray-600">
                {noteTitle || 'Extracting structured insights from your note...'}
              </p>
            </div>
          </div>

          {/* Processing State */}
          {isProcessing && !showPreview && (
            <div className="py-12 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="inline-flex items-center justify-center w-16 h-16 mb-4"
              >
                <Loader2 className="h-16 w-16 text-black" />
              </motion.div>
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
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* Preview State - Show what will be extracted */}
          {preview && showPreview && !isSaving && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl border border-gray-200 mb-4 shadow-sm">
                  <Wand2 className="h-8 w-8 text-gray-800" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  Preview Extraction
                </h3>
                <p className="text-gray-600">
                  We found <span className="font-semibold text-black">{totalExtracted}</span> items that can be extracted. Review and confirm to create them.
                </p>
              </div>

              {/* Preview Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {preview.actionItems > 0 && (
                  <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <ClipboardList className="h-4 w-4 text-black" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-black">Action Items</span>
                          <span className="text-lg font-bold text-black">{preview.actionItems}</span>
                        </div>
                        <p className="text-xs text-gray-600">Tasks and todos</p>
                      </div>
                    </div>
                  </div>
                )}

                {preview.investorUpdates > 0 && (
                  <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Briefcase className="h-4 w-4 text-black" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-black">Investor Updates</span>
                          <span className="text-lg font-bold text-black">{preview.investorUpdates}</span>
                        </div>
                        <p className="text-xs text-gray-600">Update drafts</p>
                      </div>
                    </div>
                  </div>
                )}

                {preview.progressLogs > 0 && (
                  <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <BarChart3 className="h-4 w-4 text-black" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-black">Progress Logs</span>
                          <span className="text-lg font-bold text-black">{preview.progressLogs}</span>
                        </div>
                        <p className="text-xs text-gray-600">Weekly progress</p>
                      </div>
                    </div>
                  </div>
                )}

                {preview.productIdeas > 0 && (
                  <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Rocket className="h-4 w-4 text-black" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-black">Product Ideas</span>
                          <span className="text-lg font-bold text-black">{preview.productIdeas}</span>
                        </div>
                        <p className="text-xs text-gray-600">Feature ideas</p>
                      </div>
                    </div>
                  </div>
                )}

                {preview.brainDump > 0 && (
                  <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Brain className="h-4 w-4 text-black" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-black">Brain Dump Notes</span>
                          <span className="text-lg font-bold text-black">{preview.brainDump}</span>
                        </div>
                        <p className="text-xs text-gray-600">Thoughts and insights</p>
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

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                {totalExtracted > 0 && (
                  <button
                    onClick={handleConfirm}
                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Create {totalExtracted} Item{totalExtracted !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Saving State */}
          {isSaving && (
            <div className="py-12 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="inline-flex items-center justify-center w-16 h-16 mb-4"
              >
                <Loader2 className="h-16 w-16 text-black" />
              </motion.div>
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
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
