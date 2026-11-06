import { CRITIC_NAMES, type Critic } from './critic'

export interface Position {
  critic: Critic
  text: string
}

export function ConflictCard({
  title,
  itemId,
  kind,
  positions,
  decision,
}: {
  title: string
  itemId: string
  kind: 'contested' | 'blocking'
  positions: Position[]
  decision?: string | null
}) {
  return (
    <article className="px-conflict">
      <div className="px-conflict-head">
        <h3 className="px-conflict-title">{title}</h3>
        <span className="px-conflict-ref">
          spec item {itemId}
          {kind === 'blocking' && ' · blocking'}
        </span>
      </div>
      <div className="px-positions">
        {positions.map((p, i) => (
          <div key={i} className="px-position" style={{ '--c': `var(--critic-${p.critic})` } as React.CSSProperties}>
            <div className="px-position-who">{CRITIC_NAMES[p.critic]}</div>
            <p>{p.text}</p>
          </div>
        ))}
      </div>
      {decision ? (
        <div className="px-decision">
          <div className="px-decision-label">Decision</div>
          <p>{decision}</p>
        </div>
      ) : (
        <div className="px-decision">
          <div className="px-decision-label">Waiting for the resolver</div>
        </div>
      )}
    </article>
  )
}
