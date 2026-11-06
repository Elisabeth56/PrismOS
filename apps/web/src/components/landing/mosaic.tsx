'use client'

import { useEffect, useState } from 'react'

import { useInView, useReducedMotion } from './hooks'

const COLS = 6
const ROWS = 4
const COLORS = ['var(--critic-architect)', 'var(--critic-security)', 'var(--critic-ux)', 'var(--oxblood)', 'var(--action)', 'var(--success)']
const START = [2, 7, 16, 9, 18, 23]

interface Tile {
  cell: number
  round: boolean
}

/** One tile hops to a free neighbouring cell at a time: the run's colours moving through your repo. */
export function nextTiles(tiles: Tile[], tick: number): Tile[] {
  const next = tiles.map((t) => ({ ...t }))
  const i = tick % next.length
  const col = next[i].cell % COLS
  const row = Math.floor(next[i].cell / COLS)
  const taken = new Set(next.map((t) => t.cell))
  const options = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
    .map(([dc, dr]) => [col + dc, row + dr])
    .filter(([c, r]) => c >= 0 && c < COLS && r >= 0 && r < ROWS)
    .map(([c, r]) => r * COLS + c)
    .filter((cell) => !taken.has(cell))
  if (options.length) {
    next[i].cell = options[(tick * 7) % options.length]
    next[i].round = !next[i].round
  }
  return next
}

const at = (n: number, count: number, gaps: number) => `calc((100% - ${gaps}px) / ${count} * ${n} + ${n * 8}px)`

export function Mosaic() {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>()
  const [tiles, setTiles] = useState<Tile[]>(START.map((cell, i) => ({ cell, round: i % 2 === 1 })))

  useEffect(() => {
    if (reduced || !inView) return
    let tick = 0
    const id = setInterval(() => setTiles((current) => nextTiles(current, ++tick)), 900)
    return () => clearInterval(id)
  }, [reduced, inView])

  return (
    <div ref={ref} aria-hidden className="relative aspect-[3/2] min-w-0 flex-[1_1_420px]">
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-2">
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <span key={i} className={`rounded-[14px] ${(i + Math.floor(i / COLS)) % 2 ? 'bg-surface-2' : 'bg-surface-1'}`} />
        ))}
      </div>
      {tiles.map((tile, i) => (
        <span
          key={i}
          className="lp-tile absolute"
          style={{
            left: at(tile.cell % COLS, COLS, 40),
            top: at(Math.floor(tile.cell / COLS), ROWS, 24),
            width: 'calc((100% - 40px) / 6)',
            height: 'calc((100% - 24px) / 4)',
            borderRadius: tile.round ? '50%' : 14,
            background: COLORS[i],
            transform: tile.round ? 'scale(0.86)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  )
}
