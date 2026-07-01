'use client'
// src/app/page.tsx

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

export default function LandingPage() {
  const [waitlistOpen, setWaitlistOpen] = useState(false)

  return (
    <main className="relative bg-black min-h-screen">
      <Navbar onWaitlist={() => setWaitlistOpen(true)} />
      <HeroSection onWaitlist={() => setWaitlistOpen(true)} />
      <ProductShowcase />
      <LogoStrip />
      <FeaturesSection />
      <AgentsSection />
      <KickstartSection />
      <BenchmarkSection />
      <PricingSection onWaitlist={() => setWaitlistOpen(true)} />
      <FinalCTASection onWaitlist={() => setWaitlistOpen(true)} />
      <Footer />
      <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
    </main>
  )
}
