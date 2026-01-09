'use client'

import Navigation from './navigation'
import Hero from './hero'
import FeatureBentoGrid from './feature-bento-grid'
import FeaturesSection from './features-section'
import HowItWorksSection from './how-it-works-section'
import StatsSection from './stats-section'
import FAQSection from './faq-section'
import CTASection from './cta-section'
import Footer from './footer'

export default function LandingPage() {
  return (
    <div className="bg-white min-h-screen">
      <Navigation />
      <Hero />
      <FeatureBentoGrid />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}

