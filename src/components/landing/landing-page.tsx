'use client'

import Navigation from './navigation'
import Hero from './hero'
import FeaturesSection from './features-section'
import HowItWorksSection from './how-it-works-section'
import StatsSection from './stats-section'
import FAQSection from './faq-section'
import CTASection from './cta-section'
import Footer from './footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen relative">
      {/* Grain texture overlay for editorial feel */}
      <div className="grain-overlay" />

      <Navigation />
      <Hero />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}
