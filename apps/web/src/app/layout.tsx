// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Syne, Inter } from 'next/font/google'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', weight: ['700','800'] })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'PrismOS — Autonomous Feature Delivery',
  description:
    'PrismOS is an AI operating system that orchestrates 7 specialized agents to ship features into your existing product. Context-aware, conflict-resolving, production-ready.',
  keywords: ['AI agents', 'software delivery', 'autonomous engineering', 'Qwen', 'multi-agent'],
  openGraph: {
    title: 'PrismOS',
    description: 'Ship features with a full AI engineering team.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${syne.variable} ${inter.variable} font-sans bg-black text-white antialiased overflow-x-hidden`}>
        {children}
      </body>
    </html>
  )
}
