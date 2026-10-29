import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'

import { themeScript } from '@/lib/theme'

import './globals.css'

export const metadata: Metadata = {
  title: { default: 'PrismOS', template: '%s · PrismOS' },
  description:
    'Describe a feature for your GitHub repo. Three critics review the plan, real disagreements get settled, and you approve the pull request before it opens.',
  openGraph: { title: 'PrismOS', description: 'One request in. One reviewed pull request out.', type: 'website' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#141315' },
    { media: '(prefers-color-scheme: light)', color: '#f4f2ef' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
