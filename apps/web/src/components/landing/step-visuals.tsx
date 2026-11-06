// Small moving pictures for the four step cards. Each one replays when its card becomes the active step
// (CSS keyed off the card's data-on), and rests on its finished frame otherwise or with reduced motion.

const SPEC = [78, 64, 86, 52]

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="lp-vis relative h-[168px] w-full overflow-hidden rounded-[14px] bg-surface-2 p-4"
    >
      {children}
    </div>
  )
}

function SpecLines({ marks = false }: { marks?: boolean }) {
  const critics: Record<number, string[]> = { 1: ['--critic-architect'], 2: ['--critic-architect', '--critic-security'] }
  return (
    <div className="flex flex-col gap-2">
      {SPEC.map((width, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <span className="w-3 font-mono text-[10px] text-ink-3">{i + 1}</span>
          <span
            className={`h-2 rounded-full ${marks && critics[i] ? 'bg-ink-3' : 'bg-ink-4'} ${marks ? '' : 'lp-write'}`}
            style={{ width: `${width}%`, animationDelay: `${0.15 + i * 0.22}s` }}
          />
          {marks &&
            critics[i]?.map((color, j) => (
              <span
                key={color}
                className="lp-pop size-2.5 flex-none rounded-full"
                style={{ background: `var(${color})`, animationDelay: `${0.4 + i * 0.35 + j * 0.2}s` }}
              />
            ))}
        </div>
      ))}
    </div>
  )
}

export function PlanVisual() {
  return (
    <Frame label="A spec being written, one numbered item at a time">
      <span className="lp-fade mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-surface-3 px-2 py-0.5 font-mono text-[10px] text-ink-2">
        read 5 files
      </span>
      <SpecLines />
    </Frame>
  )
}

export function ReviewVisual() {
  return (
    <Frame label="Three critics marking the spec items they object to">
      <div className="mb-3 flex gap-1.5">
        {['--critic-architect', '--critic-security', '--critic-ux'].map((color, i) => (
          <span
            key={color}
            className="lp-scan h-1 flex-1 rounded-full"
            style={{ background: `var(${color})`, animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <SpecLines marks />
    </Frame>
  )
}

export function ResolveVisual() {
  return (
    <Frame label="Two critics' positions coming together into one decision">
      <div className="relative h-full">
        <div
          className="lp-left absolute top-0 left-0 w-[46%] rounded-[10px] bg-surface-3 p-2"
          style={{ boxShadow: 'inset 3px 0 0 var(--critic-architect)' }}
        >
          <span className="block h-1.5 w-4/5 rounded-full bg-ink-4" />
          <span className="mt-1.5 block h-1.5 w-3/5 rounded-full bg-ink-4" />
        </div>
        <div
          className="lp-right absolute top-0 right-0 w-[46%] rounded-[10px] bg-surface-3 p-2"
          style={{ boxShadow: 'inset 3px 0 0 var(--critic-security)' }}
        >
          <span className="block h-1.5 w-4/5 rounded-full bg-ink-4" />
          <span className="mt-1.5 block h-1.5 w-2/3 rounded-full bg-ink-4" />
        </div>
        <div className="lp-decide absolute inset-x-[12%] bottom-0 rounded-[10px] bg-oxblood-wash p-2.5">
          <span className="font-sans text-[10px] font-medium tracking-[0.02em] text-oxblood-text">Decision</span>
          <span className="mt-1.5 block h-1.5 w-11/12 rounded-full bg-[color-mix(in_srgb,var(--oxblood-text)_45%,transparent)]" />
        </div>
      </div>
    </Frame>
  )
}

const DIFF: ['add' | 'rem' | 'same', number][] = [
  ['same', 62],
  ['rem', 50],
  ['add', 72],
  ['add', 58],
]

export function BuildVisual() {
  return (
    <Frame label="A diff being written, then checked off against the spec">
      <div className="flex flex-col gap-1.5 pr-1">
        {DIFF.map(([kind, width], i) => (
          <div
            key={i}
            className="lp-line flex items-center gap-2 rounded-[4px] px-1.5 py-1"
            style={{
              animationDelay: `${0.1 + i * 0.18}s`,
              background: kind === 'add' ? 'var(--diff-add-bg)' : kind === 'rem' ? 'var(--diff-remove-bg)' : 'transparent',
            }}
          >
            <span className="w-2 font-mono text-[10px] text-ink-3">{kind === 'add' ? '+' : kind === 'rem' ? '−' : ''}</span>
            <span className="h-1.5 rounded-full bg-ink-4" style={{ width: `${width}%` }} />
          </div>
        ))}
      </div>
      <span className="lp-check absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--success)_16%,var(--surface-3))] px-2 py-1 text-[11px] font-medium text-success">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        Verified
      </span>
    </Frame>
  )
}
