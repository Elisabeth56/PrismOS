// REPLACES: src/components/landing/Footer.tsx

const COLUMNS = [
  {
    title: 'Navigation',
    links: [
      { label: 'Home', href: '#' },
      { label: 'How it works', href: '#how' },
      { label: 'Agents', href: '#agents' },
      { label: 'Benchmark', href: '#benchmark' },
    ],
  },
  {
    title: 'Documentation',
    links: [
      { label: 'Architecture', href: '/architecture' },
      { label: 'API reference', href: '#' },
      { label: 'Agent system prompts', href: '#' },
      { label: 'Privacy policy', href: '#' },
    ],
  },
  {
    title: 'Demo',
    links: [
      { label: 'Try live demo', href: '/demo' },
      { label: 'Demo dashboard', href: '/demo/dashboard' },
      { label: 'Demo video', href: '#', videoTrigger: true },
    ],
  },
  {
    title: 'Social',
    links: [
      { label: 'GitHub', href: 'https://github.com', external: true },
      { label: 'X / Twitter', href: '#' },
      { label: 'LinkedIn', href: '#' },
      { label: 'Discord', href: '#' },
    ],
  },
]

interface FooterProps {
  onWatchDemo?: () => void
}

export default function Footer({ onWatchDemo }: FooterProps) {
  return (
    <footer className="relative bg-black border-t border-white/[0.06] px-6 pt-16 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-[13px] font-semibold text-white mb-4">{col.title}</div>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {'videoTrigger' in link && link.videoTrigger ? (
                      <button
                        onClick={onWatchDemo}
                        className="text-[13px] text-white/35 hover:text-white/70 transition-colors duration-200 text-left"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <a
                        href={link.href}
                        target={'external' in link && link.external ? '_blank' : undefined}
                        rel={'external' in link && link.external ? 'noopener noreferrer' : undefined}
                        className="text-[13px] text-white/35 hover:text-white/70 transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/[0.06] text-[12px] text-white/30">
          <span className="font-display text-[16px] font-bold text-white">
            Prism<span className="text-amber-400">OS</span>
          </span>
          <span>© 2025 PrismOS. Built for the Qwen Cloud Hackathon.</span>
        </div>
      </div>
    </footer>
  )
}
