'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Send,
  Loader2,
  Clock,
  CalendarDays,
  Sparkles,
  FileText,
  RefreshCw,
  ExternalLink,
  BookOpen,
  ChevronDown,
  AlertCircle,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { FilterBar } from '@/components/dashboard/filter-bar'

export const dynamic = 'force-dynamic'

// Types
interface Citation {
  id: string
  noteId: string
  noteTitle: string
  snippet: string
  createdAt: string
  templateLabel: string | null
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  timestamp: string
  isLoading?: boolean
  isError?: boolean
}

type TimeFilter = 'week' | 'month' | '3months' | 'all'

const TIME_FILTERS: { value: TimeFilter; label: string; icon: typeof Clock }[] = [
  { value: 'week', label: 'Last week', icon: Clock },
  { value: 'month', label: 'Last month', icon: CalendarDays },
  { value: '3months', label: 'Last 3 months', icon: CalendarDays },
  { value: 'all', label: 'All time', icon: BookOpen },
]

const EXAMPLE_QUESTIONS = [
  "What were the key decisions from my last team meeting?",
  "Summarize my product ideas from this month",
  "What action items do I have outstanding?",
  "What concerns or blockers have I mentioned recently?",
  "Find mentions of customer feedback or churn",
]

export default function AskPage() {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null)
  const [indexStatus, setIndexStatus] = useState<{ indexed: number; pending: number; total: number } | null>(null)
  const [isIndexing, setIsIndexing] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Check index status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/embeddings/backfill')
        if (response.ok) {
          const data = await response.json()
          setIndexStatus(data)
        }
      } catch (error) {
        console.error('[Ask] Failed to check index status:', error)
      }
    }
    checkStatus()
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
  }

  // Index notes that need embeddings
  const handleIndexNotes = async () => {
    if (isIndexing) return
    setIsIndexing(true)

    try {
      const response = await fetch('/api/embeddings/backfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 20 })
      })

      if (response.ok) {
        const data = await response.json()
        setIndexStatus({
          indexed: (indexStatus?.total || 0) - data.remaining,
          pending: data.remaining,
          total: indexStatus?.total || 0
        })

        // If more notes need indexing, continue
        if (data.remaining > 0) {
          setTimeout(handleIndexNotes, 500)
        }
      }
    } catch (error) {
      console.error('[Ask] Indexing error:', error)
    } finally {
      setIsIndexing(false)
    }
  }

  // Submit query
  const handleSubmit = useCallback(async (query?: string) => {
    const queryText = query || inputValue.trim()
    if (!queryText || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText,
      timestamp: new Date().toISOString()
    }

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isLoading: true
    }

    setMessages(prev => [...prev, userMessage, loadingMessage])
    setInputValue('')
    setIsLoading(true)
    setExpandedCitation(null)

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    try {
      const response = await fetch('/api/ask/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          conversationHistory: messages.filter(m => !m.isLoading),
          timeFilter
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: data.answer,
        citations: data.citations,
        timestamp: new Date().toISOString()
      }

      setMessages(prev =>
        prev.filter(m => !m.isLoading).concat(assistantMessage)
      )

    } catch (error) {
      console.error('[Ask] Error:', error)
      setMessages(prev =>
        prev.filter(m => !m.isLoading).concat({
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
          timestamp: new Date().toISOString(),
          isError: true
        })
      )
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, messages, timeFilter])

  // Handle keyboard submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Clear conversation
  const handleClearConversation = () => {
    setMessages([])
    setExpandedCitation(null)
  }

  // Navigate to note
  const handleOpenNote = (noteId: string) => {
    window.location.href = `/dashboard/notes/${noteId}`
  }

  // Render message content with citations
  const renderMessageContent = (message: Message) => {
    if (message.isLoading) {
      return (
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Searching your notes...</span>
        </div>
      )
    }

    if (message.isError) {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{message.content}</span>
        </div>
      )
    }

    const content = message.content
    const citations = message.citations || []

    // Parse citation markers and render clickable badges
    const parts = content.split(/(\[\d+\])/)

    return (
      <div className="space-y-3">
        {/* Main content with inline citations */}
        <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {parts.map((part, index) => {
            const match = part.match(/\[(\d+)\]/)
            if (match) {
              const citationIndex = parseInt(match[1]) - 1
              const citation = citations[citationIndex]
              if (citation) {
                return (
                  <button
                    key={index}
                    onClick={() => setExpandedCitation(
                      expandedCitation === citation.id ? null : citation.id
                    )}
                    className={cn(
                      "inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded text-xs font-semibold transition-all mx-0.5 align-middle",
                      expandedCitation === citation.id
                        ? "bg-[#BD6750] text-white scale-110"
                        : "bg-gray-200 text-gray-700 hover:bg-[#BD6750]/20 hover:text-[#BD6750]"
                    )}
                  >
                    {match[1]}
                  </button>
                )
              }
            }
            return <span key={index}>{part}</span>
          })}
        </div>

        {/* Expanded citation card */}
        <AnimatePresence>
          {expandedCitation && citations.find(c => c.id === expandedCitation) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {citations
                .filter(c => c.id === expandedCitation)
                .map(citation => (
                  <div
                    key={citation.id}
                    className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#BD6750]/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-[#BD6750]" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-gray-900">
                            {citation.noteTitle}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {new Date(citation.createdAt).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            {citation.templateLabel && (
                              <span className="ml-2 text-gray-400">
                                {citation.templateLabel}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenNote(citation.noteId)}
                          className="text-xs text-[#BD6750] hover:text-[#a85744] flex items-center gap-1 font-medium"
                        >
                          Open note
                          <ExternalLink className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setExpandedCitation(null)}
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {/* Card content */}
                    <div className="p-4">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {citation.snippet}...
                      </p>
                    </div>
                  </div>
                ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Source list when no citation expanded */}
        {citations.length > 0 && !expandedCitation && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">Sources:</span>
            {citations.map(citation => (
              <button
                key={citation.id}
                onClick={() => setExpandedCitation(citation.id)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <span className="text-xs font-semibold text-gray-600">
                  {citation.id}
                </span>
                <span className="text-xs text-gray-500 truncate max-w-[120px]">
                  {citation.noteTitle}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const needsIndexing = indexStatus && indexStatus.pending > 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-full flex flex-col"
    >
      {/* Filter Bar */}
      <FilterBar
        avatarUrl={profile?.avatar_url}
        displayName={profile?.display_name}
        email={profile?.email}
        recordingsCount={profile?.recordings_count || 0}
      />

      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#BD6750] to-[#a85744] flex items-center justify-center shadow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            Ask Your Notes
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Ask questions about your voice notes using natural language
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Index status indicator */}
          {needsIndexing && (
            <button
              onClick={handleIndexNotes}
              disabled={isIndexing}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                isIndexing
                  ? "bg-amber-100 text-amber-700"
                  : "bg-amber-50 text-amber-600 hover:bg-amber-100"
              )}
            >
              {isIndexing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Indexing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Index {indexStatus.pending} notes
                </>
              )}
            </button>
          )}

          {messages.length > 0 && (
            <button
              onClick={handleClearConversation}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              New conversation
            </button>
          )}
        </div>
      </div>

      {/* Time Filter Pills */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-500">Search in:</span>
        <div className="flex gap-2">
          {TIME_FILTERS.map(filter => (
            <button
              key={filter.value}
              onClick={() => setTimeFilter(filter.value)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                timeFilter === filter.value
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <filter.icon className="h-3.5 w-3.5" />
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto pb-4 space-y-6 min-h-0">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#BD6750]/10 to-[#BD6750]/5 flex items-center justify-center mb-4">
              <MessageSquare className="h-7 w-7 text-[#BD6750]" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-1">
              What would you like to know?
            </h2>
            <p className="text-gray-500 max-w-md mb-6 text-sm">
              Ask questions about your notes and I'll find relevant information with citations.
            </p>

            {/* Example Questions - Horizontal Scrollable */}
            <div className="w-full max-w-3xl">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-medium text-left">
                Try asking
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {EXAMPLE_QUESTIONS.map((question, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    onClick={() => handleSubmit(question)}
                    className="flex-shrink-0 text-left px-4 py-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all group shadow-sm max-w-[280px]"
                  >
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 line-clamp-2">
                      {question}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Conversation */
          messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={cn(
                "flex gap-4",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.role === 'assistant' && (
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#BD6750] to-[#a85744] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.role === 'user'
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 shadow-sm"
                )}
              >
                {message.role === 'user' ? (
                  <p className="text-sm">{message.content}</p>
                ) : (
                  renderMessageContent(message)
                )}
              </div>

              {message.role === 'user' && (
                <div className="h-8 w-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-gray-600">
                    {profile?.display_name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50 pt-4 pb-4 -mx-6 px-6 -mb-6">
        <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your notes..."
            rows={1}
            disabled={isLoading}
            className="w-full resize-none px-4 py-3.5 pr-14 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#BD6750]/20 focus:border-[#BD6750]/30 disabled:opacity-50 text-sm"
            style={{ maxHeight: '150px' }}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!inputValue.trim() || isLoading}
            className={cn(
              "absolute right-3 bottom-3 h-9 w-9 rounded-xl flex items-center justify-center transition-all",
              inputValue.trim() && !isLoading
                ? "bg-[#BD6750] text-white hover:bg-[#a85744] shadow-sm"
                : "bg-gray-100 text-gray-400"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </motion.div>
  )
}
