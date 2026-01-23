'use client'

import { motion } from 'framer-motion'
import { Mail, MessageCircle, Clock } from 'lucide-react'
import Navigation from '@/components/landing/navigation'
import Footer from '@/components/landing/footer'

export default function ContactPage() {
  return (
    <div className="bg-white min-h-screen">
      <Navigation />

      {/* Hero Section */}
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

        <div className="relative max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-display text-[#1a1a1a] mb-6">
              Get in Touch
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-[#666] font-body max-w-2xl mx-auto">
              We&apos;d love to hear from you. Whether you have a question, feedback, or just want to say hello — reach out anytime.
            </p>
          </motion.div>

          {/* Contact Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-[#f0ebe6]"
          >
            <div className="text-center mb-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(189, 103, 80, 0.15) 0%, rgba(189, 103, 80, 0.25) 100%)',
                }}
              >
                <Mail className="w-7 h-7" style={{ color: '#BD6750' }} />
              </div>
              <h2 className="text-2xl font-display text-[#1a1a1a] mb-3">Email Us</h2>
              <p className="text-[#666] font-body mb-6">
                Drop us a line and we&apos;ll get back to you as soon as possible.
              </p>
              <a
                href="mailto:foundervox.workplace@gmail.com"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white font-body text-base transition-all duration-300 hover:opacity-90"
                style={{
                  backgroundColor: '#BD6750',
                  boxShadow: '0 4px 20px rgba(189, 103, 80, 0.3)'
                }}
              >
                <Mail className="w-5 h-5" />
                foundervox.workplace@gmail.com
              </a>
            </div>

            <div className="border-t border-[#f0ebe6] pt-8 mt-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#BD6750]/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-[#BD6750]" />
                  </div>
                  <div>
                    <h3 className="font-display text-[#1a1a1a] mb-1">Feedback Welcome</h3>
                    <p className="text-sm text-[#666] font-body">
                      We&apos;re always looking for ways to improve. Share your thoughts and suggestions with us.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#BD6750]/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[#BD6750]" />
                  </div>
                  <div>
                    <h3 className="font-display text-[#1a1a1a] mb-1">Quick Response</h3>
                    <p className="text-sm text-[#666] font-body">
                      We typically respond within 24-48 hours during business days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Additional Info */}
          <motion.p
            className="text-center text-[#999] font-body text-sm mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            We&apos;re a small team of three developers building Founder Notes with care. Every message matters to us.
          </motion.p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
