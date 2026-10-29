import { diffLines } from 'diff'

type Action = 'create' | 'modify' | 'delete'
type Line = { kind: 'add' | 'rem' | 'same'; text: string }

const TAG: Record<Action, string> = { create: 'new', modify: 'modified', delete: 'deleted' }
const CONTEXT = 3

/** Lines of `before` → `after`, keeping only a few unchanged lines around each change. */
export function diffRows(before: string, after: string): (Line | { kind: 'gap' })[] {
  const lines: Line[] = []
  for (const part of diffLines(before, after)) {
    const kind = part.added ? 'add' : part.removed ? 'rem' : 'same'
    for (const text of part.value.replace(/\n$/, '').split('\n')) lines.push({ kind, text })
  }
  const keep = lines.map((line, i) =>
    lines.slice(Math.max(0, i - CONTEXT), i + CONTEXT + 1).some((near) => near.kind !== 'same'),
  )
  const rows: (Line | { kind: 'gap' })[] = []
  lines.forEach((line, i) => {
    if (keep[i]) rows.push(line)
    else if (rows.at(-1)?.kind !== 'gap') rows.push({ kind: 'gap' })
  })
  return rows
}

export function DiffFile({
  path,
  action,
  before = '',
  after = '',
}: {
  path: string
  action: Action
  before?: string
  after?: string
}) {
  const rows = diffRows(before, action === 'delete' ? '' : after)
  const added = rows.filter((r) => r.kind === 'add').length
  const removed = rows.filter((r) => r.kind === 'rem').length
  return (
    <section className="px-diff" aria-label={`${TAG[action]} ${path}`}>
      <div className="px-diff-head">
        <span className="px-diff-path">{path}</span>
        <span className="px-diff-tag">{TAG[action]}</span>
        <span className="px-diff-count">
          <span className="a">+{added}</span> <span className="r">−{removed}</span>
        </span>
      </div>
      <div className="px-diff-body">
        <pre>
          {rows.map((row, i) =>
            row.kind === 'gap' ? (
              <span key={i} className="px-diff-gap">
                ⋯
              </span>
            ) : (
              <span key={i} className={row.kind === 'same' ? undefined : row.kind}>
                {row.text || ' '}
              </span>
            ),
          )}
        </pre>
      </div>
    </section>
  )
}
