export type Critic = 'architect' | 'security' | 'ux'

export const CRITIC_NAMES: Record<Critic, string> = { architect: 'Architect', security: 'Security', ux: 'UX' }

/** The critic colours always appear next to the critic's name, never alone. */
export function CriticRow({
  critic,
  state,
  count,
  active = false,
}: {
  critic: Critic
  state: string
  count?: number
  active?: boolean
}) {
  return (
    <div className={`px-critic px-critic--${critic}${active ? ' px-critic--active' : ''}`} aria-busy={active}>
      <span className="px-critic-dot" aria-hidden />
      <div>
        <div className="px-critic-name">{CRITIC_NAMES[critic]}</div>
        <div className="px-critic-state">{state}</div>
      </div>
      <span className="px-critic-count">{count ?? '–'}</span>
    </div>
  )
}
