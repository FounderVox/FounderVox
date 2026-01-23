'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Smartphone, Globe, Check, Mic, Zap, FileText, Globe2, Cloud, WifiOff, Watch, Sparkles } from 'lucide-react'
import Navigation from '@/components/landing/navigation'
import Footer from '@/components/landing/footer'

export default function DownloadPage() {
  const features = [
    { icon: <Mic className="w-6 h-6" />, title: 'Real-time Transcription', description: '95%+ accuracy with under 300ms latency' },
    { icon: <Zap className="w-6 h-6" />, title: 'AI Categorization', description: 'Auto-organize into meetings, ideas, tasks' },
    { icon: <FileText className="w-6 h-6" />, title: 'Multi-format Export', description: 'Emails, docs, social posts, action items' },
    { icon: <Globe2 className="w-6 h-6" />, title: '31+ Languages', description: 'Industry-leading multilingual support' },
    { icon: <Cloud className="w-6 h-6" />, title: 'Cloud Sync', description: 'Your notes, everywhere, always' },
    { icon: <WifiOff className="w-6 h-6" />, title: 'Offline Mode', description: 'Capture ideas without internet' },
  ]

  return (
    <div className="bg-white min-h-screen">
      <Navigation />

      {/* Hero Section with Warm Gradient */}
      <section className="relative pt-28 pb-20 px-6 overflow-hidden">
        {/* Warm cream gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FDF8F4] via-[#FAF6F1] to-white" />

        {/* Grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-5xl mx-auto">
          {/* Hero Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-[#1a1a1a] mb-6">
              Capture Ideas Anywhere
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-[#666] font-body max-w-2xl mx-auto">
              Available on iOS and web. Your ideas, perfectly synced.
            </p>
          </motion.div>

          {/* App Cards - Side by Side */}
          <div className="grid md:grid-cols-2 gap-6 mb-20">
            {/* Mobile App Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-[#f0ebe6] hover:shadow-2xl transition-shadow duration-300"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(189, 103, 80, 0.15) 0%, rgba(189, 103, 80, 0.25) 100%)',
                }}
              >
                <Smartphone className="w-7 h-7" style={{ color: '#BD6750' }} />
              </div>

              <h2 className="text-2xl font-display text-[#1a1a1a] mb-2">Mobile App</h2>
              <p className="text-[#666] font-body mb-6">Capture ideas on the go with our powerful mobile apps.</p>

              {/* iOS & Android Buttons - Side by Side */}
              <div className="flex gap-3 mb-6">
                <div
                  className="flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 text-white/80 font-body cursor-not-allowed text-sm"
                  style={{ backgroundColor: '#9CA3AF' }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  iOS
                </div>
                <div
                  className="flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 text-white/80 font-body cursor-not-allowed text-sm"
                  style={{ backgroundColor: '#9CA3AF' }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M17.6 11.4c0-.2 0-.4-.1-.6l1.4-1.4c.1-.1.2-.3.1-.5l-1.3-2.2c-.1-.2-.3-.2-.5-.2l-1.7.4c-.3-.2-.6-.4-1-.5L14 4.6c0-.2-.2-.3-.4-.3h-2.6c-.2 0-.4.1-.4.3l-.5 1.8c-.3.1-.6.3-1 .5l-1.7-.4c-.2 0-.4 0-.5.2L5.6 8.9c-.1.2-.1.4.1.5l1.4 1.4c0 .2-.1.4-.1.6s0 .4.1.6l-1.4 1.4c-.1.1-.2.3-.1.5l1.3 2.2c.1.2.3.2.5.2l1.7-.4c.3.2.6.4 1 .5l.5 1.8c0 .2.2.3.4.3h2.6c.2 0 .4-.1.4-.3l.5-1.8c.3-.1.6-.3 1-.5l1.7.4c.2 0 .4 0 .5-.2l1.3-2.2c.1-.2.1-.4-.1-.5l-1.4-1.4c.1-.2.1-.4.1-.6zm-5.6 2c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM7 20c0 .6.4 1 1 1h1v3c0 .6.4 1 1 1s1-.4 1-1v-3h2v3c0 .6.4 1 1 1s1-.4 1-1v-3h1c.6 0 1-.4 1-1v-7H7v7zM5 13c-.6 0-1 .4-1 1v5c0 .6.4 1 1 1s1-.4 1-1v-5c0-.6-.4-1-1-1zm14 0c-.6 0-1 .4-1 1v5c0 .6.4 1 1 1s1-.4 1-1v-5c0-.6-.4-1-1-1zM16.5 3.5l1-1.7c.1-.1 0-.3-.1-.4-.1-.1-.3-.1-.4.1l-1 1.7c-.8-.3-1.6-.5-2.5-.5s-1.7.2-2.5.5l-1-1.7c-.1-.1-.3-.2-.4-.1-.2 0-.2.2-.2.4l1 1.7C8.9 4.5 7.8 6.1 7.6 8h9.8c-.2-1.9-1.3-3.5-2.9-4.5zM10 6.5c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zm4 0c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5z"/>
                  </svg>
                  Android
                </div>
              </div>
              <p className="text-xs text-[#999] font-body text-center mb-6">Coming Soon</p>

              <div className="space-y-3">
                {[
                  { icon: <Mic className="w-4 h-4" />, text: 'One-tap voice capture for thoughts on the go' },
                  { icon: <Smartphone className="w-4 h-4" />, text: 'Handheld' },
                  { icon: <Sparkles className="w-4 h-4" />, text: 'Easy search through phone' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#BD6750]/10 flex items-center justify-center text-[#BD6750]">
                      {feature.icon}
                    </div>
                    <span className="text-sm text-[#444] font-body">{feature.text}</span>
                  </div>
                ))}
              </div>

            </motion.div>

            {/* Web App Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-[#f0ebe6] hover:shadow-2xl transition-shadow duration-300"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(189, 103, 80, 0.15) 0%, rgba(189, 103, 80, 0.25) 100%)',
                }}
              >
                <Globe className="w-7 h-7" style={{ color: '#BD6750' }} />
              </div>

              <h2 className="text-2xl font-display text-[#1a1a1a] mb-2">Web App</h2>
              <p className="text-[#666] font-body mb-6">Access your notes from any browser, anywhere.</p>

              <Link
                href="/login"
                className="w-full py-3.5 rounded-xl font-semibold mb-6 transition-all duration-300 flex items-center justify-center gap-2.5 text-white font-body"
                style={{
                  backgroundColor: '#BD6750',
                  boxShadow: '0 4px 20px rgba(189, 103, 80, 0.3)'
                }}
              >
                <Globe className="w-5 h-5" />
                Open Web App
              </Link>

              <div className="space-y-3">
                {[
                  { icon: <Zap className="w-4 h-4" />, text: 'Full dashboard access' },
                  { icon: <FileText className="w-4 h-4" />, text: 'All export formats' },
                  { icon: <Cloud className="w-4 h-4" />, text: 'Cross-device sync' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#BD6750]/10 flex items-center justify-center text-[#BD6750]">
                      {feature.icon}
                    </div>
                    <span className="text-sm text-[#444] font-body">{feature.text}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-[#999] font-body mt-6 text-center">Works on any modern browser</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Warm Charcoal */}
      <section className="py-24 px-6" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-display text-white mb-4">
              Everything included
            </h2>
            <p className="text-lg md:text-xl text-white/60 font-body max-w-2xl mx-auto">
              Powerful features on every platform
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: 0.08 * index }}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.05] transition-colors duration-300"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(189, 103, 80, 0.15)' }}
                  >
                    <div style={{ color: '#BD6750' }}>{feature.icon}</div>
                  </div>
                  <div>
                    <h3 className="text-white font-display text-lg mb-1">{feature.title}</h3>
                    <p className="text-white/60 font-body text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Warm cream gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FDF8F4] to-white" />

        {/* Grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <motion.div
          className="relative max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'rgba(189, 103, 80, 0.15)' }}
          >
            <Sparkles className="w-7 h-7" style={{ color: '#BD6750' }} />
          </div>

          <h2 className="text-3xl md:text-5xl font-display text-[#1a1a1a] mb-4">
            Start capturing ideas for free
          </h2>
          <p className="text-lg md:text-xl text-[#666] font-body mb-8 max-w-lg mx-auto">
            Join thousands of founders who trust Founder Notes to capture their best ideas.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white font-body text-base transition-all duration-300 hover:opacity-90"
            style={{
              backgroundColor: '#BD6750',
              boxShadow: '0 4px 20px rgba(189, 103, 80, 0.3)'
            }}
          >
            Get Started Free
            <Check className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
