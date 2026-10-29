export function Verdict({ verified, detail }: { verified: boolean; detail: string }) {
  return (
    <div className={`px-verdict ${verified ? 'px-verdict--ok' : 'px-verdict--revise'}`} role="status">
      {verified ? (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M12 7v6M12 17h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      )}
      <div>
        <div className="px-verdict-title">{verified ? 'Verified' : 'Needs revision'}</div>
        <p>{detail}</p>
      </div>
    </div>
  )
}
