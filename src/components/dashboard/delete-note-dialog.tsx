'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DeleteNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  noteTitle?: string
}

export function DeleteNoteDialog({ 
  open, 
  onOpenChange, 
  onConfirm,
  noteTitle 
}: DeleteNoteDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => onOpenChange(false)}
          >
            <div
              className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-red-100 flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-black mb-1">Delete Note</h2>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete this note?
                </p>
                {noteTitle && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-black truncate">
                      {noteTitle}
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-3">
                  This will permanently delete the note and all its content.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="hover:bg-gray-50 hover:border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Note
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

