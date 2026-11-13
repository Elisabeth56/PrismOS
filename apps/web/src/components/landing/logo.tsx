import { useId } from 'react'

// a soft-cornered prism; the same path draws the favicon and the app icons (src/app/icon.svg, public/icons)
const PRISM = 'M13.27 4.87L20.73 18.13Q22 20.4 19.4 20.4L4.6 20.4Q2 20.4 3.27 18.13L10.73 4.87Q12 2.6 13.27 4.87Z'

/** The prism mark: the request at the top in ink, the three critics as the layers it passes through. */
export function PrismMark({ size = 22 }: { size?: number }) {
  const clip = useId()
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <clipPath id={clip}>
        <path d={PRISM} />
      </clipPath>
      {/* each layer runs to the bottom and the next covers it, so no seam shows between them */}
      <g clipPath={`url(#${clip})`}>
        <rect width="24" height="24" fill="var(--ink)" />
        <rect y="9.6" width="24" height="14.4" fill="#c4a574" />
        <rect y="13.7" width="24" height="10.3" fill="#8dae98" />
        <rect y="17.3" width="24" height="6.7" fill="#8399b5" />
      </g>
    </svg>
  )
}

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5 text-[18px] leading-6 font-semibold tracking-[-0.02em]">
      <PrismMark size={24} />
      PrismOS
    </span>
  )
}
