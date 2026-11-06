import { CriticsBand } from '@/components/landing/critics-band'
import { DemoRun } from '@/components/landing/demo-run'
import { HeroCopy } from '@/components/landing/hero-copy'
import { PrismHero } from '@/components/landing/prism-hero'
import { FinalCta, Footer, Safety } from '@/components/landing/sections'
import { StartShortcut } from '@/components/landing/shortcut'
import { Steps } from '@/components/landing/steps'
import { FloatingStart, TopBar } from '@/components/landing/top-bar'

import '@/components/landing/landing.css'

export default function Landing() {
  return (
    <div className="overflow-x-hidden">
      <TopBar />
      <main>
        <section id="top" className="mx-auto flex max-w-[1240px] flex-col gap-2 pt-6 sm:gap-6 sm:px-6 sm:pt-14 lg:flex-row lg:items-center">
          <HeroCopy />
          <PrismHero />
        </section>
        <DemoRun />
        <Steps />
        <CriticsBand />
        <Safety />
        <FinalCta />
      </main>
      <Footer />
      <FloatingStart />
      <StartShortcut />
    </div>
  )
}
