import type { ApiError } from '@/lib/api'

/** An error in plain words with the one thing to do next. */
export function ErrorPanel({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-[16px] bg-surface-1 p-6">
      <h2 className="text-title-3 font-medium">{error.code === 'api_unreachable' ? 'The server is waking up' : "That didn't load"}</h2>
      <p className="text-ink-2">{error.message}</p>
      {onRetry && (
        <div>
          <button type="button" className="px-btn px-btn--sm" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
    </div>
  )
}

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <span aria-hidden style={style} className={`block rounded-[8px] ${className.includes('bg-') ? '' : 'bg-surface-3'} ${className}`} />
}
