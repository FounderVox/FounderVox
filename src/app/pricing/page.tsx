'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Monitor, Smartphone, Check } from 'lucide-react'
import Navigation from '@/components/landing/navigation'
import Footer from '@/components/landing/footer'

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [platform, setPlatform] = useState('desktop')

  const desktopPlans = [
    {
      name: 'Starter',
      price: { monthly: 'Free', yearly: 'Free' },
      description: 'Essential features to get started.',
      features: [
        '5 voice notes per day',
        'Basic AI categorization',
        'Email formatting',
        'Single language',
        '7-day history'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Pro',
      price: { monthly: '$19', yearly: '$15' },
      period: '/ month',
      description: 'Unlimited power for individuals.',
      features: [
        'Unlimited voice notes',
        'Advanced AI organization',
        'All export formats',
        '12+ languages',
        'Unlimited history',
        'Task collaboration',
        'Desktop shortcuts',
        'Priority support'
      ],
      cta: 'Start Trial',
      popular: true
    },
    {
      name: 'Team',
      price: { monthly: '$49', yearly: '$39' },
      period: '/ month',
      description: 'For teams that move together.',
      features: [
        'Everything in Pro',
        'Unlimited members',
        'Shared workspaces',
        'Team analytics',
        'Admin controls',
        'API access',
        'SSO integration',
        'Dedicated support'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ]

  const mobilePlans = [
    {
      name: 'Starter',
      price: { monthly: 'Free', yearly: 'Free' },
      description: 'Capture ideas on the go.',
      features: [
        '3 voice notes per day',
        'Basic transcription',
        'Notes sync',
        'Single language',
        '3-day history'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Pro',
      price: { monthly: '$9', yearly: '$7' },
      period: '/ month',
      description: 'Full mobile experience.',
      features: [
        'Unlimited voice notes',
        'Offline recording',
        'Quick capture widget',
        '12+ languages',
        'Unlimited history',
        'Apple Watch app',
        'Siri shortcuts',
        'Priority support'
      ],
      cta: 'Start Trial',
      popular: true
    },
    {
      name: 'Pro + Desktop',
      price: { monthly: '$24', yearly: '$19' },
      period: '/ month',
      description: 'Mobile + Desktop bundle.',
      features: [
        'Everything in Mobile Pro',
        'Full desktop access',
        'Cross-device sync',
        'Team collaboration',
        'All export formats',
        'Desktop shortcuts',
        'API access',
        'Priority support'
      ],
      cta: 'Start Trial',
      popular: false
    }
  ]

  const plans = platform === 'desktop' ? desktopPlans : mobilePlans

  return (
    <div className="bg-white min-h-screen">
      <Navigation />
      <section className="min-h-screen pt-28 pb-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-black mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-gray-600">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </div>

          {/* Platform Toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
              <button
                onClick={() => setPlatform('desktop')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  platform === 'desktop' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                <Monitor className="w-4 h-4" />
                Desktop
              </button>
              <button
                onClick={() => setPlatform('mobile')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  platform === 'mobile' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Mobile
              </button>
            </div>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center items-center gap-3 mb-12">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-black' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                billingPeriod === 'yearly' ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <motion.div
                animate={{ x: billingPeriod === 'yearly' ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
              />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-black' : 'text-gray-400'}`}>
              Yearly <span className="text-green-600 font-medium">-20%</span>
            </span>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl p-6 md:p-8 card-hover ${
                  plan.popular
                    ? 'bg-black text-white shadow-premium-xl'
                    : 'bg-white shadow-premium border border-gray-100'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-green-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-gray-400' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price[billingPeriod]}</span>
                  {plan.period && (
                    <span className={plan.popular ? 'text-gray-400' : 'text-gray-500'}>{plan.period}</span>
                  )}
                </div>

                <Link
                  href="/login"
                  className={`w-full py-3 rounded-xl font-medium mb-6 transition-all duration-200 flex items-center justify-center ${
                    plan.popular
                      ? 'bg-white text-black hover:bg-gray-100'
                      : 'text-white hover:opacity-90'
                  }`}
                  style={!plan.popular ? { backgroundColor: '#BD6750' } : {}}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        plan.popular ? 'text-green-400' : 'text-green-600'
                      }`} />
                      <span className={`text-sm ${plan.popular ? 'text-gray-300' : 'text-gray-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Feature Comparison */}
          <div className="bg-white rounded-2xl shadow-premium overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-black">Compare all features</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-4 font-medium text-gray-500">Feature</th>
                    <th className="p-4 font-medium">Starter</th>
                    <th className="p-4 font-medium bg-gray-50">Pro</th>
                    <th className="p-4 font-medium">{platform === 'desktop' ? 'Team' : 'Pro + Desktop'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(platform === 'desktop' ? [
                    { feature: 'Voice notes', starter: '5/day', pro: 'Unlimited', team: 'Unlimited' },
                    { feature: 'Languages', starter: '1', pro: '12+', team: '12+' },
                    { feature: 'History', starter: '7 days', pro: 'Unlimited', team: 'Unlimited' },
                    { feature: 'Export formats', starter: 'Email', pro: 'All', team: 'All + API' },
                    { feature: 'Collaboration', starter: false, pro: true, team: true },
                    { feature: 'Support', starter: 'Community', pro: 'Priority', team: 'Dedicated' },
                  ] : [
                    { feature: 'Voice notes', starter: '3/day', pro: 'Unlimited', team: 'Unlimited' },
                    { feature: 'Languages', starter: '1', pro: '12+', team: '12+' },
                    { feature: 'History', starter: '3 days', pro: 'Unlimited', team: 'Unlimited' },
                    { feature: 'Offline mode', starter: false, pro: true, team: true },
                    { feature: 'Desktop access', starter: false, pro: false, team: true },
                    { feature: 'Support', starter: 'Community', pro: 'Priority', team: 'Priority' },
                  ]).map((row, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="p-4 text-gray-700">{row.feature}</td>
                      <td className="p-4 text-center">
                        {typeof row.starter === 'boolean' 
                          ? row.starter 
                            ? <Check className="w-4 h-4 mx-auto text-green-600" /> 
                            : <span className="text-gray-300">—</span>
                          : row.starter}
                      </td>
                      <td className="p-4 text-center bg-gray-50">
                        {typeof row.pro === 'boolean'
                          ? row.pro
                            ? <Check className="w-4 h-4 mx-auto text-green-600" />
                            : <span className="text-gray-300">—</span>
                          : row.pro}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.team === 'boolean'
                          ? row.team
                            ? <Check className="w-4 h-4 mx-auto text-green-600" />
                            : <span className="text-gray-300">—</span>
                          : row.team}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

