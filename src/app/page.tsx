'use client'
// REPLACES: src/app/page.tsx

import { useState } from 'react'
import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import ProductShowcase from '@/components/landing/ProductShowcase'
import LogoStrip from '@/components/landing/LogoStrip'
import FeaturesSection from '@/components/landing/FeaturesSection'
import AgentsSection from '@/components/landing/AgentsSection'
import KickstartSection from '@/components/landing/KickstartSection'
import BenchmarkSection from '@/components/landing/BenchmarkSection'
import PricingSection from '@/components/landing/PricingSection'
import FinalCTASection from '@/components/landing/FinalCTASection'
import Footer from '@/components/landing/Footer'
import WaitlistModal from '@/components/shared/WaitlistModal'
import DemoVideoModal from '@/components/shared/DemoVideoModal'

export default function LandingPage() {
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [demoVideoOpen, setDemoVideoOpen] = useState(false)

  return (
    <main className="relative bg-black min-h-screen">
      <Navbar onWaitlist={() => setWaitlistOpen(true)} />
      <HeroSection
        onWaitlist={() => setWaitlistOpen(true)}
        onWatchDemo={() => setDemoVideoOpen(true)}
      />
      <ProductShowcase />
      <LogoStrip />
      <FeaturesSection />
      <AgentsSection />
      <KickstartSection />
      <BenchmarkSection />
      <PricingSection onWaitlist={() => setWaitlistOpen(true)} />
      <FinalCTASection onWaitlist={() => setWaitlistOpen(true)} />
      <Footer onWatchDemo={() => setDemoVideoOpen(true)} />
      <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
      <DemoVideoModal open={demoVideoOpen} onClose={() => setDemoVideoOpen(false)} />
    </main>
  )
}
