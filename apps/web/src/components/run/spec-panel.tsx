import { CRITIC_NAMES, type Critic } from '@/components/ui'

interface Item {
  id: string
  text: string
}

export function SpecPanel({
  items,
  markers,
  contested,
}: {
  items: Item[] | null
  markers: (id: string) => Critic[]
  contested: Set<string>
}) {
  return (
    <section aria-labelledby="spec-h" className="flex min-w-0 flex-col gap-4 rounded-[16px] bg-surface-1 p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="spec-h" className="text-title-2 font-semibold">
          Spec
        </h2>
        {items && <span className="font-mono text-[12px] text-ink-3">{items.length} items</span>}
      </div>
      {!items && (
        <div className="flex flex-col gap-2" aria-busy>
          {[92, 84, 88, 70].map((w) => (
            <span key={w} className="h-3.5 rounded-[6px] bg-surface-3" style={{ width: `${w}%` }} />
          ))}
          <p className="pt-2 text-[12px] text-ink-3">The planner is writing the spec from the files it read.</p>
        </div>
      )}
      {items && (
        <ol className="flex flex-col gap-1">
          {items.map((item) => {
            const who = markers(item.id)
            const hot = contested.has(item.id)
            return (
              <li
                key={item.id}
                className={`grid grid-cols-[28px_minmax(0,1fr)_auto] gap-3 rounded-[8px] px-3 py-2.5 ${hot ? 'bg-oxblood-wash' : who.length ? 'bg-surface-2' : ''}`}
              >
                <span className={`pt-0.5 font-mono text-[12px] ${hot ? 'text-oxblood-text' : 'text-ink-3'}`}>{item.id}</span>
                <span className={who.length ? 'text-ink' : 'text-ink-2'}>{item.text}</span>
                <span className="flex gap-1 pt-1.5">
                  {who.map((critic) => (
                    <span
                      key={critic}
                      title={`${CRITIC_NAMES[critic]} objects`}
                      className="size-2 rounded-full"
                      style={{ background: `var(--critic-${critic})` }}
                    >
                      <span className="sr-only">{CRITIC_NAMES[critic]} objects</span>
                    </span>
                  ))}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
