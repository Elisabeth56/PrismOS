# PrismOS Frontend

## Install

```bash
npx create-next-app@latest prismos --typescript --tailwind --app --src-dir
cd prismos
```

## Dependencies

```bash
npm install framer-motion lucide-react clsx
```

## Required font (add to layout.tsx head)

```bash
npm install @next/font
```

Uses: **Inter** (system) + **Syne** (display headings) via Google Fonts

Add to `src/app/layout.tsx`:
```tsx
import { Syne, Inter } from 'next/font/google'
const syne = Syne({ subsets: ['latin'], variable: '--font-syne', weight: ['700','800'] })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
```

## File map — FINAL (25 files)

```
prismos/
├── README.md
│
└── src/
    ├── app/
    │   ├── layout.tsx                       # root layout, fonts, metadata
    │   ├── globals.css                      # tokens, keyframes, utility classes
    │   ├── page.tsx                         # landing page (assembles all sections)
    │   └── dashboard/
    │       └── page.tsx                     # dashboard overview (assembles dashboard components)
    │
    ├── components/
    │   ├── landing/
    │   │   ├── Navbar.tsx                   # scroll-aware glass nav, mobile menu
    │   │   ├── HeroSection.tsx              # custom cinematic bg, canvas particles, planet arc
    │   │   ├── ProductShowcase.tsx          # glass shell, image/video placeholder
    │   │   ├── LogoStrip.tsx                # "trusted by" row
    │   │   ├── FeaturesSection.tsx          # Usage/Tech/Data tabs, scroll slide-in cards
    │   │   ├── AgentsSection.tsx            # 7-agent grid, color-coded by AGENT_CONFIG
    │   │   ├── KickstartSection.tsx         # 3-step stagger reveal, custom mini-visuals
    │   │   ├── BenchmarkSection.tsx         # Mode A vs Mode B table
    │   │   ├── PricingSection.tsx           # monthly/yearly toggle, 3 tiers
    │   │   ├── FinalCTASection.tsx          # mini-hero bg + oversized PrismOS wordmark
    │   │   └── Footer.tsx                   # 4-column link footer
    │   │
    │   ├── dashboard/
    │   │   ├── Topbar.tsx                   # logo, search, "agents online" pulse, avatar
    │   │   ├── Sidebar.tsx                  # active project card, nav, new run CTA
    │   │   ├── StatsGrid.tsx                # 4 metric cards, staggered entrance
    │   │   ├── ProjectMemoryCard.tsx        # collapsible memory entries, type-coded chips
    │   │   └── SessionsTable.tsx            # run history, verdict badges, click → run view
    │   │
    │   └── shared/
    │       ├── WaitlistModal.tsx            # email capture, used by every landing CTA
    │       ├── AgentBadge.tsx               # colored agent identity chip (dot + label)
    │       └── VerdictBadge.tsx             # SHIPPABLE / NEEDS_REVISION / RUNNING pill
    │
    └── lib/
        ├── types.ts                         # Session, MemoryEntry, Project, SSEEvent, etc.
        └── constants.ts                     # AGENT_CONFIG, PRICING_TIERS, WORKFLOW_STEPS, NAV_LINKS
```

## Nothing deleted
This is a net-new `prismos/` folder. Drop it into your existing Next.js project root — it does not touch or restructure anything already in your codebase. Your backend engineer can treat `src/lib/types.ts` as the frontend's expected shape for SSE events and session data.

## Still to build (next rounds, not assumed)
- `/run/new` — context input + feature request form (2-step)
- `/run/[sessionId]` — live agent streaming view (7 panels + conflict log + final package)
- `/run/[sessionId]/benchmark` — full benchmark detail page
- `/projects` and `/projects/[projectId]` — project list + memory viewer
- Real SSE wiring in place of the `console.log` stubs in `dashboard/page.tsx`

## Notes
- No auth required (hackathon build)
- Anonymous sessions via localStorage `session_token` (not yet wired — add a `useSessionToken` hook when backend is ready)
- All pricing/hero/final CTAs open the same `WaitlistModal` instance, lifted to page-level state
- Backend SSE endpoint target: `NEXT_PUBLIC_API_BASE_URL/runs/{id}/stream`
- `ProductShowcase.tsx` placeholder grid and `SessionsTable.tsx` / `ProjectMemoryCard.tsx` mock arrays are clearly marked — swap for real data/API calls when backend is live
