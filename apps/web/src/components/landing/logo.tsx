/** The prism mark: white light in, the three critic colours out. */
export function PrismMark({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path d="M12 3l9 16H3z" fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M15 12.5L22 10" stroke="var(--critic-architect)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15.6 14L22 14" stroke="var(--critic-security)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15.2 15.6L22 18" stroke="var(--critic-ux)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5 text-[18px] leading-6 font-semibold tracking-[-0.02em]">
      <PrismMark />
      PrismOS
    </span>
  )
}
