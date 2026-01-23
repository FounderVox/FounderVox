'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Mic } from 'lucide-react'
import { RecordingModal } from '@/components/recording/recording-modal'

export function QuickRecord() {
  const [showRecordingModal, setShowRecordingModal] = useState(false)

  const handleRecord = () => {
    setShowRecordingModal(true)
    console.log('[Founder Notes:Dashboard] Opening recording modal')
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Record Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
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
      </div>

      {/* Recording Modal */}
      <RecordingModal
        isOpen={showRecordingModal}
        onClose={() => setShowRecordingModal(false)}
      />
    </div>
  )
}
