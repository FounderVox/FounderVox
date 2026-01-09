'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Mic, ChevronDown } from 'lucide-react'
import { RecordingModal } from '@/components/recording/recording-modal'

const templates = [
  { id: 'action_items', label: '📋 Action Items', description: 'Extract tasks and todos' },
  { id: 'investor_update', label: '📧 Investor Update', description: 'Draft update emails' },
  { id: 'progress_log', label: '📈 Progress Log', description: 'Track weekly progress' },
  { id: 'product_ideas', label: '💡 Product Ideas', description: 'Capture feature ideas' },
  { id: 'brain_dump', label: '🧠 Brain Dump', description: 'Meeting notes & thoughts' },
]

export function QuickRecord() {
  const [showRecordingModal, setShowRecordingModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0])
  const [isTemplateOpen, setIsTemplateOpen] = useState(false)

  const handleRecord = () => {
    setShowRecordingModal(true)
    console.log('[FounderNote:Dashboard] Opening recording modal with template:', selectedTemplate.id)
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Record Button */}
        <motion.div
          animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Button
            onClick={handleRecord}
            className="h-14 px-6 bg-black hover:bg-gray-900 text-white shadow-lg"
          >
            <div className="p-1.5 rounded-full mr-2 bg-white/20">
              <Mic className="h-5 w-5" />
            </div>
            Tap to record
          </Button>
        </motion.div>

        {/* Template Selector */}
        <div className="relative">
          <span className="text-xs text-black block mb-1">Format as:</span>
          <button
            onClick={() => setIsTemplateOpen(!isTemplateOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-black hover:bg-black hover:text-white transition-colors min-w-[160px] shadow-sm"
          >
            <span className="flex-1 text-left text-sm">{selectedTemplate.label}</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {isTemplateOpen && (
            <>
              <div
                className="fixed inset-0 z-[100]"
                onClick={() => setIsTemplateOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-xl z-[101] overflow-hidden">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template)
                      setIsTemplateOpen(false)
                    }}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${
                      selectedTemplate.id === template.id
                        ? 'bg-black text-white'
                        : 'text-black hover:bg-black hover:text-white'
                    }`}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      {/* Recording Modal */}
      <RecordingModal
        isOpen={showRecordingModal}
        onClose={() => setShowRecordingModal(false)}
      />
    </div>
  )
}
