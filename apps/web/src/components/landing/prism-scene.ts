// The hero's light-and-prism scene, drawn on a canvas. A light source (the visitor's pointer, or an idle
// sweep) shines into a glass prism; three critic rays leave it and "light" a card when they land on it.
// Pure drawing: the React component owns the animation loop, the pointer and the lit state.

export interface Point {
  x: number
  y: number
}

export interface SceneInput {
  t: number // ms since start, drives the idle sweep and shimmer
  pointer: Point | null // where the visitor is aiming, in canvas pixels
  source: Point | null // the light's eased position from the previous frame
  light: boolean // light theme
  settled?: boolean // reduced motion: hold the light level, so every critic is lit
  colors: [string, string, string] // critic colours as hex
}

export interface SceneOutput {
  source: Point
  lit: [boolean, boolean, boolean]
}

type RGB = [number, number, number]

const hex = (value: string): RGB => {
  let x = value.replace('#', '').trim()
  if (x.length === 3) x = [...x].map((ch) => ch + ch).join('')
  const n = parseInt(x, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const rgb = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`
const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi)
const lerp = (a: Point, b: Point, k: number): Point => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k })

/** Card centres as fractions of the canvas height; the HTML cards are placed at the same spots. */
export const CARD_TOPS = [0.2, 0.5, 0.8] as const
export const CARD_LEFT = 0.62

export function drawScene(canvas: HTMLCanvasElement, input: SceneInput): SceneOutput | null {
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  const d = Math.min(window.devicePixelRatio || 1, 2)
  if (!w || !h) return null
  if (canvas.width !== Math.round(w * d) || canvas.height !== Math.round(h * d)) {
    canvas.width = Math.round(w * d)
    canvas.height = Math.round(h * d)
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.setTransform(d, 0, 0, d, 0, 0)
  ctx.clearRect(0, 0, w, h)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const { t, light } = input
  const glass = light ? '41,38,42' : '237,235,238'
  const additive: GlobalCompositeOperation = light ? 'source-over' : 'lighter'
  const cols = input.colors.map(hex) as [RGB, RGB, RGB]
  const white: RGB = light ? [41, 38, 42] : [237, 235, 238]
  const mix = (u: number): RGB => {
    const k = clamp(u, 0, 1) * 2
    const i = Math.min(1, Math.floor(k))
    const f = k - i
    return [0, 1, 2].map((j) => Math.round(cols[i][j] + (cols[i + 1][j] - cols[i][j]) * f)) as RGB
  }
  const line = (p: Point, q: Point, style: string, width: number) => {
    ctx.strokeStyle = style
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(q.x, q.y)
    ctx.stroke()
  }
  const face = (pts: Point[], fill: string | CanvasGradient) => {
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.fill()
  }
  const glow = (p: Point, r: number, c: RGB, a: number) => {
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
    g.addColorStop(0, rgb(c, a))
    g.addColorStop(1, rgb(c, 0))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // geometry: a prism on the left third, the critic cards from CARD_LEFT rightwards
  const s = Math.min(w * 0.3, h * 0.42)
  const cx = w * 0.3
  const cy = h * 0.5
  const A = { x: cx, y: cy - s * 0.58 }
  const B = { x: cx - s / 2, y: cy + s * 0.29 }
  const C = { x: cx + s / 2, y: cy + s * 0.29 }
  const back = (p: Point) => ({ x: p.x - s * 0.16, y: p.y - s * 0.1 })
  const [A2, B2, C2] = [back(A), back(B), back(C)]
  const entry = lerp(A, B, 0.55)
  const exit = lerp(A, C, 0.55)
  const cardX = w * CARD_LEFT
  const cardY = CARD_TOPS.map((f) => h * f)
  // the fan is sized so all three rays land on their cards when the light is level with the prism
  const sigma = Math.atan2(h * 0.3, cardX - exit.x)

  // the light follows the pointer, or sweeps slowly when nobody is aiming
  const resting = { x: entry.x - w * 0.42 - 40, y: entry.y }
  const target = input.settled
    ? resting
    : input.pointer
      ? { x: Math.min(input.pointer.x, entry.x - 48), y: input.pointer.y }
      : { x: resting.x, y: entry.y + Math.sin(t / 2600) * h * 0.42 }
  const S = input.source && !input.settled ? lerp(input.source, target, input.pointer ? 0.22 : 0.05) : target
  const theta = Math.atan2(entry.y - S.y, entry.x - S.x)
  const phi = clamp(theta * 0.9, -0.8, 0.8)
  const angles = [-1, 0, 1].map((k) => phi + k * sigma)
  const yAt = (angle: number) => exit.y + (cardX - exit.x) * Math.tan(angle)
  const lit = angles.map((a, i) => Math.abs(Math.cos(a)) > 0.2 && Math.abs(yAt(a) - cardY[i]) < 38) as SceneOutput['lit']

  // floor shadow
  const shadow = ctx.createRadialGradient(cx, C.y + 16, 4, cx, C.y + 16, s * 0.7)
  shadow.addColorStop(0, light ? 'rgba(41,38,42,0.16)' : 'rgba(0,0,0,0.55)')
  shadow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = shadow
  ctx.beginPath()
  ctx.ellipse(cx, C.y + 16, s * 0.7, s * 0.11, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalCompositeOperation = additive
  // the source and its beam into the prism
  glow(S, 34, white, light ? 0.25 : 0.55)
  glow(S, 6, white, 1)
  line(S, entry, `rgba(${glass},0.07)`, 16)
  line(S, entry, `rgba(${glass},0.18)`, 6)
  line(S, entry, `rgba(${glass},0.95)`, 2.4)

  // a faint full spectrum behind the three critic rays
  const far = (angle: number) => {
    const length = (w + 40 - exit.x) / Math.max(Math.cos(angle), 0.2)
    return { x: exit.x + length * Math.cos(angle), y: exit.y + length * Math.sin(angle) }
  }
  for (let i = 0; i < 20; i++) {
    const u = i / 19
    const angle = phi + (u - 0.5) * 2.5 * sigma
    line(exit, far(angle), rgb(mix(u), (light ? 0.22 : 0.12) * (0.8 + 0.2 * Math.sin(t / 700 + i))), 1.2)
  }

  // the critic rays stop at their card when they hit it
  angles.forEach((angle, i) => {
    const end = lit[i] ? { x: cardX - 4, y: yAt(angle) } : far(angle)
    line(exit, end, rgb(cols[i], 0.12), 10)
    line(exit, end, rgb(cols[i], 0.95), 2.6)
    if (lit[i]) glow(end, 26 * (1 + 0.15 * Math.sin(t / 300 + i)), cols[i], 0.7)
    for (let j = 0; j < 9; j++) {
      const k = (t / 2400 + j / 9 + i * 0.13) % 1
      const q = lerp(exit, end, k)
      const a = Math.sin(k * Math.PI)
      ctx.fillStyle = rgb(cols[i], 0.9 * a)
      ctx.beginPath()
      ctx.arc(q.x, q.y, 1.1 + 1.4 * a, 0, Math.PI * 2)
      ctx.fill()
    }
  })
  ctx.globalCompositeOperation = 'source-over'

  // the glass: back face, sides, front face
  face([A2, B2, C2], `rgba(${glass},0.04)`)
  face([A, A2, B2, B], `rgba(${glass},0.08)`)
  face([A, A2, C2, C], `rgba(${glass},0.05)`)
  const front = ctx.createLinearGradient(A.x, A.y, C.x, C.y)
  front.addColorStop(0, `rgba(${glass},0.24)`)
  front.addColorStop(0.55, `rgba(${glass},0.06)`)
  front.addColorStop(1, `rgba(${glass},0.15)`)
  face([A, B, C], front)

  // the light separating inside the glass
  ctx.globalCompositeOperation = additive
  cols.forEach((c, i) => line(entry, { x: exit.x, y: exit.y + (i - 1) * 6 }, rgb(c, 0.75), 1.6))
  ctx.globalCompositeOperation = 'source-over'

  // edges, brightest on the face the light hits
  line(A2, B2, `rgba(${glass},0.18)`, 1)
  line(B2, C2, `rgba(${glass},0.12)`, 1)
  line(A2, C2, `rgba(${glass},0.18)`, 1)
  line(A, A2, `rgba(${glass},0.45)`, 1.2)
  line(B, B2, `rgba(${glass},0.3)`, 1.2)
  line(C, C2, `rgba(${glass},0.3)`, 1.2)
  line(B, C, `rgba(${glass},0.5)`, 1.3)
  line(A, C, `rgba(${glass},0.55)`, 1.3)
  line(A, B, `rgba(${glass},0.95)`, 1.8)
  glow(entry, 16, white, light ? 0.4 : 0.8)

  return { source: S, lit }
}
