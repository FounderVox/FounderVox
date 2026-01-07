'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Mic, ChevronDown } from 'lucide-react'

const templates = [
  { id: 'none', label: 'No template' },
  { id: 'investor', label: 'Investor Update' },
  { id: 'interview', label: 'User Interview' },
  { id: 'pitch', label: 'Pitch Practice' },
  { id: 'meeting', label: 'Meeting Notes' },
  { id: 'ideas', label: 'Product Ideas' },
  { id: 'braindump', label: 'Brain Dump' },
]

export function QuickRecord() {
  const [isRecording, setIsRecording] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0])
  const [isTemplateOpen, setIsTemplateOpen] = useState(false)

  const handleRecord = () => {
    setIsRecording(!isRecording)
    console.log('[FounderVox:Dashboard] Recording:', !isRecording)
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 mb-6">
      <div className="flex items-center gap-4">
        {/* Record Button */}
        <motion.div
          animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Button
            onClick={handleRecord}
            className={`h-14 px-6 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700'
            } text-white shadow-lg ${isRecording ? 'shadow-red-500/25' : 'shadow-violet-500/25'}`}
          >
            <div className={`p-1.5 rounded-full mr-2 ${isRecording ? 'bg-white/20 animate-pulse' : 'bg-white/20'}`}>
              <Mic className="h-5 w-5" />
            </div>
            {isRecording ? 'Stop Recording' : 'Tap to record'}
          </Button>
        </motion.div>

        {/* Template Selector */}
        <div className="relative">
          <span className="text-xs text-gray-500 block mb-1">Format as:</span>
          <button
            onClick={() => setIsTemplateOpen(!isTemplateOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors min-w-[160px]"
          >
            <span className="flex-1 text-left text-sm">{selectedTemplate.label}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {isTemplateOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsTemplateOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1 w-48 bg-gray-800 rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template)
                      setIsTemplateOpen(false)
                    }}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${
                      selectedTemplate.id === template.id
                        ? 'bg-violet-500/20 text-violet-300'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <motion.div
            className="flex items-center gap-2 text-red-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium">Recording...</span>
          </motion.div>
        )}
      </div>
    </div>
  )
}
