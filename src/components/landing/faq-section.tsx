'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: 'How does Founder Note work?',
      answer: 'Simply tap to record and speak your thoughts. Our AI transcribes in real-time with 99% accuracy, then automatically categorizes your content into notes, tasks, meetings, and more. From there, you can export to emails, social posts, or action items with one click.'
    },
    {
      question: 'Who is Founder Note for?',
      answer: 'Founder Note is built for founders, executives, and professionals who think faster than they type. If you\'re constantly capturing ideas, managing tasks, and communicating with teams, Founder Note helps you do it all through voice.'
    },
    {
      question: 'Is there a free plan?',
      answer: 'Yes! Our Starter plan is completely free and includes 5 voice notes per day, basic AI categorization, and email formatting. Perfect for trying Founder Note and experiencing voice-first productivity.'
    },
    {
      question: 'What languages are supported?',
      answer: 'We support 12+ languages including English, Spanish, French, German, Chinese, Japanese, Portuguese, and more. Our AI automatically detects your language and handles accents with ease.'
    },
    {
      question: 'Can I collaborate with my team?',
      answer: 'Absolutely! With Pro and Team plans, assign tasks directly from voice notes, share organized notes with collaborators, and work in shared workspaces. Keep everyone aligned without extra meetings.'
    }
  ]

  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden"
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-base font-medium text-black pr-4">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-6 pb-5 text-gray-600 leading-relaxed">{faq.answer}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


