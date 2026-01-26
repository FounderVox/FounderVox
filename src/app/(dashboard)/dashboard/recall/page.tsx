'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  MessageCircle,
  Loader2,
  FileText,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useSidebar } from '@/components/dashboard/sidebar'
import { FilterBar } from '@/components/dashboard/filter-bar'
import ReactMarkdown from 'react-markdown'

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

const EXAMPLE_QUESTIONS = [
  { text: "Key decisions from my last meeting", label: "Meetings" },
  { text: "Summarize my product ideas from this month", label: "Ideas" },
  { text: "What action items do I have outstanding?", label: "Tasks" },
  { text: "Find mentions of customer feedback", label: "Feedback" },
]

export default function RecallPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const { isCollapsed } = useSidebar()
  const sidebarWidth = isCollapsed ? 61 : 205
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('recall_messages')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return []
  })
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [indexStatus, setIndexStatus] = useState<{ indexed: number; pending: number; total: number } | null>(null)
  const [isIndexing, setIsIndexing] = useState(false)
  const [setupRequired, setSetupRequired] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const timeFilter = 'all'

  // Check index status on mount and auto-index if needed
  useEffect(() => {
    const checkAndAutoIndex = async () => {
      try {
        const response = await fetch('/api/embeddings/backfill')
        if (response.ok) {
          const data = await response.json()
          setIndexStatus(data)

          // Auto-trigger indexing if there are pending notes
          if (data.pending > 0) {
            autoIndexNotes()
          }
        }
      } catch (error) {
        console.error('[Recall] Failed to check index status:', error)
      }
    }
    checkAndAutoIndex()
  }, [])

  // Auto-index notes silently in background
  const autoIndexNotes = async () => {
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
        setIndexStatus(prev => ({
          indexed: (prev?.total || 0) - data.remaining,
          pending: data.remaining,
          total: prev?.total || 0
        }))

        // Continue if more notes need indexing
        if (data.remaining > 0) {
          setTimeout(autoIndexNotes, 500)
        } else {
          setIsIndexing(false)
        }
      } else {
        setIsIndexing(false)
      }
    } catch (error) {
      console.error('[Recall] Auto-indexing error:', error)
      setIsIndexing(false)
    }
  }

  // Persist chat to sessionStorage so it survives navigation
  useEffect(() => {
    const nonLoading = messages.filter(m => !m.isLoading)
    if (nonLoading.length > 0) {
      sessionStorage.setItem('recall_messages', JSON.stringify(nonLoading))
    }
  }, [messages])

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

      // Handle special flags from response
      if (data.setupRequired) setSetupRequired(true)

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
    sessionStorage.removeItem('recall_messages')
  }

  // Navigate to note in same tab — chat is preserved via sessionStorage
  const handleOpenNote = (noteId: string) => {
    router.push(`/dashboard/notes/${noteId}`)
  }

  // Render message content with citations
  const renderMessageContent = (message: Message) => {
    if (message.isLoading) {
      return (
        <div className="flex items-center gap-3 py-1">
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-[#BD6750]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="h-2 w-2 rounded-full bg-[#BD6750]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="h-2 w-2 rounded-full bg-[#BD6750]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-gray-400">Searching your notes...</span>
        </div>
      )
    }

    if (message.isError) {
      return (
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{message.content}</span>
        </div>
      )
    }

    const content = message.content
    const citations = message.citations || []

    // Replace citation markers [1], [2] with clickable badges that navigate to the note
    const renderWithCitations = (text: string) => {
      const parts = text.split(/(\[\d+\])/)
      return parts.map((part, idx) => {
        const match = part.match(/\[(\d+)\]/)
        if (match) {
          const citationIndex = parseInt(match[1]) - 1
          const citation = citations[citationIndex]
          if (citation) {
            return (
              <button
                key={idx}
                onClick={() => handleOpenNote(citation.noteId)}
                title={`Open: ${citation.noteTitle}`}
                className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded text-[11px] font-semibold transition-all mx-0.5 align-middle leading-none bg-[#BD6750]/10 text-[#BD6750] hover:bg-[#BD6750] hover:text-white cursor-pointer"
              >
                {match[1]}
              </button>
            )
          }
        }
        return <span key={idx}>{part}</span>
      })
    }

    // Process React children from ReactMarkdown - handles strings, arrays, and React nodes
    const processChildren = (children: React.ReactNode): React.ReactNode => {
      if (children === null || children === undefined) return null
      if (typeof children === 'string') {
        return <>{renderWithCitations(children)}</>
      }
      if (typeof children === 'number') return <>{String(children)}</>
      if (Array.isArray(children)) {
        return children.map((child, i) => (
          <React.Fragment key={i}>
            {typeof child === 'string' ? renderWithCitations(child) : child}
          </React.Fragment>
        ))
      }
      return children
    }

    return (
      <div className="space-y-3">
        {/* Main content with markdown and inline citations */}
        <div className="text-[14px] text-gray-700 leading-relaxed prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-strong:text-gray-900 prose-headings:text-gray-900">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="my-1.5">{processChildren(children)}</p>,
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{processChildren(children)}</strong>,
              em: ({ children }) => <em className="italic">{processChildren(children)}</em>,
              ul: ({ children }) => <ul className="list-disc list-inside my-1.5 space-y-0.5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside my-1.5 space-y-0.5">{children}</ol>,
              li: ({ children }) => <li className="text-gray-700">{processChildren(children)}</li>,
              a: ({ href, children }) => <a href={href} className="text-[#BD6750] hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {/* Source pills - click navigates to note */}
        {citations.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            {citations.map(citation => (
              <button
                key={citation.id}
                onClick={() => handleOpenNote(citation.noteId)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100/80 hover:bg-gray-200/80 transition-colors text-xs group"
              >
                <FileText className="h-3 w-3 text-gray-400" />
                <span className="text-gray-600 truncate max-w-[140px]">
                  {citation.noteTitle}
                </span>
                <ExternalLink className="h-2.5 w-2.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const hasMessages = messages.length > 0

  return (
    <div className="h-full flex flex-col">
      {/* Filter Bar */}
      <FilterBar
        avatarUrl={profile?.avatar_url}
        displayName={profile?.display_name}
        email={profile?.email}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Recall</h1>
          {isIndexing && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Indexing notes...</span>
            </div>
          )}
        </div>
        {hasMessages && (
          <button
            onClick={handleClearConversation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            New chat
          </button>
        )}
      </div>

      {/* Setup Required Banner */}
      {setupRequired && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200/60 rounded-xl flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm text-amber-800">Setup Required</p>
            <p className="text-xs text-amber-600 mt-0.5">The AI search feature needs database configuration. Please contact support or check the setup guide.</p>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {!hasMessages ? (
          /* Empty State - centered content with suggestions above input */
          <div className="flex-1 flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center mb-8"
            >
              <div className="h-12 w-12 rounded-2xl bg-[#BD6750]/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-[#BD6750]" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-1">
                What would you like to recall?
              </h2>
              <p className="text-sm text-gray-400 max-w-sm">
                Ask anything about your notes and I&apos;ll find it with citations.
              </p>
            </motion.div>

            {/* Suggestion Cards */}
            <div className="w-full max-w-xl px-4 mb-8">
              <div className="grid grid-cols-2 gap-2.5">
                {EXAMPLE_QUESTIONS.map((question, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + index * 0.05, duration: 0.3 }}
                    onClick={() => handleSubmit(question.text)}
                    className="text-left px-4 py-3 rounded-xl border border-gray-200/80 hover:border-gray-300 hover:bg-gray-50/50 transition-all group"
                  >
                    <span className="text-[11px] font-medium text-[#BD6750]/70 uppercase tracking-wider">
                      {question.label}
                    </span>
                    <p className="text-sm text-gray-600 group-hover:text-gray-800 mt-1 leading-snug">
                      {question.text}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Conversation Messages */
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto pb-4 space-y-5 min-h-0"
          >
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                {message.role === 'user' ? (
                  /* User message - right aligned, minimal */
                  <div className="flex justify-end">
                    <div className="max-w-[75%] bg-gray-900 text-white rounded-2xl rounded-br-md px-4 py-2.5">
                      <p className="text-[14px] leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ) : (
                  /* Assistant message - full width, no bubble */
                  <div className="flex gap-3">
                    <div className="h-7 w-7 rounded-lg bg-[#BD6750]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageCircle className="h-3.5 w-3.5 text-[#BD6750]" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      {renderMessageContent(message)}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Inline input for empty state */}
        {!hasMessages && (
          <div className="flex-shrink-0 pb-2 pt-3">
            <div className="relative max-w-3xl mx-auto w-full">
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm focus-within:border-[#BD6750]/40 focus-within:shadow-md focus-within:shadow-[#BD6750]/5 transition-all duration-300 flex items-end">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your notes..."
                  rows={1}
                  disabled={isLoading}
                  className="flex-1 resize-none pl-4 pr-12 py-3 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-50 text-sm bg-transparent leading-6"
                  style={{ maxHeight: '150px' }}
                />
                <button
                  onClick={() => handleSubmit()}
                  disabled={!inputValue.trim() || isLoading}
                  className={cn(
                    "absolute right-2.5 bottom-2 h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                    inputValue.trim() && !isLoading
                      ? "bg-[#BD6750] text-white hover:bg-[#a85744]"
                      : "text-gray-300"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-gray-300 text-center mt-2">
                Enter to send · Shift + Enter for new line
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom input bar - matches Tap to Record position */}
      {hasMessages && (
        <div
          className="fixed bottom-6 z-50 transition-[left] duration-200 flex justify-center px-6"
          style={{ left: sidebarWidth, right: 0 }}
        >
          {/* Gradient fade */}
          <div className="absolute -top-12 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />

          <div className="w-full max-w-3xl">
            <div
              className="relative bg-white rounded-2xl transition-all duration-300 flex items-end border border-[#BD6750]/30 shadow-[0_0_25px_rgba(189,103,80,0.15),0_0_50px_rgba(189,103,80,0.09)] focus-within:shadow-[0_0_30px_rgba(189,103,80,0.27),0_0_60px_rgba(189,103,80,0.15)] focus-within:border-[#BD6750]/50"
            >
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your notes..."
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none pl-4 pr-12 py-3 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-50 text-sm bg-transparent leading-6"
                style={{ maxHeight: '150px' }}
              />
              <button
                onClick={() => handleSubmit()}
                disabled={!inputValue.trim() || isLoading}
                className={cn(
                  "absolute right-2.5 bottom-2 h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                  inputValue.trim() && !isLoading
                    ? "bg-[#BD6750] text-white hover:bg-[#a85744]"
                    : "text-gray-300"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
