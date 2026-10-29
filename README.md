# PrismOS

One request in. One reviewed pull request out.

> Being remodelled. The plan is tracked in issues #1–#24; this README is rewritten in #24.

## Getting started

Requires Node 22 with pnpm, and Python 3.12+ with [uv](https://docs.astral.sh/uv/).

```bash
pnpm install              # web dependencies
cd apps/api && uv sync    # api dependencies
cd ../.. && pnpm dev      # web on :3000, api on :8000
```

| Path | What it is |
|---|---|
| `apps/web` | Next.js frontend |
| `apps/api/app` | FastAPI API, LangGraph pipeline and agents |
| `supabase/` | Migrations, seed (demo account) and local Supabase config |

`pnpm lint`, `pnpm typecheck` and `pnpm test` run across both apps. `pnpm db:start` then `pnpm db:reset` gives you a local Supabase with the schema and the demo account (`demo@prismos.dev` / `prismos-demo`).

## 🧠 Architecture & Agents

### System Flow

```mermaid
graph TD
    %% Frontend Layer
    Client[Next.js 14 Frontend]
    
    %% Backend Layer
    API[FastAPI Backend]
    Orchestrator[LangGraph Orchestration]
    
    %% Cloud & Infrastructure
    DB[(Supabase PostgreSQL)]
    LLM[Qwen Cloud / DashScope]
    Storage[Alibaba Cloud OSS]

    %% Connections
    Client <-->|SSE / REST API| API
    API -->|Triggers| Orchestrator
    API <-->|Reads/Writes| DB
    Orchestrator <-->|Prompting| LLM
    Orchestrator <-->|Save Packages| Storage
    Orchestrator <-->|Query Context| DB
```

PrismOS utilizes a suite of 7 specialized AI agents to take a feature request from concept to shippable code:

1. **Context Analyst**: Maps the existing product structure and constraints.
2. **PM Agent**: Drafts the Product Requirements Document (PRD).
3. **Architect**: Designs the system architecture and database schema.
4. **UI/UX Designer**: Produces the interface specifications and user flows.
5. **Engineer**: Writes the actual code implementation.
6. **QA**: Validates edge cases, performance, and security.
7. **Release Manager**: Resolves conflicts between agents and finalizes the package.

## 📁 Project Structure

```
prismos/
├── src/
│   ├── app/
│   │   ├── layout.tsx                       # Root layout, fonts, metadata
│   │   ├── globals.css                      # Global styles and tokens
│   │   ├── page.tsx                         # Landing page
│   │   ├── dashboard/page.tsx               # Command Center dashboard
│   │   ├── demo/page.tsx                    # Live streaming demo page
│   │   ├── projects/[projectId]/page.tsx    # Project memory and run history
│   │   ├── run/[sessionId]/page.tsx         # Live agent streaming view
│   │   └── settings/page.tsx                # System configuration
│   │
│   ├── components/
│   │   ├── landing/                         # Landing page components
│   │   ├── dashboard/                       # Dashboard UI components
│   │   ├── run/                             # Active run session panels
│   │   └── shared/                          # Reusable UI elements (Badges, Waitlist)
│   │
│   └── lib/
│       ├── api.ts                           # Backend API utility
│       ├── constants.ts                     # Configuration, agents, and pricing
│       ├── types.ts                         # Core TypeScript interfaces
│       └── useSessionToken.ts               # Anonymous session management
│
└── backend/
    ├── main.py                          # FastAPI entry point
    ├── config.py                        # Environment configurations
    ├── requirements.txt                 # Python dependencies
    ├── api/                             # FastAPI routers (runs, sessions, projects)
    ├── agents/                          # Specialized AI agent implementations
    ├── orchestration/                   # LangGraph orchestration workflows
    ├── db/                              # Supabase database integrations
    ├── storage/                         # OSS2 storage implementations
    └── memory/                          # Project memory management
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **AI Orchestration**: [LangGraph](https://langchain-ai.github.io/langgraph/) & [LangChain](https://python.langchain.com/)
- **Database**: [Supabase](https://supabase.com/)
- **Storage**: [Alibaba Cloud OSS](https://www.alibabacloud.com/product/oss)
- **Language**: [Python 3](https://www.python.org/)

## 🔗 Environment Variables

To connect PrismOS to a live backend, ensure you set the API base URL in your `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.your-backend.com/api/v1
```

If not provided, the app will fall back to its internal configuration or mock data where applicable.

## 📜 Notes

- **Hackathon Build**: Authentication is disabled. Anonymous sessions are managed via `localStorage` with `session_token`.
- **Backend Sync**: Live agent streaming relies on Server-Sent Events (SSE) via the `/runs/{id}/stream` endpoint.
