'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  const faqs = [
    {
      question: 'How does FounderNote work?',
      answer: 'Simply tap to record and speak your thoughts. Our AI transcribes in real-time with 95%+ accuracy, then automatically categorizes your content into notes, tasks, meetings, and more. From there, you can export to emails, social posts, or action items with one click.'
    },
    {
      question: 'Who is FounderNote for?',
      answer: 'FounderNote is built for founders, executives, and professionals who think faster than they type. If you\'re constantly capturing ideas, managing tasks, and need to stay organized, FounderNote helps you do it all through voice—without slowing down.'
    },
    {
      question: 'Is there a free plan?',
      answer: 'Yes! Our Starter plan is completely free and includes 5 voice notes per day, basic AI categorization, and email formatting. Perfect for trying FounderNote and experiencing voice-first productivity.'
    },
    {
      question: 'What languages are supported?',
      answer: 'We support 31+ languages including English, Spanish, French, German, Chinese, Japanese, Portuguese, Korean, and many more. Our AI automatically detects your language and handles accents with industry-leading accuracy.'
    },
    {
      question: 'How does the AI analysis work?',
      answer: 'Our AI analyzes your voice notes to extract key insights, action items, and summaries. It also powers our Ask feature—semantic search that lets you ask questions about your notes and get instant, relevant answers from your personal knowledge base.'
    }
  ]

  return (
    <section ref={sectionRef} className="py-24 px-6 warm-cream-tint">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-display text-gray-900 mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg md:text-xl text-gray-500 font-body">
            Everything you need to know about FounderNote.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <button
                className="w-full px-6 py-6 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-xl font-body font-medium text-gray-900 pr-4 leading-snug">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-6 text-gray-600 leading-relaxed font-body text-base border-t border-gray-50 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
