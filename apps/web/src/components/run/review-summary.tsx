import { CRITIC_NAMES, ConflictCard, DiffFile, Verdict } from '@/components/ui'
import type { Change, Conflict, Objection } from '@/lib/api'

export function Decisions({
  conflicts,
  notes,
  itemText,
}: {
  conflicts: Conflict[]
  notes: Objection[]
  itemText: (id: string) => string | undefined
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <h2 className="text-title-2 font-semibold">Decisions</h2>
      {conflicts.length === 0 && <p className="text-ink-2">The critics didn&apos;t disagree on anything, so nothing needed a ruling.</p>}
      {conflicts.map((conflict) => (
        <ConflictCard
          key={conflict.id}
          title={itemText(conflict.item_id) ?? `Spec item ${conflict.item_id}`}
          itemId={conflict.item_id}
          kind={conflict.kind}
          positions={conflict.objections.map((o) => ({ critic: o.critic, text: o.proposed_change }))}
          decision={conflict.ruling ? `${conflict.ruling} ${conflict.rationale ?? ''}`.trim() : null}
        />
      ))}
      {notes.length > 0 && (
        <div className="flex flex-col gap-2 rounded-[16px] bg-surface-1 p-4">
          <span className="text-[12px] leading-4 font-medium tracking-[0.02em] text-ink-3">Notes, not contested</span>
          {notes.map((note, i) => (
            <p key={i} className="text-ink-2">
              <span className="font-mono text-[12px]" style={{ color: `var(--critic-${note.critic})` }}>
                item {note.item_id} · {CRITIC_NAMES[note.critic]}
              </span>{' '}
              {note.proposed_change}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export function VerdictBlock({ verdict }: { verdict: { verdict: string; items_checked: string[]; failures: { item_id: string; problem: string }[] } | null }) {
  if (!verdict) return null
  return verdict.verdict === 'verified' ? (
    <Verdict verified detail={`Checked all ${verdict.items_checked.length} spec items against the changes.`} />
  ) : (
    <Verdict
      verified={false}
      detail={`Still flagged after one revision: ${verdict.failures.map((f) => `item ${f.item_id}, ${f.problem}`).join('; ')}`}
    />
  )
}

export function Changes({ changes, before }: { changes: Change[]; before: Record<string, string> }) {
  return (
    <section aria-labelledby="changes-h" className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="changes-h" className="text-title-2 font-semibold">
          Changes
        </h2>
        <span className="font-mono text-[12px] text-ink-3">
          {changes.length} file{changes.length === 1 ? '' : 's'}
        </span>
      </div>
      {changes.length === 0 && <p className="text-ink-2">The builder hasn&apos;t written any changes yet.</p>}
      {changes.map((change) => (
        <DiffFile key={change.path} path={change.path} action={change.action} before={before[change.path] ?? ''} after={change.content ?? ''} />
      ))}
      {changes.some((c) => c.action === 'modify' && !(c.path in before)) && (
        <p className="text-[12px] leading-[18px] text-ink-3">
          Files the builder changed without reading first are shown in full, as new content.
        </p>
      )}
    </section>
  )
}
