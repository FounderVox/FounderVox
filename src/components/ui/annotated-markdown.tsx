'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

interface AnnotatedMarkdownProps {
  content: string
  className?: string
}

const annotationStyles = {
  person: 'bg-[#BD6750]/10 text-[#BD6750]',
  date: 'bg-blue-50 text-blue-700',
  money: 'bg-emerald-50 text-emerald-700',
  metric: 'bg-amber-50 text-amber-700',
}

function AnnotationHighlight({ category, children }: {
  category: 'person' | 'date' | 'money' | 'metric'
  children: string
}) {
  return (
    <span className={cn(
      'inline px-1.5 py-0.5 rounded text-sm font-medium',
      annotationStyles[category]
    )}>
      {children}
    </span>
  )
}

function parseAndRenderAnnotations(text: string): React.ReactNode[] {
  const regex = /\[\[(person|date|money|metric):([^\]]+)\]\]/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    // Add the highlighted annotation
    const [, category, content] = match
    parts.push(
      <AnnotationHighlight
        key={match.index}
        category={category as 'person' | 'date' | 'money' | 'metric'}
      >
        {content}
      </AnnotationHighlight>
    )
    lastIndex = regex.lastIndex
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

// Process children recursively to find and render annotations in strings
function processChildren(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child, index) => {
    if (typeof child === 'string') {
      const parts = parseAndRenderAnnotations(child)
      return parts.length === 1 && typeof parts[0] === 'string'
        ? parts[0]
        : <React.Fragment key={index}>{parts}</React.Fragment>
    }
    return child
  })
}

export function AnnotatedMarkdown({ content, className }: AnnotatedMarkdownProps) {
  // Check if content has annotations
  const hasAnnotations = /\[\[(person|date|money|metric):[^\]]+\]\]/.test(content)

  if (!hasAnnotations) {
    // No annotations - use standard ReactMarkdown
    return (
      <div className={cn('prose prose-gray max-w-none', className)}>
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
            h2: ({ children }) => <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">{children}</h3>,
            ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    )
  }

  // Has annotations - custom render with highlighting
  return (
    <div className={cn('prose prose-gray max-w-none', className)}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="mb-3 leading-relaxed">{processChildren(children)}</p>
          ),
          li: ({ children }) => (
            <li className="mb-1">{processChildren(children)}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{processChildren(children)}</strong>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-3">{processChildren(children)}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">{processChildren(children)}</h3>
          ),
          ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
