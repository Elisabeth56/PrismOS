// src/components/landing/Footer.tsx

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
      { label: 'API reference', href: '#' },
      { label: 'Agent system prompts', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Privacy policy', href: '#' },
    ],
  },
  {
    title: 'Other pages',
    links: [
      { label: 'Dashboard (beta)', href: '/dashboard' },
      { label: 'Benchmark explorer', href: '#' },
      { label: 'Launching soon…', href: '#' },
    ],
  },
  {
    title: 'Social',
    links: [
      { label: 'X / Twitter', href: '#' },
      { label: 'GitHub', href: '#' },
      { label: 'LinkedIn', href: '#' },
      { label: 'Discord', href: '#' },
    ],
  },
]

export default function Footer() {
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
                    <a
                      href={link.href}
                      className="text-[13px] text-white/35 hover:text-white/70 transition-colors duration-200"
                    >
                      {link.label}
                    </a>
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
