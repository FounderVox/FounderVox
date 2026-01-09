'use client'

import { ChevronRight } from 'lucide-react'

export default function HowItWorksSection() {
  const steps = [
    {
      number: '1',
      title: 'Start Recording',
      description: 'Tap the mic and speak naturally. Share your ideas, tasks, or notes as they come to you.'
    },
    {
      number: '2',
      title: 'AI Processes',
      description: 'Our AI transcribes, categorizes, and formats your voice into structured, actionable content.'
    },
    {
      number: '3',
      title: 'Take Action',
      description: 'Review organized notes, assign tasks, send emails, or share content—all from one recording.'
    }
  ]

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-black mb-4">
            Voice to action in 3 steps
          </h2>
          <p className="text-lg text-gray-600">
            The fastest way to capture and organize your thoughts.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative"
            >
              <div className="bg-gray-50 rounded-2xl p-8 h-full border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="w-14 h-14 text-white rounded-xl flex items-center justify-center text-2xl font-bold mb-6" style={{ backgroundColor: '#BD6750' }}>
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-black mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ChevronRight className="w-6 h-6 text-gray-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


