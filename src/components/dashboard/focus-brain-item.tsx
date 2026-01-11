'use client'

import { motion } from 'framer-motion'
import { Users, HelpCircle, AlertTriangle, GitBranch, ArrowRightCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrainDumpItem } from '@/types/dashboard'
import Link from 'next/link'

interface FocusBrainItemProps {
  item: BrainDumpItem
}

export function FocusBrainItem({ item }: FocusBrainItemProps) {
  const categoryConfig = {
    meeting: {
      icon: Users,
      iconColor: 'text-blue-600',
      border: 'border-l-blue-500',
      label: 'Meeting'
    },
    blocker: {
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      border: 'border-l-red-500',
      label: 'Blocker'
    },
    decision: {
      icon: GitBranch,
      iconColor: 'text-purple-600',
      border: 'border-l-purple-500',
      label: 'Decision'
    },
    question: {
      icon: HelpCircle,
      iconColor: 'text-amber-600',
      border: 'border-l-amber-500',
      label: 'Question'
    },
    followup: {
      icon: ArrowRightCircle,
      iconColor: 'text-emerald-600',
      border: 'border-l-emerald-500',
      label: 'Follow-up'
    }
  }

  const config = categoryConfig[item.category]
  const Icon = config.icon

  // Truncate content for preview
  const truncatedContent = item.content.length > 100
    ? item.content.substring(0, 100) + '...'
    : item.content

  return (
    <Link href="/dashboard/brain-dump">
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "rounded-xl p-4 bg-white border border-gray-200 shadow-sm border-l-4 transition-all cursor-pointer group",
          config.border,
          "hover:shadow-md hover:border-gray-300"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <Icon className={cn("h-4 w-4", config.iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 leading-relaxed">
              {truncatedContent}
            </p>

            {/* Meta info */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Category label */}
              <span className="text-xs text-gray-400 font-medium">
                {config.label}
              </span>

              {/* Participants */}
              {item.participants && item.participants.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Users className="h-3 w-3" />
                  {item.participants.length}
                </span>
              )}

              {/* Time */}
              <span className="text-xs text-gray-400">
                {new Date(item.created_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
          </div>

          {/* Arrow indicator on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
