'use client'

import { Smartphone, Check } from 'lucide-react'
import Navigation from '@/components/landing/navigation'
import Footer from '@/components/landing/footer'

export default function DownloadPage() {
  return (
    <div className="bg-white min-h-screen">
      <Navigation />
      <section className="min-h-screen pt-28 pb-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold text-black mb-4">
              Get Founder Note
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Available on iOS. Access from any device via web.
            </p>
          </div>

          <div className="max-w-md mx-auto mb-12">
            {/* Mobile */}
            <div className="bg-white rounded-2xl p-8 shadow-premium border border-gray-100 text-center card-hover">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-7 h-7 text-black" />
              </div>
              <h2 className="text-xl font-semibold text-black mb-2">Mobile App</h2>
              <p className="text-gray-600 mb-6">Capture ideas on the go</p>
              
              <div className="space-y-3">
                <button className="w-full text-white px-6 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300" style={{ backgroundColor: '#BD6750' }}>
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Download for iOS
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-4">iOS 15+</p>
            </div>
          </div>

          {/* Features */}
          <div className="bg-black rounded-2xl p-8 text-white">
            <h3 className="text-lg font-semibold mb-6 text-center">Everything included</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'Real-time transcription',
                'AI categorization',
                'Multi-format export',
                'Task assignment',
                '12+ languages',
                'Cloud sync',
                'Offline mode',
                'Dark mode',
                'Keyboard shortcuts'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2.5 p-3 bg-white/[0.05] rounded-xl">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

