'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Zap, Sparkles, MessageSquare, Code, Headphones, X } from 'lucide-react'
import Navigation from '@/components/landing/navigation'
import Footer from '@/components/landing/footer'

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      name: 'Starter',
      price: { monthly: 'Free', yearly: 'Free' },
      description: 'Perfect for trying out Founder Note.',
      features: [
        { text: '30 minutes audio/month', included: true, icon: null },
        { text: '10 notes', included: true, icon: null },
        { text: '1 language', included: true, icon: null },
        { text: '7-day history', included: true, icon: null },
        { text: 'Basic AI categorization', included: true, icon: null },
        { text: 'Email export only', included: true, icon: null },
        { text: 'AI Ask', included: false, icon: null },
        { text: 'Cross-Note AI', included: false, icon: null },
        { text: 'API access', included: false, icon: null },
      ],
      cta: 'Start Free',
      popular: false,
      support: 'Community'
    },
    {
      name: 'Pro',
      price: { monthly: '$19', yearly: '$17' },
      period: '/ month',
      description: 'For founders who capture ideas daily.',
      features: [
        { text: '300 minutes audio/month', included: true, icon: null },
        { text: 'Unlimited notes', included: true, icon: null },
        { text: '31+ languages', included: true, icon: null },
        { text: 'Unlimited history', included: true, icon: null },
        { text: 'Advanced AI categorization', included: true, icon: null },
        { text: 'All export formats', included: true, icon: null },
        { text: 'AI Ask', included: true, icon: <Zap className="w-3.5 h-3.5" /> },
        { text: 'Cross-Note AI', included: false, icon: null },
        { text: 'API access', included: false, icon: null },
      ],
      cta: 'Start Trial',
      popular: true,
      support: 'Priority'
    },
    {
      name: 'Plus',
      price: { monthly: '$29', yearly: '$26' },
      period: '/ month',
      description: 'Unlimited power for power users.',
      features: [
        { text: 'Unlimited audio', included: true, icon: null },
        { text: 'Unlimited notes', included: true, icon: null },
        { text: '31+ languages', included: true, icon: null },
        { text: 'Unlimited history', included: true, icon: null },
        { text: 'Advanced AI categorization', included: true, icon: null },
        { text: 'All export formats', included: true, icon: null },
        { text: 'AI Ask', included: true, icon: <Zap className="w-3.5 h-3.5" /> },
        { text: 'Cross-Note AI', included: true, icon: <Sparkles className="w-3.5 h-3.5" /> },
        { text: 'API access', included: true, icon: <Code className="w-3.5 h-3.5" /> },
      ],
      cta: 'Start Trial',
      popular: false,
      support: 'Premium'
    }
  ]

  const comparisonFeatures = [
    { feature: 'Audio Input', starter: '30 min/mo', pro: '300 min/mo', plus: 'Unlimited' },
    { feature: 'Notes', starter: '10', pro: 'Unlimited', plus: 'Unlimited' },
    { feature: 'Languages', starter: '1', pro: '31+', plus: '31+' },
    { feature: 'History', starter: '7 days', pro: 'Unlimited', plus: 'Unlimited' },
    { feature: 'AI Categorization', starter: 'Basic', pro: 'Advanced', plus: 'Advanced' },
    { feature: 'Export Formats', starter: 'Email only', pro: 'All formats', plus: 'All formats' },
    { feature: 'AI Ask', starter: false, pro: true, plus: true },
    { feature: 'Cross-Note AI', starter: false, pro: false, plus: true },
    { feature: 'Future Integrations', starter: false, pro: false, plus: true },
    { feature: 'API Access', starter: false, pro: false, plus: true },
    { feature: 'Support', starter: 'Community', pro: 'Priority', plus: 'Premium' },
  ]

  return (
    <div className="bg-white min-h-screen">
      <Navigation />

      {/* Hero Section with Warm Gradient */}
      <section className="relative min-h-screen pt-28 pb-24 px-6 overflow-hidden">
        {/* Warm cream gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FDF8F4] via-[#FAF6F1] to-white" />

        {/* Grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-display text-[#1a1a1a] mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg md:text-xl text-[#666] font-body max-w-2xl mx-auto">
              Start free, upgrade when you&apos;re ready. No hidden fees.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div
            className="flex justify-center items-center gap-4 mb-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className={`text-sm font-medium font-body ${billingPeriod === 'monthly' ? 'text-[#1a1a1a]' : 'text-[#999]'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-14 h-7 rounded-full transition-colors duration-300"
              style={{ backgroundColor: billingPeriod === 'yearly' ? '#BD6750' : '#e5e5e5' }}
            >
              <motion.div
                animate={{ x: billingPeriod === 'yearly' ? 28 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
              />
            </button>
            <span className={`text-sm font-medium font-body ${billingPeriod === 'yearly' ? 'text-[#1a1a1a]' : 'text-[#999]'}`}>
              Yearly <span className="text-[#BD6750] font-semibold">-10%</span>
            </span>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 * index }}
                className={`relative rounded-3xl p-8 ${
                  plan.popular
                    ? 'text-white shadow-2xl'
                    : 'bg-white shadow-xl border border-[#f0ebe6]'
                }`}
                style={plan.popular ? {
                  background: 'linear-gradient(135deg, #BD6750 0%, #a85845 100%)',
                } : {}}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-white text-[#BD6750] text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg font-body">
                      Most Popular
                    </div>
                  </div>
                )}

                <h3 className="text-2xl font-display mb-1">{plan.name}</h3>
                <p className={`text-sm mb-6 font-body ${plan.popular ? 'text-white/70' : 'text-[#888]'}`}>
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className="text-5xl font-display">{plan.price[billingPeriod]}</span>
                  {plan.period && (
                    <span className={`font-body ${plan.popular ? 'text-white/70' : 'text-[#888]'}`}>{plan.period}</span>
                  )}
                </div>

                <Link
                  href="/login"
                  className={`w-full py-3.5 rounded-xl font-semibold mb-8 transition-all duration-300 flex items-center justify-center font-body ${
                    plan.popular
                      ? 'bg-white text-[#BD6750] hover:bg-white/90 shadow-lg'
                      : 'text-white hover:opacity-90 shadow-lg'
                  }`}
                  style={!plan.popular ? {
                    backgroundColor: '#BD6750',
                    boxShadow: '0 4px 20px rgba(189, 103, 80, 0.3)'
                  } : {}}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      {feature.included ? (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          plan.popular ? 'bg-white/20' : 'bg-[#BD6750]/10'
                        }`}>
                          {feature.icon || <Check className={`w-3 h-3 ${plan.popular ? 'text-white' : 'text-[#BD6750]'}`} />}
                          {feature.icon && <span className={plan.popular ? 'text-white' : 'text-[#BD6750]'}>{feature.icon}</span>}
                        </div>
                      ) : (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          plan.popular ? 'bg-white/10' : 'bg-gray-100'
                        }`}>
                          <X className={`w-3 h-3 ${plan.popular ? 'text-white/40' : 'text-gray-300'}`} />
                        </div>
                      )}
                      <span className={`text-sm font-body ${
                        feature.included
                          ? (plan.popular ? 'text-white' : 'text-[#444]')
                          : (plan.popular ? 'text-white/40' : 'text-gray-400')
                      }`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className={`mt-6 pt-4 border-t ${plan.popular ? 'border-white/20' : 'border-[#f0ebe6]'}`}>
                  <div className="flex items-center gap-2">
                    <Headphones className={`w-4 h-4 ${plan.popular ? 'text-white/70' : 'text-[#888]'}`} />
                    <span className={`text-sm font-body ${plan.popular ? 'text-white/70' : 'text-[#888]'}`}>
                      {plan.support} support
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <motion.div
            className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#f0ebe6]"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="p-8 border-b border-[#f0ebe6]">
              <h2 className="text-2xl font-display text-[#1a1a1a]">Compare all features</h2>
              <p className="text-[#888] font-body mt-1">Find the perfect plan for your needs</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f0ebe6]">
                    <th className="text-left p-6 font-display text-[#666] text-lg">Feature</th>
                    <th className="p-6 font-display text-lg text-[#1a1a1a]">Starter</th>
                    <th className="p-6 font-display text-lg" style={{ backgroundColor: 'rgba(189, 103, 80, 0.1)' }}>
                      <span className="text-[#BD6750]">Pro</span>
                    </th>
                    <th className="p-6 font-display text-lg text-[#1a1a1a]">Plus</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, i) => (
                    <tr key={i} className="border-b border-[#f8f5f2] last:border-0">
                      <td className="p-6 text-[#444] font-body text-base">{row.feature}</td>
                      <td className="p-6 text-center font-body text-base">
                        {typeof row.starter === 'boolean'
                          ? row.starter
                            ? <Check className="w-5 h-5 mx-auto text-[#BD6750]" />
                            : <span className="text-gray-300">—</span>
                          : <span className="text-[#666]">{row.starter}</span>}
                      </td>
                      <td className="p-6 text-center font-body text-base" style={{ backgroundColor: 'rgba(189, 103, 80, 0.05)' }}>
                        {typeof row.pro === 'boolean'
                          ? row.pro
                            ? <Check className="w-5 h-5 mx-auto text-[#BD6750]" />
                            : <span className="text-gray-300">—</span>
                          : <span className="text-[#666] font-medium">{row.pro}</span>}
                      </td>
                      <td className="p-6 text-center font-body text-base">
                        {typeof row.plus === 'boolean'
                          ? row.plus
                            ? <Check className="w-5 h-5 mx-auto text-[#BD6750]" />
                            : <span className="text-gray-300">—</span>
                          : <span className="text-[#666]">{row.plus}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* FAQ CTA */}
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[#888] font-body mb-4">Have questions?</p>
            <Link
              href="/#faq"
              className="inline-flex items-center gap-2 text-[#BD6750] font-semibold font-body hover:underline"
            >
              <MessageSquare className="w-4 h-4" />
              Check our FAQ
            </Link>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
