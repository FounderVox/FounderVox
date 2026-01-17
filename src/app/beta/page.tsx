'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Check,
  Sparkles,
  Mic,
  FileText,
  Clock,
  Globe,
  Zap,
  ArrowRight,
  Star,
  Shield,
  Users,
  Gift
} from 'lucide-react'
import Navigation from '@/components/landing/navigation'
import Footer from '@/components/landing/footer'

export default function BetaPage() {
  const [isHovered, setIsHovered] = useState(false)

  const features = [
    { text: '100 minutes audio/month', icon: <Clock className="w-4 h-4" /> },
    { text: '25 notes included', icon: <FileText className="w-4 h-4" /> },
    { text: '10+ languages supported', icon: <Globe className="w-4 h-4" /> },
    { text: 'Advanced AI categorization', icon: <Sparkles className="w-4 h-4" /> },
    { text: 'All export formats', icon: <Zap className="w-4 h-4" /> },
    { text: 'AI Ask feature', icon: <Mic className="w-4 h-4" /> },
    { text: 'Priority beta support', icon: <Shield className="w-4 h-4" /> },
    { text: 'Early access to new features', icon: <Gift className="w-4 h-4" /> },
  ]

  const betaPerks = [
    {
      icon: <Star className="w-6 h-6" />,
      title: 'Founding Member Status',
      description: 'Lock in beta pricing forever. Your rate stays the same even after launch.'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Direct Feedback Channel',
      description: 'Shape the product with direct access to our founding team.'
    },
    {
      icon: <Gift className="w-6 h-6" />,
      title: 'Exclusive Perks',
      description: 'Beta members get early access to all upcoming features and integrations.'
    }
  ]

  return (
    <div className="bg-white min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen pt-28 pb-24 px-6 overflow-hidden">
        {/* Warm cream gradient background with beta accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FDF8F4] via-[#FAF6F1] to-white" />

        {/* Subtle geometric pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23BD6750' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-[#BD6750]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-tl from-[#BD6750]/8 to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto">
          {/* Beta Badge */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#BD6750]/10 to-[#BD6750]/5 border border-[#BD6750]/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BD6750] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#BD6750]"></span>
              </span>
              <span className="text-sm font-semibold text-[#BD6750] font-body tracking-wide">
                LIMITED BETA ACCESS
              </span>
            </div>
          </motion.div>

          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-4xl md:text-6xl font-display text-[#1a1a1a] mb-4">
              Join the founding
              <br />
              <span className="text-[#BD6750]">circle of builders</span>
            </h1>
            <p className="text-lg md:text-xl text-[#666] font-body max-w-2xl mx-auto">
              Be among the first to experience FounderNote. Help shape the future of
              voice-powered productivity for founders.
            </p>
          </motion.div>

          {/* Main Pricing Card */}
          <motion.div
            className="max-w-lg mx-auto mb-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div
              className="relative rounded-[2rem] overflow-hidden"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Card background with gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#BD6750] via-[#c97a5d] to-[#a85842] rounded-[2rem]" />
              <div className="absolute inset-[1px] bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-[2rem]" />

              {/* Animated glow on hover */}
              <motion.div
                className="absolute inset-0 rounded-[2rem] opacity-0"
                animate={{ opacity: isHovered ? 0.3 : 0 }}
                style={{
                  background: 'radial-gradient(circle at 50% 50%, #BD6750, transparent 70%)',
                }}
              />

              <div className="relative p-10">
                {/* Beta tag */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BD6750]/20 border border-[#BD6750]/30 mb-6">
                  <Sparkles className="w-3.5 h-3.5 text-[#BD6750]" />
                  <span className="text-xs font-semibold text-[#BD6750] font-body uppercase tracking-wider">
                    Beta Tester Plan
                  </span>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-display text-white">29.99</span>
                    <span className="text-lg text-white/80 font-body">QAR / month</span>
                  </div>
                  <p className="text-white/60 font-body mt-2 text-sm">
                    Locked in forever as a founding member
                  </p>
                </div>

                {/* CTA Button */}
                <Link
                  href="/login"
                  className="group w-full py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 font-body bg-gradient-to-r from-[#BD6750] to-[#c97a5d] text-white hover:shadow-lg hover:shadow-[#BD6750]/30 mb-8"
                >
                  <span>Join the Beta</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>

                {/* Features List */}
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#BD6750]/20 text-[#BD6750]">
                        {feature.icon}
                      </div>
                      <span className="text-sm font-body text-white font-medium">
                        {feature.text}
                      </span>
                      <Check className="w-4 h-4 text-[#BD6750] ml-auto" />
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Beta Perks Section */}
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-display text-[#1a1a1a] text-center mb-12">
              Why join the beta?
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {betaPerks.map((perk, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 border border-[#f0ebe6] shadow-sm hover:shadow-lg hover:border-[#BD6750]/20 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#BD6750]/10 to-[#BD6750]/5 flex items-center justify-center text-[#BD6750] mb-4">
                    {perk.icon}
                  </div>
                  <h3 className="text-lg font-display text-[#1a1a1a] mb-2">{perk.title}</h3>
                  <p className="text-[#666] font-body text-sm leading-relaxed">{perk.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-6 px-8 py-4 rounded-2xl bg-white/50 border border-[#f0ebe6]">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#BD6750]" />
                <span className="text-sm font-body text-[#666]">Cancel anytime</span>
              </div>
              <div className="w-px h-4 bg-[#e5e5e5]" />
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#BD6750]" />
                <span className="text-sm font-body text-[#666]">Instant access</span>
              </div>
              <div className="w-px h-4 bg-[#e5e5e5]" />
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#BD6750]" />
                <span className="text-sm font-body text-[#666]">Limited spots</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section for Beta */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-[#fdfcfa]">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            className="text-3xl md:text-5xl font-display text-[#1a1a1a] text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Beta FAQ
          </motion.h2>

          <div className="space-y-6">
            {[
              {
                q: 'What happens after the beta ends?',
                a: 'Your beta pricing is locked in forever. When we launch publicly, prices will increase, but you keep your founding member rate.'
              },
              {
                q: 'Can I upgrade my limits later?',
                a: 'Yes! Beta members get priority access to our Pro and Plus plans at discounted rates when they become available.'
              },
              {
                q: 'How do I provide feedback?',
                a: 'As a beta member, you get direct access to our team through a private feedback channel. Your input directly shapes the product.'
              },
              {
                q: 'Is my data secure during beta?',
                a: 'Absolutely. We use the same enterprise-grade security as our production systems. Your voice notes and data are encrypted and private.'
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 border border-[#f0ebe6]"
              >
                <h3 className="text-lg font-display text-[#1a1a1a] mb-2">{faq.q}</h3>
                <p className="text-[#666] font-body leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
