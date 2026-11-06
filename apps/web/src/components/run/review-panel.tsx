import { CriticRow } from '@/components/ui'
import { criticState, CRITICS, type runView } from '@/lib/run-view'

type View = ReturnType<typeof runView>

export function ReviewPanel({ view, live, conflicts }: { view: View; live: boolean; conflicts: number }) {
  const reviewing = live && view.rail[2].state === 'active'
  return (
    <section aria-labelledby="panel-h" className="flex min-w-0 flex-col gap-3" aria-live="polite">
      <h2 id="panel-h" className="mb-1 text-title-2 font-semibold">
        Review panel
      </h2>
      {CRITICS.map((critic) => {
        const { state, count } = criticState(view.reviews[critic], reviewing)
        return <CriticRow key={critic} critic={critic} state={state} count={count} active={reviewing && !view.reviews[critic]} />
      })}
      <p className="mt-1 text-[12px] leading-[18px] text-ink-3">
        {view.rail[2].state === 'done'
          ? conflicts
            ? `${conflicts} conflict${conflicts > 1 ? 's' : ''} for the resolver. Everything else is a note the builder applies.`
            : 'No conflicts. The builder applies the notes as written.'
          : 'Conflicts appear here when all three critics finish. You can leave this page; the run keeps going.'}
      </p>
    </section>
  )
}
